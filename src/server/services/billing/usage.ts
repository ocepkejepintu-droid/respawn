/**
 * Usage Service - Quota tracking and management
 * 
 * Tracks usage against subscription limits and provides quota management
 * for all billable resources in the Real Buzzer SaaS.
 */

import { prisma } from '@/lib/prisma';
import { SubscriptionTier, Prisma } from '@prisma/client';
import { PRICING_TIERS } from '@/lib/stripe';

// ============================================================================
// Types
// ============================================================================

export interface UsageStats {
  competitors: {
    used: number;
    limit: number;
    remaining: number;
    percentage: number;
  };
  hashtags: {
    used: number;
    limit: number;
    remaining: number;
    percentage: number;
  };
  scrapes: {
    used: number;
    limit: number;
    remaining: number;
    percentage: number;
  };
  reports: {
    used: number;
    limit: number;
    remaining: number;
    percentage: number;
  };
  teamMembers: {
    used: number;
    limit: number;
    remaining: number;
    percentage: number;
  };
}

export interface QuotaCheck {
  allowed: boolean;
  reason?: string;
  current: number;
  limit: number;
}

export type ResourceType = 'competitors' | 'hashtags' | 'scrapes' | 'reports' | 'teamMembers';

// ============================================================================
// Usage Tracking
// ============================================================================

export async function getUsageStats(workspaceId: string): Promise<UsageStats> {
  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId },
  });

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  // Get actual usage counts from related tables
  const [
    competitorCount,
    hashtagCount,
    scrapeCount,
    reportCount,
    teamMemberCount,
  ] = await Promise.all([
    prisma.competitor.count({ where: { workspaceId } }),
    prisma.hashtagTrack.count({ where: { workspaceId } }),
    prisma.scrapedPost.count({ where: { workspaceId } }),
    prisma.analysisReport.count({ where: { workspaceId } }),
    prisma.workspaceMember.count({ where: { workspaceId } }),
  ]);

  // Update subscription usage counts
  await prisma.subscription.update({
    where: { workspaceId },
    data: {
      usedCompetitorSlots: competitorCount,
      usedHashtagTracks: hashtagCount,
      usedScrapedPosts: scrapeCount,
      usedAnalysisReports: reportCount,
    },
  });

  return calculateUsageStats({
    usedCompetitors: competitorCount,
    usedHashtags: hashtagCount,
    usedScrapes: scrapeCount,
    usedReports: reportCount,
    usedTeamMembers: teamMemberCount,
    limits: {
      competitors: subscription.maxCompetitors,
      hashtags: subscription.maxHashtagTracks,
      scrapes: subscription.maxScrapedPosts,
      reports: subscription.maxAnalysisReports,
      teamMembers: subscription.maxTeamMembers,
    },
  });
}

export async function checkQuota(
  workspaceId: string,
  resource: ResourceType,
  requested: number = 1
): Promise<QuotaCheck> {
  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId },
  });

  if (!subscription) {
    return { allowed: false, reason: 'Subscription not found', current: 0, limit: 0 };
  }

  const limits: Record<ResourceType, number> = {
    competitors: subscription.maxCompetitors,
    hashtags: subscription.maxHashtagTracks,
    scrapes: subscription.maxScrapedPosts,
    reports: subscription.maxAnalysisReports,
    teamMembers: subscription.maxTeamMembers,
  };

  const current = await getCurrentUsage(workspaceId, resource);
  const limit = limits[resource];
  const remaining = limit - current;
  const allowed = remaining >= requested;

  return {
    allowed,
    reason: allowed ? undefined : `${resource} quota exceeded`,
    current,
    limit,
  };
}

export async function checkQuotaBulk(
  workspaceId: string,
  checks: Array<{ resource: ResourceType; requested: number }>
): Promise<Record<ResourceType, QuotaCheck>> {
  const results = await Promise.all(
    checks.map(async ({ resource, requested }) => ({
      resource,
      check: await checkQuota(workspaceId, resource, requested),
    }))
  );

  return results.reduce((acc, { resource, check }) => {
    acc[resource] = check;
    return acc;
  }, {} as Record<ResourceType, QuotaCheck>);
}

// ============================================================================
// Resource Usage Getters
// ============================================================================

async function getCurrentUsage(
  workspaceId: string,
  resource: ResourceType
): Promise<number> {
  switch (resource) {
    case 'competitors':
      return prisma.competitor.count({ where: { workspaceId } });
    case 'hashtags':
      return prisma.hashtagTrack.count({ where: { workspaceId } });
    case 'scrapes':
      return prisma.scrapedPost.count({ where: { workspaceId } });
    case 'reports':
      return prisma.analysisReport.count({ where: { workspaceId } });
    case 'teamMembers':
      return prisma.workspaceMember.count({ where: { workspaceId } });
    default:
      return 0;
  }
}

// ============================================================================
// Usage Increment/Decrement
// ============================================================================

export async function incrementUsage(
  workspaceId: string,
  resource: ResourceType,
  amount: number = 1
): Promise<void> {
  const fieldMap: Record<ResourceType, keyof Prisma.SubscriptionUpdateInput> = {
    competitors: 'usedCompetitorSlots',
    hashtags: 'usedHashtagTracks',
    scrapes: 'usedScrapedPosts',
    reports: 'usedAnalysisReports',
    teamMembers: 'usedCompetitorSlots', // Not tracked directly
  };

  const field = fieldMap[resource];

  await prisma.subscription.update({
    where: { workspaceId },
    data: {
      [field]: {
        increment: amount,
      },
    },
  });
}

export async function decrementUsage(
  workspaceId: string,
  resource: ResourceType,
  amount: number = 1
): Promise<void> {
  const fieldMap: Record<ResourceType, keyof Prisma.SubscriptionUpdateInput> = {
    competitors: 'usedCompetitorSlots',
    hashtags: 'usedHashtagTracks',
    scrapes: 'usedScrapedPosts',
    reports: 'usedAnalysisReports',
    teamMembers: 'usedCompetitorSlots',
  };

  const field = fieldMap[resource];

  await prisma.subscription.update({
    where: { workspaceId },
    data: {
      [field]: {
        decrement: Math.max(0, amount),
      },
    },
  });
}

// ============================================================================
// Usage Logging
// ============================================================================

export async function logUsage(
  workspaceId: string,
  action: string,
  resourceType: string,
  resourceId?: string,
  count: number = 1,
  userId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await prisma.usageLog.create({
    data: {
      workspaceId,
      action,
      resourceType,
      resourceId,
      count,
      userId,
      metadata: metadata as Prisma.InputJsonValue,
    },
  });
}

export async function getUsageHistory(
  workspaceId: string,
  params?: {
    startDate?: Date;
    endDate?: Date;
    action?: string;
    limit?: number;
  }
) {
  const logs = await prisma.usageLog.findMany({
    where: {
      workspaceId,
      ...(params?.startDate && { createdAt: { gte: params.startDate } }),
      ...(params?.endDate && { createdAt: { lte: params.endDate } }),
      ...(params?.action && { action: params.action }),
    },
    orderBy: { createdAt: 'desc' },
    take: params?.limit || 100,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return logs;
}

// ============================================================================
// Monthly Reset
// ============================================================================

export async function resetMonthlyUsage(workspaceId: string): Promise<void> {
  await prisma.subscription.update({
    where: { workspaceId },
    data: {
      usedScrapedPosts: 0,
      usedAnalysisReports: 0,
    },
  });
}

export async function resetAllMonthlyUsage(): Promise<void> {
  await prisma.subscription.updateMany({
    data: {
      usedScrapedPosts: 0,
      usedAnalysisReports: 0,
    },
  });
}

// ============================================================================
// Quota Warnings
// ============================================================================

export interface QuotaWarning {
  resource: ResourceType;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  current: number;
  limit: number;
  percentage: number;
}

export async function getQuotaWarnings(workspaceId: string): Promise<QuotaWarning[]> {
  const stats = await getUsageStats(workspaceId);
  const warnings: QuotaWarning[] = [];

  const resources: ResourceType[] = ['competitors', 'hashtags', 'scrapes', 'reports', 'teamMembers'];

  for (const resource of resources) {
    const stat = stats[resource];

    if (stat.percentage >= 100) {
      warnings.push({
        resource,
        severity: 'critical',
        message: `${capitalize(resource)} quota exceeded. Upgrade your plan to continue.`,
        current: stat.used,
        limit: stat.limit,
        percentage: stat.percentage,
      });
    } else if (stat.percentage >= 90) {
      warnings.push({
        resource,
        severity: 'critical',
        message: `${capitalize(resource)} quota almost full (${Math.round(stat.percentage)}%). Upgrade soon to avoid interruption.`,
        current: stat.used,
        limit: stat.limit,
        percentage: stat.percentage,
      });
    } else if (stat.percentage >= 75) {
      warnings.push({
        resource,
        severity: 'warning',
        message: `${capitalize(resource)} quota at ${Math.round(stat.percentage)}%. Consider upgrading.`,
        current: stat.used,
        limit: stat.limit,
        percentage: stat.percentage,
      });
    }
  }

  return warnings.sort((a, b) => b.percentage - a.percentage);
}

// ============================================================================
// Helper Functions
// ============================================================================

interface CalculateUsageInput {
  usedCompetitors: number;
  usedHashtags: number;
  usedScrapes: number;
  usedReports: number;
  usedTeamMembers: number;
  limits: {
    competitors: number;
    hashtags: number;
    scrapes: number;
    reports: number;
    teamMembers: number;
  };
}

function calculateUsageStats(input: CalculateUsageInput): UsageStats {
  const calculate = (used: number, limit: number) => ({
    used,
    limit,
    remaining: Math.max(0, limit - used),
    percentage: limit > 0 ? Math.min(100, (used / limit) * 100) : 0,
  });

  return {
    competitors: calculate(input.usedCompetitors, input.limits.competitors),
    hashtags: calculate(input.usedHashtags, input.limits.hashtags),
    scrapes: calculate(input.usedScrapes, input.limits.scrapes),
    reports: calculate(input.usedReports, input.limits.reports),
    teamMembers: calculate(input.usedTeamMembers, input.limits.teamMembers),
  };
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================================================
// Tier Limits
// ============================================================================

export function getTierLimits(tier: SubscriptionTier) {
  return PRICING_TIERS[tier]?.limits || PRICING_TIERS.FREE.limits;
}

export function isResourceUnlimited(tier: SubscriptionTier, resource: ResourceType): boolean {
  const limits = getTierLimits(tier);
  switch (resource) {
    case 'competitors':
      return limits.competitors >= 50;
    case 'hashtags':
      return limits.hashtags >= 100;
    case 'scrapes':
      return limits.scrapes >= 10000;
    case 'reports':
      return limits.reports >= 100;
    case 'teamMembers':
      return limits.teamMembers >= 10;
    default:
      return false;
  }
}
