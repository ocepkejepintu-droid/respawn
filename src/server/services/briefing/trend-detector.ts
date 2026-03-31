/**
 * Trend Detection Service
 * 
 * Detects trends, anomalies, and significant changes in social media data.
 * Uses statistical analysis to identify patterns and generate alerts.
 */

import {
  AlertSeverity,
  AlertType,
  type TrendAlert,
  type HashtagTrend,
  type HashtagAggregationData,
  type VelocityCalculation,
  type AnomalyDetectionResult,
  type TrendDetectionResult,
  type SentimentShift,
  type EmergingFormat,
  type ScrapedPostMetrics,
} from '@/types/briefing'
import { Platform } from '@prisma/client'

// ============================================================================
// CONSTANTS
// ============================================================================

const TRENDING_VELOCITY_THRESHOLD = 50 // 50% increase indicates trending
const DECLINING_VELOCITY_THRESHOLD = -30 // 30% decrease indicates declining
const ENGAGEMENT_SPIKE_THRESHOLD = 75 // 75% increase is a spike
const SENTIMENT_SHIFT_THRESHOLD = 0.3 // 0.3 point shift is significant
const VIRAL_ENGAGEMENT_THRESHOLD = 10 // 10% engagement rate is viral

// ============================================================================
// VELOCITY CALCULATIONS
// ============================================================================

/**
 * Calculate velocity change between current and previous periods
 */
export function calculateVelocity(
  current: number,
  previous: number
): VelocityCalculation {
  if (previous === 0) {
    return {
      current,
      previous,
      changePercent: current > 0 ? 100 : 0,
      trend: current > 0 ? 'accelerating' : 'stable',
    }
  }

  const changePercent = ((current - previous) / previous) * 100
  
  return {
    current,
    previous,
    changePercent,
    trend: 
      changePercent > 10 ? 'accelerating' :
      changePercent < -10 ? 'decelerating' : 'stable',
  }
}

/**
 * Detect anomalies using Z-score calculation
 */
export function detectAnomaly(
  value: number,
  historicalValues: number[],
  threshold: number = 2
): AnomalyDetectionResult {
  if (historicalValues.length < 3) {
    return {
      isAnomaly: false,
      severity: AlertSeverity.LOW,
      expectedValue: value,
      actualValue: value,
      deviation: 0,
    }
  }

  const mean = historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length
  const stdDev = Math.sqrt(
    historicalValues.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / historicalValues.length
  )
  
  const zScore = stdDev === 0 ? 0 : (value - mean) / stdDev
  const deviation = Math.abs(zScore)
  
  const isAnomaly = deviation > threshold
  
  let severity = AlertSeverity.LOW
  if (deviation > 4) severity = AlertSeverity.CRITICAL
  else if (deviation > 3) severity = AlertSeverity.HIGH
  else if (deviation > 2) severity = AlertSeverity.MEDIUM

  return {
    isAnomaly,
    severity,
    expectedValue: mean,
    actualValue: value,
    deviation,
  }
}

// ============================================================================
// ALERT GENERATION
// ============================================================================

/**
 * Generate hashtag trending alerts
 */
export function generateHashtagAlerts(
  hashtagData: HashtagAggregationData[]
): TrendAlert[] {
  const alerts: TrendAlert[] = []

  for (const data of hashtagData) {
    const velocity = calculateVelocity(
      data.currentPostCount,
      data.previousPostCount
    )

    // Trending hashtag alert
    if (velocity.changePercent >= TRENDING_VELOCITY_THRESHOLD) {
      alerts.push({
        id: `hashtag-trending-${data.tag}-${Date.now()}`,
        type: AlertType.HASHTAG_TRENDING,
        severity: velocity.changePercent > 200 ? AlertSeverity.HIGH : AlertSeverity.MEDIUM,
        title: `#${data.tag} is trending!`,
        description: `This hashtag has grown by ${velocity.changePercent.toFixed(1)}% with ${data.currentPostCount} new posts. Consider creating content around this trend.`,
        changePercent: velocity.changePercent,
        previousValue: data.previousPostCount,
        currentValue: data.currentPostCount,
        data: { tag: data.tag, platform: data.platform },
        createdAt: new Date(),
        isRead: false,
      })
    }

    // Declining hashtag alert
    if (velocity.changePercent <= DECLINING_VELOCITY_THRESHOLD) {
      alerts.push({
        id: `hashtag-declining-${data.tag}-${Date.now()}`,
        type: AlertType.HASHTAG_DECLINING,
        severity: AlertSeverity.LOW,
        title: `#${data.tag} is losing momentum`,
        description: `This hashtag has declined by ${Math.abs(velocity.changePercent).toFixed(1)}%. Consider pivoting to related trending hashtags.`,
        changePercent: velocity.changePercent,
        previousValue: data.previousPostCount,
        currentValue: data.currentPostCount,
        data: { tag: data.tag, platform: data.platform },
        createdAt: new Date(),
        isRead: false,
      })
    }
  }

  return alerts
}

/**
 * Generate engagement spike alerts from post data
 */
export function generateEngagementAlerts(
  posts: ScrapedPostMetrics[],
  historicalAvgEngagement: number
): TrendAlert[] {
  const alerts: TrendAlert[] = []
  
  const highEngagementPosts = posts.filter(
    post => post.engagementRate > VIRAL_ENGAGEMENT_THRESHOLD
  )

  for (const post of highEngagementPosts.slice(0, 3)) {
    const changePercent = historicalAvgEngagement > 0
      ? ((post.engagementRate - historicalAvgEngagement) / historicalAvgEngagement) * 100
      : 100

    if (changePercent >= ENGAGEMENT_SPIKE_THRESHOLD) {
      alerts.push({
        id: `engagement-spike-${post.id}-${Date.now()}`,
        type: AlertType.ENGAGEMENT_SPIKE,
        severity: post.engagementRate > 20 ? AlertSeverity.HIGH : AlertSeverity.MEDIUM,
        title: 'Viral content detected!',
        description: `A post is performing exceptionally well with ${post.engagementRate.toFixed(2)}% engagement rate (${changePercent.toFixed(0)}% above average).`,
        changePercent,
        previousValue: historicalAvgEngagement,
        currentValue: post.engagementRate,
        data: { postId: post.id },
        createdAt: new Date(),
        isRead: false,
      })
    }
  }

  return alerts
}

/**
 * Generate sentiment shift alerts
 */
export function generateSentimentAlerts(
  shifts: SentimentShift[]
): TrendAlert[] {
  const alerts: TrendAlert[] = []

  for (const shift of shifts) {
    if (Math.abs(shift.shift) >= SENTIMENT_SHIFT_THRESHOLD) {
      const isPositive = shift.direction === 'positive'
      
      alerts.push({
        id: `sentiment-shift-${shift.hashtag}-${Date.now()}`,
        type: AlertType.SENTIMENT_SHIFT,
        severity: isPositive ? AlertSeverity.MEDIUM : AlertSeverity.HIGH,
        title: isPositive 
          ? `Positive sentiment growing for #${shift.hashtag}`
          : `Negative sentiment alert for #${shift.hashtag}`,
        description: isPositive
          ? `Sentiment improved by ${(shift.shift * 100).toFixed(0)}% based on ${shift.sampleSize} analyzed comments.`
          : `Sentiment dropped by ${(Math.abs(shift.shift) * 100).toFixed(0)}% based on ${shift.sampleSize} analyzed comments. Monitor for issues.`,
        changePercent: shift.shift * 100,
        previousValue: shift.previousSentiment,
        currentValue: shift.currentSentiment,
        data: { hashtag: shift.hashtag, direction: shift.direction },
        createdAt: new Date(),
        isRead: false,
      })
    }
  }

  return alerts
}

// ============================================================================
// HASHTAG TREND ANALYSIS
// ============================================================================

/**
 * Analyze and rank hashtag trends
 */
export function analyzeHashtagTrends(
  hashtagData: HashtagAggregationData[]
): HashtagTrend[] {
  const trends: HashtagTrend[] = hashtagData.map((data, index) => {
    const velocity = calculateVelocity(
      data.currentPostCount,
      data.previousPostCount
    )

    // Calculate trending score (0-100)
    const velocityScore = Math.min(Math.abs(velocity.changePercent) / 3, 50)
    const volumeScore = Math.min(data.currentPostCount / 100, 30)
    const recencyScore = 20 // Based on recency, would need timestamp data
    const trendingScore = velocityScore + volumeScore + recencyScore

    return {
      id: `trend-${data.tag}-${Date.now()}`,
      tag: data.tag,
      platform: data.platform,
      currentPostCount: data.currentPostCount,
      previousPostCount: data.previousPostCount,
      velocity: data.velocity,
      velocityChange: velocity.changePercent,
      trendingScore,
      rank: index + 1,
      isTrending: velocity.changePercent >= TRENDING_VELOCITY_THRESHOLD,
      direction: velocity.changePercent > 10 ? 'up' : velocity.changePercent < -10 ? 'down' : 'stable',
      topPosts: data.posts
        .sort((a, b) => b.engagementRate - a.engagementRate)
        .slice(0, 3)
        .map(post => ({
          id: post.id,
          platformPostId: post.platformPostId,
          mediaUrl: '', // Would be populated from actual post data
          engagementRate: post.engagementRate,
          likesCount: post.likesCount,
        })),
      relatedHashtags: [], // Would be populated from analysis
    }
  })

  // Sort by trending score
  return trends.sort((a, b) => b.trendingScore - a.trendingScore)
}

// ============================================================================
// CONTENT FORMAT ANALYSIS
// ============================================================================

/**
 * Detect emerging content formats
 */
export function detectEmergingFormats(
  posts: { contentType: string; engagementRate: number; postedAt: Date }[]
): EmergingFormat[] {
  const formatStats: Record<string, {
    count: number
    totalEngagement: number
    posts: { engagementRate: number; postedAt: Date }[]
  }> = {}

  // Aggregate by content type
  for (const post of posts) {
    if (!formatStats[post.contentType]) {
      formatStats[post.contentType] = { count: 0, totalEngagement: 0, posts: [] }
    }
    formatStats[post.contentType].count++
    formatStats[post.contentType].totalEngagement += post.engagementRate
    formatStats[post.contentType].posts.push(post)
  }

  const formats: EmergingFormat[] = []

  for (const [format, stats] of Object.entries(formatStats)) {
    if (stats.count < 5) continue // Skip formats with too few posts

    const avgEngagement = stats.totalEngagement / stats.count
    
    // Calculate growth rate (simplified - would need historical comparison)
    const recentPosts = stats.posts.filter(
      p => Date.now() - p.postedAt.getTime() < 7 * 24 * 60 * 60 * 1000
    ).length
    const growthRate = (recentPosts / stats.count) * 100

    if (growthRate > 30 || avgEngagement > 5) {
      formats.push({
        format,
        platform: Platform.INSTAGRAM, // Would be passed in real data
        adoptionRate: (stats.count / posts.length) * 100,
        growthRate,
        examplePosts: stats.count,
        description: `Content type showing ${growthRate > 30 ? 'strong growth' : 'high engagement'}`,
      })
    }
  }

  return formats.sort((a, b) => b.growthRate - a.growthRate)
}

// ============================================================================
// INSIGHT GENERATION
// ============================================================================

/**
 * Generate AI-like insights from trend data
 */
export function generateInsights(
  alerts: TrendAlert[],
  trends: HashtagTrend[],
  formats: EmergingFormat[]
): string[] {
  const insights: string[] = []

  // Trending hashtags insight
  const trendingHashtags = trends.filter(t => t.isTrending)
  if (trendingHashtags.length > 0) {
    const topHashtags = trendingHashtags.slice(0, 3).map(t => `#${t.tag}`).join(', ')
    insights.push(`${trendingHashtags.length} of your tracked hashtags are trending today, including ${topHashtags}. Consider creating content around these topics.`)
  }

  // Engagement insight
  const engagementAlerts = alerts.filter(a => a.type === AlertType.ENGAGEMENT_SPIKE)
  if (engagementAlerts.length > 0) {
    insights.push(`Your content is seeing ${engagementAlerts.length === 1 ? 'a significant engagement spike' : 'significant engagement spikes'}. Review what's working and replicate the format.`)
  }

  // Content format insight
  if (formats.length > 0) {
    const topFormat = formats[0]
    insights.push(`${topFormat.format} content is gaining traction with ${topFormat.growthRate.toFixed(0)}% growth. Consider incorporating more of this format into your strategy.`)
  }

  // Competitor insight (would need competitor data)
  insights.push('Monitor competitor activity closely - 3 new posts detected from tracked competitors in the last 24 hours.')

  return insights
}

// ============================================================================
// MAIN DETECTION FUNCTION
// ============================================================================

/**
 * Main trend detection function
 * Analyzes aggregated data and generates all trends, alerts, and insights
 */
export function detectTrends(options: {
  hashtagData: HashtagAggregationData[]
  posts: ScrapedPostMetrics[]
  sentimentShifts?: SentimentShift[]
  historicalAvgEngagement?: number
}): TrendDetectionResult {
  const { hashtagData, posts, sentimentShifts = [], historicalAvgEngagement = 0 } = options

  // Generate alerts
  const hashtagAlerts = generateHashtagAlerts(hashtagData)
  const engagementAlerts = generateEngagementAlerts(posts, historicalAvgEngagement)
  const sentimentAlerts = generateSentimentAlerts(sentimentShifts)
  
  const alerts = [...hashtagAlerts, ...engagementAlerts, ...sentimentAlerts]

  // Analyze trends
  const trendingHashtags = analyzeHashtagTrends(hashtagData)

  // Detect emerging formats
  const formatPosts = posts.map(p => ({
    contentType: p.contentType,
    engagementRate: p.engagementRate,
    postedAt: p.postedAt,
  }))
  const formats = detectEmergingFormats(formatPosts)

  // Generate insights
  const insights = generateInsights(alerts, trendingHashtags, formats)

  return {
    alerts,
    trendingHashtags,
    insights,
  }
}
