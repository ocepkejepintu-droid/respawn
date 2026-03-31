/**
 * Instagram Scraper Service
 * High-level service for Instagram-specific scraping operations
 */

import {
  InstagramProfile,
  InstagramPost,
  InstagramComment,
  InstagramHashtagData,
  InstagramProfileInput,
  InstagramPostInput,
  InstagramHashtagInput,
  InstagramCommentsInput,
  TierType,
  ScrapingJob,
  ScrapingResult,
} from '@/types/apify';
import { ACTOR_IDS } from '../apify/actors';
import { queueJob, getJob, executorEvents } from '../apify/executor';

// ============================================================================
// Types
// ============================================================================

export interface ProfileScrapeOptions {
  includePosts?: boolean;
  postsLimit?: number;
  includeStories?: boolean;
  includeHighlights?: boolean;
  includeBusinessInfo?: boolean;
  priority?: number;
  skipCache?: boolean;
}

export interface PostScrapeOptions {
  includeComments?: boolean;
  commentsLimit?: number;
  dateRange?: {
    from: Date;
    to: Date;
  };
  priority?: number;
  skipCache?: boolean;
}

export interface HashtagScrapeOptions {
  resultsLimit?: number;
  tab?: 'top' | 'recent' | 'reels';
  priority?: number;
  skipCache?: boolean;
}

export interface CommentsScrapeOptions {
  resultsLimit?: number;
  includeReplies?: boolean;
  repliesLimit?: number;
  sort?: 'top' | 'recent';
  priority?: number;
  skipCache?: boolean;
}

export interface ProfileAnalytics {
  username: string;
  followersCount: number;
  followingCount: number;
  mediaCount: number;
  avgLikes: number;
  avgComments: number;
  avgEngagementRate: number;
  postingFrequency: number; // posts per week
  topHashtags: string[];
  bestPostingTimes: string[];
  growthRate?: number;
}

// ============================================================================
// Profile Scraping
// ============================================================================

/**
 * Scrape Instagram profile(s)
 */
export async function scrapeProfile(
  workspaceId: string,
  usernames: string | string[],
  tier: TierType,
  options: ProfileScrapeOptions = {}
): Promise<ScrapingJob> {
  const usernameArray = Array.isArray(usernames) ? usernames : [usernames];

  const input: InstagramProfileInput = {
    usernames: usernameArray,
    resultsLimit: usernameArray.length,
    includePosts: options.includePosts ?? true,
    postsLimit: options.postsLimit ?? 12,
    includeStories: options.includeStories ?? false,
    includeHighlights: options.includeHighlights ?? false,
    includeBusinessInfo: options.includeBusinessInfo ?? true,
  };

  return queueJob(workspaceId, ACTOR_IDS.INSTAGRAM_PROFILE_SCRAPER, input, {
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
  usernames: string[],
  tier: TierType,
  options: ProfileScrapeOptions = {}
): Promise<ScrapingJob[]> {
  // Process in batches of 10 (actor limit per run)
  const batchSize = 10;
  const jobs: ScrapingJob[] = [];

  for (let i = 0; i < usernames.length; i += batchSize) {
    const batch = usernames.slice(i, i + batchSize);
    const job = await scrapeProfile(workspaceId, batch, tier, {
      ...options,
      priority: (options.priority ?? 0) + i, // Lower priority for later batches
    });
    jobs.push(job);
  }

  return jobs;
}

/**
 * Get profile with analytics
 */
export async function getProfileWithAnalytics(
  workspaceId: string,
  username: string,
  tier: TierType
): Promise<{ profile: InstagramProfile; analytics: ProfileAnalytics }> {
  const job = await scrapeProfile(workspaceId, username, tier, {
    includePosts: true,
    postsLimit: 50,
    priority: 10,
  });

  // Wait for completion
  const result = await waitForJobCompletion(job.id);

  if (!result || result.itemCount === 0) {
    throw new Error(`Failed to fetch profile for ${username}`);
  }

  const profile = result.data[0] as InstagramProfile;
  const analytics = calculateProfileAnalytics(profile);

  return { profile, analytics };
}

// ============================================================================
// Post Scraping
// ============================================================================

/**
 * Scrape posts by username
 */
export async function scrapePostsByUsername(
  workspaceId: string,
  username: string,
  tier: TierType,
  options: PostScrapeOptions = {}
): Promise<ScrapingJob> {
  const input: InstagramPostInput = {
    username,
    resultsLimit: 50,
    includeComments: options.includeComments ?? false,
    commentsLimit: options.commentsLimit ?? 10,
    dateRange: options.dateRange
      ? {
          from: options.dateRange.from.toISOString(),
          to: options.dateRange.to.toISOString(),
        }
      : undefined,
  };

  return queueJob(workspaceId, ACTOR_IDS.INSTAGRAM_POST_SCRAPER, input, {
    tier,
    priority: options.priority ?? 0,
    skipCache: options.skipCache,
  });
}

/**
 * Scrape posts by URLs
 */
export async function scrapePostsByUrls(
  workspaceId: string,
  urls: string[],
  tier: TierType,
  options: PostScrapeOptions = {}
): Promise<ScrapingJob> {
  const input: InstagramPostInput = {
    urls,
    resultsLimit: urls.length,
    includeComments: options.includeComments ?? false,
    commentsLimit: options.commentsLimit ?? 10,
  };

  return queueJob(workspaceId, ACTOR_IDS.INSTAGRAM_POST_SCRAPER, input, {
    tier,
    priority: options.priority ?? 0,
    skipCache: options.skipCache,
  });
}

/**
 * Scrape post with full details including comments
 */
export async function getPostWithComments(
  workspaceId: string,
  postUrl: string,
  tier: TierType
): Promise<{ post: InstagramPost; comments: InstagramComment[] }> {
  // First get the post
  const postJob = await scrapePostsByUrls(workspaceId, [postUrl], tier, {
    includeComments: true,
    commentsLimit: 100,
    priority: 10,
  });

  const postResult = await waitForJobCompletion(postJob.id);

  if (!postResult || postResult.itemCount === 0) {
    throw new Error('Failed to fetch post');
  }

  const post = postResult.data[0] as InstagramPost;

  // If we need more comments, fetch separately
  let comments: InstagramComment[] = [];
  if (post.commentsCount > 100) {
    const commentsJob = await scrapeComments(workspaceId, [postUrl], tier, {
      resultsLimit: 500,
      includeReplies: true,
      priority: 10,
    });
    const commentsResult = await waitForJobCompletion(commentsJob.id);
    comments = (commentsResult?.data || []) as InstagramComment[];
  } else {
    // Parse comments from post result if available
    comments = (postResult.data[0] as { comments?: InstagramComment[] }).comments || [];
  }

  return { post, comments };
}

// ============================================================================
// Hashtag Scraping
// ============================================================================

/**
 * Scrape hashtag data
 */
export async function scrapeHashtag(
  workspaceId: string,
  hashtags: string | string[],
  tier: TierType,
  options: HashtagScrapeOptions = {}
): Promise<ScrapingJob> {
  const hashtagArray = Array.isArray(hashtags)
    ? hashtags.map(h => h.replace(/^#/, '')) // Remove # if present
    : [hashtags.replace(/^#/, '')];

  const input: InstagramHashtagInput = {
    hashtags: hashtagArray,
    resultsLimit: options.resultsLimit ?? 100,
    tab: options.tab ?? 'top',
    includePosts: true,
    postsLimit: options.resultsLimit ?? 50,
  };

  return queueJob(workspaceId, ACTOR_IDS.INSTAGRAM_HASHTAG_SCRAPER, input, {
    tier,
    priority: options.priority ?? 0,
    skipCache: options.skipCache,
  });
}

/**
 * Analyze hashtag performance and trends
 */
export async function analyzeHashtag(
  workspaceId: string,
  hashtag: string,
  tier: TierType
): Promise<{
  hashtag: InstagramHashtagData;
  topPerformingPosts: InstagramPost[];
  avgEngagement: number;
  postingVelocity: number; // posts per day
  relatedHashtags: string[];
}> {
  const job = await scrapeHashtag(workspaceId, hashtag, tier, {
    resultsLimit: 100,
    tab: 'top',
    priority: 10,
  });

  const result = await waitForJobCompletion(job.id);

  if (!result || result.itemCount === 0) {
    throw new Error(`Failed to analyze hashtag #${hashtag}`);
  }

  const hashtagData = result.data[0] as InstagramHashtagData;
  const posts = hashtagData.topPosts || [];

  // Calculate metrics
  const avgEngagement = posts.length > 0
    ? posts.reduce((sum, p) => sum + (p.likesCount + p.commentsCount), 0) / posts.length
    : 0;

  // Extract related hashtags
  const hashtagCounts: Record<string, number> = {};
  posts.forEach(post => {
    post.hashtags?.forEach(tag => {
      if (tag.toLowerCase() !== hashtag.toLowerCase()) {
        hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
      }
    });
  });

  const relatedHashtags = Object.entries(hashtagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([tag]) => tag);

  // Estimate posting velocity (posts per day over last 100 posts)
  const postingVelocity = posts.length > 1
    ? posts.length / 7 // Assuming top posts are roughly a week's worth
    : 0;

  return {
    hashtag: hashtagData,
    topPerformingPosts: posts.slice(0, 10),
    avgEngagement,
    postingVelocity,
    relatedHashtags,
  };
}

// ============================================================================
// Comments Scraping
// ============================================================================

/**
 * Scrape comments from posts
 */
export async function scrapeComments(
  workspaceId: string,
  postUrls: string[],
  tier: TierType,
  options: CommentsScrapeOptions = {}
): Promise<ScrapingJob> {
  const input: InstagramCommentsInput = {
    postUrls,
    resultsLimit: options.resultsLimit ?? 100,
    includeReplies: options.includeReplies ?? true,
    repliesLimit: options.repliesLimit ?? 10,
    sort: options.sort ?? 'top',
  };

  return queueJob(workspaceId, ACTOR_IDS.INSTAGRAM_COMMENT_SCRAPER, input, {
    tier,
    priority: options.priority ?? 0,
    skipCache: options.skipCache,
  });
}

/**
 * Analyze sentiment of comments
 */
export async function analyzeCommentsSentiment(
  workspaceId: string,
  postUrl: string,
  tier: TierType
): Promise<{
  comments: InstagramComment[];
  sentimentBreakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
  topKeywords: string[];
}> {
  const job = await scrapeComments(workspaceId, [postUrl], tier, {
    resultsLimit: 500,
    includeReplies: true,
    priority: 10,
  });

  const result = await waitForJobCompletion(job.id);
  const comments = (result?.data || []) as InstagramComment[];

  // Simple sentiment analysis (would use NLP service in production)
  const sentimentBreakdown = {
    positive: 0,
    negative: 0,
    neutral: 0,
  };

  const keywordCounts: Record<string, number> = {};
  const positiveWords = ['love', 'amazing', 'great', 'awesome', 'beautiful', 'perfect', 'best', 'good', 'nice', 'happy'];
  const negativeWords = ['hate', 'terrible', 'bad', 'awful', 'worst', 'ugly', 'sad', 'angry', 'disappointed'];

  comments.forEach(comment => {
    const text = comment.text.toLowerCase();
    
    // Simple keyword-based sentiment
    const hasPositive = positiveWords.some(w => text.includes(w));
    const hasNegative = negativeWords.some(w => text.includes(w));

    if (hasPositive && !hasNegative) {
      sentimentBreakdown.positive++;
      comment.sentiment = 'positive';
    } else if (hasNegative && !hasPositive) {
      sentimentBreakdown.negative++;
      comment.sentiment = 'negative';
    } else {
      sentimentBreakdown.neutral++;
      comment.sentiment = 'neutral';
    }

    // Extract keywords (simple word frequency)
    const words = text
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !['this', 'that', 'with', 'from', 'have', 'they'].includes(w));
    
    words.forEach(word => {
      keywordCounts[word] = (keywordCounts[word] || 0) + 1;
    });
  });

  const topKeywords = Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);

  return {
    comments,
    sentimentBreakdown,
    topKeywords,
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
  timeoutMs: number = 300000 // 5 minutes
): Promise<ScrapingResult | null> {
  const startTime = Date.now();
  const pollInterval = 2000; // 2 seconds

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

    // Also listen for events
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
function calculateProfileAnalytics(profile: InstagramProfile): ProfileAnalytics {
  const posts = profile.posts || [];
  
  const totalLikes = posts.reduce((sum, p) => sum + p.likesCount, 0);
  const totalComments = posts.reduce((sum, p) => sum + p.commentsCount, 0);
  const avgLikes = posts.length > 0 ? totalLikes / posts.length : 0;
  const avgComments = posts.length > 0 ? totalComments / posts.length : 0;

  // Calculate engagement rate: (avg likes + avg comments) / followers
  const avgEngagementRate = profile.followersCount > 0
    ? ((avgLikes + avgComments) / profile.followersCount) * 100
    : 0;

  // Extract all hashtags from posts
  const allHashtags: string[] = [];
  posts.forEach(post => {
    allHashtags.push(...(post.hashtags || []));
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

  // Calculate posting frequency (posts per week)
  let postingFrequency = 0;
  if (posts.length >= 2) {
    const timestamps = posts
      .map(p => new Date(p.timestamp).getTime())
      .sort((a, b) => b - a);
    const timeSpan = timestamps[0] - timestamps[timestamps.length - 1];
    const weeks = timeSpan / (7 * 24 * 60 * 60 * 1000);
    postingFrequency = weeks > 0 ? posts.length / weeks : posts.length;
  }

  // Analyze posting times
  const hourCounts: Record<number, number> = {};
  posts.forEach(post => {
    const hour = new Date(post.timestamp).getUTCHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  const bestPostingTimes = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => `${hour}:00 UTC`);

  return {
    username: profile.username,
    followersCount: profile.followersCount,
    followingCount: profile.followsCount,
    mediaCount: profile.mediaCount,
    avgLikes,
    avgComments,
    avgEngagementRate,
    postingFrequency,
    topHashtags,
    bestPostingTimes,
  };
}

// ============================================================================
// Batch Operations
// ============================================================================

/**
 * Compare multiple profiles
 */
export async function compareProfiles(
  workspaceId: string,
  usernames: string[],
  tier: TierType
): Promise<{
  profiles: InstagramProfile[];
  analytics: ProfileAnalytics[];
  comparison: {
    mostFollowers: string;
    highestEngagement: string;
    mostActive: string;
    bestHashtags: string[];
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

  const profiles: InstagramProfile[] = [];
  const analytics: ProfileAnalytics[] = [];

  results.forEach((result, index) => {
    if (result && result.itemCount > 0) {
      const profile = result.data[0] as InstagramProfile;
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

  const mostActive = analytics.reduce((max, a) =>
    a.postingFrequency > max.postingFrequency ? a : max
  , analytics[0]);

  // Aggregate top hashtags across all profiles
  const allHashtags = analytics.flatMap(a => a.topHashtags);
  const hashtagCounts: Record<string, number> = {};
  allHashtags.forEach(tag => {
    hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
  });
  const bestHashtags = Object.entries(hashtagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag);

  return {
    profiles,
    analytics,
    comparison: {
      mostFollowers: mostFollowers?.username || '',
      highestEngagement: highestEngagement?.username || '',
      mostActive: mostActive?.username || '',
      bestHashtags,
    },
  };
}

/**
 * Track hashtag trends over time
 */
export async function trackHashtagTrend(
  workspaceId: string,
  hashtag: string,
  tier: TierType,
  samples: number = 3
): Promise<{
  hashtag: string;
  samples: Array<{
    timestamp: string;
    postCount: number;
    topPosts: InstagramPost[];
  }>;
  trend: 'increasing' | 'decreasing' | 'stable';
}> {
  const results: Array<{
    timestamp: string;
    postCount: number;
    topPosts: InstagramPost[];
  }> = [];

  // Take multiple samples
  for (let i = 0; i < samples; i++) {
    const analysis = await analyzeHashtag(workspaceId, hashtag, tier);
    results.push({
      timestamp: new Date().toISOString(),
      postCount: analysis.hashtag.mediaCount,
      topPosts: analysis.topPerformingPosts,
    });

    // Wait between samples
    if (i < samples - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Calculate trend
  const velocities = results.map(r => r.postCount);
  const avgVelocity = velocities.length > 1
    ? (velocities[velocities.length - 1] - velocities[0]) / velocities.length
    : 0;

  const trend = avgVelocity > 100 ? 'increasing' : avgVelocity < -100 ? 'decreasing' : 'stable';

  return {
    hashtag,
    samples: results,
    trend,
  };
}
