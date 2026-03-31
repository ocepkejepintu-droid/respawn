/**
 * Data Aggregation Service
 * 
 * Aggregates data from various sources (scraped posts, hashtags, competitors)
 * to prepare it for trend detection and briefing generation.
 */

import { prisma } from '@/lib/prisma'
import {
  TimeRange,
  type AggregationResult,
  type HashtagAggregationData,
  type CompetitorAggregationData,
  type ScrapedPostMetrics,
  type PostAggregationData,
} from '@/types/briefing'
import { Platform } from '@prisma/client'

type SnapshotPost = {
  id: string
  platformPostId: string
  contentType: string
  likesCount: number
  commentsCount: number
  sharesCount: number
  viewsCount: number
  engagementRate: number
  postedAt: string
}

type HashtagSnapshot = {
  postCount: number
  velocity?: number
  posts?: SnapshotPost[]
}

type CompetitorSnapshot = {
  followerCount: number
  posts?: SnapshotPost[]
}

function mapSnapshotPosts(posts: SnapshotPost[] | undefined): ScrapedPostMetrics[] {
  return (posts || []).map((post) => ({
    id: post.id,
    platformPostId: post.platformPostId,
    engagementRate: post.engagementRate,
    likesCount: post.likesCount,
    commentsCount: post.commentsCount,
    sharesCount: post.sharesCount,
    viewsCount: post.viewsCount,
    postedAt: new Date(post.postedAt),
    contentType: post.contentType,
  }))
}

// ============================================================================
// TIME RANGE UTILITIES
// ============================================================================

/**
 * Get date range based on time range selection
 */
export function getDateRange(timeRange: TimeRange): {
  currentStart: Date
  currentEnd: Date
  previousStart: Date
  previousEnd: Date
} {
  const now = new Date()
  const currentEnd = now

  let currentStart: Date
  let previousStart: Date
  let previousEnd: Date

  switch (timeRange) {
    case TimeRange.LAST_24H:
      currentStart = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      previousStart = new Date(now.getTime() - 48 * 60 * 60 * 1000)
      previousEnd = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      break
    case TimeRange.LAST_7D:
      currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      previousStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
      previousEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case TimeRange.LAST_30D:
    default:
      currentStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      previousStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
      previousEnd = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
  }

  return { currentStart, currentEnd, previousStart, previousEnd }
}

/**
 * Calculate velocity (posts per hour)
 */
function calculateVelocity(postCount: number, hours: number): number {
  return hours > 0 ? postCount / hours : 0
}

// ============================================================================
// HASHTAG AGGREGATION
// ============================================================================

/**
 * Aggregate hashtag data for the briefing period
 */
export async function aggregateHashtagData(
  workspaceId: string,
  timeRange: TimeRange
): Promise<HashtagAggregationData[]> {
  const { currentStart, currentEnd, previousStart, previousEnd } = getDateRange(timeRange)

  // Get tracked hashtags for workspace
  const trackedHashtags = await prisma.hashtagTrack.findMany({
    where: {
      workspaceId,
      isActive: true,
    },
    select: {
      tag: true,
      platform: true,
      metadata: true,
    },
  })

  const results: HashtagAggregationData[] = []

  for (const tracked of trackedHashtags) {
    // Current period posts
    const currentPosts = await prisma.scrapedPost.findMany({
      where: {
        workspaceId,
        platform: tracked.platform,
        hashtags: {
          has: tracked.tag,
        },
        postedAt: {
          gte: currentStart,
          lte: currentEnd,
        },
      },
      select: {
        id: true,
        platformPostId: true,
        engagementRate: true,
        likesCount: true,
        commentsCount: true,
        sharesCount: true,
        viewsCount: true,
        postedAt: true,
        contentType: true,
      },
      orderBy: {
        postedAt: 'desc',
      },
    })

    // Previous period posts
    const previousPosts = await prisma.scrapedPost.count({
      where: {
        workspaceId,
        platform: tracked.platform,
        hashtags: {
          has: tracked.tag,
        },
        postedAt: {
          gte: previousStart,
          lte: previousEnd,
        },
      },
    })

    const latestSnapshot = (tracked.metadata as { latestSnapshot?: HashtagSnapshot } | null)?.latestSnapshot
    const previousSnapshot = (tracked.metadata as { previousSnapshot?: HashtagSnapshot } | null)?.previousSnapshot
    const fallbackPosts = currentPosts.length === 0 ? mapSnapshotPosts(latestSnapshot?.posts) : []
    const effectivePosts = currentPosts.length > 0 ? currentPosts : fallbackPosts
    const hoursInPeriod = (currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60)
    const currentPostCount = currentPosts.length > 0 ? currentPosts.length : latestSnapshot?.postCount || 0
    const previousPostCount = previousPosts > 0 ? previousPosts : previousSnapshot?.postCount || 0

    results.push({
      tag: tracked.tag,
      platform: tracked.platform,
      currentPostCount,
      previousPostCount,
      velocity: latestSnapshot?.velocity || calculateVelocity(currentPostCount, hoursInPeriod),
      posts: effectivePosts.map(post => ({
        id: post.id,
        platformPostId: post.platformPostId,
        engagementRate: post.engagementRate || 0,
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        sharesCount: post.sharesCount,
        viewsCount: post.viewsCount,
        postedAt: post.postedAt,
        contentType: post.contentType,
      })),
    })
  }

  return results
}

// ============================================================================
// COMPETITOR AGGREGATION
// ============================================================================

/**
 * Aggregate competitor activity data
 */
export async function aggregateCompetitorData(
  workspaceId: string,
  timeRange: TimeRange
): Promise<CompetitorAggregationData[]> {
  const { currentStart, currentEnd, previousStart, previousEnd } = getDateRange(timeRange)

  // Get competitors for workspace
  const competitors = await prisma.competitor.findMany({
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
      followerCount: true,
      metadata: true,
    },
  })

  const results: CompetitorAggregationData[] = []

  for (const competitor of competitors) {
    // Current period posts
    const currentPosts = await prisma.scrapedPost.findMany({
      where: {
        workspaceId,
        competitorId: competitor.id,
        postedAt: {
          gte: currentStart,
          lte: currentEnd,
        },
      },
      select: {
        id: true,
        platformPostId: true,
        engagementRate: true,
        likesCount: true,
        commentsCount: true,
        sharesCount: true,
        viewsCount: true,
        postedAt: true,
        contentType: true,
      },
      orderBy: {
        postedAt: 'desc',
      },
    })

    // Previous period for comparison
    const previousPosts = await prisma.scrapedPost.findMany({
      where: {
        workspaceId,
        competitorId: competitor.id,
        postedAt: {
          gte: previousStart,
          lte: previousEnd,
        },
      },
      select: {
        engagementRate: true,
      },
    })

    const latestSnapshot = (competitor.metadata as { latestSnapshot?: CompetitorSnapshot } | null)?.latestSnapshot
    const previousSnapshot = (competitor.metadata as { previousSnapshot?: CompetitorSnapshot } | null)?.previousSnapshot
    const fallbackPosts = currentPosts.length === 0 ? mapSnapshotPosts(latestSnapshot?.posts) : []
    const effectivePosts = currentPosts.length > 0 ? currentPosts : fallbackPosts

    // Calculate engagement metrics
    const currentEngagement = currentPosts.reduce((sum, p) => sum + (p.engagementRate || 0), 0)
    const previousEngagement = previousPosts.reduce((sum, p) => sum + (p.engagementRate || 0), 0)
    
    const engagementChange = previousEngagement > 0
      ? ((currentEngagement - previousEngagement) / previousEngagement) * 100
      : 0

    results.push({
      competitorId: competitor.id,
      posts: effectivePosts.map(post => ({
        id: post.id,
        platformPostId: post.platformPostId,
        engagementRate: post.engagementRate || 0,
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        sharesCount: post.sharesCount,
        viewsCount: post.viewsCount,
        postedAt: post.postedAt,
        contentType: post.contentType,
      })),
      followerChange: latestSnapshot && previousSnapshot
        ? latestSnapshot.followerCount - previousSnapshot.followerCount
        : 0,
      totalEngagement: currentEngagement,
      engagementChange,
    })
  }

  return results
}

// ============================================================================
// POST AGGREGATION
// ============================================================================

/**
 * Aggregate overall post statistics
 */
export async function aggregatePostData(
  workspaceId: string,
  timeRange: TimeRange
): Promise<PostAggregationData> {
  const { currentStart, currentEnd } = getDateRange(timeRange)

  const posts = await prisma.scrapedPost.findMany({
    where: {
      workspaceId,
      postedAt: {
        gte: currentStart,
        lte: currentEnd,
      },
    },
    select: {
      contentType: true,
      engagementRate: true,
      postedAt: true,
    },
  })

  // Content type breakdown
  const contentTypeBreakdown: Record<string, number> = {}
  for (const post of posts) {
    contentTypeBreakdown[post.contentType] = (contentTypeBreakdown[post.contentType] || 0) + 1
  }

  // Hourly distribution (24 hours)
  const hourlyDistribution = new Array(24).fill(0)
  for (const post of posts) {
    const hour = post.postedAt.getHours()
    hourlyDistribution[hour]++
  }

  // Average engagement
  const avgEngagementRate = posts.length > 0
    ? posts.reduce((sum, p) => sum + (p.engagementRate || 0), 0) / posts.length
    : 0

  return {
    totalPosts: posts.length,
    avgEngagementRate,
    contentTypeBreakdown,
    hourlyDistribution,
  }
}

// ============================================================================
// SENTIMENT AGGREGATION
// ============================================================================

/**
 * Aggregate sentiment data from posts
 */
export async function aggregateSentimentData(
  workspaceId: string,
  timeRange: TimeRange
): Promise<{ hashtag: string; currentSentiment: number; previousSentiment: number; shift: number; sampleSize: number; direction: 'positive' | 'negative' | 'neutral' }[]> {
  const { currentStart, currentEnd, previousStart, previousEnd } = getDateRange(timeRange)

  // Get hashtags with sentiment data
  const postsWithSentiment = await prisma.scrapedPost.findMany({
    where: {
      workspaceId,
      sentimentScore: { not: null },
      postedAt: {
        gte: currentStart,
        lte: currentEnd,
      },
    },
    select: {
      hashtags: true,
      sentimentScore: true,
    },
  })

  // Group by hashtag
  const hashtagSentiment: Record<string, { current: number[]; previous: number[] }> = {}

  for (const post of postsWithSentiment) {
    for (const hashtag of post.hashtags) {
      if (!hashtagSentiment[hashtag]) {
        hashtagSentiment[hashtag] = { current: [], previous: [] }
      }
      if (post.sentimentScore !== null) {
        hashtagSentiment[hashtag].current.push(post.sentimentScore)
      }
    }
  }

  // Calculate averages and shifts
  return Object.entries(hashtagSentiment)
    .filter(([, data]) => data.current.length >= 5) // Minimum sample size
    .map(([hashtag, data]) => {
      const currentAvg = data.current.reduce((a, b) => a + b, 0) / data.current.length
      const previousAvg = data.previous.length > 0
        ? data.previous.reduce((a, b) => a + b, 0) / data.previous.length
        : currentAvg

      const shift = currentAvg - previousAvg
      
      let direction: 'positive' | 'negative' | 'neutral'
      if (shift > 0.1) direction = 'positive'
      else if (shift < -0.1) direction = 'negative'
      else direction = 'neutral'

      return {
        hashtag,
        currentSentiment: currentAvg,
        previousSentiment: previousAvg,
        shift,
        sampleSize: data.current.length,
        direction,
      }
    })
}

// ============================================================================
// MAIN AGGREGATION FUNCTION
// ============================================================================

/**
 * Aggregate all data for briefing generation
 */
export async function aggregateBriefingData(
  workspaceId: string,
  timeRange: TimeRange = TimeRange.LAST_24H
): Promise<AggregationResult> {
  const [hashtagData, competitorData, postData] = await Promise.all([
    aggregateHashtagData(workspaceId, timeRange),
    aggregateCompetitorData(workspaceId, timeRange),
    aggregatePostData(workspaceId, timeRange),
  ])

  return {
    workspaceId,
    date: new Date(),
    timeRange,
    hashtagData,
    competitorData,
    postData,
  }
}

// ============================================================================
// MOCK DATA GENERATOR (for development)
// ============================================================================

/**
 * Generate mock aggregation data for development
 */
export function generateMockAggregationData(
  workspaceId: string,
  timeRange: TimeRange = TimeRange.LAST_24H
): AggregationResult {
  const now = new Date()
  
  const mockHashtags = ['marketing', 'digital', 'socialmedia', 'branding', 'content', 'strategy']
  const mockContentTypes = ['image', 'video', 'carousel', 'reel', 'story']
  
  const hashtagData: HashtagAggregationData[] = mockHashtags.map((tag, i) => {
    const currentPosts = Math.floor(Math.random() * 500) + 50
    const previousPosts = Math.floor(currentPosts * (0.5 + Math.random()))
    
    return {
      tag,
      platform: Platform.INSTAGRAM,
      currentPostCount: currentPosts,
      previousPostCount: previousPosts,
      velocity: currentPosts / 24,
      posts: Array.from({ length: Math.min(5, currentPosts) }, (_, j) => ({
        id: `post-${i}-${j}`,
        platformPostId: `ig-${Date.now()}-${j}`,
        engagementRate: Math.random() * 10,
        likesCount: Math.floor(Math.random() * 10000),
        commentsCount: Math.floor(Math.random() * 500),
        sharesCount: Math.floor(Math.random() * 200),
        viewsCount: Math.floor(Math.random() * 50000),
        postedAt: new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000),
        contentType: mockContentTypes[Math.floor(Math.random() * mockContentTypes.length)],
      })),
    }
  })

  const competitorData: CompetitorAggregationData[] = [
    {
      competitorId: 'comp-1',
      posts: Array.from({ length: 3 }, (_, i) => ({
        id: `comp-post-1-${i}`,
        platformPostId: `ig-comp1-${Date.now()}-${i}`,
        engagementRate: Math.random() * 8 + 2,
        likesCount: Math.floor(Math.random() * 5000) + 1000,
        commentsCount: Math.floor(Math.random() * 300),
        sharesCount: Math.floor(Math.random() * 100),
        viewsCount: Math.floor(Math.random() * 20000),
        postedAt: new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000),
        contentType: mockContentTypes[Math.floor(Math.random() * mockContentTypes.length)],
      })),
      followerChange: Math.floor(Math.random() * 1000) - 200,
      totalEngagement: 25.5,
      engagementChange: 15.3,
    },
    {
      competitorId: 'comp-2',
      posts: Array.from({ length: 5 }, (_, i) => ({
        id: `comp-post-2-${i}`,
        platformPostId: `ig-comp2-${Date.now()}-${i}`,
        engagementRate: Math.random() * 6 + 1,
        likesCount: Math.floor(Math.random() * 3000) + 500,
        commentsCount: Math.floor(Math.random() * 200),
        sharesCount: Math.floor(Math.random() * 80),
        viewsCount: Math.floor(Math.random() * 15000),
        postedAt: new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000),
        contentType: mockContentTypes[Math.floor(Math.random() * mockContentTypes.length)],
      })),
      followerChange: Math.floor(Math.random() * 800) - 100,
      totalEngagement: 18.2,
      engagementChange: -5.7,
    },
  ]

  const postData: PostAggregationData = {
    totalPosts: hashtagData.reduce((sum, h) => sum + h.currentPostCount, 0),
    avgEngagementRate: 4.5,
    contentTypeBreakdown: {
      image: 45,
      video: 30,
      carousel: 15,
      reel: 8,
      story: 2,
    },
    hourlyDistribution: Array.from({ length: 24 }, () => Math.floor(Math.random() * 50)),
  }

  return {
    workspaceId,
    date: now,
    timeRange,
    hashtagData,
    competitorData,
    postData,
  }
}
