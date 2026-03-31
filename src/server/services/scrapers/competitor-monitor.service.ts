/**
 * Competitor Monitor Service
 * Tracks competitor social media accounts and alerts on changes
 */

import { redis } from '@/server/redis-client';
import { v4 as uuidv4 } from 'uuid';
import {
  CompetitorMonitorConfig,
  CompetitorSnapshot,
  TierType,
  InstagramProfile,
  TikTokProfile,
} from '@/types/apify';
import * as instagramService from './instagram.service';
import * as tiktokService from './tiktok.service';

// ============================================================================
// Configuration
// ============================================================================

const MONITOR_PREFIX = 'apify:monitor:competitor:';
const SNAPSHOT_PREFIX = 'apify:snapshot:';
const ALERT_PREFIX = 'apify:alert:';

// Default check frequencies in milliseconds
const FREQUENCY_MS: Record<CompetitorMonitorConfig['checkFrequency'], number> = {
  hourly: 60 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
};

// Maximum monitors per tier
const MONITOR_LIMITS: Record<TierType, number> = {
  FREE: 3,
  PRO: 10,
  AGENCY: 50,
  ENTERPRISE: 200,
};

// ============================================================================
// Monitor Management
// ============================================================================

/**
 * Create a new competitor monitor
 */
export async function createMonitor(
  workspaceId: string,
  competitorUsername: string,
  platform: 'instagram' | 'tiktok',
  options: {
    trackingMetrics?: CompetitorMonitorConfig['trackingMetrics'];
    checkFrequency?: CompetitorMonitorConfig['checkFrequency'];
    alertThresholds?: CompetitorMonitorConfig['alertThresholds'];
  } = {},
  tier: TierType = 'FREE'
): Promise<CompetitorMonitorConfig> {
  // Check monitor limit
  const currentMonitors = await getWorkspaceMonitors(workspaceId);
  const limit = MONITOR_LIMITS[tier];
  
  if (currentMonitors.length >= limit) {
    throw new Error(
      `Monitor limit reached for tier ${tier}. Limit: ${limit}, Current: ${currentMonitors.length}`
    );
  }

  const monitor: CompetitorMonitorConfig = {
    id: uuidv4(),
    workspaceId,
    competitorUsername: competitorUsername.replace(/^@/, ''),
    platform,
    trackingMetrics: {
      followers: true,
      posts: true,
      engagement: true,
      hashtags: true,
      mentions: false,
      ...options.trackingMetrics,
    },
    checkFrequency: options.checkFrequency || 'daily',
    isActive: true,
    trackingSince: new Date(),
    nextCheckAt: new Date(Date.now() + FREQUENCY_MS[options.checkFrequency || 'daily']),
    alertThresholds: options.alertThresholds || {
      followerChangePercent: 5,
      engagementChangePercent: 10,
      newPostWithinHours: 24,
    },
  };

  // Store monitor config
  await redis.setex(
    `${MONITOR_PREFIX}${monitor.id}`,
    90 * 24 * 60 * 60, // 90 days TTL
    JSON.stringify(monitor)
  );

  // Add to workspace index
  await redis.sadd(`${MONITOR_PREFIX}workspace:${workspaceId}`, monitor.id);

  // Perform initial snapshot
  await takeSnapshot(monitor, tier);

  return monitor;
}

/**
 * Get monitor by ID
 */
export async function getMonitor(monitorId: string): Promise<CompetitorMonitorConfig | null> {
  const data = await redis.get(`${MONITOR_PREFIX}${monitorId}`);
  if (!data) return null;
  return JSON.parse(data) as CompetitorMonitorConfig;
}

/**
 * Update monitor configuration
 */
export async function updateMonitor(
  monitorId: string,
  updates: Partial<Omit<CompetitorMonitorConfig, 'id' | 'workspaceId'>>
): Promise<CompetitorMonitorConfig | null> {
  const monitor = await getMonitor(monitorId);
  if (!monitor) return null;

  const updatedMonitor = { ...monitor, ...updates };
  
  await redis.setex(
    `${MONITOR_PREFIX}${monitorId}`,
    90 * 24 * 60 * 60,
    JSON.stringify(updatedMonitor)
  );

  return updatedMonitor;
}

/**
 * Delete a monitor
 */
export async function deleteMonitor(monitorId: string): Promise<boolean> {
  const monitor = await getMonitor(monitorId);
  if (!monitor) return false;

  // Remove from workspace index
  await redis.srem(`${MONITOR_PREFIX}workspace:${monitor.workspaceId}`, monitorId);

  // Delete monitor config
  await redis.del(`${MONITOR_PREFIX}${monitorId}`);

  // Clean up snapshots (optional - could keep for historical analysis)
  const snapshotKeys = await redis.keys(`${SNAPSHOT_PREFIX}${monitorId}:*`);
  if (snapshotKeys.length > 0) {
    await redis.del(...snapshotKeys);
  }

  return true;
}

/**
 * Get all monitors for a workspace
 */
export async function getWorkspaceMonitors(workspaceId: string): Promise<CompetitorMonitorConfig[]> {
  const monitorIds = await redis.smembers(`${MONITOR_PREFIX}workspace:${workspaceId}`);
  
  const monitors: CompetitorMonitorConfig[] = [];
  for (const id of monitorIds) {
    const monitor = await getMonitor(id);
    if (monitor) {
      monitors.push(monitor);
    }
  }

  return monitors.sort((a, b) => 
    new Date(b.trackingSince).getTime() - new Date(a.trackingSince).getTime()
  );
}

/**
 * Get active monitors that are due for checking
 */
export async function getMonitorsDueForCheck(): Promise<CompetitorMonitorConfig[]> {
  const allMonitorKeys = await redis.keys(`${MONITOR_PREFIX}*`);
  const monitors: CompetitorMonitorConfig[] = [];

  for (const key of allMonitorKeys) {
    if (key.includes('workspace:')) continue;
    
    const data = await redis.get(key);
    if (data) {
      const monitor = JSON.parse(data) as CompetitorMonitorConfig;
      if (monitor.isActive) {
        const nextCheck = new Date(monitor.nextCheckAt || 0);
        if (nextCheck <= new Date()) {
          monitors.push(monitor);
        }
      }
    }
  }

  return monitors;
}

// ============================================================================
// Snapshot Management
// ============================================================================

/**
 * Take a snapshot of competitor data
 */
export async function takeSnapshot(
  monitor: CompetitorMonitorConfig,
  tier: TierType
): Promise<CompetitorSnapshot> {
  const timestamp = new Date();
  let snapshot: CompetitorSnapshot;

  try {
    if (monitor.platform === 'instagram') {
      const { profile, analytics } = await instagramService.getProfileWithAnalytics(
        monitor.workspaceId,
        monitor.competitorUsername,
        tier
      );

      snapshot = {
        id: uuidv4(),
        monitorId: monitor.id,
        timestamp,
        followersCount: profile.followersCount,
        postsCount: profile.mediaCount,
        avgEngagementRate: analytics.avgEngagementRate,
        latestPosts: profile.posts?.slice(0, 5).map(p => p.shortCode) || [],
        topHashtags: analytics.topHashtags,
      };
    } else {
      const { profile, analytics } = await tiktokService.getProfileWithAnalytics(
        monitor.workspaceId,
        monitor.competitorUsername,
        tier
      );

      snapshot = {
        id: uuidv4(),
        monitorId: monitor.id,
        timestamp,
        followersCount: profile.followersCount,
        postsCount: profile.videoCount,
        avgEngagementRate: analytics.avgEngagementRate,
        latestPosts: profile.posts?.slice(0, 5).map(p => p.id) || [],
        topHashtags: analytics.topHashtags,
      };
    }

    // Calculate changes from previous snapshot
    const previousSnapshot = await getLatestSnapshot(monitor.id);
    if (previousSnapshot) {
      snapshot.changes = {
        followersChange: snapshot.followersCount - previousSnapshot.followersCount,
        postsChange: snapshot.postsCount - previousSnapshot.postsCount,
        engagementChange: snapshot.avgEngagementRate - previousSnapshot.avgEngagementRate,
      };

      // Check for alerts
      await checkForAlerts(monitor, snapshot, previousSnapshot);
    }

    // Store snapshot
    await redis.setex(
      `${SNAPSHOT_PREFIX}${monitor.id}:${timestamp.toISOString()}`,
      90 * 24 * 60 * 60,
      JSON.stringify(snapshot)
    );

    // Update monitor last checked
    await updateMonitor(monitor.id, {
      lastCheckedAt: timestamp,
      nextCheckAt: new Date(timestamp.getTime() + FREQUENCY_MS[monitor.checkFrequency]),
    });

    return snapshot;

  } catch (error) {
    console.error(`Failed to take snapshot for monitor ${monitor.id}:`, error);
    throw error;
  }
}

/**
 * Get latest snapshot for a monitor
 */
export async function getLatestSnapshot(
  monitorId: string
): Promise<CompetitorSnapshot | null> {
  const keys = await redis.keys(`${SNAPSHOT_PREFIX}${monitorId}:*`);
  if (keys.length === 0) return null;

  // Sort by timestamp (desc) and get latest
  const sortedKeys = keys.sort().reverse();
  const data = await redis.get(sortedKeys[0]);
  
  if (!data) return null;
  return JSON.parse(data) as CompetitorSnapshot;
}

/**
 * Get snapshot history for a monitor
 */
export async function getSnapshotHistory(
  monitorId: string,
  limit: number = 30
): Promise<CompetitorSnapshot[]> {
  const keys = await redis.keys(`${SNAPSHOT_PREFIX}${monitorId}:*`);
  
  const snapshots: CompetitorSnapshot[] = [];
  for (const key of keys.slice(0, limit)) {
    const data = await redis.get(key);
    if (data) {
      snapshots.push(JSON.parse(data) as CompetitorSnapshot);
    }
  }

  return snapshots.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

// ============================================================================
// Alert System
// ============================================================================

export interface CompetitorAlert {
  id: string;
  monitorId: string;
  workspaceId: string;
  type: 'follower_spike' | 'follower_drop' | 'engagement_spike' | 'engagement_drop' | 'new_post' | 'viral_content';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  data: Record<string, unknown>;
  createdAt: Date;
  read: boolean;
}

/**
 * Check for alerts based on snapshot changes
 */
async function checkForAlerts(
  monitor: CompetitorMonitorConfig,
  current: CompetitorSnapshot,
  previous: CompetitorSnapshot
): Promise<CompetitorAlert[]> {
  const alerts: CompetitorAlert[] = [];
  const thresholds = monitor.alertThresholds;

  if (!thresholds || !current.changes) return alerts;

  // Follower change alerts
  if (thresholds.followerChangePercent) {
    const followerChangePercent = previous.followersCount > 0
      ? (current.changes.followersChange / previous.followersCount) * 100
      : 0;

    if (Math.abs(followerChangePercent) >= thresholds.followerChangePercent) {
      const isSpike = followerChangePercent > 0;
      alerts.push({
        id: uuidv4(),
        monitorId: monitor.id,
        workspaceId: monitor.workspaceId,
        type: isSpike ? 'follower_spike' : 'follower_drop',
        severity: Math.abs(followerChangePercent) >= thresholds.followerChangePercent * 2 ? 'critical' : 'warning',
        message: `${monitor.competitorUsername} ${isSpike ? 'gained' : 'lost'} ${Math.abs(current.changes.followersChange).toLocaleString()} followers (${followerChangePercent.toFixed(1)}%)`,
        data: {
          previousFollowers: previous.followersCount,
          currentFollowers: current.followersCount,
          change: current.changes.followersChange,
          percentChange: followerChangePercent,
        },
        createdAt: new Date(),
        read: false,
      });
    }
  }

  // Engagement change alerts
  if (thresholds.engagementChangePercent) {
    const engagementChangePercent = previous.avgEngagementRate > 0
      ? (current.changes.engagementChange / previous.avgEngagementRate) * 100
      : 0;

    if (Math.abs(engagementChangePercent) >= thresholds.engagementChangePercent) {
      const isSpike = engagementChangePercent > 0;
      alerts.push({
        id: uuidv4(),
        monitorId: monitor.id,
        workspaceId: monitor.workspaceId,
        type: isSpike ? 'engagement_spike' : 'engagement_drop',
        severity: Math.abs(engagementChangePercent) >= thresholds.engagementChangePercent * 2 ? 'critical' : 'warning',
        message: `${monitor.competitorUsername}'s engagement ${isSpike ? 'increased' : 'decreased'} by ${Math.abs(engagementChangePercent).toFixed(1)}%`,
        data: {
          previousEngagement: previous.avgEngagementRate,
          currentEngagement: current.avgEngagementRate,
          change: current.changes.engagementChange,
          percentChange: engagementChangePercent,
        },
        createdAt: new Date(),
        read: false,
      });
    }
  }

  // New post detection
  if (thresholds.newPostWithinHours && current.changes.postsChange > 0) {
    const hoursSinceLastCheck = previous.timestamp
      ? (new Date().getTime() - new Date(previous.timestamp).getTime()) / (60 * 60 * 1000)
      : 24;

    if (hoursSinceLastCheck <= thresholds.newPostWithinHours) {
      alerts.push({
        id: uuidv4(),
        monitorId: monitor.id,
        workspaceId: monitor.workspaceId,
        type: 'new_post',
        severity: 'info',
        message: `${monitor.competitorUsername} posted ${current.changes.postsChange} new content item(s)`,
        data: {
          newPostsCount: current.changes.postsChange,
          latestPosts: current.latestPosts,
        },
        createdAt: new Date(),
        read: false,
      });
    }
  }

  // Store alerts
  for (const alert of alerts) {
    await storeAlert(alert);
  }

  return alerts;
}

/**
 * Store an alert
 */
async function storeAlert(alert: CompetitorAlert): Promise<void> {
  await redis.setex(
    `${ALERT_PREFIX}${alert.id}`,
    30 * 24 * 60 * 60, // 30 days TTL
    JSON.stringify(alert)
  );

  // Add to workspace alert index
  await redis.sadd(`${ALERT_PREFIX}workspace:${alert.workspaceId}`, alert.id);
}

/**
 * Get alerts for a workspace
 */
export async function getWorkspaceAlerts(
  workspaceId: string,
  options: {
    unreadOnly?: boolean;
    limit?: number;
    type?: CompetitorAlert['type'];
  } = {}
): Promise<CompetitorAlert[]> {
  const { unreadOnly = false, limit = 50, type } = options;
  
  const alertIds = await redis.smembers(`${ALERT_PREFIX}workspace:${workspaceId}`);
  
  const alerts: CompetitorAlert[] = [];
  for (const id of alertIds) {
    const data = await redis.get(`${ALERT_PREFIX}${id}`);
    if (data) {
      const alert = JSON.parse(data) as CompetitorAlert;
      
      if (unreadOnly && alert.read) continue;
      if (type && alert.type !== type) continue;
      
      alerts.push(alert);
    }
  }

  return alerts
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

/**
 * Mark alert as read
 */
export async function markAlertRead(alertId: string): Promise<boolean> {
  const data = await redis.get(`${ALERT_PREFIX}${alertId}`);
  if (!data) return false;

  const alert = JSON.parse(data) as CompetitorAlert;
  alert.read = true;

  await redis.setex(
    `${ALERT_PREFIX}${alertId}`,
    30 * 24 * 60 * 60,
    JSON.stringify(alert)
  );

  return true;
}

// ============================================================================
// Report Generation
// ============================================================================

export interface CompetitorReport {
  monitorId: string;
  competitorUsername: string;
  platform: 'instagram' | 'tiktok';
  period: {
    from: Date;
    to: Date;
  };
  summary: {
    followerGrowth: number;
    followerGrowthPercent: number;
    postsAdded: number;
    engagementTrend: 'up' | 'down' | 'stable';
    avgEngagementRate: number;
  };
  dailySnapshots: CompetitorSnapshot[];
  topHashtags: string[];
  alerts: CompetitorAlert[];
}

/**
 * Generate competitor report
 */
export async function generateReport(
  monitorId: string,
  days: number = 30
): Promise<CompetitorReport | null> {
  const monitor = await getMonitor(monitorId);
  if (!monitor) return null;

  const snapshots = await getSnapshotHistory(monitorId, days);
  if (snapshots.length < 2) {
    throw new Error('Not enough data for report generation');
  }

  const latest = snapshots[0];
  const oldest = snapshots[snapshots.length - 1];

  const followerGrowth = latest.followersCount - oldest.followersCount;
  const followerGrowthPercent = oldest.followersCount > 0
    ? (followerGrowth / oldest.followersCount) * 100
    : 0;

  const postsAdded = latest.postsCount - oldest.postsCount;

  // Calculate engagement trend
  const recentEngagements = snapshots.slice(0, 7).map(s => s.avgEngagementRate);
  const olderEngagements = snapshots.slice(-7).map(s => s.avgEngagementRate);
  const recentAvg = recentEngagements.reduce((a, b) => a + b, 0) / recentEngagements.length;
  const olderAvg = olderEngagements.reduce((a, b) => a + b, 0) / olderEngagements.length;
  
  const engagementTrend = recentAvg > olderAvg * 1.05 
    ? 'up' 
    : recentAvg < olderAvg * 0.95 
    ? 'down' 
    : 'stable';

  // Aggregate top hashtags
  const allHashtags = snapshots.flatMap(s => s.topHashtags);
  const hashtagCounts: Record<string, number> = {};
  allHashtags.forEach(tag => {
    hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
  });
  const topHashtags = Object.entries(hashtagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag);

  // Get alerts for the period
  const alerts = await getWorkspaceAlerts(monitor.workspaceId, { limit: 100 });
  const periodAlerts = alerts.filter(a => 
    a.monitorId === monitorId &&
    new Date(a.createdAt) >= new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  );

  return {
    monitorId,
    competitorUsername: monitor.competitorUsername,
    platform: monitor.platform,
    period: {
      from: new Date(oldest.timestamp),
      to: new Date(latest.timestamp),
    },
    summary: {
      followerGrowth,
      followerGrowthPercent,
      postsAdded,
      engagementTrend,
      avgEngagementRate: latest.avgEngagementRate,
    },
    dailySnapshots: snapshots,
    topHashtags,
    alerts: periodAlerts,
  };
}

// ============================================================================
// Scheduler Integration
// ============================================================================

/**
 * Process all monitors due for checking
 * Called by scheduled job (e.g., cron or queue worker)
 */
export async function processDueMonitors(tier: TierType): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const dueMonitors = await getMonitorsDueForCheck();
  const results = { processed: 0, succeeded: 0, failed: 0 };

  for (const monitor of dueMonitors) {
    results.processed++;
    try {
      await takeSnapshot(monitor, tier);
      results.succeeded++;
    } catch (error) {
      console.error(`Failed to process monitor ${monitor.id}:`, error);
      results.failed++;
    }
  }

  return results;
}
