/**
 * Content Scoring Service
 * Calculates optimization scores for content
 */

import {
  ContentScore,
  PostOptimization,
  OptimizePostInput,
  OptimizationChecklist,
  OptimizationChecklistItem,
  ContentType,
  PlatformType,
} from '@/types/optimize';
import { analyzePerformance } from './analyzer';

// ============================================================================
// Scoring Configuration
// ============================================================================

const SCORING_WEIGHTS = {
  caption: 0.25,
  hashtags: 0.20,
  timing: 0.20,
  visual: 0.20,
  engagement: 0.15,
};

const OPTIMAL_RANGES = {
  captionLength: { min: 150, max: 300, optimal: 200 },
  hashtagCount: { min: 20, max: 30, optimal: 25 },
  captionHasCTA: true,
  captionHasEmoji: true,
  captionHasLineBreaks: true,
};

// ============================================================================
// Content Score Calculation
// ============================================================================

export async function calculateContentScore(
  input: OptimizePostInput
): Promise<ContentScore> {
  const { caption, hashtags, contentType, platform, mediaUrls } = input;
  
  // Analyze individual components
  const captionScore = calculateCaptionScore(caption);
  const hashtagsScore = calculateHashtagsScore(hashtags);
  const timingScore = await calculateTimingScore(platform, contentType);
  const visualScore = calculateVisualScore(mediaUrls || [], contentType);
  const engagementScore = predictEngagementScore(caption, hashtags, contentType);
  
  // Calculate weighted overall score
  const overall = Math.round(
    captionScore * SCORING_WEIGHTS.caption +
    hashtagsScore * SCORING_WEIGHTS.hashtags +
    timingScore * SCORING_WEIGHTS.timing +
    visualScore * SCORING_WEIGHTS.visual +
    engagementScore * SCORING_WEIGHTS.engagement
  );
  
  // Generate suggestions
  const suggestions = generateScoreSuggestions({
    captionScore,
    hashtagsScore,
    timingScore,
    visualScore,
    engagementScore,
  }, caption, hashtags);
  
  // Determine grade
  const grade = calculateGrade(overall);
  
  return {
    overall,
    breakdown: {
      caption: Math.round(captionScore),
      hashtags: Math.round(hashtagsScore),
      timing: Math.round(timingScore),
      visual: Math.round(visualScore),
      engagement: Math.round(engagementScore),
    },
    suggestions,
    grade,
  };
}

function calculateCaptionScore(caption: string): number {
  let score = 50; // Base score
  
  // Length scoring (optimal: 150-300 characters)
  const length = caption.length;
  if (length >= 150 && length <= 300) {
    score += 20;
  } else if (length >= 100 && length <= 400) {
    score += 10;
  } else if (length < 50) {
    score -= 10;
  } else if (length > 500) {
    score -= 5;
  }
  
  // CTA presence
  const ctaPatterns = [
    /comment|drop a comment/i,
    /share|tag a friend/i,
    /save this|bookmark/i,
    /double.tap|like this/i,
    /let me know|what do you think/i,
    /link in bio|click the link/i,
    /swipe up|swipe left/i,
    /follow for more/i,
  ];
  const hasCTA = ctaPatterns.some(pattern => pattern.test(caption));
  if (hasCTA) score += 15;
  
  // Emoji usage
  const emojiCount = (caption.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  if (emojiCount >= 1 && emojiCount <= 5) {
    score += 10;
  } else if (emojiCount > 10) {
    score -= 5;
  }
  
  // Line breaks for readability
  const lineBreaks = (caption.match(/\n/g) || []).length;
  if (lineBreaks >= 2 && lineBreaks <= 5) {
    score += 10;
  }
  
  // Hook at beginning
  const hasHook = /^[🎯⚡💡🚨🔥✨]|^(Did you know|Here\'s|Stop|Don\'t|Want to|How to)/i.test(caption);
  if (hasHook) score += 10;
  
  // Question for engagement
  if (/\?/g.test(caption)) score += 5;
  
  return Math.max(0, Math.min(100, score));
}

function calculateHashtagsScore(hashtags: string[]): number {
  let score = 50; // Base score
  const count = hashtags.length;
  
  // Count scoring (optimal: 20-30)
  if (count >= 20 && count <= 30) {
    score += 25;
  } else if (count >= 15 && count <= 35) {
    score += 15;
  } else if (count < 10) {
    score -= 15;
  } else if (count > 40) {
    score -= 10;
  }
  
  // Diversity (mix of popular and niche)
  const totalLength = hashtags.reduce((sum, h) => sum + h.length, 0);
  const avgLength = totalLength / count;
  if (avgLength >= 8 && avgLength <= 20) {
    score += 15; // Good mix of lengths
  }
  
  // Relevance indicators
  const hasBranded = hashtags.some(h => h.includes('brand') || h.length > 15);
  const hasNiche = hashtags.some(h => h.length >= 10 && h.length <= 20);
  const hasCommunity = hashtags.some(h => /community|official|hub/i.test(h));
  
  if (hasBranded) score += 5;
  if (hasNiche) score += 10;
  if (hasCommunity) score += 5;
  
  return Math.max(0, Math.min(100, score));
}

async function calculateTimingScore(
  platform: PlatformType,
  contentType: ContentType
): Promise<number> {
  // This would ideally use real-time data
  // For now, return a score based on general best practices
  let score = 60; // Base score
  
  // Platform-specific adjustments
  if (platform === 'instagram') {
    if (contentType === 'reel') score += 10;
    if (contentType === 'carousel') score += 5;
  } else if (platform === 'tiktok') {
    if (contentType === 'video' || contentType === 'reel') score += 15;
  }
  
  // Content type preferences
  const highPerformingTypes = ['reel', 'carousel', 'video'];
  if (highPerformingTypes.includes(contentType)) {
    score += 10;
  }
  
  return Math.max(0, Math.min(100, score));
}

function calculateVisualScore(mediaUrls: string[], contentType: ContentType): number {
  let score = 60; // Base score
  
  // Has media
  if (mediaUrls.length > 0) {
    score += 20;
  }
  
  // Multiple images for carousel
  if (contentType === 'carousel' && mediaUrls.length >= 3) {
    score += 15;
  }
  
  // Video content bonus
  if (contentType === 'reel' || contentType === 'video') {
    score += 10;
  }
  
  // Consistency in media count
  if (contentType === 'carousel' && mediaUrls.length >= 5 && mediaUrls.length <= 10) {
    score += 5;
  }
  
  return Math.max(0, Math.min(100, score));
}

function predictEngagementScore(
  caption: string,
  hashtags: string[],
  contentType: ContentType
): number {
  let score = 50; // Base score
  
  // Content type performance
  const performanceMultipliers: Record<ContentType, number> = {
    reel: 1.3,
    carousel: 1.2,
    video: 1.25,
    single_image: 1.0,
    story: 0.8,
  };
  score *= performanceMultipliers[contentType] || 1.0;
  
  // Caption engagement factors
  if (/\?/g.test(caption)) score += 5; // Questions drive comments
  if (/save|bookmark/i.test(caption)) score += 5; // Save CTAs
  if (/tag|share/i.test(caption)) score += 5; // Share CTAs
  
  // Hashtag reach potential
  if (hashtags.length >= 20 && hashtags.length <= 30) {
    score += 10;
  }
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

function calculateGrade(score: number): ContentScore['grade'] {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function generateScoreSuggestions(
  scores: {
    caption: number;
    hashtags: number;
    timing: number;
    visual: number;
    engagement: number;
  },
  caption: string,
  hashtags: string[]
): string[] {
  const suggestions: string[] = [];
  
  if (scores.caption < 70) {
    if (caption.length < 150) {
      suggestions.push('Add more context to your caption (aim for 150-300 characters)');
    }
    if (!/comment|share|save|like|tag/i.test(caption)) {
      suggestions.push('Include a clear call-to-action in your caption');
    }
    if ((caption.match(/\n/g) || []).length < 2) {
      suggestions.push('Use line breaks to improve caption readability');
    }
  }
  
  if (scores.hashtags < 70) {
    if (hashtags.length < 20) {
      suggestions.push('Use 20-30 hashtags for better reach');
    } else if (hashtags.length > 35) {
      suggestions.push('Reduce hashtags to 20-30 most relevant ones');
    }
    suggestions.push('Mix popular, niche, and branded hashtags');
  }
  
  if (scores.visual < 70) {
    suggestions.push('Use high-quality visuals with consistent branding');
    suggestions.push('Consider carousel posts for educational content');
  }
  
  if (scores.engagement < 70) {
    suggestions.push('Ask questions to encourage comments');
    suggestions.push('Create content that provides value (educational/entertaining)');
  }
  
  return suggestions;
}

// ============================================================================
// Post Optimization
// ============================================================================

export async function optimizePost(
  input: OptimizePostInput
): Promise<PostOptimization> {
  const { caption, hashtags, contentType, platform } = input;
  
  // Calculate original score
  const originalScore = await calculateContentScore(input);
  
  // Generate optimized version
  const optimizedCaption = optimizeCaption(caption);
  const optimizedHashtags = optimizeHashtags(hashtags);
  const optimizedTime = calculateOptimalPostingTime(platform, contentType);
  
  // Calculate optimized score
  const optimizedScore = await calculateContentScore({
    ...input,
    caption: optimizedCaption,
    hashtags: optimizedHashtags,
  });
  
  // Calculate improvements
  const improvements = [
    {
      metric: 'Overall Score',
      before: originalScore.overall,
      after: optimizedScore.overall,
      improvement: optimizedScore.overall - originalScore.overall,
    },
    {
      metric: 'Caption Score',
      before: originalScore.breakdown.caption,
      after: optimizedScore.breakdown.caption,
      improvement: optimizedScore.breakdown.caption - originalScore.breakdown.caption,
    },
    {
      metric: 'Hashtag Score',
      before: originalScore.breakdown.hashtags,
      after: optimizedScore.breakdown.hashtags,
      improvement: optimizedScore.breakdown.hashtags - originalScore.breakdown.hashtags,
    },
  ];
  
  return {
    original: {
      caption,
      hashtags,
      postingTime: new Date(),
      contentType,
    },
    optimized: {
      caption: optimizedCaption,
      hashtags: optimizedHashtags,
      postingTime: optimizedTime,
      contentType,
    },
    improvements,
    scoreImprovement: optimizedScore.overall - originalScore.overall,
  };
}

function optimizeCaption(original: string): string {
  let optimized = original;
  
  // Add hook if missing
  const hooks = ['🎯 ', '⚡ ', '💡 ', '🚨 ', '🔥 ', '✨ '];
  const hasHook = /^[🎯⚡💡🚨🔥✨]/.test(optimized);
  if (!hasHook && optimized.length > 0) {
    optimized = hooks[Math.floor(Math.random() * hooks.length)] + optimized;
  }
  
  // Add line breaks if too dense
  if ((optimized.match(/\n/g) || []).length < 2 && optimized.length > 100) {
    // Insert line break after first sentence
    const firstSentenceMatch = optimized.match(/^[^.!?]+[.!?]/);
    if (firstSentenceMatch) {
      const insertPoint = firstSentenceMatch[0].length;
      optimized = optimized.slice(0, insertPoint) + '\n\n' + optimized.slice(insertPoint).trim();
    }
  }
  
  // Add CTA if missing
  const hasCTA = /comment|share|save|like|tag|let me know/i.test(optimized);
  if (!hasCTA) {
    const ctas = [
      '\n\nWhat do you think? Let me know in the comments! 👇',
      '\n\nDouble-tap if you agree! ❤️',
      '\n\nSave this for later! 📌',
      '\n\nTag someone who needs to see this!',
    ];
    optimized += ctas[Math.floor(Math.random() * ctas.length)];
  }
  
  return optimized;
}

function optimizeHashtags(original: string[]): string[] {
  const optimized = [...original];
  
  // Ensure we have enough hashtags
  if (optimized.length < 20) {
    const additionalHashtags = [
      'contentcreation',
      'socialmedia',
      'digitalmarketing',
      'creativity',
      'growth',
      'success',
      'motivation',
      'inspiration',
      'community',
      'love',
    ];
    while (optimized.length < 25 && additionalHashtags.length > 0) {
      const tag = additionalHashtags.shift();
      if (tag && !optimized.includes(tag)) {
        optimized.push(tag);
      }
    }
  }
  
  // Limit to optimal count
  return optimized.slice(0, 30);
}

function calculateOptimalPostingTime(
  platform: PlatformType,
  contentType: ContentType
): Date {
  const now = new Date();
  const nextTuesday = new Date(now);
  nextTuesday.setDate(now.getDate() + ((2 + 7 - now.getDay()) % 7));
  nextTuesday.setHours(19, 0, 0, 0);
  
  // If it's already past this Tuesday, go to next week
  if (nextTuesday < now) {
    nextTuesday.setDate(nextTuesday.getDate() + 7);
  }
  
  return nextTuesday;
}

// ============================================================================
// Optimization Checklist
// ============================================================================

export async function generateOptimizationChecklist(
  input: OptimizePostInput
): Promise<OptimizationChecklist> {
  const { caption, hashtags, contentType, mediaUrls } = input;
  
  const items: OptimizationChecklistItem[] = [
    {
      id: 'check_1',
      category: 'caption',
      title: 'Caption length is 150-300 characters',
      description: 'Optimal caption length for maximum engagement',
      isCompleted: caption.length >= 150 && caption.length <= 300,
      isRequired: false,
      impact: 'medium',
      autoCheckable: true,
    },
    {
      id: 'check_2',
      category: 'caption',
      title: 'Caption includes a call-to-action',
      description: 'Encourages audience interaction',
      isCompleted: /comment|share|save|like|tag|let me know|drop a|swipe/i.test(caption),
      isRequired: true,
      impact: 'high',
      autoCheckable: true,
    },
    {
      id: 'check_3',
      category: 'caption',
      title: 'Caption has a strong hook in first line',
      description: 'Grabs attention in the first 125 characters',
      isCompleted: /^[🎯⚡💡🚨🔥✨]|^(Stop|Don\'t|Want|How|Why|Did|Here|Save)/i.test(caption),
      isRequired: false,
      impact: 'high',
      autoCheckable: true,
    },
    {
      id: 'check_4',
      category: 'caption',
      title: 'Uses 1-5 relevant emojis',
      description: 'Adds personality without being overwhelming',
      isCompleted: (() => {
        // Simple emoji count - count characters in common emoji ranges
        let count = 0;
        for (const char of caption) {
          const code = char.codePointAt(0) || 0;
          if (code >= 0x1F300 && code <= 0x1F9FF) count++;
        }
        return count >= 1 && count <= 5;
      })(),
      isRequired: false,
      impact: 'low',
      autoCheckable: true,
    },
    {
      id: 'check_5',
      category: 'hashtags',
      title: 'Uses 20-30 hashtags',
      description: 'Optimal hashtag count for reach',
      isCompleted: hashtags.length >= 20 && hashtags.length <= 30,
      isRequired: false,
      impact: 'high',
      autoCheckable: true,
    },
    {
      id: 'check_6',
      category: 'hashtags',
      title: 'Mix of popular and niche hashtags',
      description: 'Balances reach with targeted discovery',
      isCompleted: hashtags.some(h => h.length <= 10) && hashtags.some(h => h.length >= 15),
      isRequired: false,
      impact: 'medium',
      autoCheckable: true,
    },
    {
      id: 'check_7',
      category: 'visual',
      title: 'High-quality media attached',
      description: 'Clear, well-lit visuals',
      isCompleted: mediaUrls && mediaUrls.length > 0,
      isRequired: true,
      impact: 'high',
      autoCheckable: true,
    },
    {
      id: 'check_8',
      category: 'visual',
      title: 'Consistent brand aesthetic',
      description: 'Matches your visual identity',
      isCompleted: mediaUrls && mediaUrls.length > 0, // Simplified
      isRequired: false,
      impact: 'medium',
      autoCheckable: false,
    },
    {
      id: 'check_9',
      category: 'timing',
      title: 'Posted at optimal time',
      description: 'When your audience is most active',
      isCompleted: false, // Would check against actual posting time
      isRequired: false,
      impact: 'high',
      autoCheckable: true,
    },
    {
      id: 'check_10',
      category: 'engagement',
      title: 'Content provides value',
      description: 'Educational, entertaining, or inspiring',
      isCompleted: /tip|hack|guide|how to|learn|secret|strategy/i.test(caption),
      isRequired: true,
      impact: 'high',
      autoCheckable: true,
    },
  ];
  
  const completedCount = items.filter(i => i.isCompleted).length;
  const totalCount = items.length;
  const score = Math.round((completedCount / totalCount) * 100);
  
  return {
    items,
    completedCount,
    totalCount,
    score,
  };
}
