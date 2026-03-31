"use client";

import * as React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface ContentTypeData {
  contentType: string;
  count: number;
  avgEngagementRate: number;
  percentageOfTotal: number;
}

interface ContentTypeBreakdownProps {
  data: ContentTypeData[];
  showComparison?: boolean;
}

const COLORS = {
  post: "#4f46e5",
  reel: "#22c55e",
  carousel: "#f59e0b",
  story: "#8b5cf6",
  video: "#ef4444",
};

const LABELS: Record<string, string> = {
  post: "Single Post",
  reel: "Reel",
  carousel: "Carousel",
  story: "Story",
  video: "Video",
};

export function ContentTypeBreakdown({
  data,
  showComparison = true,
}: ContentTypeBreakdownProps) {
  const [viewMode, setViewMode] = React.useState<"pie" | "bar">("pie");

  const chartData = data.map((item) => ({
    name: LABELS[item.contentType] || item.contentType,
    value: item.count,
    percentage: item.percentageOfTotal,
    engagement: item.avgEngagementRate,
    color: COLORS[item.contentType as keyof typeof COLORS] || "#94a3b8",
  }));

  return (
    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "pie" | "bar")}>
      <div className="flex items-center justify-between mb-4">
        <TabsList>
          <TabsTrigger value="pie">Distribution</TabsTrigger>
          <TabsTrigger value="bar">Engagement</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="pie" className="mt-0">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-white p-3 shadow-lg dark:bg-neutral-800">
                        <p className="font-medium text-neutral-900 dark:text-white">
                          {data.name}
                        </p>
                        <p className="text-sm text-neutral-500">
                          {data.value} posts ({data.percentage.toFixed(1)}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </TabsContent>

      <TabsContent value="bar" className="mt-0">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-white p-3 shadow-lg dark:bg-neutral-800">
                        <p className="font-medium text-neutral-900 dark:text-white">
                          {data.name}
                        </p>
                        <p className="text-sm text-neutral-500">
                          Avg Engagement: {data.engagement.toFixed(2)}%
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="engagement" name="Avg Engagement Rate (%)">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </TabsContent>

      {/* Stats Summary */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {data.map((item) => (
          <div
            key={item.contentType}
            className="rounded-lg border p-3 text-center"
          >
            <div
              className="mx-auto mb-2 h-3 w-3 rounded-full"
              style={{ backgroundColor: COLORS[item.contentType as keyof typeof COLORS] }}
            />
            <p className="text-sm font-medium text-neutral-900 dark:text-white">
              {LABELS[item.contentType] || item.contentType}
            </p>
            <p className="text-2xl font-bold">{item.count}</p>
            <p className="text-xs text-neutral-500">
              {item.percentageOfTotal.toFixed(1)}%
            </p>
          </div>
        ))}
      </div>
    </Tabs>
  );
}
