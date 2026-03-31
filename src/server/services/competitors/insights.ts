/**
 * Competitor Insights Service
 * Generates actionable recommendations based on competitor analysis
 */

import type {
  Competitor,
  CompetitorPost,
  CompetitorMetrics,
  Recommendation,
  RecommendationType,
  ContentGap,
  HashtagOverlap,
  ContentType,
  ContentTypePerformance,
  BestPostingTime,
} from '@/types/competitor';
import {
  analyzeContentTypePerformance,
  analyzeBestPostingTimes,
  getTopPerformingPosts,
  analyzeHashtags,
  getUntappedHashtags,
  analyzePostingTimeGaps,
} from './comparison';

// ============================================================================
// RECOMMENDATION ENGINE
// ============================================================================

interface AnalysisContext {
  yourPosts: CompetitorPost[];
  yourMetrics: CompetitorMetrics[];
  competitorPosts: CompetitorPost[];
  competitorMetrics: CompetitorMetrics[];
  contentGaps: ContentGap[];
  hashtagOverlap: HashtagOverlap[];
  topCompetitorPosts: CompetitorPost[];
}

/**
 * Generate comprehensive recommendations
 */
export function generateRecommendations(context: AnalysisContext): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Content strategy recommendations
  recommendations.push(...generateContentStrategyRecommendations(context));

  // Posting schedule recommendations
  recommendations.push(...generateScheduleRecommendations(context));

  // Hashtag recommendations
  recommendations.push(...generateHashtagRecommendations(context));

  // Engagement tactics
  recommendations.push(...generateEngagementRecommendations(context));

  // Content format recommendations
  recommendations.push(...generateContentFormatRecommendations(context));

  // Sort by priority
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// ============================================================================
// CONTENT STRATEGY RECOMMENDATIONS
// ============================================================================

function generateContentStrategyRecommendations(context: AnalysisContext): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const { yourPosts, competitorPosts, contentGaps } = context;

  // Find content types you're underutilizing
  const yourPerformance = analyzeContentTypePerformance(yourPosts);
  const competitorPerformance = analyzeContentTypePerformance(competitorPosts);

  contentGaps.forEach((gap) => {
    if (gap.opportunity === 'high' && gap.gap > 5) {
      const competitorData = competitorPerformance.find((p) => p.contentType === gap.contentType);
      const yourData = yourPerformance.find((p) => p.contentType === gap.contentType);

      if (competitorData && (!yourData || yourData.avgEngagementRate < competitorData.avgEngagementRate)) {
        recommendations.push({
          id: `content_gap_${gap.contentType}`,
          type: 'content_strategy',
          title: `Increase ${formatContentType(gap.contentType)} Content`,
          description: `Competitors post ${Math.round(gap.competitorAvgFrequency)} ${formatContentType(gap.contentType)}s on average while you post ${gap.yourFrequency}. This content type shows strong engagement potential.`,
          priority: 'high',
          expectedImpact: `Potential ${(competitorData.avgEngagementRate * 1.5).toFixed(1)}% engagement increase`,
          actionItems: [
            `Create 3-5 ${formatContentType(gap.contentType)}s per week`,
            'Study top-performing competitor examples',
            'A/B test different formats within this content type',
            `Track engagement rates for ${formatContentType(gap.contentType)}s separately`,
          ],
        });
      }
    }
  });

  // Analyze top performing competitor content for patterns
  const topPosts = getTopPerformingPosts(competitorPosts, 10);
  const contentTypeCount = new Map<ContentType, number>();

  topPosts.forEach((post) => {
    contentTypeCount.set(post.contentType, (contentTypeCount.get(post.contentType) || 0) + 1);
  });

  const dominantType = Array.from(contentTypeCount.entries()).sort((a, b) => b[1] - a[1])[0];
  if (dominantType && dominantType[1] >= 5) {
    const yourCount = yourPosts.filter((p) => p.contentType === dominantType[0]).length;
    if (yourCount < 3) {
      recommendations.push({
        id: `viral_content_type_${dominantType[0]}`,
        type: 'content_strategy',
        title: `Leverage ${formatContentType(dominantType[0])} Format`,
        description: `Top-performing competitor content is predominantly ${formatContentType(dominantType[0])}s. This format drives high engagement in your niche.`,
        priority: 'high',
        expectedImpact: '2-3x higher reach potential',
        actionItems: [
          `Analyze top 10 ${formatContentType(dominantType[0])}s from competitors`,
          'Identify common hooks and patterns',
          'Create similar content with your unique angle',
          'Post during peak engagement times',
        ],
      });
    }
  }

  return recommendations;
}

// ============================================================================
// SCHEDULE RECOMMENDATIONS
// ============================================================================

function generateScheduleRecommendations(context: AnalysisContext): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const { yourPosts, competitorPosts } = context;

  const timeGaps = analyzePostingTimeGaps(yourPosts, competitorPosts);
  const topGaps = timeGaps.slice(0, 3);

  if (topGaps.length > 0) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const gapDescriptions = topGaps.map((g) => `${dayNames[g.dayOfWeek]} ${formatHour(g.hourOfDay)}`);

    recommendations.push({
      id: 'posting_schedule_optimization',
      type: 'posting_schedule',
      title: 'Optimize Posting Times',
      description: `Competitors see high engagement on ${gapDescriptions.join(', ')}. You're missing these high-value time slots.`,
      priority: 'medium',
      expectedImpact: '20-40% engagement boost',
      actionItems: [
        'Test posting at recommended times for 2 weeks',
        'Track engagement rates by time slot',
        'Adjust schedule based on your audience response',
        'Use scheduling tools to maintain consistency',
      ],
    });
  }

  // Posting frequency recommendation
  const yourFrequency = yourPosts.length;
  const competitorFrequency = Math.round(competitorPosts.length / 3); // Assuming 3 competitors

  if (yourFrequency < competitorFrequency * 0.7) {
    recommendations.push({
      id: 'increase_posting_frequency',
      type: 'posting_schedule',
      title: 'Increase Posting Frequency',
      description: `You're posting ${yourFrequency} times while competitors average ${competitorFrequency} posts. More frequent posting can increase visibility.`,
      priority: 'medium',
      expectedImpact: 'Increased algorithm favor and reach',
      actionItems: [
        `Gradually increase to ${Math.round(competitorFrequency * 0.8)} posts per week`,
        'Maintain quality while increasing quantity',
        'Batch create content to stay consistent',
        'Monitor for engagement rate changes',
      ],
    });
  }

  return recommendations;
}

// ============================================================================
// HASHTAG RECOMMENDATIONS
// ============================================================================

function generateHashtagRecommendations(context: AnalysisContext): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const { yourPosts, competitorPosts } = context;

  const untappedHashtags = getUntappedHashtags(yourPosts, competitorPosts, 15);

  if (untappedHashtags.length >= 5) {
    recommendations.push({
      id: 'untapped_hashtags',
      type: 'hashtag_strategy',
      title: 'Leverage Untapped Hashtags',
      description: `Found ${untappedHashtags.length} hashtags that competitors use successfully but you haven't tried. These could unlock new audiences.`,
      priority: 'high',
      expectedImpact: '15-25% reach expansion',
      actionItems: [
        'Research each hashtag for relevance to your brand',
        'Start with 3-5 hashtags per post',
        'Mix popular and niche hashtags',
        'Track which hashtags drive the most engagement',
        `Top hashtags to try: ${untappedHashtags.slice(0, 5).join(', ')}`,
      ],
    });
  }

  // Analyze hashtag performance
  const yourHashtags = analyzeHashtags(yourPosts);
  const competitorHashtags = analyzeHashtags(competitorPosts);

  const underperformingOverlap = context.hashtagOverlap.filter(
    (h) => h.overlap && h.performance === 'worse' && h.yourUsage >= 5
  );

  if (underperformingOverlap.length > 0) {
    recommendations.push({
      id: 'improve_hashtag_usage',
      type: 'hashtag_strategy',
      title: 'Optimize Hashtag Usage',
      description: `You're using ${underperformingOverlap.length} hashtags where competitors get better results. Adjust your content or timing for these tags.`,
      priority: 'medium',
      expectedImpact: 'Better hashtag performance',
      actionItems: [
        'Analyze competitor posts with these hashtags',
        'Note the content type and posting time',
        'Improve content quality for these hashtags',
        'Consider replacing underperforming hashtags',
      ],
    });
  }

  return recommendations;
}

// ============================================================================
// ENGAGEMENT RECOMMENDATIONS
// ============================================================================

function generateEngagementRecommendations(context: AnalysisContext): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const { yourPosts, competitorPosts } = context;

  // Analyze caption patterns from top posts
  const topCompetitorPosts = getTopPerformingPosts(competitorPosts, 20);
  const topYourPosts = getTopPerformingPosts(yourPosts, 20);

  const avgCompetitorCaptionLength =
    topCompetitorPosts.reduce((sum, p) => sum + p.captionLength, 0) /
    topCompetitorPosts.length;
  const avgYourCaptionLength =
    topYourPosts.reduce((sum, p) => sum + p.captionLength, 0) / (topYourPosts.length || 1);

  if (Math.abs(avgCompetitorCaptionLength - avgYourCaptionLength) > 50) {
    const direction = avgCompetitorCaptionLength > avgYourCaptionLength ? 'longer' : 'shorter';
    recommendations.push({
      id: 'caption_length_optimization',
      type: 'engagement_tactics',
      title: `Use ${direction === 'longer' ? 'Longer' : 'Shorter'} Captions`,
      description: `Top competitor posts average ${Math.round(avgCompetitorCaptionLength)} characters in captions, while yours average ${Math.round(avgYourCaptionLength)}. ${direction === 'longer' ? 'Longer captions provide more context and value.' : 'Shorter captions are more digestible.'}`,
      priority: 'low',
      expectedImpact: '10-15% engagement improvement',
      actionItems: [
        `Test ${direction} captions for 10 posts`,
        'Include clear call-to-actions',
        'Front-load important information',
        'Use line breaks for readability',
      ],
    });
  }

  // CTA analysis
  const competitorCTAs = extractCTAs(topCompetitorPosts.map((p) => p.caption));
  const yourCTAs = extractCTAs(topYourPosts.map((p) => p.caption));

  const missingCTAs = competitorCTAs.filter((cta) => !yourCTAs.includes(cta));
  if (missingCTAs.length > 0) {
    recommendations.push({
      id: 'add_strong_ctas',
      type: 'engagement_tactics',
      title: 'Add Stronger Call-to-Actions',
      description: `Top competitor posts use CTAs like "${missingCTAs.slice(0, 3).join('", "')}". Clear CTAs drive more engagement.`,
      priority: 'medium',
      expectedImpact: '20-30% more comments and saves',
      actionItems: [
        'Add a specific CTA to every post',
        'Ask questions to drive comments',
        'Encourage saves with valuable content',
        'Test different CTA placements',
      ],
    });
  }

  return recommendations;
}

// ============================================================================
// CONTENT FORMAT RECOMMENDATIONS
// ============================================================================

function generateContentFormatRecommendations(context: AnalysisContext): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const { yourPosts, competitorPosts } = context;

  // Analyze carousel performance
  const competitorCarousels = competitorPosts.filter((p) => p.contentType === 'carousel');
  const yourCarousels = yourPosts.filter((p) => p.contentType === 'carousel');

  if (competitorCarousels.length > yourCarousels.length * 2) {
    const avgCompetitorCarouselEngagement =
      competitorCarousels.reduce((sum, p) => sum + p.engagementRate, 0) /
      competitorCarousels.length;

    recommendations.push({
      id: 'increase_carousels',
      type: 'content_format',
      title: 'Create More Carousel Posts',
      description: `Competitors post ${competitorCarousels.length} carousels vs your ${yourCarousels.length}. Carousels are getting ${avgCompetitorCarouselEngagement.toFixed(2)}% avg engagement.`,
      priority: 'high',
      expectedImpact: 'Higher saves and shares',
      actionItems: [
        'Create educational carousels (tips, guides, how-tos)',
        'Use 5-10 slides for optimal engagement',
        'Design eye-catching first slides',
        'Include valuable information on each slide',
        'End with a strong call-to-action',
      ],
    });
  }

  // Analyze Reel performance
  const competitorReels = competitorPosts.filter((p) => p.contentType === 'reel');
  const yourReels = yourPosts.filter((p) => p.contentType === 'reel');

  if (competitorReels.length > yourReels.length * 1.5) {
    const avgCompetitorReelViews =
      competitorReels.reduce((sum, p) => sum + (p.views || 0), 0) / competitorReels.length;

    recommendations.push({
      id: 'increase_reels',
      type: 'content_format',
      title: 'Expand Reels Strategy',
      description: `Competitors are heavily investing in Reels with ${competitorReels.length} posts. Reels average ${Math.round(avgCompetitorReelViews).toLocaleString()} views.`,
      priority: 'high',
      expectedImpact: '3-5x reach expansion',
      actionItems: [
        'Post 3-5 Reels per week',
        'Keep videos under 30 seconds initially',
        'Use trending audio and effects',
        'Create hook in first 3 seconds',
        'Include text overlays for accessibility',
      ],
    });
  }

  return recommendations;
}

// ============================================================================
// COMPETITIVE RESPONSE RECOMMENDATIONS
// ============================================================================

/**
 * Generate competitive response recommendations
 */
export function generateCompetitiveResponseRecommendations(
  viralCompetitorPosts: CompetitorPost[],
  competitor: Competitor
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  viralCompetitorPosts.forEach((post, index) => {
    recommendations.push({
      id: `competitive_response_${post.id}`,
      type: 'competitive_response',
      title: `Respond to ${competitor.username}'s Viral Content`,
      description: `A ${post.contentType} from ${competitor.username} went viral with ${post.engagementRate.toFixed(2)}% engagement. Create a response to capture similar attention.`,
      priority: index === 0 ? 'high' : 'medium',
      expectedImpact: 'Ride the wave of trending topic',
      actionItems: [
        'Analyze what made the post successful',
        'Create your unique take on the topic',
        'Reference the trend without copying',
        'Post while topic is still hot',
        'Engage with comments quickly',
      ],
      basedOnCompetitorId: competitor.id,
    });
  });

  return recommendations;
}

// ============================================================================
// PRIORITIZATION
// ============================================================================

/**
 * Prioritize recommendations based on impact and effort
 */
export function prioritizeRecommendations(
  recommendations: Recommendation[],
  maxHighPriority: number = 3
): Recommendation[] {
  const prioritized = [...recommendations];

  // Sort by priority first, then by type weight
  const typeWeights: Record<RecommendationType, number> = {
    content_strategy: 10,
    content_format: 9,
    posting_schedule: 7,
    hashtag_strategy: 6,
    engagement_tactics: 5,
    competitive_response: 8,
  };

  prioritized.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return typeWeights[b.type] - typeWeights[a.type];
  });

  return prioritized;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatContentType(type: ContentType): string {
  const labels: Record<ContentType, string> = {
    post: 'Single Post',
    reel: 'Reel',
    carousel: 'Carousel',
    story: 'Story',
    video: 'Video',
  };
  return labels[type];
}

function formatHour(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}${period}`;
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

  return ctas;
}
