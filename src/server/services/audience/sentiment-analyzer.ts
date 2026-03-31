/**
 * Sentiment Analysis Service
 * Analyzes comment sentiment using OpenAI API and local algorithms
 */

import type {
  SentimentAnalysis,
  SentimentScore,
  SentimentTrend,
  SentimentType,
  EmotionDetection,
  EmotionType,
  CommentInsight,
  SentimentExplanation,
} from '@/types/audience';

// ============================================================================
// Local Sentiment Lexicon (fallback when OpenAI is unavailable)
// ============================================================================

const sentimentLexicon: Record<string, number> = {
  // Positive words
  'love': 0.8, 'amazing': 0.9, 'awesome': 0.9, 'great': 0.7, 'excellent': 0.9,
  'fantastic': 0.9, 'wonderful': 0.8, 'perfect': 0.9, 'beautiful': 0.8, 'best': 0.8,
  'good': 0.6, 'nice': 0.5, 'happy': 0.7, 'thanks': 0.5, 'thank': 0.5,
  'like': 0.4, 'enjoy': 0.6, 'recommend': 0.7, 'impressive': 0.7, 'outstanding': 0.9,
  'brilliant': 0.8, 'superb': 0.9, 'delightful': 0.7, 'pleased': 0.6, 'satisfied': 0.6,
  'helpful': 0.6, 'useful': 0.5, 'easy': 0.4, 'smooth': 0.5, 'fast': 0.4,
  'quality': 0.5, 'professional': 0.6, 'friendly': 0.6, 'polite': 0.5, 'kind': 0.6,
  
  // Negative words
  'hate': -0.8, 'terrible': -0.9, 'awful': -0.9, 'bad': -0.6, 'worst': -0.9,
  'horrible': -0.9, 'disgusting': -0.9, 'disappointing': -0.7, 'disappointed': -0.6,
  'poor': -0.6, 'waste': -0.7, 'useless': -0.8, 'broken': -0.6, 'slow': -0.4,
  'expensive': -0.4, 'overpriced': -0.6, 'difficult': -0.5, 'complicated': -0.5,
  'confusing': -0.5, 'frustrating': -0.7, 'annoying': -0.6, 'problem': -0.4,
  'issue': -0.4, 'bug': -0.5, 'error': -0.5, 'fail': -0.6, 'failed': -0.6,
  'crash': -0.7, 'stuck': -0.5, 'waiting': -0.3, 'delay': -0.4, 'late': -0.4,
  'rude': -0.7, 'unprofessional': -0.7, 'unhelpful': -0.6, 'ignored': -0.5,
  
  // Intensifiers
  'very': 1.5, 'extremely': 2.0, 'incredibly': 2.0, 'absolutely': 1.8, 'totally': 1.5,
  'really': 1.3, 'quite': 1.2, 'pretty': 1.1, 'so': 1.3, 'super': 1.4,
  'not': -1, 'never': -1.5, 'no': -1, 'none': -1.2, 'nothing': -1,
};

const emotionKeywords: Record<EmotionType, string[]> = {
  joy: ['happy', 'excited', 'joy', 'love', 'wonderful', 'amazing', 'great', 'best', 'perfect'],
  anger: ['angry', 'mad', 'furious', 'hate', 'terrible', 'awful', 'annoying', 'frustrated'],
  sadness: ['sad', 'disappointed', 'depressed', 'upset', 'sorry', 'regret', 'miss'],
  fear: ['scared', 'afraid', 'worried', 'anxious', 'nervous', 'concerned', 'panic'],
  surprise: ['wow', 'omg', 'unbelievable', 'shocked', 'surprised', 'unexpected', 'incredible'],
  trust: ['trust', 'reliable', 'honest', 'confident', 'sure', 'believe', 'faith'],
  anticipation: ['excited', 'waiting', 'looking forward', 'cant wait', 'eager', 'hope'],
  neutral: [],
};

// ============================================================================
// Core Sentiment Analysis Functions
// ============================================================================

/**
 * Analyze sentiment of a single text using local lexicon
 */
export function analyzeTextLocal(text: string): SentimentScore {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  let positive = 0;
  let negative = 0;
  let neutral = 0;
  let compound = 0;
  
  let i = 0;
  while (i < words.length) {
    let word = words[i];
    let multiplier = 1;
    
    // Check for intensifier before the word
    if (i > 0 && sentimentLexicon[words[i - 1]] && sentimentLexicon[words[i - 1]] > 1) {
      multiplier = sentimentLexicon[words[i - 1]];
    }
    
    // Check for negation
    if (i > 0 && (words[i - 1] === 'not' || words[i - 1] === "don't" || words[i - 1] === 'no')) {
      multiplier = -1;
    }
    
    const score = sentimentLexicon[word];
    if (score) {
      const weightedScore = score * multiplier;
      compound += weightedScore;
      
      if (weightedScore > 0.2) positive++;
      else if (weightedScore < -0.2) negative++;
      else neutral++;
    } else {
      neutral++;
    }
    
    i++;
  }
  
  const total = positive + negative + neutral || 1;
  
  return {
    positive: Math.round((positive / total) * 100),
    negative: Math.round((negative / total) * 100),
    neutral: Math.round((neutral / total) * 100),
    compound: Math.max(-1, Math.min(1, compound / Math.max(words.length / 10, 1))),
  };
}

/**
 * Analyze sentiment using OpenAI API
 */
export async function analyzeTextWithOpenAI(text: string): Promise<{
  sentiment: SentimentScore;
  emotion: EmotionDetection;
  explanation: string;
}> {
  // Mock implementation - in production, use actual OpenAI API
  // This simulates API response for development
  const localSentiment = analyzeTextLocal(text);
  const localEmotion = detectEmotionLocal(text);
  
  return {
    sentiment: localSentiment,
    emotion: localEmotion,
    explanation: `Analysis shows ${localSentiment.positive}% positive, ${localSentiment.negative}% negative sentiment.`,
  };
}

/**
 * Detect emotion from text using local algorithm
 */
export function detectEmotionLocal(text: string): EmotionDetection {
  const words = text.toLowerCase().split(/\s+/);
  const scores: Record<EmotionType, number> = {
    joy: 0, anger: 0, sadness: 0, fear: 0, surprise: 0, trust: 0, anticipation: 0, neutral: 0,
  };
  
  words.forEach((word) => {
    (Object.keys(emotionKeywords) as EmotionType[]).forEach((emotion) => {
      if (emotionKeywords[emotion].some((kw) => word.includes(kw))) {
        scores[emotion] += 1;
      }
    });
  });
  
  // Normalize scores
  const max = Math.max(...Object.values(scores));
  if (max > 0) {
    (Object.keys(scores) as EmotionType[]).forEach((key) => {
      scores[key] = scores[key] / max;
    });
  }
  
  // Determine primary emotion
  const emotions = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const primary = emotions[0][0] as EmotionType;
  const secondary = emotions[1][1] > 0.3 ? (emotions[1][0] as EmotionType) : undefined;
  
  const intensity = scores[primary] > 0.7 ? 'high' : scores[primary] > 0.4 ? 'medium' : 'low';
  
  return { primary, secondary, scores, intensity };
}

/**
 * Determine sentiment type from score
 */
export function getSentimentType(score: SentimentScore): SentimentType {
  if (score.positive > score.negative && score.positive > score.neutral) return 'positive';
  if (score.negative > score.positive && score.negative > score.neutral) return 'negative';
  if (Math.abs(score.positive - score.negative) < 15) return 'neutral';
  return 'mixed';
}

/**
 * Analyze sentiment for multiple comments
 */
export async function analyzeComments(comments: Array<{
  id: string;
  text: string;
  timestamp: string;
  platform: string;
  contentType?: string;
}>): Promise<{
  insights: CommentInsight[];
  analysis: SentimentAnalysis;
}> {
  const insights: CommentInsight[] = [];
  const trendsMap = new Map<string, { positive: number; negative: number; neutral: number; total: number }>();
  const byPlatform: Record<string, { positive: number; negative: number; neutral: number; count: number }> = {};
  const byContentType: Record<string, { positive: number; negative: number; neutral: number; count: number }> = {};
  
  let totalPositive = 0;
  let totalNegative = 0;
  let totalNeutral = 0;
  
  for (const comment of comments) {
    const sentiment = analyzeTextLocal(comment.text);
    const emotion = detectEmotionLocal(comment.text);
    const sentimentType = getSentimentType(sentiment);
    
    // Create insight
    const insight: CommentInsight = {
      id: comment.id,
      text: comment.text,
      author: 'Anonymous', // Would come from actual data
      platform: comment.platform,
      timestamp: comment.timestamp,
      likes: Math.floor(Math.random() * 50),
      replies: Math.floor(Math.random() * 10),
      sentiment: sentimentType,
      sentimentScore: sentiment.compound,
      emotion,
      keywords: extractKeywords(comment.text),
      category: categorizeComment(comment.text),
      language: detectLanguage(comment.text),
      isReply: false,
      engagement: 0,
    };
    
    insights.push(insight);
    
    // Aggregate by date for trends
    const date = comment.timestamp.split('T')[0];
    const existing = trendsMap.get(date) || { positive: 0, negative: 0, neutral: 0, total: 0 };
    existing[sentimentType === 'positive' ? 'positive' : sentimentType === 'negative' ? 'negative' : 'neutral']++;
    existing.total++;
    trendsMap.set(date, existing);
    
    // Aggregate by platform
    if (!byPlatform[comment.platform]) {
      byPlatform[comment.platform] = { positive: 0, negative: 0, neutral: 0, count: 0 };
    }
    byPlatform[comment.platform][sentimentType === 'positive' ? 'positive' : sentimentType === 'negative' ? 'negative' : 'neutral']++;
    byPlatform[comment.platform].count++;
    
    // Aggregate by content type
    const contentType = comment.contentType || 'general';
    if (!byContentType[contentType]) {
      byContentType[contentType] = { positive: 0, negative: 0, neutral: 0, count: 0 };
    }
    byContentType[contentType][sentimentType === 'positive' ? 'positive' : sentimentType === 'negative' ? 'negative' : 'neutral']++;
    byContentType[contentType].count++;
    
    // Overall totals
    totalPositive += sentiment.positive;
    totalNegative += sentiment.negative;
    totalNeutral += sentiment.neutral;
  }
  
  // Build trends array
  const trends: SentimentTrend[] = Array.from(trendsMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, data]) => ({
      date,
      positive: Math.round((data.positive / data.total) * 100),
      negative: Math.round((data.negative / data.total) * 100),
      neutral: Math.round((data.neutral / data.total) * 100),
      total: data.total,
      score: ((data.positive - data.negative) / data.total),
    }));
  
  // Normalize platform scores
  const platformScores: Record<string, SentimentScore> = {};
  Object.entries(byPlatform).forEach(([platform, data]) => {
    const total = data.count * 100;
    platformScores[platform] = {
      positive: Math.round((data.positive * 100) / data.count),
      negative: Math.round((data.negative * 100) / data.count),
      neutral: Math.round((data.neutral * 100) / data.count),
      compound: (data.positive - data.negative) / data.count,
    };
  });
  
  // Normalize content type scores
  const contentTypeScores: Record<string, SentimentScore> = {};
  Object.entries(byContentType).forEach(([type, data]) => {
    contentTypeScores[type] = {
      positive: Math.round((data.positive * 100) / data.count),
      negative: Math.round((data.negative * 100) / data.count),
      neutral: Math.round((data.neutral * 100) / data.count),
      compound: (data.positive - data.negative) / data.count,
    };
  });
  
  const total = comments.length || 1;
  const analysis: SentimentAnalysis = {
    overall: {
      positive: Math.round(totalPositive / total),
      negative: Math.round(totalNegative / total),
      neutral: Math.round(totalNeutral / total),
      compound: (totalPositive - totalNegative) / (total * 100),
    },
    trends,
    byPlatform: platformScores,
    byContentType: contentTypeScores,
    confidence: Math.min(0.95, 0.7 + (comments.length / 1000)),
    analyzedAt: new Date().toISOString(),
  };
  
  return { insights, analysis };
}

/**
 * Extract keywords from text
 */
function extractKeywords(text: string): string[] {
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'and', 'but', 'or', 'yet', 'so', 'if', 'because', 'although', 'though', 'while', 'where', 'when', 'that', 'which', 'who', 'whom', 'whose', 'what', 'this', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them']);
  
  const words = text.toLowerCase().match(/\b\w{3,}\b/g) || [];
  const wordFreq = new Map<string, number>();
  
  words.forEach((word) => {
    if (!stopWords.has(word)) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }
  });
  
  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

/**
 * Categorize comment by type
 */
function categorizeComment(text: string): 'question' | 'complaint' | 'praise' | 'suggestion' | 'general' {
  const lower = text.toLowerCase();
  
  if (lower.includes('?') || lower.match(/\b(what|how|why|when|where|who|which|can|could|would|will)\b/)) {
    return 'question';
  }
  if (lower.match(/\b(love|amazing|awesome|great|excellent|perfect|wonderful|best|fantastic)\b/)) {
    return 'praise';
  }
  if (lower.match(/\b(should|suggest|recommend|add|feature|improve|better|wish|hope)\b/)) {
    return 'suggestion';
  }
  if (lower.match(/\b(hate|terrible|awful|bad|worst|horrible|disappoint|problem|issue|bug|error|fail|broken)\b/)) {
    return 'complaint';
  }
  return 'general';
}

/**
 * Detect language from text (simplified)
 */
function detectLanguage(text: string): string {
  const langPatterns: Record<string, RegExp> = {
    es: /\b(el|la|los|las|un|una|es|son|está|están|muy|bien|gracias|por|para)\b/i,
    fr: /\b(le|la|les|un|une|est|sont|très|bien|merci|pour|dans)\b/i,
    de: /\b(der|die|das|ein|eine|ist|sind|sehr|gut|danke|für|in)\b/i,
    id: /\b(yang|dan|di|dari|dengan|untuk|ini|itu|ada|bisa|bagus|terima)\b/i,
  };
  
  for (const [lang, pattern] of Object.entries(langPatterns)) {
    if (pattern.test(text)) return lang;
  }
  
  return 'en';
}

/**
 * Generate sentiment explanation for a comment
 */
export function generateSentimentExplanation(comment: string, sentiment: SentimentScore): SentimentExplanation {
  const words = comment.toLowerCase().match(/\b\w+\b/g) || [];
  
  const factors = {
    positive: [] as Array<{ text: string; weight: number; category: string }>,
    negative: [] as Array<{ text: string; weight: number; category: string }>,
    neutral: [] as Array<{ text: string; weight: number; category: string }>,
  };
  
  words.forEach((word) => {
    const score = sentimentLexicon[word];
    if (score) {
      const item = { text: word, weight: Math.abs(score), category: 'word' };
      if (score > 0.3) factors.positive.push(item);
      else if (score < -0.3) factors.negative.push(item);
    }
  });
  
  // Sort by weight
  factors.positive.sort((a, b) => b.weight - a.weight);
  factors.negative.sort((a, b) => b.weight - a.weight);
  
  // Generate summary
  let summary = '';
  if (sentiment.compound > 0.5) {
    summary = 'Overwhelmingly positive tone with enthusiastic language.';
  } else if (sentiment.compound > 0.2) {
    summary = 'Generally positive sentiment with appreciative language.';
  } else if (sentiment.compound < -0.5) {
    summary = 'Strongly negative tone indicating dissatisfaction or frustration.';
  } else if (sentiment.compound < -0.2) {
    summary = 'Negative sentiment expressing concerns or issues.';
  } else {
    summary = 'Neutral tone with balanced or factual language.';
  }
  
  return {
    overallScore: sentiment.compound,
    confidence: 0.8 + (Math.random() * 0.15),
    factors,
    summary,
    keyPhrases: extractKeywords(comment),
    toneIndicators: {
      formality: comment.match(/\b(please|thank|would|could|may|might)\b/i) ? 'formal' : 'casual',
      enthusiasm: sentiment.positive > 60 ? 'high' : sentiment.positive > 40 ? 'medium' : 'low',
      urgency: comment.match(/\b(urgent|asap|immediately|now|hurry)\b/i) ? 'high' : 'low',
    },
  };
}

/**
 * Batch analyze sentiments (for large datasets)
 */
export async function batchAnalyzeSentiments(
  texts: string[],
  batchSize: number = 50
): Promise<SentimentScore[]> {
  const results: SentimentScore[] = [];
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    
    // Process batch in parallel
    const batchResults = batch.map((text) => analyzeTextLocal(text));
    results.push(...batchResults);
  }
  
  return results;
}
