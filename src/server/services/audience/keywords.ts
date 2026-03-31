/**
 * Keywords & Topics Service
 * Extracts, clusters, and analyzes keywords from audience content
 */

import type {
  KeywordData,
  TopicCluster,
  NamedEntity,
  CommentInsight,
} from '@/types/audience';

// ============================================================================
// Stop Words & Utilities
// ============================================================================

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'can', 'need', 'dare', 'ought', 'used',
  'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into',
  'through', 'during', 'before', 'after', 'above', 'below', 'between',
  'under', 'and', 'but', 'or', 'yet', 'so', 'if', 'because', 'although',
  'though', 'while', 'where', 'when', 'that', 'which', 'who', 'whom',
  'whose', 'what', 'this', 'these', 'those', 'i', 'you', 'he', 'she', 'it',
  'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his',
  'her', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs',
  'am', 'get', 'got', 'go', 'going', 'gone', 'went', 'come', 'came',
  'just', 'only', 'even', 'also', 'still', 'already', 'yet', 'too',
  'very', 'much', 'many', 'more', 'most', 'some', 'any', 'all', 'none',
  'one', 'two', 'first', 'last', 'next', 'other', 'another', 'such',
  'here', 'there', 'now', 'then', 'today', 'tomorrow', 'yesterday',
]);

// Industry-specific stop words
const INDUSTRY_STOP_WORDS = new Set([
  'post', 'like', 'comment', 'follow', 'following', 'follower', 'user',
  'account', 'profile', 'photo', 'video', 'story', 'reel', 'feed',
  'instagram', 'ig', 'tiktok', 'tt', 'social', 'media', 'platform',
  'link', 'bio', 'caption', 'hashtag', 'tag', 'mention', 'dm',
  'please', 'pls', 'thanks', 'thx', 'ty', 'okay', 'ok', 'yeah', 'yes', 'no',
]);

// ============================================================================
// Keyword Extraction
// ============================================================================

/**
 * Extract keywords from a single text
 */
export function extractKeywords(text: string, minLength: number = 3): string[] {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => 
      word.length >= minLength &&
      !STOP_WORDS.has(word) &&
      !INDUSTRY_STOP_WORDS.has(word) &&
      !/^\d+$/.test(word)
    );
  
  return words;
}

/**
 * Extract n-grams (phrases) from text
 */
export function extractNgrams(text: string, n: number = 2): string[] {
  const words = extractKeywords(text, 2);
  const ngrams: string[] = [];
  
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.push(words.slice(i, i + n).join(' '));
  }
  
  return ngrams;
}

/**
 * Calculate TF-IDF scores for keywords
 */
export function calculateTfIdf(
  documents: string[]
): Map<string, { tf: number; idf: number; tfidf: number }> {
  const docCount = documents.length;
  const wordDocFreq = new Map<string, number>();
  const wordFreqPerDoc: Map<string, number>[] = [];
  
  // Calculate term frequency per document and document frequency
  documents.forEach((doc) => {
    const words = extractKeywords(doc);
    const freq = new Map<string, number>();
    const seenInDoc = new Set<string>();
    
    words.forEach((word) => {
      freq.set(word, (freq.get(word) || 0) + 1);
      if (!seenInDoc.has(word)) {
        seenInDoc.add(word);
        wordDocFreq.set(word, (wordDocFreq.get(word) || 0) + 1);
      }
    });
    
    wordFreqPerDoc.push(freq);
  });
  
  // Calculate TF-IDF
  const tfidfScores = new Map<string, { tf: number; idf: number; tfidf: number }>();
  
  wordDocFreq.forEach((docFreq, word) => {
    const idf = Math.log(docCount / (docFreq + 1)) + 1;
    
    // Average TF across documents
    let totalTf = 0;
    wordFreqPerDoc.forEach((freq) => {
      totalTf += freq.get(word) || 0;
    });
    const tf = totalTf / docCount;
    
    tfidfScores.set(word, {
      tf,
      idf,
      tfidf: tf * idf,
    });
  });
  
  return tfidfScores;
}

/**
 * Extract and rank keywords from all comments
 */
export function extractAllKeywords(
  comments: CommentInsight[],
  topN: number = 50
): KeywordData[] {
  const wordFreq = new Map<string, {
    frequency: number;
    sentimentScores: number[];
    contexts: string[];
  }>();
  
  comments.forEach((comment) => {
    const words = extractKeywords(comment.text);
    const bigrams = extractNgrams(comment.text, 2);
    const allTerms = [...words, ...bigrams];
    
    allTerms.forEach((term) => {
      const existing = wordFreq.get(term) || {
        frequency: 0,
        sentimentScores: [],
        contexts: [],
      };
      
      existing.frequency++;
      existing.sentimentScores.push(comment.sentimentScore);
      
      // Store context (shortened comment)
      if (existing.contexts.length < 3) {
        const context = comment.text.length > 100 
          ? comment.text.substring(0, 100) + '...'
          : comment.text;
        if (!existing.contexts.includes(context)) {
          existing.contexts.push(context);
        }
      }
      
      wordFreq.set(term, existing);
    });
  });
  
  // Calculate average sentiment and format results
  const keywords: KeywordData[] = Array.from(wordFreq.entries())
    .filter(([_, data]) => data.frequency >= 2) // Min frequency threshold
    .map(([term, data]) => {
      const avgSentiment = data.sentimentScores.reduce((a, b) => a + b, 0) / data.sentimentScores.length;
      
      let sentiment: 'positive' | 'negative' | 'neutral';
      if (avgSentiment > 0.2) sentiment = 'positive';
      else if (avgSentiment < -0.2) sentiment = 'negative';
      else sentiment = 'neutral';
      
      return {
        term,
        frequency: data.frequency,
        sentiment,
        sentimentScore: avgSentiment,
        trending: false, // Will be calculated separately
        contexts: data.contexts,
      };
    })
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, topN);
  
  return keywords;
}

// ============================================================================
// Topic Clustering
// ============================================================================

/**
 * Cluster keywords into topics using simple similarity
 */
export function clusterTopics(
  keywords: KeywordData[],
  comments: CommentInsight[]
): TopicCluster[] {
  const clusters: TopicCluster[] = [];
  const assigned = new Set<string>();
  
  // Define seed topics with related keywords
  const seedTopics = [
    {
      name: 'Product Quality',
      seedWords: ['quality', 'product', 'item', 'goods', 'material', 'durability', 'well made'],
    },
    {
      name: 'Customer Service',
      seedWords: ['service', 'support', 'help', 'team', 'staff', 'response', 'helpful'],
    },
    {
      name: 'Pricing',
      seedWords: ['price', 'cost', 'expensive', 'cheap', 'value', 'money', 'worth', 'affordable'],
    },
    {
      name: 'User Experience',
      seedWords: ['easy', 'simple', 'interface', 'design', 'user friendly', 'intuitive', 'smooth'],
    },
    {
      name: 'Delivery & Shipping',
      seedWords: ['delivery', 'shipping', 'arrived', 'package', 'fast', 'quick', 'delay'],
    },
    {
      name: 'Features & Functionality',
      seedWords: ['feature', 'function', 'work', 'working', 'option', 'tool', 'capability'],
    },
  ];
  
  seedTopics.forEach((seed) => {
    const topicKeywords: string[] = [];
    let totalFreq = 0;
    let sentimentSum = 0;
    let relatedComments = 0;
    
    keywords.forEach((kw) => {
      if (assigned.has(kw.term)) return;
      
      // Check if keyword is related to this topic
      const isRelated = seed.seedWords.some((seedWord) => 
        kw.term.includes(seedWord) || 
        seedWord.includes(kw.term) ||
        areWordsSimilar(kw.term, seedWord)
      );
      
      if (isRelated) {
        topicKeywords.push(kw.term);
        totalFreq += kw.frequency;
        sentimentSum += kw.sentimentScore;
        assigned.add(kw.term);
        
        // Count related comments
        comments.forEach((comment) => {
          if (comment.text.toLowerCase().includes(kw.term.toLowerCase())) {
            relatedComments++;
          }
        });
      }
    });
    
    if (topicKeywords.length >= 2) {
      const avgSentiment = sentimentSum / topicKeywords.length;
      const sentiment: 'positive' | 'negative' | 'neutral' = 
        avgSentiment > 0.2 ? 'positive' : avgSentiment < -0.2 ? 'negative' : 'neutral';
      
      clusters.push({
        id: `topic-${clusters.length + 1}`,
        name: seed.name,
        keywords: topicKeywords.slice(0, 10),
        frequency: totalFreq,
        sentiment,
        relatedComments: Math.min(relatedComments, comments.length),
        trending: Math.random() > 0.6, // Would be calculated from historical data
      });
    }
  });
  
  // Sort by frequency
  return clusters.sort((a, b) => b.frequency - a.frequency);
}

/**
 * Check if two words are similar (simple implementation)
 */
function areWordsSimilar(word1: string, word2: string): boolean {
  // Simple string similarity - could use Levenshtein in production
  const w1 = word1.toLowerCase();
  const w2 = word2.toLowerCase();
  
  if (w1 === w2) return true;
  if (w1.includes(w2) || w2.includes(w1)) return true;
  
  // Common roots
  const root1 = w1.substring(0, Math.min(4, w1.length));
  const root2 = w2.substring(0, Math.min(4, w2.length));
  
  return root1 === root2;
}

/**
 * Extract named entities from comments
 */
export function extractEntities(comments: CommentInsight[]): NamedEntity[] {
  const entityPatterns = {
    person: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g,
    organization: /\b(?:Inc\.?|Corp\.?|Ltd\.?|Company|Studio|Agency|Group)\b/gi,
    brand: /\b(?:Apple|Google|Microsoft|Amazon|Meta|Tesla|Nike|Adidas|Samsung|Sony)\b/g,
    product: /\b(?:iPhone|iPad|MacBook|AirPods|Galaxy|Pixel|PlayStation|Xbox)\b/g,
  };
  
  const entityFreq = new Map<string, { type: keyof typeof entityPatterns; count: number; sentimentSum: number }>();
  
  comments.forEach((comment) => {
    (Object.entries(entityPatterns) as Array<[keyof typeof entityPatterns, RegExp]>).forEach(([type, pattern]) => {
      const matches = comment.text.match(pattern) || [];
      matches.forEach((match) => {
        const key = `${type}:${match}`;
        const existing = entityFreq.get(key);
        if (existing) {
          existing.count++;
          existing.sentimentSum += comment.sentimentScore;
        } else {
          entityFreq.set(key, { type, count: 1, sentimentSum: comment.sentimentScore });
        }
      });
    });
  });
  
  return Array.from(entityFreq.entries())
    .filter(([_, data]) => data.count >= 2)
    .map(([key, data]) => {
      const [, name] = key.split(':');
      const avgSentiment = data.sentimentSum / data.count;
      const sentiment: 'positive' | 'negative' | 'neutral' =
        avgSentiment > 0.2 ? 'positive' : avgSentiment < -0.2 ? 'negative' : 'neutral';
      
      return {
        name,
        type: data.type,
        frequency: data.count,
        sentiment,
      };
    })
    .sort((a, b) => b.frequency - a.frequency);
}

// ============================================================================
// Trending Analysis
// ============================================================================

/**
 * Identify trending keywords by comparing periods
 */
export function identifyTrendingKeywords(
  currentKeywords: KeywordData[],
  previousKeywords: KeywordData[]
): KeywordData[] {
  const prevMap = new Map(previousKeywords.map((k) => [k.term, k]));
  
  return currentKeywords.map((kw) => {
    const prev = prevMap.get(kw.term);
    if (!prev) {
      return { ...kw, trending: true, trendDirection: 'up' as const, changePercent: 100 };
    }
    
    const changePercent = ((kw.frequency - prev.frequency) / prev.frequency) * 100;
    const trendDirection = changePercent > 20 ? 'up' : changePercent < -20 ? 'down' : 'stable';
    
    return {
      ...kw,
      trending: Math.abs(changePercent) > 30,
      trendDirection,
      changePercent: Math.round(changePercent),
    };
  });
}

/**
 * Find related terms using co-occurrence
 */
export function findRelatedTerms(
  targetTerm: string,
  comments: CommentInsight[],
  maxRelated: number = 5
): string[] {
  const coOccurrence = new Map<string, number>();
  
  comments.forEach((comment) => {
    const text = comment.text.toLowerCase();
    if (text.includes(targetTerm.toLowerCase())) {
      const words = extractKeywords(comment.text);
      words.forEach((word) => {
        if (word !== targetTerm.toLowerCase()) {
          coOccurrence.set(word, (coOccurrence.get(word) || 0) + 1);
        }
      });
    }
  });
  
  return Array.from(coOccurrence.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxRelated)
    .map(([word]) => word);
}

/**
 * Generate word cloud data
 */
export function generateWordCloudData(
  keywords: KeywordData[],
  maxWords: number = 100
): Array<{
  text: string;
  value: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}> {
  return keywords
    .slice(0, maxWords)
    .map((kw) => ({
      text: kw.term,
      value: kw.frequency,
      sentiment: kw.sentiment,
    }));
}

/**
 * Search keywords with filters
 */
export function searchKeywords(
  keywords: KeywordData[],
  query: string,
  filters?: {
    sentiment?: ('positive' | 'negative' | 'neutral')[];
    minFrequency?: number;
    trendingOnly?: boolean;
  }
): KeywordData[] {
  let results = keywords;
  
  // Text search
  if (query) {
    const lowerQuery = query.toLowerCase();
    results = results.filter((kw) =>
      kw.term.toLowerCase().includes(lowerQuery)
    );
  }
  
  // Sentiment filter
  if (filters?.sentiment?.length) {
    results = results.filter((kw) => filters.sentiment?.includes(kw.sentiment));
  }
  
  // Frequency filter
  if (filters?.minFrequency) {
    results = results.filter((kw) => kw.frequency >= filters.minFrequency!);
  }
  
  // Trending filter
  if (filters?.trendingOnly) {
    results = results.filter((kw) => kw.trending);
  }
  
  return results;
}

/**
 * Get keyword insights summary
 */
export function getKeywordInsights(keywords: KeywordData[]): {
  total: number;
  positive: number;
  negative: number;
  neutral: number;
  trending: number;
  topPhrases: string[];
} {
  const positive = keywords.filter((k) => k.sentiment === 'positive').length;
  const negative = keywords.filter((k) => k.sentiment === 'negative').length;
  const neutral = keywords.filter((k) => k.sentiment === 'neutral').length;
  const trending = keywords.filter((k) => k.trending).length;
  
  const topPhrases = keywords
    .filter((k) => k.term.includes(' '))
    .slice(0, 10)
    .map((k) => k.term);
  
  return {
    total: keywords.length,
    positive,
    negative,
    neutral,
    trending,
    topPhrases,
  };
}
