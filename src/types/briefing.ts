// ============================================
// MORNING BRIEFING TYPES
// ============================================

import type { Platform } from './database'

// ============================================
// ENUMS
// ============================================

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum AlertType {
  HASHTAG_TRENDING = 'hashtag_trending',
  HASHTAG_DECLINING = 'hashtag_declining',
  COMPETITOR_POST = 'competitor_post',
  ENGAGEMENT_SPIKE = 'engagement_spike',
  SENTIMENT_SHIFT = 'sentiment_shift',
  NEW_CONTENT_FORMAT = 'new_content_format',
  VIRAL_CONTENT = 'viral_content',
  MENTION_ALERT = 'mention_alert',
}

export enum BriefingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  READY = 'ready',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

export enum TimeRange {
  LAST_24H = '24h',
  LAST_7D = '7d',
  LAST_30D = '30d',
}

// ============================================
// CORE TYPES
// ============================================

export interface TrendAlert {
  id: string
  type: AlertType
  severity: AlertSeverity
  title: string
  description: string
  changePercent: number
  previousValue: number
  currentValue: number
  data?: Record<string, unknown>
  createdAt: Date
  isRead: boolean
}

export interface CompetitorActivity {
  id: string
  competitorId: string
  competitorName: string
  competitorHandle: string
  platform: Platform
  avatarUrl?: string
  posts: CompetitorPost[]
  engagementChange: number
  followerChange: number
  lastActiveAt: Date
}

export interface CompetitorPost {
  id: string
  platformPostId: string
  contentType: string
  caption?: string
  mediaUrls: string[]
  permalink: string
  likesCount: number
  commentsCount: number
  sharesCount: number
  viewsCount: number
  engagementRate: number
  postedAt: Date
  hashtags: string[]
  sentimentScore?: number
}

export interface HashtagTrend {
  id: string
  tag: string
  platform: Platform
  currentPostCount: number
  previousPostCount: number
  velocity: number // posts per hour
  velocityChange: number
  trendingScore: number
  rank?: number
  isTrending: boolean
  direction: 'up' | 'down' | 'stable'
  topPosts: BriefingPostPreview[]
  relatedHashtags: string[]
}

export interface BriefingPostPreview {
  id: string
  platformPostId: string
  mediaUrl: string
  engagementRate: number
  likesCount: number
}

export interface SentimentShift {
  hashtag: string
  previousSentiment: number
  currentSentiment: number
  shift: number
  sampleSize: number
  direction: 'positive' | 'negative' | 'neutral'
}

export interface EmergingFormat {
  format: string
  platform: Platform
  adoptionRate: number
  growthRate: number
  examplePosts: number
  description: string
}

export interface BriefingSummary {
  totalAlerts: number
  criticalAlerts: number
  highAlerts: number
  unreadAlerts: number
  totalCompetitorPosts: number
  trendingHashtags: number
  decliningHashtags: number
  engagementSpikes: number
}

export interface Briefing {
  id: string
  workspaceId: string
  date: Date
  status: BriefingStatus
  timeRange: TimeRange
  summary: BriefingSummary
  alerts: TrendAlert[]
  competitorActivity: CompetitorActivity[]
  hashtagTrends: HashtagTrend[]
  sentimentShifts: SentimentShift[]
  emergingFormats: EmergingFormat[]
  insights: string[]
  recommendations: string[]
  deliveredAt?: Date
  createdAt: Date
  updatedAt: Date
}

// ============================================
// SETTINGS TYPES
// ============================================

export interface BriefingSettings {
  id: string
  workspaceId: string
  isEnabled: boolean
  deliveryTime: string // HH:mm format
  timezone: string
  timeRange: TimeRange
  emailDelivery: boolean
  inAppNotifications: boolean
  
  // Alert preferences
  alertPreferences: {
    hashtagTrending: boolean
    hashtagDeclining: boolean
    competitorPost: boolean
    engagementSpike: boolean
    sentimentShift: boolean
    newContentFormat: boolean
    viralContent: boolean
    mentionAlert: boolean
  }
  
  // Threshold settings
  thresholds: {
    hashtagVelocityThreshold: number // percent change
    competitorPostThreshold: number // minimum posts to alert
    engagementSpikeThreshold: number // percent change
    sentimentShiftThreshold: number // score change
    viralContentThreshold: number // engagement threshold
  }
  
  // Filters
  includedCompetitors: string[]
  includedHashtags: string[]
  excludedHashtags: string[]
  platforms: Platform[]
  
  createdAt: Date
  updatedAt: Date
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface GetBriefingInput {
  workspaceId: string
  date?: Date
  timeRange?: TimeRange
}

export interface GetBriefingResponse {
  briefing: Briefing | null
  previousBriefing?: Briefing | null
}

export interface MarkAlertReadInput {
  alertId: string
}

export interface MarkAllAlertsReadInput {
  briefingId: string
}

export interface UpdateSettingsInput {
  workspaceId: string
  settings: Partial<Omit<BriefingSettings, 'id' | 'workspaceId' | 'createdAt' | 'updatedAt'>>
}

export interface BriefingPreview {
  id: string
  date: Date
  summary: BriefingSummary
  hasUnreadAlerts: boolean
}

export interface BriefingHistoryResponse {
  briefings: BriefingPreview[]
  totalCount: number
  hasMore: boolean
}

// ============================================
// AGGREGATION TYPES
// ============================================

export interface AggregationResult {
  workspaceId: string
  date: Date
  timeRange: TimeRange
  hashtagData: HashtagAggregationData[]
  competitorData: CompetitorAggregationData[]
  postData: PostAggregationData[]
}

export interface HashtagAggregationData {
  tag: string
  platform: Platform
  currentPostCount: number
  previousPostCount: number
  velocity: number
  posts: ScrapedPostMetrics[]
}

export interface CompetitorAggregationData {
  competitorId: string
  posts: ScrapedPostMetrics[]
  followerChange: number
  totalEngagement: number
  engagementChange: number
}

export interface ScrapedPostMetrics {
  id: string
  platformPostId: string
  engagementRate: number
  likesCount: number
  commentsCount: number
  sharesCount: number
  viewsCount: number
  postedAt: Date
  contentType: string
}

export interface PostAggregationData {
  totalPosts: number
  avgEngagementRate: number
  contentTypeBreakdown: Record<string, number>
  hourlyDistribution: number[]
}

// ============================================
// TREND DETECTION TYPES
// ============================================

export interface TrendDetectionResult {
  alerts: TrendAlert[]
  trendingHashtags: HashtagTrend[]
  insights: string[]
}

export interface VelocityCalculation {
  current: number
  previous: number
  changePercent: number
  trend: 'accelerating' | 'decelerating' | 'stable'
}

export interface AnomalyDetectionResult {
  isAnomaly: boolean
  severity: AlertSeverity
  expectedValue: number
  actualValue: number
  deviation: number
}
