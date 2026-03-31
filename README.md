# 🐝 Real Buzzer - Social Media Intelligence SaaS

> Replace fake engagement with real intelligence. The smarter way to grow on social media.

## Overview

Real Buzzer is a comprehensive social media intelligence platform that helps creators and agencies make data-driven decisions. Instead of using fake "buzzer" bots that hurt your account, Real Buzzer provides:

- 📊 **Competitor Analysis** - Track and analyze competitor strategies
- 📈 **Trend Intelligence** - Discover trending hashtags and content formats
- 👥 **Audience Insights** - Understand your audience with sentiment analysis
- 🎯 **Content Optimization** - Get AI-powered recommendations for better content

## ✨ Features

### Core Modules

| Module | Description | Key Features |
|--------|-------------|--------------|
| **Morning Briefing** | Daily intelligence digest | Trend alerts, competitor activity, overnight insights |
| **Competitor Analysis** | Track your competition | Engagement comparison, content analysis, hashtag overlap |
| **Audience Intelligence** | Understand your audience | Sentiment analysis, demographics, voice of customer |
| **Content Optimization** | Optimize your content | Posting time heatmap, AI recommendations, content calendar |

### Tech Stack

- **Framework:** Next.js 16+ (App Router)
- **Language:** TypeScript 5+
- **Styling:** Tailwind CSS 4
- **UI Components:** shadcn/ui patterns
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js v5
- **API:** tRPC
- **Payments:** Stripe
- **Data Source:** Apify

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Apify account & API token
- Stripe account (for billing)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd real-buzzer-saas

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Initialize database
npm run db:generate
npm run db:migrate
npm run db:seed

# Start development server
npm run dev
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/realbuzzer"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers
GOOGLE_CLIENT_ID="xxx"
GOOGLE_CLIENT_SECRET="xxx"
GITHUB_CLIENT_ID="xxx"
GITHUB_CLIENT_SECRET="xxx"

# Email (for magic links)
EMAIL_SERVER_HOST="smtp.example.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="xxx"
EMAIL_SERVER_PASSWORD="xxx"
EMAIL_FROM="noreply@realbuzzer.com"

# Apify
APIFY_API_TOKEN="your-apify-token"
APIFY_WEBHOOK_URL="https://your-domain.com/api/webhooks/apify"

# Stripe
STRIPE_SECRET_KEY="sk_test_xxx"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"
```

## 📁 Project Structure

```
real-buzzer-saas/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Development seed data
├── src/
│   ├── app/
│   │   ├── (marketing)/       # Marketing pages
│   │   │   ├── page.tsx       # Homepage
│   │   │   ├── pricing/
│   │   │   ├── features/
│   │   │   ├── blog/
│   │   │   └── ...
│   │   ├── (dashboard)/       # App dashboard
│   │   │   ├── page.tsx       # Dashboard home
│   │   │   ├── briefing/
│   │   │   ├── competitors/
│   │   │   ├── audience/
│   │   │   ├── optimize/
│   │   │   └── billing/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/
│   │   │   ├── trpc/[trpc]/
│   │   │   └── webhooks/
│   │   │       ├── apify/
│   │   │       └── stripe/
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                # Base UI components
│   │   ├── dashboard/         # Dashboard components
│   │   ├── marketing/         # Marketing components
│   │   ├── briefing/          # Morning briefing
│   │   ├── competitors/       # Competitor analysis
│   │   ├── audience/          # Audience intelligence
│   │   ├── optimize/          # Content optimization
│   │   ├── billing/           # Billing components
│   │   └── auth/              # Auth components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility libraries
│   ├── server/
│   │   ├── services/          # Business logic
│   │   │   ├── apify/         # Apify integration
│   │   │   ├── scrapers/      # Scraper services
│   │   │   ├── briefing/      # Briefing generation
│   │   │   ├── competitors/   # Competitor analysis
│   │   │   ├── audience/      # Audience analysis
│   │   │   ├── optimize/      # Content optimization
│   │   │   └── billing/       # Billing services
│   │   └── routers/           # tRPC routers
│   ├── trpc/                  # tRPC configuration
│   └── types/                 # TypeScript types
├── .env.example
├── next.config.js
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## 💳 Pricing Tiers

| Feature | FREE | PRO ($29/mo) | AGENCY ($99/mo) |
|---------|------|--------------|-----------------|
| Competitors | 3 | 10 | 50 |
| Hashtag Tracks | 5 | 20 | 100 |
| Scraped Posts | 1,000 | 10,000 | 100,000 |
| Analysis Reports | 5 | 50 | 500 |
| Team Members | 1 | 5 | 20 |
| API Access | ❌ | ✅ | ✅ |
| Priority Support | ❌ | Email | Priority |

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run start            # Start production server

# Database
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run migrations
npm run db:seed          # Seed development data
npm run db:studio        # Open Prisma Studio
npm run db:push          # Push schema changes

# Code quality
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript check
```

### Adding New Features

1. Define types in `src/types/`
2. Create service in `src/server/services/`
3. Add tRPC router in `src/server/routers/`
4. Create components in `src/components/`
5. Add page in `src/app/(dashboard)/`

## 🔧 API Integration

### Apify Actors Used

| Actor | Purpose | Rate Limit |
|-------|---------|------------|
| Instagram Profile Scraper | Profile data | 100/min |
| Instagram Post Scraper | Posts & engagement | 100/min |
| Instagram Hashtag Scraper | Hashtag content | 100/min |
| TikTok Scraper | TikTok data | 100/min |
| TikTok Hashtag Analytics | Hashtag trends | 50/min |
| Comments Scraper | Comment analysis | 50/min |

## 📝 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy

### Self-Hosted

```bash
# Build
docker build -t real-buzzer .

# Run
docker run -p 3000:3000 \
  -e DATABASE_URL=... \
  -e NEXTAUTH_SECRET=... \
  real-buzzer
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Prisma](https://prisma.io/)
- [NextAuth.js](https://next-auth.js.org/)
- [tRPC](https://trpc.io/)
- [Apify](https://apify.com/)
- [Stripe](https://stripe.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

Built with ❤️ by the Real Buzzer team
