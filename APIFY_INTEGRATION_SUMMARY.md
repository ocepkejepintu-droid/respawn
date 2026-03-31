# Apify Integration Service - Implementation Summary

## Overview

Complete Apify API integration service for Real Buzzer SaaS. This service provides social media scraping capabilities for Instagram and TikTok with queue management, result caching, usage tracking, and webhook handling.

## Files Created

### 1. Types (`src/types/apify.ts`)
**Purpose**: Complete TypeScript type definitions for Apify integration

**Key Types**:
- `ApifyActorRun`, `ApifyDataset` - Core Apify API responses
- `ActorId`, `ScraperType`, `TierType` - Enumeration types
- `ActorInput` unions for all actor input types
- Output types: `InstagramProfile`, `InstagramPost`, `TikTokProfile`, `TikTokPost`, etc.
- `ScrapingJob`, `ScrapingResult` - Job queue types
- `QuotaInfo`, `WorkspaceUsage` - Usage tracking types
- Error classes: `ApifyError`, `QuotaExceededError`, `RateLimitError`

### 2. Apify Client (`src/server/services/apify/client.ts`)
**Purpose**: Low-level Apify API client with retry logic

**Features**:
- Exponential backoff retry mechanism
- Rate limit handling with automatic retries
- Actor run management (start, get, abort, resurrect)
- Dataset operations (get items, pagination)
- Webhook management
- Health check utilities

### 3. Actor Configurations (`src/server/services/apify/actors.ts`)
**Purpose**: Actor definitions, tier limits, and input validation

**Features**:
- Actor IDs from Apify Store
- Tier limits: FREE (100), PRO (1,000), AGENCY (5,000), ENTERPRISE (50,000)
- Rate limit configurations per tier
- Input validation for each actor type
- Cost estimation
- Default input schemas

### 4. Job Executor (`src/server/services/apify/executor.ts`)
**Purpose**: Queue management and job execution

**Features**:
- Priority-based job queue (Redis-backed)
- Concurrent execution limit (5 default)
- Result caching with configurable TTL
- Retry logic (3 attempts with backoff)
- Event emitter for job status changes
- Queue status monitoring

### 5. Quota Manager (`src/server/services/apify/quota-manager.ts`)
**Purpose**: Usage tracking and rate limiting per workspace

**Features**:
- Per-workspace quota tracking
- Monthly reset handling
- Rate limiting (per-second, per-minute, concurrent)
- Usage history tracking
- Global usage statistics
- Workspaces near limit monitoring

### 6. Webhook Handler (`src/server/services/apify/webhook-handler.ts`)
**Purpose**: Process Apify webhook events

**Features**:
- Signature validation
- Duplicate event detection
- Event type handling (SUCCEEDED, FAILED, TIMED_OUT, ABORTED)
- Retry scheduling for failed processing
- Alert generation
- Processing statistics

### 7. Instagram Service (`src/server/services/scrapers/instagram.service.ts`)
**Purpose**: High-level Instagram scraping operations

**Features**:
- Profile scraping with analytics
- Post scraping by username or URL
- Hashtag analysis with related hashtags
- Comments scraping with sentiment analysis
- Profile comparison
- Hashtag trend tracking

### 8. TikTok Service (`src/server/services/scrapers/tiktok.service.ts`)
**Purpose**: High-level TikTok scraping operations

**Features**:
- Profile scraping with analytics
- Hashtag trend analysis
- Video performance analysis
- Trending content discovery
- Profile comparison
- Sound usage tracking

### 9. Competitor Monitor (`src/server/services/scrapers/competitor-monitor.service.ts`)
**Purpose**: Monitor competitor social media accounts

**Features**:
- Create/update/delete monitors
- Automated snapshot taking
- Follower/engagement change alerts
- Trend detection
- Report generation (30/60/90 days)
- Alert management

### 10. Hashtag Tracker (`src/server/services/scrapers/hashtag-tracker.service.ts`)
**Purpose**: Track hashtag trends and performance

**Features**:
- Create/update/delete trackers
- Trend recording (velocity, direction)
- Trend analysis with predictions
- Trending hashtag discovery
- Comprehensive reports
- Milestone alerts

### 11. Webhook API Route (`src/app/api/webhooks/apify/route.ts`)
**Purpose**: HTTP endpoint for Apify webhooks

**Features**:
- POST handler for webhook events
- GET handler for health checks
- PATCH handler for testing/direct updates
- Signature validation
- Error handling with appropriate status codes

### 12. Redis Client (`src/server/redis-client.ts`)
**Purpose**: Redis client (simulated for development)

**Features**:
- In-memory store for development
- Compatible with ioredis/Upstash APIs
- String, Set, Sorted Set, List operations
- TTL support
- JSON helper functions

### 13. Index Files
- `src/server/services/apify/index.ts` - Exports all Apify services
- `src/server/services/scrapers/index.ts` - Exports all scraper services

### 14. tRPC Router (`src/server/routers/apify.ts`)
**Purpose**: tRPC endpoints for all Apify operations

**Routers**:
- `health`, `queueStatus` - Status endpoints
- `getQuota`, `checkQuota`, `getUsageHistory` - Quota management
- `getJobs`, `getJob`, `cancelJob` - Job management
- `instagram.*` - Instagram operations
- `tiktok.*` - TikTok operations
- `monitors.*` - Competitor monitoring
- `hashtagTrackers.*` - Hashtag tracking

### 15. tRPC Setup (`src/server/trpc.ts`)
**Purpose**: tRPC configuration and procedure builders

### 16. Environment Template (`.env.example`)
**Purpose**: Environment variables documentation

**Variables**:
- `APIFY_API_TOKEN` (required)
- `APIFY_WEBHOOK_SECRET` (recommended)
- `APIFY_WEBHOOK_URL` (recommended)
- Redis configuration
- Rate limiting options
- Feature flags

### 17. Documentation (`src/server/services/apify/README.md`)
**Purpose**: Comprehensive usage documentation

## Architecture

```
Client Request
    ↓
[tRPC Router]
    ↓
[Service Layer]
    ↓
[Executor/Quota Manager]
    ↓
[Apify Client] → [Apify API]
    ↓
[Webhook Handler] ← [Apify Webhooks]
    ↓
[Redis Cache/Queue]
```

## Usage Examples

### Basic Scraping
```typescript
import { queueJob, ACTOR_IDS } from '@/server/services/apify';

const job = await queueJob(
  'workspace-123',
  ACTOR_IDS.INSTAGRAM_PROFILE_SCRAPER,
  { usernames: ['nike'] },
  { tier: 'PRO' }
);
```

### Instagram Analytics
```typescript
import { instagramService } from '@/server/services/scrapers';

const { profile, analytics } = await instagramService.getProfileWithAnalytics(
  'workspace-123', 'nike', 'PRO'
);
```

### Competitor Monitoring
```typescript
import { competitorMonitor } from '@/server/services/scrapers';

const monitor = await competitorMonitor.createMonitor(
  'workspace-123', 'competitor', 'instagram',
  { checkFrequency: 'daily' }, 'PRO'
);
```

### Hashtag Tracking
```typescript
import { hashtagTracker } from '@/server/services/scrapers';

const tracker = await hashtagTracker.createTracker(
  'workspace-123', 'marketing', 'instagram',
  { checkFrequency: 'daily' }, 'PRO'
);
```

## Configuration

1. Copy `.env.example` to `.env.local`
2. Set `APIFY_API_TOKEN` from https://console.apify.com/account/integrations
3. Configure Redis (optional for development)
4. Set webhook URL if using async processing

## Integration Checklist

- [ ] Add `APIFY_API_TOKEN` to environment
- [ ] Install uuid package: `npm install uuid && npm install -D @types/uuid`
- [ ] Configure Redis (or use simulated client)
- [ ] Set up webhook endpoint in Apify console
- [ ] Add `apify` router to main tRPC router
- [ ] Implement `getUserTier` function in router
- [ ] Set up scheduled jobs for monitor/tracker processing
- [ ] Add error tracking (Sentry, etc.)

## Next Steps

1. **Database Integration**: Replace simulated Redis with actual Redis/Upstash
2. **Authentication**: Implement proper workspace permission checks
3. **Frontend**: Build UI for job management, analytics display
4. **Scheduling**: Set up cron jobs for monitor/tracker processing
5. **Notifications**: Add email/Slack alerts for quota limits
6. **Testing**: Add unit and integration tests

## File Sizes

| File | Lines | Purpose |
|------|-------|---------|
| `types/apify.ts` | ~500 | Type definitions |
| `apify/client.ts` | ~450 | API client |
| `apify/actors.ts` | ~400 | Actor configs |
| `apify/executor.ts` | ~550 | Queue management |
| `apify/quota-manager.ts` | ~500 | Usage tracking |
| `apify/webhook-handler.ts` | ~550 | Webhook processing |
| `scrapers/instagram.service.ts` | ~650 | Instagram operations |
| `scrapers/tiktok.service.ts` | ~700 | TikTok operations |
| `scrapers/competitor-monitor.service.ts` | ~600 | Competitor tracking |
| `scrapers/hashtag-tracker.service.ts` | ~750 | Hashtag tracking |

**Total**: ~5,650 lines of TypeScript code
