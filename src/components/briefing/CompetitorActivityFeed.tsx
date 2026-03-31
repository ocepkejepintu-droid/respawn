"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendIndicator } from "@/components/ui/trend-indicator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { CompetitorActivity, CompetitorPost } from "@/types/briefing";

// Platform enum for briefing components
enum Platform {
  INSTAGRAM = 'INSTAGRAM',
  TIKTOK = 'TIKTOK',
}
import {
  Users,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  ExternalLink,
  Clock,
  TrendingUp,
  TrendingDown,
  Image as ImageIcon,
  Play,
  Layers,
} from "lucide-react";

interface CompetitorActivityFeedProps {
  activities: CompetitorActivity[];
  isLoading?: boolean;
  className?: string;
}

export function CompetitorActivityFeed({
  activities,
  isLoading = false,
  className,
}: CompetitorActivityFeedProps) {
  if (isLoading) {
    return <CompetitorActivityFeedSkeleton />;
  }

  if (!activities || activities.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Competitor Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 rounded-full bg-neutral-100 p-4 dark:bg-neutral-800">
              <Users className="h-8 w-8 text-neutral-400" />
            </div>
            <p className="text-neutral-600 dark:text-neutral-400">
              No competitor activity in this period
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              Competitors haven&apos;t posted recently
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Competitor Activity
        </CardTitle>
        <Badge variant="secondary">
          {activities.reduce((sum, a) => sum + a.posts.length, 0)} posts
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        {activities.map((activity) => (
          <CompetitorCard key={activity.id} activity={activity} />
        ))}
      </CardContent>
    </Card>
  );
}

function CompetitorCard({ activity }: { activity: CompetitorActivity }) {
  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800">
      {/* Competitor Header */}
      <div className="flex items-center justify-between border-b border-neutral-100 p-4 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={activity.avatarUrl} alt={activity.competitorName} />
            <AvatarFallback>
              {activity.competitorName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-medium text-neutral-900 dark:text-white">
              {activity.competitorName}
            </h4>
            <p className="text-sm text-neutral-500">{activity.competitorHandle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="flex items-center gap-1 text-sm">
              {activity.engagementChange > 0 ? (
                <TrendingUp className="h-4 w-4 text-success-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-danger-500" />
              )}
              <span
                className={
                  activity.engagementChange > 0
                    ? "text-success-600"
                    : "text-danger-600"
                }
              >
                {Math.abs(activity.engagementChange).toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-neutral-500">engagement</p>
          </div>
          <PlatformIcon platform={activity.platform} />
        </div>
      </div>

      {/* Posts */}
      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {activity.posts.map((post) => (
          <PostItem key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}

function PostItem({ post }: { post: CompetitorPost }) {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatTimeAgo = (date: Date): string => {
    const hours = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60)
    );
    if (hours < 1) return "Just now";
    if (hours === 1) return "1 hour ago";
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  return (
    <div className="group p-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
      <div className="flex gap-4">
        {/* Media Preview */}
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
          {post.mediaUrls[0] ? (
            <Image
              src={post.mediaUrls[0]}
              alt="Post preview"
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ContentTypeIcon type={post.contentType} />
            </div>
          )}
          <div className="absolute right-1 top-1 rounded bg-black/60 p-1">
            <ContentTypeIcon type={post.contentType} className="h-3 w-3 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm text-neutral-700 dark:text-neutral-300">
            {post.caption || "No caption"}
          </p>

          {/* Metrics */}
          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-neutral-500">
            <span className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              {formatNumber(post.likesCount)}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              {formatNumber(post.commentsCount)}
            </span>
            <span className="flex items-center gap-1">
              <Share2 className="h-3.5 w-3.5" />
              {formatNumber(post.sharesCount)}
            </span>
            {post.viewsCount > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {formatNumber(post.viewsCount)}
              </span>
            )}
          </div>

          {/* Footer */}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-neutral-400" />
              <span className="text-xs text-neutral-400">
                {formatTimeAgo(post.postedAt)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TrendIndicator
                direction="up"
                value={post.engagementRate}
                format="number"
                size="sm"
              />
              <Link href={post.permalink} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlatformIcon({ platform }: { platform: Platform }) {
  const iconClass = "h-5 w-5";

  switch (platform) {
    case Platform.INSTAGRAM:
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400">
          <svg className={`${iconClass} text-white`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        </div>
      );
    case Platform.TIKTOK:
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black">
          <svg className={`${iconClass} text-white`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
          </svg>
        </div>
      );
    default:
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200">
          <Users className={`${iconClass} text-neutral-600`} />
        </div>
      );
  }
}

function ContentTypeIcon({
  type,
  className,
}: {
  type: string;
  className?: string;
}) {
  const iconClass = className || "h-5 w-5 text-neutral-400";

  switch (type.toLowerCase()) {
    case "video":
    case "reel":
      return <Play className={iconClass} />;
    case "carousel":
      return <Layers className={iconClass} />;
    case "image":
    default:
      return <ImageIcon className={iconClass} />;
  }
}

function CompetitorActivityFeedSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-48 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="h-40 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800"
          />
        ))}
      </CardContent>
    </Card>
  );
}
