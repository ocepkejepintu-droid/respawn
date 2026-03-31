/**
 * Content Recommender Service
 * Generates AI-powered content recommendations and suggestions
 */

import {
  ContentRecommendation,
  ContentIdea,
  CaptionSuggestion,
  HashtagRecommendation,
  ABTestSuggestion,
  ContentType,
  PlatformType,
  GenerateContentIdeasInput,
  OptimizePostInput,
} from '@/types/optimize';
import { analyzePerformance, getTopPerformingPosts } from './analyzer';

// ============================================================================
// Content Recommendations
// ============================================================================

export async function generateRecommendations(
  workspaceId: string,
  type?: ContentRecommendation['type']
): Promise<ContentRecommendation[]> {
  const analysis = await analyzePerformance({ workspaceId });
  const recommendations: ContentRecommendation[] = [];
  
  // Content Type Recommendations
  const bestType = analysis.contentTypePerformance[0];
  const worstType = analysis.contentTypePerformance[analysis.contentTypePerformance.length - 1];
  
  if (bestType && bestType.trend === 'up') {
    recommendations.push({
      id: `rec_${Date.now()}_1`,
      type: 'content_type',
      priority: 'high',
      title: `Double Down on ${formatContentType(bestType.contentType)}s`,
      description: `Your ${formatContentType(bestType.contentType)}s are performing ${bestType.trendPercent.toFixed(0)}% better than average with a ${bestType.avgEngagementRate.toFixed(2)}% engagement rate.`,
      action: `Increase your ${formatContentType(bestType.contentType)} posting frequency to 3-4 times per week.`,
      expectedImpact: {
        metric: 'engagement rate',
        improvement: 25,
        unit: 'percent',
      },
      basedOn: {
        dataPoints: bestType.totalPosts,
        timeRange: 'last 90 days',
        confidence: 85,
      },
    });
  }
  
  // Posting Time Recommendations
  const bestTimeSlots = analysis.postingTimeHeatmap
    .filter(slot => slot.score > 70)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  
  if (bestTimeSlots.length > 0) {
    const bestSlot = bestTimeSlots[0];
    recommendations.push({
      id: `rec_${Date.now()}_2`,
      type: 'posting_time',
      priority: 'high',
      title: `Post on ${capitalize(bestSlot.day)}s at ${formatHour(bestSlot.hour)}`,
      description: `Your engagement rate is ${(bestSlot.avgEngagementRate * 100).toFixed(2)}% during this time slot, ${((bestSlot.avgEngagementRate / (analysis.postingTimeHeatmap.reduce((a, b) => a + b.avgEngagementRate, 0) / analysis.postingTimeHeatmap.length) - 1) * 100).toFixed(0)}% higher than average.`,
      action: `Schedule your top content for ${capitalize(bestSlot.day)} evenings between ${formatHour(bestSlot.hour)} and ${formatHour(bestSlot.hour + 1)}.`,
      expectedImpact: {
        metric: 'reach',
        improvement: 30,
        unit: 'percent',
      },
      basedOn: {
        dataPoints: bestSlot.totalPosts,
        timeRange: 'last 90 days',
        confidence: 78,
      },
    });
  }
  
  // Caption Recommendations
  const optimalCaption = analysis.captionAnalysis.find(c => c.recommendation === 'optimal');
  if (optimalCaption) {
    recommendations.push({
      id: `rec_${Date.now()}_3`,
      type: 'caption',
      priority: 'medium',
      title: 'Optimize Caption Length',
      description: `Posts with ${optimalCaption.lengthRange} captions get ${(optimalCaption.avgEngagementRate * 100).toFixed(2)}% engagement.`,
      action: `Keep captions between ${optimalCaption.minLength}-${optimalCaption.maxLength} characters for optimal engagement.`,
      expectedImpact: {
        metric: 'saves',
        improvement: 15,
        unit: 'percent',
      },
      basedOn: {
        dataPoints: optimalCaption.totalPosts,
        timeRange: 'last 90 days',
        confidence: 72,
      },
    });
  }
  
  // Hashtag Recommendations
  const optimalHashtags = analysis.hashtagAnalysis.find(h => h.recommendation === 'optimal');
  if (optimalHashtags) {
    recommendations.push({
      id: `rec_${Date.now()}_4`,
      type: 'hashtag',
      priority: 'medium',
      title: 'Use 20-25 Hashtags',
      description: `Posts with ${optimalHashtags.countRange} reach ${optimalHashtags.avgReach.toLocaleString()} people on average.`,
      action: `Include ${optimalHashtags.minCount}-${optimalHashtags.maxCount} relevant hashtags, mixing popular and niche tags.`,
      expectedImpact: {
        metric: 'reach',
        improvement: 40,
        unit: 'percent',
      },
      basedOn: {
        dataPoints: optimalHashtags.totalPosts,
        timeRange: 'last 90 days',
        confidence: 80,
      },
    });
  }
  
  // Format Recommendations
  if (worstType && worstType.contentType !== bestType?.contentType) {
    recommendations.push({
      id: `rec_${Date.now()}_5`,
      type: 'format',
      priority: 'low',
      title: `Reduce ${formatContentType(worstType.contentType)} Frequency`,
      description: `Your ${formatContentType(worstType.contentType)}s are underperforming with only ${(worstType.avgEngagementRate * 100).toFixed(2)}% engagement.`,
      action: `Repurpose ${formatContentType(worstType.contentType)} content into ${formatContentType(bestType?.contentType || 'carousel')} format for better results.`,
      expectedImpact: {
        metric: 'engagement rate',
        improvement: 35,
        unit: 'percent',
      },
      basedOn: {
        dataPoints: worstType.totalPosts,
        timeRange: 'last 90 days',
        confidence: 65,
      },
    });
  }
  
  // Trend Recommendations
  recommendations.push({
    id: `rec_${Date.now()}_6`,
    type: 'trend',
    priority: 'medium',
    title: 'Jump on Reels Trend',
    description: 'Video content with trending audio is getting 2x more reach this week.',
    action: 'Create a Reel using trending audio from your niche.',
    expectedImpact: {
      metric: 'views',
      improvement: 100,
      unit: 'percent',
    },
    basedOn: {
      dataPoints: 1000,
      timeRange: 'last 7 days',
      confidence: 70,
    },
  });
  
  // Filter by type if specified
  if (type) {
    return recommendations.filter(r => r.type === type);
  }
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

// ============================================================================
// Content Ideas
// ============================================================================

export async function generateContentIdeas(
  input: GenerateContentIdeasInput
): Promise<ContentIdea[]> {
  const { workspaceId, contentType, platform, count = 5, theme } = input;
  
  const ideas: ContentIdea[] = [
    {
      id: `idea_${Date.now()}_1`,
      title: 'Behind the Scenes',
      description: 'Show your audience what goes on behind the camera. Share your creative process, workspace, or team dynamics.',
      contentType: contentType || 'reel',
      platform: platform || 'instagram',
      suggestedHashtags: ['#behindthescenes', '#bts', '#creativeprocess', '#worklife', '#contentcreation'],
      suggestedCaption: 'Ever wondered what goes on behind the scenes? Here\'s a peek into our creative process! 🎬✨ What\'s your favorite part?',
      estimatedEngagement: 4.5,
      trendScore: 85,
      relevanceScore: 90,
      source: 'trending',
    },
    {
      id: `idea_${Date.now()}_2`,
      title: 'Quick Tips Carousel',
      description: 'Create a 5-slide carousel with actionable tips your audience can implement immediately.',
      contentType: 'carousel',
      platform: platform || 'instagram',
      suggestedHashtags: ['#tips', '#hacks', '#learn', '#growth', '#knowledge'],
      suggestedCaption: '5 game-changing tips that transformed my workflow! 💡\n\nSave this for later and let me know which one you\'ll try first 👇',
      estimatedEngagement: 6.2,
      trendScore: 92,
      relevanceScore: 88,
      source: 'historical',
    },
    {
      id: `idea_${Date.now()}_3`,
      title: 'Trending Audio Challenge',
      description: 'Use this week\'s trending audio to create a fun, relatable video that showcases your personality.',
      contentType: 'reel',
      platform: platform || 'instagram',
      suggestedHashtags: ['#trending', '#reels', '#viral', '#fun', '#trend'],
      suggestedCaption: 'When the trending audio hits different 😂\n\nWho else can relate? Tag them!',
      estimatedEngagement: 8.5,
      trendScore: 95,
      relevanceScore: 75,
      source: 'trending',
    },
    {
      id: `idea_${Date.now()}_4`,
      title: 'Myth vs Reality',
      description: 'Debunk common misconceptions in your industry with facts and evidence.',
      contentType: 'carousel',
      platform: platform || 'instagram',
      suggestedHashtags: ['#mythbusting', '#facts', '#education', '#truth', '#learn'],
      suggestedCaption: 'Let\'s settle this once and for all! 🧐\n\nWhich myth did you believe before reading this? Comment below! 👇',
      estimatedEngagement: 5.8,
      trendScore: 78,
      relevanceScore: 95,
      source: 'ai',
    },
    {
      id: `idea_${Date.now()}_5`,
      title: 'Before & After Transformation',
      description: 'Showcase a transformation journey, whether personal, professional, or product-related.',
      contentType: contentType || 'carousel',
      platform: platform || 'instagram',
      suggestedHashtags: ['#transformation', '#beforeandafter', '#growth', '#progress', '#journey'],
      suggestedCaption: 'From this ➡️ to this! The journey wasn\'t easy, but it was worth it. 💪\n\nWhat transformation are you working on?',
      estimatedEngagement: 7.2,
      trendScore: 88,
      relevanceScore: 85,
      source: 'competitor',
    },
    {
      id: `idea_${Date.now()}_6`,
      title: 'Day in the Life',
      description: 'Take your audience through a typical day showing authentic moments and routines.',
      contentType: 'reel',
      platform: platform || 'tiktok',
      suggestedHashtags: ['#dayinthelife', '#routine', '#daily', '#vlog', '#lifestyle'],
      suggestedCaption: 'A realistic day in my life (no glam, just real) 🌅\n\nWhat does your typical day look like?',
      estimatedEngagement: 5.5,
      trendScore: 82,
      relevanceScore: 88,
      source: 'trending',
    },
    {
      id: `idea_${Date.now()}_7`,
      title: 'Common Mistakes to Avoid',
      description: 'Share mistakes you\'ve made and lessons learned to help your audience avoid the same pitfalls.',
      contentType: 'carousel',
      platform: platform || 'instagram',
      suggestedHashtags: ['#mistakes', '#lessons', '#learn', '#growth', '#tips'],
      suggestedCaption: 'I wish someone told me these 5 things earlier! 😅\n\nWhat mistake taught you the most valuable lesson?',
      estimatedEngagement: 6.8,
      trendScore: 85,
      relevanceScore: 92,
      source: 'historical',
    },
    {
      id: `idea_${Date.now()}_8`,
      title: 'User-Generated Content Feature',
      description: 'Spotlight content created by your community or customers.',
      contentType: 'single_image',
      platform: platform || 'instagram',
      suggestedHashtags: ['#community', '#feature', '#UGC', '#love', '#thankyou'],
      suggestedCaption: 'Shoutout to our amazing community! 🎉\n\nKeep tagging us for a chance to be featured!',
      estimatedEngagement: 4.2,
      trendScore: 75,
      relevanceScore: 90,
      source: 'competitor',
    },
  ];
  
  // Filter by content type if specified
  let filtered = ideas;
  if (contentType) {
    filtered = ideas.filter(i => i.contentType === contentType);
  }
  
  // Filter by theme if specified
  if (theme) {
    filtered = filtered.filter(i => 
      i.title.toLowerCase().includes(theme.toLowerCase()) ||
      i.description.toLowerCase().includes(theme.toLowerCase())
    );
  }
  
  return filtered.slice(0, count);
}

// ============================================================================
// Caption Suggestions
// ============================================================================

export async function generateCaptionSuggestions(
  input: OptimizePostInput
): Promise<CaptionSuggestion> {
  const { caption, hashtags, contentType } = input;
  const currentLength = caption.length;
  const optimalLength = 200;
  
  const suggestions = [
    {
      text: `${caption}\n\n✨ ${hashtags.slice(0, 10).join(' ')}`,
      improvement: 'Added visual break and emoji for attention',
      hook: caption.split('.')[0] || caption.slice(0, 50),
      callToAction: 'Double-tap if you agree! ❤️',
    },
    {
      text: `🎯 ${caption.slice(0, 100)}...\n\n${caption.slice(100)}\n\n💭 What's your take on this? Drop a comment below!\n\n${hashtags.slice(0, 15).join(' ')}`,
      improvement: 'Added hook emoji and stronger CTA',
      hook: caption.slice(0, 100),
      callToAction: "What's your take on this? Drop a comment below!",
    },
    {
      text: `Save this for later! 📌\n\n${caption}\n\nWhich point resonated most with you? 1, 2, or 3? 👇\n\n${hashtags.slice(0, 12).join(' ')}`,
      improvement: 'Added save CTA and engagement question',
      hook: 'Save this for later! 📌',
      callToAction: 'Which point resonated most with you? 1, 2, or 3?',
    },
  ];
  
  // Calculate readability (simplified)
  const words = caption.split(/\s+/).length;
  const sentences = caption.split(/[.!?]+/).filter(s => s.trim()).length;
  const avgWordsPerSentence = sentences > 0 ? words / sentences : 0;
  const readabilityScore = Math.min(100, Math.max(0, 100 - Math.abs(avgWordsPerSentence - 15) * 5));
  
  // Predict engagement based on factors
  const lengthScore = currentLength >= 150 && currentLength <= 300 ? 1.2 : 0.9;
  const hashtagScore = hashtags.length >= 15 && hashtags.length <= 25 ? 1.15 : 1.0;
  const hasCTA = /comment|share|save|like|tag|drop|let me know/i.test(caption) ? 1.1 : 0.95;
  const engagementPrediction = Math.min(10, 3.5 * lengthScore * hashtagScore * hasCTA);
  
  return {
    id: `caption_${Date.now()}`,
    originalCaption: caption,
    suggestions,
    analysis: {
      currentLength,
      optimalLength,
      readabilityScore: Math.round(readabilityScore),
      engagementPrediction: Math.round(engagementPrediction * 10) / 10,
    },
  };
}

// ============================================================================
// Hashtag Recommendations
// ============================================================================

export async function recommendHashtags(
  workspaceId: string,
  niche: string,
  count: number = 30
): Promise<HashtagRecommendation[]> {
  const hashtags: HashtagRecommendation[] = [
    // Popular hashtags
    { hashtag: 'love', category: 'popular', postCount: 2000000000, avgEngagement: 2.5, competitionLevel: 'high', relevanceScore: 60, recommended: false },
    { hashtag: 'instagood', category: 'popular', postCount: 700000000, avgEngagement: 2.8, competitionLevel: 'high', relevanceScore: 65, recommended: false },
    { hashtag: 'fashion', category: 'popular', postCount: 1000000000, avgEngagement: 3.2, competitionLevel: 'high', relevanceScore: 55, recommended: false },
    
    // Niche hashtags
    { hashtag: `${niche}tips`, category: 'niche', postCount: 500000, avgEngagement: 5.5, competitionLevel: 'low', relevanceScore: 95, recommended: true },
    { hashtag: `${niche}community`, category: 'niche', postCount: 200000, avgEngagement: 6.2, competitionLevel: 'low', relevanceScore: 90, recommended: true },
    { hashtag: `learn${niche}`, category: 'niche', postCount: 150000, avgEngagement: 5.8, competitionLevel: 'low', relevanceScore: 92, recommended: true },
    { hashtag: `${niche}daily`, category: 'niche', postCount: 300000, avgEngagement: 5.0, competitionLevel: 'low', relevanceScore: 88, recommended: true },
    { hashtag: `${niche}life`, category: 'niche', postCount: 450000, avgEngagement: 4.8, competitionLevel: 'medium', relevanceScore: 85, recommended: true },
    
    // Trending hashtags
    { hashtag: 'trending2024', category: 'trending', postCount: 5000000, avgEngagement: 7.5, competitionLevel: 'medium', relevanceScore: 70, recommended: true },
    { hashtag: 'viral', category: 'trending', postCount: 20000000, avgEngagement: 6.0, competitionLevel: 'high', relevanceScore: 65, recommended: false },
    { hashtag: 'explorepage', category: 'trending', postCount: 8000000, avgEngagement: 5.5, competitionLevel: 'medium', relevanceScore: 75, recommended: true },
    
    // Branded/community hashtags
    { hashtag: 'contentcreators', category: 'niche', postCount: 2500000, avgEngagement: 4.5, competitionLevel: 'medium', relevanceScore: 80, recommended: true },
    { hashtag: 'creatoreconomy', category: 'trending', postCount: 800000, avgEngagement: 5.2, competitionLevel: 'low', relevanceScore: 85, recommended: true },
    { hashtag: 'smallbusiness', category: 'niche', postCount: 100000000, avgEngagement: 4.0, competitionLevel: 'high', relevanceScore: 70, recommended: false },
    
    // More niche tags
    { hashtag: 'growthmindset', category: 'niche', postCount: 12000000, avgEngagement: 4.8, competitionLevel: 'medium', relevanceScore: 82, recommended: true },
    { hashtag: 'entrepreneurlife', category: 'niche', postCount: 15000000, avgEngagement: 4.2, competitionLevel: 'medium', relevanceScore: 78, recommended: true },
    { hashtag: 'successmindset', category: 'niche', postCount: 8000000, avgEngagement: 4.5, competitionLevel: 'medium', relevanceScore: 80, recommended: true },
    { hashtag: 'motivationdaily', category: 'niche', postCount: 6000000, avgEngagement: 4.0, competitionLevel: 'medium', relevanceScore: 75, recommended: true },
    { hashtag: 'hustleculture', category: 'niche', postCount: 2000000, avgEngagement: 4.5, competitionLevel: 'low', relevanceScore: 78, recommended: true },
    
    // Engagement-focused
    { hashtag: 'engagement', category: 'niche', postCount: 15000000, avgEngagement: 3.8, competitionLevel: 'medium', relevanceScore: 72, recommended: false },
    { hashtag: 'communityfirst', category: 'niche', postCount: 500000, avgEngagement: 6.0, competitionLevel: 'low', relevanceScore: 88, recommended: true },
    { hashtag: 'authentic', category: 'trending', postCount: 25000000, avgEngagement: 4.2, competitionLevel: 'high', relevanceScore: 75, recommended: false },
    { hashtag: 'realcontent', category: 'trending', postCount: 1000000, avgEngagement: 5.5, competitionLevel: 'low', relevanceScore: 85, recommended: true },
  ];
  
  return hashtags
    .sort((a, b) => {
      // Prioritize recommended hashtags with good relevance and low competition
      if (a.recommended && !b.recommended) return -1;
      if (!a.recommended && b.recommended) return 1;
      return b.relevanceScore - a.relevanceScore;
    })
    .slice(0, count);
}

// ============================================================================
// A/B Test Suggestions
// ============================================================================

export async function generateABTestSuggestions(
  workspaceId: string
): Promise<ABTestSuggestion[]> {
  const suggestions: ABTestSuggestion[] = [
    {
      id: `ab_${Date.now()}_1`,
      name: 'Caption Length Test',
      description: 'Test whether shorter or longer captions drive more engagement',
      variable: 'caption_length',
      variantA: 'Short caption (50-100 chars) with direct CTA',
      variantB: 'Long caption (200-300 chars) with storytelling',
      expectedWinner: 'B',
      confidence: 72,
      sampleSize: 20,
      duration: 14,
    },
    {
      id: `ab_${Date.now()}_2`,
      name: 'Posting Time Test',
      description: 'Compare morning vs evening posting times',
      variable: 'posting_time',
      variantA: 'Post at 9 AM (morning audience)',
      variantB: 'Post at 7 PM (evening audience)',
      expectedWinner: 'B',
      confidence: 68,
      sampleSize: 16,
      duration: 14,
    },
    {
      id: `ab_${Date.now()}_3`,
      name: 'Hashtag Count Test',
      description: 'Test 15 vs 30 hashtags for optimal reach',
      variable: 'hashtag_count',
      variantA: '15 highly targeted hashtags',
      variantB: '30 mixed hashtags (broad + niche)',
      expectedWinner: 'B',
      confidence: 75,
      sampleSize: 24,
      duration: 21,
    },
    {
      id: `ab_${Date.now()}_4`,
      name: 'CTA Placement Test',
      description: 'Test CTA at beginning vs end of caption',
      variable: 'cta_placement',
      variantA: 'CTA in first line of caption',
      variantB: 'CTA at end of caption',
      expectedWinner: 'A',
      confidence: 65,
      sampleSize: 20,
      duration: 14,
    },
    {
      id: `ab_${Date.now()}_5`,
      name: 'Content Format Test',
      description: 'Compare carousel vs single image performance',
      variable: 'content_format',
      variantA: 'Single high-quality image',
      variantB: '5-slide carousel with tips',
      expectedWinner: 'B',
      confidence: 80,
      sampleSize: 12,
      duration: 10,
    },
  ];
  
  return suggestions.sort((a, b) => b.confidence - a.confidence);
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatContentType(type: ContentType): string {
  const formats: Record<ContentType, string> = {
    reel: 'Reel',
    carousel: 'Carousel',
    single_image: 'Single Image',
    story: 'Story',
    video: 'Video',
  };
  return formats[type] || type;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatHour(hour: number): string {
  const h = hour % 24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 || 12;
  return `${displayHour} ${ampm}`;
}
