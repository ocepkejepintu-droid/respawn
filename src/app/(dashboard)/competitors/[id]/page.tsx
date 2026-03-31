"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { CompetitorDetailView } from "@/components/competitors";
import { Skeleton } from "@/components/ui/skeleton";
import type { Competitor, CompetitorPost, CompetitorMetrics } from "@/types/competitor";

// Demo data generator
function generateDemoCompetitor(id: string): Competitor {
  const competitors: Record<string, Competitor> = {
    comp_1: {
      id: "comp_1",
      workspaceId: "ws_1",
      username: "fashionforward",
      displayName: "Fashion Forward",
      platform: "INSTAGRAM" as const,
      profileUrl: "https://instagram.com/fashionforward",
      profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
      bio: "Daily fashion inspiration ✨ | Style tips & trends | DM for collabs",
      followers: 245000,
      following: 850,
      postsCount: 1247,
      niche: "Fashion",
      tags: ["fashion", "style", "lifestyle"],
      monitoringFrequency: "daily",
      isActive: true,
      lastSyncedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date(),
    },
    comp_2: {
      id: "comp_2",
      workspaceId: "ws_1",
      username: "techtalkdaily",
      displayName: "Tech Talk Daily",
      platform: "INSTAGRAM" as const,
      profileUrl: "https://instagram.com/techtalkdaily",
      profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
      bio: "Your daily dose of tech 📱 | Reviews & news | Subscribe to our newsletter",
      followers: 189000,
      following: 450,
      postsCount: 892,
      niche: "Technology",
      tags: ["tech", "gadgets", "reviews"],
      monitoringFrequency: "daily",
      isActive: true,
      lastSyncedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      createdAt: new Date("2024-02-01"),
      updatedAt: new Date(),
    },
    comp_3: {
      id: "comp_3",
      workspaceId: "ws_1",
      username: "fitwithsarah",
      displayName: "Sarah | Fitness Coach",
      platform: "INSTAGRAM" as const,
      profileUrl: "https://instagram.com/fitwithsarah",
      profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
      bio: "Certified PT 💪 | Home workouts | Meal plans | Transform your body",
      followers: 423000,
      following: 520,
      postsCount: 2156,
      niche: "Fitness",
      tags: ["fitness", "health", "wellness"],
      monitoringFrequency: "daily",
      isActive: true,
      lastSyncedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      createdAt: new Date("2024-01-20"),
      updatedAt: new Date(),
    },
  };

  return competitors[id] || competitors.comp_1;
}

function generateDemoPosts(competitorId: string): CompetitorPost[] {
  const contentTypes = ["post", "reel", "carousel", "video"] as const;
  const posts: CompetitorPost[] = [];
  const now = Date.now();

  for (let i = 0; i < 30; i++) {
    const contentType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
    const daysAgo = Math.floor(Math.random() * 90);
    
    const baseEngagement = {
      post: { likes: 2500, comments: 60, shares: 40, saves: 120 },
      reel: { likes: 6000, comments: 120, shares: 250, saves: 180 },
      carousel: { likes: 4000, comments: 90, shares: 120, saves: 600 },
      video: { likes: 4500, comments: 100, shares: 180, saves: 220 },
    };

    const base = baseEngagement[contentType];
    const variance = () => 0.5 + Math.random() * 1;

    posts.push({
      id: `post_${competitorId}_${i}`,
      competitorId,
      externalId: `ext_${Date.now()}_${i}`,
      platform: "INSTAGRAM" as const,
      contentType,
      caption: `Sample caption for post ${i + 1} with some hashtags #fashion #style #lifestyle`,
      captionLength: 80 + Math.floor(Math.random() * 100),
      hashtags: ["fashion", "style", "lifestyle", "ootd", "trendy"],
      mentions: [],
      mediaUrls: [`https://picsum.photos/400/400?random=${i}`],
      thumbnailUrl: `https://picsum.photos/400/400?random=${i}`,
      likes: Math.floor(base.likes * variance()),
      comments: Math.floor(base.comments * variance()),
      shares: Math.floor(base.shares * variance()),
      saves: Math.floor(base.saves * variance()),
      views: contentType === "reel" || contentType === "video" ? Math.floor(50000 * variance()) : undefined,
      reach: Math.floor(20000 * variance()),
      engagementRate: 2 + Math.random() * 3,
      postedAt: new Date(now - daysAgo * 24 * 60 * 60 * 1000),
      scrapedAt: new Date(),
      url: `https://instagram.com/p/${Math.random().toString(36).substring(7)}`,
    });
  }

  return posts.sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime());
}

function generateDemoMetrics(competitorId: string, baseFollowers: number): CompetitorMetrics[] {
  const metrics: CompetitorMetrics[] = [];
  const now = new Date();
  let currentFollowers = baseFollowers - 5000;

  for (let i = 90; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const dailyGrowth = Math.floor(Math.random() * 200) - 50;
    currentFollowers += dailyGrowth;

    metrics.push({
      competitorId,
      date,
      followers: currentFollowers,
      following: 500 + Math.floor(Math.random() * 500),
      postsCount: 1000 + Math.floor((90 - i) * 0.3),
      avgEngagementRate: 2.5 + Math.random() * 2,
      avgLikes: 2000 + Math.floor(Math.random() * 1000),
      avgComments: 50 + Math.floor(Math.random() * 50),
      avgShares: 30 + Math.floor(Math.random() * 30),
      avgSaves: 100 + Math.floor(Math.random() * 100),
      totalReach: Math.floor(currentFollowers * 0.1),
      postsInPeriod: Math.floor(Math.random() * 2) + (i % 7 === 0 ? 2 : 0),
    });
  }

  return metrics;
}

function generateDemoTrends(): { date: string; engagementRate: number; likes: number; comments: number; shares: number; saves: number; postsCount: number }[] {
  const trends = [];
  const now = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    trends.push({
      date: date.toISOString().split('T')[0],
      engagementRate: 2.5 + Math.random() * 2,
      likes: 2000 + Math.floor(Math.random() * 1000),
      comments: 50 + Math.floor(Math.random() * 50),
      shares: 30 + Math.floor(Math.random() * 30),
      saves: 100 + Math.floor(Math.random() * 100),
      postsCount: Math.floor(Math.random() * 3),
    });
  }
  
  return trends;
}

function generateDemoContentTypes() {
  return [
    { contentType: "post", count: 45, avgEngagementRate: 2.8, percentageOfTotal: 37.5 },
    { contentType: "reel", count: 38, avgEngagementRate: 4.2, percentageOfTotal: 31.7 },
    { contentType: "carousel", count: 28, avgEngagementRate: 3.6, percentageOfTotal: 23.3 },
    { contentType: "video", count: 9, avgEngagementRate: 3.1, percentageOfTotal: 7.5 },
  ];
}

function generateDemoHashtags() {
  const hashtags = [
    { hashtag: "fashion", usageCount: 45, avgEngagementRate: 3.2 },
    { hashtag: "style", usageCount: 38, avgEngagementRate: 2.9 },
    { hashtag: "ootd", usageCount: 32, avgEngagementRate: 4.1 },
    { hashtag: "lifestyle", usageCount: 28, avgEngagementRate: 2.5 },
    { hashtag: "trendy", usageCount: 24, avgEngagementRate: 3.5 },
    { hashtag: "instafashion", usageCount: 20, avgEngagementRate: 2.8 },
    { hashtag: "fashionista", usageCount: 18, avgEngagementRate: 3.0 },
    { hashtag: "lookbook", usageCount: 15, avgEngagementRate: 3.8 },
  ];
  return hashtags;
}

function generateDemoBestTimes() {
  return [
    { dayOfWeek: 3, hourOfDay: 19, avgEngagementRate: 4.8 },
    { dayOfWeek: 5, hourOfDay: 18, avgEngagementRate: 4.5 },
    { dayOfWeek: 1, hourOfDay: 20, avgEngagementRate: 4.3 },
    { dayOfWeek: 4, hourOfDay: 12, avgEngagementRate: 4.1 },
    { dayOfWeek: 0, hourOfDay: 15, avgEngagementRate: 3.9 },
  ];
}

function generateDemoInsights() {
  return [
    {
      id: "insight_1",
      type: "engagement_spike",
      title: "Engagement Rate Spike",
      description: "Engagement rate increased by 25% compared to last week",
      severity: "info" as const,
    },
    {
      id: "insight_2",
      type: "viral_content",
      title: "Viral Content Detected",
      description: "A recent reel performed 3x above average engagement",
      severity: "info" as const,
    },
    {
      id: "insight_3",
      type: "posting_frequency_change",
      title: "Increased Posting Frequency",
      description: "Posting frequency increased by 3 posts this week",
      severity: "warning" as const,
    },
  ];
}

export default function CompetitorDetailPage() {
  const params = useParams();
  const competitorId = params.id as string;
  
  const [isLoading, setIsLoading] = React.useState(true);
  const [data, setData] = React.useState<{
    competitor: Competitor;
    metrics: CompetitorMetrics[];
    posts: CompetitorPost[];
    topPosts: CompetitorPost[];
    trends: ReturnType<typeof generateDemoTrends>;
    contentTypePerformance: ReturnType<typeof generateDemoContentTypes>;
    hashtagAnalysis: ReturnType<typeof generateDemoHashtags>;
    bestPostingTimes: ReturnType<typeof generateDemoBestTimes>;
    insights: ReturnType<typeof generateDemoInsights>;
  } | null>(null);

  React.useEffect(() => {
    // Simulate data fetching
    const loadData = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const competitor = generateDemoCompetitor(competitorId);
      const posts = generateDemoPosts(competitorId);
      const metrics = generateDemoMetrics(competitorId, competitor.followers);

      setData({
        competitor,
        metrics,
        posts,
        topPosts: posts.slice(0, 10),
        trends: generateDemoTrends(),
        contentTypePerformance: generateDemoContentTypes(),
        hashtagAnalysis: generateDemoHashtags(),
        bestPostingTimes: generateDemoBestTimes(),
        insights: generateDemoInsights(),
      });
      setIsLoading(false);
    };

    loadData();
  }, [competitorId]);

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    if (data) {
      setData({
        ...data,
        competitor: { ...data.competitor, lastSyncedAt: new Date() },
      });
    }
    setIsLoading(false);
  };

  if (!data && isLoading) {
    return (
      <div className="p-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div>Competitor not found</div>;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <CompetitorDetailView
        competitor={data.competitor}
        metrics={data.metrics}
        posts={data.posts}
        topPosts={data.topPosts}
        trends={data.trends}
        contentTypePerformance={data.contentTypePerformance}
        hashtagAnalysis={data.hashtagAnalysis}
        bestPostingTimes={data.bestPostingTimes}
        insights={data.insights}
        isLoading={isLoading}
        onRefresh={handleRefresh}
      />
    </div>
  );
}
