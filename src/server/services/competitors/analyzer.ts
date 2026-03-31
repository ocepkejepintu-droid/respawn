/**
 * Competitor Analysis Service
 * Analyzes competitor data and generates insights
 */

import type {
  Competitor,
  CompetitorPost,
  CompetitorMetrics,
  EngagementTrend,
  ContentTypePerformance,
  HashtagAnalysis,
  BestPostingTime,
  ContentType,
  CompetitorInsight,
  InsightType,
  DateRange,
} from '@/types/competitor';

// ============================================================================
// ENGAGEMENT ANALYSIS
// ============================================================================

/**
 * Calculate engagement rate for a post
 */
export function calculateEngagementRate(
  post: Pick<CompetitorPost, 'likes' | 'comments' | 'shares' | 'saves'>,
  followerCount: number
): number {
  if (followerCount === 0) return 0;
  const totalEngagement = post.likes + post.comments + post.shares + post.saves;
  return (totalEngagement / followerCount) * 100;
}

/**
 * Calculate average engagement rate across multiple posts
 */
export function calculateAvgEngagementRate(posts: CompetitorPost[], followerCount: number): number {
  if (posts.length === 0 || followerCount === 0) return 0;
  const totalEngagement = posts.reduce((sum, post) => {
    return sum + post.likes + post.comments + post.shares + post.saves;
  }, 0);
  return (totalEngagement / posts.length / followerCount) * 100;
}

/**
 * Generate engagement trends over time
 */
export function generateEngagementTrends(
  posts: CompetitorPost[],
  dateRange: DateRange,
  granularity: 'day' | 'week' | 'month' = 'day'
): EngagementTrend[] {
  const trends = new Map<string, { posts: CompetitorPost[] }>();

  // Group posts by date
  posts.forEach((post) => {
    const date = new Date(post.postedAt);
    let key: string;

    if (granularity === 'day') {
      key = date.toISOString().split('T')[0];
    } else if (granularity === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    if (!trends.has(key)) {
      trends.set(key, { posts: [] });
    }
    trends.get(key)!.posts.push(post);
  });

  // Calculate metrics for each period
  return Array.from(trends.entries())
    .map(([date, data]) => {
      const totalEngagement = data.posts.reduce((sum, post) => {
        return sum + post.likes + post.comments + post.shares + post.saves;
      }, 0);

      return {
        date,
        engagementRate: data.posts.length > 0 ? totalEngagement / data.posts.length : 0,
        likes: data.posts.reduce((sum, p) => sum + p.likes, 0),
        comments: data.posts.reduce((sum, p) => sum + p.comments, 0),
        shares: data.posts.reduce((sum, p) => sum + p.shares, 0),
        saves: data.posts.reduce((sum, p) => sum + p.saves, 0),
        postsCount: data.posts.length,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ============================================================================
// CONTENT TYPE ANALYSIS
// ============================================================================

/**
 * Analyze performance by content type
 */
export function analyzeContentTypePerformance(posts: CompetitorPost[]): ContentTypePerformance[] {
  const typeMap = new Map<ContentType, CompetitorPost[]>();

  // Group posts by content type
  posts.forEach((post) => {
    if (!typeMap.has(post.contentType)) {
      typeMap.set(post.contentType, []);
    }
    typeMap.get(post.contentType)!.push(post);
  });

  const totalPosts = posts.length;

  // Calculate metrics for each content type
  return Array.from(typeMap.entries()).map(([contentType, typePosts]) => {
    const totalEngagement = typePosts.reduce((sum, post) => {
      return sum + post.likes + post.comments + post.shares + post.saves;
    }, 0);

    const avgEngagementRate =
      typePosts.reduce((sum, post) => sum + post.engagementRate, 0) / typePosts.length;

    return {
      contentType,
      count: typePosts.length,
      avgEngagementRate,
      avgLikes: typePosts.reduce((sum, p) => sum + p.likes, 0) / typePosts.length,
      avgComments: typePosts.reduce((sum, p) => sum + p.comments, 0) / typePosts.length,
      avgShares: typePosts.reduce((sum, p) => sum + p.shares, 0) / typePosts.length,
      avgViews: typePosts.reduce((sum, p) => sum + (p.views || 0), 0) / typePosts.length || undefined,
      totalEngagement,
      percentageOfTotal: (typePosts.length / totalPosts) * 100,
    };
  });
}

/**
 * Get best performing content types
 */
export function getBestPerformingContentTypes(
  posts: CompetitorPost[],
  limit: number = 3
): ContentTypePerformance[] {
  const performance = analyzeContentTypePerformance(posts);
  return performance
    .filter((p) => p.count >= 3) // Minimum sample size
    .sort((a, b) => b.avgEngagementRate - a.avgEngagementRate)
    .slice(0, limit);
}

// ============================================================================
// HASHTAG ANALYSIS
// ============================================================================

/**
 * Analyze hashtag performance
 */
export function analyzeHashtags(posts: CompetitorPost[]): HashtagAnalysis[] {
  const hashtagMap = new Map<
    string,
    {
      posts: CompetitorPost[];
      competitorIds: Set<string>;
    }
  >();

  posts.forEach((post) => {
    post.hashtags.forEach((hashtag) => {
      const normalized = hashtag.toLowerCase();
      if (!hashtagMap.has(normalized)) {
        hashtagMap.set(normalized, { posts: [], competitorIds: new Set() });
      }
      const data = hashtagMap.get(normalized)!;
      data.posts.push(post);
      data.competitorIds.add(post.competitorId);
    });
  });

  const totalPosts = posts.length;

  return Array.from(hashtagMap.entries())
    .map(([hashtag, data]) => {
      const avgEngagementRate =
        data.posts.reduce((sum, post) => sum + post.engagementRate, 0) / data.posts.length;

      const totalReach = data.posts.reduce((sum, post) => sum + (post.reach || 0), 0);

      return {
        hashtag,
        usageCount: data.posts.length,
        avgEngagementRate,
        totalReach,
        avgLikes: data.posts.reduce((sum, p) => sum + p.likes, 0) / data.posts.length,
        competitorIds: Array.from(data.competitorIds),
        frequency: (data.posts.length / totalPosts) * 100,
      };
    })
    .sort((a, b) => b.avgEngagementRate - a.avgEngagementRate);
}

/**
 * Get top performing hashtags
 */
export function getTopHashtags(
  posts: CompetitorPost[],
  minUsage: number = 3,
  limit: number = 20
): HashtagAnalysis[] {
  return analyzeHashtags(posts)
    .filter((h) => h.usageCount >= minUsage)
    .slice(0, limit);
}

/**
 * Find trending hashtags (increasing usage recently)
 */
export function findTrendingHashtags(
  posts: CompetitorPost[],
  daysWindow: number = 14
): HashtagAnalysis[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysWindow);

  const recentPosts = posts.filter((p) => new Date(p.postedAt) >= cutoffDate);
  return getTopHashtags(recentPosts, 2, 10);
}

// ============================================================================
// POSTING TIME ANALYSIS
// ============================================================================

/**
 * Analyze best posting times
 */
export function analyzeBestPostingTimes(posts: CompetitorPost[]): BestPostingTime[] {
  const timeMap = new Map<string, { posts: CompetitorPost[] }>();

  posts.forEach((post) => {
    const date = new Date(post.postedAt);
    const dayOfWeek = date.getDay();
    const hourOfDay = date.getHours();
    const key = `${dayOfWeek}-${hourOfDay}`;

    if (!timeMap.has(key)) {
      timeMap.set(key, { posts: [] });
    }
    timeMap.get(key)!.posts.push(post);
  });

  return Array.from(timeMap.entries())
    .map(([key, data]) => {
      const [dayOfWeek, hourOfDay] = key.split('-').map(Number);
      const avgEngagementRate =
        data.posts.reduce((sum, post) => sum + post.engagementRate, 0) / data.posts.length;

      return {
        dayOfWeek,
        hourOfDay,
        avgEngagementRate,
        confidence: Math.min(data.posts.length / 5, 1), // Confidence based on sample size
      };
    })
    .sort((a, b) => b.avgEngagementRate - a.avgEngagementRate);
}

/**
 * Get optimal posting schedule
 */
export function getOptimalPostingSchedule(
  posts: CompetitorPost[],
  slotsPerDay: number = 3
): BestPostingTime[] {
  const allTimes = analyzeBestPostingTimes(posts);
  const schedule: BestPostingTime[] = [];

  // Group by day and pick best times
  for (let day = 0; day < 7; day++) {
    const dayTimes = allTimes
      .filter((t) => t.dayOfWeek === day)
      .sort((a, b) => b.avgEngagementRate - a.avgEngagementRate)
      .slice(0, slotsPerDay);
    schedule.push(...dayTimes);
  }

  return schedule.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.hourOfDay - b.hourOfDay);
}

// ============================================================================
// CAPTION ANALYSIS
// ============================================================================

export interface CaptionAnalysis {
  avgLength: number;
  optimalLength: { min: number; max: number };
  avgHashtags: number;
  avgMentions: number;
  commonOpenings: string[];
  commonCTAs: string[];
}

/**
 * Analyze caption patterns
 */
export function analyzeCaptions(posts: CompetitorPost[]): CaptionAnalysis {
  if (posts.length === 0) {
    return {
      avgLength: 0,
      optimalLength: { min: 0, max: 0 },
      avgHashtags: 0,
      avgMentions: 0,
      commonOpenings: [],
      commonCTAs: [],
    };
  }

  const lengths = posts.map((p) => p.captionLength);
  const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;

  // Find optimal length range (top 25% performing posts)
  const sortedByEngagement = [...posts].sort((a, b) => b.engagementRate - a.engagementRate);
  const topPosts = sortedByEngagement.slice(0, Math.ceil(posts.length * 0.25));
  const topLengths = topPosts.map((p) => p.captionLength);

  return {
    avgLength: Math.round(avgLength),
    optimalLength: {
      min: Math.round(Math.min(...topLengths)),
      max: Math.round(Math.max(...topLengths)),
    },
    avgHashtags: posts.reduce((sum, p) => sum + p.hashtags.length, 0) / posts.length,
    avgMentions: posts.reduce((sum, p) => sum + p.mentions.length, 0) / posts.length,
    commonOpenings: extractCommonPhrases(posts.map((p) => p.caption), 3),
    commonCTAs: extractCTAs(posts.map((p) => p.caption)),
  };
}

function extractCommonPhrases(captions: string[], wordCount: number): string[] {
  const phrases: Record<string, number> = {};

  captions.forEach((caption) => {
    const words = caption.toLowerCase().split(/\s+/);
    for (let i = 0; i <= words.length - wordCount; i++) {
      const phrase = words.slice(i, i + wordCount).join(' ');
      phrases[phrase] = (phrases[phrase] || 0) + 1;
    }
  });

  return Object.entries(phrases)
    .filter(([_, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([phrase]) => phrase);
}

function extractCTAs(captions: string[]): string[] {
  const ctaPatterns = [
    /(?:follow|follow us|follow me)/i,
    /(?:like|double tap|hit like)/i,
    /(?:comment|drop a comment|let us know)/i,
    /(?:share|repost|tag a friend)/i,
    /(?:save|bookmark)/i,
    /(?:click|tap|swipe up|link in bio)/i,
    /(?:buy|shop|order|get yours)/i,
    /(?:subscribe|join|become a member)/i,
  ];

  const ctas: string[] = [];
  captions.forEach((caption) => {
    ctaPatterns.forEach((pattern) => {
      const match = caption.match(pattern);
      if (match && !ctas.includes(match[0])) {
        ctas.push(match[0]);
      }
    });
  });

  return ctas.slice(0, 5);
}

// ============================================================================
// INSIGHTS GENERATION
// ============================================================================

/**
 * Generate insights from competitor data
 */
export function generateInsights(
  competitor: Competitor,
  currentMetrics: CompetitorMetrics,
  previousMetrics: CompetitorMetrics | null,
  recentPosts: CompetitorPost[]
): CompetitorInsight[] {
  const insights: CompetitorInsight[] = [];

  if (!previousMetrics) return insights;

  // Engagement change
  const engagementChange =
    ((currentMetrics.avgEngagementRate - previousMetrics.avgEngagementRate) /
      previousMetrics.avgEngagementRate) *
    100;

  if (engagementChange > 20) {
    insights.push({
      id: `engagement_spike_${Date.now()}`,
      competitorId: competitor.id,
      type: 'engagement_spike',
      title: 'Engagement Rate Spike',
      description: `${competitor.username}'s engagement rate increased by ${engagementChange.toFixed(1)}%`,
      severity: 'info',
      metric: 'engagement_rate',
      value: currentMetrics.avgEngagementRate,
      change: engagementChange,
      createdAt: new Date(),
    });
  } else if (engagementChange < -20) {
    insights.push({
      id: `engagement_drop_${Date.now()}`,
      competitorId: competitor.id,
      type: 'engagement_drop',
      title: 'Engagement Rate Drop',
      description: `${competitor.username}'s engagement rate decreased by ${Math.abs(engagementChange).toFixed(1)}%`,
      severity: 'warning',
      metric: 'engagement_rate',
      value: currentMetrics.avgEngagementRate,
      change: engagementChange,
      createdAt: new Date(),
    });
  }

  // Follower growth
  const followerChange = currentMetrics.followers - previousMetrics.followers;
  const followerChangePercent = (followerChange / previousMetrics.followers) * 100;

  if (followerChangePercent > 5) {
    insights.push({
      id: `follower_growth_${Date.now()}`,
      competitorId: competitor.id,
      type: 'follower_growth',
      title: 'Rapid Follower Growth',
      description: `${competitor.username} gained ${followerChange.toLocaleString()} followers (${followerChangePercent.toFixed(1)}%)`,
      severity: 'info',
      metric: 'followers',
      value: currentMetrics.followers,
      change: followerChange,
      createdAt: new Date(),
    });
  } else if (followerChangePercent < -2) {
    insights.push({
      id: `follower_loss_${Date.now()}`,
      competitorId: competitor.id,
      type: 'follower_loss',
      title: 'Follower Loss Detected',
      description: `${competitor.username} lost ${Math.abs(followerChange).toLocaleString()} followers`,
      severity: 'warning',
      metric: 'followers',
      value: currentMetrics.followers,
      change: followerChange,
      createdAt: new Date(),
    });
  }

  // Viral content detection
  const avgEngagement = recentPosts.reduce((sum, p) => sum + p.engagementRate, 0) / recentPosts.length;
  const viralPosts = recentPosts.filter((p) => p.engagementRate > avgEngagement * 3);

  viralPosts.forEach((post) => {
    insights.push({
      id: `viral_content_${post.id}`,
      competitorId: competitor.id,
      type: 'viral_content',
      title: 'Viral Content Detected',
      description: `A ${post.contentType} from ${competitor.username} performed ${(post.engagementRate / avgEngagement).toFixed(1)}x above average`,
      severity: 'info',
      metric: 'engagement_rate',
      value: post.engagementRate,
      createdAt: new Date(),
    });
  });

  // Posting frequency change
  const postsChange = currentMetrics.postsInPeriod - previousMetrics.postsInPeriod;
  if (Math.abs(postsChange) >= 5) {
    insights.push({
      id: `posting_frequency_${Date.now()}`,
      competitorId: competitor.id,
      type: 'posting_frequency_change',
      title: postsChange > 0 ? 'Increased Posting Frequency' : 'Decreased Posting Frequency',
      description: `${competitor.username} ${postsChange > 0 ? 'increased' : 'decreased'} posting by ${Math.abs(postsChange)} posts`,
      severity: 'info',
      metric: 'posts_count',
      value: currentMetrics.postsInPeriod,
      change: postsChange,
      createdAt: new Date(),
    });
  }

  return insights;
}

// ============================================================================
// TOP PERFORMING CONTENT
// ============================================================================

/**
 * Get top performing posts
 */
export function getTopPerformingPosts(
  posts: CompetitorPost[],
  limit: number = 10,
  metric: 'engagement' | 'likes' | 'comments' | 'shares' | 'saves' | 'views' = 'engagement'
): CompetitorPost[] {
  const sorted = [...posts].sort((a, b) => {
    switch (metric) {
      case 'likes':
        return b.likes - a.likes;
      case 'comments':
        return b.comments - a.comments;
      case 'shares':
        return b.shares - a.shares;
      case 'saves':
        return b.saves - a.saves;
      case 'views':
        return (b.views || 0) - (a.views || 0);
      case 'engagement':
      default:
        return b.engagementRate - a.engagementRate;
    }
  });

  return sorted.slice(0, limit);
}

// ============================================================================
// METRICS SUMMARY
// ============================================================================

export interface MetricsSummary {
  totalPosts: number;
  totalEngagement: number;
  avgEngagementRate: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  avgSaves: number;
  bestPerformingContentType: ContentType;
  bestPostingDay: number;
  bestPostingHour: number;
  growthRate: number;
}

/**
 * Generate metrics summary
 */
export function generateMetricsSummary(
  posts: CompetitorPost[],
  metrics: CompetitorMetrics[]
): MetricsSummary {
  const totalPosts = posts.length;
  const totalEngagement = posts.reduce((sum, p) => sum + p.likes + p.comments + p.shares + p.saves, 0);
  const avgEngagementRate =
    posts.reduce((sum, p) => sum + p.engagementRate, 0) / (totalPosts || 1);

  const contentTypePerformance = analyzeContentTypePerformance(posts);
  const bestPerformingContentType =
    contentTypePerformance.sort((a, b) => b.avgEngagementRate - a.avgEngagementRate)[0]
      ?.contentType || 'post';

  const bestTimes = analyzeBestPostingTimes(posts);
  const bestTime = bestTimes[0] || { dayOfWeek: 0, hourOfDay: 12 };

  // Calculate growth rate from metrics history
  const growthRate =
    metrics.length >= 2
      ? ((metrics[metrics.length - 1].followers - metrics[0].followers) / metrics[0].followers) * 100
      : 0;

  return {
    totalPosts,
    totalEngagement,
    avgEngagementRate,
    avgLikes: posts.reduce((sum, p) => sum + p.likes, 0) / (totalPosts || 1),
    avgComments: posts.reduce((sum, p) => sum + p.comments, 0) / (totalPosts || 1),
    avgShares: posts.reduce((sum, p) => sum + p.shares, 0) / (totalPosts || 1),
    avgSaves: posts.reduce((sum, p) => sum + p.saves, 0) / (totalPosts || 1),
    bestPerformingContentType,
    bestPostingDay: bestTime.dayOfWeek,
    bestPostingHour: bestTime.hourOfDay,
    growthRate,
  };
}
