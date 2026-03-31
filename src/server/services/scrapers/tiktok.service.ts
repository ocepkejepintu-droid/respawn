/**
 * TikTok Scraper Service
 * High-level service for TikTok-specific scraping operations
 */

import {
  TikTokProfile,
  TikTokPost,
  TikTokHashtagData,
  TikTokProfileInput,
  TiktokHashtagInput,
  TierType,
  ScrapingJob,
  ScrapingResult,
} from '@/types/apify';
import { ACTOR_IDS } from '../apify/actors';
import { queueJob, getJob, executorEvents } from '../apify/executor';

// ============================================================================
// Types
// ============================================================================

export interface TikTokProfileOptions {
  includePosts?: boolean;
  postsLimit?: number;
  includeVideos?: boolean;
  videosLimit?: number;
  priority?: number;
  skipCache?: boolean;
}

export interface TikTokHashtagOptions {
  resultsLimit?: number;
  tab?: 'top' | 'video';
  timeRange?: 'all' | 'day' | 'week' | 'month' | '6months';
  priority?: number;
  skipCache?: boolean;
}

export interface TikTokProfileAnalytics {
  username: string;
  followersCount: number;
  followingCount: number;
  heartsCount: number;
  videoCount: number;
  avgViews: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  avgEngagementRate: number;
  postingFrequency: number; // videos per week
  topHashtags: string[];
  trendingVideos: TikTokPost[];
  soundUsage: Array<{ sound: string; count: number }>;
}

export interface TikTokTrendAnalysis {
  hashtag: string;
  totalViews: number;
  videoCount: number;
  avgViews: number;
  growthRate: number;
  relatedHashtags: string[];
  topCreators: string[];
  trendingSounds: string[];
  velocity: number; // new videos per hour
  peakHours: string[];
}

// ============================================================================
// Profile Scraping
// ============================================================================

/**
 * Scrape TikTok profile(s)
 */
export async function scrapeProfile(
  workspaceId: string,
  profiles: string | string[],
  tier: TierType,
  options: TikTokProfileOptions = {}
): Promise<ScrapingJob> {
  const profileArray = Array.isArray(profiles) ? profiles : [profiles];

  const input: TikTokProfileInput = {
    profiles: profileArray,
    resultsLimit: profileArray.length,
    includePosts: options.includePosts ?? true,
    postsLimit: options.postsLimit ?? 30,
    includeVideos: options.includeVideos ?? true,
    videosLimit: options.videosLimit ?? 30,
  };

  return queueJob(workspaceId, ACTOR_IDS.TIKTOK_SCRAPER, input, {
    tier,
    priority: options.priority ?? 0,
    skipCache: options.skipCache,
  });
}

/**
 * Scrape multiple profiles (batch operation)
 */
export async function scrapeProfilesBatch(
  workspaceId: string,
  profiles: string[],
  tier: TierType,
  options: TikTokProfileOptions = {}
): Promise<ScrapingJob[]> {
  // Process in batches of 10
  const batchSize = 10;
  const jobs: ScrapingJob[] = [];

  for (let i = 0; i < profiles.length; i += batchSize) {
    const batch = profiles.slice(i, i + batchSize);
    const job = await scrapeProfile(workspaceId, batch, tier, {
      ...options,
      priority: (options.priority ?? 0) + i,
    });
    jobs.push(job);
  }

  return jobs;
}

/**
 * Get profile with detailed analytics
 */
export async function getProfileWithAnalytics(
  workspaceId: string,
  username: string,
  tier: TierType
): Promise<{ profile: TikTokProfile; analytics: TikTokProfileAnalytics }> {
  const job = await scrapeProfile(workspaceId, username, tier, {
    includePosts: true,
    postsLimit: 50,
    includeVideos: true,
    videosLimit: 50,
    priority: 10,
  });

  const result = await waitForJobCompletion(job.id);

  if (!result || result.itemCount === 0) {
    throw new Error(`Failed to fetch TikTok profile for ${username}`);
  }

  const profile = result.data[0] as TikTokProfile;
  const analytics = calculateProfileAnalytics(profile);

  return { profile, analytics };
}

// ============================================================================
// Hashtag Scraping & Analysis
// ============================================================================

/**
 * Scrape TikTok hashtag data
 */
export async function scrapeHashtag(
  workspaceId: string,
  hashtags: string | string[],
  tier: TierType,
  options: TikTokHashtagOptions = {}
): Promise<ScrapingJob> {
  const hashtagArray = Array.isArray(hashtags)
    ? hashtags.map(h => h.replace(/^#/, ''))
    : [hashtags.replace(/^#/, '')];

  const input: TiktokHashtagInput = {
    hashtags: hashtagArray,
    resultsLimit: options.resultsLimit ?? 100,
    tab: options.tab ?? 'top',
    timeRange: options.timeRange ?? 'week',
  };

  return queueJob(workspaceId, ACTOR_IDS.TIKTOK_HASHTAG_ANALYTICS, input, {
    tier,
    priority: options.priority ?? 0,
    skipCache: options.skipCache,
  });
}

/**
 * Analyze hashtag trends and performance
 */
export async function analyzeHashtagTrend(
  workspaceId: string,
  hashtag: string,
  tier: TierType
): Promise<TikTokTrendAnalysis> {
  const job = await scrapeHashtag(workspaceId, hashtag, tier, {
    resultsLimit: 100,
    tab: 'top',
    timeRange: 'week',
    priority: 10,
  });

  const result = await waitForJobCompletion(job.id);

  if (!result || result.itemCount === 0) {
    throw new Error(`Failed to analyze TikTok hashtag #${hashtag}`);
  }

  const hashtagData = result.data[0] as TikTokHashtagData;
  const posts = hashtagData.posts || [];

  // Calculate average views
  const avgViews = posts.length > 0
    ? posts.reduce((sum, p) => sum + p.playCount, 0) / posts.length
    : 0;

  // Extract related hashtags
  const hashtagCounts: Record<string, number> = {};
  const creatorCounts: Record<string, number> = {};
  const soundCounts: Record<string, number> = {};
  const hourCounts: Record<number, number> = {};

  posts.forEach(post => {
    // Hashtags
    post.hashtags?.forEach(tag => {
      if (tag.toLowerCase() !== hashtag.toLowerCase()) {
        hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
      }
    });

    // Creators
    if (post.authorUsername) {
      creatorCounts[post.authorUsername] = (creatorCounts[post.authorUsername] || 0) + 1;
    }

    // Sounds
    if (post.musicInfo?.title) {
      const soundKey = `${post.musicInfo.title} - ${post.musicInfo.author || 'Unknown'}`;
      soundCounts[soundKey] = (soundCounts[soundKey] || 0) + 1;
    }

    // Posting hours
    const hour = new Date(post.createTime).getUTCHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  // Get top related hashtags
  const relatedHashtags = Object.entries(hashtagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([tag]) => tag);

  // Get top creators
  const topCreators = Object.entries(creatorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([creator]) => creator);

  // Get trending sounds
  const trendingSounds = Object.entries(soundCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([sound]) => sound);

  // Get peak hours
  const peakHours = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => `${hour}:00 UTC`);

  // Calculate velocity (posts per hour, estimated from top posts)
  const velocity = posts.length / 24; // Assume top posts represent ~24 hours

  return {
    hashtag,
    totalViews: hashtagData.viewCount || 0,
    videoCount: hashtagData.videoCount || posts.length,
    avgViews,
    growthRate: hashtagData.trending ? 1.5 : 1.0, // Simplified growth indicator
    relatedHashtags,
    topCreators,
    trendingSounds,
    velocity,
    peakHours,
  };
}

/**
 * Compare multiple hashtags
 */
export async function compareHashtags(
  workspaceId: string,
  hashtags: string[],
  tier: TierType
): Promise<{
  analyses: TikTokTrendAnalysis[];
  rankings: {
    byViews: string[];
    byVelocity: string[];
    byEngagement: string[];
  };
  bestTimeToPost: string[];
  recommendedHashtags: string[];
}> {
  const analyses = await Promise.all(
    hashtags.map(tag => 
      analyzeHashtagTrend(workspaceId, tag, tier).catch(() => null)
    )
  );

  const validAnalyses = analyses.filter((a): a is TikTokTrendAnalysis => a !== null);

  // Rankings
  const byViews = [...validAnalyses]
    .sort((a, b) => b.totalViews - a.totalViews)
    .map(a => a.hashtag);

  const byVelocity = [...validAnalyses]
    .sort((a, b) => b.velocity - a.velocity)
    .map(a => a.hashtag);

  const byEngagement = [...validAnalyses]
    .sort((a, b) => (b.avgViews / b.videoCount) - (a.avgViews / a.videoCount))
    .map(a => a.hashtag);

  // Aggregate peak hours
  const allHours: Record<string, number> = {};
  validAnalyses.forEach(analysis => {
    analysis.peakHours.forEach(hour => {
      allHours[hour] = (allHours[hour] || 0) + 1;
    });
  });
  const bestTimeToPost = Object.entries(allHours)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => hour);

  // Aggregate recommended hashtags
  const allRelated = validAnalyses.flatMap(a => a.relatedHashtags);
  const relatedCounts: Record<string, number> = {};
  allRelated.forEach(tag => {
    relatedCounts[tag] = (relatedCounts[tag] || 0) + 1;
  });
  const recommendedHashtags = Object.entries(relatedCounts)
    .sort((a, b) => b[1] - a[1])
    .filter(([tag]) => !hashtags.includes(tag))
    .slice(0, 15)
    .map(([tag]) => tag);

  return {
    analyses: validAnalyses,
    rankings: {
      byViews,
      byVelocity,
      byEngagement,
    },
    bestTimeToPost,
    recommendedHashtags,
  };
}

// ============================================================================
// Video/Post Analysis
// ============================================================================

/**
 * Get detailed video analysis
 */
export async function analyzeVideo(
  workspaceId: string,
  videoUrl: string,
  tier: TierType
): Promise<{
  video: TikTokPost;
  performance: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    engagementRate: number;
    likeToViewRatio: number;
    commentToViewRatio: number;
  };
  hashtags: string[];
  sounds: string[];
  viralScore: number;
}> {
  // Extract username from URL for profile scraping
  const usernameMatch = videoUrl.match(/@([^/]+)/);
  if (!usernameMatch) {
    throw new Error('Invalid TikTok URL');
  }

  const username = usernameMatch[1];
  
  const job = await scrapeProfile(workspaceId, username, tier, {
    includePosts: true,
    postsLimit: 50,
    priority: 10,
  });

  const result = await waitForJobCompletion(job.id);

  if (!result || result.itemCount === 0) {
    throw new Error('Failed to fetch video data');
  }

  const profile = result.data[0] as TikTokProfile;
  const posts = profile.posts || [];
  
  // Find the specific video
  const video = posts.find(p => videoUrl.includes(p.id) || p.videoUrl === videoUrl);
  
  if (!video) {
    throw new Error('Video not found in profile');
  }

  // Calculate performance metrics
  const engagementRate = video.playCount > 0
    ? ((video.diggCount + video.commentCount + video.shareCount) / video.playCount) * 100
    : 0;

  const likeToViewRatio = video.playCount > 0
    ? (video.diggCount / video.playCount) * 100
    : 0;

  const commentToViewRatio = video.playCount > 0
    ? (video.commentCount / video.playCount) * 100
    : 0;

  // Calculate viral score (0-100)
  // Based on engagement rate, view velocity, and share ratio
  const shareRatio = video.playCount > 0 ? (video.shareCount / video.playCount) * 100 : 0;
  const viralScore = Math.min(100, 
    (engagementRate * 5) + (likeToViewRatio * 2) + (shareRatio * 10)
  );

  return {
    video,
    performance: {
      views: video.playCount,
      likes: video.diggCount,
      comments: video.commentCount,
      shares: video.shareCount,
      engagementRate,
      likeToViewRatio,
      commentToViewRatio,
    },
    hashtags: video.hashtags || [],
    sounds: video.musicInfo ? [video.musicInfo.title] : [],
    viralScore,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Wait for job completion with polling
 */
async function waitForJobCompletion(
  jobId: string,
  timeoutMs: number = 300000
): Promise<ScrapingResult | null> {
  const startTime = Date.now();
  const pollInterval = 2000;

  return new Promise((resolve, reject) => {
    const checkStatus = async () => {
      const job = await getJob(jobId);

      if (!job) {
        reject(new Error('Job not found'));
        return;
      }

      if (job.status === 'completed') {
        resolve(job.result || null);
        return;
      }

      if (job.status === 'failed') {
        reject(new Error(job.error || 'Job failed'));
        return;
      }

      if (job.status === 'cancelled') {
        reject(new Error('Job was cancelled'));
        return;
      }

      if (Date.now() - startTime > timeoutMs) {
        reject(new Error('Timeout waiting for job completion'));
        return;
      }

      setTimeout(checkStatus, pollInterval);
    };

    const onCompleted = (completedJob: ScrapingJob) => {
      if (completedJob.id === jobId) {
        cleanup();
        resolve(completedJob.result || null);
      }
    };

    const onFailed = (failedJob: ScrapingJob) => {
      if (failedJob.id === jobId) {
        cleanup();
        reject(new Error(failedJob.error || 'Job failed'));
      }
    };

    const cleanup = () => {
      executorEvents.off('job:completed', onCompleted);
      executorEvents.off('job:failed', onFailed);
    };

    executorEvents.on('job:completed', onCompleted);
    executorEvents.on('job:failed', onFailed);

    checkStatus();
  });
}

/**
 * Calculate profile analytics from scraped data
 */
function calculateProfileAnalytics(profile: TikTokProfile): TikTokProfileAnalytics {
  const posts = profile.posts || [];

  const totalViews = posts.reduce((sum, p) => sum + p.playCount, 0);
  const totalLikes = posts.reduce((sum, p) => sum + p.diggCount, 0);
  const totalComments = posts.reduce((sum, p) => sum + p.commentCount, 0);
  const totalShares = posts.reduce((sum, p) => sum + p.shareCount, 0);

  const avgViews = posts.length > 0 ? totalViews / posts.length : 0;
  const avgLikes = posts.length > 0 ? totalLikes / posts.length : 0;
  const avgComments = posts.length > 0 ? totalComments / posts.length : 0;
  const avgShares = posts.length > 0 ? totalShares / posts.length : 0;

  // Engagement rate: (likes + comments + shares) / views
  const avgEngagementRate = avgViews > 0
    ? ((avgLikes + avgComments + avgShares) / avgViews) * 100
    : 0;

  // Extract hashtags
  const allHashtags: string[] = [];
  const soundUsage: Record<string, number> = {};

  posts.forEach(post => {
    allHashtags.push(...(post.hashtags || []));
    
    if (post.musicInfo?.title) {
      const soundKey = `${post.musicInfo.title} - ${post.musicInfo.author || 'Unknown'}`;
      soundUsage[soundKey] = (soundUsage[soundKey] || 0) + 1;
    }
  });

  // Count hashtag frequency
  const hashtagCounts: Record<string, number> = {};
  allHashtags.forEach(tag => {
    hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
  });

  const topHashtags = Object.entries(hashtagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag);

  // Get trending videos (top 5 by views)
  const trendingVideos = [...posts]
    .sort((a, b) => b.playCount - a.playCount)
    .slice(0, 5);

  // Calculate posting frequency
  let postingFrequency = 0;
  if (posts.length >= 2) {
    const timestamps = posts
      .map(p => new Date(p.createTime).getTime())
      .sort((a, b) => b - a);
    const timeSpan = timestamps[0] - timestamps[timestamps.length - 1];
    const weeks = timeSpan / (7 * 24 * 60 * 60 * 1000);
    postingFrequency = weeks > 0 ? posts.length / weeks : posts.length;
  }

  // Get top sounds
  const sortedSounds = Object.entries(soundUsage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([sound, count]) => ({ sound, count }));

  return {
    username: profile.username,
    followersCount: profile.followersCount,
    followingCount: profile.followingCount,
    heartsCount: profile.heartsCount,
    videoCount: profile.videoCount,
    avgViews,
    avgLikes,
    avgComments,
    avgShares,
    avgEngagementRate,
    postingFrequency,
    topHashtags,
    trendingVideos,
    soundUsage: sortedSounds,
  };
}

// ============================================================================
// Batch Operations
// ============================================================================

/**
 * Compare multiple TikTok profiles
 */
export async function compareProfiles(
  workspaceId: string,
  usernames: string[],
  tier: TierType
): Promise<{
  profiles: TikTokProfile[];
  analytics: TikTokProfileAnalytics[];
  comparison: {
    mostFollowers: string;
    highestEngagement: string;
    mostViews: string;
    mostActive: string;
    topHashtags: string[];
    trendingSounds: string[];
  };
}> {
  const jobs = await scrapeProfilesBatch(workspaceId, usernames, tier, {
    includePosts: true,
    postsLimit: 30,
    priority: 10,
  });

  const results = await Promise.all(
    jobs.map(job => waitForJobCompletion(job.id).catch(() => null))
  );

  const profiles: TikTokProfile[] = [];
  const analytics: TikTokProfileAnalytics[] = [];

  results.forEach((result, index) => {
    if (result && result.itemCount > 0) {
      const profile = result.data[0] as TikTokProfile;
      profiles.push(profile);
      analytics.push(calculateProfileAnalytics(profile));
    }
  });

  // Calculate comparison metrics
  const mostFollowers = analytics.reduce((max, a) =>
    a.followersCount > max.followersCount ? a : max
  , analytics[0]);

  const highestEngagement = analytics.reduce((max, a) =>
    a.avgEngagementRate > max.avgEngagementRate ? a : max
  , analytics[0]);

  const mostViews = analytics.reduce((max, a) =>
    a.avgViews > max.avgViews ? a : max
  , analytics[0]);

  const mostActive = analytics.reduce((max, a) =>
    a.postingFrequency > max.postingFrequency ? a : max
  , analytics[0]);

  // Aggregate top hashtags
  const allHashtags = analytics.flatMap(a => a.topHashtags);
  const hashtagCounts: Record<string, number> = {};
  allHashtags.forEach(tag => {
    hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
  });
  const topHashtags = Object.entries(hashtagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag);

  // Aggregate trending sounds
  const allSounds = analytics.flatMap(a => a.soundUsage);
  const soundCounts: Record<string, number> = {};
  allSounds.forEach(({ sound, count }) => {
    soundCounts[sound] = (soundCounts[sound] || 0) + count;
  });
  const trendingSounds = Object.entries(soundCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([sound]) => sound);

  return {
    profiles,
    analytics,
    comparison: {
      mostFollowers: mostFollowers?.username || '',
      highestEngagement: highestEngagement?.username || '',
      mostViews: mostViews?.username || '',
      mostActive: mostActive?.username || '',
      topHashtags,
      trendingSounds,
    },
  };
}

/**
 * Discover trending content
 */
export async function discoverTrending(
  workspaceId: string,
  tier: TierType,
  seedHashtags: string[] = ['fyp', 'trending', 'viral']
): Promise<{
  trendingHashtags: Array<{ hashtag: string; velocity: number; views: number }>;
  trendingSounds: string[];
  trendingCreators: string[];
  contentIdeas: string[];
}> {
  // Analyze seed hashtags to find related trending content
  const hashtagAnalyses = await Promise.all(
    seedHashtags.map(tag =>
      analyzeHashtagTrend(workspaceId, tag, tier).catch(() => null)
    )
  );

  const validAnalyses = hashtagAnalyses.filter((a): a is TikTokTrendAnalysis => a !== null);

  // Get trending hashtags by velocity
  const trendingHashtags = validAnalyses
    .map(a => ({
      hashtag: a.hashtag,
      velocity: a.velocity,
      views: a.totalViews,
    }))
    .sort((a, b) => b.velocity - a.velocity);

  // Aggregate trending sounds
  const allSounds = validAnalyses.flatMap(a => a.trendingSounds);
  const soundCounts: Record<string, number> = {};
  allSounds.forEach(sound => {
    soundCounts[sound] = (soundCounts[sound] || 0) + 1;
  });
  const trendingSounds = Object.entries(soundCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([sound]) => sound);

  // Aggregate top creators
  const allCreators = validAnalyses.flatMap(a => a.topCreators);
  const creatorCounts: Record<string, number> = {};
  allCreators.forEach(creator => {
    creatorCounts[creator] = (creatorCounts[creator] || 0) + 1;
  });
  const trendingCreators = Object.entries(creatorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([creator]) => creator);

  // Generate content ideas from trending hashtags
  const contentIdeas = validAnalyses
    .flatMap(a => a.relatedHashtags)
    .filter((tag, index, self) => self.indexOf(tag) === index)
    .slice(0, 20)
    .map(tag => `Create content around #${tag}`);

  return {
    trendingHashtags,
    trendingSounds,
    trendingCreators,
    contentIdeas,
  };
}
