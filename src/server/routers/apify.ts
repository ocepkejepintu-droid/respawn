/**
 * Apify tRPC Router
 * Exposes Apify services through tRPC endpoints
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import {
  queueJob,
  getJob,
  cancelJob,
  getQueueStatus,
  getWorkspaceJobs,
  checkQuota,
  getQuotaInfo,
  getMonthlyUsage,
  getUsageHistory,
  getRateLimitStatus,
  healthCheck,
  ACTOR_IDS,
} from '@/server/services/apify';
import { instagramService, tiktokService } from '@/server/services/scrapers';
import {
  createMonitor,
  getMonitor,
  updateMonitor,
  deleteMonitor,
  getWorkspaceMonitors,
  getWorkspaceAlerts,
  markAlertRead,
  generateReport,
} from '@/server/services/scrapers/competitor-monitor.service';
import {
  createTracker,
  getTracker,
  updateTracker,
  deleteTracker,
  getWorkspaceTrackers,
  analyzeTrend,
  discoverTrendingHashtags,
  generateHashtagReport,
} from '@/server/services/scrapers/hashtag-tracker.service';
import { TierType, ActorId, ScraperType } from '@/types/apify';

// ============================================================================
// Schemas
// ============================================================================

const tierSchema = z.enum(['FREE', 'PRO', 'AGENCY', 'ENTERPRISE']);
const actorIdSchema = z.enum([
  'apify/instagram-profile-scraper',
  'apify/instagram-post-scraper',
  'apify/instagram-hashtag-scraper',
  'apify/instagram-comment-scraper',
  'apify/tiktok-scraper',
  'apify/tiktok-hashtag-analytics',
]);

// ============================================================================
// Apify Router
// ============================================================================

export const apifyRouter = createTRPCRouter({
  // ==========================================================================
  // Health & Status
  // ==========================================================================

  health: protectedProcedure.query(async () => {
    return healthCheck();
  }),

  queueStatus: protectedProcedure.query(async () => {
    return getQueueStatus();
  }),

  // ==========================================================================
  // Quota & Usage
  // ==========================================================================

  getQuota: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ input, ctx }) => {
      // Verify user has access to workspace
      const tier = await getUserTier(ctx.user.id, input.workspaceId);
      return getQuotaInfo(input.workspaceId);
    }),

  checkQuota: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
      tier: tierSchema.optional(),
    }))
    .query(async ({ input, ctx }) => {
      const tier = input.tier || await getUserTier(ctx.user.id, input.workspaceId);
      return checkQuota(input.workspaceId, tier);
    }),

  getMonthlyUsage: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
      yearMonth: z.string().optional(), // Format: "2024-01"
    }))
    .query(async ({ input }) => {
      return getMonthlyUsage(input.workspaceId, input.yearMonth);
    }),

  getUsageHistory: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
      months: z.number().min(1).max(12).default(3),
    }))
    .query(async ({ input }) => {
      return getUsageHistory(input.workspaceId, input.months);
    }),

  getRateLimitStatus: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
      tier: tierSchema,
    }))
    .query(async ({ input }) => {
      return getRateLimitStatus(input.workspaceId, input.tier);
    }),

  // ==========================================================================
  // Job Management
  // ==========================================================================

  getJobs: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
      status: z.enum(['pending', 'queued', 'running', 'completed', 'failed', 'cancelled']).optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      return getWorkspaceJobs(input.workspaceId, {
        status: input.status,
        limit: input.limit,
        offset: input.offset,
      });
    }),

  getJob: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ input }) => {
      return getJob(input.jobId);
    }),

  cancelJob: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(async ({ input }) => {
      return cancelJob(input.jobId);
    }),

  // ==========================================================================
  // Instagram Scraping
  // ==========================================================================

  instagram: createTRPCRouter({
    scrapeProfile: protectedProcedure
      .input(z.object({
        workspaceId: z.string(),
        usernames: z.union([z.string(), z.array(z.string())]),
        tier: tierSchema,
        includePosts: z.boolean().optional(),
        postsLimit: z.number().min(1).max(100).optional(),
        priority: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const usernames = Array.isArray(input.usernames) 
          ? input.usernames 
          : [input.usernames];
        
        return instagramService.scrapeProfile(
          input.workspaceId,
          usernames,
          input.tier,
          {
            includePosts: input.includePosts,
            postsLimit: input.postsLimit,
            priority: input.priority,
          }
        );
      }),

    getProfileWithAnalytics: protectedProcedure
      .input(z.object({
        workspaceId: z.string(),
        username: z.string(),
        tier: tierSchema,
      }))
      .mutation(async ({ input }) => {
        return instagramService.getProfileWithAnalytics(
          input.workspaceId,
          input.username,
          input.tier
        );
      }),

    scrapePosts: protectedProcedure
      .input(z.object({
        workspaceId: z.string(),
        username: z.string().optional(),
        urls: z.array(z.string()).optional(),
        tier: tierSchema,
        includeComments: z.boolean().optional(),
        limit: z.number().min(1).max(200).optional(),
      }))
      .mutation(async ({ input }) => {
        if (input.urls) {
          return instagramService.scrapePostsByUrls(
            input.workspaceId,
            input.urls,
            input.tier,
            { includeComments: input.includeComments }
          );
        }
        if (input.username) {
          return instagramService.scrapePostsByUsername(
            input.workspaceId,
            input.username,
            input.tier,
            { includeComments: input.includeComments }
          );
        }
        throw new Error('Either username or urls must be provided');
      }),

    analyzeHashtag: protectedProcedure
      .input(z.object({
        workspaceId: z.string(),
        hashtag: z.string(),
        tier: tierSchema,
      }))
      .mutation(async ({ input }) => {
        return instagramService.analyzeHashtag(
          input.workspaceId,
          input.hashtag,
          input.tier
        );
      }),

    compareProfiles: protectedProcedure
      .input(z.object({
        workspaceId: z.string(),
        usernames: z.array(z.string()).min(2).max(10),
        tier: tierSchema,
      }))
      .mutation(async ({ input }) => {
        return instagramService.compareProfiles(
          input.workspaceId,
          input.usernames,
          input.tier
        );
      }),
  }),

  // ==========================================================================
  // TikTok Scraping
  // ==========================================================================

  tiktok: createTRPCRouter({
    scrapeProfile: protectedProcedure
      .input(z.object({
        workspaceId: z.string(),
        profiles: z.union([z.string(), z.array(z.string())]),
        tier: tierSchema,
        includePosts: z.boolean().optional(),
        postsLimit: z.number().min(1).max(100).optional(),
        priority: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const profiles = Array.isArray(input.profiles)
          ? input.profiles
          : [input.profiles];

        return tiktokService.scrapeProfile(
          input.workspaceId,
          profiles,
          input.tier,
          {
            includePosts: input.includePosts,
            postsLimit: input.postsLimit,
            priority: input.priority,
          }
        );
      }),

    getProfileWithAnalytics: protectedProcedure
      .input(z.object({
        workspaceId: z.string(),
        username: z.string(),
        tier: tierSchema,
      }))
      .mutation(async ({ input }) => {
        return tiktokService.getProfileWithAnalytics(
          input.workspaceId,
          input.username,
          input.tier
        );
      }),

    analyzeHashtag: protectedProcedure
      .input(z.object({
        workspaceId: z.string(),
        hashtag: z.string(),
        tier: tierSchema,
      }))
      .mutation(async ({ input }) => {
        return tiktokService.analyzeHashtagTrend(
          input.workspaceId,
          input.hashtag,
          input.tier
        );
      }),

    discoverTrending: protectedProcedure
      .input(z.object({
        workspaceId: z.string(),
        tier: tierSchema,
        seedHashtags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        return tiktokService.discoverTrending(
          input.workspaceId,
          input.tier,
          input.seedHashtags
        );
      }),

    compareProfiles: protectedProcedure
      .input(z.object({
        workspaceId: z.string(),
        usernames: z.array(z.string()).min(2).max(10),
        tier: tierSchema,
      }))
      .mutation(async ({ input }) => {
        return tiktokService.compareProfiles(
          input.workspaceId,
          input.usernames,
          input.tier
        );
      }),
  }),

  // ==========================================================================
  // Competitor Monitoring
  // ==========================================================================

  monitors: createTRPCRouter({
    list: protectedProcedure
      .input(z.object({ workspaceId: z.string() }))
      .query(async ({ input }) => {
        return getWorkspaceMonitors(input.workspaceId);
      }),

    get: protectedProcedure
      .input(z.object({ monitorId: z.string() }))
      .query(async ({ input }) => {
        return getMonitor(input.monitorId);
      }),

    create: protectedProcedure
      .input(z.object({
        workspaceId: z.string(),
        competitorUsername: z.string(),
        platform: z.enum(['instagram', 'tiktok']),
        checkFrequency: z.enum(['hourly', 'daily', 'weekly']).default('daily'),
        tier: tierSchema,
        alertThresholds: z.object({
          followerChangePercent: z.number().optional(),
          engagementChangePercent: z.number().optional(),
          newPostWithinHours: z.number().optional(),
        }).optional(),
      }))
      .mutation(async ({ input }) => {
        return createMonitor(
          input.workspaceId,
          input.competitorUsername,
          input.platform,
          {
            checkFrequency: input.checkFrequency,
            alertThresholds: input.alertThresholds,
          },
          input.tier
        );
      }),

    update: protectedProcedure
      .input(z.object({
        monitorId: z.string(),
        updates: z.object({
          checkFrequency: z.enum(['hourly', 'daily', 'weekly']).optional(),
          isActive: z.boolean().optional(),
          alertThresholds: z.object({
            followerChangePercent: z.number().optional(),
            engagementChangePercent: z.number().optional(),
            newPostWithinHours: z.number().optional(),
          }).optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return updateMonitor(input.monitorId, input.updates);
      }),

    delete: protectedProcedure
      .input(z.object({ monitorId: z.string() }))
      .mutation(async ({ input }) => {
        return deleteMonitor(input.monitorId);
      }),

    getAlerts: protectedProcedure
      .input(z.object({
        workspaceId: z.string(),
        unreadOnly: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(50),
      }))
      .query(async ({ input }) => {
        return getWorkspaceAlerts(input.workspaceId, {
          unreadOnly: input.unreadOnly,
          limit: input.limit,
        });
      }),

    markAlertRead: protectedProcedure
      .input(z.object({ alertId: z.string() }))
      .mutation(async ({ input }) => {
        return markAlertRead(input.alertId);
      }),

    generateReport: protectedProcedure
      .input(z.object({
        monitorId: z.string(),
        days: z.number().min(7).max(90).default(30),
      }))
      .query(async ({ input }) => {
        return generateReport(input.monitorId, input.days);
      }),
  }),

  // ==========================================================================
  // Hashtag Tracking
  // ==========================================================================

  hashtagTrackers: createTRPCRouter({
    list: protectedProcedure
      .input(z.object({ workspaceId: z.string() }))
      .query(async ({ input }) => {
        return getWorkspaceTrackers(input.workspaceId);
      }),

    get: protectedProcedure
      .input(z.object({ trackerId: z.string() }))
      .query(async ({ input }) => {
        return getTracker(input.trackerId);
      }),

    create: protectedProcedure
      .input(z.object({
        workspaceId: z.string(),
        hashtag: z.string(),
        platform: z.enum(['instagram', 'tiktok']),
        checkFrequency: z.enum(['hourly', 'daily', 'weekly']).default('daily'),
        tier: tierSchema,
        targetPostCount: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        return createTracker(
          input.workspaceId,
          input.hashtag,
          input.platform,
          {
            checkFrequency: input.checkFrequency,
            targetPostCount: input.targetPostCount,
          },
          input.tier
        );
      }),

    update: protectedProcedure
      .input(z.object({
        trackerId: z.string(),
        updates: z.object({
          checkFrequency: z.enum(['hourly', 'daily', 'weekly']).optional(),
          isActive: z.boolean().optional(),
          targetPostCount: z.number().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return updateTracker(input.trackerId, input.updates);
      }),

    delete: protectedProcedure
      .input(z.object({ trackerId: z.string() }))
      .mutation(async ({ input }) => {
        return deleteTracker(input.trackerId);
      }),

    analyzeTrend: protectedProcedure
      .input(z.object({
        trackerId: z.string(),
        days: z.number().min(7).max(90).default(30),
      }))
      .query(async ({ input }) => {
        return analyzeTrend(input.trackerId, input.days);
      }),

    discoverTrending: protectedProcedure
      .input(z.object({
        workspaceId: z.string(),
        limit: z.number().min(1).max(50).default(20),
      }))
      .query(async ({ input }) => {
        return discoverTrendingHashtags(input.workspaceId, input.limit);
      }),

    generateReport: protectedProcedure
      .input(z.object({
        trackerId: z.string(),
        days: z.number().min(7).max(90).default(30),
      }))
      .query(async ({ input }) => {
        return generateHashtagReport(input.trackerId, input.days);
      }),
  }),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get user's tier for a workspace
 * In production, fetch from your database
 */
async function getUserTier(userId: string, workspaceId: string): Promise<TierType> {
  // TODO: Implement actual database lookup
  // For now, return FREE as default
  return 'FREE';
}
