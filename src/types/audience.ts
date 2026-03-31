/**
 * Audience Intelligence Types
 * Complete type definitions for audience analysis and sentiment tracking
 */

// ============================================================================
// Sentiment Analysis Types
// ============================================================================

export type SentimentType = 'positive' | 'negative' | 'neutral' | 'mixed';
export type EmotionType = 'joy' | 'anger' | 'sadness' | 'fear' | 'surprise' | 'trust' | 'anticipation' | 'neutral';

export interface SentimentScore {
  positive: number;
  negative: number;
  neutral: number;
  mixed?: number;
  compound: number; // -1 to 1
}

export interface SentimentTrend {
  date: string;
  positive: number;
  negative: number;
  neutral: number;
  total: number;
  score: number;
}

export interface SentimentAnalysis {
  overall: SentimentScore;
  trends: SentimentTrend[];
  byContentType: Record<string, SentimentScore>;
  byPlatform: Record<string, SentimentScore>;
  confidence: number;
  analyzedAt: string;
}

export interface EmotionDetection {
  primary: EmotionType;
  secondary?: EmotionType;
  scores: Record<EmotionType, number>;
  intensity: 'low' | 'medium' | 'high';
}

// ============================================================================
// Keyword & Topic Types
// ============================================================================

export interface KeywordData {
  term: string;
  frequency: number;
  sentiment: SentimentType;
  sentimentScore: number;
  trending: boolean;
  trendDirection?: 'up' | 'down' | 'stable';
  changePercent?: number;
  relatedTerms?: string[];
  contexts?: string[];
}

export interface TopicCluster {
  id: string;
  name: string;
  keywords: string[];
  frequency: number;
  sentiment: SentimentType;
  relatedComments: number;
  trending: boolean;
}

export interface NamedEntity {
  name: string;
  type: 'person' | 'organization' | 'product' | 'location' | 'brand';
  frequency: number;
  sentiment: SentimentType;
}

// ============================================================================
// Demographics Types
// ============================================================================

export interface AgeRange {
  range: string;
  percentage: number;
  count: number;
  engagementRate?: number;
}

export interface GeographicData {
  country: string;
  countryCode: string;
  percentage: number;
  count: number;
  cities?: {
    name: string;
    percentage: number;
  }[];
}

export interface InterestCategory {
  name: string;
  score: number;
  affinity: 'low' | 'medium' | 'high';
  trending?: boolean;
}

export interface ActiveHour {
  hour: number;
  engagement: number;
  posts: number;
  dayOfWeek?: number;
}

export interface PeakEngagement {
  bestDays: string[];
  bestHours: number[];
  hourlyDistribution: ActiveHour[];
  timezone?: string;
}

export interface Demographics {
  ageRanges: AgeRange[];
  countries: GeographicData[];
  interests: InterestCategory[];
  peakEngagement: PeakEngagement;
  gender?: {
    male: number;
    female: number;
    other: number;
  };
  languages?: string[];
  devices?: Record<string, number>;
}

// ============================================================================
// Comment Analysis Types
// ============================================================================

export interface CommentInsight {
  id: string;
  text: string;
  author: string;
  platform: string;
  postUrl?: string;
  timestamp: string;
  likes: number;
  replies: number;
  sentiment: SentimentType;
  sentimentScore: number;
  emotion?: EmotionDetection;
  keywords: string[];
  category?: 'question' | 'complaint' | 'praise' | 'suggestion' | 'general';
  language: string;
  isReply: boolean;
  parentId?: string;
  engagement: number;
  aiAnalysis?: {
    summary: string;
    intent: string;
    urgency: 'low' | 'medium' | 'high';
    actionRequired: boolean;
  };
}

export interface QuestionPattern {
  question: string;
  frequency: number;
  variations: string[];
  contexts: string[];
  suggestedAnswer?: string;
}

export interface PainPoint {
  issue: string;
  frequency: number;
  severity: 'low' | 'medium' | 'high';
  relatedComments: string[];
  suggestedSolutions?: string[];
}

export interface CommentInsights {
  topComments: CommentInsight[];
  questions: QuestionPattern[];
  painPoints: PainPoint[];
  responseRate: {
    responded: number;
    total: number;
    percentage: number;
    avgResponseTime?: number;
  };
  languageDistribution: Record<string, number>;
  categories: Record<string, number>;
}

// ============================================================================
// Voice of Customer Types
// ============================================================================

export interface VoCTheme {
  theme: string;
  type: 'praise' | 'complaint' | 'suggestion' | 'question';
  frequency: number;
  sentiment: SentimentType;
  impact: 'low' | 'medium' | 'high';
  quotes: string[];
  relatedKeywords: string[];
  trendDirection?: 'increasing' | 'decreasing' | 'stable';
}

export interface FeatureRequest {
  feature: string;
  description: string;
  frequency: number;
  upvotes: number;
  sentiment: SentimentType;
  priority: 'low' | 'medium' | 'high';
  relatedComments: string[];
  feasibility?: 'easy' | 'medium' | 'hard';
}

export interface Testimonial {
  text: string;
  author: string;
  platform: string;
  sentiment: SentimentType;
  engagement: number;
  date: string;
  category: string;
  highlight?: string;
}

export interface VoiceOfCustomer {
  themes: VoCTheme[];
  featureRequests: FeatureRequest[];
  testimonials: Testimonial[];
  topPhrases: KeywordData[];
  complaints: VoCTheme[];
  praise: VoCTheme[];
  suggestions: VoCTheme[];
}

// ============================================================================
// AI-Generated Insights Types
// ============================================================================

export interface AIInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'trend' | 'recommendation' | 'alert';
  title: string;
  description: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  relatedMetrics?: string[];
  suggestedActions?: string[];
  createdAt: string;
}

export interface AudienceSegment {
  id: string;
  name: string;
  description: string;
  size: number;
  percentage: number;
  characteristics: {
    demographics?: Partial<Demographics>;
    interests?: string[];
    behaviors?: string[];
    sentiment?: SentimentType;
  };
  engagementRate: number;
  value: 'low' | 'medium' | 'high';
}

// ============================================================================
// Main Audience Data Types
// ============================================================================

export interface AudienceOverview {
  workspaceId: string;
  period: {
    start: string;
    end: string;
  };
  totalComments: number;
  totalEngagement: number;
  sentimentAnalysis: SentimentAnalysis;
  demographics: Demographics;
  topKeywords: KeywordData[];
  trendingTopics: TopicCluster[];
  insights: AIInsight[];
  updatedAt: string;
}

export interface AudienceReport {
  id: string;
  workspaceId: string;
  name: string;
  period: {
    start: string;
    end: string;
  };
  overview: AudienceOverview;
  commentInsights: CommentInsights;
  voiceOfCustomer: VoiceOfCustomer;
  segments: AudienceSegment[];
  exportData: {
    csvUrl?: string;
    pdfUrl?: string;
    jsonUrl?: string;
  };
  createdAt: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface AnalyzeSentimentRequest {
  workspaceId: string;
  platform?: 'instagram' | 'tiktok' | 'all';
  period?: '7d' | '30d' | '90d' | 'custom';
  startDate?: string;
  endDate?: string;
  contentTypes?: string[];
}

export interface ExportAudienceDataRequest {
  workspaceId: string;
  format: 'csv' | 'pdf' | 'json';
  period?: '7d' | '30d' | '90d' | 'custom';
  startDate?: string;
  endDate?: string;
  sections?: string[];
}

export interface KeywordFilter {
  sentiment?: SentimentType[];
  minFrequency?: number;
  trendingOnly?: boolean;
  search?: string;
}

export interface CommentFilter {
  sentiment?: SentimentType[];
  category?: string[];
  platform?: string[];
  dateRange?: { start: string; end: string };
  minEngagement?: number;
  search?: string;
}

// ============================================================================
// Sentiment Analysis Explanation Types
// ============================================================================

export interface SentimentExplanation {
  overallScore: number;
  confidence: number;
  factors: {
    positive: Array<{
      text: string;
      weight: number;
      category: string;
    }>;
    negative: Array<{
      text: string;
      weight: number;
      category: string;
    }>;
    neutral: Array<{
      text: string;
      weight: number;
      category: string;
    }>;
  };
  summary: string;
  keyPhrases: string[];
  toneIndicators: {
    formality: 'formal' | 'casual' | 'mixed';
    enthusiasm: 'low' | 'medium' | 'high';
    urgency: 'low' | 'medium' | 'high';
  };
}
