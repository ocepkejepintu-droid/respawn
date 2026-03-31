# Apify Integration Service

Complete Apify API integration for Real Buzzer SaaS - Social media scraping with queue management, caching, and usage tracking.

## Features

- **Actor Execution**: Run Apify actors for Instagram and TikTok scraping
- **Queue Management**: Priority-based job queue with rate limiting
- **Result Caching**: Redis-backed caching to minimize API calls
- **Webhook Handling**: Receive async completion notifications
- **Usage Tracking**: Per-workspace quota management with tier limits
- **Retry Logic**: Exponential backoff for failed requests

## Supported Actors

| Actor | ID | Description |
|-------|-----|-------------|
| Instagram Profile Scraper | `apify/instagram-profile-scraper` | Profile data, followers, posts |
| Instagram Post Scraper | `apify/instagram-post-scraper` | Posts by URL or username |
| Instagram Hashtag Scraper | `apify/instagram-hashtag-scraper` | Posts by hashtag |
| Instagram Comment Scraper | `apify/instagram-comment-scraper` | Comments from posts |
| TikTok Scraper | `apify/tiktok-scraper` | TikTok profiles and videos |
| TikTok Hashtag Analytics | `apify/tiktok-hashtag-analytics` | Hashtag trends and analytics |

## Tier Limits

| Tier | Monthly Scrapes | Concurrent Runs | Rate Limit |
|------|-----------------|-----------------|------------|
| FREE | 100 | 1 | 10/min |
| PRO | 1,000 | 3 | 60/min |
| AGENCY | 5,000 | 10 | 300/min |
| ENTERPRISE | 50,000 | 25 | 1000/min |

## Quick Start

```typescript
import { queueJob, checkQuota, ACTOR_IDS } from '@/server/services/apify';

// Check quota before scraping
const quota = await checkQuota('workspace-123', 'PRO');
console.log(`Remaining: ${quota.remaining}/${quota.limit}`);

// Queue a scraping job
const job = await queueJob(
  'workspace-123',
  ACTOR_IDS.INSTAGRAM_PROFILE_SCRAPER,
  { usernames: ['nike'], includePosts: true, postsLimit: 12 },
  { tier: 'PRO', priority: 10 }
);

console.log(`Job queued: ${job.id}`);
```

## Instagram Service

```typescript
import { instagramService } from '@/server/services/scrapers';

// Scrape profile with analytics
const { profile, analytics } = await instagramService.getProfileWithAnalytics(
  'workspace-123',
  'nike',
  'PRO'
);

console.log(`Followers: ${profile.followersCount}`);
console.log(`Engagement Rate: ${analytics.avgEngagementRate.toFixed(2)}%`);

// Analyze hashtag
const hashtagData = await instagramService.analyzeHashtag(
  'workspace-123',
  'fitness',
  'PRO'
);

// Compare multiple profiles
const comparison = await instagramService.compareProfiles(
  'workspace-123',
  ['nike', 'adidas', 'puma'],
  'PRO'
);
```

## TikTok Service

```typescript
import { tiktokService } from '@/server/services/scrapers';

// Scrape TikTok profile
const { profile, analytics } = await tiktokService.getProfileWithAnalytics(
  'workspace-123',
  'charlidamelio',
  'PRO'
);

// Analyze hashtag trend
const trend = await tiktokService.analyzeHashtagTrend(
  'workspace-123',
  'fyp',
  'PRO'
);

// Discover trending content
const trending = await tiktokService.discoverTrending(
  'workspace-123',
  'PRO',
  ['fyp', 'viral', 'trending']
);
```

## Competitor Monitoring

```typescript
import { competitorMonitor } from '@/server/services/scrapers';

// Create a monitor
const monitor = await competitorMonitor.createMonitor(
  'workspace-123',
  'competitor_handle',
  'instagram',
  {
    checkFrequency: 'daily',
    trackingMetrics: {
      followers: true,
      posts: true,
      engagement: true,
      hashtags: true,
    },
    alertThresholds: {
      followerChangePercent: 5,
      engagementChangePercent: 10,
    },
  },
  'PRO'
);

// Get alerts
const alerts = await competitorMonitor.getWorkspaceAlerts('workspace-123', {
  unreadOnly: true,
});

// Generate report
const report = await competitorMonitor.generateReport(monitor.id, 30);
```

## Hashtag Tracking

```typescript
import { hashtagTracker } from '@/server/services/scrapers';

// Create a tracker
const tracker = await hashtagTracker.createTracker(
  'workspace-123',
  'marketing',
  'instagram',
  { checkFrequency: 'daily' },
  'PRO'
);

// Analyze trend
const analysis = await hashtagTracker.analyzeTrend(tracker.id, 30);
console.log(`Trend direction: ${analysis.trendDirection}`);
console.log(`Predicted posts (24h): ${analysis.predictions.next24h}`);

// Discover trending hashtags
const trending = await hashtagTracker.discoverTrendingHashtags('workspace-123', 20);
```

## Webhook Configuration

Set up the webhook endpoint to receive async completion events:

```env
APIFY_WEBHOOK_URL=https://your-domain.com/api/webhooks/apify
APIFY_WEBHOOK_SECRET=your_secret_here
```

The webhook endpoint handles:
- `ACTOR.RUN.SUCCEEDED` - Fetch results, cache, update job
- `ACTOR.RUN.FAILED` - Mark job failed, log error
- `ACTOR.RUN.TIMED_OUT` - Mark job failed, retry if needed
- `ACTOR.RUN.ABORTED` - Mark job cancelled

## Error Handling

```typescript
import { ApifyError, QuotaExceededError, RateLimitError } from '@/types/apify';

try {
  const job = await queueJob(workspaceId, actorId, input, { tier });
} catch (error) {
  if (error instanceof QuotaExceededError) {
    // Prompt user to upgrade
    console.log('Quota exceeded - upgrade required');
  } else if (error instanceof RateLimitError) {
    // Retry with backoff
    console.log('Rate limited - retrying...');
  } else if (error instanceof ApifyError) {
    // Handle other Apify errors
    console.log(`Apify error: ${error.message} (${error.code})`);
  }
}
```

## Configuration

Copy `.env.example` to `.env.local` and configure:

```env
# Required
APIFY_API_TOKEN=your_token_here

# Optional (but recommended)
APIFY_WEBHOOK_SECRET=your_secret
APIFY_WEBHOOK_URL=https://your-domain.com/api/webhooks/apify

# Redis (for caching)
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Request                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Queue Manager                            │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │ Check Quota │→ │ Check Cache │→ │ Add to Queue     │   │
│  └─────────────┘  └─────────────┘  └──────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Job Executor                             │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │ Rate Limit  │→ │ Run Actor   │→ │ Store Result     │   │
│  └─────────────┘  └─────────────┘  └──────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Apify Platform                            │
└─────────────────────────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Webhook       │    │   Poll (fallback)│
└────────┬────────┘    └─────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                 Webhook Handler                             │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │ Validate    │→ │ Process     │→ │ Update Job       │   │
│  └─────────────┘  └─────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Testing

```bash
# Health check
curl https://your-domain.com/api/webhooks/apify

# Test webhook (development)
curl -X PATCH https://your-domain.com/api/webhooks/apify \
  -H "Content-Type: application/json" \
  -d '{"runId": "abc123", "status": "SUCCEEDED"}'
```

## License

Internal use only - Real Buzzer SaaS
