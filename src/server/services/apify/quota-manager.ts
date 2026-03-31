/**
 * Apify Quota Manager
 * Tracks usage per workspace and enforces tier limits
 */

import { redis } from '@/server/redis-client';
import {
  TierType,
  ActorId,
  QuotaInfo,
  QuotaUsageEntry,
  WorkspaceUsage,
  RateLimitConfig,
} from '@/types/apify';
import { TIER_LIMITS, getTierLimit, getRateLimitConfig } from './actors';

// ============================================================================
// Configuration
// ============================================================================

const QUOTA_PREFIX = 'apify:quota:';
const USAGE_PREFIX = 'apify:usage:';
const RATE_LIMIT_PREFIX = 'apify:ratelimit:';

// Default month reset (1st of each month)
const getMonthResetDate = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
};

// ============================================================================
// Quota Management
// ============================================================================

/**
 * Get or initialize quota info for a workspace
 */
export async function getQuotaInfo(workspaceId: string): Promise<QuotaInfo> {
  const key = `${QUOTA_PREFIX}${workspaceId}`;
  const data = await redis.get(key);

  if (data) {
    return JSON.parse(data) as QuotaInfo;
  }

  // Initialize with default tier
  const tier = await getWorkspaceTier(workspaceId);
  const quotaInfo: QuotaInfo = {
    workspaceId,
    tier,
    limit: TIER_LIMITS[tier],
    used: 0,
    remaining: TIER_LIMITS[tier],
    resetsAt: getMonthResetDate(),
    usageHistory: [],
  };

  await redis.setex(key, 30 * 24 * 60 * 60, JSON.stringify(quotaInfo)); // 30 days TTL
  return quotaInfo;
}

/**
 * Update workspace tier
 */
export async function updateWorkspaceTier(
  workspaceId: string,
  newTier: TierType
): Promise<QuotaInfo> {
  const key = `${QUOTA_PREFIX}${workspaceId}`;
  const currentQuota = await getQuotaInfo(workspaceId);

  // Calculate new limit
  const newLimit = TIER_LIMITS[newTier];

  const updatedQuota: QuotaInfo = {
    ...currentQuota,
    tier: newTier,
    limit: newLimit,
    remaining: Math.max(0, newLimit - currentQuota.used),
  };

  await redis.setex(key, 30 * 24 * 60 * 60, JSON.stringify(updatedQuota));
  return updatedQuota;
}

/**
 * Check quota before executing a job
 */
export async function checkQuota(
  workspaceId: string,
  tier?: TierType
): Promise<{
  allowed: boolean;
  limit: number;
  used: number;
  remaining: number;
  resetsAt: Date;
}> {
  const quota = await getQuotaInfo(workspaceId);
  
  // Check if month has reset
  if (new Date() >= new Date(quota.resetsAt)) {
    // Reset quota
    const newTier = tier || quota.tier;
    const newQuota: QuotaInfo = {
      ...quota,
      tier: newTier,
      limit: TIER_LIMITS[newTier],
      used: 0,
      remaining: TIER_LIMITS[newTier],
      resetsAt: getMonthResetDate(),
      usageHistory: [],
    };
    
    await redis.setex(
      `${QUOTA_PREFIX}${workspaceId}`,
      30 * 24 * 60 * 60,
      JSON.stringify(newQuota)
    );
    
    return {
      allowed: true,
      limit: newQuota.limit,
      used: 0,
      remaining: newQuota.limit,
      resetsAt: newQuota.resetsAt,
    };
  }

  return {
    allowed: quota.remaining > 0,
    limit: quota.limit,
    used: quota.used,
    remaining: quota.remaining,
    resetsAt: quota.resetsAt,
  };
}

/**
 * Increment usage for a workspace
 */
export async function incrementUsage(
  workspaceId: string,
  actorId: ActorId,
  jobId: string,
  count: number = 1
): Promise<QuotaInfo> {
  const key = `${QUOTA_PREFIX}${workspaceId}`;
  const quota = await getQuotaInfo(workspaceId);

  const newEntry: QuotaUsageEntry = {
    date: new Date().toISOString(),
    count,
    actorId,
    jobId,
  };

  const updatedQuota: QuotaInfo = {
    ...quota,
    used: quota.used + count,
    remaining: Math.max(0, quota.remaining - count),
    usageHistory: [newEntry, ...quota.usageHistory].slice(0, 1000), // Keep last 1000 entries
  };

  await redis.setex(key, 30 * 24 * 60 * 60, JSON.stringify(updatedQuota));

  // Also track in monthly usage record
  await trackMonthlyUsage(workspaceId, actorId, count);

  return updatedQuota;
}

/**
 * Decrement usage (for refunds/cancellations)
 */
export async function decrementUsage(
  workspaceId: string,
  count: number = 1
): Promise<QuotaInfo> {
  const key = `${QUOTA_PREFIX}${workspaceId}`;
  const quota = await getQuotaInfo(workspaceId);

  const updatedQuota: QuotaInfo = {
    ...quota,
    used: Math.max(0, quota.used - count),
    remaining: Math.min(quota.limit, quota.remaining + count),
  };

  await redis.setex(key, 30 * 24 * 60 * 60, JSON.stringify(updatedQuota));
  return updatedQuota;
}

/**
 * Reset quota for a workspace (admin function)
 */
export async function resetQuota(
  workspaceId: string,
  newTier?: TierType
): Promise<QuotaInfo> {
  const tier = newTier || (await getWorkspaceTier(workspaceId));
  const quota: QuotaInfo = {
    workspaceId,
    tier,
    limit: TIER_LIMITS[tier],
    used: 0,
    remaining: TIER_LIMITS[tier],
    resetsAt: getMonthResetDate(),
    usageHistory: [],
  };

  await redis.setex(
    `${QUOTA_PREFIX}${workspaceId}`,
    30 * 24 * 60 * 60,
    JSON.stringify(quota)
  );
  return quota;
}

// ============================================================================
// Rate Limiting
// ============================================================================

interface RateLimitState {
  requests: number;
  windowStart: number;
}

/**
 * Check if a job can be executed under rate limits
 */
export async function canExecuteJob(
  workspaceId: string,
  tier: TierType
): Promise<{
  allowed: boolean;
  reason?: string;
  retryAfterMs?: number;
}> {
  const config = getRateLimitConfig(tier);
  const now = Date.now();

  // Check concurrent runs
  const activeKey = `apify:active-jobs`;
  const activeCount = await redis.scard(activeKey);
  if (activeCount >= config.maxConcurrentRuns) {
    return {
      allowed: false,
      reason: `Max concurrent runs (${config.maxConcurrentRuns}) reached`,
      retryAfterMs: config.cooldownMs,
    };
  }

  // Check per-second rate limit
  const secondKey = `${RATE_LIMIT_PREFIX}${workspaceId}:second`;
  const secondData = await redis.get(secondKey);
  const secondState: RateLimitState = secondData
    ? JSON.parse(secondData)
    : { requests: 0, windowStart: now };

  // Reset if window has passed
  if (now - secondState.windowStart >= 1000) {
    secondState.requests = 0;
    secondState.windowStart = now;
  }

  if (secondState.requests >= config.requestsPerSecond) {
    return {
      allowed: false,
      reason: `Per-second rate limit (${config.requestsPerSecond}) exceeded`,
      retryAfterMs: 1000 - (now - secondState.windowStart),
    };
  }

  // Check per-minute rate limit
  const minuteKey = `${RATE_LIMIT_PREFIX}${workspaceId}:minute`;
  const minuteData = await redis.get(minuteKey);
  const minuteState: RateLimitState = minuteData
    ? JSON.parse(minuteData)
    : { requests: 0, windowStart: now };

  // Reset if window has passed
  if (now - minuteState.windowStart >= 60000) {
    minuteState.requests = 0;
    minuteState.windowStart = now;
  }

  if (minuteState.requests >= config.requestsPerMinute) {
    return {
      allowed: false,
      reason: `Per-minute rate limit (${config.requestsPerMinute}) exceeded`,
      retryAfterMs: 60000 - (now - minuteState.windowStart),
    };
  }

  // Update rate limit counters
  secondState.requests++;
  minuteState.requests++;

  await redis.setex(secondKey, 2, JSON.stringify(secondState));
  await redis.setex(minuteKey, 62, JSON.stringify(minuteState));

  return { allowed: true };
}

/**
 * Get current rate limit status
 */
export async function getRateLimitStatus(
  workspaceId: string,
  tier: TierType
): Promise<{
  perSecond: { limit: number; current: number; remaining: number };
  perMinute: { limit: number; current: number; remaining: number };
  concurrent: { limit: number; current: number; remaining: number };
}> {
  const config = getRateLimitConfig(tier);
  const now = Date.now();

  const [secondData, minuteData, activeCount] = await Promise.all([
    redis.get(`${RATE_LIMIT_PREFIX}${workspaceId}:second`),
    redis.get(`${RATE_LIMIT_PREFIX}${workspaceId}:minute`),
    redis.scard('apify:active-jobs'),
  ]);

  const secondState: RateLimitState = secondData
    ? JSON.parse(secondData)
    : { requests: 0, windowStart: now };
  const minuteState: RateLimitState = minuteData
    ? JSON.parse(minuteData)
    : { requests: 0, windowStart: now };

  return {
    perSecond: {
      limit: config.requestsPerSecond,
      current: secondState.requests,
      remaining: Math.max(0, config.requestsPerSecond - secondState.requests),
    },
    perMinute: {
      limit: config.requestsPerMinute,
      current: minuteState.requests,
      remaining: Math.max(0, config.requestsPerMinute - minuteState.requests),
    },
    concurrent: {
      limit: config.maxConcurrentRuns,
      current: activeCount,
      remaining: Math.max(0, config.maxConcurrentRuns - activeCount),
    },
  };
}

// ============================================================================
// Usage Tracking
// ============================================================================

/**
 * Track monthly usage by actor and type
 */
async function trackMonthlyUsage(
  workspaceId: string,
  actorId: ActorId,
  count: number
): Promise<void> {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const key = `${USAGE_PREFIX}${workspaceId}:${monthKey}`;

  const existing = await redis.get(key);
  const usage: WorkspaceUsage = existing
    ? JSON.parse(existing)
    : {
        workspaceId,
        month: monthKey,
        totalScrapes: 0,
        byActor: {} as Record<ActorId, number>,
        byType: {} as Record<string, number>,
      };

  usage.totalScrapes += count;
  usage.byActor[actorId] = (usage.byActor[actorId] || 0) + count;

  await redis.setex(key, 90 * 24 * 60 * 60, JSON.stringify(usage)); // 90 days TTL
}

/**
 * Get monthly usage for a workspace
 */
export async function getMonthlyUsage(
  workspaceId: string,
  yearMonth?: string
): Promise<WorkspaceUsage> {
  const now = new Date();
  const monthKey = yearMonth || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const key = `${USAGE_PREFIX}${workspaceId}:${monthKey}`;

  const data = await redis.get(key);
  if (data) {
    return JSON.parse(data) as WorkspaceUsage;
  }

  return {
    workspaceId,
    month: monthKey,
    totalScrapes: 0,
    byActor: {} as Record<ActorId, number>,
    byType: {} as Record<string, number>,
  };
}

/**
 * Get usage history for a workspace
 */
export async function getUsageHistory(
  workspaceId: string,
  months: number = 3
): Promise<WorkspaceUsage[]> {
  const results: WorkspaceUsage[] = [];
  const now = new Date();

  for (let i = 0; i < months; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const usage = await getMonthlyUsage(workspaceId, monthKey);
    results.push(usage);
  }

  return results;
}

/**
 * Get usage statistics across all workspaces
 */
export async function getGlobalUsageStats(
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalScrapes: number;
  byTier: Record<TierType, number>;
  byActor: Record<ActorId, number>;
  topWorkspaces: Array<{ workspaceId: string; scrapes: number }>;
}> {
  const pattern = `${USAGE_PREFIX}*`;
  const keys = await redis.keys(pattern);

  const stats = {
    totalScrapes: 0,
    byTier: { FREE: 0, PRO: 0, AGENCY: 0, ENTERPRISE: 0 },
    byActor: {} as Record<ActorId, number>,
    workspaceScrapes: {} as Record<string, number>,
  };

  for (const key of keys) {
    const data = await redis.get(key);
    if (data) {
      const usage = JSON.parse(data) as WorkspaceUsage;
      stats.totalScrapes += usage.totalScrapes;
      stats.workspaceScrapes[usage.workspaceId] =
        (stats.workspaceScrapes[usage.workspaceId] || 0) + usage.totalScrapes;

      // Aggregate by actor
      for (const [actorId, count] of Object.entries(usage.byActor)) {
        stats.byActor[actorId as ActorId] =
          (stats.byActor[actorId as ActorId] || 0) + count;
      }
    }
  }

  // Get tier distribution from quota info
  const quotaKeys = await redis.keys(`${QUOTA_PREFIX}*`);
  for (const key of quotaKeys) {
    const data = await redis.get(key);
    if (data) {
      const quota = JSON.parse(data) as QuotaInfo;
      stats.byTier[quota.tier] += quota.used;
    }
  }

  // Get top workspaces
  const topWorkspaces = Object.entries(stats.workspaceScrapes)
    .map(([workspaceId, scrapes]) => ({ workspaceId, scrapes }))
    .sort((a, b) => b.scrapes - a.scrapes)
    .slice(0, 10);

  return {
    totalScrapes: stats.totalScrapes,
    byTier: stats.byTier,
    byActor: stats.byActor,
    topWorkspaces,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get workspace tier from database (placeholder)
 */
async function getWorkspaceTier(workspaceId: string): Promise<TierType> {
  // In production, fetch from your database
  // For now, check if stored in Redis
  const quota = await redis.get(`${QUOTA_PREFIX}${workspaceId}`);
  if (quota) {
    const parsed = JSON.parse(quota) as QuotaInfo;
    return parsed.tier;
  }
  return 'FREE';
}

/**
 * Get all workspaces approaching their quota limit
 */
export async function getWorkspacesNearLimit(
  thresholdPercent: number = 80
): Promise<
  Array<{
    workspaceId: string;
    tier: TierType;
    used: number;
    limit: number;
    percentUsed: number;
  }>
> {
  const keys = await redis.keys(`${QUOTA_PREFIX}*`);
  const nearLimit: Array<{
    workspaceId: string;
    tier: TierType;
    used: number;
    limit: number;
    percentUsed: number;
  }> = [];

  for (const key of keys) {
    const data = await redis.get(key);
    if (data) {
      const quota = JSON.parse(data) as QuotaInfo;
      const percentUsed = (quota.used / quota.limit) * 100;

      if (percentUsed >= thresholdPercent) {
        nearLimit.push({
          workspaceId: quota.workspaceId,
          tier: quota.tier,
          used: quota.used,
          limit: quota.limit,
          percentUsed,
        });
      }
    }
  }

  return nearLimit.sort((a, b) => b.percentUsed - a.percentUsed);
}
