/**
 * Social Media Scraper Services
 * 
 * High-level services for Instagram and TikTok scraping with analytics.
 * 
 * Usage:
 * ```typescript
 * import { 
 *   instagramService, 
 *   tiktokService,
 *   competitorMonitor,
 *   hashtagTracker 
 * } from '@/server/services/scrapers';
 * 
 * // Scrape Instagram profile
 * const { profile, analytics } = await instagramService.getProfileWithAnalytics(
 *   workspaceId, 
 *   'nike', 
 *   'PRO'
 * );
 * 
 * // Set up competitor monitoring
 * const monitor = await competitorMonitor.createMonitor(
 *   workspaceId,
 *   'competitor_handle',
 *   'instagram',
 *   { checkFrequency: 'daily' },
 *   'PRO'
 * );
 * ```
 */

// ============================================================================
// Instagram Service
// ============================================================================

export * as instagramService from './instagram.service';

// ============================================================================
// TikTok Service
// ============================================================================

export * as tiktokService from './tiktok.service';

// ============================================================================
// Competitor Monitor
// ============================================================================

export {
  // Monitor management
  createMonitor,
  getMonitor,
  updateMonitor,
  deleteMonitor,
  getWorkspaceMonitors,
  getMonitorsDueForCheck,
  
  // Snapshot operations
  takeSnapshot,
  getLatestSnapshot,
  getSnapshotHistory,
  
  // Alerts
  getWorkspaceAlerts,
  markAlertRead,
  
  // Reports
  generateReport,
  
  // Scheduler
  processDueMonitors,
} from './competitor-monitor.service';

export type {
  CompetitorReport,
  CompetitorAlert,
} from './competitor-monitor.service';

// ============================================================================
// Hashtag Tracker
// ============================================================================

export {
  // Tracker management
  createTracker,
  getTracker,
  updateTracker,
  deleteTracker,
  getWorkspaceTrackers,
  getTrackersDueForCheck,
  
  // Trend operations
  recordTrend,
  getLatestTrend,
  getTrendHistory,
  
  // Analysis
  analyzeTrend,
  discoverTrendingHashtags,
  compareHashtagTrends,
  
  // Reports
  generateHashtagReport,
  
  // Scheduler
  processDueTrackers,
  checkTrendAlerts,
} from './hashtag-tracker.service';

export type {
  TrendAnalysis,
  TrendingHashtag,
  HashtagReport,
  TrendAlert,
} from './hashtag-tracker.service';
