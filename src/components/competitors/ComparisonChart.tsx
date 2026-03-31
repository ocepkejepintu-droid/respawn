"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface CompetitorData {
  id: string;
  username: string;
  displayName: string;
  profileImage?: string;
  followers: number;
  engagementRate: number;
  postsCount: number;
  avgLikes: number;
  avgComments: number;
  growthRate: number;
  color?: string;
}

interface ComparisonChartProps {
  competitors: CompetitorData[];
  categories?: string[];
  showRadar?: boolean;
}

const COLORS = ["#4f46e5", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

export function ComparisonChart({
  competitors,
  categories = ["followers", "engagement", "posts", "growth"],
  showRadar = true,
}: ComparisonChartProps) {
  const [chartType, setChartType] = React.useState<"bar" | "radar">("bar");

  // Prepare data for charts
  const barChartData = categories.map((category) => {
    const data: Record<string, number | string> = { category };
    competitors.forEach((comp) => {
      switch (category) {
        case "followers":
          data[comp.username] = comp.followers;
          break;
        case "engagement":
          data[comp.username] = comp.engagementRate;
          break;
        case "posts":
          data[comp.username] = comp.postsCount;
          break;
        case "growth":
          data[comp.username] = comp.growthRate;
          break;
        case "avgLikes":
          data[comp.username] = comp.avgLikes;
          break;
        case "avgComments":
          data[comp.username] = comp.avgComments;
          break;
      }
    });
    return data;
  });

  const categoryLabels: Record<string, string> = {
    followers: "Followers",
    engagement: "Engagement Rate (%)",
    posts: "Posts Count",
    growth: "Growth Rate (%)",
    avgLikes: "Avg Likes",
    avgComments: "Avg Comments",
  };

  // Normalize data for radar chart (0-100 scale)
  const radarData = categories.map((category) => {
    const values = competitors.map((comp) => {
      switch (category) {
        case "followers":
          return comp.followers;
        case "engagement":
          return comp.engagementRate * 100; // Scale up for visibility
        case "posts":
          return comp.postsCount;
        case "growth":
          return comp.growthRate;
        case "avgLikes":
          return comp.avgLikes;
        case "avgComments":
          return comp.avgComments;
        default:
          return 0;
      }
    });

    const max = Math.max(...values);
    const data: Record<string, number | string> = {
      category: categoryLabels[category],
      fullMark: 100,
    };

    competitors.forEach((comp, index) => {
      data[comp.username] = max > 0 ? (values[index] / max) * 100 : 0;
    });

    return data;
  });

  const formatValue = (value: number, category: string) => {
    if (category === "followers" || category === "avgLikes" || category === "avgComments") {
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    }
    if (category === "engagement" || category === "growth") {
      return `${value.toFixed(2)}%`;
    }
    return value.toString();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Competitor Comparison</CardTitle>
        {showRadar && (
          <Tabs value={chartType} onValueChange={(v) => setChartType(v as "bar" | "radar")}>
            <TabsList>
              <TabsTrigger value="bar">Bar</TabsTrigger>
              <TabsTrigger value="radar">Radar</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </CardHeader>
      <CardContent>
        {/* Competitor Legend */}
        <div className="mb-4 flex flex-wrap gap-2">
          {competitors.map((comp, index) => (
            <Badge
              key={comp.id}
              variant="outline"
              className="flex items-center gap-2"
              style={{ borderColor: COLORS[index % COLORS.length] }}
            >
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              {comp.username}
            </Badge>
          ))}
        </div>

        {/* Chart */}
        <div className="h-[400px] w-full">
          {chartType === "bar" ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-white p-3 shadow-lg dark:bg-neutral-800">
                          <p className="font-medium text-neutral-900 dark:text-white">
                            {categoryLabels[label] || label}
                          </p>
                          <div className="mt-2 space-y-1">
                            {payload.map((entry: any) => (
                              <div key={entry.name} className="flex items-center gap-2">
                                <div
                                  className="h-2 w-2 rounded-full"
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-sm text-neutral-600 dark:text-neutral-300">
                                  {entry.name}:
                                </span>
                                <span className="text-sm font-medium text-neutral-900 dark:text-white">
                                  {formatValue(entry.value, label)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                {competitors.map((comp, index) => (
                  <Bar
                    key={comp.id}
                    dataKey={comp.username}
                    fill={COLORS[index % COLORS.length]}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                {competitors.map((comp, index) => (
                  <Radar
                    key={comp.id}
                    name={comp.username}
                    dataKey={comp.username}
                    stroke={COLORS[index % COLORS.length]}
                    fill={COLORS[index % COLORS.length]}
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                ))}
                <Legend />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-white p-3 shadow-lg dark:bg-neutral-800">
                          {payload.map((entry: any) => (
                            <div key={entry.name} className="flex items-center gap-2">
                              <div
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-sm text-neutral-600 dark:text-neutral-300">
                                {entry.name}: {Math.round(entry.value)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
