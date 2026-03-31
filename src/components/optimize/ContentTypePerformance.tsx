"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ContentTypeAnalysis, ContentType } from "@/types/optimize";
import { TrendIndicator } from "@/components/ui/trend-indicator";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Film, Images, Image, Play, Video, BarChart3 } from "lucide-react";

interface ContentTypePerformanceProps {
  data: ContentTypeAnalysis[];
  className?: string;
  onTypeSelect?: (type: ContentType) => void;
}

const contentTypeIcons: Record<ContentType, React.ReactNode> = {
  reel: <Film className="h-5 w-5" />,
  carousel: <Images className="h-5 w-5" />,
  single_image: <Image className="h-5 w-5" />,
  story: <Play className="h-5 w-5" />,
  video: <Video className="h-5 w-5" />,
};

const contentTypeLabels: Record<ContentType, string> = {
  reel: "Reels",
  carousel: "Carousels",
  single_image: "Single Images",
  story: "Stories",
  video: "Videos",
};

const contentTypeColors: Record<ContentType, string> = {
  reel: "#6366f1", // primary-500
  carousel: "#22c55e", // success-500
  single_image: "#f59e0b", // warning-500
  story: "#94a3b8", // neutral-400
  video: "#ef4444", // danger-500
};

export function ContentTypePerformance({
  data,
  className,
  onTypeSelect,
}: ContentTypePerformanceProps) {
  const chartData = data.map(item => ({
    name: contentTypeLabels[item.contentType],
    type: item.contentType,
    engagement: parseFloat((item.avgEngagementRate * 100).toFixed(2)),
    reach: item.avgReach / 1000,
    posts: item.totalPosts,
    performance: item.performanceScore,
    trend: item.trend,
    trendPercent: item.trendPercent,
  }));

  const bestPerforming = data.length > 0 
    ? data.reduce((best, current) => 
        current.performanceScore > best.performanceScore ? current : best
      )
    : null;

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-primary-500" />
              Content Type Performance
            </CardTitle>
            <CardDescription>
              Engagement rates by content format
            </CardDescription>
          </div>
          {bestPerforming && (
            <div className="hidden rounded-lg bg-success-50 px-3 py-1.5 text-sm sm:block dark:bg-success-900/20">
              <span className="text-success-600 dark:text-success-400">
                Best: {contentTypeLabels[bestPerforming.contentType]}
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Chart */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                        <p className="font-medium text-neutral-900 dark:text-white">
                          {data.name}
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          Engagement: {data.engagement}%
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          Avg Reach: {data.reach.toFixed(1)}K
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          Total Posts: {data.posts}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="engagement"
                radius={[4, 4, 0, 0]}
                cursor={onTypeSelect ? "pointer" : "default"}
                onClick={(data) => onTypeSelect?.(data.type as ContentType)}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={contentTypeColors[entry.type as ContentType]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((item) => (
            <button
              key={item.contentType}
              onClick={() => onTypeSelect?.(item.contentType)}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 text-left transition-all",
                "border-neutral-200 bg-white hover:border-primary-300 hover:shadow-sm",
                "dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-primary-700",
                onTypeSelect && "cursor-pointer"
              )}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{
                  backgroundColor: `${contentTypeColors[item.contentType]}20`,
                  color: contentTypeColors[item.contentType],
                }}
              >
                {contentTypeIcons[item.contentType]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-900 dark:text-white truncate">
                    {contentTypeLabels[item.contentType]}
                  </span>
                  <TrendIndicator
                    direction={item.trend}
                    value={item.trendPercent}
                    size="sm"
                  />
                </div>
                <div className="mt-1 flex items-center gap-3 text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">
                    {(item.avgEngagementRate * 100).toFixed(2)}% engagement
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500">
                  <span>{item.totalPosts} posts</span>
                  <span>•</span>
                  <span>{formatNumber(item.avgReach)} avg reach</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800/50 sm:grid-cols-3">
          <StatItem
            label="Total Posts Analyzed"
            value={data.reduce((sum, item) => sum + item.totalPosts, 0).toString()}
          />
          <StatItem
            label="Best Engagement"
            value={data.length > 0 
              ? `${(Math.max(...data.map(d => d.avgEngagementRate)) * 100).toFixed(2)}%`
              : "-"
            }
          />
          <StatItem
            label="Avg Saves per Post"
            value={data.length > 0
              ? formatNumber(Math.round(data.reduce((sum, item) => sum + item.avgSaves, 0) / data.length))
              : "-"
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-neutral-900 dark:text-white">
        {value}
      </div>
      <div className="text-sm text-neutral-500 dark:text-neutral-400">
        {label}
      </div>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}
