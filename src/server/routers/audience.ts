/**
 * Audience Intelligence tRPC Router
 * Exposes audience analysis services through tRPC endpoints
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import {
  analyzeComments,
  batchAnalyzeSentiments,
  generateSentimentExplanation,
} from '@/server/services/audience/sentiment-analyzer';
import {
  aggregateDemographics,
  generateAudienceSegments,
} from '@/server/services/audience/demographics';
import {
  extractAllKeywords,
  clusterTopics,
  generateWordCloudData,
  searchKeywords,
  getKeywordInsights,
  identifyTrendingKeywords,
} from '@/server/services/audience/keywords';
import {
  generateInsights,
  generateVoiceOfCustomer,
  generateExportData,
} from '@/server/services/audience/insights';
import {
  getHeroDashboard,
  refreshHeroAnalytics,
} from '@/server/services/audience/hero-analytics';
import type {
  SentimentAnalysis,
  Demographics,
  CommentInsights,
  VoiceOfCustomer,
  AIInsight,
  AudienceSegment,
  AudienceOverview,
  KeywordData,
  TopicCluster,
  CommentInsight,
  KeywordData,
} from '@/types/audience';

// ============================================================================
// Mock Data Generator
// ============================================================================

function generateMockComments(count: number = 50): Array<{
  id: string;
  text: string;
  timestamp: string;
  platform: string;
  contentType?: string;
}> {
  const positiveComments = [
    'Love this product! Works exactly as described.',
    'Amazing quality, exceeded my expectations!',
    'Best purchase I\'ve made this year. Highly recommend!',
    'Great customer service, very helpful team!',
    'Super happy with my order, fast delivery too!',
    'This is exactly what I needed. Thank you!',
    'Fantastic experience from start to finish!',
    'The quality is outstanding for the price.',
    'So impressed with how easy this is to use!',
    'Would definitely buy again. 5 stars!',
    'Love the new features, keep up the great work!',
    'Perfect solution for my business needs.',
    'Excellent value for money, very satisfied!',
    'The team was so helpful and responsive!',
    'Best in class product, no competition!',
  ];
  
  const negativeComments = [
    'Having issues with the latest update.',
    'Customer service was not helpful at all.',
    'Product broke after just one week of use.',
    'Too expensive for what you get.',
    'Delivery was late and package was damaged.',
    'Difficult to set up, needs better instructions.',
    'Not as described, very disappointed.',
    'Waiting for a response for 3 days now.',
    'The app keeps crashing on my phone.',
    'Waste of money, regret this purchase.',
  ];
  
  const neutralComments = [
    'Is this compatible with the older version?',
    'What are the dimensions of this product?',
    'Does anyone know when this will be back in stock?',
    'Can you ship to Canada?',
    'How long does the battery last?',
    'Is there a warranty included?',
    'What colors are available?',
    'Can I return this if it doesn\'t fit?',
  ];
  
  const platforms = ['instagram', 'tiktok'];
  const contentTypes = ['post', 'reel', 'story', 'video'];
  
  const comments = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const sentiment = Math.random();
    let text: string;
    
    if (sentiment > 0.6) {
      text = positiveComments[Math.floor(Math.random() * positiveComments.length)];
    } else if (sentiment > 0.3) {
      text = neutralComments[Math.floor(Math.random() * neutralComments.length)];
    } else {
      text = negativeComments[Math.floor(Math.random() * negativeComments.length)];
    }
    
    const date = new Date(now);
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    
    comments.push({
      id: `comment-${i}`,
      text,
      timestamp: date.toISOString(),
      platform: platforms[Math.floor(Math.random() * platforms.length)],
      contentType: contentTypes[Math.floor(Math.random() * contentTypes.length)],
    });
  }
  
  return comments;
}

function normalizeLegacySentiment(sentiment: string): 'positive' | 'negative' | 'neutral' {
  return sentiment === 'mixed' ? 'neutral' : sentiment as 'positive' | 'negative' | 'neutral';
}

function normalizeLegacyCommentInsights(insights: CommentInsight[]): CommentInsight[] {
  return insights.map((insight) => ({
    ...insight,
    sentiment: normalizeLegacySentiment(insight.sentiment),
  }));
}

function normalizeLegacyKeywords(keywords: KeywordData[]): KeywordData[] {
  return keywords.map((keyword) => ({
    ...keyword,
    sentiment: normalizeLegacySentiment(keyword.sentiment),
  }));
}

function normalizeLegacySentimentAnalysis(analysis: SentimentAnalysis): SentimentAnalysis {
  const normalizeScoreMap = (map: Record<string, { positive: number; negative: number; neutral: number; mixed?: number; compound: number }>) =>
    Object.fromEntries(
      Object.entries(map).map(([key, value]) => [
        key,
        {
          ...value,
          neutral: value.neutral + (value.mixed || 0),
          mixed: 0,
        },
      ])
    );

  return {
    ...analysis,
    byContentType: normalizeScoreMap(analysis.byContentType),
    byPlatform: normalizeScoreMap(analysis.byPlatform),
    overall: {
      ...analysis.overall,
      neutral: analysis.overall.neutral + (analysis.overall.mixed || 0),
      mixed: 0,
    },
  };
}

// ============================================================================
// Audience Router
// ============================================================================

export const audienceRouter = createTRPCRouter({
  getHeroDashboard: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ input }) => {
      return getHeroDashboard(input.workspaceId);
    }),

  refreshHeroAnalytics: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        instagramHandle: z.string().trim().optional(),
        tiktokHandle: z.string().trim().optional(),
      }).refine(
        (value) => Boolean(value.instagramHandle || value.tiktokHandle),
        'Provide at least one Instagram or TikTok handle.'
      )
    )
    .mutation(async ({ input, ctx }) => {
      return refreshHeroAnalytics({
        workspaceId: input.workspaceId,
        userId: ctx.user.id,
        instagramHandle: input.instagramHandle,
        tiktokHandle: input.tiktokHandle,
      });
    }),

  // ==========================================================================
  // Overview & Dashboard
  // ==========================================================================

  getOverview: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
      period: z.enum(['7d', '30d', '90d']).default('30d'),
    }))
    .query(async ({ input }) => {
      // Generate mock comments
      const mockComments = generateMockComments(100);
      
      // Analyze sentiment
      const { insights: commentInsights, analysis: sentimentAnalysis } = await analyzeComments(mockComments);
      const normalizedCommentInsights = normalizeLegacyCommentInsights(commentInsights);
      const normalizedSentimentAnalysis = normalizeLegacySentimentAnalysis(sentimentAnalysis);
      
      // Get demographics
      const demographics = aggregateDemographics(input.workspaceId, 12500);
      
      // Extract keywords
      const keywords = normalizeLegacyKeywords(extractAllKeywords(normalizedCommentInsights, 50));
      
      // Cluster topics
      const trendingTopics = clusterTopics(keywords, normalizedCommentInsights);
      
      // Generate segments
      const segments = generateAudienceSegments(12500);
      
      // Generate VoC
      const voc = generateVoiceOfCustomer(normalizedCommentInsights, keywords);
      
      // Generate insights
      const aiInsights = generateInsights(
        normalizedSentimentAnalysis,
        demographics,
        {
          topComments: normalizedCommentInsights.slice(0, 20),
          questions: [],
          painPoints: [],
          responseRate: { responded: 45, total: 100, percentage: 45 },
          languageDistribution: { en: 60, es: 15, other: 25 },
          categories: { general: 50, question: 20, praise: 20, complaint: 10 },
        },
        voc,
        segments
      );
      
      const overview: AudienceOverview = {
        workspaceId: input.workspaceId,
        period: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        },
        totalComments: mockComments.length,
        totalEngagement: mockComments.reduce((sum, c) => sum + Math.floor(Math.random() * 100), 0),
        normalizedSentimentAnalysis,
        demographics,
        topKeywords: keywords.slice(0, 20),
        trendingTopics,
        insights: aiInsights,
        updatedAt: new Date().toISOString(),
      };
      
      return overview;
    }),

  // ==========================================================================
  // Sentiment Analysis
  // ==========================================================================

  getSentimentAnalysis: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
      platform: z.enum(['instagram', 'tiktok', 'all']).default('all'),
      period: z.enum(['7d', '30d', '90d']).default('30d'),
    }))
    .query(async ({ input }) => {
      const mockComments = generateMockComments(150);
      const { analysis } = await analyzeComments(mockComments);
      return analysis;
    }),

  getSentimentTrends: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
      days: z.number().min(7).max(90).default(30),
    }))
    .query(async ({ input }) => {
      const trends = [];
      const now = new Date();
      
      for (let i = input.days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        const positive = 40 + Math.floor(Math.random() * 30);
        const negative = 10 + Math.floor(Math.random() * 20);
        const neutral = 100 - positive - negative;
        
        trends.push({
          date: date.toISOString().split('T')[0],
          positive,
          negative,
          neutral,
          total: 50 + Math.floor(Math.random() * 100),
          score: (positive - negative) / 100,
        });
      }
      
      return trends;
    }),

  analyzeText: protectedProcedure
    .input(z.object({
      text: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { analyzeTextLocal, detectEmotionLocal, getSentimentType } = await import('@/server/services/audience/sentiment-analyzer');
      
      const sentiment = analyzeTextLocal(input.text);
      const emotion = detectEmotionLocal(input.text);
      const sentimentType = getSentimentType(sentiment);
      
      return {
        sentiment,
        emotion,
        sentimentType,
      };
    }),

  explainSentiment: protectedProcedure
    .input(z.object({
      commentId: z.string(),
    }))
    .query(async ({ input }) => {
      // Mock explanation
      return {
        overallScore: 0.65,
        confidence: 0.87,
        factors: {
          positive: [{ text: 'amazing', weight: 0.9, category: 'word' }],
          negative: [],
          neutral: [{ text: 'this', weight: 0.1, category: 'word' }],
        },
        summary: 'Overwhelmingly positive tone with enthusiastic language.',
        keyPhrases: ['amazing', 'great', 'love'],
        toneIndicators: {
          formality: 'casual' as const,
          enthusiasm: 'high' as const,
          urgency: 'low' as const,
        },
      };
    }),

  // ==========================================================================
  // Keywords & Topics
  // ==========================================================================

  getKeywords: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
      limit: z.number().min(10).max(200).default(50),
      filters: z.object({
        sentiment: z.array(z.enum(['positive', 'negative', 'neutral'])).optional(),
        minFrequency: z.number().optional(),
        trendingOnly: z.boolean().optional(),
        search: z.string().optional(),
      }).optional(),
    }))
    .query(async ({ input }) => {
      const mockComments = generateMockComments(100);
      const { insights } = await analyzeComments(mockComments);
      let keywords = extractAllKeywords(insights, input.limit);
      
      if (input.filters) {
        keywords = searchKeywords(keywords, input.filters.search || '', {
          sentiment: input.filters.sentiment,
          minFrequency: input.filters.minFrequency,
          trendingOnly: input.filters.trendingOnly,
        });
      }
      
      return keywords;
    }),

  getTrendingKeywords: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
      limit: z.number().min(5).max(50).default(20),
    }))
    .query(async ({ input }) => {
      const mockComments = generateMockComments(100);
      const { insights } = await analyzeComments(mockComments);
      const keywords = extractAllKeywords(insights, 100);
      
      // Mark some as trending
      return keywords
        .map((k, i) => ({ ...k, trending: i < input.limit / 2, trendDirection: 'up' as const }))
        .filter((k) => k.trending)
        .slice(0, input.limit);
    }),

  getTopicClusters: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
    }))
    .query(async ({ input }) => {
      const mockComments = generateMockComments(100);
      const { insights } = await analyzeComments(mockComments);
      const keywords = extractAllKeywords(insights, 50);
      return clusterTopics(keywords, insights);
    }),

  getWordCloud: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
      maxWords: z.number().min(20).max(200).default(100),
    }))
    .query(async ({ input }) => {
      const mockComments = generateMockComments(150);
      const { insights } = await analyzeComments(mockComments);
      const keywords = extractAllKeywords(insights, input.maxWords);
      return generateWordCloudData(keywords, input.maxWords);
    }),

  // ==========================================================================
  // Demographics
  // ==========================================================================

  getDemographics: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
    }))
    .query(async ({ input }) => {
      return aggregateDemographics(input.workspaceId, 12500);
    }),

  getAudienceSegments: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
    }))
    .query(async ({ input }) => {
      return generateAudienceSegments(12500);
    }),

  getPeakEngagement: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
    }))
    .query(async ({ input }) => {
      const { generatePeakEngagement } = await import('@/server/services/audience/demographics');
      return generatePeakEngagement();
    }),

  // ==========================================================================
  // Comments Analysis
  // ==========================================================================

  getComments: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
      limit: z.number().min(10).max(100).default(50),
      offset: z.number().min(0).default(0),
      filters: z.object({
        sentiment: z.array(z.enum(['positive', 'negative', 'neutral'])).optional(),
        category: z.array(z.string()).optional(),
        platform: z.array(z.string()).optional(),
        search: z.string().optional(),
      }).optional(),
    }))
    .query(async ({ input }) => {
      const mockComments = generateMockComments(100);
      const { insights } = await analyzeComments(mockComments);
      const normalizedInsights = normalizeLegacyCommentInsights(insights);
      
      let filtered = normalizedInsights;
      
      if (input.filters?.sentiment?.length) {
        filtered = filtered.filter((c) => input.filters!.sentiment!.includes(c.sentiment));
      }
      
      if (input.filters?.platform?.length) {
        filtered = filtered.filter((c) => input.filters!.platform!.includes(c.platform));
      }
      
      if (input.filters?.search) {
        const query = input.filters.search.toLowerCase();
        filtered = filtered.filter((c) => c.text.toLowerCase().includes(query));
      }
      
      return {
        comments: filtered.slice(input.offset, input.offset + input.limit),
        total: filtered.length,
        hasMore: filtered.length > input.offset + input.limit,
      };
    }),

  getQuestions: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
    }))
    .query(async ({ input }) => {
      return [
        {
          question: 'How do I get started?',
          frequency: 12,
          variations: ['Where do I begin?', 'How to start?', 'Getting started help'],
          contexts: ['New users asking about onboarding'],
          suggestedAnswer: 'Check out our quick start guide in the bio link!',
        },
        {
          question: 'What is the pricing?',
          frequency: 8,
          variations: ['How much does it cost?', 'Price?', 'Is it free?'],
          contexts: ['Price inquiries on product posts'],
          suggestedAnswer: 'We have plans starting from $9/month. DM us for details!',
        },
        {
          question: 'Do you ship internationally?',
          frequency: 5,
          variations: ['International shipping?', 'Ship to Europe?', 'Worldwide delivery?'],
          contexts: ['Shipping questions from international users'],
          suggestedAnswer: 'Yes! We ship worldwide with free shipping on orders over $50.',
        },
      ];
    }),

  getPainPoints: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
    }))
    .query(async ({ input }) => {
      return [
        {
          issue: 'Slow response time from support',
          frequency: 15,
          severity: 'high' as const,
          relatedComments: ['Waiting 3 days for reply', 'No response yet'],
          suggestedSolutions: ['Implement auto-responder', 'Add chat support'],
        },
        {
          issue: 'App crashes on older devices',
          frequency: 8,
          severity: 'medium' as const,
          relatedComments: ['Crashes on iPhone 11', 'Keeps crashing'],
          suggestedSolutions: ['Optimize for older devices', 'Add compatibility mode'],
        },
      ];
    }),

  // ==========================================================================
  // Voice of Customer
  // ==========================================================================

  getVoiceOfCustomer: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
    }))
    .query(async ({ input }) => {
      const mockComments = generateMockComments(100);
      const { insights } = await analyzeComments(mockComments);
      const normalizedInsights = normalizeLegacyCommentInsights(insights);
      const keywords = normalizeLegacyKeywords(extractAllKeywords(normalizedInsights, 50));
      return generateVoiceOfCustomer(normalizedInsights, keywords);
    }),

  getFeatureRequests: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
    }))
    .query(async ({ input }) => {
      return [
        {
          feature: 'Dark mode option',
          description: 'Requested 23 times by the community',
          frequency: 23,
          upvotes: 45,
          sentiment: 'positive' as const,
          priority: 'high' as const,
          relatedComments: ['Would love dark mode!', 'Please add dark theme'],
          feasibility: 'easy' as const,
        },
        {
          feature: 'Mobile app for iOS',
          description: 'Requested 18 times by the community',
          frequency: 18,
          upvotes: 32,
          sentiment: 'positive' as const,
          priority: 'high' as const,
          relatedComments: ['When is the iOS app coming?', 'Need mobile app'],
          feasibility: 'hard' as const,
        },
        {
          feature: 'Analytics dashboard',
          description: 'Requested 12 times by the community',
          frequency: 12,
          upvotes: 28,
          sentiment: 'positive' as const,
          priority: 'medium' as const,
          relatedComments: ['Need better analytics', 'Stats would be helpful'],
          feasibility: 'medium' as const,
        },
      ];
    }),

  getTestimonials: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ input }) => {
      return [
        {
          text: 'Absolutely love this product! It has transformed how we work.',
          author: 'Sarah M.',
          platform: 'instagram',
          sentiment: 'positive' as const,
          engagement: 127,
          date: new Date().toISOString(),
          category: 'product',
          highlight: 'transformed how we work',
        },
        {
          text: 'Best customer service I have ever experienced. Highly recommend!',
          author: 'John D.',
          platform: 'tiktok',
          sentiment: 'positive' as const,
          engagement: 89,
          date: new Date(Date.now() - 86400000).toISOString(),
          category: 'service',
          highlight: 'Best customer service',
        },
      ];
    }),

  // ==========================================================================
  // AI Insights
  // ==========================================================================

  getInsights: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
      type: z.enum(['all', 'opportunity', 'risk', 'trend', 'recommendation', 'alert']).default('all'),
      priority: z.enum(['all', 'critical', 'high', 'medium', 'low']).default('all'),
    }))
    .query(async ({ input }) => {
      const mockComments = generateMockComments(100);
      const { insights: commentInsights, analysis: sentimentAnalysis } = await analyzeComments(mockComments);
      const normalizedCommentInsights = normalizeLegacyCommentInsights(commentInsights);
      const normalizedSentimentAnalysis = normalizeLegacySentimentAnalysis(sentimentAnalysis);
      const demographics = aggregateDemographics(input.workspaceId, 12500);
      const keywords = normalizeLegacyKeywords(extractAllKeywords(normalizedCommentInsights, 50));
      const voc = generateVoiceOfCustomer(normalizedCommentInsights, keywords);
      const segments = generateAudienceSegments(12500);
      
      let insights = generateInsights(
        normalizedSentimentAnalysis,
        demographics,
        {
          topComments: normalizedCommentInsights.slice(0, 20),
          questions: [],
          painPoints: [],
          responseRate: { responded: 45, total: 100, percentage: 45 },
          languageDistribution: {},
          categories: {},
        },
        voc,
        segments
      );
      
      if (input.type !== 'all') {
        insights = insights.filter((i) => i.type === input.type);
      }
      
      if (input.priority !== 'all') {
        insights = insights.filter((i) => i.priority === input.priority);
      }
      
      return insights;
    }),

  // ==========================================================================
  // Export
  // ==========================================================================

  exportData: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
      format: z.enum(['csv', 'json', 'pdf']),
      sections: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const mockComments = generateMockComments(100);
      const { insights: commentInsights, analysis: sentimentAnalysis } = await analyzeComments(mockComments);
      const normalizedCommentInsights = normalizeLegacyCommentInsights(commentInsights);
      const normalizedSentimentAnalysis = normalizeLegacySentimentAnalysis(sentimentAnalysis);
      const demographics = aggregateDemographics(input.workspaceId, 12500);
      const keywords = normalizeLegacyKeywords(extractAllKeywords(normalizedCommentInsights, 50));
      const voc = generateVoiceOfCustomer(normalizedCommentInsights, keywords);
      
      const exportData = generateExportData(
        normalizedSentimentAnalysis,
        demographics,
        {
          topComments: normalizedCommentInsights.slice(0, 20),
          questions: [],
          painPoints: [],
          responseRate: { responded: 45, total: 100, percentage: 45 },
          languageDistribution: {},
          categories: {},
        },
        voc,
        input.format
      );
      
      return {
        format: input.format,
        data: exportData,
        generatedAt: new Date().toISOString(),
        downloadUrl: `/api/exports/audience-${Date.now()}.${input.format}`,
      };
    }),
});
