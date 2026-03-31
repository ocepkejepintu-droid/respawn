/**
 * Competitor Analysis Module Types
 * Real Buzzer SaaS - Competitor Monitoring & Analytics
 */

import type { Platform } from './database';

// ============================================================================
// BASE COMPETITOR TYPES
// ============================================================================

export interface Competitor {
  id: string;
  workspaceId: string;
  username: string;
  displayName: string;
  platform: Platform;
  profileUrl: string;
  profileImage?: string;
  bio?: string;
  followers: number;
  following: number;
  postsCount: number;
  niche?: string;
  tags: string[];
  monitoringFrequency: MonitoringFrequency;
  isActive: boolean;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type MonitoringFrequency = 'hourly' | 'daily' | 'weekly' | 'monthly';

// ============================================================================
// COMPETITOR POSTS
// ============================================================================

export type ContentType = 'post' | 'reel' | 'carousel' | 'story' | 'video';

export interface CompetitorPost {
  id: string;
  competitorId: string;
  externalId: string;
  platform: Platform;
  contentType: ContentType;
  caption: string;
  captionLength: number;
  hashtags: string[];
  mentions: string[];
  mediaUrls: string[];
  thumbnailUrl?: string;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  views?: number;
  reach?: number;
  engagementRate: number;
  postedAt: Date;
  scrapedAt: Date;
  url: string;
}

// ============================================================================
// ANALYTICS & METRICS
// ============================================================================

export interface CompetitorMetrics {
  competitorId: string;
  date: Date;
  followers: number;
  following: number;
  postsCount: number;
  avgEngagementRate: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  avgSaves: number;
  totalReach: number;
  postsInPeriod: number;
}

export interface EngagementTrend {
  date: string;
  engagementRate: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  postsCount: number;
}

export interface PostingFrequency {
  dayOfWeek: number;
  hourOfDay: number;
  postCount: number;
  avgEngagement: number;
}

export interface ContentTypePerformance {
  contentType: ContentType;
  count: number;
  avgEngagementRate: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  avgViews?: number;
  totalEngagement: number;
  percentageOfTotal: number;
}

// ============================================================================
// HASHTAG ANALYSIS
// ============================================================================

export interface HashtagAnalysis {
  hashtag: string;
  usageCount: number;
  avgEngagementRate: number;
  totalReach: number;
  avgLikes: number;
  competitorIds: string[];
  frequency: number; // how often used (posts with this hashtag / total posts)
}

export interface HashtagOverlap {
  hashtag: string;
  yourUsage: number;
  competitorUsage: number;
  overlap: boolean;
  performance: 'better' | 'worse' | 'similar';
}

// ============================================================================
// COMPARISON TYPES
// ============================================================================

export interface CompetitorComparison {
  competitors: CompetitorSnapshot[];
  dateRange: DateRange;
  metrics: ComparisonMetrics;
  insights: ComparisonInsight[];
}

export interface CompetitorSnapshot {
  id: string;
  username: string;
  displayName: string;
  platform: Platform;
  profileImage?: string;
  followers: number;
  engagementRate: number;
  postsCount: number;
  avgLikes: number;
  avgComments: number;
  growthRate: number;
  topPerformingPost?: CompetitorPost;
}

export interface ComparisonMetrics {
  totalFollowers: number;
  avgEngagementRate: number;
  totalPosts: number;
  totalEngagement: number;
  engagementDistribution: Record<string, number>;
  followerDistribution: Record<string, number>;
}

export interface ComparisonInsight {
  type: 'strength' | 'weakness' | 'opportunity' | 'threat';
  title: string;
  description: string;
  competitorId?: string;
  metric?: string;
  value?: number;
}

// ============================================================================
// CONTENT GAP ANALYSIS
// ============================================================================

export interface ContentGap {
  contentType: ContentType;
  competitorAvgFrequency: number;
  yourFrequency: number;
  gap: number; // positive means you're posting less
  opportunity: 'high' | 'medium' | 'low';
}

export interface PostingTimeGap {
  dayOfWeek: number;
  hourOfDay: number;
  competitorAvgEngagement: number;
  yourAvgEngagement: number;
  gap: number;
  recommendation: string;
}

// ============================================================================
// INSIGHTS & RECOMMENDATIONS
// ============================================================================

export interface CompetitorInsight {
  id: string;
  competitorId: string;
  type: InsightType;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  metric?: string;
  value?: number;
  change?: number;
  createdAt: Date;
}

export type InsightType = 
  | 'engagement_drop'
  | 'engagement_spike'
  | 'follower_growth'
  | 'follower_loss'
  | 'posting_frequency_change'
  | 'viral_content'
  | 'trending_hashtag'
  | 'content_strategy_shift'
  | 'competitive_threat';

export interface Recommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  expectedImpact: string;
  actionItems: string[];
  basedOnCompetitorId?: string;
}

export type RecommendationType =
  | 'content_strategy'
  | 'posting_schedule'
  | 'hashtag_strategy'
  | 'engagement_tactics'
  | 'content_format'
  | 'competitive_response';

// ============================================================================
// BENCHMARK & INDUSTRY DATA
// ============================================================================

export interface IndustryBenchmark {
  niche: string;
  platform: Platform;
  avgEngagementRate: number;
  avgPostsPerWeek: number;
  avgCaptionLength: number;
  avgHashtagsPerPost: number;
  topPerformingContentTypes: ContentTypePerformance[];
  bestPostingTimes: BestPostingTime[];
}

export interface BestPostingTime {
  dayOfWeek: number;
  hourOfDay: number;
  avgEngagementRate: number;
  confidence: number;
}

// ============================================================================
// DATE RANGE & FILTERS
// ============================================================================

export interface DateRange {
  from: Date;
  to: Date;
}

export type DateRangePreset = 
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'last_6_months'
  | 'last_year'
  | 'custom';

export interface CompetitorFilter {
  platforms?: Platform[];
  niches?: string[];
  tags?: string[];
  minFollowers?: number;
  maxFollowers?: number;
  isActive?: boolean;
}

export interface PostFilter {
  contentTypes?: ContentType[];
  dateRange?: DateRange;
  minEngagement?: number;
  maxEngagement?: number;
  hashtags?: string[];
}

// ============================================================================
// EXPORT OPTIONS
// ============================================================================

export interface ExportOptions {
  format: 'csv' | 'pdf' | 'json';
  includeMetrics: boolean;
  includePosts: boolean;
  includeHashtags: boolean;
  dateRange: DateRange;
  competitors: string[];
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface CompetitorListResponse {
  competitors: Competitor[];
  totalCount: number;
  hasMore: boolean;
}

export interface CompetitorDetailResponse {
  competitor: Competitor;
  metrics: CompetitorMetrics[];
  recentPosts: CompetitorPost[];
  topPosts: CompetitorPost[];
  insights: CompetitorInsight[];
  trends: EngagementTrend[];
}

export interface ComparisonResponse {
  comparison: CompetitorComparison;
  contentGaps: ContentGap[];
  hashtagOverlap: HashtagOverlap[];
  recommendations: Recommendation[];
}

// ============================================================================
// FORM INPUTS
// ============================================================================

export interface AddCompetitorInput {
  username: string;
  platform: Platform;
  niche?: string;
  tags?: string[];
  monitoringFrequency: MonitoringFrequency;
}

export interface UpdateCompetitorInput {
  niche?: string;
  tags?: string[];
  monitoringFrequency?: MonitoringFrequency;
  isActive?: boolean;
}

// ============================================================================
// MOCK DATA HELPERS
// ============================================================================

export const MONITORING_FREQUENCY_OPTIONS: { value: MonitoringFrequency; label: string }[] = [
  { value: 'hourly', label: 'Every Hour' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  post: 'Single Post',
  reel: 'Reel',
  carousel: 'Carousel',
  story: 'Story',
  video: 'Video',
};

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const NICHE_OPTIONS = [
  'Fashion',
  'Beauty',
  'Fitness',
  'Food',
  'Travel',
  'Technology',
  'Finance',
  'Education',
  'Entertainment',
  'Lifestyle',
  'Business',
  'Health',
  'Sports',
  'Art',
  'Photography',
];
