/**
 * Competitor Comparison Service
 * Compare multiple competitors and generate insights
 */

import type {
  Competitor,
  CompetitorPost,
  CompetitorMetrics,
  CompetitorComparison,
  CompetitorSnapshot,
  ComparisonMetrics,
  ComparisonInsight,
  ContentGap,
  HashtagOverlap,
  DateRange,
  ContentType,
  ContentTypePerformance,
} from '@/types/competitor';
import {
  calculateAvgEngagementRate,
  analyzeContentTypePerformance,
  analyzeHashtags,
  getTopPerformingPosts,
  analyzeBestPostingTimes,
} from './analyzer';

// Re-export analyzer functions for convenience
export {
  analyzeContentTypePerformance,
  analyzeHashtags,
  getTopPerformingPosts,
  analyzeBestPostingTimes,
};

// ============================================================================
// COMPETITOR COMPARISON
// ============================================================================

interface CompetitorData {
  competitor: Competitor;
  posts: CompetitorPost[];
  metrics: CompetitorMetrics[];
}

/**
 * Compare multiple competitors
 */
export function compareCompetitors(
  data: CompetitorData[],
  dateRange: DateRange,
  yourData?: CompetitorData
): CompetitorComparison {
  const allPosts = data.flatMap((d) => d.posts);

  // Generate snapshots for each competitor
  const snapshots: CompetitorSnapshot[] = data.map(({ competitor, posts, metrics }) => {
    const recentMetrics = metrics[metrics.length - 1];
    const previousMetrics = metrics[metrics.length - 2];
    const topPost = getTopPerformingPosts(posts, 1)[0];

    return {
      id: competitor.id,
      username: competitor.username,
      displayName: competitor.displayName,
      platform: competitor.platform,
      profileImage: competitor.profileImage,
      followers: recentMetrics?.followers || competitor.followers,
      engagementRate: recentMetrics?.avgEngagementRate || 0,
      postsCount: recentMetrics?.postsInPeriod || posts.length,
      avgLikes: recentMetrics?.avgLikes || 0,
      avgComments: recentMetrics?.avgComments || 0,
      growthRate: previousMetrics
        ? ((recentMetrics.followers - previousMetrics.followers) / previousMetrics.followers) * 100
        : 0,
      topPerformingPost: topPost,
    };
  });

  // Calculate comparison metrics
  const comparisonMetrics = calculateComparisonMetrics(snapshots);

  // Generate insights
  const insights = generateComparisonInsights(snapshots, data, yourData);

  return {
    competitors: snapshots,
    dateRange,
    metrics: comparisonMetrics,
    insights,
  };
}

/**
 * Calculate aggregate comparison metrics
 */
function calculateComparisonMetrics(snapshots: CompetitorSnapshot[]): ComparisonMetrics {
  const totalFollowers = snapshots.reduce((sum, s) => sum + s.followers, 0);
  const avgEngagementRate =
    snapshots.reduce((sum, s) => sum + s.engagementRate, 0) / snapshots.length;
  const totalPosts = snapshots.reduce((sum, s) => sum + s.postsCount, 0);
  const totalEngagement = snapshots.reduce(
    (sum, s) => sum + s.avgLikes + s.avgComments,
    0
  );

  // Distribution calculations
  const engagementDistribution: Record<string, number> = {};
  const followerDistribution: Record<string, number> = {};

  snapshots.forEach((snapshot) => {
    engagementDistribution[snapshot.username] = snapshot.engagementRate;
    followerDistribution[snapshot.username] = snapshot.followers;
  });

  return {
    totalFollowers,
    avgEngagementRate,
    totalPosts,
    totalEngagement,
    engagementDistribution,
    followerDistribution,
  };
}

/**
 * Generate comparison insights
 */
function generateComparisonInsights(
  snapshots: CompetitorSnapshot[],
  data: CompetitorData[],
  yourData?: CompetitorData
): ComparisonInsight[] {
  const insights: ComparisonInsight[] = [];

  // Find engagement leader
  const engagementLeader = [...snapshots].sort((a, b) => b.engagementRate - a.engagementRate)[0];
  insights.push({
    type: 'strength',
    title: 'Engagement Leader',
    description: `${engagementLeader.username} has the highest engagement rate at ${engagementLeader.engagementRate.toFixed(2)}%`,
    competitorId: engagementLeader.id,
    metric: 'engagement_rate',
    value: engagementLeader.engagementRate,
  });

  // Find growth leader
  const growthLeader = [...snapshots].sort((a, b) => b.growthRate - a.growthRate)[0];
  if (growthLeader.growthRate > 0) {
    insights.push({
      type: 'opportunity',
      title: 'Fastest Growing',
      description: `${growthLeader.username} is growing at ${growthLeader.growthRate.toFixed(1)}%`,
      competitorId: growthLeader.id,
      metric: 'growth_rate',
      value: growthLeader.growthRate,
    });
  }

  // Find follower leader (potential threat)
  const followerLeader = [...snapshots].sort((a, b) => b.followers - a.followers)[0];
  insights.push({
    type: 'threat',
    title: 'Market Leader',
    description: `${followerLeader.username} has the largest audience with ${followerLeader.followers.toLocaleString()} followers`,
    competitorId: followerLeader.id,
    metric: 'followers',
    value: followerLeader.followers,
  });

  // Compare with your data if provided
  if (yourData) {
    const yourSnapshot = snapshots.find((s) => s.id === yourData.competitor.id);
    if (yourSnapshot) {
      // Find competitors outperforming you
      const betterEngagement = snapshots.filter(
        (s) => s.id !== yourData.competitor.id && s.engagementRate > yourSnapshot.engagementRate
      );
      if (betterEngagement.length > 0) {
        insights.push({
          type: 'weakness',
          title: 'Engagement Gap',
          description: `${betterEngagement.length} competitor(s) have higher engagement rates than you`,
          metric: 'engagement_rate',
          value: betterEngagement.length,
        });
      }
    }
  }

  // Content type insights
  const allContentTypes = new Set<ContentType>();
  data.forEach(({ posts }) => {
    posts.forEach((post) => allContentTypes.add(post.contentType));
  });

  if (allContentTypes.size > 1) {
    insights.push({
      type: 'opportunity',
      title: 'Content Diversity',
      description: `Competitors are using ${allContentTypes.size} different content types`,
      metric: 'content_types',
      value: allContentTypes.size,
    });
  }

  return insights;
}

// ============================================================================
// CONTENT GAP ANALYSIS
// ============================================================================

/**
 * Analyze content gaps between you and competitors
 */
export function analyzeContentGaps(
  yourPosts: CompetitorPost[],
  competitorPosts: CompetitorPost[]
): ContentGap[] {
  const contentTypes: ContentType[] = ['post', 'reel', 'carousel', 'video'];
  const yourPerformance = analyzeContentTypePerformance(yourPosts);
  const competitorPerformance = analyzeContentTypePerformance(competitorPosts);

  const gaps: ContentGap[] = [];

  contentTypes.forEach((contentType) => {
    const yourData = yourPerformance.find((p) => p.contentType === contentType);
    const competitorData = competitorPerformance.find((p) => p.contentType === contentType);

    const yourFrequency = yourData?.count || 0;
    const competitorAvgFrequency = competitorData?.count || 0;
    const gap = competitorAvgFrequency - yourFrequency;

    let opportunity: 'high' | 'medium' | 'low' = 'low';
    if (gap > 10) opportunity = 'high';
    else if (gap > 5) opportunity = 'medium';

    gaps.push({
      contentType,
      competitorAvgFrequency,
      yourFrequency,
      gap,
      opportunity,
    });
  });

  return gaps.sort((a, b) => b.gap - a.gap);
}

/**
 * Analyze posting time gaps
 */
export function analyzePostingTimeGaps(
  yourPosts: CompetitorPost[],
  competitorPosts: CompetitorPost[]
): Array<{
  dayOfWeek: number;
  hourOfDay: number;
  competitorAvgEngagement: number;
  yourAvgEngagement: number;
  gap: number;
  recommendation: string;
}> {
  const yourTimes = analyzeBestPostingTimes(yourPosts);
  const competitorTimes = analyzeBestPostingTimes(competitorPosts);

  const gaps: Array<{
    dayOfWeek: number;
    hourOfDay: number;
    competitorAvgEngagement: number;
    yourAvgEngagement: number;
    gap: number;
    recommendation: string;
  }> = [];

  // Find times where competitors perform well but you don't post
  competitorTimes.slice(0, 10).forEach((compTime) => {
    const yourTime = yourTimes.find(
      (t) => t.dayOfWeek === compTime.dayOfWeek && t.hourOfDay === compTime.hourOfDay
    );

    const yourEngagement = yourTime?.avgEngagementRate || 0;
    const gap = compTime.avgEngagementRate - yourEngagement;

    if (gap > 0.5) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const period = compTime.hourOfDay < 12 ? 'AM' : 'PM';
      const hour12 = compTime.hourOfDay % 12 || 12;

      gaps.push({
        dayOfWeek: compTime.dayOfWeek,
        hourOfDay: compTime.hourOfDay,
        competitorAvgEngagement: compTime.avgEngagementRate,
        yourAvgEngagement: yourEngagement,
        gap,
        recommendation: `Try posting on ${dayNames[compTime.dayOfWeek]}s around ${hour12}${period}`,
      });
    }
  });

  return gaps.sort((a, b) => b.gap - a.gap);
}

// ============================================================================
// HASHTAG OVERLAP ANALYSIS
// ============================================================================

/**
 * Analyze hashtag overlap between you and competitors
 */
export function analyzeHashtagOverlap(
  yourPosts: CompetitorPost[],
  competitorPosts: CompetitorPost[]
): HashtagOverlap[] {
  const yourHashtags = analyzeHashtags(yourPosts);
  const competitorHashtags = analyzeHashtags(competitorPosts);

  const allHashtags = new Set([
    ...yourHashtags.map((h) => h.hashtag),
    ...competitorHashtags.map((h) => h.hashtag),
  ]);

  const overlaps: HashtagOverlap[] = [];

  allHashtags.forEach((hashtag) => {
    const yourData = yourHashtags.find((h) => h.hashtag === hashtag);
    const competitorData = competitorHashtags.find((h) => h.hashtag === hashtag);

    const yourUsage = yourData?.usageCount || 0;
    const competitorUsage = competitorData?.usageCount || 0;
    const overlap = yourUsage > 0 && competitorUsage > 0;

    let performance: 'better' | 'worse' | 'similar' = 'similar';
    if (yourData && competitorData) {
      const diff = yourData.avgEngagementRate - competitorData.avgEngagementRate;
      if (diff > 0.5) performance = 'better';
      else if (diff < -0.5) performance = 'worse';
    }

    overlaps.push({
      hashtag,
      yourUsage,
      competitorUsage,
      overlap,
      performance,
    });
  });

  return overlaps.sort((a, b) => {
    // Sort by overlap first, then by competitor usage
    if (a.overlap !== b.overlap) return a.overlap ? -1 : 1;
    return b.competitorUsage - a.competitorUsage;
  });
}

/**
 * Get untapped hashtags that competitors use but you don't
 */
export function getUntappedHashtags(
  yourPosts: CompetitorPost[],
  competitorPosts: CompetitorPost[],
  limit: number = 20
): string[] {
  const overlap = analyzeHashtagOverlap(yourPosts, competitorPosts);
  return overlap
    .filter((h) => h.yourUsage === 0 && h.competitorUsage >= 3)
    .sort((a, b) => b.competitorUsage - a.competitorUsage)
    .slice(0, limit)
    .map((h) => h.hashtag);
}

// ============================================================================
// SHARE OF VOICE
// ============================================================================

export interface ShareOfVoice {
  totalEngagement: number;
  shares: Record<string, {
    username: string;
    engagement: number;
    percentage: number;
    posts: number;
  }>;
}

/**
 * Calculate share of voice across competitors
 */
export function calculateShareOfVoice(data: CompetitorData[]): ShareOfVoice {
  const shares: Record<string, ShareOfVoice['shares'][string]> = {};
  let totalEngagement = 0;

  data.forEach(({ competitor, posts }) => {
    const engagement = posts.reduce(
      (sum, p) => sum + p.likes + p.comments + p.shares + p.saves,
      0
    );

    shares[competitor.id] = {
      username: competitor.username,
      engagement,
      percentage: 0, // Will calculate after getting total
      posts: posts.length,
    };

    totalEngagement += engagement;
  });

  // Calculate percentages
  Object.values(shares).forEach((share) => {
    share.percentage = totalEngagement > 0 ? (share.engagement / totalEngagement) * 100 : 0;
  });

  return {
    totalEngagement,
    shares,
  };
}

// ============================================================================
// BENCHMARKING
// ============================================================================

export interface BenchmarkResult {
  metric: string;
  yourValue: number;
  industryAverage: number;
  percentile: number;
  status: 'above' | 'below' | 'average';
}

/**
 * Benchmark metrics against industry averages
 */
export function benchmarkAgainstIndustry(
  yourMetrics: CompetitorMetrics,
  competitorMetrics: CompetitorMetrics[],
  niche: string
): BenchmarkResult[] {
  const benchmarks: BenchmarkResult[] = [];

  // Engagement rate benchmark
  const allEngagementRates = competitorMetrics.map((m) => m.avgEngagementRate);
  const avgEngagementRate =
    allEngagementRates.reduce((a, b) => a + b, 0) / allEngagementRates.length;

  const sortedEngagement = [...allEngagementRates].sort((a, b) => a - b);
  const engagementPercentile =
    (sortedEngagement.filter((r) => r < yourMetrics.avgEngagementRate).length /
      sortedEngagement.length) *
    100;

  benchmarks.push({
    metric: 'Engagement Rate',
    yourValue: yourMetrics.avgEngagementRate,
    industryAverage: avgEngagementRate,
    percentile: engagementPercentile,
    status: yourMetrics.avgEngagementRate > avgEngagementRate ? 'above' : 'below',
  });

  // Posts frequency benchmark
  const allPostCounts = competitorMetrics.map((m) => m.postsInPeriod);
  const avgPostCount = allPostCounts.reduce((a, b) => a + b, 0) / allPostCounts.length;

  const sortedPosts = [...allPostCounts].sort((a, b) => a - b);
  const postsPercentile =
    (sortedPosts.filter((c) => c < yourMetrics.postsInPeriod).length / sortedPosts.length) * 100;

  benchmarks.push({
    metric: 'Posting Frequency',
    yourValue: yourMetrics.postsInPeriod,
    industryAverage: avgPostCount,
    percentile: postsPercentile,
    status:
      yourMetrics.postsInPeriod > avgPostCount
        ? 'above'
        : yourMetrics.postsInPeriod < avgPostCount
          ? 'below'
          : 'average',
  });

  return benchmarks;
}

// ============================================================================
// SIDE-BY-SIDE COMPARISON
// ============================================================================

export interface SideBySideComparison {
  categories: string[];
  competitors: Array<{
    id: string;
    username: string;
    profileImage?: string;
    values: (string | number)[];
  }>;
}

/**
 * Generate side-by-side comparison table data
 */
export function generateSideBySideComparison(
  data: CompetitorData[],
  categories: ('followers' | 'engagement' | 'posts' | 'growth' | 'avgLikes' | 'avgComments')[] = [
    'followers',
    'engagement',
    'posts',
    'growth',
    'avgLikes',
    'avgComments',
  ]
): SideBySideComparison {
  const categoryLabels: Record<string, string> = {
    followers: 'Followers',
    engagement: 'Engagement Rate',
    posts: 'Posts (30 days)',
    growth: 'Growth Rate',
    avgLikes: 'Avg Likes',
    avgComments: 'Avg Comments',
  };

  const competitors = data.map(({ competitor, posts, metrics }) => {
    const latestMetrics = metrics[metrics.length - 1];
    const previousMetrics = metrics[metrics.length - 2];

    const values = categories.map((cat) => {
      switch (cat) {
        case 'followers':
          return latestMetrics?.followers.toLocaleString() || '0';
        case 'engagement':
          return `${(latestMetrics?.avgEngagementRate || 0).toFixed(2)}%`;
        case 'posts':
          return latestMetrics?.postsInPeriod || 0;
        case 'growth':
          if (previousMetrics && latestMetrics) {
            const growth =
              ((latestMetrics.followers - previousMetrics.followers) /
                previousMetrics.followers) *
              100;
            return `${growth.toFixed(1)}%`;
          }
          return 'N/A';
        case 'avgLikes':
          return Math.round(latestMetrics?.avgLikes || 0).toLocaleString();
        case 'avgComments':
          return Math.round(latestMetrics?.avgComments || 0).toLocaleString();
        default:
          return '-';
      }
    });

    return {
      id: competitor.id,
      username: competitor.username,
      profileImage: competitor.profileImage,
      values,
    };
  });

  return {
    categories: categories.map((c) => categoryLabels[c]),
    competitors,
  };
}
