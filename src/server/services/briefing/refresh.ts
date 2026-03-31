import { Platform, SubscriptionTier } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  InstagramHashtagData,
  InstagramProfile,
  ScrapingResult,
  TierType,
  TikTokHashtagData,
  TikTokProfile,
} from "@/types/apify";
import { getJob } from "@/server/services/apify/executor";
import * as instagramService from "@/server/services/scrapers/instagram.service";
import * as tiktokService from "@/server/services/scrapers/tiktok.service";

const POLL_INTERVAL_MS = 1500;
const JOB_TIMEOUT_MS = 10 * 60 * 1000;

type SnapshotPost = {
  id: string;
  platformPostId: string;
  contentType: string;
  caption?: string;
  mediaUrls: string[];
  permalink: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  engagementRate: number;
  postedAt: string;
  hashtags: string[];
  sentimentScore?: number;
};

type CompetitorSnapshot = {
  syncedAt: string;
  followerCount: number;
  postCount: number;
  posts: SnapshotPost[];
};

type HashtagSnapshot = {
  syncedAt: string;
  postCount: number;
  velocity: number;
  trendingScore: number;
  relatedHashtags: string[];
  posts: SnapshotPost[];
};

export interface BriefingRefreshResult {
  refreshedAt: string;
  competitors: Array<{
    competitorId: string;
    platform: Platform;
    handle: string;
    postCount: number;
  }>;
  hashtags: Array<{
    hashtagTrackId: string;
    platform: Platform;
    tag: string;
    postCount: number;
  }>;
}

function mapTier(tier: SubscriptionTier | null | undefined): TierType {
  if (tier === SubscriptionTier.AGENCY) return "AGENCY";
  if (tier === SubscriptionTier.PRO) return "PRO";
  return "FREE";
}

async function waitForJobResult(jobId: string): Promise<ScrapingResult> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < JOB_TIMEOUT_MS) {
    const job = await getJob(jobId);

    if (!job) {
      throw new Error(`Apify job ${jobId} was not found`);
    }

    if (job.status === "completed" && job.result) {
      return job.result;
    }

    if (job.status === "failed" || job.status === "cancelled") {
      throw new Error(job.error || `Apify job ${jobId} ${job.status}`);
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error(`Apify job ${jobId} timed out`);
}

function buildInstagramSnapshotPost(post: NonNullable<InstagramProfile["posts"]>[number]): SnapshotPost {
  return {
    id: post.id,
    platformPostId: post.shortCode || post.id,
    contentType: post.isVideo ? "video" : "image",
    caption: post.caption,
    mediaUrls: [post.displayUrl].filter(Boolean),
    permalink: post.url,
    likesCount: post.likesCount,
    commentsCount: post.commentsCount,
    sharesCount: 0,
    viewsCount: post.videoViewCount || 0,
    engagementRate: post.engagementRate || 0,
    postedAt: post.timestamp,
    hashtags: post.hashtags || [],
  };
}

function buildTiktokSnapshotPost(post: NonNullable<TikTokProfile["posts"]>[number]): SnapshotPost {
  return {
    id: post.id,
    platformPostId: post.id,
    contentType: "video",
    caption: post.desc,
    mediaUrls: [post.coverUrl || post.videoUrl].filter(Boolean),
    permalink: post.videoUrl,
    likesCount: post.diggCount,
    commentsCount: post.commentCount,
    sharesCount: post.shareCount,
    viewsCount: post.playCount,
    engagementRate: post.engagementRate || 0,
    postedAt: post.createTime,
    hashtags: post.hashtags || [],
  };
}

async function refreshCompetitor(
  workspaceId: string,
  tier: TierType,
  competitor: {
    id: string;
    platform: Platform;
    handle: string;
    profileUrl: string;
    metadata: unknown;
  }
) {
  const previousLatest = (competitor.metadata as { latestSnapshot?: CompetitorSnapshot } | null)?.latestSnapshot;

  if (competitor.platform === Platform.INSTAGRAM) {
    const { profile } = await instagramService.getProfileWithAnalytics(workspaceId, competitor.handle, tier);
    const posts = (profile.posts || []).slice(0, 12).map(buildInstagramSnapshotPost);
    const latestSnapshot: CompetitorSnapshot = {
      syncedAt: new Date().toISOString(),
      followerCount: profile.followersCount,
      postCount: profile.mediaCount,
      posts,
    };

    await prisma.competitor.update({
      where: { id: competitor.id },
      data: {
        displayName: profile.fullName || competitor.handle,
        avatarUrl: profile.profilePicUrlHD || profile.profilePicUrl || null,
        bio: profile.biography || null,
        profileUrl: competitor.profileUrl || `https://instagram.com/${profile.username}`,
        followerCount: profile.followersCount,
        followingCount: profile.followsCount,
        postCount: profile.mediaCount,
        lastSyncedAt: new Date(),
        metadata: {
          latestSnapshot,
          previousSnapshot: previousLatest || null,
          source: "apify",
        },
      },
    });

    return { competitorId: competitor.id, platform: competitor.platform, handle: competitor.handle, postCount: posts.length };
  }

  const { profile } = await tiktokService.getProfileWithAnalytics(workspaceId, competitor.handle, tier);
  const posts = (profile.posts || []).slice(0, 12).map(buildTiktokSnapshotPost);
  const latestSnapshot: CompetitorSnapshot = {
    syncedAt: new Date().toISOString(),
    followerCount: profile.followersCount,
    postCount: profile.videoCount,
    posts,
  };

  await prisma.competitor.update({
    where: { id: competitor.id },
    data: {
      displayName: profile.nickname || competitor.handle,
      avatarUrl: profile.avatar || null,
      bio: profile.signature || null,
      profileUrl: competitor.profileUrl || `https://www.tiktok.com/@${profile.username}`,
      followerCount: profile.followersCount,
      followingCount: profile.followingCount,
      postCount: profile.videoCount,
      lastSyncedAt: new Date(),
      metadata: {
        latestSnapshot,
        previousSnapshot: previousLatest || null,
        source: "apify",
      },
    },
  });

  return { competitorId: competitor.id, platform: competitor.platform, handle: competitor.handle, postCount: posts.length };
}

async function refreshInstagramHashtag(workspaceId: string, tier: TierType, tag: string) {
  const job = await instagramService.scrapeHashtag(workspaceId, tag, tier, {
    resultsLimit: 30,
    tab: "top",
    priority: 10,
    skipCache: true,
  });
  const result = await waitForJobResult(job.id);
  return result.data[0] as InstagramHashtagData | undefined;
}

async function refreshTiktokHashtag(workspaceId: string, tier: TierType, tag: string) {
  const job = await tiktokService.scrapeHashtag(workspaceId, tag, tier, {
    resultsLimit: 30,
    tab: "top",
    timeRange: "week",
    priority: 10,
    skipCache: true,
  });
  const result = await waitForJobResult(job.id);
  return result.data[0] as TikTokHashtagData | undefined;
}

async function refreshHashtag(
  workspaceId: string,
  tier: TierType,
  hashtagTrack: {
    id: string;
    tag: string;
    platform: Platform;
    metadata: unknown;
  }
) {
  const previousLatest = (hashtagTrack.metadata as { latestSnapshot?: HashtagSnapshot } | null)?.latestSnapshot;

  if (hashtagTrack.platform === Platform.INSTAGRAM) {
    const data = await refreshInstagramHashtag(workspaceId, tier, hashtagTrack.tag);
    if (!data) {
      throw new Error(`No Instagram hashtag data returned for #${hashtagTrack.tag}`);
    }

    const topPosts = [...(data.topPosts || []), ...(data.recentPosts || []), ...(data.reels || [])]
      .slice(0, 12)
      .map(buildInstagramSnapshotPost);
    const latestSnapshot: HashtagSnapshot = {
      syncedAt: new Date().toISOString(),
      postCount: data.mediaCount,
      velocity: data.topPosts?.length ? data.topPosts.length / 24 : 0,
      trendingScore: data.mediaCount,
      relatedHashtags: Array.from(new Set(topPosts.flatMap((post) => post.hashtags).filter((tag) => tag.toLowerCase() !== hashtagTrack.tag.toLowerCase()))).slice(0, 10),
      posts: topPosts,
    };

    await prisma.hashtagTrack.update({
      where: { id: hashtagTrack.id },
      data: {
        postCount: data.mediaCount,
        trendingScore: latestSnapshot.trendingScore,
        lastSyncedAt: new Date(),
        metadata: {
          latestSnapshot,
          previousSnapshot: previousLatest || null,
          source: "apify",
        },
      },
    });

    return { hashtagTrackId: hashtagTrack.id, platform: hashtagTrack.platform, tag: hashtagTrack.tag, postCount: data.mediaCount };
  }

  const data = await refreshTiktokHashtag(workspaceId, tier, hashtagTrack.tag);
  if (!data) {
    throw new Error(`No TikTok hashtag data returned for #${hashtagTrack.tag}`);
  }

  const topPosts = (data.posts || []).slice(0, 12).map(buildTiktokSnapshotPost);
  const latestSnapshot: HashtagSnapshot = {
    syncedAt: new Date().toISOString(),
    postCount: data.videoCount,
    velocity: topPosts.length / 24,
    trendingScore: data.viewCount || data.videoCount,
    relatedHashtags: Array.from(new Set(topPosts.flatMap((post) => post.hashtags).filter((tag) => tag.toLowerCase() !== hashtagTrack.tag.toLowerCase()))).slice(0, 10),
    posts: topPosts,
  };

  await prisma.hashtagTrack.update({
    where: { id: hashtagTrack.id },
    data: {
      postCount: data.videoCount,
      trendingScore: latestSnapshot.trendingScore,
      lastSyncedAt: new Date(),
      metadata: {
        latestSnapshot,
        previousSnapshot: previousLatest || null,
        source: "apify",
      },
    },
  });

  return { hashtagTrackId: hashtagTrack.id, platform: hashtagTrack.platform, tag: hashtagTrack.tag, postCount: data.videoCount };
}

export async function refreshBriefingSources(workspaceId: string): Promise<BriefingRefreshResult> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      id: true,
      subscription: {
        select: {
          tier: true,
        },
      },
      competitors: {
        where: { isActive: true },
        select: {
          id: true,
          platform: true,
          handle: true,
          profileUrl: true,
          metadata: true,
        },
      },
      hashtagTracks: {
        where: { isActive: true },
        select: {
          id: true,
          tag: true,
          platform: true,
          metadata: true,
        },
      },
    },
  });

  if (!workspace) {
    throw new Error(`Workspace ${workspaceId} was not found`);
  }

  const tier = mapTier(workspace.subscription?.tier);

  const competitors = [];
  for (const competitor of workspace.competitors) {
    competitors.push(await refreshCompetitor(workspaceId, tier, competitor));
  }

  const hashtags = [];
  for (const hashtagTrack of workspace.hashtagTracks) {
    hashtags.push(await refreshHashtag(workspaceId, tier, hashtagTrack));
  }

  return {
    refreshedAt: new Date().toISOString(),
    competitors,
    hashtags,
  };
}
