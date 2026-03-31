/**
 * Mock Data Generator for Competitor Analysis
 * Creates realistic demo data for the competitor analysis module
 */

import type {
  Competitor,
  CompetitorPost,
  CompetitorMetrics,
  Platform,
  ContentType,
  MonitoringFrequency,
} from '@/types/competitor';

// ============================================================================
// MOCK COMPETITORS
// ============================================================================

export const MOCK_COMPETITORS: Competitor[] = [
  {
    id: 'comp_1',
    workspaceId: 'ws_1',
    username: 'fashionforward',
    displayName: 'Fashion Forward',
    platform: 'instagram',
    profileUrl: 'https://instagram.com/fashionforward',
    profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
    bio: 'Daily fashion inspiration ✨ | Style tips & trends | DM for collabs',
    followers: 245000,
    following: 850,
    postsCount: 1247,
    niche: 'Fashion',
    tags: ['fashion', 'style', 'lifestyle'],
    monitoringFrequency: 'daily',
    isActive: true,
    lastSyncedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
  },
  {
    id: 'comp_2',
    workspaceId: 'ws_1',
    username: 'techtalkdaily',
    displayName: 'Tech Talk Daily',
    platform: 'instagram',
    profileUrl: 'https://instagram.com/techtalkdaily',
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    bio: 'Your daily dose of tech 📱 | Reviews & news | Subscribe to our newsletter',
    followers: 189000,
    following: 450,
    postsCount: 892,
    niche: 'Technology',
    tags: ['tech', 'gadgets', 'reviews'],
    monitoringFrequency: 'daily',
    isActive: true,
    lastSyncedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date(),
  },
  {
    id: 'comp_3',
    workspaceId: 'ws_1',
    username: 'fitwithsarah',
    displayName: 'Sarah | Fitness Coach',
    platform: 'instagram',
    profileUrl: 'https://instagram.com/fitwithsarah',
    profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
    bio: 'Certified PT 💪 | Home workouts | Meal plans | Transform your body',
    followers: 423000,
    following: 520,
    postsCount: 2156,
    niche: 'Fitness',
    tags: ['fitness', 'health', 'wellness'],
    monitoringFrequency: 'daily',
    isActive: true,
    lastSyncedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date(),
  },
  {
    id: 'comp_4',
    workspaceId: 'ws_1',
    username: 'foodieadventures',
    displayName: 'Foodie Adventures',
    platform: 'instagram',
    profileUrl: 'https://instagram.com/foodieadventures',
    profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
    bio: '🍕 Food lover | 📍 NYC | Restaurant reviews & recipes',
    followers: 156000,
    following: 1200,
    postsCount: 567,
    niche: 'Food',
    tags: ['food', 'restaurants', 'recipes'],
    monitoringFrequency: 'weekly',
    isActive: true,
    lastSyncedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date(),
  },
  {
    id: 'comp_5',
    workspaceId: 'ws_1',
    username: 'travelwithalex',
    displayName: 'Alex | Travel Blogger',
    platform: 'tiktok',
    profileUrl: 'https://tiktok.com/@travelwithalex',
    profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
    bio: 'Exploring the world 🌍 | Travel tips | Hidden gems | Subscribe for more!',
    followers: 678000,
    following: 200,
    postsCount: 445,
    niche: 'Travel',
    tags: ['travel', 'adventure', 'photography'],
    monitoringFrequency: 'daily',
    isActive: true,
    lastSyncedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date(),
  },
];

// ============================================================================
// MOCK POSTS GENERATOR
// ============================================================================

const CAPTION_TEMPLATES: Record<ContentType, string[]> = {
  post: [
    'Loving this look today! 💫 What do you think? Comment below! 👇 #style #fashion',
    'Morning routine essentials ☕✨ Save this for later! #morningroutine #selfcare',
    'Which one would you choose? 1, 2, or 3? 🤔 Let me know in the comments!',
    'Quick tip: Always remember to... 💡 Double tap if you found this helpful! ❤️',
    'Throwback to this amazing moment! 🎉 Follow for more content like this!',
  ],
  reel: [
    'POV: You finally found the perfect... 😍 Watch till the end! #trending #viral',
    'This changed everything for me 🔥 Save this reel! #tips #hacks',
    'Wait for it... 😱 You won\'t believe what happens next!',
    'Day in my life ✨ Follow along for more! #dailyvlog #lifestyle',
    'Tutorial: How to get this look in 5 minutes ⏱️ Full details in caption!',
  ],
  carousel: [
    '5 tips to improve your... Swipe for all the details! 👉 #educational #tips',
    'Before & After transformation! 😱 Swipe to see the process ➡️',
    'Step by step guide ⬇️ Save this for later reference! #howto #guide',
    'Which style do you prefer? Vote in the comments! 1-4 👇',
    'Everything you need to know about... Full breakdown in slides! 📚',
  ],
  story: [
    'Quick poll: Yes or No? 👆',
    'Swipe up for more! 🔗',
    'Ask me anything! 💬',
  ],
  video: [
    'Full tutorial on my YouTube channel! Link in bio 🔗 #youtube #tutorial',
    'Extended version available now! Check it out 👆',
  ],
};

const HASHTAG_POOLS: Record<string, string[]> = {
  fashion: ['fashion', 'style', 'ootd', 'outfit', 'trendy', 'fashionista', 'lookbook', 'streetstyle'],
  tech: ['tech', 'technology', 'gadgets', 'innovation', 'startup', 'coding', 'ai', 'future'],
  fitness: ['fitness', 'workout', 'gym', 'health', 'wellness', 'motivation', 'fit', 'training'],
  food: ['food', 'foodie', 'delicious', 'yummy', 'recipe', 'cooking', 'instafood', 'foodporn'],
  travel: ['travel', 'wanderlust', 'adventure', 'explore', 'vacation', 'travelgram', 'nature', 'photography'],
};

function generateCaption(contentType: ContentType, niche: string): string {
  const templates = CAPTION_TEMPLATES[contentType];
  const baseCaption = templates[Math.floor(Math.random() * templates.length)];
  
  // Add hashtags
  const hashtags = HASHTAG_POOLS[niche.toLowerCase()] || HASHTAG_POOLS.fashion;
  const selectedHashtags = hashtags
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.floor(Math.random() * 5) + 3);
  
  return `${baseCaption}\n\n${selectedHashtags.map((h) => `#${h}`).join(' ')}`;
}

function generateMockPosts(
  competitorId: string,
  count: number = 30,
  niche: string = 'fashion'
): CompetitorPost[] {
  const posts: CompetitorPost[] = [];
  const contentTypes: ContentType[] = ['post', 'reel', 'carousel', 'video'];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const contentType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
    const caption = generateCaption(contentType, niche);
    const daysAgo = Math.floor(Math.random() * 90); // Last 90 days
    const postedAt = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
    
    // Engagement varies by content type
    const baseEngagement = {
      post: { likes: 2000, comments: 50, shares: 30, saves: 100 },
      reel: { likes: 5000, comments: 100, shares: 200, saves: 150 },
      carousel: { likes: 3500, comments: 80, shares: 100, saves: 500 },
      video: { likes: 4000, comments: 90, shares: 150, saves: 200 },
      story: { likes: 500, comments: 10, shares: 5, saves: 0 },
    };

    const base = baseEngagement[contentType];
    const variance = () => 0.5 + Math.random(); // 0.5x to 1.5x variance
    
    const likes = Math.floor(base.likes * variance());
    const comments = Math.floor(base.comments * variance());
    const shares = Math.floor(base.shares * variance());
    const saves = Math.floor(base.saves * variance());
    const views = contentType === 'reel' || contentType === 'video' 
      ? Math.floor(likes * (5 + Math.random() * 10)) 
      : undefined;

    // Calculate engagement rate based on a simulated follower count
    const followerCount = 200000 + Math.random() * 300000;
    const totalEngagement = likes + comments + shares + saves;
    const engagementRate = (totalEngagement / followerCount) * 100;

    posts.push({
      id: `post_${competitorId}_${i}`,
      competitorId,
      externalId: `ext_${Date.now()}_${i}`,
      platform: 'instagram',
      contentType,
      caption,
      captionLength: caption.length,
      hashtags: caption.match(/#\w+/g)?.map((h) => h.slice(1)) || [],
      mentions: caption.match(/@\w+/g)?.map((m) => m.slice(1)) || [],
      mediaUrls: [`https://picsum.photos/400/400?random=${Date.now()}_${i}`],
      thumbnailUrl: `https://picsum.photos/400/400?random=${Date.now()}_${i}`,
      likes,
      comments,
      shares,
      saves,
      views,
      reach: Math.floor(totalEngagement * (3 + Math.random() * 5)),
      engagementRate,
      postedAt,
      scrapedAt: new Date(),
      url: `https://instagram.com/p/${Math.random().toString(36).substring(7)}`,
    });
  }

  return posts.sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime());
}

// ============================================================================
// MOCK METRICS GENERATOR
// ============================================================================

export function generateMockMetrics(
  competitorId: string,
  baseFollowers: number,
  days: number = 90
): CompetitorMetrics[] {
  const metrics: CompetitorMetrics[] = [];
  const now = new Date();
  let currentFollowers = baseFollowers - Math.floor(Math.random() * 5000); // Start slightly lower

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Simulate follower growth
    const dailyGrowth = Math.floor(Math.random() * 200) - 50; // -50 to +150 per day
    currentFollowers += dailyGrowth;

    // Simulate varying engagement
    const baseEngagement = 2.5 + Math.random() * 2; // 2.5% to 4.5%
    const postsInPeriod = Math.floor(Math.random() * 2) + (i % 7 === 0 ? 2 : 0); // More posts on weekends

    metrics.push({
      competitorId,
      date,
      followers: currentFollowers,
      following: 500 + Math.floor(Math.random() * 500),
      postsCount: 1000 + Math.floor((days - i) * 0.3),
      avgEngagementRate: baseEngagement,
      avgLikes: Math.floor(2000 + Math.random() * 1000),
      avgComments: Math.floor(50 + Math.random() * 50),
      avgShares: Math.floor(30 + Math.random() * 30),
      avgSaves: Math.floor(100 + Math.random() * 100),
      totalReach: Math.floor(currentFollowers * 0.1 * baseEngagement),
      postsInPeriod,
    });
  }

  return metrics;
}

// ============================================================================
// MOCK DATA ACCESS FUNCTIONS
// ============================================================================

export function getMockCompetitors(workspaceId: string): Competitor[] {
  return MOCK_COMPETITORS.filter((c) => c.workspaceId === workspaceId || workspaceId === 'ws_1');
}

export function getMockCompetitorById(id: string): Competitor | undefined {
  return MOCK_COMPETITORS.find((c) => c.id === id);
}

export function getMockPostsForCompetitor(competitorId: string): CompetitorPost[] {
  const competitor = getMockCompetitorById(competitorId);
  if (!competitor) return [];
  
  return generateMockPosts(
    competitorId,
    50,
    competitor.niche || 'fashion'
  );
}

export function getMockMetricsForCompetitor(competitorId: string): CompetitorMetrics[] {
  const competitor = getMockCompetitorById(competitorId);
  if (!competitor) return [];
  
  return generateMockMetrics(competitorId, competitor.followers);
}

// ============================================================================
// DEMO DATA EXPORT
// ============================================================================

export function generateDemoData() {
  const competitors = MOCK_COMPETITORS;
  const postsByCompetitor = new Map<string, CompetitorPost[]>();
  const metricsByCompetitor = new Map<string, CompetitorMetrics[]>();

  competitors.forEach((competitor) => {
    postsByCompetitor.set(competitor.id, getMockPostsForCompetitor(competitor.id));
    metricsByCompetitor.set(competitor.id, getMockMetricsForCompetitor(competitor.id));
  });

  return {
    competitors,
    postsByCompetitor,
    metricsByCompetitor,
  };
}
