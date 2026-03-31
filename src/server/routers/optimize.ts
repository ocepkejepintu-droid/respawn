/**
 * Content Optimization tRPC Router
 * Exposes content optimization services through tRPC endpoints
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import {
  // Analysis
  analyzePerformance,
  getTopPerformingPosts,
  getEngagementTrends,
  compareContentTypes,
  analyzeEngagementVelocity,
  
  // Recommendations
  generateRecommendations,
  generateContentIdeas,
  generateCaptionSuggestions,
  recommendHashtags,
  generateABTestSuggestions,
  
  // Scoring
  calculateContentScore,
  optimizePost,
  generateOptimizationChecklist,
  
  // Calendar
  getCalendar,
  getUpcomingEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  publishEvent,
  getContentQueue,
  addToQueue,
  removeFromQueue,
  convertIdeaToEvent,
  calculateBestTime,
  getCalendarAnalytics,
  reorderEvents,
  bulkSchedule,
  rescheduleEvent,
} from '@/server/services/optimize';
import {
  ContentType,
  PlatformType,
  DayOfWeek,
} from '@/types/optimize';

// ============================================================================
// Schemas
// ============================================================================

const contentTypeSchema = z.enum(['reel', 'carousel', 'single_image', 'story', 'video']);
const platformTypeSchema = z.enum(['instagram', 'tiktok']);
const dayOfWeekSchema = z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
const recommendationTypeSchema = z.enum(['content_type', 'posting_time', 'caption', 'hashtag', 'format', 'trend']);

// ============================================================================
// Optimization Router
// ============================================================================

export const optimizeRouter = createTRPCRouter({
  // ==========================================================================
  // Performance Analysis
  // ==========================================================================

  analyzePerformance: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      platform: platformTypeSchema.optional(),
    }))
    .query(async ({ input }) => {
      return analyzePerformance({
        workspaceId: input.workspaceId,
        startDate: input.startDate,
        endDate: input.endDate,
        platform: input.platform,
      });
    }),

  getTopPerformingPosts: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
      limit: z.number().min(1).max(50).default(10),
      contentType: contentTypeSchema.optional(),
    }))
    .query(async ({ input }) => {
      return getTopPerformingPosts(
        input.workspaceId,
        input.limit,
        input.contentType
      );
    }),

  getEngagementTrends: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
      days: z.number().min(7).max(365).default(30),
    }))
    .query(async ({ input }) => {
      return getEngagementTrends(input.workspaceId, input.days);
    }),

  compareContentTypes: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
    }))
    .query(async ({ input }) => {
      return compareContentTypes(input.workspaceId);
    }),

  analyzeEngagementVelocity: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
      days: z.number().min(1).max(90).default(30),
    }))
    .query(async ({ input }) => {
      // Get posts first (using mock data from analyzer)
      const analysis = await analyzePerformance({
        workspaceId: input.workspaceId,
        startDate: new Date(Date.now() - input.days * 24 * 60 * 60 * 1000),
      });
      return analyzeEngagementVelocity(analysis.topPerformingPosts);
    }),

  // ==========================================================================
  // Recommendations
  // ==========================================================================

  getRecommendations: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
      type: recommendationTypeSchema.optional(),
    }))
    .query(async ({ input }) => {
      return generateRecommendations(input.workspaceId, input.type);
    }),

  generateContentIdeas: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
      contentType: contentTypeSchema.optional(),
      platform: platformTypeSchema.optional(),
      count: z.number().min(1).max(20).default(5),
      theme: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return generateContentIdeas({
        workspaceId: input.workspaceId,
        contentType: input.contentType,
        platform: input.platform,
        count: input.count,
        theme: input.theme,
      });
    }),

  generateCaptionSuggestions: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
      caption: z.string(),
      hashtags: z.array(z.string()),
      contentType: contentTypeSchema,
      platform: platformTypeSchema,
      mediaUrls: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      return generateCaptionSuggestions({
        workspaceId: input.workspaceId,
        caption: input.caption,
        hashtags: input.hashtags,
        contentType: input.contentType,
        platform: input.platform,
        mediaUrls: input.mediaUrls,
      });
    }),

  recommendHashtags: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
      niche: z.string(),
      count: z.number().min(5).max(50).default(30),
    }))
    .query(async ({ input }) => {
      return recommendHashtags(input.workspaceId, input.niche, input.count);
    }),

  generateABTestSuggestions: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
    }))
    .query(async ({ input }) => {
      return generateABTestSuggestions(input.workspaceId);
    }),

  // ==========================================================================
  // Scoring & Optimization
  // ==========================================================================

  calculateScore: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
      caption: z.string(),
      hashtags: z.array(z.string()),
      contentType: contentTypeSchema,
      platform: platformTypeSchema,
      mediaUrls: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      return calculateContentScore({
        workspaceId: input.workspaceId,
        caption: input.caption,
        hashtags: input.hashtags,
        contentType: input.contentType,
        platform: input.platform,
        mediaUrls: input.mediaUrls,
      });
    }),

  optimizePost: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
      caption: z.string(),
      hashtags: z.array(z.string()),
      contentType: contentTypeSchema,
      platform: platformTypeSchema,
      mediaUrls: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      return optimizePost({
        workspaceId: input.workspaceId,
        caption: input.caption,
        hashtags: input.hashtags,
        contentType: input.contentType,
        platform: input.platform,
        mediaUrls: input.mediaUrls,
      });
    }),

  generateChecklist: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
      caption: z.string(),
      hashtags: z.array(z.string()),
      contentType: contentTypeSchema,
      platform: platformTypeSchema,
      mediaUrls: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      return generateOptimizationChecklist({
        workspaceId: input.workspaceId,
        caption: input.caption,
        hashtags: input.hashtags,
        contentType: input.contentType,
        platform: input.platform,
        mediaUrls: input.mediaUrls,
      });
    }),

  // ==========================================================================
  // Calendar
  // ==========================================================================

  calendar: createTRPCRouter({
    get: protectedProcedure
      .input(z.object({
        workspaceId: z.string(),
        startDate: z.date(),
        endDate: z.date(),
        view: z.enum(['week', 'month']).default('week'),
      }))
      .query(async ({ input }) => {
        return getCalendar(
          input.workspaceId,
          input.startDate,
          input.endDate,
          input.view
        );
      }),

    getUpcoming: protectedProcedure
      .input(z.object({
        workspaceId: z.string(),
        limit: z.number().min(1).max(50).default(10),
      }))
      .query(async ({ input }) => {
        return getUpcomingEvents(input.workspaceId, input.limit);
      }),

    getEvent: protectedProcedure
      .input(z.object({
        eventId: z.string(),
      }))
      .query(async ({ input }) => {
        return getEventById(input.eventId);
      }),

    create: protectedProcedure
      .input(z.object({
        workspaceId: z.string(),
        title: z.string(),
        contentType: contentTypeSchema,
        platform: platformTypeSchema,
        scheduledAt: z.date(),
        caption: z.string().optional(),
        hashtags: z.array(z.string()).optional(),
        mediaUrls: z.array(z.string()).optional(),
        reminder: z.object({
          enabled: z.boolean(),
          minutesBefore: z.number(),
        }).optional(),
      }))
      .mutation(async ({ input }) => {
        return createEvent({
          workspaceId: input.workspaceId,
          title: input.title,
          contentType: input.contentType,
          platform: input.platform,
          scheduledAt: input.scheduledAt,
          caption: input.caption,
          hashtags: input.hashtags,
          mediaUrls: input.mediaUrls,
          reminder: input.reminder,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        eventId: z.string(),
        updates: z.object({
          title: z.string().optional(),
          description: z.string().optional(),
          scheduledAt: z.date().optional(),
          status: z.enum(['draft', 'scheduled', 'published', 'failed']).optional(),
          content: z.object({
            caption: z.string().optional(),
            hashtags: z.array(z.string()).optional(),
            mediaUrls: z.array(z.string()).optional(),
          }).optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return updateEvent(input.eventId, input.updates);
      }),

    delete: protectedProcedure
      .input(z.object({
        eventId: z.string(),
      }))
      .mutation(async ({ input }) => {
        return deleteEvent(input.eventId);
      }),

    publish: protectedProcedure
      .input(z.object({
        eventId: z.string(),
      }))
      .mutation(async ({ input }) => {
        return publishEvent(input.eventId);
      }),

    reorder: protectedProcedure
      .input(z.object({
        workspaceId: z.string(),
        eventId: z.string(),
        newScheduledAt: z.date(),
      }))
      .mutation(async ({ input }) => {
        return reorderEvents(
          input.workspaceId,
          input.eventId,
          input.newScheduledAt
        );
      }),

    bulkSchedule: protectedProcedure
      .input(z.object({
        workspaceId: z.string(),
        eventIds: z.array(z.string()),
        baseDate: z.date(),
        intervalDays: z.number().min(1).default(1),
      }))
      .mutation(async ({ input }) => {
        return bulkSchedule(
          input.workspaceId,
          input.eventIds,
          input.baseDate,
          input.intervalDays
        );
      }),

    reschedule: protectedProcedure
      .input(z.object({
        eventId: z.string(),
        newDate: z.date(),
        keepTime: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        return rescheduleEvent(
          input.eventId,
          input.newDate,
          input.keepTime
        );
      }),
  }),

  // ==========================================================================
  // Content Queue
  // ==========================================================================

  queue: createTRPCRouter({
    get: protectedProcedure
      .input(z.object({
        workspaceId: z.string(),
      }))
      .query(async ({ input }) => {
        return getContentQueue(input.workspaceId);
      }),

    add: protectedProcedure
      .input(z.object({
        workspaceId: z.string(),
        idea: z.object({
          title: z.string(),
          description: z.string(),
          contentType: contentTypeSchema,
          platform: platformTypeSchema,
          suggestedHashtags: z.array(z.string()),
          suggestedCaption: z.string(),
          estimatedEngagement: z.number(),
          trendScore: z.number(),
          relevanceScore: z.number(),
          source: z.enum(['ai', 'trending', 'competitor', 'historical']),
        }),
      }))
      .mutation(async ({ input }) => {
        return addToQueue(input.workspaceId, {
          ...input.idea,
          id: '', // Will be generated by service
        });
      }),

    remove: protectedProcedure
      .input(z.object({
        workspaceId: z.string(),
        ideaId: z.string(),
      }))
      .mutation(async ({ input }) => {
        return removeFromQueue(input.workspaceId, input.ideaId);
      }),

    convertToEvent: protectedProcedure
      .input(z.object({
        workspaceId: z.string(),
        ideaId: z.string(),
        scheduledAt: z.date(),
      }))
      .mutation(async ({ input }) => {
        return convertIdeaToEvent(
          input.workspaceId,
          input.ideaId,
          input.scheduledAt
        );
      }),
  }),

  // ==========================================================================
  // Best Time Calculator
  // ==========================================================================

  calculateBestTime: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
      contentType: contentTypeSchema.optional(),
      platform: platformTypeSchema.optional(),
      daysAhead: z.number().min(1).max(30).default(7),
    }))
    .query(async ({ input }) => {
      return calculateBestTime({
        workspaceId: input.workspaceId,
        contentType: input.contentType,
        platform: input.platform,
        daysAhead: input.daysAhead,
      });
    }),

  // ==========================================================================
  // Analytics
  // ==========================================================================

  getCalendarAnalytics: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
      startDate: z.date(),
      endDate: z.date(),
    }))
    .query(async ({ input }) => {
      return getCalendarAnalytics(
        input.workspaceId,
        input.startDate,
        input.endDate
      );
    }),
});
