/**
 * Briefing tRPC Router
 * 
 * Exposes briefing-related functionality through tRPC endpoints.
 */

import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/trpc'
import {
  generateBriefing,
  getLatestBriefing,
  getBriefingHistory,
  markAlertRead,
  markAllAlertsRead,
} from '@/server/services/briefing'
import { refreshBriefingSources } from '@/server/services/briefing/refresh'
import { TimeRange } from '@/types/briefing'

// ============================================================================
// Schemas
// ============================================================================

const timeRangeSchema = z.enum(['24h', '7d', '30d']).default('24h')

const briefingSettingsSchema = z.object({
  isEnabled: z.boolean().default(true),
  deliveryTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).default('08:00'),
  timezone: z.string().default('UTC'),
  timeRange: timeRangeSchema,
  emailDelivery: z.boolean().default(true),
  inAppNotifications: z.boolean().default(true),
  alertPreferences: z.object({
    hashtagTrending: z.boolean().default(true),
    hashtagDeclining: z.boolean().default(true),
    competitorPost: z.boolean().default(true),
    engagementSpike: z.boolean().default(true),
    sentimentShift: z.boolean().default(true),
    newContentFormat: z.boolean().default(true),
    viralContent: z.boolean().default(true),
    mentionAlert: z.boolean().default(true),
  }),
  thresholds: z.object({
    hashtagVelocityThreshold: z.number().default(50),
    competitorPostThreshold: z.number().default(1),
    engagementSpikeThreshold: z.number().default(75),
    sentimentShiftThreshold: z.number().default(0.3),
    viralContentThreshold: z.number().default(10),
  }),
  includedCompetitors: z.array(z.string()).default([]),
  includedHashtags: z.array(z.string()).default([]),
  excludedHashtags: z.array(z.string()).default([]),
  platforms: z.array(z.enum(['INSTAGRAM', 'TIKTOK', 'TWITTER', 'LINKEDIN', 'FACEBOOK', 'YOUTUBE'])).default(['INSTAGRAM']),
})

// ============================================================================
// Router
// ============================================================================

export const briefingRouter = createTRPCRouter({
  // ==========================================================================
  // Briefing Retrieval
  // ==========================================================================

  /**
   * Get the latest briefing for a workspace
   */
  getLatest: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
    }))
    .query(async ({ input }) => {
      const briefing = await getLatestBriefing(input.workspaceId)
      return { briefing }
    }),

  /**
   * Get briefing by ID (or generate new one)
   */
  get: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
      briefingId: z.string().optional(),
      timeRange: timeRangeSchema.optional(),
    }))
    .query(async ({ input }) => {
      // If briefingId is provided, fetch specific briefing
      if (input.briefingId) {
        // In production, fetch from database
        // For now, generate a new one
        const briefing = await generateBriefing({
          workspaceId: input.workspaceId,
          timeRange: input.timeRange as TimeRange,
        })
        return { briefing }
      }

      // Otherwise get latest
      const briefing = await getLatestBriefing(input.workspaceId)
      return { briefing }
    }),

  /**
   * Generate a new briefing (force refresh)
   */
  generate: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
      timeRange: timeRangeSchema.optional(),
    }))
    .mutation(async ({ input }) => {
      const refresh = await refreshBriefingSources(input.workspaceId)
      const briefing = await generateBriefing({
        workspaceId: input.workspaceId,
        timeRange: input.timeRange as TimeRange,
        forceRegenerate: true,
      })
      return { briefing, refresh }
    }),

  /**
   * Get briefing history
   */
  getHistory: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
      limit: z.number().min(1).max(100).default(30),
      cursor: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const history = await getBriefingHistory(input.workspaceId, input.limit)
      
      return {
        briefings: history,
        nextCursor: history.length === input.limit 
          ? history[history.length - 1]?.id 
          : undefined,
      }
    }),

  // ==========================================================================
  // Alert Management
  // ==========================================================================

  /**
   * Mark a single alert as read
   */
  markAlertRead: protectedProcedure
    .input(z.object({
      briefingId: z.string(),
      alertId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const success = await markAlertRead(input.briefingId, input.alertId)
      return { success }
    }),

  /**
   * Mark all alerts in a briefing as read
   */
  markAllRead: protectedProcedure
    .input(z.object({
      briefingId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const count = await markAllAlertsRead(input.briefingId)
      return { count }
    }),

  /**
   * Get unread alerts count
   */
  getUnreadCount: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
    }))
    .query(async ({ input }) => {
      const briefing = await getLatestBriefing(input.workspaceId)
      const count = briefing?.alerts.filter(a => !a.isRead).length ?? 0
      return { count }
    }),

  // ==========================================================================
  // Settings
  // ==========================================================================

  /**
   * Get briefing settings for a workspace
   */
  getSettings: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
    }))
    .query(async ({ input }) => {
      // In production, fetch from database
      // Return default settings for now
      return {
        settings: {
          id: `settings-${input.workspaceId}`,
          workspaceId: input.workspaceId,
          isEnabled: true,
          deliveryTime: '08:00',
          timezone: 'UTC',
          timeRange: TimeRange.LAST_24H,
          emailDelivery: true,
          inAppNotifications: true,
          alertPreferences: {
            hashtagTrending: true,
            hashtagDeclining: true,
            competitorPost: true,
            engagementSpike: true,
            sentimentShift: true,
            newContentFormat: true,
            viralContent: true,
            mentionAlert: true,
          },
          thresholds: {
            hashtagVelocityThreshold: 50,
            competitorPostThreshold: 1,
            engagementSpikeThreshold: 75,
            sentimentShiftThreshold: 0.3,
            viralContentThreshold: 10,
          },
          includedCompetitors: [],
          includedHashtags: [],
          excludedHashtags: [],
          platforms: ['INSTAGRAM'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }
    }),

  /**
   * Update briefing settings
   */
  updateSettings: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
      settings: briefingSettingsSchema.partial(),
    }))
    .mutation(async ({ input }) => {
      // In production, save to database
      console.log(`[Briefing] Updating settings for workspace ${input.workspaceId}`, input.settings)
      
      return {
        success: true,
        settings: {
          id: `settings-${input.workspaceId}`,
          workspaceId: input.workspaceId,
          ...input.settings,
          updatedAt: new Date(),
        },
      }
    }),

  // ==========================================================================
  // Statistics
  // ==========================================================================

  /**
   * Get briefing statistics for a workspace
   */
  getStats: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
      days: z.number().min(1).max(90).default(30),
    }))
    .query(async ({ input }) => {
      // In production, calculate from historical data
      return {
        totalBriefings: 30,
        avgAlertsPerBriefing: 5.2,
        mostActiveCompetitor: 'Social Pro',
        topTrendingHashtag: '#marketing',
        totalTrendsDetected: 127,
        totalAlerts: 156,
        readRate: 0.85,
        trends: [
          { date: '2024-01-01', alerts: 4, trends: 3 },
          { date: '2024-01-02', alerts: 6, trends: 5 },
          { date: '2024-01-03', alerts: 3, trends: 2 },
          { date: '2024-01-04', alerts: 8, trends: 6 },
          { date: '2024-01-05', alerts: 5, trends: 4 },
        ],
      }
    }),

  // ==========================================================================
  // Polling
  // ==========================================================================

  /**
   * Poll for briefing updates (for real-time updates)
   */
  pollUpdates: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
      lastBriefingId: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const briefing = await getLatestBriefing(input.workspaceId)
      
      const hasNewBriefing = briefing && briefing.id !== input.lastBriefingId
      const hasUnreadAlerts = briefing?.alerts.some(a => !a.isRead) ?? false

      return {
        hasUpdate: hasNewBriefing || hasUnreadAlerts,
        briefing: hasNewBriefing ? briefing : null,
        unreadCount: briefing?.alerts.filter(a => !a.isRead).length ?? 0,
      }
    }),
})
