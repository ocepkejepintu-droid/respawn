"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  Calendar,
  TrendingUp,
  Users,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Camera,
  Play,
  BarChart3,
  Hash,
  Clock,
  Target,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import type { Competitor, CompetitorPost, CompetitorMetrics } from "@/types/competitor";
import { EngagementComparison } from "./EngagementComparison";
import { ContentTypeBreakdown } from "./ContentTypeBreakdown";
import { HashtagOverlapAnalysis } from "./HashtagOverlapAnalysis";

interface CompetitorDetailViewProps {
  competitor: Competitor;
  metrics: CompetitorMetrics[];
  posts: CompetitorPost[];
  topPosts: CompetitorPost[];
  trends: { date: string; engagementRate: number; likes: number; comments: number; shares: number; saves: number; postsCount: number }[];
  contentTypePerformance: { contentType: string; count: number; avgEngagementRate: number; percentageOfTotal: number }[];
  hashtagAnalysis: { hashtag: string; usageCount: number; avgEngagementRate: number }[];
  bestPostingTimes: { dayOfWeek: number; hourOfDay: number; avgEngagementRate: number }[];
  insights: { id: string; type: string; title: string; description: string; severity: string }[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function CompetitorDetailView({
  competitor,
  metrics,
  posts,
  topPosts,
  trends,
  contentTypePerformance,
  hashtagAnalysis,
  bestPostingTimes,
  insights,
  isLoading = false,
  onRefresh,
}: CompetitorDetailViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState("overview");

  if (isLoading) {
    return <CompetitorDetailSkeleton />;
  }

  const latestMetrics = metrics[metrics.length - 1];
  const previousMetrics = metrics[metrics.length - 8]; // Week ago

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Camera':
        return <Camera className="h-5 w-5" />;
      case 'tiktok':
        return <Play className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/competitors')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <img
              src={competitor.profileImage || '/placeholder-avatar.png'}
              alt={competitor.username}
              className="h-16 w-16 rounded-full object-cover"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {competitor.displayName}
                </h1>
                {getPlatformIcon(competitor.platform)}
              </div>
              <p className="text-neutral-500">@{competitor.username}</p>
              {competitor.niche && (
                <Badge variant="secondary" className="mt-1">
                  {competitor.niche}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" asChild>
            <a href={competitor.profileUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Profile
            </a>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Followers"
          value={formatNumber(competitor.followers)}
          change={previousMetrics ? ((latestMetrics.followers - previousMetrics.followers) / previousMetrics.followers * 100).toFixed(1) : undefined}
          icon={Users}
        />
        <StatCard
          title="Engagement Rate"
          value={`${latestMetrics?.avgEngagementRate.toFixed(2)}%`}
          change={previousMetrics ? ((latestMetrics.avgEngagementRate - previousMetrics.avgEngagementRate) / previousMetrics.avgEngagementRate * 100).toFixed(1) : undefined}
          icon={Heart}
        />
        <StatCard
          title="Total Posts"
          value={formatNumber(competitor.postsCount)}
          icon={BarChart3}
        />
        <StatCard
          title="Avg. Likes"
          value={formatNumber(Math.round(latestMetrics?.avgLikes || 0))}
          icon={Heart}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="hashtags">Hashtags</TabsTrigger>
          <TabsTrigger value="timing">Timing</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Engagement Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Engagement Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EngagementComparison
                data={trends.map(t => ({
                  date: t.date,
                  [competitor.username]: t.engagementRate,
                }))}
                competitors={[{ id: competitor.id, username: competitor.username, color: '#4f46e5' }]}
                metric="engagementRate"
              />
            </CardContent>
          </Card>

          {/* Top Posts */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {topPosts.slice(0, 6).map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Content Type Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ContentTypeBreakdown data={contentTypePerformance} />
            </CardContent>
          </Card>

          {/* Content Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-neutral-500">Most Used Format</p>
                  <p className="text-2xl font-bold capitalize">
                    {contentTypePerformance[0]?.contentType || 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-neutral-500">Best Performing</p>
                  <p className="text-2xl font-bold capitalize">
                    {contentTypePerformance.sort((a, b) => b.avgEngagementRate - a.avgEngagementRate)[0]?.contentType || 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-neutral-500">Posts Analyzed</p>
                  <p className="text-2xl font-bold">{posts.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Hashtags Tab */}
        <TabsContent value="hashtags" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Top Performing Hashtags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <HashtagOverlapAnalysis
                hashtags={hashtagAnalysis.map(h => ({
                  hashtag: h.hashtag,
                  yourUsage: 0,
                  competitorUsage: h.usageCount,
                  avgEngagement: h.avgEngagementRate,
                }))}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timing Tab */}
        <TabsContent value="timing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Best Posting Times
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bestPostingTimes.slice(0, 5).map((time, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 font-bold text-primary-700">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">
                          {dayNames[time.dayOfWeek]}s at {formatHour(time.hourOfDay)}
                        </p>
                        <p className="text-sm text-neutral-500">
                          {time.avgEngagementRate.toFixed(2)}% avg engagement
                        </p>
                      </div>
                    </div>
                    <Badge variant={index < 3 ? "primary" : "secondary"}>
                      {index < 3 ? 'Optimal' : 'Good'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="space-y-4">
            {insights.map((insight) => (
              <Card
                key={insight.id}
                className={cn(
                  "border-l-4",
                  insight.severity === 'critical' && "border-l-danger-500",
                  insight.severity === 'warning' && "border-l-warning-500",
                  insight.severity === 'info' && "border-l-primary-500"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="mt-0.5 h-5 w-5 text-neutral-400" />
                    <div>
                      <h4 className="font-medium">{insight.title}</h4>
                      <p className="text-sm text-neutral-500">{insight.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({
  title,
  value,
  change,
  icon: Icon,
}: {
  title: string;
  value: string;
  change?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const changeNum = change ? parseFloat(change) : 0;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-500">{title}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
            {change !== undefined && (
              <p
                className={cn(
                  "mt-1 text-sm font-medium",
                  changeNum > 0 ? "text-success-600" : changeNum < 0 ? "text-danger-600" : "text-neutral-500"
                )}
              >
                {changeNum > 0 ? '+' : ''}{change}% from last week
              </p>
            )}
          </div>
          <div className="rounded-full bg-neutral-100 p-3 dark:bg-neutral-800">
            <Icon className="h-6 w-6 text-neutral-600 dark:text-neutral-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PostCard({ post }: { post: CompetitorPost }) {
  const formatNumber = (num: number): string => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="group relative overflow-hidden rounded-lg border">
      <img
        src={post.thumbnailUrl || '/placeholder-post.png'}
        alt="Post thumbnail"
        className="aspect-square w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="absolute bottom-0 left-0 right-0 p-3 text-white opacity-0 transition-opacity group-hover:opacity-100">
        <p className="line-clamp-2 text-sm">{post.caption}</p>
        <div className="mt-2 flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3" /> {formatNumber(post.likes)}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3 w-3" /> {formatNumber(post.comments)}
          </span>
        </div>
      </div>
      <div className="absolute right-2 top-2">
        <Badge variant="secondary" className="text-xs capitalize">
          {post.contentType}
        </Badge>
      </div>
    </div>
  );
}

function formatHour(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12} ${period}`;
}

function CompetitorDetailSkeleton() {
  return (
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
      <Skeleton className="h-96" />
    </div>
  );
}
