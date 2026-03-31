# Real Buzzer Database Setup

This document outlines the database architecture and setup instructions for the Real Buzzer SaaS platform.

## Architecture Overview

### Database Schema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           REAL BUZZER DATABASE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────┐     ┌─────────────┐     ┌──────────────────┐                  │
│  │  users   │────▶│ workspaces  │◀────│   subscription   │                  │
│  └──────────┘     └─────────────┘     └──────────────────┘                  │
│        │                │                                                        │
│        │                │                                                        │
│        ▼                ▼                                                        │
│  ┌──────────────┐  ┌─────────────────┐                                         │
│  │   accounts   │  │ workspace_members│                                         │
│  │   sessions   │  └─────────────────┘                                         │
│  │     etc      │                                                             │
│  └──────────────┘                                                             │
│                                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  ┌─────────────────┐  │
│  │ competitors │  │ hashtag_tracks│  │ scraped_posts │  │ analysis_reports│  │
│  └─────────────┘  └──────────────┘  └───────────────┘  └─────────────────┘  │
│                                                                             │
│  ┌───────────┐  ┌──────────┐                                               │
│  │ usage_logs│  │audit_logs│                                               │
│  └───────────┘  └──────────┘                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Entity Relationships

### Core Entities

| Entity | Description | Key Relations |
|--------|-------------|---------------|
| `User` | Authentication via NextAuth | Owns workspaces, member of workspaces |
| `Workspace` | Multi-tenant container | Has members, subscription, competitors |
| `WorkspaceMember` | Join table with roles | Links users to workspaces |
| `Subscription` | Billing & usage limits | Belongs to workspace |

### Feature Entities

| Entity | Description | Key Relations |
|--------|-------------|---------------|
| `Competitor` | Social accounts being tracked | Belongs to workspace, has posts |
| `HashtagTrack` | Hashtags being monitored | Belongs to workspace |
| `ScrapedPost` | Cached social media content | Belongs to workspace & competitor |
| `AnalysisReport` | Generated insights | Belongs to workspace, created by user |

### Audit & Logging

| Entity | Description | Key Relations |
|--------|-------------|---------------|
| `UsageLog` | Quota tracking | Belongs to workspace & user |
| `AuditLog` | Change tracking | Belongs to workspace |

## Enums

### UserRole
- `OWNER` - Full control, can delete workspace
- `ADMIN` - Can manage members and settings
- `MEMBER` - Read access, limited creation

### SubscriptionTier
- `FREE` - 3 competitors, 5 hashtags, 1 member
- `PRO` - 10 competitors, 20 hashtags, 5 members
- `AGENCY` - 50 competitors, 100 hashtags, 20 members

### SubscriptionStatus
- `ACTIVE` - Paid and current
- `TRIALING` - In trial period
- `PAST_DUE` - Payment failed
- `CANCELED` - Subscription ended

## Quick Start

### 1. Environment Setup

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Random secret for JWT
- `NEXTAUTH_URL` - Your app URL

### 2. Database Initialization

```bash
# Install dependencies
npm install

# Generate Prisma Client
npm run db:generate

# Run migrations (creates tables)
npm run db:migrate

# Seed with demo data
npm run db:seed
```

### 3. Development Workflow

```bash
# After schema changes
npm run db:generate

# Create migration
npm run db:migrate

# Reset database (with seed)
npm run db:reset

# Open Prisma Studio (visual DB editor)
npm run db:studio
```

## Usage Examples

### Creating a Workspace with Subscription

```typescript
import { prisma } from '@/lib/prisma'
import { SubscriptionTier } from '@prisma/client'

const workspace = await prisma.workspace.create({
  data: {
    name: 'My Agency',
    slug: 'my-agency',
    ownerId: userId,
    members: {
      create: {
        userId: userId,
        role: 'OWNER',
      },
    },
    subscription: {
      create: {
        tier: SubscriptionTier.PRO,
        status: 'ACTIVE',
        maxCompetitors: 10,
        maxHashtagTracks: 20,
        maxScrapedPosts: 10000,
        maxAnalysisReports: 50,
        maxTeamMembers: 5,
      },
    },
  },
})
```

### Adding a Competitor

```typescript
import { canAddCompetitor, incrementCompetitorUsage } from '@/lib/db-utils'

// Check quota
if (await canAddCompetitor(workspaceId)) {
  const competitor = await prisma.competitor.create({
    data: {
      workspaceId,
      platform: 'INSTAGRAM',
      handle: 'nike',
      profileUrl: 'https://instagram.com/nike',
      followerCount: 350000000,
    },
  })
  
  // Increment usage
  await incrementCompetitorUsage(workspaceId)
}
```

### Querying with Pagination

```typescript
const posts = await prisma.scrapedPost.findMany({
  where: { workspaceId },
  orderBy: { postedAt: 'desc' },
  skip: (page - 1) * pageSize,
  take: pageSize,
  include: {
    competitor: true,
  },
})

const totalCount = await prisma.scrapedPost.count({
  where: { workspaceId },
})
```

## File Structure

```
prisma/
├── schema.prisma          # Database schema definition
├── seed.ts                # Development seed data
└── migrations/            # Migration files (auto-generated)

src/
├── lib/
│   ├── prisma.ts          # Prisma client singleton
│   ├── auth.ts            # NextAuth configuration
│   └── db-utils.ts        # Database helper functions
├── types/
│   ├── database.ts        # TypeScript types & utilities
│   └── next-auth.d.ts     # NextAuth type extensions
└── app/
    └── api/
        └── auth/
            └── [...nextauth]/
                └── route.ts   # Auth API endpoint
```

## Performance Considerations

### Indexes
The schema includes indexes on:
- Foreign keys (all `*_id` fields)
- Frequently queried fields (`slug`, `status`, `platform`)
- Date ranges for time-series queries
- Array fields for tag/hashtag lookups

### Query Optimization
- Use `select` or `include` to fetch only needed fields
- Use `count()` with `take: 0` for pagination totals
- Consider using `findUnique` with unique constraints

### Connection Pooling
For production with serverless:
```env
# Use connection pooling (e.g., PgBouncer, Supabase Pooler)
DATABASE_URL="postgresql://...?pgbouncer=true"
DIRECT_URL="postgresql://..."  # For migrations
```

## Stripe Integration

The `Subscription` model includes fields for Stripe:
- `stripeCustomerId` - Stripe Customer ID
- `stripeSubscriptionId` - Stripe Subscription ID
- `stripePriceId` - Stripe Price ID

Webhook handling example:
```typescript
// Webhook updates subscription status
await prisma.subscription.update({
  where: { stripeCustomerId: customerId },
  data: {
    status: newStatus,
    currentPeriodEnd: newPeriodEnd,
  },
})
```

## Backups & Maintenance

### PostgreSQL Backup
```bash
pg_dump -h localhost -U postgres real_buzzer > backup.sql
```

### Restore
```bash
psql -h localhost -U postgres real_buzzer < backup.sql
```

## Troubleshooting

### Common Issues

**Migration conflicts:**
```bash
# Reset and reapply
npm run db:reset
```

**Prisma Client out of sync:**
```bash
npm run db:generate
```

**Connection errors:**
- Check DATABASE_URL format
- Ensure PostgreSQL is running
- Verify network access (for remote DBs)

## Support

For schema changes:
1. Edit `prisma/schema.prisma`
2. Run `npm run db:migrate`
3. Update seed data if needed
4. Regenerate Prisma Client
