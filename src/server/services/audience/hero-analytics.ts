import { AnalysisType, Platform, Prisma, ReportStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { analyzeComments, analyzeTextLocal } from '@/server/services/audience/sentiment-analyzer';
import { analyzeCommentsSentiment, getProfileWithAnalytics as getInstagramProfileWithAnalytics } from '@/server/services/scrapers/instagram.service';
import { getProfileWithAnalytics as getTikTokProfileWithAnalytics } from '@/server/services/scrapers/tiktok.service';

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'your', 'you', 'are', 'was',
  'were', 'our', 'about', 'just', 'they', 'them', 'their', 'what', 'when', 'where', 'which',
  'would', 'could', 'should', 'into', 'over', 'under', 'than', 'then', 'there', 'been', 'being',
  'really', 'very', 'more', 'some', 'here', 'only', 'also', 'still', 'because', 'while', 'after',
  'before', 'make', 'made', 'does', 'did', 'done', 'will', 'cant', 'dont', 'from', 'http', 'https',
]);

export type HeroAccountPlatform = 'instagram' | 'tiktok';
export type CommentCategory =
  | 'praise'
  | 'confusion'
  | 'objection'
  | 'buying_intent'
  | 'faq'
  | 'audience_language';

export interface HeroAccountSummary {
  id: string;
  platform: HeroAccountPlatform;
  handle: string;
  displayName: string;
  profileUrl: string;
  avatarUrl?: string;
  verified: boolean;
  followersCount: number;
  followingCount: number;
  postCount: number;
  avgEngagementRate: number;
  avgViews: number;
  avgComments: number;
  avgShares: number;
  bestPostingTimes: string[];
  topHashtags: string[];
  lastSyncedAt?: string;
}

export interface WinningContentItem {
  id: string;
  accountId: string;
  platform: HeroAccountPlatform;
  handle: string;
  title: string;
  caption?: string;
  postUrl: string;
  publishedAt: string;
  topic?: string;
  hook?: string;
  visualFormat?: string;
  editStyle?: string;
  captionType?: string;
  ctaType?: string;
  hashtags: string[];
  metrics: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
    engagementRate: number;
    engagementEfficiency: number;
    repeatabilityScore: number;
    conversionIntentScore: number;
    retentionProxyScore: number;
  };
}

export interface HeroCommentInsight {
  id: string;
  platform: HeroAccountPlatform;
  handle: string;
  contentTitle: string;
  text: string;
  authorHandle?: string;
  postedAt: string;
  likesCount: number;
  category: CommentCategory;
  sentiment: 'positive' | 'negative' | 'neutral';
  intentLabel: string;
  language: string;
}

export interface HeroCommentIntelligence {
  totalComments: number;
  sentiment: { positive: number; negative: number; neutral: number; compound: number };
  categoryBreakdown: Record<CommentCategory, number>;
  topQuestions: Array<{ question: string; frequency: number; suggestedAnswer: string }>;
  painPoints: Array<{ issue: string; frequency: number; severity: 'low' | 'medium' | 'high' }>;
  languagePatterns: string[];
  contentIdeas: string[];
  latestComments: HeroCommentInsight[];
}

export interface HeroContentGap {
  topic: string;
  demandScore: number;
  coverageScore: number;
  opportunityScore: number;
  reason: string;
  suggestedAngle: string;
}

export interface HeroReportSummary {
  id: string;
  title: string;
  createdAt: string;
  source: string;
  insights: string[];
  recommendations: string[];
}

export interface HeroDashboardData {
  handles: { instagramHandle?: string; tiktokHandle?: string };
  overview: {
    accountCount: number;
    contentCount: number;
    commentsAnalyzed: number;
    avgEngagementRate: number;
    updatedAt?: string;
  };
  accounts: HeroAccountSummary[];
  winningContent: WinningContentItem[];
  commentIntelligence: HeroCommentIntelligence;
  contentGaps: HeroContentGap[];
  reports: HeroReportSummary[];
  recommendations: string[];
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export function normalizeHandle(handle?: string | null): string | undefined {
  if (!handle) return undefined;
  const trimmed = handle.trim();
  if (!trimmed) return undefined;
  const withoutUrl = trimmed
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/i, '')
    .replace(/^@/, '');
  return withoutUrl.replace(/\/.*$/, '').trim() || undefined;
}

function tokenize(text: string) {
  return (text.toLowerCase().match(/[a-z0-9#@']+/g) || []).filter(
    (token) => token.length > 2 && !STOP_WORDS.has(token)
  );
}

function getTopTerms(texts: string[], limit: number) {
  const counts = new Map<string, number>();
  texts.forEach((text) => {
    tokenize(text).forEach((token) => {
      counts.set(token, (counts.get(token) || 0) + 1);
    });
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([term]) => term);
}

function extractHook(text?: string | null) {
  if (!text) return null;
  const firstSentence = text.split(/[.!?\n]/)[0]?.trim();
  return firstSentence ? firstSentence.slice(0, 120) : text.trim().slice(0, 120) || null;
}

function detectCaptionType(text?: string | null) {
  if (!text) return 'minimal';
  const lower = text.toLowerCase();
  if (lower.includes('?')) return 'question';
  if (/(story|journey|lesson|today|yesterday|when i)/.test(lower)) return 'storytelling';
  if (/(how to|step|tips|guide|learn)/.test(lower)) return 'educational';
  if (/(offer|sale|book|link in bio|dm|message me)/.test(lower)) return 'promotional';
  return text.length > 160 ? 'long-form' : 'short-form';
}

function detectCtaType(text?: string | null) {
  if (!text) return 'none';
  const lower = text.toLowerCase();
  if (/(dm|message me|send me)/.test(lower)) return 'dm';
  if (/(comment|tell me|drop|reply)/.test(lower)) return 'comment';
  if (/(share|send this)/.test(lower)) return 'share';
  if (/(follow|save)/.test(lower)) return 'follow_or_save';
  if (/(link in bio|book|buy|shop|call)/.test(lower)) return 'conversion';
  return 'none';
}

function detectEditStyle(text?: string | null, hashtags: string[] = []) {
  const source = `${text || ''} ${hashtags.join(' ')}`.toLowerCase();
  if (/(before|after|transformation|results)/.test(source)) return 'before_after';
  if (/(tutorial|how to|step|tips)/.test(source)) return 'educational';
  if (/(story|day in the life|behind the scenes)/.test(source)) return 'storytelling';
  if (/(trend|viral|challenge|fyp)/.test(source)) return 'trend-led';
  return 'standard';
}

function detectTopic(text?: string | null, hashtags: string[] = []) {
  const terms = getTopTerms([text || '', hashtags.join(' ')], 3);
  return terms[0] || null;
}

function scoreEngagementEfficiency(input: {
  engagementRate: number;
  followersCount: number;
  commentsCount: number;
  sharesCount: number;
}) {
  const followerFactor = input.followersCount > 0 ? Math.log10(input.followersCount + 10) : 1;
  return Number((((input.engagementRate * 16) + (input.commentsCount * 0.35) + (input.sharesCount * 0.65)) / followerFactor).toFixed(2));
}

function scoreRepeatability(input: {
  engagementRate: number;
  commentsCount: number;
  hashtags: string[];
  captionType: string;
}) {
  let score = input.engagementRate * 12;
  score += Math.min(12, input.commentsCount * 0.4);
  score += Math.min(8, input.hashtags.length * 1.2);
  if (input.captionType === 'educational' || input.captionType === 'storytelling') score += 6;
  return Number(Math.min(100, Math.max(0, score)).toFixed(2));
}

function scoreConversionIntent(input: {
  ctaType: string;
  commentsCount: number;
  caption?: string | null;
}) {
  let score = 18;
  if (input.ctaType === 'dm' || input.ctaType === 'conversion') score += 30;
  if (input.ctaType === 'comment') score += 12;
  if ((input.caption || '').toLowerCase().match(/(book|buy|book a call|dm me|apply|join)/)) score += 18;
  score += Math.min(20, input.commentsCount * 0.5);
  return Number(Math.min(100, score).toFixed(2));
}

function scoreRetentionProxy(input: {
  isVideo: boolean;
  viewsCount: number;
  commentsCount: number;
  sharesCount: number;
  likesCount: number;
}) {
  if (!input.isVideo && input.viewsCount <= 0) {
    return Number(Math.min(100, input.likesCount * 0.2 + input.commentsCount * 1.2).toFixed(2));
  }
  const viewBase = Math.max(1, input.viewsCount);
  const commentRatio = (input.commentsCount / viewBase) * 100;
  const shareRatio = (input.sharesCount / viewBase) * 100;
  const likeRatio = (input.likesCount / viewBase) * 100;
  return Number(Math.min(100, (commentRatio * 15) + (shareRatio * 24) + (likeRatio * 3)).toFixed(2));
}

function detectLanguage(text: string) {
  const lower = text.toLowerCase();
  if (/\b(yang|dan|dengan|untuk|bagus|bisa|terima kasih)\b/.test(lower)) return 'id';
  if (/\b(que|para|gracias|muy|como|esto)\b/.test(lower)) return 'es';
  return 'en';
}

function classifyCommentCategory(text: string): { category: CommentCategory; intentLabel: string } {
  const lower = text.toLowerCase();
  if (/(price|how much|cost|book|available|dm me|where can i buy|link)/.test(lower)) {
    return { category: 'buying_intent', intentLabel: 'buyer_signal' };
  }
  if (/(how|what|when|where|can you|do you|is this|are you|\?)/.test(lower)) {
    return { category: 'faq', intentLabel: 'question' };
  }
  if (/(confused|dont get|don't get|not sure|what do you mean|explain)/.test(lower)) {
    return { category: 'confusion', intentLabel: 'clarification_needed' };
  }
  if (/(too expensive|bad|hate|problem|issue|doesnt work|doesn't work|scam)/.test(lower)) {
    return { category: 'objection', intentLabel: 'resistance' };
  }
  if (/(love|amazing|great|perfect|awesome|fire|needed this)/.test(lower)) {
    return { category: 'praise', intentLabel: 'positive_reaction' };
  }
  return { category: 'audience_language', intentLabel: 'language_signal' };
}

function buildSuggestedAnswer(question: string) {
  const lower = question.toLowerCase();
  if (/(price|how much|cost)/.test(lower)) return 'Answer with pricing context and a clear next step.';
  if (/(book|available|where can i buy|link)/.test(lower)) return 'Answer with availability and a direct conversion path.';
  if (/(how|what|why)/.test(lower)) return 'Turn this into an educational explainer or short FAQ post.';
  return 'Use this as a FAQ response and test it as a comment-reply template.';
}

function mapPlatform(platform: Platform): HeroAccountPlatform {
  return platform === Platform.TIKTOK ? 'tiktok' : 'instagram';
}

function reportSourceLabel(source: string) {
  switch (source) {
    case 'hero-daily-radar':
      return 'Daily Trend Radar';
    case 'hero-weekly-breakdown':
      return 'Weekly Winner Breakdown';
    default:
      return 'Hero Account Analytics';
  }
}

async function upsertInstagramAccount(workspaceId: string, handle: string) {
  const { profile } = await getInstagramProfileWithAnalytics(workspaceId, handle, 'PRO');
  const account = await prisma.ownedSocialAccount.upsert({
    where: {
      workspaceId_platform_handle: {
        workspaceId,
        platform: Platform.INSTAGRAM,
        handle: profile.username,
      },
    },
    create: {
      workspaceId,
      platform: Platform.INSTAGRAM,
      handle: profile.username,
      profileUrl: `https://instagram.com/${profile.username}`,
      displayName: profile.fullName || profile.username,
      bio: profile.biography,
      avatarUrl: profile.profilePicUrlHD || profile.profilePicUrl,
      followerCount: profile.followersCount,
      followingCount: profile.followsCount,
      postCount: profile.mediaCount,
      isVerified: profile.isVerified,
      lastSyncedAt: new Date(),
      metadata: {} as Prisma.InputJsonValue,
    },
    update: {
      profileUrl: `https://instagram.com/${profile.username}`,
      displayName: profile.fullName || profile.username,
      bio: profile.biography,
      avatarUrl: profile.profilePicUrlHD || profile.profilePicUrl,
      followerCount: profile.followersCount,
      followingCount: profile.followsCount,
      postCount: profile.mediaCount,
      isVerified: profile.isVerified,
      lastSyncedAt: new Date(),
    },
  });

  const postIds = new Map<string, string>();

  for (const post of profile.posts || []) {
    const captionType = detectCaptionType(post.caption);
    const ctaType = detectCtaType(post.caption);
    const engagementRate =
      post.engagementRate ??
      (profile.followersCount > 0 ? ((post.likesCount + post.commentsCount) / profile.followersCount) * 100 : 0);

    const snapshot = await prisma.ownedContentSnapshot.upsert({
      where: {
        workspaceId_platform_platformPostId: {
          workspaceId,
          platform: Platform.INSTAGRAM,
          platformPostId: post.id,
        },
      },
      create: {
        workspaceId,
        ownedAccountId: account.id,
        platformPostId: post.id,
        platform: Platform.INSTAGRAM,
        postUrl: post.url,
        title: extractHook(post.caption) || 'Instagram post',
        caption: post.caption,
        hook: extractHook(post.caption),
        topic: detectTopic(post.caption, post.hashtags),
        visualFormat: post.isVideo ? 'reel_or_video' : 'static_post',
        editStyle: detectEditStyle(post.caption, post.hashtags),
        captionType,
        ctaType,
        publishedAt: new Date(post.timestamp),
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        sharesCount: 0,
        viewsCount: post.videoViewCount || 0,
        engagementRate,
        engagementEfficiency: scoreEngagementEfficiency({
          engagementRate,
          followersCount: profile.followersCount,
          commentsCount: post.commentsCount,
          sharesCount: 0,
        }),
        repeatabilityScore: scoreRepeatability({
          engagementRate,
          commentsCount: post.commentsCount,
          hashtags: post.hashtags,
          captionType,
        }),
        conversionIntentScore: scoreConversionIntent({
          ctaType,
          commentsCount: post.commentsCount,
          caption: post.caption,
        }),
        retentionProxyScore: scoreRetentionProxy({
          isVideo: post.isVideo,
          viewsCount: post.videoViewCount || 0,
          commentsCount: post.commentsCount,
          sharesCount: 0,
          likesCount: post.likesCount,
        }),
        checkpointMetrics: {
          observedAt: new Date().toISOString(),
          latest: { likes: post.likesCount, comments: post.commentsCount, views: post.videoViewCount || 0 },
        } as Prisma.InputJsonValue,
        hashtags: post.hashtags as Prisma.InputJsonValue,
        mentions: post.mentions as Prisma.InputJsonValue,
        keywords: getTopTerms([post.caption || '', post.hashtags.join(' ')], 6) as Prisma.InputJsonValue,
        metadata: {
          shortCode: post.shortCode,
          displayUrl: post.displayUrl,
          isVideo: post.isVideo,
        } as Prisma.InputJsonValue,
      },
      update: {
        title: extractHook(post.caption) || 'Instagram post',
        caption: post.caption,
        hook: extractHook(post.caption),
        topic: detectTopic(post.caption, post.hashtags),
        visualFormat: post.isVideo ? 'reel_or_video' : 'static_post',
        editStyle: detectEditStyle(post.caption, post.hashtags),
        captionType,
        ctaType,
        publishedAt: new Date(post.timestamp),
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        viewsCount: post.videoViewCount || 0,
        engagementRate,
        engagementEfficiency: scoreEngagementEfficiency({
          engagementRate,
          followersCount: profile.followersCount,
          commentsCount: post.commentsCount,
          sharesCount: 0,
        }),
        repeatabilityScore: scoreRepeatability({
          engagementRate,
          commentsCount: post.commentsCount,
          hashtags: post.hashtags,
          captionType,
        }),
        conversionIntentScore: scoreConversionIntent({
          ctaType,
          commentsCount: post.commentsCount,
          caption: post.caption,
        }),
        retentionProxyScore: scoreRetentionProxy({
          isVideo: post.isVideo,
          viewsCount: post.videoViewCount || 0,
          commentsCount: post.commentsCount,
          sharesCount: 0,
          likesCount: post.likesCount,
        }),
        checkpointMetrics: {
          observedAt: new Date().toISOString(),
          latest: { likes: post.likesCount, comments: post.commentsCount, views: post.videoViewCount || 0 },
        } as Prisma.InputJsonValue,
        hashtags: post.hashtags as Prisma.InputJsonValue,
        mentions: post.mentions as Prisma.InputJsonValue,
        keywords: getTopTerms([post.caption || '', post.hashtags.join(' ')], 6) as Prisma.InputJsonValue,
      },
    });

    postIds.set(post.url, snapshot.id);
  }

  for (const post of (profile.posts || []).slice(0, 4)) {
    const snapshotId = postIds.get(post.url);
    if (!snapshotId) continue;
    try {
      const { comments } = await analyzeCommentsSentiment(workspaceId, post.url, 'PRO');
      await prisma.ownedContentComment.deleteMany({ where: { contentSnapshotId: snapshotId } });
      if (comments.length > 0) {
        await prisma.ownedContentComment.createMany({
          data: comments.map((comment) => {
            const category = classifyCommentCategory(comment.text);
            const sentiment = analyzeTextLocal(comment.text);
            return {
              workspaceId,
              ownedAccountId: account.id,
              contentSnapshotId: snapshotId,
              platformCommentId: comment.id,
              platform: Platform.INSTAGRAM,
              text: comment.text,
              authorHandle: comment.ownerUsername,
              postedAt: new Date(comment.timestamp),
              likesCount: comment.likesCount,
              sentiment: sentiment.compound > 0.2 ? 'positive' : sentiment.compound < -0.2 ? 'negative' : 'neutral',
              category: category.category,
              intentLabel: category.intentLabel,
              language: detectLanguage(comment.text),
              metadata: { repliesCount: comment.replies?.length || 0 } as Prisma.InputJsonValue,
            };
          }),
        });
      }
    } catch {
      // Keep refresh resilient when comments are unavailable.
    }
  }
}

async function upsertTikTokAccount(workspaceId: string, handle: string) {
  const { profile } = await getTikTokProfileWithAnalytics(workspaceId, handle, 'PRO');
  const account = await prisma.ownedSocialAccount.upsert({
    where: {
      workspaceId_platform_handle: {
        workspaceId,
        platform: Platform.TIKTOK,
        handle: profile.username,
      },
    },
    create: {
      workspaceId,
      platform: Platform.TIKTOK,
      handle: profile.username,
      profileUrl: `https://www.tiktok.com/@${profile.username}`,
      displayName: profile.nickname || profile.username,
      bio: profile.signature,
      avatarUrl: profile.avatar,
      followerCount: profile.followersCount,
      followingCount: profile.followingCount,
      postCount: profile.videoCount,
      isVerified: profile.verified,
      lastSyncedAt: new Date(),
      metadata: {} as Prisma.InputJsonValue,
    },
    update: {
      profileUrl: `https://www.tiktok.com/@${profile.username}`,
      displayName: profile.nickname || profile.username,
      bio: profile.signature,
      avatarUrl: profile.avatar,
      followerCount: profile.followersCount,
      followingCount: profile.followingCount,
      postCount: profile.videoCount,
      isVerified: profile.verified,
      lastSyncedAt: new Date(),
    },
  });

  for (const post of profile.posts || []) {
    const captionType = detectCaptionType(post.desc);
    const ctaType = detectCtaType(post.desc);
    const engagementRate =
      post.engagementRate ??
      (post.playCount > 0 ? ((post.diggCount + post.commentCount + post.shareCount) / post.playCount) * 100 : 0);

    await prisma.ownedContentSnapshot.upsert({
      where: {
        workspaceId_platform_platformPostId: {
          workspaceId,
          platform: Platform.TIKTOK,
          platformPostId: post.id,
        },
      },
      create: {
        workspaceId,
        ownedAccountId: account.id,
        platformPostId: post.id,
        platform: Platform.TIKTOK,
        postUrl: post.videoUrl,
        title: extractHook(post.desc) || 'TikTok video',
        caption: post.desc,
        hook: extractHook(post.desc),
        topic: detectTopic(post.desc, post.hashtags),
        visualFormat: 'short_video',
        editStyle: detectEditStyle(post.desc, post.hashtags),
        captionType,
        ctaType,
        publishedAt: new Date(post.createTime),
        likesCount: post.diggCount,
        commentsCount: post.commentCount,
        sharesCount: post.shareCount,
        viewsCount: post.playCount,
        engagementRate,
        engagementEfficiency: scoreEngagementEfficiency({
          engagementRate,
          followersCount: profile.followersCount,
          commentsCount: post.commentCount,
          sharesCount: post.shareCount,
        }),
        repeatabilityScore: scoreRepeatability({
          engagementRate,
          commentsCount: post.commentCount,
          hashtags: post.hashtags,
          captionType,
        }),
        conversionIntentScore: scoreConversionIntent({
          ctaType,
          commentsCount: post.commentCount,
          caption: post.desc,
        }),
        retentionProxyScore: scoreRetentionProxy({
          isVideo: true,
          viewsCount: post.playCount,
          commentsCount: post.commentCount,
          sharesCount: post.shareCount,
          likesCount: post.diggCount,
        }),
        checkpointMetrics: {
          observedAt: new Date().toISOString(),
          latest: { likes: post.diggCount, comments: post.commentCount, shares: post.shareCount, views: post.playCount },
        } as Prisma.InputJsonValue,
        hashtags: post.hashtags as Prisma.InputJsonValue,
        mentions: post.mentions as Prisma.InputJsonValue,
        keywords: getTopTerms([post.desc || '', post.hashtags.join(' ')], 6) as Prisma.InputJsonValue,
        metadata: {
          coverUrl: post.coverUrl,
          soundTitle: post.musicInfo?.title,
          soundAuthor: post.musicInfo?.author,
        } as Prisma.InputJsonValue,
      },
      update: {
        title: extractHook(post.desc) || 'TikTok video',
        caption: post.desc,
        hook: extractHook(post.desc),
        topic: detectTopic(post.desc, post.hashtags),
        visualFormat: 'short_video',
        editStyle: detectEditStyle(post.desc, post.hashtags),
        captionType,
        ctaType,
        publishedAt: new Date(post.createTime),
        likesCount: post.diggCount,
        commentsCount: post.commentCount,
        sharesCount: post.shareCount,
        viewsCount: post.playCount,
        engagementRate,
        engagementEfficiency: scoreEngagementEfficiency({
          engagementRate,
          followersCount: profile.followersCount,
          commentsCount: post.commentCount,
          sharesCount: post.shareCount,
        }),
        repeatabilityScore: scoreRepeatability({
          engagementRate,
          commentsCount: post.commentCount,
          hashtags: post.hashtags,
          captionType,
        }),
        conversionIntentScore: scoreConversionIntent({
          ctaType,
          commentsCount: post.commentCount,
          caption: post.desc,
        }),
        retentionProxyScore: scoreRetentionProxy({
          isVideo: true,
          viewsCount: post.playCount,
          commentsCount: post.commentCount,
          sharesCount: post.shareCount,
          likesCount: post.diggCount,
        }),
        checkpointMetrics: {
          observedAt: new Date().toISOString(),
          latest: { likes: post.diggCount, comments: post.commentCount, shares: post.shareCount, views: post.playCount },
        } as Prisma.InputJsonValue,
        hashtags: post.hashtags as Prisma.InputJsonValue,
        mentions: post.mentions as Prisma.InputJsonValue,
        keywords: getTopTerms([post.desc || '', post.hashtags.join(' ')], 6) as Prisma.InputJsonValue,
      },
    });
  }
}

async function buildCommentIntelligence(comments: HeroCommentInsight[]): Promise<HeroCommentIntelligence> {
  if (comments.length === 0) {
    return {
      totalComments: 0,
      sentiment: { positive: 0, negative: 0, neutral: 0, compound: 0 },
      categoryBreakdown: { praise: 0, confusion: 0, objection: 0, buying_intent: 0, faq: 0, audience_language: 0 },
      topQuestions: [],
      painPoints: [],
      languagePatterns: [],
      contentIdeas: [],
      latestComments: [],
    };
  }

  const categoryBreakdown: Record<CommentCategory, number> = {
    praise: 0,
    confusion: 0,
    objection: 0,
    buying_intent: 0,
    faq: 0,
    audience_language: 0,
  };
  const questionMap = new Map<string, number>();
  const painPointMap = new Map<string, number>();

  comments.forEach((comment) => {
    categoryBreakdown[comment.category] += 1;
    if (comment.category === 'faq' || comment.category === 'confusion') {
      const normalized = comment.text.trim().replace(/\s+/g, ' ').slice(0, 120);
      questionMap.set(normalized, (questionMap.get(normalized) || 0) + 1);
    }
    if (comment.category === 'objection') {
      const issue = getTopTerms([comment.text], 3).join(' ') || 'general objection';
      painPointMap.set(issue, (painPointMap.get(issue) || 0) + 1);
    }
  });

  const sentiment = await analyzeComments(
    comments.map((comment) => ({
      id: comment.id,
      text: comment.text,
      timestamp: comment.postedAt,
      platform: comment.platform,
      contentType: 'comment',
    }))
  );

  return {
    totalComments: comments.length,
    sentiment: sentiment.analysis.overall,
    categoryBreakdown,
    topQuestions: [...questionMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([question, frequency]) => ({ question, frequency, suggestedAnswer: buildSuggestedAnswer(question) })),
    painPoints: [...painPointMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([issue, frequency]) => ({
        issue,
        frequency,
        severity: frequency >= 5 ? 'high' : frequency >= 3 ? 'medium' : 'low',
      })),
    languagePatterns: getTopTerms(comments.map((comment) => comment.text), 12),
    contentIdeas: [...questionMap.keys()].slice(0, 6).map((question) => `Answer "${question}" in a short-form post or FAQ reply.`),
    latestComments: comments.slice(0, 8),
  };
}

async function buildContentGaps(workspaceId: string, winningContent: WinningContentItem[], comments: HeroCommentInsight[]) {
  const ownedTerms = new Set(
    winningContent
      .flatMap((item) => [item.topic || '', item.hook || '', ...item.hashtags])
      .filter(Boolean)
      .map((term) => term.toLowerCase())
  );

  const marketTerms: string[] = [];
  const competitorPosts = await prisma.scrapedPost.findMany({
    where: { workspaceId, competitorId: { not: null } },
    orderBy: { postedAt: 'desc' },
    take: 120,
  });

  competitorPosts.forEach((post) => {
    marketTerms.push(...getTopTerms([post.caption || '', JSON.stringify(post.hashtags)], 6));
  });

  const competitors = await prisma.competitor.findMany({
    where: { workspaceId, isActive: true },
    take: 20,
  });

  competitors.forEach((competitor) => {
    const latestSnapshot = ((competitor.metadata || {}) as Record<string, unknown>).latestSnapshot as
      | { posts?: Array<{ caption?: string; hashtags?: string[] }> }
      | undefined;
    latestSnapshot?.posts?.forEach((post) => {
      marketTerms.push(...getTopTerms([post.caption || '', (post.hashtags || []).join(' ')], 6));
    });
  });

  marketTerms.push(...getTopTerms(comments.map((comment) => comment.text), 24));

  const counts = new Map<string, number>();
  marketTerms.forEach((term) => {
    if (!term || ownedTerms.has(term)) return;
    counts.set(term, (counts.get(term) || 0) + 1);
  });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([topic, demand]) => ({
      topic,
      demandScore: demand,
      coverageScore: 0,
      opportunityScore: Number((demand * 1.4).toFixed(2)),
      reason: 'This theme appears in competitor activity or audience comments more often than in your current content set.',
      suggestedAngle: `Test a post focused on "${topic}" with a clearer hook and direct audience payoff.`,
    }));
}

async function createOperatorReports(input: {
  workspaceId: string;
  userId: string;
  dashboard: HeroDashboardData;
}) {
  const now = new Date();
  const commonData = {
    type: AnalysisType.ENGAGEMENT_REPORT,
    status: ReportStatus.COMPLETED,
    dateRangeStart: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    dateRangeEnd: now,
    workspaceId: input.workspaceId,
    createdById: input.userId,
    startedAt: now,
    completedAt: now,
  };

  await prisma.analysisReport.create({
    data: {
      ...commonData,
      title: 'Daily Trend Radar',
      description: 'Daily owned-account trend and recommendation report.',
      config: { source: 'hero-daily-radar' } as Prisma.InputJsonValue,
      results: toJsonValue({
        overview: input.dashboard.overview,
        winningContent: input.dashboard.winningContent.slice(0, 5),
        contentGaps: input.dashboard.contentGaps.slice(0, 5),
      }),
      insights: toJsonValue([
        ...input.dashboard.winningContent.slice(0, 2).map((item) => `${item.title} is leading on engagement efficiency.`),
        ...input.dashboard.contentGaps.slice(0, 2).map((gap) => `Opportunity detected: ${gap.topic} is high demand and under-covered.`),
      ]),
      recommendations: toJsonValue([
        ...input.dashboard.commentIntelligence.contentIdeas.slice(0, 4),
        ...input.dashboard.contentGaps.slice(0, 3).map((gap) => gap.suggestedAngle),
      ]),
    },
  });

  await prisma.analysisReport.create({
    data: {
      ...commonData,
      title: 'Weekly Winner Breakdown',
      description: 'Weekly owned-account winner breakdown and repeatability report.',
      config: { source: 'hero-weekly-breakdown' } as Prisma.InputJsonValue,
      results: toJsonValue({
        overview: input.dashboard.overview,
        accounts: input.dashboard.accounts,
      }),
      insights: toJsonValue([
        ...input.dashboard.accounts.map((account) => `@${account.handle} is averaging ${account.avgEngagementRate.toFixed(1)}% engagement.`),
        ...input.dashboard.winningContent.slice(0, 3).map((item) => `${item.title} scored ${item.metrics.repeatabilityScore.toFixed(1)} on repeatability.`),
      ]),
      recommendations: toJsonValue(input.dashboard.winningContent
        .slice(0, 5)
        .map((item) => `Build a variation of "${item.title}" using the same ${item.captionType || 'content'} pattern.`)),
    },
  });
}

export async function getHeroDashboard(workspaceId: string): Promise<HeroDashboardData> {
  const accounts = await prisma.ownedSocialAccount.findMany({
    where: { workspaceId },
    include: { contentSnapshots: { orderBy: { publishedAt: 'desc' } } },
    orderBy: { updatedAt: 'desc' },
  });
  const commentRows = await prisma.ownedContentComment.findMany({
    where: { workspaceId },
    include: { ownedAccount: true, contentSnapshot: true },
    orderBy: { postedAt: 'desc' },
    take: 200,
  });
  const reports = await prisma.analysisReport.findMany({
    where: { workspaceId, type: AnalysisType.ENGAGEMENT_REPORT },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const accountSummaries: HeroAccountSummary[] = accounts.map((account) => {
    const total = Math.max(1, account.contentSnapshots.length);
    return {
      id: account.id,
      platform: mapPlatform(account.platform),
      handle: account.handle,
      displayName: account.displayName || account.handle,
      profileUrl: account.profileUrl,
      avatarUrl: account.avatarUrl || undefined,
      verified: account.isVerified,
      followersCount: account.followerCount,
      followingCount: account.followingCount,
      postCount: account.contentSnapshots.length,
      avgEngagementRate: Number((account.contentSnapshots.reduce((sum, item) => sum + (item.engagementRate || 0), 0) / total).toFixed(2)),
      avgViews: Number((account.contentSnapshots.reduce((sum, item) => sum + item.viewsCount, 0) / total).toFixed(0)),
      avgComments: Number((account.contentSnapshots.reduce((sum, item) => sum + item.commentsCount, 0) / total).toFixed(1)),
      avgShares: Number((account.contentSnapshots.reduce((sum, item) => sum + item.sharesCount, 0) / total).toFixed(1)),
      bestPostingTimes: account.contentSnapshots.slice(0, 3).map((item) => `${new Date(item.publishedAt).getUTCHours()}:00 UTC`),
      topHashtags: getTopTerms(account.contentSnapshots.map((item) => JSON.stringify(item.hashtags)), 8).map((tag) => tag.replace(/^#/, '')),
      lastSyncedAt: account.lastSyncedAt?.toISOString(),
    };
  });

  const winningContent: WinningContentItem[] = accounts.flatMap((account) =>
    account.contentSnapshots.map((snapshot) => ({
      id: snapshot.id,
      accountId: account.id,
      platform: mapPlatform(snapshot.platform),
      handle: account.handle,
      title: snapshot.title,
      caption: snapshot.caption || undefined,
      postUrl: snapshot.postUrl,
      publishedAt: snapshot.publishedAt.toISOString(),
      topic: snapshot.topic || undefined,
      hook: snapshot.hook || undefined,
      visualFormat: snapshot.visualFormat || undefined,
      editStyle: snapshot.editStyle || undefined,
      captionType: snapshot.captionType || undefined,
      ctaType: snapshot.ctaType || undefined,
      hashtags: ((snapshot.hashtags as string[]) || []).map((tag) => tag.replace(/^#/, '')),
      metrics: {
        likes: snapshot.likesCount,
        comments: snapshot.commentsCount,
        shares: snapshot.sharesCount,
        views: snapshot.viewsCount,
        engagementRate: snapshot.engagementRate || 0,
        engagementEfficiency: snapshot.engagementEfficiency || 0,
        repeatabilityScore: snapshot.repeatabilityScore || 0,
        conversionIntentScore: snapshot.conversionIntentScore || 0,
        retentionProxyScore: snapshot.retentionProxyScore || 0,
      },
    }))
  ).sort((a, b) => (
    (b.metrics.engagementEfficiency + b.metrics.repeatabilityScore + b.metrics.retentionProxyScore) -
    (a.metrics.engagementEfficiency + a.metrics.repeatabilityScore + a.metrics.retentionProxyScore)
  ));

  const comments: HeroCommentInsight[] = commentRows.map((comment) => ({
    id: comment.id,
    platform: mapPlatform(comment.platform),
    handle: comment.ownedAccount.handle,
    contentTitle: comment.contentSnapshot.title,
    text: comment.text,
    authorHandle: comment.authorHandle || undefined,
    postedAt: comment.postedAt.toISOString(),
    likesCount: comment.likesCount,
    category: comment.category as CommentCategory,
    sentiment: comment.sentiment as 'positive' | 'negative' | 'neutral',
    intentLabel: comment.intentLabel,
    language: comment.language,
  }));

  const commentIntelligence = await buildCommentIntelligence(comments);
  const contentGaps = await buildContentGaps(workspaceId, winningContent, comments);
  const reportSummaries: HeroReportSummary[] = reports
    .filter((report) => ['hero-daily-radar', 'hero-weekly-breakdown', 'hero-account-analysis'].includes((((report.config || {}) as Record<string, unknown>).source as string) || ''))
    .map((report) => ({
      id: report.id,
      title: reportSourceLabel((((report.config || {}) as Record<string, unknown>).source as string) || 'hero-account-analysis'),
      createdAt: report.createdAt.toISOString(),
      source: (((report.config || {}) as Record<string, unknown>).source as string) || 'hero-account-analysis',
      insights: Array.isArray(report.insights) ? (report.insights as string[]) : [],
      recommendations: Array.isArray(report.recommendations) ? (report.recommendations as string[]) : [],
    }));

  return {
    handles: {
      instagramHandle: accountSummaries.find((account) => account.platform === 'instagram')?.handle,
      tiktokHandle: accountSummaries.find((account) => account.platform === 'tiktok')?.handle,
    },
    overview: {
      accountCount: accountSummaries.length,
      contentCount: winningContent.length,
      commentsAnalyzed: commentIntelligence.totalComments,
      avgEngagementRate: Number((accountSummaries.reduce((sum, account) => sum + account.avgEngagementRate, 0) / Math.max(1, accountSummaries.length)).toFixed(2)),
      updatedAt: accountSummaries.map((account) => account.lastSyncedAt).filter(Boolean).sort().reverse()[0],
    },
    accounts: accountSummaries,
    winningContent,
    commentIntelligence,
    contentGaps,
    reports: reportSummaries,
    recommendations: [
      ...winningContent.slice(0, 3).map((item) => `Reuse the winning ${item.captionType || 'content'} pattern from "${item.title}" with a new hook.`),
      ...contentGaps.slice(0, 3).map((gap) => gap.suggestedAngle),
      ...commentIntelligence.contentIdeas.slice(0, 3),
    ].slice(0, 10),
  };
}

export async function refreshHeroAnalytics(input: {
  workspaceId: string;
  userId: string;
  instagramHandle?: string;
  tiktokHandle?: string;
}) {
  const instagramHandle = normalizeHandle(input.instagramHandle);
  const tiktokHandle = normalizeHandle(input.tiktokHandle);
  if (instagramHandle) await upsertInstagramAccount(input.workspaceId, instagramHandle);
  if (tiktokHandle) await upsertTikTokAccount(input.workspaceId, tiktokHandle);

  const dashboard = await getHeroDashboard(input.workspaceId);
  const now = new Date();

  const report = await prisma.analysisReport.create({
    data: {
      title: 'Hero Account Analytics',
      description: 'Manual account analysis generated from the latest server update.',
      type: AnalysisType.ENGAGEMENT_REPORT,
      status: ReportStatus.COMPLETED,
      dateRangeStart: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      dateRangeEnd: now,
      config: {
        source: 'hero-account-analysis',
        instagramHandle: dashboard.handles.instagramHandle,
        tiktokHandle: dashboard.handles.tiktokHandle,
      } as Prisma.InputJsonValue,
      results: toJsonValue(dashboard),
      insights: toJsonValue(reportSummariesToInsights(dashboard.reports)),
      recommendations: toJsonValue(dashboard.recommendations),
      workspaceId: input.workspaceId,
      createdById: input.userId,
      startedAt: now,
      completedAt: now,
    },
  });

  await createOperatorReports({
    workspaceId: input.workspaceId,
    userId: input.userId,
    dashboard,
  });

  return { reportId: report.id, dashboard: await getHeroDashboard(input.workspaceId) };
}

function reportSummariesToInsights(reports: HeroReportSummary[]) {
  return reports.flatMap((report) => report.insights).slice(0, 6);
}
