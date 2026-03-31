/**
 * Hashtag Tracker Service
 * Track hashtag trends, popularity, and performance over time
 */

import { redis } from '@/server/redis-client';
import { v4 as uuidv4 } from 'uuid';
import {
  HashtagTrackerConfig,
  HashtagTrend,
  TierType,
  InstagramPost,
  TikTokPost,
} from '@/types/apify';
import * as instagramService from './instagram.service';
import * as tiktokService from './tiktok.service';

// ============================================================================
// Configuration
// ============================================================================

const TRACKER_PREFIX = 'apify:tracker:hashtag:';
const TREND_PREFIX = 'apify:trend:';

// Check frequencies in milliseconds
const FREQUENCY_MS: Record<HashtagTrackerConfig['checkFrequency'], number> = {
  hourly: 60 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
};

// Maximum trackers per tier
const TRACKER_LIMITS: Record<TierType, number> = {
  FREE: 5,
  PRO: 25,
  AGENCY: 100,
  ENTERPRISE: 500,
};

// ============================================================================
// Tracker Management
// ============================================================================

/**
 * Create a new hashtag tracker
 */
export async function createTracker(
  workspaceId: string,
  hashtag: string,
  platform: 'instagram' | 'tiktok',
  options: {
    checkFrequency?: HashtagTrackerConfig['checkFrequency'];
    targetPostCount?: number;
  } = {},
  tier: TierType = 'FREE'
): Promise<HashtagTrackerConfig> {
  // Check tracker limit
  const currentTrackers = await getWorkspaceTrackers(workspaceId);
  const limit = TRACKER_LIMITS[tier];

  if (currentTrackers.length >= limit) {
    throw new Error(
      `Hashtag tracker limit reached for tier ${tier}. Limit: ${limit}, Current: ${currentTrackers.length}`
    );
  }

  // Clean hashtag (remove # and lowercase)
  const cleanHashtag = hashtag.replace(/^#/, '').toLowerCase();

  // Check if already tracking
  const existing = currentTrackers.find(
    t => t.hashtag === cleanHashtag && t.platform === platform
  );
  if (existing) {
    throw new Error(`Already tracking #${cleanHashtag} on ${platform}`);
  }

  const tracker: HashtagTrackerConfig = {
    id: uuidv4(),
    workspaceId,
    hashtag: cleanHashtag,
    platform,
    trackingSince: new Date(),
    checkFrequency: options.checkFrequency || 'daily',
    isActive: true,
    nextCheckAt: new Date(Date.now() + FREQUENCY_MS[options.checkFrequency || 'daily']),
    targetPostCount: options.targetPostCount,
  };

  // Store tracker
  await redis.setex(
    `${TRACKER_PREFIX}${tracker.id}`,
    90 * 24 * 60 * 60,
    JSON.stringify(tracker)
  );

  // Add to workspace index
  await redis.sadd(`${TRACKER_PREFIX}workspace:${workspaceId}`, tracker.id);

  // Take initial trend snapshot
  await recordTrend(tracker, tier);

  return tracker;
}

/**
 * Get tracker by ID
 */
export async function getTracker(trackerId: string): Promise<HashtagTrackerConfig | null> {
  const data = await redis.get(`${TRACKER_PREFIX}${trackerId}`);
  if (!data) return null;
  return JSON.parse(data) as HashtagTrackerConfig;
}

/**
 * Update tracker configuration
 */
export async function updateTracker(
  trackerId: string,
  updates: Partial<Omit<HashtagTrackerConfig, 'id' | 'workspaceId'>>
): Promise<HashtagTrackerConfig | null> {
  const tracker = await getTracker(trackerId);
  if (!tracker) return null;

  const updatedTracker = { ...tracker, ...updates };

  await redis.setex(
    `${TRACKER_PREFIX}${trackerId}`,
    90 * 24 * 60 * 60,
    JSON.stringify(updatedTracker)
  );

  return updatedTracker;
}

/**
 * Delete a tracker
 */
export async function deleteTracker(trackerId: string): Promise<boolean> {
  const tracker = await getTracker(trackerId);
  if (!tracker) return false;

  // Remove from workspace index
  await redis.srem(`${TRACKER_PREFIX}workspace:${tracker.workspaceId}`, trackerId);

  // Delete tracker config
  await redis.del(`${TRACKER_PREFIX}${trackerId}`);

  // Clean up trend data
  const trendKeys = await redis.keys(`${TREND_PREFIX}${trackerId}:*`);
  if (trendKeys.length > 0) {
    await redis.del(...trendKeys);
  }

  return true;
}

/**
 * Get all trackers for a workspace
 */
export async function getWorkspaceTrackers(workspaceId: string): Promise<HashtagTrackerConfig[]> {
  const trackerIds = await redis.smembers(`${TRACKER_PREFIX}workspace:${workspaceId}`);

  const trackers: HashtagTrackerConfig[] = [];
  for (const id of trackerIds) {
    const tracker = await getTracker(id);
    if (tracker) {
      trackers.push(tracker);
    }
  }

  return trackers.sort((a, b) =>
    new Date(b.trackingSince).getTime() - new Date(a.trackingSince).getTime()
  );
}

/**
 * Get active trackers that are due for checking
 */
export async function getTrackersDueForCheck(): Promise<HashtagTrackerConfig[]> {
  const allTrackerKeys = await redis.keys(`${TRACKER_PREFIX}*`);
  const trackers: HashtagTrackerConfig[] = [];

  for (const key of allTrackerKeys) {
    if (key.includes('workspace:')) continue;

    const data = await redis.get(key);
    if (data) {
      const tracker = JSON.parse(data) as HashtagTrackerConfig;
      if (tracker.isActive) {
        const nextCheck = new Date(tracker.nextCheckAt || 0);
        if (nextCheck <= new Date()) {
          trackers.push(tracker);
        }
      }
    }
  }

  return trackers;
}

// ============================================================================
// Trend Recording
// ============================================================================

/**
 * Record a trend snapshot for a tracker
 */
export async function recordTrend(
  tracker: HashtagTrackerConfig,
  tier: TierType
): Promise<HashtagTrend> {
  const timestamp = new Date();

  try {
    let trend: HashtagTrend;

    if (tracker.platform === 'instagram') {
      const analysis = await instagramService.analyzeHashtag(
        tracker.workspaceId,
        tracker.hashtag,
        tier
      );

      // Calculate velocity (posts per hour since last check)
      const lastTrend = await getLatestTrend(tracker.id);
      let velocity = 0;
      if (lastTrend && tracker.lastCheckedAt) {
        const hoursSince = (timestamp.getTime() - new Date(tracker.lastCheckedAt).getTime()) / (60 * 60 * 1000);
        const postsDiff = analysis.hashtag.mediaCount - lastTrend.postCount;
        velocity = hoursSince > 0 ? postsDiff / hoursSince : 0;
      }

      trend = {
        id: uuidv4(),
        trackerId: tracker.id,
        timestamp,
        postCount: analysis.hashtag.mediaCount,
        topPosts: analysis.topPerformingPosts.map(p => p.shortCode),
        velocity,
        trendDirection: velocity > 10 ? 'up' : velocity < -5 ? 'down' : 'stable',
      };
    } else {
      const analysis = await tiktokService.analyzeHashtagTrend(
        tracker.workspaceId,
        tracker.hashtag,
        tier
      );

      const lastTrend = await getLatestTrend(tracker.id);
      let velocity = analysis.velocity;
      if (lastTrend && velocity === 0 && tracker.lastCheckedAt) {
        const hoursSince = (timestamp.getTime() - new Date(tracker.lastCheckedAt).getTime()) / (60 * 60 * 1000);
        const postsDiff = analysis.videoCount - lastTrend.postCount;
        velocity = hoursSince > 0 ? postsDiff / hoursSince : 0;
      }

      trend = {
        id: uuidv4(),
        trackerId: tracker.id,
        timestamp,
        postCount: analysis.videoCount,
        viewCount: analysis.totalViews,
        topPosts: analysis.topCreators.slice(0, 10),
        velocity,
        trendDirection: analysis.trendDirection || (velocity > 10 ? 'up' : velocity < -5 ? 'down' : 'stable'),
      };
    }

    // Store trend
    await redis.setex(
      `${TREND_PREFIX}${tracker.id}:${timestamp.toISOString()}`,
      90 * 24 * 60 * 60,
      JSON.stringify(trend)
    );

    // Update tracker
    await updateTracker(tracker.id, {
      lastCheckedAt: timestamp,
      nextCheckAt: new Date(timestamp.getTime() + FREQUENCY_MS[tracker.checkFrequency]),
    });

    return trend;

  } catch (error) {
    console.error(`Failed to record trend for tracker ${tracker.id}:`, error);
    throw error;
  }
}

/**
 * Get latest trend for a tracker
 */
export async function getLatestTrend(trackerId: string): Promise<HashtagTrend | null> {
  const keys = await redis.keys(`${TREND_PREFIX}${trackerId}:*`);
  if (keys.length === 0) return null;

  const sortedKeys = keys.sort().reverse();
  const data = await redis.get(sortedKeys[0]);

  if (!data) return null;
  return JSON.parse(data) as HashtagTrend;
}

/**
 * Get trend history for a tracker
 */
export async function getTrendHistory(
  trackerId: string,
  limit: number = 100
): Promise<HashtagTrend[]> {
  const keys = await redis.keys(`${TREND_PREFIX}${trackerId}:*`);

  const trends: HashtagTrend[] = [];
  for (const key of keys.slice(0, limit)) {
    const data = await redis.get(key);
    if (data) {
      trends.push(JSON.parse(data) as HashtagTrend);
    }
  }

  return trends.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

// ============================================================================
// Trend Analysis
// ============================================================================

export interface TrendAnalysis {
  trackerId: string;
  hashtag: string;
  platform: 'instagram' | 'tiktok';
  period: {
    from: Date;
    to: Date;
  };
  growth: {
    absolute: number;
    percent: number;
    perDay: number;
  };
  velocity: {
    current: number;
    average: number;
    peak: number;
  };
  trendDirection: 'exploding' | 'growing' | 'stable' | 'declining' | 'dead';
  predictions: {
    next24h: number;
    next7d: number;
    confidence: number;
  };
  relatedOpportunities: string[];
  bestTimeToPost: string[];
}

/**
 * Analyze trend data for a tracker
 */
export async function analyzeTrend(
  trackerId: string,
  days: number = 30
): Promise<TrendAnalysis | null> {
  const tracker = await getTracker(trackerId);
  if (!tracker) return null;

  const trends = await getTrendHistory(trackerId, days * 2); // Get more for averaging
  if (trends.length < 2) {
    throw new Error('Not enough data for trend analysis');
  }

  const relevantTrends = trends.slice(0, days);
  const latest = relevantTrends[0];
  const oldest = relevantTrends[relevantTrends.length - 1];

  // Calculate growth
  const absoluteGrowth = latest.postCount - oldest.postCount;
  const percentGrowth = oldest.postCount > 0
    ? (absoluteGrowth / oldest.postCount) * 100
    : 0;
  const daysCount = Math.max(1, relevantTrends.length);
  const perDay = absoluteGrowth / daysCount;

  // Calculate velocity stats
  const velocities = relevantTrends.map(t => t.velocity);
  const currentVelocity = velocities[0];
  const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;
  const peakVelocity = Math.max(...velocities);

  // Determine trend direction
  let trendDirection: TrendAnalysis['trendDirection'];
  if (percentGrowth > 100) {
    trendDirection = 'exploding';
  } else if (percentGrowth > 20) {
    trendDirection = 'growing';
  } else if (percentGrowth > -20) {
    trendDirection = 'stable';
  } else if (percentGrowth > -50) {
    trendDirection = 'declining';
  } else {
    trendDirection = 'dead';
  }

  // Simple linear prediction
  const predictPosts = (hours: number) => {
    return latest.postCount + (currentVelocity * hours);
  };

  const prediction24h = Math.round(predictPosts(24));
  const prediction7d = Math.round(predictPosts(24 * 7));

  // Calculate confidence based on data consistency
  const variance = velocities.reduce((sum, v) => sum + Math.pow(v - avgVelocity, 2), 0) / velocities.length;
  const confidence = Math.max(0, 1 - (variance / (avgVelocity * avgVelocity || 1)));

  // Find best posting times from trend timestamps
  const hourDistribution: Record<number, number> = {};
  relevantTrends.forEach(t => {
    const hour = new Date(t.timestamp).getUTCHours();
    hourDistribution[hour] = (hourDistribution[hour] || 0) + 1;
  });
  const bestTimeToPost = Object.entries(hourDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => `${hour}:00 UTC`);

  // Get related opportunities from platform analysis
  let relatedOpportunities: string[] = [];
  try {
    if (tracker.platform === 'instagram') {
      const analysis = await instagramService.analyzeHashtag(
        tracker.workspaceId,
        tracker.hashtag,
        'FREE' // Use free tier for this internal call
      );
      relatedOpportunities = analysis.relatedHashtags.slice(0, 10);
    } else {
      const analysis = await tiktokService.analyzeHashtagTrend(
        tracker.workspaceId,
        tracker.hashtag,
        'FREE'
      );
      relatedOpportunities = analysis.relatedHashtags.slice(0, 10);
    }
  } catch (error) {
    console.warn('Failed to get related hashtags:', error);
  }

  return {
    trackerId,
    hashtag: tracker.hashtag,
    platform: tracker.platform,
    period: {
      from: new Date(oldest.timestamp),
      to: new Date(latest.timestamp),
    },
    growth: {
      absolute: absoluteGrowth,
      percent: percentGrowth,
      perDay,
    },
    velocity: {
      current: currentVelocity,
      average: avgVelocity,
      peak: peakVelocity,
    },
    trendDirection,
    predictions: {
      next24h: prediction24h,
      next7d: prediction7d,
      confidence,
    },
    relatedOpportunities,
    bestTimeToPost,
  };
}

// ============================================================================
// Trend Discovery
// ============================================================================

export interface TrendingHashtag {
  hashtag: string;
  platform: 'instagram' | 'tiktok';
  velocity: number;
  postCount: number;
  growth24h: number;
  score: number; // Composite trending score
}

/**
 * Discover trending hashtags across all tracked hashtags
 */
export async function discoverTrendingHashtags(
  workspaceId: string,
  limit: number = 20
): Promise<TrendingHashtag[]> {
  const trackers = await getWorkspaceTrackers(workspaceId);
  const trending: TrendingHashtag[] = [];

  for (const tracker of trackers) {
    const latestTrend = await getLatestTrend(tracker.id);
    const previousTrend = (await getTrendHistory(tracker.id, 2))[1];

    if (latestTrend) {
      const growth24h = previousTrend
        ? latestTrend.postCount - previousTrend.postCount
        : 0;

      // Calculate trending score
      // Higher velocity and growth = higher score
      const score = (latestTrend.velocity * 10) + (growth24h / 100);

      if (score > 0) {
        trending.push({
          hashtag: tracker.hashtag,
          platform: tracker.platform,
          velocity: latestTrend.velocity,
          postCount: latestTrend.postCount,
          growth24h,
          score,
        });
      }
    }
  }

  return trending
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get trend comparisons between multiple hashtags
 */
export async function compareHashtagTrends(
  workspaceId: string,
  hashtags: string[],
  platform: 'instagram' | 'tiktok',
  days: number = 30
): Promise<{
  comparisons: TrendAnalysis[];
  rankings: {
    byGrowth: string[];
    byVelocity: string[];
    byVolume: string[];
  };
  recommendation: string;
}> {
  const trackers = await getWorkspaceTrackers(workspaceId);
  const analyses: TrendAnalysis[] = [];

  for (const hashtag of hashtags) {
    const tracker = trackers.find(
      t => t.hashtag === hashtag.toLowerCase() && t.platform === platform
    );

    if (tracker) {
      const analysis = await analyzeTrend(tracker.id, days);
      if (analysis) {
        analyses.push(analysis);
      }
    }
  }

  // Rankings
  const byGrowth = [...analyses]
    .sort((a, b) => b.growth.percent - a.growth.percent)
    .map(a => a.hashtag);

  const byVelocity = [...analyses]
    .sort((a, b) => b.velocity.current - a.velocity.current)
    .map(a => a.hashtag);

  const byVolume = [...analyses]
    .sort((a, b) => b.growth.absolute - a.growth.absolute)
    .map(a => a.hashtag);

  // Generate recommendation
  let recommendation = '';
  const bestGrowth = analyses.find(a => a.hashtag === byGrowth[0]);
  const bestVelocity = analyses.find(a => a.hashtag === byVelocity[0]);

  if (bestGrowth && bestVelocity) {
    if (bestGrowth.hashtag === bestVelocity.hashtag) {
      recommendation = `#${bestGrowth.hashtag} is trending strongly with both high growth (${bestGrowth.growth.percent.toFixed(1)}%) and velocity (${bestVelocity.velocity.current.toFixed(1)} posts/hour).`;
    } else {
      recommendation = `#${bestVelocity.hashtag} has the highest velocity (${bestVelocity.velocity.current.toFixed(1)} posts/hour), while #${bestGrowth.hashtag} shows the strongest growth (${bestGrowth.growth.percent.toFixed(1)}%).`;
    }
  }

  return {
    comparisons: analyses,
    rankings: {
      byGrowth,
      byVelocity,
      byVolume,
    },
    recommendation,
  };
}

// ============================================================================
// Reports
// ============================================================================

export interface HashtagReport {
  trackerId: string;
  hashtag: string;
  platform: 'instagram' | 'tiktok';
  generatedAt: Date;
  trackingSince: Date;
  summary: {
    totalGrowth: number;
    avgVelocity: number;
    peakVelocity: number;
    trendDirection: string;
  };
  trends: HashtagTrend[];
  analysis: TrendAnalysis;
  recommendations: string[];
}

/**
 * Generate comprehensive hashtag report
 */
export async function generateHashtagReport(
  trackerId: string,
  days: number = 30
): Promise<HashtagReport | null> {
  const tracker = await getTracker(trackerId);
  if (!tracker) return null;

  const [trends, analysis] = await Promise.all([
    getTrendHistory(trackerId, days),
    analyzeTrend(trackerId, days),
  ]);

  if (!analysis) {
    throw new Error('Failed to analyze trend');
  }

  // Generate recommendations
  const recommendations: string[] = [];

  if (analysis.trendDirection === 'exploding' || analysis.trendDirection === 'growing') {
    recommendations.push(`#${tracker.hashtag} is trending ${analysis.trendDirection}. Consider creating content now to ride the wave.`);
  }

  if (analysis.velocity.current > analysis.velocity.average * 1.5) {
    recommendations.push('Velocity is significantly above average - this hashtag is gaining momentum fast!');
  }

  if (analysis.bestTimeToPost.length > 0) {
    recommendations.push(`Best times to post: ${analysis.bestTimeToPost.join(', ')}`);
  }

  if (analysis.relatedOpportunities.length > 0) {
    recommendations.push(`Related hashtags to use: ${analysis.relatedOpportunities.slice(0, 5).map(h => `#${h}`).join(', ')}`);
  }

  if (analysis.predictions.confidence > 0.8) {
    recommendations.push(`High confidence prediction: Expect ~${analysis.predictions.next24h} posts in the next 24 hours.`);
  }

  return {
    trackerId,
    hashtag: tracker.hashtag,
    platform: tracker.platform,
    generatedAt: new Date(),
    trackingSince: tracker.trackingSince,
    summary: {
      totalGrowth: analysis.growth.absolute,
      avgVelocity: analysis.velocity.average,
      peakVelocity: analysis.velocity.peak,
      trendDirection: analysis.trendDirection,
    },
    trends,
    analysis,
    recommendations,
  };
}

// ============================================================================
// Scheduler Integration
// ============================================================================

/**
 * Process all trackers due for recording
 * Called by scheduled job
 */
export async function processDueTrackers(tier: TierType): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const dueTrackers = await getTrackersDueForCheck();
  const results = { processed: 0, succeeded: 0, failed: 0 };

  for (const tracker of dueTrackers) {
    results.processed++;
    try {
      await recordTrend(tracker, tier);
      results.succeeded++;
    } catch (error) {
      console.error(`Failed to process tracker ${tracker.id}:`, error);
      results.failed++;
    }
  }

  return results;
}

// ============================================================================
// Trend Alerts
// ============================================================================

export interface TrendAlert {
  id: string;
  trackerId: string;
  workspaceId: string;
  type: 'trending' | 'exploding' | 'declining' | 'milestone';
  message: string;
  data: Record<string, unknown>;
  createdAt: Date;
  read: boolean;
}

/**
 * Check for trend-based alerts
 */
export async function checkTrendAlerts(trackerId: string): Promise<TrendAlert[]> {
  const tracker = await getTracker(trackerId);
  if (!tracker) return [];

  const analysis = await analyzeTrend(trackerId, 7);
  if (!analysis) return [];

  const alerts: TrendAlert[] = [];

  // Check for exploding trend
  if (analysis.trendDirection === 'exploding') {
    alerts.push({
      id: uuidv4(),
      trackerId,
      workspaceId: tracker.workspaceId,
      type: 'exploding',
      message: `#${tracker.hashtag} is exploding! ${analysis.growth.percent.toFixed(1)}% growth in the last week.`,
      data: {
        growth: analysis.growth,
        velocity: analysis.velocity,
      },
      createdAt: new Date(),
      read: false,
    });
  }

  // Check for declining trend
  if (analysis.trendDirection === 'declining' && analysis.growth.percent < -30) {
    alerts.push({
      id: uuidv4(),
      trackerId,
      workspaceId: tracker.workspaceId,
      type: 'declining',
      message: `#${tracker.hashtag} is declining rapidly (${analysis.growth.percent.toFixed(1)}%). Consider diversifying your hashtag strategy.`,
      data: {
        growth: analysis.growth,
        relatedOpportunities: analysis.relatedOpportunities,
      },
      createdAt: new Date(),
      read: false,
    });
  }

  // Check for milestones
  const milestones = [1000, 10000, 100000, 1000000, 10000000];
  const trend = await getLatestTrend(trackerId);
  if (trend) {
    for (const milestone of milestones) {
      if (trend.postCount >= milestone && trend.postCount < milestone * 1.1) {
        alerts.push({
          id: uuidv4(),
          trackerId,
          workspaceId: tracker.workspaceId,
          type: 'milestone',
          message: `#${tracker.hashtag} just reached ${milestone.toLocaleString()} posts!`,
          data: { milestone, postCount: trend.postCount },
          createdAt: new Date(),
          read: false,
        });
        break; // Only one milestone at a time
      }
    }
  }

  // Store alerts
  for (const alert of alerts) {
    await redis.setex(
      `apify:trendalert:${alert.id}`,
      30 * 24 * 60 * 60,
      JSON.stringify(alert)
    );
    await redis.sadd(`apify:trendalert:workspace:${tracker.workspaceId}`, alert.id);
  }

  return alerts;
}
