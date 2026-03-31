/**
 * Apify API Types
 * Complete type definitions for Apify Actor integration
 */

// ============================================================================
// Core Apify Types
// ============================================================================

export type ActorRunStatus = 
  | 'READY' 
  | 'RUNNING' 
  | 'SUCCEEDED' 
  | 'FAILED' 
  | 'TIMING-OUT' 
  | 'TIMED-OUT' 
  | 'ABORTING' 
  | 'ABORTED';

export type ActorId = 
  | 'apify/instagram-profile-scraper'
  | 'apify/instagram-post-scraper'
  | 'apify/instagram-hashtag-scraper'
  | 'apify/tiktok-scraper'
  | 'apify/tiktok-hashtag-analytics'
  | 'apify/instagram-comment-scraper';

export type ScraperType = 
  | 'instagram-profile'
  | 'instagram-posts'
  | 'instagram-hashtag'
  | 'instagram-comments'
  | 'tiktok-profile'
  | 'tiktok-hashtag'
  | 'tiktok-posts';

export type TierType = 'FREE' | 'PRO' | 'AGENCY' | 'ENTERPRISE';

// ============================================================================
// Apify API Response Types
// ============================================================================

export interface ApifyActorRun {
  id: string;
  actId: string;
  actorTaskId?: string;
  status: ActorRunStatus;
  statusMessage?: string;
  startedAt: string;
  finishedAt?: string;
  buildId: string;
  buildNumber: string;
  meta: {
    origin: string;
    clientIp?: string;
    userAgent?: string;
  };
  stats: {
    inputBodyLen: number;
    restartCount: number;
    resurrectCount: number;
    memAvgBytes?: number;
    memMaxBytes?: number;
    cpuAvgUsage?: number;
    cpuMaxUsage?: number;
    durationMillis: number;
    runTimeSecs: number;
    metamorph?: number;
    computeUnits?: number;
  };
  options: {
    build: string;
    timeoutSecs: number;
    memoryMbytes: number;
    diskMbytes?: number;
  };
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
}

export interface ApifyDataset {
  id: string;
  name?: string;
  userId: string;
  createdAt: string;
  modifiedAt: string;
  accessedAt: string;
  itemCount: number;
  cleanItemCount?: number;
  fields?: string[];
}

export interface ApifyDatasetItem {
  id: string;
  [key: string]: unknown;
}

export interface ApifyWebhookEvent {
  eventType: 'ACTOR.RUN.SUCCEEDED' | 'ACTOR.RUN.FAILED' | 'ACTOR.RUN.TIMED_OUT' | 'ACTOR.RUN.ABORTED';
  eventData: {
    actorId: string;
    actorRunId: string;
    actorTaskId?: string;
    datasetId?: string;
    keyValueStoreId?: string;
    logId?: string;
    startedAt: string;
    finishedAt: string;
  };
  resource: ApifyActorRun;
}

// ============================================================================
// Actor Input Types
// ============================================================================

export interface InstagramProfileInput {
  usernames: string[];
  resultsLimit?: number;
  includePosts?: boolean;
  postsLimit?: number;
  includeStories?: boolean;
  includeHighlights?: boolean;
  includeBusinessInfo?: boolean;
}

export interface InstagramPostInput {
  urls?: string[];
  username?: string;
  resultsLimit?: number;
  includeComments?: boolean;
  commentsLimit?: number;
  dateRange?: {
    from: string;
    to: string;
  };
}

export interface InstagramHashtagInput {
  hashtags: string[];
  resultsLimit?: number;
  includePosts?: boolean;
  postsLimit?: number;
  tab?: 'top' | 'recent' | 'reels';
}

export interface InstagramCommentsInput {
  postUrls: string[];
  resultsLimit?: number;
  includeReplies?: boolean;
  repliesLimit?: number;
  sort?: 'top' | 'recent';
}

export interface TikTokProfileInput {
  profiles: string[];
  resultsLimit?: number;
  includePosts?: boolean;
  postsLimit?: number;
  includeVideos?: boolean;
  videosLimit?: number;
}

export interface TiktokHashtagInput {
  hashtags: string[];
  resultsLimit?: number;
  tab?: 'top' | 'video';
  timeRange?: 'all' | 'day' | 'week' | 'month' | '6months';
}

export type ActorInput = 
  | InstagramProfileInput 
  | InstagramPostInput 
  | InstagramHashtagInput 
  | InstagramCommentsInput
  | TikTokProfileInput 
  | TiktokHashtagInput;

// ============================================================================
// Actor Output Types
// ============================================================================

export interface InstagramProfile {
  id: string;
  username: string;
  fullName?: string;
  biography?: string;
  externalUrl?: string;
  followersCount: number;
  followsCount: number;
  mediaCount: number;
  isPrivate: boolean;
  isVerified: boolean;
  profilePicUrl?: string;
  profilePicUrlHD?: string;
  businessCategoryName?: string;
  businessEmail?: string;
  businessPhoneNumber?: string;
  businessAddress?: string;
  timestamp: string;
  posts?: InstagramPost[];
}

export interface InstagramPost {
  id: string;
  shortCode: string;
  caption?: string;
  url: string;
  displayUrl: string;
  thumbnailUrl?: string;
  timestamp: string;
  likesCount: number;
  commentsCount: number;
  videoViewCount?: number;
  isVideo: boolean;
  ownerUsername?: string;
  ownerId?: string;
  hashtags: string[];
  mentions: string[];
  locationName?: string;
  locationId?: string;
  engagementRate?: number;
}

export interface InstagramComment {
  id: string;
  postId: string;
  text: string;
  ownerUsername: string;
  ownerId: string;
  timestamp: string;
  likesCount: number;
  replies?: InstagramComment[];
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface InstagramHashtagData {
  id: string;
  name: string;
  mediaCount: number;
  topPosts?: InstagramPost[];
  recentPosts?: InstagramPost[];
  reels?: InstagramPost[];
  scrapedAt: string;
}

export interface TikTokProfile {
  id: string;
  username: string;
  nickname?: string;
  signature?: string;
  avatar?: string;
  verified: boolean;
  private: boolean;
  followersCount: number;
  followingCount: number;
  heartsCount: number;
  videoCount: number;
  diggCount: number;
  timestamp: string;
  posts?: TikTokPost[];
}

export interface TikTokPost {
  id: string;
  desc?: string;
  createTime: string;
  videoUrl: string;
  coverUrl?: string;
  playCount: number;
  diggCount: number;
  commentCount: number;
  shareCount: number;
  authorUsername?: string;
  authorId?: string;
  hashtags: string[];
  mentions: string[];
  musicInfo?: {
    title?: string;
    author?: string;
  };
  engagementRate?: number;
}

export interface TikTokHashtagData {
  id: string;
  title: string;
  description?: string;
  videoCount: number;
  viewCount: number;
  posts?: TikTokPost[];
  trending?: boolean;
  scrapedAt: string;
}

// ============================================================================
// Service Types
// ============================================================================

export interface ScrapingJob {
  id: string;
  workspaceId: string;
  type: ScraperType;
  actorId: ActorId;
  actorRunId?: string;
  status: 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  input: ActorInput;
  result?: ScrapingResult;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  retryCount: number;
  priority: number;
  webhookDelivered?: boolean;
}

export interface ScrapingResult {
  datasetId?: string;
  itemCount: number;
  data: unknown[];
  rawOutput?: Record<string, unknown>;
}

export interface QuotaInfo {
  workspaceId: string;
  tier: TierType;
  limit: number;
  used: number;
  remaining: number;
  resetsAt: Date;
  usageHistory: QuotaUsageEntry[];
}

export interface QuotaUsageEntry {
  date: string;
  count: number;
  actorId: ActorId;
  jobId: string;
}

export interface WorkspaceUsage {
  workspaceId: string;
  month: string;
  totalScrapes: number;
  byActor: Record<ActorId, number>;
  byType: Record<ScraperType, number>;
}

// ============================================================================
// Actor Configuration Types
// ============================================================================

export interface ActorConfig {
  id: ActorId;
  name: string;
  type: ScraperType;
  description: string;
  defaultMemoryMbytes: number;
  defaultTimeoutSecs: number;
  defaultInput: Partial<ActorInput>;
  maxResultsLimit: number;
  tierLimits: Record<TierType, number>;
  costEstimatePer1kResults: number; // in USD
}

export interface RateLimitConfig {
  maxConcurrentRuns: number;
  requestsPerSecond: number;
  requestsPerMinute: number;
  cooldownMs: number;
}

// ============================================================================
// Cache Types
// ============================================================================

export interface CacheEntry<T> {
  key: string;
  data: T;
  expiresAt: Date;
  tags: string[];
}

export interface CacheKeyParts {
  actorId: ActorId;
  workspaceId: string;
  inputHash: string;
}

// ============================================================================
// Webhook Types
// ============================================================================

export interface WebhookPayload {
  eventId: string;
  eventType: string;
  timestamp: string;
  data: ApifyWebhookEvent;
}

export interface WebhookHandlerConfig {
  secret?: string;
  allowedIps?: string[];
  retryAttempts: number;
  timeoutMs: number;
}

// ============================================================================
// Error Types
// ============================================================================

export class ApifyError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'ApifyError';
  }
}

export class QuotaExceededError extends ApifyError {
  constructor(workspaceId: string, limit: number) {
    super(
      `Workspace ${workspaceId} has exceeded monthly quota of ${limit} scrapes`,
      'QUOTA_EXCEEDED',
      429,
      false
    );
    this.name = 'QuotaExceededError';
  }
}

export class RateLimitError extends ApifyError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, true);
    this.name = 'RateLimitError';
  }
}

export class ActorRunError extends ApifyError {
  constructor(runId: string, status: ActorRunStatus, message?: string) {
    super(
      `Actor run ${runId} failed with status ${status}: ${message || 'Unknown error'}`,
      'ACTOR_RUN_FAILED',
      500,
      status === 'TIMED-OUT' || status === 'TIMING-OUT'
    );
    this.name = 'ActorRunError';
  }
}

// ============================================================================
// Monitoring Types
// ============================================================================

export interface CompetitorMonitorConfig {
  id: string;
  workspaceId: string;
  competitorUsername: string;
  platform: 'instagram' | 'tiktok';
  trackingMetrics: {
    followers: boolean;
    posts: boolean;
    engagement: boolean;
    hashtags: boolean;
    mentions: boolean;
  };
  checkFrequency: 'hourly' | 'daily' | 'weekly';
  lastCheckedAt?: Date;
  nextCheckAt?: Date;
  isActive: boolean;
  alertThresholds?: {
    followerChangePercent?: number;
    engagementChangePercent?: number;
    newPostWithinHours?: number;
  };
}

export interface CompetitorSnapshot {
  id: string;
  monitorId: string;
  timestamp: Date;
  followersCount: number;
  postsCount: number;
  avgEngagementRate: number;
  latestPosts: string[];
  topHashtags: string[];
  changes?: {
    followersChange: number;
    postsChange: number;
    engagementChange: number;
  };
}

export interface HashtagTrackerConfig {
  id: string;
  workspaceId: string;
  hashtag: string;
  platform: 'instagram' | 'tiktok';
  trackingSince: Date;
  checkFrequency: 'hourly' | 'daily' | 'weekly';
  lastCheckedAt?: Date;
  nextCheckAt?: Date;
  isActive: boolean;
  targetPostCount?: number;
}

export interface HashtagTrend {
  id: string;
  trackerId: string;
  timestamp: Date;
  postCount: number;
  viewCount?: number;
  topPosts: string[];
  velocity: number; // posts per hour
  trendDirection: 'up' | 'down' | 'stable';
}
