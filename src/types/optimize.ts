/**
 * Content Optimization Module Types
 * Type definitions for content analysis, recommendations, and optimization
 */

import { InstagramPost, TikTokPost } from './apify';

// ============================================================================
// Content Types
// ============================================================================

export type ContentType = 'reel' | 'carousel' | 'single_image' | 'story' | 'video';
export type PlatformType = 'instagram' | 'tiktok';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface ContentPerformance {
  id: string;
  contentType: ContentType;
  platform: PlatformType;
  postedAt: Date;
  dayOfWeek: DayOfWeek;
  hourOfDay: number;
  caption: string;
  hashtags: string[];
  mediaUrls: string[];
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  views: number;
  engagementRate: number;
  reach: number;
  impressions: number;
  followerCountAtPost: number;
  firstHourEngagement: number;
  captionLength: number;
  hashtagCount: number;
  hasTextOverlay: boolean;
  dominantColors?: string[];
  hasFaces?: boolean;
}

// ============================================================================
// Performance Analysis Types
// ============================================================================

export interface ContentTypeAnalysis {
  contentType: ContentType;
  totalPosts: number;
  avgEngagementRate: number;
  avgReach: number;
  avgSaves: number;
  avgShares: number;
  performanceScore: number;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
}

export interface PostingTimeHeatmap {
  day: DayOfWeek;
  hour: number;
  avgEngagementRate: number;
  totalPosts: number;
  score: number; // 0-100
}

export interface CaptionAnalysis {
  lengthRange: string;
  minLength: number;
  maxLength: number;
  avgEngagementRate: number;
  totalPosts: number;
  recommendation: 'optimal' | 'good' | 'too_short' | 'too_long';
}

export interface HashtagAnalysis {
  countRange: string;
  minCount: number;
  maxCount: number;
  avgReach: number;
  avgEngagementRate: number;
  totalPosts: number;
  recommendation: 'optimal' | 'good' | 'too_few' | 'too_many';
}

export interface EngagementVelocity {
  postId: string;
  firstHourLikes: number;
  firstHourComments: number;
  firstHourSaves: number;
  firstHourShares: number;
  totalEngagement: number;
  velocityScore: number;
}

// ============================================================================
// Recommendation Types
// ============================================================================

export interface ContentRecommendation {
  id: string;
  type: 'content_type' | 'posting_time' | 'caption' | 'hashtag' | 'format' | 'trend';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  expectedImpact: {
    metric: string;
    improvement: number;
    unit: 'percent' | 'absolute';
  };
  basedOn: {
    dataPoints: number;
    timeRange: string;
    confidence: number; // 0-100
  };
}

export interface ContentIdea {
  id: string;
  title: string;
  description: string;
  contentType: ContentType;
  platform: PlatformType;
  suggestedHashtags: string[];
  suggestedCaption: string;
  estimatedEngagement: number;
  trendScore: number;
  relevanceScore: number;
  source: 'ai' | 'trending' | 'competitor' | 'historical';
}

export interface CaptionSuggestion {
  id: string;
  originalCaption?: string;
  suggestions: {
    text: string;
    improvement: string;
    hook: string;
    callToAction: string;
  }[];
  analysis: {
    currentLength: number;
    optimalLength: number;
    readabilityScore: number;
    engagementPrediction: number;
  };
}

export interface HashtagRecommendation {
  hashtag: string;
  category: 'niche' | 'popular' | 'trending' | 'branded';
  postCount: number;
  avgEngagement: number;
  competitionLevel: 'low' | 'medium' | 'high';
  relevanceScore: number;
  recommended: boolean;
}

// ============================================================================
// Optimization Types
// ============================================================================

export interface ContentScore {
  overall: number;
  breakdown: {
    caption: number;
    hashtags: number;
    timing: number;
    visual: number;
    engagement: number;
  };
  suggestions: string[];
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface PostOptimization {
  original: {
    caption: string;
    hashtags: string[];
    postingTime: Date;
    contentType: ContentType;
  };
  optimized: {
    caption: string;
    hashtags: string[];
    postingTime: Date;
    contentType: ContentType;
  };
  improvements: {
    metric: string;
    before: number;
    after: number;
    improvement: number;
  }[];
  scoreImprovement: number;
}

export interface ABTestSuggestion {
  id: string;
  name: string;
  description: string;
  variable: string;
  variantA: string;
  variantB: string;
  expectedWinner: 'A' | 'B';
  confidence: number;
  sampleSize: number;
  duration: number; // days
}

// ============================================================================
// Calendar Types
// ============================================================================

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  contentType: ContentType;
  platform: PlatformType;
  scheduledAt: Date | string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  content?: {
    caption?: string;
    hashtags?: string[];
    mediaUrls?: string[];
  };
  reminder?: {
    enabled: boolean;
    minutesBefore: number;
  };
  score?: ContentScore;
}

export interface ContentCalendar {
  events: CalendarEvent[];
  view: 'week' | 'month';
  startDate: Date;
  endDate: Date;
}

export interface ContentQueue {
  ideas: ContentIdea[];
  scheduled: CalendarEvent[];
  drafts: CalendarEvent[];
}

// ============================================================================
// Preview Types
// ============================================================================

export interface PostPreview {
  platform: PlatformType;
  contentType: ContentType;
  media: {
    type: 'image' | 'video';
    url: string;
    aspectRatio: string;
  }[];
  caption: string;
  hashtags: string[];
  username: string;
  profilePicture?: string;
  likes: number;
  comments: number;
  postedAt: Date;
  isSponsored?: boolean;
  location?: string;
}

// ============================================================================
// Analysis Result Types
// ============================================================================

export interface PerformanceAnalysis {
  workspaceId: string;
  analyzedAt: Date;
  dateRange: {
    start: Date;
    end: Date;
  };
  contentTypePerformance: ContentTypeAnalysis[];
  postingTimeHeatmap: PostingTimeHeatmap[];
  captionAnalysis: CaptionAnalysis[];
  hashtagAnalysis: HashtagAnalysis[];
  topPerformingPosts: ContentPerformance[];
  underperformingPosts: ContentPerformance[];
  patterns: {
    bestContentType: ContentType;
    bestPostingDay: DayOfWeek;
    bestPostingHour: number;
    optimalCaptionLength: number;
    optimalHashtagCount: number;
  };
}

export interface OptimizationReport {
  workspaceId: string;
  generatedAt: Date;
  overallScore: number;
  scoreHistory: {
    date: Date;
    score: number;
  }[];
  recommendations: ContentRecommendation[];
  contentIdeas: ContentIdea[];
  abTestSuggestions: ABTestSuggestion[];
  nextBestActions: string[];
}

// ============================================================================
// API Input/Output Types
// ============================================================================

export interface AnalyzePerformanceInput {
  workspaceId: string;
  startDate?: Date;
  endDate?: Date;
  platform?: PlatformType;
}

export interface GetRecommendationsInput {
  workspaceId: string;
  limit?: number;
  type?: ContentRecommendation['type'];
}

export interface GenerateContentIdeasInput {
  workspaceId: string;
  contentType?: ContentType;
  platform?: PlatformType;
  count?: number;
  theme?: string;
}

export interface OptimizePostInput {
  workspaceId: string;
  caption: string;
  hashtags: string[];
  contentType: ContentType;
  platform: PlatformType;
  mediaUrls?: string[];
}

export interface SchedulePostInput {
  workspaceId: string;
  title: string;
  contentType: ContentType;
  platform: PlatformType;
  scheduledAt: Date;
  caption?: string;
  hashtags?: string[];
  mediaUrls?: string[];
  reminder?: {
    enabled: boolean;
    minutesBefore: number;
  };
}

export interface CalculateBestTimeInput {
  workspaceId: string;
  contentType?: ContentType;
  platform?: PlatformType;
  daysAhead?: number;
}

// ============================================================================
// Checklist Types
// ============================================================================

export interface OptimizationChecklistItem {
  id: string;
  category: 'caption' | 'hashtags' | 'visual' | 'timing' | 'engagement';
  title: string;
  description: string;
  isCompleted: boolean;
  isRequired: boolean;
  impact: 'high' | 'medium' | 'low';
  autoCheckable: boolean;
}

export interface OptimizationChecklist {
  items: OptimizationChecklistItem[];
  completedCount: number;
  totalCount: number;
  score: number;
}
