"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendIndicator } from "@/components/ui/trend-indicator";
import type { HashtagTrend } from "@/types/briefing";
import {
  Hash,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface HashtagVelocityChartProps {
  trends: HashtagTrend[];
  isLoading?: boolean;
  className?: string;
}

export function HashtagVelocityChart({
  trends,
  isLoading = false,
  className,
}: HashtagVelocityChartProps) {
  if (isLoading) {
    return <HashtagVelocityChartSkeleton />;
  }

  if (!trends || trends.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Hashtag Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-neutral-100 p-4 dark:bg-neutral-800">
              <Hash className="h-8 w-8 text-neutral-400" />
            </div>
            <p className="text-neutral-600 dark:text-neutral-400">
              No hashtag data available
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              Start tracking hashtags to see trends
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort by trending score
  const sortedTrends = [...trends].sort((a, b) => b.trendingScore - a.trendingScore);
  const maxPosts = Math.max(...sortedTrends.map((t) => t.currentPostCount));

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Hashtag Velocity
          </CardTitle>
          <CardDescription>
            {sortedTrends.filter((t) => t.isTrending).length} trending,{" "}
            {sortedTrends.filter((t) => t.direction === "down").length} declining
          </CardDescription>
        </div>
        <Badge variant="secondary">{sortedTrends.length} tracked</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedTrends.slice(0, 8).map((trend) => (
            <HashtagRow
              key={trend.id}
              trend={trend}
              maxPosts={maxPosts}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface HashtagRowProps {
  trend: HashtagTrend;
  maxPosts: number;
}

function HashtagRow({ trend, maxPosts }: HashtagRowProps) {
  const barWidth = maxPosts > 0 ? (trend.currentPostCount / maxPosts) * 100 : 0;

  return (
    <div className="group space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DirectionIcon direction={trend.direction} isTrending={trend.isTrending} />
          <span className="font-medium text-neutral-900 dark:text-white">
            #{trend.tag}
          </span>
          {trend.isTrending && (
            <Badge variant="success" className="text-xs">
              Trending
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-500">
            {trend.currentPostCount.toLocaleString()} posts
          </span>
          <TrendIndicator
            direction={trend.velocityChange > 0 ? "up" : trend.velocityChange < 0 ? "down" : "neutral"}
            value={Math.abs(trend.velocityChange)}
            size="sm"
          />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            trend.isTrending
              ? "bg-gradient-to-r from-success-400 to-success-500"
              : trend.direction === "down"
              ? "bg-gradient-to-r from-danger-400 to-danger-500"
              : "bg-gradient-to-r from-primary-400 to-primary-500"
          )}
          style={{ width: `${Math.max(barWidth, 5)}%` }}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <div className="flex items-center gap-4">
          <span>Velocity: {trend.velocity.toFixed(1)}/hr</span>
          <span>Score: {trend.trendingScore.toFixed(0)}</span>
        </div>
        <div className="flex items-center gap-1">
          {trend.previousPostCount > 0 && (
            <span>
              {trend.currentPostCount > trend.previousPostCount ? "+" : ""}
              {((trend.currentPostCount - trend.previousPostCount) / trend.previousPostCount * 100).toFixed(0)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function DirectionIcon({
  direction,
  isTrending,
}: {
  direction: "up" | "down" | "stable";
  isTrending: boolean;
}) {
  if (isTrending || direction === "up") {
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success-100 dark:bg-success-900/30">
        <TrendingUp className="h-4 w-4 text-success-600 dark:text-success-400" />
      </div>
    );
  }

  if (direction === "down") {
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-danger-100 dark:bg-danger-900/30">
        <TrendingDown className="h-4 w-4 text-danger-600 dark:text-danger-400" />
      </div>
    );
  }

  return (
    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
      <Minus className="h-4 w-4 text-neutral-500" />
    </div>
  );
}

// Alternative visualization: Mini sparkline for each hashtag
interface HashtagSparklineProps {
  trends: HashtagTrend[];
  className?: string;
}

export function HashtagSparkline({ trends, className }: HashtagSparklineProps) {
  const sortedTrends = [...trends].sort((a, b) => b.trendingScore - a.trendingScore);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Hash className="h-4 w-4" />
          Trending Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {sortedTrends.slice(0, 5).map((trend) => (
            <div
              key={trend.id}
              className="flex items-center justify-between rounded-lg border border-neutral-100 p-3 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                    trend.rank && trend.rank <= 3
                      ? "bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400"
                      : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                  )}
                >
                  #{trend.rank}
                </div>
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">
                    #{trend.tag}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {trend.currentPostCount.toLocaleString()} posts
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Sparkline visualization */}
                <Sparkline
                  data={[
                    trend.previousPostCount,
                    trend.currentPostCount,
                  ]}
                  positive={trend.direction === "up"}
                />

                <div className="text-right">
                  <div className="flex items-center gap-1">
                    {trend.direction === "up" ? (
                      <ArrowUpRight className="h-4 w-4 text-success-500" />
                    ) : trend.direction === "down" ? (
                      <ArrowDownRight className="h-4 w-4 text-danger-500" />
                    ) : null}
                    <span
                      className={cn(
                        "font-medium",
                        trend.direction === "up"
                          ? "text-success-600"
                          : trend.direction === "down"
                          ? "text-danger-600"
                          : "text-neutral-600"
                      )}
                    >
                      {Math.abs(trend.velocityChange).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400">velocity</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Simple sparkline component
function Sparkline({
  data,
  positive,
}: {
  data: number[];
  positive: boolean;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 40;
      const y = 20 - ((value - min) / range) * 20;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width="40"
      height="20"
      viewBox="0 0 40 20"
      className={positive ? "text-success-500" : "text-danger-500"}
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        points={points}
      />
    </svg>
  );
}

function HashtagVelocityChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-48 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
              <div className="h-4 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            </div>
            <div className="h-2 w-full animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
