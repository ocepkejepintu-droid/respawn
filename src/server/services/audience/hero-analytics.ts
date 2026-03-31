import { AnalysisType, Prisma, ReportStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { InstagramPost, TikTokPost } from '@/types/apify';
import { getProfileWithAnalytics as getInstagramProfileWithAnalytics } from '@/server/services/scrapers/instagram.service';
import { getProfileWithAnalytics as getTikTokProfileWithAnalytics } from '@/server/services/scrapers/tiktok.service';

export type HeroAccountPlatform = 'instagram' | 'tiktok';

export interface HeroAccountSnapshot {
  platform: HeroAccountPlatform;
  handle: string;
  profileUrl: string;
  profile: {
    displayName: string;
    bio?: string;
    avatarUrl?: string;
    verified: boolean;
    followersCount: number;
    followingCount: number;
    postCount: number;
  };
  performance: {
    avgEngagementRate: number;
    postingFrequency: number;
    avgLikes?: number;
    avgComments?: number;
    avgViews?: number;
    avgShares?: number;
    topHashtags: string[];
    bestPostingTimes: string[];
  };
  standoutContent: Array<{
    id: string;
    title: string;
    postedAt: string;
    url: string;
    engagementRate: number;
    views?: number;
    likes: number;
    comments: number;
    shares?: number;
    reason: string;
  }>;
  audienceQualitySignals: {
    score: number;
    summary: string;
    signals: string[];
    estimatedBotFollowerPct: null;
  };
}

export interface HeroAnalyticsReport {
  id: string;
  createdAt: string;
  handles: {
    instagramHandle?: string;
    tiktokHandle?: string;
  };
  accounts: HeroAccountSnapshot[];
  insights: string[];
  recommendations: string[];
}

export function normalizeHandle(handle?: string | null): string | undefined {
  if (!handle) return undefined;

  const trimmed = handle.trim();
  if (!trimmed) return undefined;

  const withoutUrl = trimmed
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/i, '')
    .replace(/^@/, '');

  return withoutUrl.replace(/\/.*$/, '').trim() || undefined;
}

function calculateInstagramStandouts(posts: InstagramPost[] = []) {
  return [...posts]
    .sort((a, b) => {
      const aScore = a.engagementRate ?? a.likesCount + a.commentsCount;
      const bScore = b.engagementRate ?? b.likesCount + b.commentsCount;
      return bScore - aScore;
    })
    .slice(0, 3)
    .map((post) => ({
      id: post.id,
      title: post.caption?.slice(0, 80) || 'Top Instagram post',
      postedAt: post.timestamp,
      url: post.url,
      engagementRate: post.engagementRate ?? 0,
      views: post.videoViewCount,
      likes: post.likesCount,
      comments: post.commentsCount,
      shares: undefined,
      reason:
        post.engagementRate && post.engagementRate > 5
          ? 'High engagement rate relative to audience size'
          : 'Strong reaction volume across likes and comments',
    }));
}

function calculateTikTokStandouts(posts: TikTokPost[] = []) {
  return [...posts]
    .sort((a, b) => {
      const aScore =
        a.engagementRate ?? a.playCount + a.diggCount + a.commentCount + a.shareCount;
      const bScore =
        b.engagementRate ?? b.playCount + b.diggCount + b.commentCount + b.shareCount;
      return bScore - aScore;
    })
    .slice(0, 3)
    .map((post) => ({
      id: post.id,
      title: post.desc?.slice(0, 80) || 'Top TikTok video',
      postedAt: post.createTime,
      url: post.videoUrl,
      engagementRate: post.engagementRate ?? 0,
      views: post.playCount,
      likes: post.diggCount,
      comments: post.commentCount,
      shares: post.shareCount,
      reason:
        post.shareCount > Math.max(10, post.commentCount)
          ? 'Shares are elevated, which usually signals replay or recommendation power'
          : 'Video is outperforming the profile baseline on reach and interaction',
    }));
}

function buildAudienceQualitySignals(input: {
  followersCount: number;
  avgEngagementRate: number;
  postingFrequency: number;
}) {
  const signals: string[] = [];
  let score = 60;

  if (input.avgEngagementRate >= 4) {
    score += 15;
    signals.push('Engagement rate is healthy for the current audience size.');
  } else if (input.avgEngagementRate < 1) {
    score -= 15;
    signals.push('Engagement is low relative to follower count, which is worth monitoring.');
  }

  if (input.postingFrequency >= 2) {
    score += 10;
    signals.push('Posting cadence is consistent enough to compare content performance over time.');
  } else {
    signals.push('Posting cadence is light, so swings may reflect small sample size rather than audience quality.');
  }

  if (input.followersCount >= 1000 && input.avgEngagementRate >= 2) {
    score += 5;
    signals.push('Follower-to-engagement balance looks more organic than inflated.');
  }

  return {
    score: Math.max(20, Math.min(92, score)),
    summary:
      'This is a heuristic quality score based on engagement consistency and posting behavior. It is not a bot-follower percentage.',
    signals,
    estimatedBotFollowerPct: null,
  };
}

function buildHeroInsights(accounts: HeroAccountSnapshot[]) {
  const insights: string[] = [];

  accounts.forEach((account) => {
    const topHashtag = account.performance.topHashtags[0];
    const bestTime = account.performance.bestPostingTimes[0];
    const standout = account.standoutContent[0];

    insights.push(
      `${account.platform === 'instagram' ? 'Instagram' : 'TikTok'} @${account.handle} is averaging ${account.performance.avgEngagementRate.toFixed(1)}% engagement across recent posts.`
    );

    if (topHashtag) {
      insights.push(`The strongest recurring tag for @${account.handle} is #${topHashtag}.`);
    }

    if (bestTime) {
      insights.push(`Recent winners for @${account.handle} cluster around ${bestTime}.`);
    }

    if (standout) {
      insights.push(`"${standout.title}" is currently the clearest proof of what is working on @${account.handle}.`);
    }
  });

  return insights.slice(0, 6);
}

function buildHeroRecommendations(accounts: HeroAccountSnapshot[]) {
  const recommendations: string[] = [];

  accounts.forEach((account) => {
    const standout = account.standoutContent[0];
    const hashtags = account.performance.topHashtags.slice(0, 3).map((tag) => `#${tag}`);

    if (standout) {
      recommendations.push(
        `Build your next ${account.platform === 'instagram' ? 'Instagram' : 'TikTok'} post around the pattern used in "${standout.title}".`
      );
    }

    if (hashtags.length > 0) {
      recommendations.push(`Keep testing ${hashtags.join(', ')} on @${account.handle}; they appear in your stronger content.`);
    }

    if (account.audienceQualitySignals.score < 50) {
      recommendations.push(
        `For @${account.handle}, focus on improving interaction quality before chasing follower growth.`
      );
    }
  });

  return recommendations.slice(0, 6);
}

export function parseHeroAnalyticsReport(
  report: {
    id: string;
    createdAt: Date;
    config: Prisma.JsonValue | null;
    results: Prisma.JsonValue | null;
    insights: Prisma.JsonValue;
    recommendations: Prisma.JsonValue;
  }
): HeroAnalyticsReport | null {
  const config = (report.config ?? {}) as Record<string, unknown>;
  if (config.source !== 'hero-account-analysis') {
    return null;
  }

  const results = (report.results ?? {}) as Record<string, unknown>;
  const accounts = Array.isArray(results.accounts) ? (results.accounts as HeroAccountSnapshot[]) : [];
  const insights = Array.isArray(report.insights) ? (report.insights as string[]) : [];
  const recommendations = Array.isArray(report.recommendations)
    ? (report.recommendations as string[])
    : [];

  return {
    id: report.id,
    createdAt: report.createdAt.toISOString(),
    handles: {
      instagramHandle: typeof config.instagramHandle === 'string' ? config.instagramHandle : undefined,
      tiktokHandle: typeof config.tiktokHandle === 'string' ? config.tiktokHandle : undefined,
    },
    accounts,
    insights,
    recommendations,
  };
}

export async function getHeroAnalyticsReports(workspaceId: string, limit: number) {
  const reports = await prisma.analysisReport.findMany({
    where: {
      workspaceId,
      type: AnalysisType.ENGAGEMENT_REPORT,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: Math.max(limit * 3, 12),
  });

  return reports
    .map(parseHeroAnalyticsReport)
    .filter((report): report is HeroAnalyticsReport => Boolean(report))
    .slice(0, limit);
}

export async function createHeroAnalyticsReport(input: {
  workspaceId: string;
  userId: string;
  instagramHandle?: string;
  tiktokHandle?: string;
}) {
  const instagramHandle = normalizeHandle(input.instagramHandle);
  const tiktokHandle = normalizeHandle(input.tiktokHandle);
  const generatedAt = new Date();
  const accounts: HeroAccountSnapshot[] = [];

  if (instagramHandle) {
    const { profile, analytics } = await getInstagramProfileWithAnalytics(
      input.workspaceId,
      instagramHandle,
      'PRO'
    );

    accounts.push({
      platform: 'instagram',
      handle: profile.username,
      profileUrl: `https://instagram.com/${profile.username}`,
      profile: {
        displayName: profile.fullName || profile.username,
        bio: profile.biography,
        avatarUrl: profile.profilePicUrlHD || profile.profilePicUrl,
        verified: profile.isVerified,
        followersCount: profile.followersCount,
        followingCount: profile.followsCount,
        postCount: profile.mediaCount,
      },
      performance: {
        avgEngagementRate: analytics.avgEngagementRate,
        postingFrequency: analytics.postingFrequency,
        avgLikes: analytics.avgLikes,
        avgComments: analytics.avgComments,
        topHashtags: analytics.topHashtags,
        bestPostingTimes: analytics.bestPostingTimes,
      },
      standoutContent: calculateInstagramStandouts(profile.posts),
      audienceQualitySignals: buildAudienceQualitySignals({
        followersCount: profile.followersCount,
        avgEngagementRate: analytics.avgEngagementRate,
        postingFrequency: analytics.postingFrequency,
      }),
    });
  }

  if (tiktokHandle) {
    const { profile, analytics } = await getTikTokProfileWithAnalytics(
      input.workspaceId,
      tiktokHandle,
      'PRO'
    );

    accounts.push({
      platform: 'tiktok',
      handle: profile.username,
      profileUrl: `https://www.tiktok.com/@${profile.username}`,
      profile: {
        displayName: profile.nickname || profile.username,
        bio: profile.signature,
        avatarUrl: profile.avatar,
        verified: profile.verified,
        followersCount: profile.followersCount,
        followingCount: profile.followingCount,
        postCount: profile.videoCount,
      },
      performance: {
        avgEngagementRate: analytics.avgEngagementRate,
        postingFrequency: analytics.postingFrequency,
        avgLikes: analytics.avgLikes,
        avgComments: analytics.avgComments,
        avgViews: analytics.avgViews,
        avgShares: analytics.avgShares,
        topHashtags: analytics.topHashtags,
        bestPostingTimes: [],
      },
      standoutContent: calculateTikTokStandouts(profile.posts),
      audienceQualitySignals: buildAudienceQualitySignals({
        followersCount: profile.followersCount,
        avgEngagementRate: analytics.avgEngagementRate,
        postingFrequency: analytics.postingFrequency,
      }),
    });
  }

  const insights = buildHeroInsights(accounts);
  const recommendations = buildHeroRecommendations(accounts);

  const report = await prisma.analysisReport.create({
    data: {
      title: 'Hero Account Analytics',
      description: 'Manual account analysis generated from the latest server update.',
      type: AnalysisType.ENGAGEMENT_REPORT,
      status: ReportStatus.COMPLETED,
      dateRangeStart: new Date(generatedAt.getTime() - 30 * 24 * 60 * 60 * 1000),
      dateRangeEnd: generatedAt,
      config: {
        source: 'hero-account-analysis',
        instagramHandle,
        tiktokHandle,
      } as Prisma.InputJsonValue,
      results: {
        generatedAt: generatedAt.toISOString(),
        accounts,
      } as Prisma.InputJsonValue,
      insights: insights as Prisma.InputJsonValue,
      recommendations: recommendations as Prisma.InputJsonValue,
      workspaceId: input.workspaceId,
      createdById: input.userId,
      startedAt: generatedAt,
      completedAt: generatedAt,
    },
    select: {
      id: true,
      createdAt: true,
      config: true,
      results: true,
      insights: true,
      recommendations: true,
    },
  });

  return parseHeroAnalyticsReport(report);
}
