/**
 * Apify Webhook Handler
 * Processes webhook events from Apify for completed/failed actor runs
 */

import { headers } from 'next/headers';
import { createHmac } from 'crypto';
import {
  ApifyWebhookEvent,
  ActorRunStatus,
  WebhookPayload,
  WebhookHandlerConfig,
  ApifyActorRun,
} from '@/types/apify';
import { handleRunCompletion } from './executor';
import { redis } from '@/server/redis-client';

// ============================================================================
// Configuration
// ============================================================================

const WEBHOOK_SECRET = process.env.APIFY_WEBHOOK_SECRET;
const WEBHOOK_LOG_PREFIX = 'apify:webhook:';
const PROCESSED_EVENTS_KEY = 'apify:webhook:processed';

// Allowed Apify IP ranges (update as needed)
const ALLOWED_APIFY_IPS = [
  '18.208.96.0/21',
  '3.213.168.0/21',
  // Add more as needed
];

const DEFAULT_CONFIG: WebhookHandlerConfig = {
  retryAttempts: 3,
  timeoutMs: 30000,
};

// ============================================================================
// Event Processing
// ============================================================================

interface WebhookProcessingResult {
  success: boolean;
  eventId: string;
  runId: string;
  status: ActorRunStatus;
  error?: string;
  processedAt: string;
}

/**
 * Process an incoming Apify webhook event
 */
export async function processWebhookEvent(
  payload: WebhookPayload,
  config: Partial<WebhookHandlerConfig> = {}
): Promise<WebhookProcessingResult> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const eventId = payload.eventId || generateEventId();
  const { eventData, eventType, resource } = payload.data;

  const result: WebhookProcessingResult = {
    success: false,
    eventId,
    runId: eventData.actorRunId,
    status: resource.status,
    processedAt: new Date().toISOString(),
  };

  try {
    // Check for duplicate events
    if (await isDuplicateEvent(eventId)) {
      return {
        ...result,
        success: true,
        error: 'Duplicate event - already processed',
      };
    }

    // Validate event type
    if (!isValidEventType(eventType)) {
      throw new Error(`Invalid event type: ${eventType}`);
    }

    // Process based on event type
    switch (eventType) {
      case 'ACTOR.RUN.SUCCEEDED':
        await handleSuccessfulRun(resource);
        break;

      case 'ACTOR.RUN.FAILED':
        await handleFailedRun(resource);
        break;

      case 'ACTOR.RUN.TIMED_OUT':
        await handleTimedOutRun(resource);
        break;

      case 'ACTOR.RUN.ABORTED':
        await handleAbortedRun(resource);
        break;

      default:
        throw new Error(`Unhandled event type: ${eventType}`);
    }

    // Mark event as processed
    await markEventProcessed(eventId);

    // Log successful processing
    await logWebhookEvent(eventId, payload, result);

    result.success = true;
    return result;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.error = errorMessage;

    // Log failed processing
    await logWebhookEvent(eventId, payload, result);

    // Store for retry if needed
    if (mergedConfig.retryAttempts > 0) {
      await scheduleRetry(eventId, payload, mergedConfig.retryAttempts);
    }

    return result;
  }
}

/**
 * Handle a successful actor run
 */
async function handleSuccessfulRun(run: ApifyActorRun): Promise<void> {
  // Update executor with results
  await handleRunCompletion(run.id, 'SUCCEEDED');

  // Additional processing can be added here
  // e.g., notifications, analytics, data export
}

/**
 * Handle a failed actor run
 */
async function handleFailedRun(run: ApifyActorRun): Promise<void> {
  await handleRunCompletion(run.id, 'FAILED');

  // Log failure for analysis
  await logRunFailure(run);
}

/**
 * Handle a timed-out actor run
 */
async function handleTimedOutRun(run: ApifyActorRun): Promise<void> {
  await handleRunCompletion(run.id, 'TIMED_OUT');

  // Log timeout for potential retry configuration adjustment
  await logRunTimeout(run);
}

/**
 * Handle an aborted actor run
 */
async function handleAbortedRun(run: ApifyActorRun): Promise<void> {
  await handleRunCompletion(run.id, 'ABORTED');

  // Check if manual abort or system abort
  if (run.statusMessage?.includes('user')) {
    // Manual abort - no action needed
  } else {
    // System abort - log for investigation
    await logRunAbort(run);
  }
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate webhook signature
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string = WEBHOOK_SECRET || ''
): boolean {
  if (!secret) {
    console.warn('Webhook secret not configured, skipping signature validation');
    return true;
  }

  const expectedSignature = createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Use timing-safe comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

/**
 * Validate request origin
 */
export async function validateRequestOrigin(
  requestIp?: string
): Promise<{ valid: boolean; reason?: string }> {
  // If no IP provided, skip validation (relies on signature instead)
  if (!requestIp) {
    return { valid: true };
  }

  // Check against allowed IPs
  for (const allowedIp of ALLOWED_APIFY_IPS) {
    if (isIpInRange(requestIp, allowedIp)) {
      return { valid: true };
    }
  }

  return {
    valid: false,
    reason: `IP ${requestIp} not in allowed ranges`,
  };
}

/**
 * Validate webhook payload structure
 */
export function validatePayload(payload: unknown): payload is WebhookPayload {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  const p = payload as Partial<WebhookPayload>;

  // Check required fields
  if (!p.eventId || typeof p.eventId !== 'string') {
    return false;
  }

  if (!p.eventType || typeof p.eventType !== 'string') {
    return false;
  }

  if (!p.timestamp || typeof p.timestamp !== 'string') {
    return false;
  }

  if (!p.data || typeof p.data !== 'object') {
    return false;
  }

  const data = p.data as Partial<ApifyWebhookEvent>;
  if (!data.eventType || !data.eventData || !data.resource) {
    return false;
  }

  return true;
}

// ============================================================================
// Duplicate Detection
// ============================================================================

/**
 * Check if an event has already been processed
 */
async function isDuplicateEvent(eventId: string): Promise<boolean> {
  const exists = await redis.sismember(PROCESSED_EVENTS_KEY, eventId);
  return exists === 1;
}

/**
 * Mark an event as processed
 */
async function markEventProcessed(eventId: string): Promise<void> {
  await redis.sadd(PROCESSED_EVENTS_KEY, eventId);
  // Keep processed events for 24 hours for deduplication
  await redis.expire(PROCESSED_EVENTS_KEY, 24 * 60 * 60);
}

// ============================================================================
// Retry Logic
// ============================================================================

interface RetryEntry {
  eventId: string;
  payload: WebhookPayload;
  attempts: number;
  maxAttempts: number;
  scheduledAt: string;
}

/**
 * Schedule a retry for failed webhook processing
 */
async function scheduleRetry(
  eventId: string,
  payload: WebhookPayload,
  remainingAttempts: number
): Promise<void> {
  const retryEntry: RetryEntry = {
    eventId,
    payload,
    attempts: 0,
    maxAttempts: remainingAttempts,
    scheduledAt: new Date().toISOString(),
  };

  const key = `${WEBHOOK_LOG_PREFIX}retry:${eventId}`;
  await redis.setex(key, 3600, JSON.stringify(retryEntry)); // 1 hour TTL

  // In production, this would enqueue to a job queue (e.g., Bull, SQS)
  // For now, we log the retry need
  console.log(`Retry scheduled for event ${eventId}, ${remainingAttempts} attempts remaining`);
}

/**
 * Process pending retries (called by a scheduled job)
 */
export async function processRetries(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const pattern = `${WEBHOOK_LOG_PREFIX}retry:*`;
  const keys = await redis.keys(pattern);

  const results = {
    processed: 0,
    succeeded: 0,
    failed: 0,
  };

  for (const key of keys) {
    const data = await redis.get(key);
    if (!data) continue;

    const entry = JSON.parse(data) as RetryEntry;
    results.processed++;

    try {
      const result = await processWebhookEvent(entry.payload);

      if (result.success) {
        results.succeeded++;
        await redis.del(key);
      } else if (entry.attempts >= entry.maxAttempts) {
        results.failed++;
        await redis.del(key);
        // Log permanent failure
        await logPermanentFailure(entry.eventId, entry.payload, result.error);
      } else {
        // Update retry count
        entry.attempts++;
        await redis.setex(key, 3600, JSON.stringify(entry));
      }
    } catch (error) {
      entry.attempts++;
      if (entry.attempts >= entry.maxAttempts) {
        results.failed++;
        await redis.del(key);
      } else {
        await redis.setex(key, 3600, JSON.stringify(entry));
      }
    }
  }

  return results;
}

// ============================================================================
// Logging
// ============================================================================

/**
 * Log webhook event processing
 */
async function logWebhookEvent(
  eventId: string,
  payload: WebhookPayload,
  result: WebhookProcessingResult
): Promise<void> {
  const logEntry = {
    eventId,
    timestamp: new Date().toISOString(),
    payload,
    result,
  };

  const key = `${WEBHOOK_LOG_PREFIX}${eventId}`;
  await redis.setex(key, 7 * 24 * 60 * 60, JSON.stringify(logEntry)); // 7 days TTL
}

/**
 * Log run failure for analysis
 */
async function logRunFailure(run: ApifyActorRun): Promise<void> {
  const failureLog = {
    runId: run.id,
    actorId: run.actId,
    status: run.status,
    statusMessage: run.statusMessage,
    stats: run.stats,
    timestamp: new Date().toISOString(),
  };

  const key = `apify:failures:${run.actId}:${new Date().toISOString().split('T')[0]}`;
  await redis.lpush(key, JSON.stringify(failureLog));
  await redis.ltrim(key, 0, 999); // Keep last 1000 failures per actor per day
  await redis.expire(key, 30 * 24 * 60 * 60); // 30 days TTL
}

/**
 * Log run timeout
 */
async function logRunTimeout(run: ApifyActorRun): Promise<void> {
  const timeoutLog = {
    runId: run.id,
    actorId: run.actId,
    timeout: run.options.timeoutSecs,
    duration: run.stats.durationMillis,
    timestamp: new Date().toISOString(),
  };

  const key = `apify:timeouts:${new Date().toISOString().split('T')[0]}`;
  await redis.lpush(key, JSON.stringify(timeoutLog));
  await redis.ltrim(key, 0, 999);
  await redis.expire(key, 30 * 24 * 60 * 60);
}

/**
 * Log run abort
 */
async function logRunAbort(run: ApifyActorRun): Promise<void> {
  const abortLog = {
    runId: run.id,
    actorId: run.actId,
    statusMessage: run.statusMessage,
    timestamp: new Date().toISOString(),
  };

  const key = `apify:aborts:${new Date().toISOString().split('T')[0]}`;
  await redis.lpush(key, JSON.stringify(abortLog));
  await redis.expire(key, 7 * 24 * 60 * 60);
}

/**
 * Log permanent webhook failure
 */
async function logPermanentFailure(
  eventId: string,
  payload: WebhookPayload,
  error?: string
): Promise<void> {
  const failureLog = {
    eventId,
    payload,
    error,
    timestamp: new Date().toISOString(),
  };

  const key = `apify:webhook:permanent-failures`;
  await redis.lpush(key, JSON.stringify(failureLog));
  await redis.ltrim(key, 0, 999);
  await redis.expire(key, 90 * 24 * 60 * 60); // 90 days TTL
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function isValidEventType(type: string): type is ApifyWebhookEvent['eventType'] {
  return [
    'ACTOR.RUN.SUCCEEDED',
    'ACTOR.RUN.FAILED',
    'ACTOR.RUN.TIMED_OUT',
    'ACTOR.RUN.ABORTED',
  ].includes(type);
}

function isIpInRange(ip: string, range: string): boolean {
  // Simple CIDR check - in production, use a proper library like 'ip-range-check'
  const [rangeIp, mask] = range.split('/');
  const maskBits = parseInt(mask, 10);

  const ipLong = ipToLong(ip);
  const rangeLong = ipToLong(rangeIp);
  const maskLong = -1 << (32 - maskBits);

  return (ipLong & maskLong) === (rangeLong & maskLong);
}

function ipToLong(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Get webhook processing statistics
 */
export async function getWebhookStats(
  days: number = 7
): Promise<{
  totalEvents: number;
  succeeded: number;
  failed: number;
  retries: number;
  byEventType: Record<string, number>;
}> {
  const stats = {
    totalEvents: 0,
    succeeded: 0,
    failed: 0,
    retries: 0,
    byEventType: {} as Record<string, number>,
  };

  const pattern = `${WEBHOOK_LOG_PREFIX}*`;
  const keys = await redis.keys(pattern);

  for (const key of keys) {
    if (key.includes('retry')) {
      stats.retries++;
      continue;
    }

    const data = await redis.get(key);
    if (data) {
      const entry = JSON.parse(data) as { result: WebhookProcessingResult; payload: WebhookPayload };
      stats.totalEvents++;

      if (entry.result.success) {
        stats.succeeded++;
      } else {
        stats.failed++;
      }

      const eventType = entry.payload.data.eventType;
      stats.byEventType[eventType] = (stats.byEventType[eventType] || 0) + 1;
    }
  }

  return stats;
}

/**
 * Get recent webhook events
 */
export async function getRecentEvents(
  limit: number = 50,
  status?: 'success' | 'failed'
): Promise<WebhookProcessingResult[]> {
  const pattern = `${WEBHOOK_LOG_PREFIX}*`;
  const keys = await redis.keys(pattern);

  const events: Array<{ timestamp: string; result: WebhookProcessingResult }> = [];

  for (const key of keys) {
    if (key.includes('retry')) continue;

    const data = await redis.get(key);
    if (data) {
      const entry = JSON.parse(data) as {
        timestamp: string;
        result: WebhookProcessingResult;
      };

      if (!status || (status === 'success' && entry.result.success) || (status === 'failed' && !entry.result.success)) {
        events.push(entry);
      }
    }
  }

  // Sort by timestamp desc
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return events.slice(0, limit).map(e => e.result);
}
