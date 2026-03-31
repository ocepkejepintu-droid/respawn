/**
 * Competitor Analysis tRPC Router
 * Real Buzzer SaaS - Competitor monitoring and analytics endpoints
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import type {
  Competitor,
  CompetitorPost,
  CompetitorMetrics,
  DateRange,
  DateRangePreset,
  MonitoringFrequency,
  Platform,
  ExportOptions,
} from '@/types/competitor';
import {
  // Analyzer functions
  generateEngagementTrends,
  analyzeContentTypePerformance,
  analyzeHashtags,
  analyzeBestPostingTimes,
  generateInsights,
  getTopPerformingPosts,
  generateMetricsSummary,
  // Comparison functions
  compareCompetitors,
  analyzeContentGaps,
  analyzePostingTimeGaps,
  analyzeHashtagOverlap,
  calculateShareOfVoice,
  generateSideBySideComparison,
  // Insights functions
  generateRecommendations,
  generateCompetitiveResponseRecommendations,
  prioritizeRecommendations,
  // Mock data
  getMockCompetitors,
  getMockCompetitorById,
  getMockPostsForCompetitor,
  getMockMetricsForCompetitor,
  generateDemoData,
} from '@/server/services/competitors';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const platformSchema = z.enum(['instagram', 'tiktok']);
const monitoringFrequencySchema = z.enum(['hourly', 'daily', 'weekly', 'monthly']);
const dateRangePresetSchema = z.enum([
  'last_7_days',
  'last_30_days',
  'last_90_days',
  'last_6_months',
  'last_year',
  'custom',
]);

const dateRangeSchema = z.object({
  from: z.date(),
  to: z.date(),
});

const addCompetitorSchema = z.object({
  workspaceId: z.string(),
  username: z.string().min(1).max(50),
  platform: platformSchema,
  niche: z.string().optional(),
  tags: z.array(z.string()).optional(),
  monitoringFrequency: monitoringFrequencySchema.default('daily'),
});

const updateCompetitorSchema = z.object({
  competitorId: z.string(),
  niche: z.string().optional(),
  tags: z.array(z.string()).optional(),
  monitoringFrequency: monitoringFrequencySchema.optional(),
  isActive: z.boolean().optional(),
});

const getCompetitorSchema = z.object({
  competitorId: z.string(),
  workspaceId: z.string(),
});

const listCompetitorsSchema = z.object({
  workspaceId: z.string(),
  platform: platformSchema.optional(),
  niche: z.string().optional(),
  isActive: z.boolean().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

const compareCompetitorsSchema = z.object({
  workspaceId: z.string(),
  competitorIds: z.array(z.string()).min(1).max(5),
  dateRangePreset: dateRangePresetSchema.default('last_30_days'),
  dateRange: dateRangeSchema.optional(),
  includeYourProfile: z.boolean().default(false),
});

const getAnalyticsSchema = z.object({
  competitorId: z.string(),
  workspaceId: z.string(),
  dateRangePreset: dateRangePresetSchema.default('last_30_days'),
  dateRange: dateRangeSchema.optional(),
});

const exportDataSchema = z.object({
  workspaceId: z.string(),
  competitorIds: z.array(z.string()),
  format: z.enum(['csv', 'pdf', 'json']),
  dateRangePreset: dateRangePresetSchema.default('last_30_days'),
  dateRange: dateRangeSchema.optional(),
  includeMetrics: z.boolean().default(true),
  includePosts: z.boolean().default(true),
  includeHashtags: z.boolean().default(true),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getDateRangeFromPreset(preset: DateRangePreset): DateRange {
  const to = new Date();
  const from = new Date();

  switch (preset) {
    case 'last_7_days':
      from.setDate(from.getDate() - 7);
      break;
    case 'last_30_days':
      from.setDate(from.getDate() - 30);
      break;
    case 'last_90_days':
      from.setDate(from.getDate() - 90);
      break;
    case 'last_6_months':
      from.setMonth(from.getMonth() - 6);
      break;
    case 'last_year':
      from.setFullYear(from.getFullYear() - 1);
      break;
    default:
      from.setDate(from.getDate() - 30);
  }

  return { from, to };
}

// ============================================================================
// COMPETITOR ROUTER
// ============================================================================

export const competitorsRouter = createTRPCRouter({
  // ==========================================================================
  // CRUD OPERATIONS
  // ==========================================================================

  /**
   * List all competitors for a workspace
   */
  list: protectedProcedure
    .input(listCompetitorsSchema)
    .query(async ({ input }) => {
      // In production, fetch from database
      // For demo, return mock data
      const competitors = getMockCompetitors(input.workspaceId);
      
      let filtered = competitors;
      
      if (input.platform) {
        filtered = filtered.filter((c) => c.platform === input.platform);
      }
      
      if (input.niche) {
        filtered = filtered.filter((c) => c.niche?.toLowerCase() === input.niche?.toLowerCase());
      }
      
      if (input.isActive !== undefined) {
        filtered = filtered.filter((c) => c.isActive === input.isActive);
      }

      const paginated = filtered.slice(input.offset, input.offset + input.limit);

      return {
        competitors: paginated,
        totalCount: filtered.length,
        hasMore: filtered.length > input.offset + input.limit,
      };
    }),

  /**
   * Get a single competitor by ID
   */
  get: protectedProcedure
    .input(getCompetitorSchema)
    .query(async ({ input }) => {
      const competitor = getMockCompetitorById(input.competitorId);
      
      if (!competitor) {
        throw new Error('Competitor not found');
      }

      return { competitor };
    }),

  /**
   * Add a new competitor to monitor
   */
  add: protectedProcedure
    .input(addCompetitorSchema)
    .mutation(async ({ input, ctx }) => {
      // In production:
      // 1. Validate workspace access
      // 2. Check quota limits
      // 3. Scrape initial profile data
      // 4. Save to database

      const newCompetitor: Competitor = {
        id: `comp_${Date.now()}`,
        workspaceId: input.workspaceId,
        username: input.username,
        displayName: input.username,
        platform: input.platform,
        profileUrl: `https://${input.platform}.com/${input.username}`,
        followers: 0,
        following: 0,
        postsCount: 0,
        niche: input.niche,
        tags: input.tags || [],
        monitoringFrequency: input.monitoringFrequency,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // TODO: In production, queue a scraping job to get actual data
      // For now, return the created competitor
      return { competitor: newCompetitor };
    }),

  /**
   * Update a competitor's settings
   */
  update: protectedProcedure
    .input(updateCompetitorSchema)
    .mutation(async ({ input }) => {
      const competitor = getMockCompetitorById(input.competitorId);
      
      if (!competitor) {
        throw new Error('Competitor not found');
      }

      const updated = {
        ...competitor,
        ...(input.niche !== undefined && { niche: input.niche }),
        ...(input.tags !== undefined && { tags: input.tags }),
        ...(input.monitoringFrequency !== undefined && { monitoringFrequency: input.monitoringFrequency }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        updatedAt: new Date(),
      };

      return { competitor: updated };
    }),

  /**
   * Remove a competitor
   */
  remove: protectedProcedure
    .input(z.object({ competitorId: z.string() }))
    .mutation(async ({ input }) => {
      // In production, delete from database
      // For demo, just return success
      return { success: true, competitorId: input.competitorId };
    }),

  /**
   * Refresh competitor data
   */
  refresh: protectedProcedure
    .input(z.object({ competitorId: z.string(), workspaceId: z.string() }))
    .mutation(async ({ input }) => {
      const competitor = getMockCompetitorById(input.competitorId);
      
      if (!competitor) {
        throw new Error('Competitor not found');
      }

      // In production, queue a scraping job
      const updated = {
        ...competitor,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      };

      return { competitor: updated };
    }),

  // ==========================================================================
  // ANALYTICS ENDPOINTS
  // ==========================================================================

  /**
   * Get detailed analytics for a competitor
   */
  getAnalytics: protectedProcedure
    .input(getAnalyticsSchema)
    .query(async ({ input }) => {
      const competitor = getMockCompetitorById(input.competitorId);
      
      if (!competitor) {
        throw new Error('Competitor not found');
      }

      const dateRange = input.dateRange || getDateRangeFromPreset(input.dateRangePreset);
      const posts = getMockPostsForCompetitor(input.competitorId);
      const metrics = getMockMetricsForCompetitor(input.competitorId);

      // Filter posts by date range
      const filteredPosts = posts.filter(
        (p) => p.postedAt >= dateRange.from && p.postedAt <= dateRange.to
      );

      // Generate analytics
      const trends = generateEngagementTrends(filteredPosts, dateRange, 'day');
      const contentTypePerformance = analyzeContentTypePerformance(filteredPosts);
      const hashtagAnalysis = analyzeHashtags(filteredPosts);
      const bestPostingTimes = analyzeBestPostingTimes(filteredPosts);
      const topPosts = getTopPerformingPosts(filteredPosts, 10);
      const summary = generateMetricsSummary(filteredPosts, metrics);

      // Generate insights
      const currentMetrics = metrics[metrics.length - 1];
      const previousMetrics = metrics[metrics.length - 8]; // Week ago
      const insights = generateInsights(
        competitor,
        currentMetrics,
        previousMetrics,
        filteredPosts.slice(0, 10)
      );

      return {
        competitor,
        metrics: metrics.filter((m) => m.date >= dateRange.from && m.date <= dateRange.to),
        posts: filteredPosts.slice(0, 50), // Limit to 50 recent posts
        topPosts,
        trends,
        contentTypePerformance,
        hashtagAnalysis: hashtagAnalysis.slice(0, 20),
        bestPostingTimes: bestPostingTimes.slice(0, 10),
        summary,
        insights,
        dateRange,
      };
    }),

  /**
   * Get engagement trends for a competitor
   */
  getEngagementTrends: protectedProcedure
    .input(
      z.object({
        competitorId: z.string(),
        granularity: z.enum(['day', 'week', 'month']).default('day'),
        dateRangePreset: dateRangePresetSchema.default('last_30_days'),
        dateRange: dateRangeSchema.optional(),
      })
    )
    .query(async ({ input }) => {
      const dateRange = input.dateRange || getDateRangeFromPreset(input.dateRangePreset);
      const posts = getMockPostsForCompetitor(input.competitorId);
      
      const filteredPosts = posts.filter(
        (p) => p.postedAt >= dateRange.from && p.postedAt <= dateRange.to
      );

      const trends = generateEngagementTrends(filteredPosts, dateRange, input.granularity);

      return { trends, dateRange };
    }),

  /**
   * Get content type breakdown
   */
  getContentTypeBreakdown: protectedProcedure
    .input(
      z.object({
        competitorId: z.string(),
        dateRangePreset: dateRangePresetSchema.default('last_30_days'),
        dateRange: dateRangeSchema.optional(),
      })
    )
    .query(async ({ input }) => {
      const dateRange = input.dateRange || getDateRangeFromPreset(input.dateRangePreset);
      const posts = getMockPostsForCompetitor(input.competitorId);
      
      const filteredPosts = posts.filter(
        (p) => p.postedAt >= dateRange.from && p.postedAt <= dateRange.to
      );

      const breakdown = analyzeContentTypePerformance(filteredPosts);

      return { breakdown, totalPosts: filteredPosts.length, dateRange };
    }),

  /**
   * Get hashtag analysis
   */
  getHashtagAnalysis: protectedProcedure
    .input(
      z.object({
        competitorId: z.string(),
        limit: z.number().min(1).max(100).default(20),
        dateRangePreset: dateRangePresetSchema.default('last_30_days'),
        dateRange: dateRangeSchema.optional(),
      })
    )
    .query(async ({ input }) => {
      const dateRange = input.dateRange || getDateRangeFromPreset(input.dateRangePreset);
      const posts = getMockPostsForCompetitor(input.competitorId);
      
      const filteredPosts = posts.filter(
        (p) => p.postedAt >= dateRange.from && p.postedAt <= dateRange.to
      );

      const hashtags = analyzeHashtags(filteredPosts);

      return { hashtags: hashtags.slice(0, input.limit), dateRange };
    }),

  /**
   * Get best performing posts
   */
  getTopPosts: protectedProcedure
    .input(
      z.object({
        competitorId: z.string(),
        limit: z.number().min(1).max(50).default(10),
        metric: z.enum(['engagement', 'likes', 'comments', 'shares', 'saves', 'views']).default('engagement'),
        dateRangePreset: dateRangePresetSchema.default('last_30_days'),
        dateRange: dateRangeSchema.optional(),
      })
    )
    .query(async ({ input }) => {
      const dateRange = input.dateRange || getDateRangeFromPreset(input.dateRangePreset);
      const posts = getMockPostsForCompetitor(input.competitorId);
      
      const filteredPosts = posts.filter(
        (p) => p.postedAt >= dateRange.from && p.postedAt <= dateRange.to
      );

      const topPosts = getTopPerformingPosts(filteredPosts, input.limit, input.metric);

      return { posts: topPosts, dateRange };
    }),

  // ==========================================================================
  // COMPARISON ENDPOINTS
  // ==========================================================================

  /**
   * Compare multiple competitors
   */
  compare: protectedProcedure
    .input(compareCompetitorsSchema)
    .query(async ({ input }) => {
      const dateRange = input.dateRange || getDateRangeFromPreset(input.dateRangePreset);

      // Get data for all competitors
      const competitorData = input.competitorIds.map((id) => {
        const competitor = getMockCompetitorById(id);
        if (!competitor) throw new Error(`Competitor ${id} not found`);

        return {
          competitor,
          posts: getMockPostsForCompetitor(id).filter(
            (p) => p.postedAt >= dateRange.from && p.postedAt <= dateRange.to
          ),
          metrics: getMockMetricsForCompetitor(id).filter(
            (m) => m.date >= dateRange.from && m.date <= dateRange.to
          ),
        };
      });

      const comparison = compareCompetitors(competitorData, dateRange);

      // Generate content gaps if we have a "your profile" reference
      let contentGaps: ReturnType<typeof analyzeContentGaps> = [];
      let timeGaps: ReturnType<typeof analyzePostingTimeGaps> = [];
      let hashtagOverlap: ReturnType<typeof analyzeHashtagOverlap> = [];
      let recommendations: ReturnType<typeof generateRecommendations> = [];

      if (input.includeYourProfile && competitorData.length >= 2) {
        const yourData = competitorData[0];
        const competitorPosts = competitorData.slice(1).flatMap((d) => d.posts);

        contentGaps = analyzeContentGaps(yourData.posts, competitorPosts);
        timeGaps = analyzePostingTimeGaps(yourData.posts, competitorPosts);
        hashtagOverlap = analyzeHashtagOverlap(yourData.posts, competitorPosts);

        recommendations = generateRecommendations({
          yourPosts: yourData.posts,
          yourMetrics: yourData.metrics,
          competitorPosts,
          competitorMetrics: competitorData.slice(1).flatMap((d) => d.metrics),
          contentGaps,
          hashtagOverlap,
          topCompetitorPosts: getTopPerformingPosts(competitorPosts, 10),
        });
      }

      // Calculate share of voice
      const shareOfVoice = calculateShareOfVoice(competitorData);

      // Generate side-by-side comparison
      const sideBySide = generateSideBySideComparison(competitorData);

      return {
        comparison,
        contentGaps,
        timeGaps,
        hashtagOverlap,
        recommendations,
        shareOfVoice,
        sideBySide,
        dateRange,
      };
    }),

  /**
   * Get side-by-side comparison table
   */
  getSideBySideComparison: protectedProcedure
    .input(
      z.object({
        competitorIds: z.array(z.string()).min(2).max(5),
        categories: z
          .array(z.enum(['followers', 'engagement', 'posts', 'growth', 'avgLikes', 'avgComments']))
          .optional(),
      })
    )
    .query(async ({ input }) => {
      const competitorData = input.competitorIds.map((id) => {
        const competitor = getMockCompetitorById(id);
        if (!competitor) throw new Error(`Competitor ${id} not found`);

        return {
          competitor,
          posts: getMockPostsForCompetitor(id),
          metrics: getMockMetricsForCompetitor(id),
        };
      });

      const comparison = generateSideBySideComparison(competitorData, input.categories);

      return { comparison };
    }),

  // ==========================================================================
  // INSIGHTS & RECOMMENDATIONS
  // ==========================================================================

  /**
   * Get AI-powered recommendations
   */
  getRecommendations: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        competitorIds: z.array(z.string()).min(1).max(5),
        dateRangePreset: dateRangePresetSchema.default('last_30_days'),
        dateRange: dateRangeSchema.optional(),
      })
    )
    .query(async ({ input }) => {
      const dateRange = input.dateRange || getDateRangeFromPreset(input.dateRangePreset);

      // Assume first competitor is "you" and rest are competitors
      const allData = input.competitorIds.map((id) => ({
        competitor: getMockCompetitorById(id)!,
        posts: getMockPostsForCompetitor(id).filter(
          (p) => p.postedAt >= dateRange.from && p.postedAt <= dateRange.to
        ),
        metrics: getMockMetricsForCompetitor(id).filter(
          (m) => m.date >= dateRange.from && m.date <= dateRange.to
        ),
      }));

      const yourData = allData[0];
      const competitorData = allData.slice(1);
      const competitorPosts = competitorData.flatMap((d) => d.posts);
      const competitorMetrics = competitorData.flatMap((d) => d.metrics);

      const contentGaps = analyzeContentGaps(yourData.posts, competitorPosts);
      const hashtagOverlap = analyzeHashtagOverlap(yourData.posts, competitorPosts);

      const recommendations = generateRecommendations({
        yourPosts: yourData.posts,
        yourMetrics: yourData.metrics,
        competitorPosts,
        competitorMetrics,
        contentGaps,
        hashtagOverlap,
        topCompetitorPosts: getTopPerformingPosts(competitorPosts, 10),
      });

      const prioritized = prioritizeRecommendations(recommendations);

      return { recommendations: prioritized, dateRange };
    }),

  // ==========================================================================
  // EXPORT ENDPOINTS
  // ==========================================================================

  /**
   * Export competitor data
   */
  export: protectedProcedure
    .input(exportDataSchema)
    .mutation(async ({ input }) => {
      const dateRange = input.dateRange || getDateRangeFromPreset(input.dateRangePreset);

      const exportData: {
        competitors: Competitor[];
        posts?: CompetitorPost[];
        metrics?: CompetitorMetrics[];
        dateRange: DateRange;
        exportedAt: Date;
      } = {
        competitors: [],
        dateRange,
        exportedAt: new Date(),
      };

      input.competitorIds.forEach((id) => {
        const competitor = getMockCompetitorById(id);
        if (competitor) {
          exportData.competitors.push(competitor);

          if (input.includePosts) {
            const posts = getMockPostsForCompetitor(id).filter(
              (p) => p.postedAt >= dateRange.from && p.postedAt <= dateRange.to
            );
            exportData.posts = [...(exportData.posts || []), ...posts];
          }

          if (input.includeMetrics) {
            const metrics = getMockMetricsForCompetitor(id).filter(
              (m) => m.date >= dateRange.from && m.date <= dateRange.to
            );
            exportData.metrics = [...(exportData.metrics || []), ...metrics];
          }
        }
      });

      // In production, generate actual CSV/PDF files
      // For demo, return JSON data
      return {
        format: input.format,
        data: exportData,
        downloadUrl: input.format === 'json' 
          ? `data:application/json;base64,${Buffer.from(JSON.stringify(exportData)).toString('base64')}`
          : undefined,
      };
    }),

  // ==========================================================================
  // DASHBOARD STATS
  // ==========================================================================

  /**
   * Get competitor dashboard stats
   */
  getDashboardStats: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ input }) => {
      const competitors = getMockCompetitors(input.workspaceId);
      const totalCompetitors = competitors.length;
      const activeCompetitors = competitors.filter((c) => c.isActive).length;

      // Calculate aggregate stats
      let totalFollowers = 0;
      let avgEngagementRate = 0;
      let recentlyUpdated = 0;

      const platformDistribution: Record<string, number> = {};
      const nicheDistribution: Record<string, number> = {};

      competitors.forEach((c) => {
        totalFollowers += c.followers;
        platformDistribution[c.platform] = (platformDistribution[c.platform] || 0) + 1;
        if (c.niche) {
          nicheDistribution[c.niche] = (nicheDistribution[c.niche] || 0) + 1;
        }

        // Check if updated in last 24 hours
        if (c.lastSyncedAt && new Date().getTime() - c.lastSyncedAt.getTime() < 24 * 60 * 60 * 1000) {
          recentlyUpdated++;
        }
      });

      // Calculate average engagement from mock data
      competitors.forEach((c) => {
        const posts = getMockPostsForCompetitor(c.id);
        const avgEngagement = posts.reduce((sum, p) => sum + p.engagementRate, 0) / (posts.length || 1);
        avgEngagementRate += avgEngagement;
      });
      avgEngagementRate = avgEngagementRate / (competitors.length || 1);

      return {
        totalCompetitors,
        activeCompetitors,
        totalFollowers,
        avgEngagementRate,
        recentlyUpdated,
        platformDistribution,
        nicheDistribution,
        topCompetitors: competitors
          .sort((a, b) => b.followers - a.followers)
          .slice(0, 5)
          .map((c) => ({
            id: c.id,
            username: c.username,
            displayName: c.displayName,
            followers: c.followers,
            platform: c.platform,
            profileImage: c.profileImage,
          })),
      };
    }),
});
