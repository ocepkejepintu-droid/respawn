/**
 * Apify Actor Executor Service
 * Manages actor execution with queue, caching, and result handling
 */

import { redis } from '@/server/redis-client';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  ScrapingJob,
  ScrapingResult,
  ActorId,
  ActorInput,
  TierType,
  ApifyActorRun,
  ApifyError,
} from '@/types/apify';
import {
  runActor,
  getActorRun,
  waitForActorRun,
  getAllDatasetItems,
  RunActorOptions,
} from './client';
import {
  getActorConfig,
  buildActorInput,
  validateInput,
  getSuggestedTimeout,
} from './actors';
import { checkQuota, incrementUsage, canExecuteJob } from './quota-manager';

// ============================================================================
// Configuration
// ============================================================================

const JOB_QUEUE_KEY = 'apify:job-queue';
const JOB_PREFIX = 'apify:job:';
const ACTIVE_JOBS_KEY = 'apify:active-jobs';
const RESULT_PREFIX = 'apify:result:';
const CACHE_PREFIX = 'apify:cache:';

// Default cache TTL in seconds
const DEFAULT_CACHE_TTL = 60 * 60; // 1 hour

// Job processing configuration
const MAX_CONCURRENT_JOBS = 5;
const JOB_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const POLL_INTERVAL_MS = 5000; // 5 seconds

// ============================================================================
// Events
// ============================================================================

interface ExecutorEvents {
  'job:created': (job: ScrapingJob) => void;
  'job:started': (job: ScrapingJob) => void;
  'job:completed': (job: ScrapingJob, result: ScrapingResult) => void;
  'job:failed': (job: ScrapingJob, error: Error) => void;
  'job:cancelled': (job: ScrapingJob) => void;
  'queue:drained': () => void;
}

export class ExecutorEventEmitter extends EventEmitter {
  emit<K extends keyof ExecutorEvents>(
    event: K,
    ...args: Parameters<ExecutorEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }

  on<K extends keyof ExecutorEvents>(
    event: K,
    listener: ExecutorEvents[K]
  ): this {
    return super.on(event, listener);
  }
}

export const executorEvents = new ExecutorEventEmitter();

// ============================================================================
// Job Queue Management
// ============================================================================

/**
 * Create a cache key from job parameters
 */
function createCacheKey(
  actorId: ActorId,
  workspaceId: string,
  input: ActorInput
): string {
  // Create deterministic hash from input
  const inputHash = Buffer.from(JSON.stringify(input))
    .toString('base64')
    .slice(0, 32);
  return `${CACHE_PREFIX}${actorId}:${workspaceId}:${inputHash}`;
}

/**
 * Check if cached result exists and is valid
 */
async function getCachedResult<T>(
  cacheKey: string
): Promise<T | null> {
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Check if cache is still valid
      if (new Date(parsed.expiresAt) > new Date()) {
        return parsed.data as T;
      }
      // Expired, remove it
      await redis.del(cacheKey);
    }
  } catch (error) {
    console.error('Cache retrieval error:', error);
  }
  return null;
}

/**
 * Store result in cache
 */
async function setCachedResult<T>(
  cacheKey: string,
  data: T,
  ttlSeconds: number = DEFAULT_CACHE_TTL
): Promise<void> {
  try {
    const cacheEntry = {
      data,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    };
    await redis.setex(cacheKey, ttlSeconds, JSON.stringify(cacheEntry));
  } catch (error) {
    console.error('Cache storage error:', error);
  }
}

/**
 * Queue a new scraping job
 */
export async function queueJob(
  workspaceId: string,
  actorId: ActorId,
  input: ActorInput,
  options: {
    tier: TierType;
    priority?: number;
    skipCache?: boolean;
    cacheTtlSeconds?: number;
    webhookUrl?: string;
  }
): Promise<ScrapingJob> {
  const { tier, priority = 0, skipCache = false, cacheTtlSeconds } = options;

  // Validate input
  const validation = validateInput(actorId, input as Record<string, unknown>, tier);
  if (!validation.valid) {
    throw new ApifyError(
      `Input validation failed: ${validation.errors.join(', ')}`,
      'VALIDATION_ERROR',
      400,
      false
    );
  }

  // Check quota
  const quotaCheck = await checkQuota(workspaceId, tier);
  if (quotaCheck.remaining <= 0) {
    throw new ApifyError(
      `Monthly quota exceeded. Limit: ${quotaCheck.limit}, Used: ${quotaCheck.used}`,
      'QUOTA_EXCEEDED',
      429,
      false
    );
  }

  // Build final input with defaults
  const finalInput = buildActorInput(actorId, input as Record<string, unknown>, tier);

  // Check cache (unless skipped)
  if (!skipCache) {
    const cacheKey = createCacheKey(actorId, workspaceId, finalInput);
    const cached = await getCachedResult<ScrapingResult>(cacheKey);
    if (cached) {
      // Return a completed job with cached result
      const job: ScrapingJob = {
        id: uuidv4(),
        workspaceId,
        type: getActorConfig(actorId).type,
        actorId,
        status: 'completed',
        input: finalInput,
        result: cached,
        createdAt: new Date(),
        completedAt: new Date(),
        retryCount: 0,
        priority,
      };
      executorEvents.emit('job:completed', job, cached);
      return job;
    }
  }

  // Check rate limits
  const canExecute = await canExecuteJob(workspaceId, tier);
  if (!canExecute.allowed) {
    throw new ApifyError(
      `Rate limit exceeded. ${canExecute.reason}`,
      'RATE_LIMIT_EXCEEDED',
      429,
      true
    );
  }

  // Create job
  const job: ScrapingJob = {
    id: uuidv4(),
    workspaceId,
    type: getActorConfig(actorId).type,
    actorId,
    status: 'pending',
    input: finalInput,
    createdAt: new Date(),
    retryCount: 0,
    priority,
  };

  // Store job in Redis
  await redis.setex(
    `${JOB_PREFIX}${job.id}`,
    3600, // 1 hour TTL
    JSON.stringify(job)
  );

  // Add to priority queue
  await redis.zadd(JOB_QUEUE_KEY, priority, job.id);

  executorEvents.emit('job:created', job);

  // Start processing if under limit
  await processQueue();

  return job;
}

/**
 * Get job by ID
 */
export async function getJob(jobId: string): Promise<ScrapingJob | null> {
  const jobData = await redis.get(`${JOB_PREFIX}${jobId}`);
  if (!jobData) return null;
  return JSON.parse(jobData) as ScrapingJob;
}

/**
 * Update job status
 */
async function updateJob(
  jobId: string,
  updates: Partial<ScrapingJob>
): Promise<ScrapingJob | null> {
  const job = await getJob(jobId);
  if (!job) return null;

  const updatedJob = { ...job, ...updates };
  await redis.setex(
    `${JOB_PREFIX}${jobId}`,
    3600,
    JSON.stringify(updatedJob)
  );
  return updatedJob;
}

/**
 * Cancel a pending or running job
 */
export async function cancelJob(jobId: string): Promise<boolean> {
  const job = await getJob(jobId);
  if (!job) return false;

  if (job.status === 'pending') {
    // Remove from queue
    await redis.zrem(JOB_QUEUE_KEY, jobId);
    await updateJob(jobId, { status: 'cancelled', completedAt: new Date() });
    executorEvents.emit('job:cancelled', job);
    return true;
  }

  if (job.status === 'running' && job.actorRunId) {
    // Abort the actor run
    try {
      const { abortActorRun } = await import('./client');
      await abortActorRun(job.actorRunId);
      await updateJob(jobId, { status: 'cancelled', completedAt: new Date() });
      executorEvents.emit('job:cancelled', job);
      return true;
    } catch (error) {
      console.error('Failed to abort actor run:', error);
      return false;
    }
  }

  return false;
}

// ============================================================================
// Queue Processing
// ============================================================================

let isProcessing = false;

/**
 * Process jobs from the queue
 */
async function processQueue(): Promise<void> {
  if (isProcessing) return;
  isProcessing = true;

  try {
    // Get active job count
    const activeJobs = await redis.smembers(ACTIVE_JOBS_KEY);
    const availableSlots = MAX_CONCURRENT_JOBS - activeJobs.length;

    if (availableSlots <= 0) return;

    // Get highest priority jobs
    const jobIds = await redis.zrevrange(JOB_QUEUE_KEY, 0, availableSlots - 1);

    if (jobIds.length === 0) {
      executorEvents.emit('queue:drained');
      return;
    }

    // Remove jobs from queue
    await redis.zrem(JOB_QUEUE_KEY, ...jobIds);

    // Start jobs in parallel
    await Promise.all(
      jobIds.map(jobId => executeJob(jobId).catch(console.error))
    );
  } finally {
    isProcessing = false;
    
    // Check if more jobs to process
    const queueLength = await redis.zcard(JOB_QUEUE_KEY);
    if (queueLength > 0) {
      const activeJobs = await redis.smembers(ACTIVE_JOBS_KEY);
      if (activeJobs.length < MAX_CONCURRENT_JOBS) {
        setImmediate(() => processQueue());
      }
    }
  }
}

/**
 * Execute a single job
 */
async function executeJob(jobId: string): Promise<void> {
  const job = await getJob(jobId);
  if (!job || job.status !== 'pending') return;

  // Add to active jobs
  await redis.sadd(ACTIVE_JOBS_KEY, jobId);
  await redis.expire(ACTIVE_JOBS_KEY, 3600);

  try {
    // Update status
    await updateJob(jobId, {
      status: 'running',
      startedAt: new Date(),
    });
    executorEvents.emit('job:started', job);

    // Get tier from workspace (would normally be fetched from DB)
    const tier = await getWorkspaceTier(job.workspaceId);

    // Start actor run
    const actorConfig = getActorConfig(job.actorId);
    const timeout = getSuggestedTimeout(job.actorId, job.input as Record<string, unknown>);

    const runOptions: RunActorOptions = {
      memoryMbytes: actorConfig.defaultMemoryMbytes,
      timeoutSecs: timeout,
      build: 'latest',
      waitForFinish: false,
      webhooks: process.env.APIFY_WEBHOOK_URL
        ? [{
            eventTypes: ['ACTOR.RUN.SUCCEEDED', 'ACTOR.RUN.FAILED', 'ACTOR.RUN.TIMED_OUT', 'ACTOR.RUN.ABORTED'],
            requestUrl: process.env.APIFY_WEBHOOK_URL,
          }]
        : undefined,
    };

    const run = await runActor(job.actorId, job.input, runOptions);

    // Update job with actor run ID
    await updateJob(jobId, { actorRunId: run.id });

    // Wait for completion
    const completedRun = await waitForActorRun(run.id, {
      pollIntervalMs: POLL_INTERVAL_MS,
      timeoutMs: JOB_TIMEOUT_MS,
    });

    // Process results
    const result = await processRunResults(completedRun);

    // Update usage tracking
    await incrementUsage(job.workspaceId, job.actorId, job.id);

    // Cache the result
    const cacheKey = createCacheKey(job.actorId, job.workspaceId, job.input);
    await setCachedResult(cacheKey, result);

    // Update job as completed
    const completedJob = await updateJob(jobId, {
      status: 'completed',
      completedAt: new Date(),
      result,
    });

    if (completedJob) {
      executorEvents.emit('job:completed', completedJob, result);
    }

  } catch (error) {
    // Handle retry
    if (job.retryCount < 3) {
      const updatedJob = await updateJob(jobId, {
        retryCount: job.retryCount + 1,
        status: 'pending',
      });
      if (updatedJob) {
        // Re-queue with lower priority
        await redis.zadd(JOB_QUEUE_KEY, job.priority - 1, jobId);
      }
    } else {
      // Max retries reached
      const errorMessage = error instanceof Error ? error.message : String(error);
      const failedJob = await updateJob(jobId, {
        status: 'failed',
        completedAt: new Date(),
        error: errorMessage,
      });
      if (failedJob) {
        executorEvents.emit('job:failed', failedJob, error instanceof Error ? error : new Error(errorMessage));
      }
    }
  } finally {
    // Remove from active jobs
    await redis.srem(ACTIVE_JOBS_KEY, jobId);
    
    // Trigger queue processing
    setImmediate(() => processQueue());
  }
}

/**
 * Process results from a completed actor run
 */
async function processRunResults(run: ApifyActorRun): Promise<ScrapingResult> {
  if (!run.output || !run.output.defaultDatasetId) {
    return {
      itemCount: 0,
      data: [],
      rawOutput: run.output || {},
    };
  }

  const datasetId = run.output.defaultDatasetId as string;
  const items = await getAllDatasetItems(datasetId);

  return {
    datasetId,
    itemCount: items.length,
    data: items,
    rawOutput: run.output,
  };
}

/**
 * Handle webhook notification for job completion
 */
export async function handleRunCompletion(
  runId: string,
  status: 'SUCCEEDED' | 'FAILED' | 'TIMED_OUT' | 'ABORTED'
): Promise<void> {
  // Find job by actor run ID
  // This requires scanning all jobs - in production, use a reverse index
  const jobIds = await redis.zrange(JOB_QUEUE_KEY, 0, -1);
  
  for (const jobId of jobIds) {
    const job = await getJob(jobId);
    if (job?.actorRunId === runId) {
      if (status === 'SUCCEEDED') {
        // Fetch results and complete job
        try {
          const run = await getActorRun(runId);
          const result = await processRunResults(run);
          await incrementUsage(job.workspaceId, job.actorId, job.id);
          
          const cacheKey = createCacheKey(job.actorId, job.workspaceId, job.input);
          await setCachedResult(cacheKey, result);
          
          const completedJob = await updateJob(jobId, {
            status: 'completed',
            completedAt: new Date(),
            result,
            webhookDelivered: true,
          });
          
          if (completedJob) {
            executorEvents.emit('job:completed', completedJob, result);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          const failedJob = await updateJob(jobId, {
            status: 'failed',
            completedAt: new Date(),
            error: errorMessage,
            webhookDelivered: true,
          });
          if (failedJob) {
            executorEvents.emit('job:failed', failedJob, error instanceof Error ? error : new Error(errorMessage));
          }
        }
      } else {
        // Handle failure
        const failedJob = await updateJob(jobId, {
          status: 'failed',
          completedAt: new Date(),
          error: `Actor run ${status}`,
          webhookDelivered: true,
        });
        if (failedJob) {
          executorEvents.emit('job:failed', failedJob, new Error(`Actor run ${status}`));
        }
      }
      
      await redis.srem(ACTIVE_JOBS_KEY, jobId);
      break;
    }
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get workspace tier (placeholder - should fetch from database)
 */
async function getWorkspaceTier(workspaceId: string): Promise<TierType> {
  // In production, fetch from database
  // For now, default to FREE
  return 'FREE';
}

/**
 * Get job queue status
 */
export async function getQueueStatus(): Promise<{
  pending: number;
  active: number;
  total: number;
}> {
  const [pending, active] = await Promise.all([
    redis.zcard(JOB_QUEUE_KEY),
    redis.scard(ACTIVE_JOBS_KEY),
  ]);

  return {
    pending,
    active,
    total: pending + active,
  };
}

/**
 * Clear completed/failed jobs older than specified age
 */
export async function cleanupOldJobs(maxAgeHours: number = 24): Promise<number> {
  const pattern = `${JOB_PREFIX}*`;
  const keys = await redis.keys(pattern);
  const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
  let cleaned = 0;

  for (const key of keys) {
    const jobData = await redis.get(key);
    if (jobData) {
      const job = JSON.parse(jobData) as ScrapingJob;
      if (
        (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') &&
        new Date(job.completedAt || job.createdAt) < cutoff
      ) {
        await redis.del(key);
        cleaned++;
      }
    }
  }

  return cleaned;
}

/**
 * Get recent jobs for a workspace
 */
export async function getWorkspaceJobs(
  workspaceId: string,
  options: {
    status?: ScrapingJob['status'];
    limit?: number;
    offset?: number;
  } = {}
): Promise<ScrapingJob[]> {
  const { status, limit = 20, offset = 0 } = options;
  const pattern = `${JOB_PREFIX}*`;
  const keys = await redis.keys(pattern);
  
  const jobs: ScrapingJob[] = [];
  
  for (const key of keys) {
    const jobData = await redis.get(key);
    if (jobData) {
      const job = JSON.parse(jobData) as ScrapingJob;
      if (job.workspaceId === workspaceId) {
        if (!status || job.status === status) {
          jobs.push(job);
        }
      }
    }
  }

  // Sort by createdAt desc
  jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return jobs.slice(offset, offset + limit);
}
