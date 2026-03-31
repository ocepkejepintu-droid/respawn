import { PrismaClient, UserRole, SubscriptionTier, SubscriptionStatus, Platform, AnalysisType } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // ============================================
  // CLEANUP (optional - remove if you want to keep existing data)
  // ============================================
  console.log('Cleaning up existing data...')
  await prisma.auditLog.deleteMany({})
  await prisma.usageLog.deleteMany({})
  await prisma.analysisReport.deleteMany({})
  await prisma.scrapedPost.deleteMany({})
  await prisma.hashtagTrack.deleteMany({})
  await prisma.competitor.deleteMany({})
  await prisma.workspaceMember.deleteMany({})
  await prisma.subscription.deleteMany({})
  await prisma.workspace.deleteMany({})
  await prisma.account.deleteMany({})
  await prisma.session.deleteMany({})
  await prisma.user.deleteMany({})
  console.log('Cleanup complete.')

  // ============================================
  // CREATE USERS
  // ============================================
  console.log('Creating users...')
  
  const ownerUser = await prisma.user.create({
    data: {
      id: 'user_owner_001',
      name: 'Demo Owner',
      email: 'owner@realbuzzer.com',
      emailVerified: new Date(),
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    },
  })

  const adminUser = await prisma.user.create({
    data: {
      id: 'user_admin_001',
      name: 'Demo Admin',
      email: 'admin@realbuzzer.com',
      emailVerified: new Date(),
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    },
  })

  const memberUser = await prisma.user.create({
    data: {
      id: 'user_member_001',
      name: 'Demo Member',
      email: 'member@realbuzzer.com',
      emailVerified: new Date(),
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
    },
  })

  const proUser = await prisma.user.create({
    data: {
      id: 'user_pro_001',
      name: 'Pro User',
      email: 'pro@realbuzzer.com',
      emailVerified: new Date(),
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pro',
    },
  })

  console.log(`✅ Created ${4} users`)

  // ============================================
  // CREATE WORKSPACES
  // ============================================
  console.log('Creating workspaces...')

  const freeWorkspace = await prisma.workspace.create({
    data: {
      id: 'ws_free_001',
      name: 'Demo Agency (Free)',
      slug: 'demo-agency-free',
      description: 'A demo workspace on the free tier',
      logoUrl: 'https://via.placeholder.com/150',
      website: 'https://demo-agency.com',
      ownerId: ownerUser.id,
      isActive: true,
    },
  })

  const proWorkspace = await prisma.workspace.create({
    data: {
      id: 'ws_pro_001',
      name: 'Pro Marketing Team',
      slug: 'pro-marketing-team',
      description: 'Professional marketing team workspace',
      logoUrl: 'https://via.placeholder.com/150',
      website: 'https://promarketing.com',
      ownerId: proUser.id,
      isActive: true,
    },
  })

  console.log(`✅ Created ${2} workspaces`)

  // ============================================
  // CREATE SUBSCRIPTIONS
  // ============================================
  console.log('Creating subscriptions...')

  await prisma.subscription.create({
    data: {
      workspaceId: freeWorkspace.id,
      tier: SubscriptionTier.FREE,
      status: SubscriptionStatus.ACTIVE,
      maxCompetitors: 3,
      maxHashtagTracks: 5,
      maxScrapedPosts: 1000,
      maxAnalysisReports: 5,
      maxTeamMembers: 1,
    },
  })

  await prisma.subscription.create({
    data: {
      workspaceId: proWorkspace.id,
      tier: SubscriptionTier.PRO,
      status: SubscriptionStatus.ACTIVE,
      stripeCustomerId: 'cus_demo_pro_001',
      stripeSubscriptionId: 'sub_demo_pro_001',
      stripePriceId: 'price_demo_pro_monthly',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      maxCompetitors: 10,
      maxHashtagTracks: 20,
      maxScrapedPosts: 10000,
      maxAnalysisReports: 50,
      maxTeamMembers: 5,
    },
  })

  console.log(`✅ Created ${2} subscriptions`)

  // ============================================
  // CREATE WORKSPACE MEMBERS
  // ============================================
  console.log('Creating workspace members...')

  // Free workspace - just the owner
  await prisma.workspaceMember.create({
    data: {
      workspaceId: freeWorkspace.id,
      userId: ownerUser.id,
      role: UserRole.OWNER,
    },
  })

  // Pro workspace - owner, admin, and member
  await prisma.workspaceMember.create({
    data: {
      workspaceId: proWorkspace.id,
      userId: proUser.id,
      role: UserRole.OWNER,
    },
  })

  await prisma.workspaceMember.create({
    data: {
      workspaceId: proWorkspace.id,
      userId: adminUser.id,
      role: UserRole.ADMIN,
    },
  })

  await prisma.workspaceMember.create({
    data: {
      workspaceId: proWorkspace.id,
      userId: memberUser.id,
      role: UserRole.MEMBER,
    },
  })

  console.log(`✅ Created ${4} workspace members`)

  // ============================================
  // CREATE COMPETITORS
  // ============================================
  console.log('Creating competitors...')

  const competitors = [
    {
      id: 'comp_001',
      workspaceId: proWorkspace.id,
      platform: Platform.INSTAGRAM,
      handle: 'nike',
      displayName: 'Nike',
      profileUrl: 'https://instagram.com/nike',
      avatarUrl: 'https://via.placeholder.com/100',
      bio: 'Just Do It.',
      followerCount: 350000000,
      followingCount: 100,
      postCount: 1500,
      metadata: { verified: true, business: true },
    },
    {
      id: 'comp_002',
      workspaceId: proWorkspace.id,
      platform: Platform.INSTAGRAM,
      handle: 'adidas',
      displayName: 'Adidas',
      profileUrl: 'https://instagram.com/adidas',
      avatarUrl: 'https://via.placeholder.com/100',
      bio: 'Impossible is Nothing',
      followerCount: 280000000,
      followingCount: 150,
      postCount: 2200,
      metadata: { verified: true, business: true },
    },
    {
      id: 'comp_003',
      workspaceId: proWorkspace.id,
      platform: Platform.TIKTOK,
      handle: 'nike',
      displayName: 'Nike',
      profileUrl: 'https://tiktok.com/@nike',
      avatarUrl: 'https://via.placeholder.com/100',
      bio: 'Just Do It on TikTok',
      followerCount: 5000000,
      followingCount: 50,
      postCount: 800,
      metadata: { verified: true },
    },
    {
      id: 'comp_004',
      workspaceId: freeWorkspace.id,
      platform: Platform.INSTAGRAM,
      handle: 'starbucks',
      displayName: 'Starbucks',
      profileUrl: 'https://instagram.com/starbucks',
      avatarUrl: 'https://via.placeholder.com/100',
      bio: 'To inspire and nurture the human spirit',
      followerCount: 36000000,
      followingCount: 200,
      postCount: 3000,
      metadata: { verified: true, business: true },
    },
  ]

  for (const competitor of competitors) {
    await prisma.competitor.create({ data: competitor as any })
  }

  console.log(`✅ Created ${competitors.length} competitors`)

  // ============================================
  // CREATE HASHTAG TRACKS
  // ============================================
  console.log('Creating hashtag tracks...')

  const hashtags = [
    {
      id: 'htag_001',
      workspaceId: proWorkspace.id,
      tag: 'digitalmarketing',
      platform: Platform.INSTAGRAM,
      description: 'Digital marketing trends and strategies',
      postCount: 25000000,
      avgEngagement: 4.5,
      trendingScore: 85,
    },
    {
      id: 'htag_002',
      workspaceId: proWorkspace.id,
      tag: 'sneakers',
      platform: Platform.INSTAGRAM,
      description: 'Sneaker culture and releases',
      postCount: 45000000,
      avgEngagement: 6.2,
      trendingScore: 92,
    },
    {
      id: 'htag_003',
      workspaceId: proWorkspace.id,
      tag: 'fitnessmotivation',
      platform: Platform.TIKTOK,
      description: 'Fitness inspiration content',
      postCount: 120000000,
      avgEngagement: 8.5,
      trendingScore: 78,
    },
    {
      id: 'htag_004',
      workspaceId: freeWorkspace.id,
      tag: 'coffee',
      platform: Platform.INSTAGRAM,
      description: 'Coffee culture and cafe life',
      postCount: 180000000,
      avgEngagement: 5.1,
      trendingScore: 70,
    },
  ]

  for (const hashtag of hashtags) {
    await prisma.hashtagTrack.create({ data: hashtag as any })
  }

  console.log(`✅ Created ${hashtags.length} hashtag tracks`)

  // ============================================
  // CREATE SCRAPED POSTS
  // ============================================
  console.log('Creating scraped posts...')

  const posts = [
    {
      id: 'post_001',
      workspaceId: proWorkspace.id,
      competitorId: 'comp_001',
      platformPostId: 'ig_post_001',
      platform: Platform.INSTAGRAM,
      contentType: 'image',
      caption: 'Introducing the new Air Max collection. #JustDoIt #AirMax #Nike',
      mediaUrls: ['https://via.placeholder.com/1080x1080'],
      permalink: 'https://instagram.com/p/abc123',
      likesCount: 1250000,
      commentsCount: 8500,
      sharesCount: 12000,
      viewsCount: 0,
      engagementRate: 5.8,
      postedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      hashtags: ['JustDoIt', 'AirMax', 'Nike'],
      mentions: [],
      isSponsored: true,
      metadata: { dimensions: { width: 1080, height: 1080 } },
      sentimentScore: 0.85,
      topics: ['product launch', 'sneakers'],
      keywords: ['air max', 'collection', 'new'],
    },
    {
      id: 'post_002',
      workspaceId: proWorkspace.id,
      competitorId: 'comp_001',
      platformPostId: 'ig_post_002',
      platform: Platform.INSTAGRAM,
      contentType: 'video',
      caption: 'Behind the scenes with our athletes 🏃‍♂️💨',
      mediaUrls: ['https://via.placeholder.com/1080x1920'],
      permalink: 'https://instagram.com/p/def456',
      likesCount: 2100000,
      commentsCount: 15000,
      sharesCount: 25000,
      viewsCount: 15000000,
      engagementRate: 7.2,
      postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      hashtags: ['Nike', 'Athletes', 'Training'],
      mentions: ['@lebron', '@serenawilliams'],
      isSponsored: false,
      metadata: { duration: 45, dimensions: { width: 1080, height: 1920 } },
      sentimentScore: 0.92,
      topics: ['athletes', 'behind the scenes'],
      keywords: ['training', 'athletes', 'sports'],
    },
    {
      id: 'post_003',
      workspaceId: proWorkspace.id,
      competitorId: 'comp_002',
      platformPostId: 'ig_post_003',
      platform: Platform.INSTAGRAM,
      contentType: 'carousel',
      caption: 'The new Ultraboost is here. Experience energy return like never before.',
      mediaUrls: ['https://via.placeholder.com/1080x1080', 'https://via.placeholder.com/1080x1080'],
      permalink: 'https://instagram.com/p/ghi789',
      likesCount: 980000,
      commentsCount: 5200,
      sharesCount: 8000,
      viewsCount: 0,
      engagementRate: 4.9,
      postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      hashtags: ['Ultraboost', 'Adidas', 'Running'],
      mentions: [],
      isSponsored: true,
      metadata: { slideCount: 5, dimensions: { width: 1080, height: 1080 } },
      sentimentScore: 0.78,
      topics: ['product launch', 'running'],
      keywords: ['ultraboost', 'energy return', 'running'],
    },
    {
      id: 'post_004',
      workspaceId: freeWorkspace.id,
      competitorId: 'comp_004',
      platformPostId: 'ig_post_004',
      platform: Platform.INSTAGRAM,
      contentType: 'image',
      caption: 'Pumpkin Spice season is back! 🎃☕',
      mediaUrls: ['https://via.placeholder.com/1080x1080'],
      permalink: 'https://instagram.com/p/jkl012',
      likesCount: 850000,
      commentsCount: 12000,
      sharesCount: 45000,
      viewsCount: 0,
      engagementRate: 6.5,
      postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      hashtags: ['PSL', 'PumpkinSpice', 'Starbucks'],
      mentions: [],
      isSponsored: false,
      metadata: { dimensions: { width: 1080, height: 1080 } },
      sentimentScore: 0.88,
      topics: ['seasonal', 'beverages'],
      keywords: ['pumpkin spice', 'seasonal', 'coffee'],
    },
  ]

  for (const post of posts) {
    await prisma.scrapedPost.create({ data: post as any })
  }

  console.log(`✅ Created ${posts.length} scraped posts`)

  // ============================================
  // CREATE ANALYSIS REPORTS
  // ============================================
  console.log('Creating analysis reports...')

  const reports = [
    {
      id: 'report_001',
      workspaceId: proWorkspace.id,
      createdById: proUser.id,
      title: 'Q1 Competitor Analysis - Nike vs Adidas',
      description: 'Comprehensive analysis of Nike and Adidas Instagram performance in Q1',
      type: AnalysisType.COMPETITOR_ANALYSIS,
      status: 'COMPLETED' as const,
      dateRangeStart: new Date('2024-01-01'),
      dateRangeEnd: new Date('2024-03-31'),
      config: { competitors: ['comp_001', 'comp_002'], platforms: ['INSTAGRAM'] },
      results: {
        totalPosts: 245,
        avgEngagement: 5.85,
        topPost: 'post_002',
        competitorComparison: [
          { handle: 'nike', avgLikes: 1500000, avgComments: 10000 },
          { handle: 'adidas', avgLikes: 980000, avgComments: 5200 },
        ],
      },
      insights: [
        'Nike is outperforming Adidas by 53% in average engagement',
        'Video content generates 2.3x more engagement than static images',
        'Posts published on Tuesdays see 15% higher engagement',
      ],
      recommendations: [
        'Increase video content production by 40%',
        'Focus on Tuesday and Thursday posting schedule',
        'Leverage athlete partnerships for higher reach',
      ],
      pdfUrl: 'https://storage.example.com/reports/report_001.pdf',
      startedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 47 * 60 * 60 * 1000),
    },
    {
      id: 'report_002',
      workspaceId: proWorkspace.id,
      createdById: adminUser.id,
      title: 'Hashtag Performance Report',
      description: 'Analysis of tracked hashtag performance over the last 30 days',
      type: AnalysisType.HASHTAG_PERFORMANCE,
      status: 'COMPLETED' as const,
      dateRangeStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      dateRangeEnd: new Date(),
      config: { hashtags: ['digitalmarketing', 'sneakers', 'fitnessmotivation'] },
      results: {
        topHashtag: 'sneakers',
        trendingUp: ['fitnessmotivation'],
        trendingDown: [],
      },
      insights: [
        '#sneakers has the highest engagement rate at 6.2%',
        '#fitnessmotivation is trending up with 15% growth',
      ],
      recommendations: [
        'Use #sneakers for maximum reach in sportswear content',
        'Capitalize on rising trend of #fitnessmotivation',
      ],
      startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
    },
    {
      id: 'report_003',
      workspaceId: proWorkspace.id,
      createdById: proUser.id,
      title: 'Monthly Content Trends',
      description: 'Content trend analysis for March 2024',
      type: AnalysisType.CONTENT_TRENDS,
      status: 'PROCESSING' as const,
      dateRangeStart: new Date('2024-03-01'),
      dateRangeEnd: new Date('2024-03-31'),
      config: { platforms: ['INSTAGRAM', 'TIKTOK'] },
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      insights: [],
      recommendations: [],
    },
  ]

  for (const report of reports) {
    await prisma.analysisReport.create({ data: report as any })
  }

  console.log(`✅ Created ${reports.length} analysis reports`)

  // ============================================
  // CREATE USAGE LOGS
  // ============================================
  console.log('Creating usage logs...')

  const usageLogs = [
    {
      workspaceId: proWorkspace.id,
      userId: proUser.id,
      action: 'scrape_posts',
      resourceType: 'competitor',
      resourceId: 'comp_001',
      count: 50,
      metadata: { platform: 'INSTAGRAM', dateRange: '7d' },
    },
    {
      workspaceId: proWorkspace.id,
      userId: adminUser.id,
      action: 'generate_report',
      resourceType: 'report',
      resourceId: 'report_001',
      count: 1,
      metadata: { type: 'COMPETITOR_ANALYSIS' },
    },
    {
      workspaceId: freeWorkspace.id,
      userId: ownerUser.id,
      action: 'add_competitor',
      resourceType: 'competitor',
      resourceId: 'comp_004',
      count: 1,
      metadata: { platform: 'INSTAGRAM', handle: 'starbucks' },
    },
  ]

  for (const log of usageLogs) {
    await prisma.usageLog.create({ data: log as any })
  }

  console.log(`✅ Created ${usageLogs.length} usage logs`)

  // ============================================
  // UPDATE SUBSCRIPTION USAGE
  // ============================================
  console.log('Updating subscription usage counts...')

  await prisma.subscription.update({
    where: { workspaceId: proWorkspace.id },
    data: {
      usedCompetitorSlots: 3,
      usedHashtagTracks: 3,
      usedScrapedPosts: 4,
      usedAnalysisReports: 3,
    },
  })

  await prisma.subscription.update({
    where: { workspaceId: freeWorkspace.id },
    data: {
      usedCompetitorSlots: 1,
      usedHashtagTracks: 1,
      usedScrapedPosts: 1,
      usedAnalysisReports: 0,
    },
  })

  console.log('✅ Updated subscription usage counts')

  // ============================================
  // SEED COMPLETE
  // ============================================
  console.log('')
  console.log('🎉 Database seed completed successfully!')
  console.log('')
  console.log('📊 Summary:')
  console.log('  • 4 Users created (owner@, admin@, member@, pro@realbuzzer.com)')
  console.log('  • 2 Workspaces created (Free & Pro tiers)')
  console.log('  • 4 Competitors added')
  console.log('  • 4 Hashtags being tracked')
  console.log('  • 4 Scraped posts cached')
  console.log('  • 3 Analysis reports generated')
  console.log('')
  console.log('🔑 Test Credentials:')
  console.log('  Use any email with your OAuth provider (Google/GitHub)')
  console.log('  or configure credentials provider for testing.')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
