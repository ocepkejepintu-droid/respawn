import { prisma } from './prisma'
import { SubscriptionTier, UserRole, SubscriptionStatus } from '@prisma/client'
import type { UsageStatus, UsageQuotas, UsageCounts } from '@/types/database'
import { TIER_CONFIG } from '@/types/database'

// ============================================
// WORKSPACE UTILITIES
// ============================================

/**
 * Get a workspace by ID with all relations
 */
export async function getWorkspaceById(workspaceId: string) {
  return prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      owner: true,
      members: {
        include: { user: true },
      },
      subscription: true,
    },
  })
}

/**
 * Get a workspace by slug with all relations
 */
export async function getWorkspaceBySlug(slug: string) {
  return prisma.workspace.findUnique({
    where: { slug },
    include: {
      owner: true,
      members: {
        include: { user: true },
      },
      subscription: true,
    },
  })
}

/**
 * Get all workspaces for a user
 */
export async function getUserWorkspaces(userId: string) {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: {
        include: {
          subscription: true,
          _count: {
            select: { members: true, competitors: true },
          },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  })

  return memberships.map((m) => ({
    ...m.workspace,
    role: m.role,
  }))
}

/**
 * Check if user is a member of a workspace
 */
export async function isWorkspaceMember(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
  })
  return !!member
}

/**
 * Get user's role in a workspace
 */
export async function getWorkspaceRole(
  workspaceId: string,
  userId: string
): Promise<UserRole | null> {
  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
  })
  return member?.role || null
}

// ============================================
// SUBSCRIPTION & QUOTA UTILITIES
// ============================================

/**
 * Get subscription for a workspace
 */
export async function getWorkspaceSubscription(workspaceId: string) {
  return prisma.subscription.findUnique({
    where: { workspaceId },
  })
}

/**
 * Get or create subscription for a workspace
 * If no subscription exists, creates a FREE tier subscription
 */
export async function getOrCreateSubscription(workspaceId: string) {
  let subscription = await prisma.subscription.findUnique({
    where: { workspaceId },
  })

  if (!subscription) {
    subscription = await prisma.subscription.create({
      data: {
        workspaceId,
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.ACTIVE,
        ...TIER_CONFIG[SubscriptionTier.FREE],
      },
    })
  }

  return subscription
}

/**
 * Check if workspace has an active paid subscription
 */
export async function hasActivePaidSubscription(workspaceId: string): Promise<boolean> {
  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId },
  })

  return (
    subscription?.status === SubscriptionStatus.ACTIVE &&
    subscription?.tier !== SubscriptionTier.FREE
  )
}

/**
 * Get usage status for a workspace
 */
export async function getUsageStatus(workspaceId: string): Promise<UsageStatus> {
  const subscription = await getOrCreateSubscription(workspaceId)

  const quotas: UsageQuotas = {
    maxCompetitors: subscription.maxCompetitors,
    maxHashtagTracks: subscription.maxHashtagTracks,
    maxScrapedPosts: subscription.maxScrapedPosts,
    maxAnalysisReports: subscription.maxAnalysisReports,
    maxTeamMembers: subscription.maxTeamMembers,
  }

  const counts: UsageCounts = {
    usedCompetitorSlots: subscription.usedCompetitorSlots,
    usedHashtagTracks: subscription.usedHashtagTracks,
    usedScrapedPosts: subscription.usedScrapedPosts,
    usedAnalysisReports: subscription.usedAnalysisReports,
  }

  return {
    ...quotas,
    ...counts,
    remainingCompetitors: quotas.maxCompetitors - counts.usedCompetitorSlots,
    remainingHashtagTracks: quotas.maxHashtagTracks - counts.usedHashtagTracks,
    remainingScrapedPosts: quotas.maxScrapedPosts - counts.usedScrapedPosts,
    remainingAnalysisReports: quotas.maxAnalysisReports - counts.usedAnalysisReports,
    isAtLimit:
      counts.usedCompetitorSlots >= quotas.maxCompetitors ||
      counts.usedHashtagTracks >= quotas.maxHashtagTracks ||
      counts.usedScrapedPosts >= quotas.maxScrapedPosts ||
      counts.usedAnalysisReports >= quotas.maxAnalysisReports,
  }
}

/**
 * Check if workspace can add more competitors
 */
export async function canAddCompetitor(workspaceId: string): Promise<boolean> {
  const subscription = await getOrCreateSubscription(workspaceId)
  return subscription.usedCompetitorSlots < subscription.maxCompetitors
}

/**
 * Check if workspace can add more hashtag tracks
 */
export async function canAddHashtagTrack(workspaceId: string): Promise<boolean> {
  const subscription = await getOrCreateSubscription(workspaceId)
  return subscription.usedHashtagTracks < subscription.maxHashtagTracks
}

/**
 * Check if workspace can add more team members
 */
export async function canAddTeamMember(workspaceId: string): Promise<boolean> {
  const subscription = await getOrCreateSubscription(workspaceId)
  return subscription.usedTeamMembers < subscription.maxTeamMembers
}

/**
 * Increment competitor usage for a workspace
 */
export async function incrementCompetitorUsage(workspaceId: string, count = 1) {
  return prisma.subscription.update({
    where: { workspaceId },
    data: {
      usedCompetitorSlots: { increment: count },
    },
  })
}

/**
 * Increment hashtag track usage for a workspace
 */
export async function incrementHashtagTrackUsage(workspaceId: string, count = 1) {
  return prisma.subscription.update({
    where: { workspaceId },
    data: {
      usedHashtagTracks: { increment: count },
    },
  })
}

/**
 * Increment analysis report usage for a workspace
 */
export async function incrementAnalysisReportUsage(workspaceId: string, count = 1) {
  return prisma.subscription.update({
    where: { workspaceId },
    data: {
      usedAnalysisReports: { increment: count },
    },
  })
}

/**
 * Increment scraped posts usage for a workspace
 */
export async function incrementScrapedPostsUsage(workspaceId: string, count = 1) {
  return prisma.subscription.update({
    where: { workspaceId },
    data: {
      usedScrapedPosts: { increment: count },
    },
  })
}

// ============================================
// COMPETITOR UTILITIES
// ============================================

/**
 * Get all competitors for a workspace
 */
export async function getWorkspaceCompetitors(workspaceId: string) {
  return prisma.competitor.findMany({
    where: { workspaceId, isActive: true },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Get competitor with recent posts
 */
export async function getCompetitorWithPosts(competitorId: string, limit = 20) {
  return prisma.competitor.findUnique({
    where: { id: competitorId },
    include: {
      scrapedPosts: {
        orderBy: { postedAt: 'desc' },
        take: limit,
      },
    },
  })
}

// ============================================
// HASHTAG UTILITIES
// ============================================

/**
 * Get all hashtag tracks for a workspace
 */
export async function getWorkspaceHashtags(workspaceId: string) {
  return prisma.hashtagTrack.findMany({
    where: { workspaceId, isActive: true },
    orderBy: { trendingScore: 'desc' },
  })
}

// ============================================
// ANALYSIS REPORT UTILITIES
// ============================================

/**
 * Get all reports for a workspace
 */
export async function getWorkspaceReports(workspaceId: string) {
  return prisma.analysisReport.findMany({
    where: { workspaceId },
    include: { createdBy: true },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Get recent reports for a workspace
 */
export async function getRecentReports(workspaceId: string, limit = 5) {
  return prisma.analysisReport.findMany({
    where: { workspaceId, status: 'COMPLETED' },
    include: { createdBy: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

// ============================================
// SCRAPED POST UTILITIES
// ============================================

/**
 * Get recent posts for a workspace
 */
export async function getRecentPosts(workspaceId: string, limit = 10) {
  return prisma.scrapedPost.findMany({
    where: { workspaceId },
    include: { competitor: true },
    orderBy: { postedAt: 'desc' },
    take: limit,
  })
}

/**
 * Get top performing posts for a workspace
 */
export async function getTopPerformingPosts(workspaceId: string, limit = 10) {
  return prisma.scrapedPost.findMany({
    where: { workspaceId },
    include: { competitor: true },
    orderBy: { engagementRate: 'desc' },
    take: limit,
  })
}

/**
 * Get posts by competitor
 */
export async function getPostsByCompetitor(competitorId: string, limit = 50) {
  return prisma.scrapedPost.findMany({
    where: { competitorId },
    orderBy: { postedAt: 'desc' },
    take: limit,
  })
}

// ============================================
// USAGE LOGGING
// ============================================

/**
 * Log a usage action
 */
export async function logUsage({
  workspaceId,
  userId,
  action,
  resourceType,
  resourceId,
  count = 1,
  metadata,
}: {
  workspaceId: string
  userId?: string
  action: string
  resourceType: string
  resourceId?: string
  count?: number
  metadata?: Record<string, unknown>
}) {
  return prisma.usageLog.create({
    data: {
      workspaceId,
      userId,
      action,
      resourceType,
      resourceId,
      count,
      metadata: metadata || {},
    },
  })
}

// ============================================
// AUDIT LOGGING
// ============================================

/**
 * Create an audit log entry
 */
export async function createAuditLog({
  workspaceId,
  action,
  entityType,
  entityId,
  oldValues,
  newValues,
  performedBy,
  ipAddress,
  userAgent,
}: {
  workspaceId: string
  action: string
  entityType: string
  entityId: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  performedBy?: string
  ipAddress?: string
  userAgent?: string
}) {
  return prisma.auditLog.create({
    data: {
      workspaceId,
      action,
      entityType,
      entityId,
      oldValues: oldValues || {},
      newValues: newValues || {},
      performedBy,
      ipAddress,
      userAgent,
    },
  })
}
