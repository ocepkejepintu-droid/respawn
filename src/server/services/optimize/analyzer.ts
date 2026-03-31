/**
 * Content Performance Analyzer
 * Analyzes historical content performance to identify patterns and insights
 */

import {
  ContentPerformance,
  ContentType,
  PlatformType,
  DayOfWeek,
  ContentTypeAnalysis,
  PostingTimeHeatmap,
  CaptionAnalysis,
  HashtagAnalysis,
  EngagementVelocity,
  PerformanceAnalysis,
  AnalyzePerformanceInput,
} from '@/types/optimize';

// ============================================================================
// Mock Data Generator (Replace with actual database queries)
// ============================================================================

const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const CONTENT_TYPES: ContentType[] = ['reel', 'carousel', 'single_image', 'story', 'video'];

function generateMockPerformanceData(
  workspaceId: string,
  days: number = 90
): ContentPerformance[] {
  const posts: ContentPerformance[] = [];
  const now = new Date();
  
  for (let i = 0; i < 150; i++) {
    const postedAt = new Date(now.getTime() - Math.random() * days * 24 * 60 * 60 * 1000);
    const contentType = CONTENT_TYPES[Math.floor(Math.random() * CONTENT_TYPES.length)];
    const platform: PlatformType = Math.random() > 0.3 ? 'instagram' : 'tiktok';
    const dayOfWeek = DAYS[postedAt.getDay() === 0 ? 6 : postedAt.getDay() - 1];
    const hourOfDay = postedAt.getHours();
    
    // Simulate engagement patterns
    const baseEngagement = Math.random() * 0.05 + 0.01;
    const contentTypeMultiplier = {
      reel: 1.5,
      carousel: 1.3,
      single_image: 1.0,
      story: 0.6,
      video: 1.4,
    }[contentType];
    
    const timeMultiplier = getTimeMultiplier(dayOfWeek, hourOfDay);
    const followerCount = 10000 + Math.floor(Math.random() * 50000);
    const engagementRate = baseEngagement * contentTypeMultiplier * timeMultiplier;
    const likes = Math.floor(followerCount * engagementRate * (0.7 + Math.random() * 0.3));
    const comments = Math.floor(likes * (0.05 + Math.random() * 0.1));
    const shares = Math.floor(likes * (0.02 + Math.random() * 0.08));
    const saves = contentType === 'carousel' ? Math.floor(likes * 0.3) : Math.floor(likes * 0.1);
    const views = contentType === 'reel' || contentType === 'video' 
      ? Math.floor(likes * (5 + Math.random() * 10))
      : likes;
    
    const hashtagCount = Math.floor(Math.random() * 25) + 5;
    const captionLength = Math.floor(Math.random() * 500) + 50;
    
    posts.push({
      id: `post_${i}`,
      contentType,
      platform,
      postedAt,
      dayOfWeek,
      hourOfDay,
      caption: generateMockCaption(captionLength),
      hashtags: generateMockHashtags(hashtagCount),
      mediaUrls: [`https://example.com/media/${i}.jpg`],
      likes,
      comments,
      shares,
      saves,
      views,
      engagementRate,
      reach: Math.floor(likes * (3 + Math.random() * 4)),
      impressions: Math.floor(likes * (5 + Math.random() * 8)),
      followerCountAtPost: followerCount,
      firstHourEngagement: Math.floor(likes * (0.3 + Math.random() * 0.2)),
      captionLength,
      hashtagCount,
      hasTextOverlay: Math.random() > 0.5,
      dominantColors: ['#FF5733', '#33FF57', '#3357FF'],
      hasFaces: Math.random() > 0.6,
    });
  }
  
  return posts.sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime());
}

function getTimeMultiplier(day: DayOfWeek, hour: number): number {
  // Best times: Tuesday-Thursday, 6-9 PM
  const dayMultiplier: Record<DayOfWeek, number> = {
    monday: 0.9,
    tuesday: 1.2,
    wednesday: 1.25,
    thursday: 1.2,
    friday: 1.0,
    saturday: 0.85,
    sunday: 0.9,
  };
  
  const hourMultiplier = hour >= 18 && hour <= 21 ? 1.3 :
    hour >= 12 && hour <= 14 ? 1.15 :
    hour >= 6 && hour <= 9 ? 0.7 :
    hour >= 0 && hour <= 5 ? 0.5 :
    1.0;
  
  return dayMultiplier[day] * hourMultiplier;
}

function generateMockCaption(length: number): string {
  const words = ['amazing', 'love', 'new', 'post', 'check', 'out', 'this', 'awesome', 'content', 
    'follow', 'for', 'more', 'daily', 'inspiration', 'creative', 'journey', 'behind', 'scenes',
    'exclusive', 'sneak', 'peek', 'tutorial', 'tips', 'tricks', 'guide'];
  let caption = '';
  while (caption.length < length) {
    caption += words[Math.floor(Math.random() * words.length)] + ' ';
  }
  return caption.substring(0, length);
}

function generateMockHashtags(count: number): string[] {
  const allHashtags = ['love', 'instagood', 'fashion', 'photooftheday', 'art', 'photography',
    'instagram', 'beautiful', 'nature', 'picoftheday', 'travel', 'happy', 'style', 'cute',
    'summer', 'beauty', 'photo', 'selfie', 'friends', 'smile', 'family', 'life', 'music',
    'ootd', 'makeup', 'follow', 'like4like', 'instadaily', 'igers', 'instalike'];
  return allHashtags.slice(0, Math.min(count, allHashtags.length));
}

// ============================================================================
// Analysis Functions
// ============================================================================

export async function analyzePerformance(
  input: AnalyzePerformanceInput
): Promise<PerformanceAnalysis> {
  const { workspaceId, startDate, endDate, platform } = input;
  
  // Fetch posts (mock data for now)
  const allPosts = generateMockPerformanceData(workspaceId);
  
  // Filter posts
  const posts = allPosts.filter(post => {
    if (platform && post.platform !== platform) return false;
    if (startDate && post.postedAt < startDate) return false;
    if (endDate && post.postedAt > endDate) return false;
    return true;
  });
  
  const contentTypePerformance = analyzeContentTypes(posts);
  const postingTimeHeatmap = generatePostingTimeHeatmap(posts);
  const captionAnalysis = analyzeCaptionLengths(posts);
  const hashtagAnalysis = analyzeHashtagCounts(posts);
  
  // Sort posts by engagement rate
  const sortedByEngagement = [...posts].sort((a, b) => b.engagementRate - a.engagementRate);
  
  // Find optimal values
  const bestContentType = contentTypePerformance.reduce((best, current) => 
    current.performanceScore > best.performanceScore ? current : best
  );
  
  const bestTimeSlot = postingTimeHeatmap.reduce((best, current) => 
    current.score > best.score ? current : best
  );
  
  const optimalCaptionRange = captionAnalysis.find(c => c.recommendation === 'optimal');
  const optimalHashtagRange = hashtagAnalysis.find(h => h.recommendation === 'optimal');
  
  return {
    workspaceId,
    analyzedAt: new Date(),
    dateRange: {
      start: startDate || posts[posts.length - 1]?.postedAt || new Date(),
      end: endDate || new Date(),
    },
    contentTypePerformance,
    postingTimeHeatmap,
    captionAnalysis,
    hashtagAnalysis,
    topPerformingPosts: sortedByEngagement.slice(0, 10),
    underperformingPosts: sortedByEngagement.slice(-10).reverse(),
    patterns: {
      bestContentType: bestContentType.contentType,
      bestPostingDay: bestTimeSlot.day,
      bestPostingHour: bestTimeSlot.hour,
      optimalCaptionLength: optimalCaptionRange 
        ? Math.floor((optimalCaptionRange.minLength + optimalCaptionRange.maxLength) / 2)
        : 200,
      optimalHashtagCount: optimalHashtagRange
        ? Math.floor((optimalHashtagRange.minCount + optimalHashtagRange.maxCount) / 2)
        : 20,
    },
  };
}

function analyzeContentTypes(posts: ContentPerformance[]): ContentTypeAnalysis[] {
  const grouped = groupBy(posts, 'contentType');
  
  return Object.entries(grouped).map(([contentType, typePosts]) => {
    const avgEngagement = calculateAverage(typePosts, 'engagementRate');
    const avgReach = calculateAverage(typePosts, 'reach');
    const avgSaves = calculateAverage(typePosts, 'saves');
    const avgShares = calculateAverage(typePosts, 'shares');
    
    // Calculate trend (compare recent 30 days to previous 30 days)
    const now = new Date();
    const recentPosts = typePosts.filter(p => 
      p.postedAt > new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    );
    const previousPosts = typePosts.filter(p => {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      return p.postedAt > sixtyDaysAgo && p.postedAt <= thirtyDaysAgo;
    });
    
    const recentAvg = recentPosts.length > 0 
      ? calculateAverage(recentPosts, 'engagementRate')
      : avgEngagement;
    const previousAvg = previousPosts.length > 0
      ? calculateAverage(previousPosts, 'engagementRate')
      : avgEngagement;
    
    const trendPercent = previousAvg > 0 
      ? ((recentAvg - previousAvg) / previousAvg) * 100 
      : 0;
    
    return {
      contentType: contentType as ContentType,
      totalPosts: typePosts.length,
      avgEngagementRate: avgEngagement,
      avgReach,
      avgSaves,
      avgShares,
      performanceScore: Math.min(100, avgEngagement * 2000),
      trend: trendPercent > 5 ? 'up' : trendPercent < -5 ? 'down' : 'stable',
      trendPercent: Math.abs(trendPercent),
    };
  }).sort((a, b) => b.performanceScore - a.performanceScore);
}

function generatePostingTimeHeatmap(posts: ContentPerformance[]): PostingTimeHeatmap[] {
  const heatmap: PostingTimeHeatmap[] = [];
  
  for (const day of DAYS) {
    for (let hour = 0; hour < 24; hour++) {
      const slotPosts = posts.filter(p => p.dayOfWeek === day && p.hourOfDay === hour);
      
      if (slotPosts.length === 0) {
        heatmap.push({
          day,
          hour,
          avgEngagementRate: 0,
          totalPosts: 0,
          score: 0,
        });
        continue;
      }
      
      const avgEngagement = calculateAverage(slotPosts, 'engagementRate');
      const score = Math.min(100, avgEngagement * 1500 + slotPosts.length * 2);
      
      heatmap.push({
        day,
        hour,
        avgEngagementRate: avgEngagement,
        totalPosts: slotPosts.length,
        score,
      });
    }
  }
  
  return heatmap;
}

function analyzeCaptionLengths(posts: ContentPerformance[]): CaptionAnalysis[] {
  const ranges = [
    { min: 0, max: 50, label: '0-50 chars' },
    { min: 50, max: 150, label: '50-150 chars' },
    { min: 150, max: 300, label: '150-300 chars' },
    { min: 300, max: 500, label: '300-500 chars' },
    { min: 500, max: 1000, label: '500-1000 chars' },
    { min: 1000, max: 3000, label: '1000+ chars' },
  ];
  
  return ranges.map(range => {
    const rangePosts = posts.filter(p => 
      p.captionLength >= range.min && p.captionLength < range.max
    );
    
    const avgEngagement = rangePosts.length > 0
      ? calculateAverage(rangePosts, 'engagementRate')
      : 0;
    
    // 150-300 characters is considered optimal
    const isOptimal = range.min >= 150 && range.max <= 300;
    const isGood = (range.min >= 50 && range.max <= 500) && !isOptimal;
    
    return {
      lengthRange: range.label,
      minLength: range.min,
      maxLength: range.max,
      avgEngagementRate: avgEngagement,
      totalPosts: rangePosts.length,
      recommendation: isOptimal ? 'optimal' : isGood ? 'good' : range.max < 150 ? 'too_short' : 'too_long',
    };
  });
}

function analyzeHashtagCounts(posts: ContentPerformance[]): HashtagAnalysis[] {
  const ranges = [
    { min: 0, max: 5, label: '0-5 hashtags' },
    { min: 5, max: 10, label: '5-10 hashtags' },
    { min: 10, max: 20, label: '10-20 hashtags' },
    { min: 20, max: 30, label: '20-30 hashtags' },
    { min: 30, max: 50, label: '30-50 hashtags' },
  ];
  
  return ranges.map(range => {
    const rangePosts = posts.filter(p => 
      p.hashtagCount >= range.min && p.hashtagCount < range.max
    );
    
    const avgReach = rangePosts.length > 0
      ? calculateAverage(rangePosts, 'reach')
      : 0;
    const avgEngagement = rangePosts.length > 0
      ? calculateAverage(rangePosts, 'engagementRate')
      : 0;
    
    // 20-30 hashtags is considered optimal
    const isOptimal = range.min >= 20 && range.max <= 30;
    const isGood = (range.min >= 10 && range.max <= 30) && !isOptimal;
    
    return {
      countRange: range.label,
      minCount: range.min,
      maxCount: range.max,
      avgReach,
      avgEngagementRate: avgEngagement,
      totalPosts: rangePosts.length,
      recommendation: isOptimal ? 'optimal' : isGood ? 'good' : range.max < 20 ? 'too_few' : 'too_many',
    };
  });
}

export async function analyzeEngagementVelocity(
  posts: ContentPerformance[]
): Promise<EngagementVelocity[]> {
  return posts.map(post => {
    const totalEngagement = post.likes + post.comments + post.saves + post.shares;
    const velocityScore = post.firstHourEngagement / (totalEngagement || 1);
    
    return {
      postId: post.id,
      firstHourLikes: Math.floor(post.firstHourEngagement * 0.7),
      firstHourComments: Math.floor(post.firstHourEngagement * 0.15),
      firstHourSaves: Math.floor(post.firstHourEngagement * 0.1),
      firstHourShares: Math.floor(post.firstHourEngagement * 0.05),
      totalEngagement,
      velocityScore,
    };
  }).sort((a, b) => b.velocityScore - a.velocityScore);
}

// ============================================================================
// Helper Functions
// ============================================================================

function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    result[groupKey] = result[groupKey] || [];
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

function calculateAverage<T>(array: T[], key: keyof T): number {
  if (array.length === 0) return 0;
  const sum = array.reduce((acc, item) => acc + Number(item[key] || 0), 0);
  return sum / array.length;
}

// ============================================================================
// Export Additional Analysis Functions
// ============================================================================

export async function getTopPerformingPosts(
  workspaceId: string,
  limit: number = 10,
  contentType?: ContentType
): Promise<ContentPerformance[]> {
  const posts = generateMockPerformanceData(workspaceId);
  let filtered = posts;
  
  if (contentType) {
    filtered = posts.filter(p => p.contentType === contentType);
  }
  
  return filtered
    .sort((a, b) => b.engagementRate - a.engagementRate)
    .slice(0, limit);
}

export async function getEngagementTrends(
  workspaceId: string,
  days: number = 30
): Promise<{ date: Date; engagementRate: number; postCount: number }[]> {
  const posts = generateMockPerformanceData(workspaceId, days);
  const dailyStats: Record<string, { totalEngagement: number; count: number }> = {};
  
  posts.forEach(post => {
    const dateKey = post.postedAt.toISOString().split('T')[0];
    if (!dailyStats[dateKey]) {
      dailyStats[dateKey] = { totalEngagement: 0, count: 0 };
    }
    dailyStats[dateKey].totalEngagement += post.engagementRate;
    dailyStats[dateKey].count += 1;
  });
  
  return Object.entries(dailyStats)
    .map(([date, stats]) => ({
      date: new Date(date),
      engagementRate: stats.totalEngagement / stats.count,
      postCount: stats.count,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export async function compareContentTypes(
  workspaceId: string
): Promise<ContentTypeAnalysis[]> {
  const posts = generateMockPerformanceData(workspaceId);
  return analyzeContentTypes(posts);
}
