/**
 * Briefing Generator Service
 * 
 * Orchestrates the creation of daily briefings by:
 * 1. Aggregating data from various sources
 * 2. Running trend detection algorithms
 * 3. Generating insights and recommendations
 * 4. Compiling the final briefing
 */

import {
  BriefingStatus,
  TimeRange,
  type Briefing,
  type BriefingSummary,
  type BriefingSettings,
  type TrendAlert,
  type CompetitorActivity,
  type HashtagTrend,
  AlertSeverity,
} from '@/types/briefing'
import { prisma } from '@/lib/prisma'
import { AnalysisType, Platform, ReportStatus } from '@prisma/client'
import { aggregateBriefingData, aggregateCompetitorData, generateMockAggregationData } from './aggregator'
import { detectTrends } from './trend-detector'

// ============================================================================
// CONFIGURATION
// ============================================================================

const USE_MOCK_DATA = process.env.BRIEFING_USE_MOCK_DATA === 'true'
const BRIEFING_REPORT_TYPE = AnalysisType.CONTENT_TRENDS
const BRIEFING_REPORT_FLAG = 'briefing-history'

// ============================================================================
// COMPETITOR ACTIVITY GENERATION
// ============================================================================

/**
 * Generate competitor activity from aggregated data
 */
async function generateCompetitorActivity(
  workspaceId: string,
  timeRange: TimeRange
): Promise<CompetitorActivity[]> {
  const [competitors, competitorData] = await Promise.all([
    prisma.competitor.findMany({
      where: {
        workspaceId,
        isActive: true,
      },
      select: {
        id: true,
        handle: true,
        displayName: true,
        platform: true,
        avatarUrl: true,
      },
    }),
    aggregateCompetitorData(workspaceId, timeRange),
  ])

  return competitors.map((competitor) => {
    const aggregated = competitorData.find((entry) => entry.competitorId === competitor.id)
    const posts = (aggregated?.posts || []).map((post) => ({
      id: post.id,
      platformPostId: post.platformPostId,
      contentType: post.contentType,
      caption: undefined,
      mediaUrls: [],
      permalink: '',
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      sharesCount: post.sharesCount,
      viewsCount: post.viewsCount,
      engagementRate: post.engagementRate,
      postedAt: post.postedAt,
      hashtags: [],
      sentimentScore: undefined,
    }))

    return {
      id: `activity-${competitor.id}`,
      competitorId: competitor.id,
      competitorName: competitor.displayName || competitor.handle,
      competitorHandle: competitor.handle,
      platform: competitor.platform,
      avatarUrl: competitor.avatarUrl || undefined,
      posts,
      engagementChange: aggregated?.engagementChange || 0,
      followerChange: aggregated?.followerChange || 0,
      lastActiveAt: posts[0]?.postedAt || new Date(),
    }
  })
}

function serializeBriefing(briefing: Briefing) {
  return JSON.parse(JSON.stringify(briefing))
}

function hydrateBriefing(raw: any): Briefing {
  return {
    ...raw,
    date: new Date(raw.date),
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
    deliveredAt: raw.deliveredAt ? new Date(raw.deliveredAt) : undefined,
    alerts: (raw.alerts || []).map((alert: any) => ({
      ...alert,
      createdAt: new Date(alert.createdAt),
    })),
    competitorActivity: (raw.competitorActivity || []).map((activity: any) => ({
      ...activity,
      lastActiveAt: new Date(activity.lastActiveAt),
      posts: (activity.posts || []).map((post: any) => ({
        ...post,
        postedAt: new Date(post.postedAt),
      })),
    })),
  }
}

async function persistBriefingHistory(briefing: Briefing) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: briefing.workspaceId },
    select: {
      ownerId: true,
    },
  })

  if (!workspace) {
    throw new Error(`Workspace ${briefing.workspaceId} not found while storing briefing history`)
  }

  await prisma.analysisReport.create({
    data: {
      title: `Morning Briefing - ${briefing.date.toISOString()}`,
      description: 'Persisted manual briefing history entry',
      type: BRIEFING_REPORT_TYPE,
      status: ReportStatus.COMPLETED,
      dateRangeStart: briefing.date,
      dateRangeEnd: briefing.date,
      config: {
        source: BRIEFING_REPORT_FLAG,
        timeRange: briefing.timeRange,
      },
      results: serializeBriefing(briefing),
      insights: briefing.insights,
      recommendations: briefing.recommendations,
      completedAt: briefing.updatedAt,
      workspaceId: briefing.workspaceId,
      createdById: workspace.ownerId,
    },
  })
}

async function getStoredBriefingReports(workspaceId: string) {
  const reports = await prisma.analysisReport.findMany({
    where: {
      workspaceId,
      type: BRIEFING_REPORT_TYPE,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return reports.filter((report) => {
    const config = report.config as { source?: string } | null
    return config?.source === BRIEFING_REPORT_FLAG
  })
}

// ============================================================================
// SUMMARY GENERATION
// ============================================================================

/**
 * Generate briefing summary from alerts and trends
 */
function generateSummary(
  alerts: TrendAlert[],
  competitorActivity: CompetitorActivity[],
  hashtagTrends: HashtagTrend[]
): BriefingSummary {
  return {
    totalAlerts: alerts.length,
    criticalAlerts: alerts.filter(a => a.severity === AlertSeverity.CRITICAL).length,
    highAlerts: alerts.filter(a => a.severity === AlertSeverity.HIGH).length,
    unreadAlerts: alerts.filter(a => !a.isRead).length,
    totalCompetitorPosts: competitorActivity.reduce((sum, c) => sum + c.posts.length, 0),
    trendingHashtags: hashtagTrends.filter(h => h.isTrending).length,
    decliningHashtags: hashtagTrends.filter(h => h.direction === 'down').length,
    engagementSpikes: alerts.filter(a => a.type === 'engagement_spike').length,
  }
}

// ============================================================================
// RECOMMENDATIONS GENERATION
// ============================================================================

/**
 * Generate actionable recommendations based on briefing data
 */
function generateRecommendations(
  alerts: TrendAlert[],
  trends: HashtagTrend[],
  competitorActivity: CompetitorActivity[]
): string[] {
  const recommendations: string[] = []

  // Hashtag recommendations
  const trendingHashtags = trends.filter(t => t.isTrending).slice(0, 3)
  if (trendingHashtags.length > 0) {
    const hashtags = trendingHashtags.map(t => `#${t.tag}`).join(', ')
    recommendations.push(`Create content using trending hashtags: ${hashtags}`)
  }

  // Engagement recommendations
  const engagementAlerts = alerts.filter(a => a.type === 'engagement_spike')
  if (engagementAlerts.length > 0) {
    recommendations.push('Your engagement is spiking - consider increasing post frequency today')
  }

  // Competitor recommendations
  const activeCompetitors = competitorActivity.filter(c => c.posts.length >= 2)
  if (activeCompetitors.length > 0) {
    const names = activeCompetitors.map(c => c.competitorName).join(', ')
    recommendations.push(`${names} ${activeCompetitors.length === 1 ? 'is' : 'are'} posting frequently - monitor their strategy`)
  }

  // Best time recommendations
  recommendations.push('Best posting times today: 9:00 AM, 12:00 PM, and 7:00 PM based on your audience activity')

  // Content format recommendations
  const hasVideoAlert = alerts.some(a => 
    a.description.toLowerCase().includes('video') || 
    a.description.toLowerCase().includes('reel')
  )
  if (hasVideoAlert) {
    recommendations.push('Video content is performing well - prioritize Reels and video posts today')
  }

  return recommendations.slice(0, 5)
}

// ============================================================================
// MOCK BRIEFING GENERATOR (for development)
// ============================================================================

/**
 * Generate a complete mock briefing for development
 */
function generateMockBriefing(
  workspaceId: string,
  timeRange: TimeRange = TimeRange.LAST_24H
): Briefing {
  const now = new Date()
  const aggregationData = generateMockAggregationData(workspaceId, timeRange)
  
  // Run trend detection
  const allPosts = aggregationData.hashtagData.flatMap(h => h.posts)
  const trendResult = detectTrends({
    hashtagData: aggregationData.hashtagData,
    posts: allPosts,
    sentimentShifts: [],
    historicalAvgEngagement: 3.5,
  })

  // Generate competitor activity
  const competitorActivity: CompetitorActivity[] = [
    {
      id: 'act-1',
      competitorId: 'comp-1',
      competitorName: 'Social Pro Agency',
      competitorHandle: '@socialpro',
      platform: Platform.INSTAGRAM,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=socialpro',
      posts: [
        {
          id: 'post-1-1',
          platformPostId: 'ig-123',
          contentType: 'carousel',
          caption: '10 social media trends you need to know for 2024 🚀',
          mediaUrls: ['https://picsum.photos/400/400?random=1'],
          permalink: 'https://instagram.com/p/abc123',
          likesCount: 15420,
          commentsCount: 342,
          sharesCount: 156,
          viewsCount: 0,
          engagementRate: 8.5,
          postedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
          hashtags: ['#socialmedia', '#marketing', '#trends'],
          sentimentScore: 0.75,
        },
        {
          id: 'post-1-2',
          platformPostId: 'ig-124',
          contentType: 'reel',
          caption: 'How we grew our client\'s account by 300% 📈',
          mediaUrls: ['https://picsum.photos/400/400?random=2'],
          permalink: 'https://instagram.com/p/abc124',
          likesCount: 23100,
          commentsCount: 567,
          sharesCount: 892,
          viewsCount: 125000,
          engagementRate: 12.3,
          postedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
          hashtags: ['#growth', '#casestudy', '#instagram'],
          sentimentScore: 0.82,
        },
      ],
      engagementChange: 23.5,
      followerChange: 456,
      lastActiveAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    },
    {
      id: 'act-2',
      competitorId: 'comp-2',
      competitorName: 'Brand Masters Co',
      competitorHandle: '@brandmasters',
      platform: Platform.TIKTOK,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=brandmasters',
      posts: [
        {
          id: 'post-2-1',
          platformPostId: 'tt-456',
          contentType: 'video',
          caption: 'POV: You finally found the perfect brand voice ✨',
          mediaUrls: ['https://picsum.photos/400/400?random=3'],
          permalink: 'https://tiktok.com/@brandmasters/video/456',
          likesCount: 89200,
          commentsCount: 1234,
          sharesCount: 3456,
          viewsCount: 500000,
          engagementRate: 18.7,
          postedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
          hashtags: ['#branding', '#pov', '#marketing'],
          sentimentScore: 0.88,
        },
      ],
      engagementChange: 45.2,
      followerChange: 1234,
      lastActiveAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
    },
  ]

  // Generate summary
  const summary = generateSummary(trendResult.alerts, competitorActivity, trendResult.trendingHashtags)

  // Generate recommendations
  const recommendations = generateRecommendations(
    trendResult.alerts,
    trendResult.trendingHashtags,
    competitorActivity
  )

  return {
    id: `briefing-${workspaceId}-${now.getTime()}`,
    workspaceId,
    date: now,
    status: BriefingStatus.READY,
    timeRange,
    summary,
    alerts: trendResult.alerts,
    competitorActivity,
    hashtagTrends: trendResult.trendingHashtags,
    sentimentShifts: [],
    emergingFormats: [],
    insights: trendResult.insights,
    recommendations,
    createdAt: now,
    updatedAt: now,
  }
}

// ============================================================================
// MAIN GENERATION FUNCTION
// ============================================================================

export interface GenerateBriefingOptions {
  workspaceId: string
  timeRange?: TimeRange
  forceRegenerate?: boolean
}

/**
 * Generate a morning briefing for a workspace
 */
export async function generateBriefing(
  options: GenerateBriefingOptions
): Promise<Briefing> {
  const { workspaceId, timeRange = TimeRange.LAST_24H, forceRegenerate = false } = options

  console.log(`[Briefing] Generating briefing for workspace ${workspaceId}...`)

  // Use mock data in development
  if (USE_MOCK_DATA) {
    console.log('[Briefing] Using mock data for development')
    return generateMockBriefing(workspaceId, timeRange)
  }

  try {
    // Aggregate data
    const aggregationData = await aggregateBriefingData(workspaceId, timeRange)

    // Run trend detection
    const allPosts = aggregationData.hashtagData.flatMap(h => h.posts)
    const trendResult = detectTrends({
      hashtagData: aggregationData.hashtagData,
      posts: allPosts,
      historicalAvgEngagement: aggregationData.postData.avgEngagementRate,
    })

    // Generate competitor activity
    const competitorActivity = await generateCompetitorActivity(workspaceId, timeRange)

    // Generate summary
    const summary = generateSummary(
      trendResult.alerts,
      competitorActivity,
      trendResult.trendingHashtags
    )

    // Generate recommendations
    const recommendations = generateRecommendations(
      trendResult.alerts,
      trendResult.trendingHashtags,
      competitorActivity
    )

    // Create the briefing
    const now = new Date()
    const briefing: Briefing = {
      id: `briefing-${workspaceId}-${now.getTime()}`,
      workspaceId,
      date: now,
      status: BriefingStatus.READY,
      timeRange,
      summary,
      alerts: trendResult.alerts,
      competitorActivity,
      hashtagTrends: trendResult.trendingHashtags,
      sentimentShifts: [],
      emergingFormats: [],
      insights: trendResult.insights,
      recommendations,
      createdAt: now,
      updatedAt: now,
    }

    console.log(`[Briefing] Generated briefing ${briefing.id} with ${briefing.alerts.length} alerts`)

    await persistBriefingHistory(briefing)

    return briefing
  } catch (error) {
    console.error('[Briefing] Failed to generate briefing:', error)
    throw error
  }
}

// ============================================================================
// BATCH GENERATION
// ============================================================================

/**
 * Generate briefings for multiple workspaces
 */
export async function generateBriefingsBatch(
  workspaceIds: string[],
  timeRange: TimeRange = TimeRange.LAST_24H
): Promise<{ success: string[]; failed: { workspaceId: string; error: string }[] }> {
  const results = {
    success: [] as string[],
    failed: [] as { workspaceId: string; error: string }[],
  }

  await Promise.all(
    workspaceIds.map(async (workspaceId) => {
      try {
        await generateBriefing({ workspaceId, timeRange })
        results.success.push(workspaceId)
      } catch (error) {
        results.failed.push({
          workspaceId,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    })
  )

  return results
}

// ============================================================================
// RETRIEVAL FUNCTIONS
// ============================================================================

/**
 * Get the latest briefing for a workspace
 */
export async function getLatestBriefing(
  workspaceId: string
): Promise<Briefing | null> {
  const reports = await getStoredBriefingReports(workspaceId)
  const latest = reports[0]

  if (latest?.results) {
    return hydrateBriefing(latest.results)
  }

  const competitorCount = await prisma.competitor.count({
    where: {
      workspaceId,
      isActive: true,
    },
  })
  const hashtagCount = await prisma.hashtagTrack.count({
    where: {
      workspaceId,
      isActive: true,
    },
  })

  if (competitorCount === 0 && hashtagCount === 0) {
    return null
  }

  return generateBriefing({ workspaceId })
}

/**
 * Get briefing history for a workspace
 */
export async function getBriefingHistory(
  workspaceId: string,
  limit: number = 30
): Promise<{ id: string; date: Date; summary: BriefingSummary }[]> {
  const reports = await getStoredBriefingReports(workspaceId)

  return reports.slice(0, limit).flatMap((report) => {
    if (!report.results) {
      return []
    }

    const briefing = hydrateBriefing(report.results)
    return [{
      id: briefing.id,
      date: briefing.date,
      summary: briefing.summary,
    }]
  })
}

// ============================================================================
// ALERT MANAGEMENT
// ============================================================================

/**
 * Mark an alert as read
 */
export async function markAlertRead(
  briefingId: string,
  alertId: string
): Promise<boolean> {
  const reports = await prisma.analysisReport.findMany({
    where: {
      type: BRIEFING_REPORT_TYPE,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  const report = reports.find((entry) => {
    const config = entry.config as { source?: string } | null
    const results = entry.results as { id?: string } | null
    return config?.source === BRIEFING_REPORT_FLAG && results?.id === briefingId
  })

  if (!report?.results) {
    return false
  }

  const briefing = hydrateBriefing(report.results)
  const nextAlerts = briefing.alerts.map((alert) =>
    alert.id === alertId ? { ...alert, isRead: true } : alert
  )

  if (!nextAlerts.some((alert) => alert.id === alertId)) {
    return false
  }

  const updatedBriefing: Briefing = {
    ...briefing,
    alerts: nextAlerts,
    summary: {
      ...briefing.summary,
      unreadAlerts: nextAlerts.filter((alert) => !alert.isRead).length,
    },
    updatedAt: new Date(),
  }

  await prisma.analysisReport.update({
    where: { id: report.id },
    data: {
      results: serializeBriefing(updatedBriefing),
      insights: updatedBriefing.insights,
      recommendations: updatedBriefing.recommendations,
      updatedAt: updatedBriefing.updatedAt,
    },
  })

  return true
}

/**
 * Mark all alerts in a briefing as read
 */
export async function markAllAlertsRead(
  briefingId: string
): Promise<number> {
  const reports = await prisma.analysisReport.findMany({
    where: {
      type: BRIEFING_REPORT_TYPE,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  const report = reports.find((entry) => {
    const config = entry.config as { source?: string } | null
    const results = entry.results as { id?: string } | null
    return config?.source === BRIEFING_REPORT_FLAG && results?.id === briefingId
  })

  if (!report?.results) {
    return 0
  }

  const briefing = hydrateBriefing(report.results)
  const unreadCount = briefing.alerts.filter((alert) => !alert.isRead).length
  const updatedBriefing: Briefing = {
    ...briefing,
    alerts: briefing.alerts.map((alert) => ({ ...alert, isRead: true })),
    summary: {
      ...briefing.summary,
      unreadAlerts: 0,
    },
    updatedAt: new Date(),
  }

  await prisma.analysisReport.update({
    where: { id: report.id },
    data: {
      results: serializeBriefing(updatedBriefing),
      insights: updatedBriefing.insights,
      recommendations: updatedBriefing.recommendations,
      updatedAt: updatedBriefing.updatedAt,
    },
  })

  return unreadCount
}
