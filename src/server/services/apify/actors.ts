/**
 * Apify Actor Definitions and Configurations
 * Pre-configured actors from Apify Store with tier limits
 */

import {
  ActorConfig,
  ActorId,
  RateLimitConfig,
  TierType,
  ScraperType,
} from '@/types/apify';

// ============================================================================
// Actor IDs from Apify Store
// ============================================================================

export const ACTOR_IDS: Record<string, ActorId> = {
  INSTAGRAM_PROFILE_SCRAPER: 'apify/instagram-profile-scraper',
  INSTAGRAM_POST_SCRAPER: 'apify/instagram-post-scraper',
  INSTAGRAM_HASHTAG_SCRAPER: 'apify/instagram-hashtag-scraper',
  INSTAGRAM_COMMENT_SCRAPER: 'apify/instagram-comment-scraper',
  TIKTOK_SCRAPER: 'apify/tiktok-scraper',
  TIKTOK_HASHTAG_ANALYTICS: 'apify/tiktok-hashtag-analytics',
} as const;

// ============================================================================
// Tier Limits Configuration
// ============================================================================

export const TIER_LIMITS: Record<TierType, number> = {
  FREE: 100,
  PRO: 1000,
  AGENCY: 5000,
  ENTERPRISE: 50000, // Custom for enterprise
};

// ============================================================================
// Rate Limit Configuration
// ============================================================================

export const RATE_LIMITS: Record<TierType, RateLimitConfig> = {
  FREE: {
    maxConcurrentRuns: 1,
    requestsPerSecond: 1,
    requestsPerMinute: 10,
    cooldownMs: 5000,
  },
  PRO: {
    maxConcurrentRuns: 3,
    requestsPerSecond: 3,
    requestsPerMinute: 60,
    cooldownMs: 1000,
  },
  AGENCY: {
    maxConcurrentRuns: 10,
    requestsPerSecond: 10,
    requestsPerMinute: 300,
    cooldownMs: 500,
  },
  ENTERPRISE: {
    maxConcurrentRuns: 25,
    requestsPerSecond: 25,
    requestsPerMinute: 1000,
    cooldownMs: 100,
  },
};

// ============================================================================
// Actor Configurations
// ============================================================================

export const ACTOR_CONFIGS: Record<ActorId, ActorConfig> = {
  // Instagram Profile Scraper
  // https://apify.com/apify/instagram-profile-scraper
  'apify/instagram-profile-scraper': {
    id: 'apify/instagram-profile-scraper',
    name: 'Instagram Profile Scraper',
    type: 'instagram-profile',
    description: 'Scrape Instagram profiles, posts, followers, and business info',
    defaultMemoryMbytes: 4096,
    defaultTimeoutSecs: 300,
    defaultInput: {
      resultsLimit: 1,
      includePosts: true,
      postsLimit: 12,
      includeStories: false,
      includeHighlights: false,
      includeBusinessInfo: true,
    },
    maxResultsLimit: 1000,
    tierLimits: {
      FREE: 100,
      PRO: 1000,
      AGENCY: 5000,
      ENTERPRISE: 50000,
    },
    costEstimatePer1kResults: 2.5,
  },

  // Instagram Post Scraper
  // https://apify.com/apify/instagram-post-scraper
  'apify/instagram-post-scraper': {
    id: 'apify/instagram-post-scraper',
    name: 'Instagram Post Scraper',
    type: 'instagram-posts',
    description: 'Scrape Instagram posts by URL, username, or hashtag',
    defaultMemoryMbytes: 4096,
    defaultTimeoutSecs: 600,
    defaultInput: {
      resultsLimit: 50,
      includeComments: false,
      commentsLimit: 10,
    },
    maxResultsLimit: 5000,
    tierLimits: {
      FREE: 100,
      PRO: 1000,
      AGENCY: 5000,
      ENTERPRISE: 50000,
    },
    costEstimatePer1kResults: 3.0,
  },

  // Instagram Hashtag Scraper
  // https://apify.com/apify/instagram-hashtag-scraper
  'apify/instagram-hashtag-scraper': {
    id: 'apify/instagram-hashtag-scraper',
    name: 'Instagram Hashtag Scraper',
    type: 'instagram-hashtag',
    description: 'Scrape posts by hashtag - top, recent, or reels',
    defaultMemoryMbytes: 4096,
    defaultTimeoutSecs: 600,
    defaultInput: {
      resultsLimit: 100,
      includePosts: true,
      postsLimit: 50,
      tab: 'top',
    },
    maxResultsLimit: 10000,
    tierLimits: {
      FREE: 100,
      PRO: 1000,
      AGENCY: 5000,
      ENTERPRISE: 50000,
    },
    costEstimatePer1kResults: 3.5,
  },

  // Instagram Comment Scraper
  // https://apify.com/apify/instagram-comment-scraper
  'apify/instagram-comment-scraper': {
    id: 'apify/instagram-comment-scraper',
    name: 'Instagram Comment Scraper',
    type: 'instagram-comments',
    description: 'Scrape comments from Instagram posts',
    defaultMemoryMbytes: 2048,
    defaultTimeoutSecs: 300,
    defaultInput: {
      resultsLimit: 100,
      includeReplies: true,
      repliesLimit: 10,
      sort: 'top',
    },
    maxResultsLimit: 5000,
    tierLimits: {
      FREE: 100,
      PRO: 1000,
      AGENCY: 5000,
      ENTERPRISE: 50000,
    },
    costEstimatePer1kResults: 2.0,
  },

  // TikTok Scraper
  // https://apify.com/apify/tiktok-scraper
  'apify/tiktok-scraper': {
    id: 'apify/tiktok-scraper',
    name: 'TikTok Scraper',
    type: 'tiktok-profile',
    description: 'Scrape TikTok profiles, videos, and engagement data',
    defaultMemoryMbytes: 4096,
    defaultTimeoutSecs: 600,
    defaultInput: {
      resultsLimit: 50,
      includePosts: true,
      postsLimit: 30,
      includeVideos: true,
      videosLimit: 30,
    },
    maxResultsLimit: 5000,
    tierLimits: {
      FREE: 100,
      PRO: 1000,
      AGENCY: 5000,
      ENTERPRISE: 50000,
    },
    costEstimatePer1kResults: 4.0,
  },

  // TikTok Hashtag Analytics
  // https://apify.com/apify/tiktok-hashtag-analytics
  'apify/tiktok-hashtag-analytics': {
    id: 'apify/tiktok-hashtag-analytics',
    name: 'TikTok Hashtag Analytics',
    type: 'tiktok-hashtag',
    description: 'Analyze TikTok hashtags and get trending posts',
    defaultMemoryMbytes: 4096,
    defaultTimeoutSecs: 600,
    defaultInput: {
      resultsLimit: 100,
      tab: 'top',
      timeRange: 'week',
    },
    maxResultsLimit: 10000,
    tierLimits: {
      FREE: 100,
      PRO: 1000,
      AGENCY: 5000,
      ENTERPRISE: 50000,
    },
    costEstimatePer1kResults: 3.5,
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get actor configuration by ID
 */
export function getActorConfig(actorId: ActorId): ActorConfig {
  const config = ACTOR_CONFIGS[actorId];
  if (!config) {
    throw new Error(`Unknown actor ID: ${actorId}`);
  }
  return config;
}

/**
 * Get actor configuration by scraper type
 */
export function getActorConfigByType(type: ScraperType): ActorConfig {
  const config = Object.values(ACTOR_CONFIGS).find(c => c.type === type);
  if (!config) {
    throw new Error(`No actor configured for type: ${type}`);
  }
  return config;
}

/**
 * Get tier limit for a specific actor
 */
export function getTierLimit(actorId: ActorId, tier: TierType): number {
  const config = getActorConfig(actorId);
  return config.tierLimits[tier] ?? TIER_LIMITS[tier] ?? TIER_LIMITS.FREE;
}

/**
 * Get rate limit configuration for a tier
 */
export function getRateLimitConfig(tier: TierType): RateLimitConfig {
  return RATE_LIMITS[tier] ?? RATE_LIMITS.FREE;
}

/**
 * Check if tier can use specific actor
 */
export function canTierUseActor(actorId: ActorId, tier: TierType): boolean {
  // All tiers can use all actors, just with different limits
  return true;
}

/**
 * Get cost estimate for a scraping job
 */
export function estimateCost(
  actorId: ActorId,
  expectedResults: number
): number {
  const config = getActorConfig(actorId);
  return (config.costEstimatePer1kResults * expectedResults) / 1000;
}

/**
 * Validate input against actor limits
 */
export function validateInput(
  actorId: ActorId,
  input: Record<string, unknown>,
  tier: TierType
): { valid: boolean; errors: string[] } {
  const config = getActorConfig(actorId);
  const errors: string[] = [];

  // Check results limit
  const resultsLimit = input.resultsLimit as number | undefined;
  if (resultsLimit !== undefined) {
    if (resultsLimit > config.maxResultsLimit) {
      errors.push(
        `resultsLimit (${resultsLimit}) exceeds maximum allowed (${config.maxResultsLimit})`
      );
    }
    if (resultsLimit > config.tierLimits[tier]) {
      errors.push(
        `resultsLimit (${resultsLimit}) exceeds tier ${tier} limit (${config.tierLimits[tier]})`
      );
    }
  }

  // Actor-specific validations
  switch (actorId) {
    case 'apify/instagram-profile-scraper': {
      const usernames = input.usernames as string[] | undefined;
      if (!usernames || usernames.length === 0) {
        errors.push('At least one username is required');
      }
      if (usernames && usernames.length > 100) {
        errors.push('Maximum 100 usernames allowed per run');
      }
      break;
    }

    case 'apify/instagram-post-scraper': {
      const urls = input.urls as string[] | undefined;
      const username = input.username as string | undefined;
      if ((!urls || urls.length === 0) && !username) {
        errors.push('Either urls or username is required');
      }
      break;
    }

    case 'apify/instagram-hashtag-scraper': {
      const hashtags = input.hashtags as string[] | undefined;
      if (!hashtags || hashtags.length === 0) {
        errors.push('At least one hashtag is required');
      }
      if (hashtags && hashtags.length > 50) {
        errors.push('Maximum 50 hashtags allowed per run');
      }
      break;
    }

    case 'apify/instagram-comment-scraper': {
      const postUrls = input.postUrls as string[] | undefined;
      if (!postUrls || postUrls.length === 0) {
        errors.push('At least one post URL is required');
      }
      if (postUrls && postUrls.length > 100) {
        errors.push('Maximum 100 post URLs allowed per run');
      }
      break;
    }

    case 'apify/tiktok-scraper': {
      const profiles = input.profiles as string[] | undefined;
      if (!profiles || profiles.length === 0) {
        errors.push('At least one profile is required');
      }
      if (profiles && profiles.length > 100) {
        errors.push('Maximum 100 profiles allowed per run');
      }
      break;
    }

    case 'apify/tiktok-hashtag-analytics': {
      const tiktokHashtags = input.hashtags as string[] | undefined;
      if (!tiktokHashtags || tiktokHashtags.length === 0) {
        errors.push('At least one hashtag is required');
      }
      if (tiktokHashtags && tiktokHashtags.length > 50) {
        errors.push('Maximum 50 hashtags allowed per run');
      }
      break;
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Build actor input with defaults and user overrides
 */
export function buildActorInput(
  actorId: ActorId,
  userInput: Record<string, unknown>,
  tier: TierType
): Record<string, unknown> {
  const config = getActorConfig(actorId);
  
  // Apply defaults
  const input: Record<string, unknown> = {
    ...config.defaultInput,
    ...userInput,
  };

  // Enforce tier limits
  const tierLimit = getTierLimit(actorId, tier);
  if ((input.resultsLimit as number) > tierLimit) {
    input.resultsLimit = tierLimit;
  }

  return input;
}

/**
 * Get suggested timeout for an actor based on input
 */
export function getSuggestedTimeout(
  actorId: ActorId,
  input: Record<string, unknown>
): number {
  const config = getActorConfig(actorId);
  const resultsLimit = (input.resultsLimit as number) || 1;
  
  // Base timeout + additional time per result batch
  const baseTimeout = config.defaultTimeoutSecs;
  const additionalTime = Math.ceil(resultsLimit / 50) * 60; // +1 min per 50 results
  
  return Math.min(baseTimeout + additionalTime, 3600); // Max 1 hour
}

/**
 * List all available actors for a tier
 */
export function listAvailableActors(tier: TierType): ActorConfig[] {
  return Object.values(ACTOR_CONFIGS).map(config => ({
    ...config,
    // Include tier-specific limit info
    tierLimits: {
      ...config.tierLimits,
      [tier]: getTierLimit(config.id, tier),
    },
  }));
}
