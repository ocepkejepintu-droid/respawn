/**
 * Apify Integration Service - Main Export
 * 
 * This module provides a complete integration with Apify for social media scraping.
 * 
 * Features:
 * - Actor execution with queue management
 * - Result caching with configurable TTL
 * - Webhook handling for async completions
 * - Quota management per workspace
 * - Retry logic with exponential backoff
 * 
 * Usage:
 * ```typescript
 * import { 
 *   queueJob, 
 *   getJob, 
 *   cancelJob,
 *   checkQuota,
 *   getQuotaInfo 
 * } from '@/server/services/apify';
 * 
 * // Queue a scraping job
 * const job = await queueJob(workspaceId, actorId, input, { tier: 'PRO' });
 * 
 * // Check quota
 * const quota = await checkQuota(workspaceId, 'PRO');
 * console.log(`Remaining: ${quota.remaining}/${quota.limit}`);
 * ```
 */

// ============================================================================
// Core Client
// ============================================================================

export {
  // Actor execution
  runActor,
  getActorRun,
  waitForActorRun,
  abortActorRun,
  resurrectActorRun,
  
  // Dataset operations
  getDataset,
  getDatasetItems,
  getAllDatasetItems,
  
  // Webhook management
  createWebhook,
  deleteWebhook,
  listWebhooks,
  
  // Utilities
  healthCheck,
  getUserInfo,
} from './client';

export type {
  RunActorOptions,
  Webhook,
} from './client';

// ============================================================================
// Actor Configurations
// ============================================================================

export {
  // Actor IDs
  ACTOR_IDS,
  
  // Tier limits
  TIER_LIMITS,
  RATE_LIMITS,
  
  // Actor configs
  ACTOR_CONFIGS,
  
  // Helper functions
  getActorConfig,
  getActorConfigByType,
  getTierLimit,
  getRateLimitConfig,
  canTierUseActor,
  estimateCost,
  validateInput,
  buildActorInput,
  getSuggestedTimeout,
  listAvailableActors,
} from './actors';

// ============================================================================
// Job Executor
// ============================================================================

export {
  // Job management
  queueJob,
  getJob,
  cancelJob,
  
  // Queue operations
  getQueueStatus,
  cleanupOldJobs,
  getWorkspaceJobs,
  
  // Webhook handling
  handleRunCompletion,
  
  // Events
  executorEvents,
} from './executor';

export type {
  ExecutorEventEmitter,
} from './executor';

// ============================================================================
// Quota Manager
// ============================================================================

export {
  // Quota operations
  getQuotaInfo,
  updateWorkspaceTier,
  checkQuota,
  incrementUsage,
  decrementUsage,
  resetQuota,
  
  // Rate limiting
  canExecuteJob,
  getRateLimitStatus,
  
  // Usage tracking
  getMonthlyUsage,
  getUsageHistory,
  getGlobalUsageStats,
  
  // Monitoring
  getWorkspacesNearLimit,
} from './quota-manager';

// ============================================================================
// Webhook Handler
// ============================================================================

export {
  // Event processing
  processWebhookEvent,
  
  // Validation
  validateWebhookSignature,
  validateRequestOrigin,
  validatePayload,
  
  // Retry processing
  processRetries,
  
  // Stats
  getWebhookStats,
  getRecentEvents,
} from './webhook-handler';

export type {
  WebhookProcessingResult,
  RetryEntry,
} from './webhook-handler';
