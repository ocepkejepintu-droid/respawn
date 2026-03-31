/**
 * AI Insights Service
 * Generates actionable insights and recommendations from audience data
 */

import type {
  AIInsight,
  AudienceSegment,
  SentimentAnalysis,
  Demographics,
  CommentInsights,
  VoiceOfCustomer,
  FeatureRequest,
  VoCTheme,
  Testimonial,
} from '@/types/audience';

// ============================================================================
// AI Insight Generation
// ============================================================================

/**
 * Generate AI-powered insights from audience data
 */
export function generateInsights(
  sentimentAnalysis: SentimentAnalysis,
  demographics: Demographics,
  commentInsights: CommentInsights,
  voc: VoiceOfCustomer,
  segments: AudienceSegment[]
): AIInsight[] {
  const insights: AIInsight[] = [];
  
  // Sentiment-based insights
  insights.push(...generateSentimentInsights(sentimentAnalysis));
  
  // Engagement-based insights
  insights.push(...generateEngagementInsights(demographics));
  
  // Comment-based insights
  insights.push(...generateCommentInsights(commentInsights));
  
  // Voice of Customer insights
  insights.push(...generateVoCInsights(voc));
  
  // Segment-based insights
  insights.push(...generateSegmentInsights(segments));
  
  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  return insights.slice(0, 10); // Return top 10 insights
}

/**
 * Generate insights from sentiment data
 */
function generateSentimentInsights(sentiment: SentimentAnalysis): AIInsight[] {
  const insights: AIInsight[] = [];
  
  // Overall sentiment health
  if (sentiment.overall.positive < 40 && sentiment.overall.negative > 30) {
    insights.push({
      id: `insight-${Date.now()}-1`,
      type: 'alert',
      title: 'Negative Sentiment Trend Detected',
      description: `Your audience sentiment shows ${sentiment.overall.negative}% negative feedback, which is above the healthy threshold. Immediate attention recommended to address underlying issues.`,
      confidence: 0.85,
      priority: 'high',
      category: 'Sentiment',
      relatedMetrics: ['negative_sentiment', 'response_rate'],
      suggestedActions: [
        'Review recent negative comments for common themes',
        'Create a response plan for addressing complaints',
        'Consider a community engagement initiative',
      ],
      createdAt: new Date().toISOString(),
    });
  }
  
  // Positive sentiment opportunity
  if (sentiment.overall.positive > 60) {
    insights.push({
      id: `insight-${Date.now()}-2`,
      type: 'opportunity',
      title: 'High Positive Sentiment - Amplify Success',
      description: `With ${sentiment.overall.positive}% positive sentiment, your audience is highly satisfied. This is an ideal time to launch advocacy programs or request testimonials.`,
      confidence: 0.88,
      priority: 'medium',
      category: 'Sentiment',
      relatedMetrics: ['positive_sentiment', 'engagement_rate'],
      suggestedActions: [
        'Reach out to highly positive commenters for testimonials',
        'Create user-generated content campaigns',
        'Identify and nurture brand advocates',
      ],
      createdAt: new Date().toISOString(),
    });
  }
  
  // Sentiment trend analysis
  if (sentiment.trends.length >= 3) {
    const recent = sentiment.trends.slice(-3);
    const avgRecent = recent.reduce((sum, t) => sum + t.score, 0) / recent.length;
    const previous = sentiment.trends.slice(-6, -3);
    const avgPrevious = previous.reduce((sum, t) => sum + t.score, 0) / previous.length;
    
    if (avgRecent < avgPrevious - 0.2) {
      insights.push({
        id: `insight-${Date.now()}-3`,
        type: 'risk',
        title: 'Declining Sentiment Trend',
        description: `Sentiment score has dropped by ${((avgPrevious - avgRecent) * 100).toFixed(1)}% over the past period. Review recent content and engagement strategies.`,
        confidence: 0.75,
        priority: 'high',
        category: 'Trends',
        relatedMetrics: ['sentiment_score', 'engagement_trend'],
        suggestedActions: [
          'Analyze content from declining period',
          'Survey audience for feedback',
          'Adjust content strategy based on preferences',
        ],
        createdAt: new Date().toISOString(),
      });
    }
  }
  
  // Platform-specific insights
  Object.entries(sentiment.byPlatform).forEach(([platform, scores]) => {
    if (scores.negative > 40) {
      insights.push({
        id: `insight-${Date.now()}-${platform}`,
        type: 'alert',
        title: `${platform} Platform Issues`,
        description: `${platform} shows ${scores.negative}% negative sentiment. Platform-specific issues may need addressing.`,
        confidence: 0.80,
        priority: 'medium',
        category: 'Platform',
        relatedMetrics: [`${platform}_sentiment`],
        suggestedActions: [
          `Review ${platform} specific feedback`,
          `Check for platform technical issues`,
          `Adjust content format for ${platform}`,
        ],
        createdAt: new Date().toISOString(),
      });
    }
  });
  
  return insights;
}

/**
 * Generate insights from engagement data
 */
function generateEngagementInsights(demographics: Demographics): AIInsight[] {
  const insights: AIInsight[] = [];
  
  // Peak engagement optimization
  const { bestHours, bestDays } = demographics.peakEngagement;
  if (bestHours.length > 0) {
    insights.push({
      id: `insight-${Date.now()}-eng-1`,
      type: 'recommendation',
      title: 'Optimal Posting Times Identified',
      description: `Your audience is most engaged at ${bestHours.slice(0, 3).map(h => `${h}:00`).join(', ')}. Schedule important content during these windows for maximum reach.`,
      confidence: 0.82,
      priority: 'medium',
      category: 'Engagement',
      relatedMetrics: ['peak_engagement', 'post_reach'],
      suggestedActions: [
        `Schedule key posts at ${bestHours[0]}:00 for maximum visibility`,
        'Test different content types during peak hours',
        'Set up automated posting for optimal times',
      ],
      createdAt: new Date().toISOString(),
    });
  }
  
  // Age group insights
  const topAgeGroup = demographics.ageRanges[0];
  if (topAgeGroup && topAgeGroup.percentage > 35) {
    insights.push({
      id: `insight-${Date.now()}-eng-2`,
      type: 'opportunity',
      title: `Primary Audience: ${topAgeGroup.range}`,
      description: `${topAgeGroup.percentage}% of your audience is in the ${topAgeGroup.range} age group. Tailor content to this demographic for better engagement.`,
      confidence: 0.90,
      priority: 'medium',
      category: 'Demographics',
      relatedMetrics: ['audience_age', 'engagement_rate'],
      suggestedActions: [
        `Create content themes appealing to ${topAgeGroup.range} age group`,
        'Use platform preferences of this demographic',
        'Adjust tone and messaging to match audience age',
      ],
      createdAt: new Date().toISOString(),
    });
  }
  
  // Geographic opportunity
  const topCountry = demographics.countries[0];
  if (topCountry && topCountry.percentage < 50) {
    insights.push({
      id: `insight-${Date.now()}-eng-3`,
      type: 'opportunity',
      title: 'Geographic Diversification',
      description: `Your audience is well-distributed globally with ${topCountry.country} leading at ${topCountry.percentage}%. Consider localized content for top regions.`,
      confidence: 0.78,
      priority: 'low',
      category: 'Geography',
      relatedMetrics: ['geo_distribution', 'international_reach'],
      suggestedActions: [
        'Create region-specific content variations',
        'Consider local language content for top countries',
        'Analyze cultural preferences by region',
      ],
      createdAt: new Date().toISOString(),
    });
  }
  
  // Interest alignment
  const topInterests = demographics.interests.filter((i) => i.affinity === 'high');
  if (topInterests.length >= 2) {
    insights.push({
      id: `insight-${Date.now()}-eng-4`,
      type: 'recommendation',
      title: 'Content-Interest Alignment',
      description: `Your audience shows high affinity for ${topInterests.slice(0, 3).map((i) => i.name).join(', ')}. Incorporate these themes into your content strategy.`,
      confidence: 0.85,
      priority: 'medium',
      category: 'Interests',
      relatedMetrics: ['interest_alignment', 'content_engagement'],
      suggestedActions: [
        `Create content around ${topInterests[0].name}`,
        'Partner with influencers in these interest areas',
        'Use related hashtags and keywords',
      ],
      createdAt: new Date().toISOString(),
    });
  }
  
  return insights;
}

/**
 * Generate insights from comment analysis
 */
function generateCommentInsights(comments: CommentInsights): AIInsight[] {
  const insights: AIInsight[] = [];
  
  // Response rate concern
  if (comments.responseRate.percentage < 50) {
    insights.push({
      id: `insight-${Date.now()}-com-1`,
      type: 'alert',
      title: 'Low Response Rate',
      description: `Only ${comments.responseRate.percentage}% of comments receive responses. Improving engagement can boost loyalty and sentiment.`,
      confidence: 0.88,
      priority: 'high',
      category: 'Engagement',
      relatedMetrics: ['response_rate', 'comment_volume'],
      suggestedActions: [
        'Set up automated response notifications',
        'Create response templates for common questions',
        'Dedicate time daily for comment engagement',
      ],
      createdAt: new Date().toISOString(),
    });
  }
  
  // Question patterns
  if (comments.questions.length > 0) {
    const topQuestion = comments.questions[0];
    if (topQuestion.frequency >= 3) {
      insights.push({
        id: `insight-${Date.now()}-com-2`,
        type: 'recommendation',
        title: 'Frequently Asked Question',
        description: `"${topQuestion.question}" appears ${topQuestion.frequency} times. Consider addressing this proactively in your content or FAQ.`,
        confidence: 0.85,
        priority: 'medium',
        category: 'FAQ',
        relatedMetrics: ['question_frequency', 'support_volume'],
        suggestedActions: [
          'Create content addressing this question',
          'Update bio or pinned post with this information',
          'Prepare a standard response template',
        ],
        createdAt: new Date().toISOString(),
      });
    }
  }
  
  // Pain points
  const highSeverityIssues = comments.painPoints.filter((p) => p.severity === 'high');
  if (highSeverityIssues.length > 0) {
    insights.push({
      id: `insight-${Date.now()}-com-3`,
      type: 'risk',
      title: 'Critical Pain Points Identified',
      description: `${highSeverityIssues.length} high-severity issues reported by users. Immediate investigation recommended.`,
      confidence: 0.82,
      priority: 'critical',
      category: 'Issues',
      relatedMetrics: ['pain_points', 'complaint_volume'],
      suggestedActions: [
        'Prioritize fixing reported issues',
        'Communicate timeline to affected users',
        'Monitor for resolution confirmation',
      ],
      createdAt: new Date().toISOString(),
    });
  }
  
  return insights;
}

/**
 * Generate insights from Voice of Customer
 */
function generateVoCInsights(voc: VoiceOfCustomer): AIInsight[] {
  const insights: AIInsight[] = [];
  
  // Feature requests
  const highPriorityFeatures = voc.featureRequests.filter((f) => f.priority === 'high');
  if (highPriorityFeatures.length > 0) {
    insights.push({
      id: `insight-${Date.now()}-voc-1`,
      type: 'opportunity',
      title: 'High-Demand Feature Requests',
      description: `${highPriorityFeatures.length} feature requests with high community demand. Consider prioritizing these in your roadmap.`,
      confidence: 0.80,
      priority: 'medium',
      category: 'Product',
      relatedMetrics: ['feature_requests', 'user_demand'],
      suggestedActions: [
        'Review feasibility of top requested features',
        'Share product roadmap with community',
        'Create beta testing program for new features',
      ],
      createdAt: new Date().toISOString(),
    });
  }
  
  // Testimonial opportunities
  if (voc.testimonials.length >= 5) {
    insights.push({
      id: `insight-${Date.now()}-voc-2`,
      type: 'opportunity',
      title: 'Social Proof Assets Available',
      description: `${voc.testimonials.length} positive testimonials identified. Leverage these for marketing and social proof.`,
      confidence: 0.90,
      priority: 'low',
      category: 'Marketing',
      relatedMetrics: ['testimonials', 'social_proof'],
      suggestedActions: [
        'Request permission to use testimonials',
        'Create testimonial graphics for social media',
        'Add testimonials to website/marketing materials',
      ],
      createdAt: new Date().toISOString(),
    });
  }
  
  // Theme trends
  const increasingThemes = voc.themes.filter((t) => t.trendDirection === 'increasing');
  if (increasingThemes.length > 0) {
    insights.push({
      id: `insight-${Date.now()}-voc-3`,
      type: 'trend',
      title: 'Emerging Conversation Themes',
      description: `New topics gaining traction: ${increasingThemes.slice(0, 3).map((t) => t.theme).join(', ')}.`,
      confidence: 0.75,
      priority: 'low',
      category: 'Trends',
      relatedMetrics: ['theme_velocity', 'conversation_trends'],
      suggestedActions: [
        'Create content around emerging themes',
        'Engage in conversations about these topics',
        'Monitor for business opportunities',
      ],
      createdAt: new Date().toISOString(),
    });
  }
  
  return insights;
}

/**
 * Generate insights from audience segments
 */
function generateSegmentInsights(segments: AudienceSegment[]): AIInsight[] {
  const insights: AIInsight[] = [];
  
  // High-value segment
  const highValueSegment = segments.find((s) => s.value === 'high' && s.engagementRate > 8);
  if (highValueSegment) {
    insights.push({
      id: `insight-${Date.now()}-seg-1`,
      type: 'opportunity',
      title: `Nurture Your "${highValueSegment.name}"`,
      description: `The "${highValueSegment.name}" segment (${highValueSegment.percentage}% of audience) shows ${highValueSegment.engagementRate}% engagement. Focus retention efforts here.`,
      confidence: 0.85,
      priority: 'high',
      category: 'Segments',
      relatedMetrics: ['segment_engagement', 'high_value_users'],
      suggestedActions: [
        'Create exclusive content for this segment',
        'Set up loyalty rewards or recognition',
        'Personalize communication for this group',
      ],
      createdAt: new Date().toISOString(),
    });
  }
  
  // At-risk segment
  const atRiskSegment = segments.find((s) => s.name.includes('At-Risk') || s.engagementRate < 2);
  if (atRiskSegment) {
    insights.push({
      id: `insight-${Date.now()}-seg-2`,
      type: 'risk',
      title: 'At-Risk Segment Detected',
      description: `${atRiskSegment.percentage}% of your audience shows declining engagement. Re-engagement campaign recommended.`,
      confidence: 0.80,
      priority: 'high',
      category: 'Retention',
      relatedMetrics: ['churn_risk', 'engagement_decline'],
      suggestedActions: [
        'Launch win-back campaign',
        'Survey disengaged users',
        'Offer incentives for re-engagement',
      ],
      createdAt: new Date().toISOString(),
    });
  }
  
  return insights;
}

// ============================================================================
// Voice of Customer Generation
// ============================================================================

/**
 * Generate Voice of Customer analysis from comments
 */
export function generateVoiceOfCustomer(
  comments: CommentInsight[],
  keywords: Array<{ term: string; frequency: number; sentiment: 'positive' | 'negative' | 'neutral' }>
): VoiceOfCustomer {
  // Extract themes
  const themes = extractThemes(comments);
  
  // Extract feature requests
  const featureRequests = extractFeatureRequests(comments);
  
  // Extract testimonials
  const testimonials = extractTestimonials(comments);
  
  // Categorize themes
  const praise = themes.filter((t) => t.type === 'praise');
  const complaints = themes.filter((t) => t.type === 'complaint');
  const suggestions = themes.filter((t) => t.type === 'suggestion');
  
  // Get top phrases from keywords
  const topPhrases = keywords
    .filter((k) => k.frequency >= 3)
    .slice(0, 20)
    .map((k) => ({
      term: k.term,
      frequency: k.frequency,
      sentiment: k.sentiment,
      sentimentScore: k.sentiment === 'positive' ? 0.5 : k.sentiment === 'negative' ? -0.5 : 0,
      trending: false,
    }));
  
  return {
    themes,
    featureRequests,
    testimonials,
    topPhrases,
    complaints,
    praise,
    suggestions,
  };
}

/**
 * Extract themes from comments
 */
function extractThemes(comments: CommentInsight[]): VoCTheme[] {
  const themeMap = new Map<string, {
    type: 'praise' | 'complaint' | 'suggestion' | 'question';
    quotes: string[];
    sentimentSum: number;
    count: number;
  }>();
  
  comments.forEach((comment) => {
    let theme: string | null = null;
    let type: 'praise' | 'complaint' | 'suggestion' | 'question' = 'question';
    
    const text = comment.text.toLowerCase();
    
    // Identify theme and type
    if (text.match(/\b(love|amazing|awesome|great|excellent|perfect|best|fantastic|wonderful)\b/)) {
      theme = 'Product Quality';
      type = 'praise';
    } else if (text.match(/\b(help|support|service|team|response)\b/)) {
      theme = 'Customer Support';
      type = comment.sentiment === 'positive' ? 'praise' : 'complaint';
    } else if (text.match(/\b(price|cost|expensive|cheap|value|worth)\b/)) {
      theme = 'Pricing';
      type = comment.sentiment === 'positive' ? 'praise' : 'complaint';
    } else if (text.match(/\b(easy|simple|user friendly|intuitive|smooth)\b/)) {
      theme = 'User Experience';
      type = 'praise';
    } else if (text.match(/\b(difficult|hard|confusing|complicated|frustrating)\b/)) {
      theme = 'Usability Issues';
      type = 'complaint';
    } else if (text.match(/\b(should|would be nice|wish|suggest|add|feature)\b/)) {
      theme = 'Feature Requests';
      type = 'suggestion';
    } else if (text.match(/\?/)) {
      theme = 'Questions';
      type = 'question';
    }
    
    if (theme) {
      const existing = themeMap.get(theme);
      if (existing) {
        existing.count++;
        existing.sentimentSum += comment.sentimentScore;
        if (existing.quotes.length < 5 && comment.text.length < 200) {
          existing.quotes.push(comment.text);
        }
      } else {
        themeMap.set(theme, {
          type,
          quotes: [comment.text],
          sentimentSum: comment.sentimentScore,
          count: 1,
        });
      }
    }
  });
  
  return Array.from(themeMap.entries())
    .filter(([_, data]) => data.count >= 2)
    .map(([theme, data]) => {
      const avgSentiment = data.sentimentSum / data.count;
      const sentiment: 'positive' | 'negative' | 'neutral' =
        avgSentiment > 0.2 ? 'positive' : avgSentiment < -0.2 ? 'negative' : 'neutral';
      
      return {
        theme,
        type: data.type,
        frequency: data.count,
        sentiment,
        impact: data.count > 10 ? 'high' : data.count > 5 ? 'medium' : 'low',
        quotes: data.quotes,
        relatedKeywords: [],
        trendDirection: Math.random() > 0.5 ? 'increasing' : 'stable',
      };
    })
    .sort((a, b) => b.frequency - a.frequency);
}

/**
 * Extract feature requests from comments
 */
function extractFeatureRequests(comments: CommentInsight[]): FeatureRequest[] {
  const requestMap = new Map<string, {
    description: string;
    upvotes: number;
    sentimentSum: number;
    comments: string[];
  }>();
  
  comments.forEach((comment) => {
    const text = comment.text.toLowerCase();
    
    // Look for feature request patterns
    const patterns = [
      /would be nice to have (.+?)(?:\.|$)/i,
      /wish (?:there was|you had) (.+?)(?:\.|$)/i,
      /should add (.+?)(?:\.|$)/i,
      /feature request: (.+?)(?:\.|$)/i,
      /it would be great if (.+?)(?:\.|$)/i,
    ];
    
    patterns.forEach((pattern) => {
      const match = text.match(pattern);
      if (match) {
        const feature = match[1].trim();
        const key = feature.toLowerCase().substring(0, 30);
        
        const existing = requestMap.get(key);
        if (existing) {
          existing.upvotes++;
          existing.sentimentSum += comment.sentimentScore;
          if (existing.comments.length < 3) {
            existing.comments.push(comment.text);
          }
        } else {
          requestMap.set(key, {
            description: feature,
            upvotes: 1,
            sentimentSum: comment.sentimentScore,
            comments: [comment.text],
          });
        }
      }
    });
  });
  
  return Array.from(requestMap.entries())
    .filter(([_, data]) => data.upvotes >= 2)
    .map(([_, data]) => {
      const avgSentiment = data.sentimentSum / data.upvotes;
      const sentiment: 'positive' | 'negative' | 'neutral' =
        avgSentiment > 0 ? 'positive' : avgSentiment < 0 ? 'negative' : 'neutral';
      
      return {
        feature: data.description.charAt(0).toUpperCase() + data.description.slice(1),
        description: `Requested ${data.upvotes} times by the community`,
        frequency: data.upvotes,
        upvotes: data.upvotes,
        sentiment,
        priority: data.upvotes > 5 ? 'high' : data.upvotes > 3 ? 'medium' : 'low',
        relatedComments: data.comments,
        feasibility: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)] as 'easy' | 'medium' | 'hard',
      };
    })
    .sort((a, b) => b.upvotes - a.upvotes);
}

/**
 * Extract testimonials from positive comments
 */
function extractTestimonials(comments: CommentInsight[]): Testimonial[] {
  return comments
    .filter((c) => 
      c.sentiment === 'positive' && 
      c.sentimentScore > 0.5 &&
      c.text.length > 30 &&
      c.text.length < 300
    )
    .slice(0, 10)
    .map((comment) => ({
      text: comment.text,
      author: comment.author,
      platform: comment.platform,
      sentiment: comment.sentiment,
      engagement: comment.engagement,
      date: comment.timestamp,
      category: comment.category || 'general',
      highlight: extractHighlight(comment.text),
    }));
}

/**
 * Extract highlight from testimonial text
 */
function extractHighlight(text: string): string | undefined {
  // Extract a key positive phrase
  const patterns = [
    /love (?:the |how |that )(.+?)(?:\.|,|!)/i,
    /(?:amazing|awesome|great|excellent) (.+?)(?:\.|,|!)/i,
    /best (.+?)(?:\.|,|!)/i,
    /highly recommend(?:\s+for\s+)?(.+?)?(?:\.|,|!)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return (match[1] || match[0]).trim();
    }
  }
  
  return undefined;
}

// ============================================================================
// Export & Reporting
// ============================================================================

/**
 * Generate export data for audience analysis
 */
export function generateExportData(
  sentimentAnalysis: SentimentAnalysis,
  demographics: Demographics,
  comments: CommentInsights,
  voc: VoiceOfCustomer,
  format: 'csv' | 'json' | 'pdf'
): Record<string, unknown> {
  switch (format) {
    case 'csv':
      return {
        sentiment: convertToCSV([
          ['Date', 'Positive', 'Negative', 'Neutral', 'Score'],
          ...sentimentAnalysis.trends.map((t) => [
            t.date,
            t.positive,
            t.negative,
            t.neutral,
            t.score.toFixed(2),
          ]),
        ]),
        keywords: convertToCSV([
          ['Keyword', 'Frequency', 'Sentiment', 'Trending'],
          ...voc.topPhrases.map((k) => [
            k.term,
            k.frequency,
            k.sentiment,
            k.trending ? 'Yes' : 'No',
          ]),
        ]),
        comments: convertToCSV([
          ['ID', 'Text', 'Sentiment', 'Score', 'Platform', 'Date'],
          ...comments.topComments.map((c) => [
            c.id,
            c.text.substring(0, 100),
            c.sentiment,
            c.sentimentScore.toFixed(2),
            c.platform,
            c.timestamp,
          ]),
        ]),
      };
      
    case 'json':
      return {
        sentiment: sentimentAnalysis,
        demographics,
        comments,
        voiceOfCustomer: voc,
        generatedAt: new Date().toISOString(),
      };
      
    case 'pdf':
      // PDF would be generated server-side with a PDF library
      return {
        reportType: 'Audience Analysis',
        sections: ['Summary', 'Sentiment Analysis', 'Demographics', 'Keywords', 'Insights'],
        data: {
          sentiment: sentimentAnalysis,
          demographics,
          comments,
          voc,
        },
        generatedAt: new Date().toISOString(),
      };
      
    default:
      return {};
  }
}

/**
 * Convert array to CSV string
 */
function convertToCSV(data: string[][]): string {
  return data
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(',')
    )
    .join('\n');
}
