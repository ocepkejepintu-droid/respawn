/**
 * Apify API Client
 * Wrapper around Apify REST API with retry logic and error handling
 */

import {
  ApifyActorRun,
  ApifyDataset,
  ApifyDatasetItem,
  ApifyError,
  ActorRunError,
  RateLimitError,
  ActorId,
  ActorInput,
} from '@/types/apify';

// ============================================================================
// Configuration
// ============================================================================

const APIFY_API_BASE_URL = 'https://api.apify.com/v2';

function getApiToken(): string {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    throw new ApifyError(
      'APIFY_API_TOKEN environment variable is not set',
      'MISSING_API_TOKEN',
      500,
      false
    );
  }
  return token;
}

// ============================================================================
// Retry Configuration
// ============================================================================

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  exponentialBase: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  exponentialBase: 2,
};

// ============================================================================
// HTTP Client
// ============================================================================

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  retryConfig?: Partial<RetryConfig>;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.baseDelayMs * Math.pow(config.exponentialBase, attempt);
  const jitter = Math.random() * 1000; // Add jitter to avoid thundering herd
  return Math.min(exponentialDelay + jitter, config.maxDelayMs);
}

async function makeRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {}, retryConfig = {} } = options;
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  
  const url = `${APIFY_API_BASE_URL}${endpoint}`;
  const token = getApiToken();
  
  const requestHeaders: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...headers,
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const delayMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : calculateDelay(attempt, config);
        
        if (attempt < config.maxRetries) {
          await sleep(delayMs);
          continue;
        }
        throw new RateLimitError('Apify API rate limit exceeded');
      }

      // Handle server errors (5xx) - retryable
      if (response.status >= 500 && response.status < 600) {
        if (attempt < config.maxRetries) {
          await sleep(calculateDelay(attempt, config));
          continue;
        }
        throw new ApifyError(
          `Apify API server error: ${response.statusText}`,
          'SERVER_ERROR',
          response.status,
          true
        );
      }

      // Handle client errors (4xx) - not retryable
      if (response.status >= 400 && response.status < 500) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApifyError(
          errorData.error?.message || `Apify API client error: ${response.statusText}`,
          errorData.error?.code || 'CLIENT_ERROR',
          response.status,
          false
        );
      }

      // Success
      if (!response.ok) {
        throw new ApifyError(
          `Unexpected response: ${response.statusText}`,
          'UNKNOWN_ERROR',
          response.status,
          true
        );
      }

      return await response.json() as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on client errors
      if (error instanceof ApifyError && !error.retryable) {
        throw error;
      }

      // Don't retry network errors on last attempt
      if (attempt >= config.maxRetries) {
        break;
      }

      // Wait before retry
      await sleep(calculateDelay(attempt, config));
    }
  }

  throw lastError || new ApifyError(
    'Max retries exceeded',
    'MAX_RETRIES_EXCEEDED',
    undefined,
    true
  );
}

// ============================================================================
// Actor Run API
// ============================================================================

export interface RunActorOptions {
  memoryMbytes?: number;
  timeoutSecs?: number;
  build?: string;
  waitForFinish?: boolean;
  webhooks?: Array<{
    eventTypes: string[];
    requestUrl: string;
    payloadTemplate?: string;
  }>;
}

/**
 * Start an actor run
 */
export async function runActor(
  actorId: ActorId,
  input: ActorInput,
  options: RunActorOptions = {}
): Promise<ApifyActorRun> {
  const {
    memoryMbytes = 4096,
    timeoutSecs = 300,
    build = 'latest',
    waitForFinish = false,
    webhooks,
  } = options;

  const params = new URLSearchParams({
    memory: memoryMbytes.toString(),
    timeout: timeoutSecs.toString(),
    build,
  });

  if (waitForFinish) {
    params.append('waitForFinish', '60'); // Wait up to 60 seconds
  }

  const body: Record<string, unknown> = {
    ...input,
  };

  if (webhooks) {
    body.webhooks = webhooks;
  }

  const response = await makeRequest<{ data: ApifyActorRun }>(
    `/acts/${actorId}/runs?${params.toString()}`,
    {
      method: 'POST',
      body,
    }
  );

  return response.data;
}

/**
 * Get actor run details
 */
export async function getActorRun(runId: string): Promise<ApifyActorRun> {
  const response = await makeRequest<{ data: ApifyActorRun }>(
    `/actor-runs/${runId}`
  );
  return response.data;
}

/**
 * Abort an actor run
 */
export async function abortActorRun(runId: string): Promise<ApifyActorRun> {
  const response = await makeRequest<{ data: ApifyActorRun }>(
    `/actor-runs/${runId}/abort`,
    { method: 'POST' }
  );
  return response.data;
}

/**
 * Resurrect a failed/aborted actor run
 */
export async function resurrectActorRun(runId: string): Promise<ApifyActorRun> {
  const response = await makeRequest<{ data: ApifyActorRun }>(
    `/actor-runs/${runId}/resurrect`,
    { method: 'POST' }
  );
  return response.data;
}

/**
 * Wait for actor run to complete
 */
export async function waitForActorRun(
  runId: string,
  options: {
    pollIntervalMs?: number;
    timeoutMs?: number;
  } = {}
): Promise<ApifyActorRun> {
  const { pollIntervalMs = 5000, timeoutMs = 600000 } = options; // Default 10 min timeout
  const startTime = Date.now();

  while (true) {
    const run = await getActorRun(runId);

    // Check if run is in a terminal state
    if (
      run.status === 'SUCCEEDED' ||
      run.status === 'FAILED' ||
      run.status === 'TIMED-OUT' ||
      run.status === 'ABORTED'
    ) {
      if (run.status === 'SUCCEEDED') {
        return run;
      }
      throw new ActorRunError(runId, run.status, run.statusMessage);
    }

    // Check timeout
    if (Date.now() - startTime > timeoutMs) {
      throw new ApifyError(
        `Timeout waiting for run ${runId} to complete`,
        'WAIT_TIMEOUT',
        undefined,
        true
      );
    }

    // Wait before polling again
    await sleep(pollIntervalMs);
  }
}

/**
 * Get actor run's default dataset
 */
export async function getDataset(datasetId: string): Promise<ApifyDataset> {
  const response = await makeRequest<{ data: ApifyDataset }>(
    `/datasets/${datasetId}`
  );
  return response.data;
}

/**
 * Get items from a dataset
 */
export async function getDatasetItems<T = ApifyDatasetItem>(
  datasetId: string,
  options: {
    offset?: number;
    limit?: number;
    desc?: boolean;
    fields?: string[];
    unwind?: string;
  } = {}
): Promise<{ items: T[]; total: number; offset: number; count: number }> {
  const params = new URLSearchParams();
  
  if (options.offset !== undefined) params.append('offset', options.offset.toString());
  if (options.limit !== undefined) params.append('limit', options.limit.toString());
  if (options.desc !== undefined) params.append('desc', options.desc.toString());
  if (options.fields) params.append('fields', options.fields.join(','));
  if (options.unwind) params.append('unwind', options.unwind);

  const response = await makeRequest<{
    items: T[];
    total: number;
    offset: number;
    count: number;
  }>(`/datasets/${datasetId}/items?${params.toString()}`);

  return response;
}

/**
 * Get all items from a dataset (handles pagination)
 */
export async function getAllDatasetItems<T = ApifyDatasetItem>(
  datasetId: string,
  options: {
    fields?: string[];
    unwind?: string;
    batchSize?: number;
  } = {}
): Promise<T[]> {
  const { batchSize = 1000 } = options;
  const allItems: T[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await getDatasetItems<T>(datasetId, {
      offset,
      limit: batchSize,
      fields: options.fields,
      unwind: options.unwind,
    });

    allItems.push(...response.items);
    
    hasMore = response.items.length === batchSize && allItems.length < response.total;
    offset += batchSize;
  }

  return allItems;
}

// ============================================================================
// Actor Management API
// ============================================================================

/**
 * Get actor details
 */
export async function getActor(actorId: ActorId): Promise<{
  id: string;
  name: string;
  username: string;
  description?: string;
  pricingInfos?: Array<{
    pricingModel: string;
    pricePerUnitUsd?: number;
  }>;
}> {
  const response = await makeRequest<{ data: {
    id: string;
    name: string;
    username: string;
    description?: string;
    pricingInfos?: Array<{
      pricingModel: string;
      pricePerUnitUsd?: number;
    }>;
  } }>(`/acts/${actorId}`);
  return response.data;
}

/**
 * List actors (for the authenticated user)
 */
export async function listActors(options: {
  limit?: number;
  offset?: number;
  desc?: boolean;
} = {}): Promise<{
  items: Array<{
    id: string;
    name: string;
    username: string;
  }>;
  total: number;
  offset: number;
  count: number;
}> {
  const params = new URLSearchParams();
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.offset) params.append('offset', options.offset.toString());
  if (options.desc) params.append('desc', 'true');

  const response = await makeRequest<{
    items: Array<{
      id: string;
      name: string;
      username: string;
    }>;
    total: number;
    offset: number;
    count: number;
  }>(`/acts?${params.toString()}`);

  return response;
}

// ============================================================================
// Webhook Management API
// ============================================================================

export interface Webhook {
  id: string;
  eventTypes: string[];
  condition: {
    actorId?: string;
    actorTaskId?: string;
    actorRunId?: string;
  };
  requestUrl: string;
  payloadTemplate?: string;
  createdAt: string;
  lastDispatchAt?: string;
  stats: {
    totalDispatches: number;
  };
}

/**
 * Create a webhook
 */
export async function createWebhook(options: {
  eventTypes: string[];
  requestUrl: string;
  condition: {
    actorId?: string;
    actorTaskId?: string;
    actorRunId?: string;
  };
  payloadTemplate?: string;
  idempotencyKey?: string;
}): Promise<Webhook> {
  const headers: Record<string, string> = {};
  if (options.idempotencyKey) {
    headers['Idempotency-Key'] = options.idempotencyKey;
  }

  const response = await makeRequest<{ data: Webhook }>(
    '/webhooks',
    {
      method: 'POST',
      body: {
        eventTypes: options.eventTypes,
        requestUrl: options.requestUrl,
        condition: options.condition,
        payloadTemplate: options.payloadTemplate,
      },
      headers,
    }
  );

  return response.data;
}

/**
 * Delete a webhook
 */
export async function deleteWebhook(webhookId: string): Promise<void> {
  await makeRequest<void>(`/webhooks/${webhookId}`, { method: 'DELETE' });
}

/**
 * List webhooks
 */
export async function listWebhooks(options: {
  limit?: number;
  offset?: number;
} = {}): Promise<{
  items: Webhook[];
  total: number;
  offset: number;
  count: number;
}> {
  const params = new URLSearchParams();
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.offset) params.append('offset', options.offset.toString());

  const response = await makeRequest<{
    items: Webhook[];
    total: number;
    offset: number;
    count: number;
  }>(`/webhooks?${params.toString()}`);

  return response;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if Apify API is accessible
 */
export async function healthCheck(): Promise<{
  healthy: boolean;
  user?: { id: string; username: string; email?: string };
  error?: string;
}> {
  try {
    const response = await makeRequest<{ data: { id: string; username: string; email?: string } }>(
      '/users/me',
      { retryConfig: { maxRetries: 1 } }
    );
    return { healthy: true, user: response.data };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get user account info
 */
export async function getUserInfo(): Promise<{
  id: string;
  username: string;
  email?: string;
  profile: {
    name?: string;
    pictureUrl?: string;
    description?: string;
  };
  usage: {
    currentComputeUnits: number;
    maxComputeUnits: number;
  };
}> {
  const response = await makeRequest<{ data: {
    id: string;
    username: string;
    email?: string;
    profile: {
      name?: string;
      pictureUrl?: string;
      description?: string;
    };
    usage: {
      currentComputeUnits: number;
      maxComputeUnits: number;
    };
  } }>('/users/me');
  return response.data;
}
