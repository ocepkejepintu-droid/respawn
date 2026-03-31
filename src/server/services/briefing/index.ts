/**
 * Briefing Services Index
 * 
 * Export all briefing-related services for easy importing.
 */

// Main generator
export {
  generateBriefing,
  generateBriefingsBatch,
  getLatestBriefing,
  getBriefingHistory,
  markAlertRead,
  markAllAlertsRead,
  type GenerateBriefingOptions,
} from './generator'

// Aggregator
export {
  aggregateBriefingData,
  aggregateHashtagData,
  aggregateCompetitorData,
  aggregatePostData,
  aggregateSentimentData,
  generateMockAggregationData,
  getDateRange,
} from './aggregator'

// Trend detector
export {
  detectTrends,
  calculateVelocity,
  detectAnomaly,
  generateHashtagAlerts,
  generateEngagementAlerts,
  generateSentimentAlerts,
  analyzeHashtagTrends,
  detectEmergingFormats,
  generateInsights,
} from './trend-detector'

// Notifier
export {
  generateBriefingEmail,
  sendBriefingEmail,
  sendPushNotification,
  createInAppNotifications,
  deliverBriefing,
  getNextDeliveryTime,
  shouldDeliverBriefings,
} from './notifier'
