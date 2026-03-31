"use client";

import * as React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EngagementData {
  date: string;
  [key: string]: string | number;
}

interface Competitor {
  id: string;
  username: string;
  color: string;
}

interface EngagementComparisonProps {
  data: EngagementData[];
  competitors: Competitor[];
  metric?: "engagementRate" | "likes" | "comments" | "shares" | "saves";
  title?: string;
}

const COLORS = [
  "#4f46e5", // primary-600
  "#22c55e", // success-500
  "#f59e0b", // warning-500
  "#ef4444", // danger-500
  "#8b5cf6", // violet-500
];

export function EngagementComparison({
  data,
  competitors,
  metric = "engagementRate",
  title = "Engagement Comparison",
}: EngagementComparisonProps) {
  const metricLabels: Record<string, string> = {
    engagementRate: "Engagement Rate (%)",
    likes: "Likes",
    comments: "Comments",
    shares: "Shares",
    saves: "Saves",
  };

  const formatValue = (value: number) => {
    if (metric === "engagementRate") {
      return `${value.toFixed(2)}%`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={formatValue}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-white p-3 shadow-lg dark:bg-neutral-800">
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">
                          {new Date(label).toLocaleDateString()}
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
                                {formatValue(entry.value)}
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
              {competitors.map((competitor, index) => (
                <Line
                  key={competitor.id}
                  type="monotone"
                  dataKey={competitor.username}
                  stroke={competitor.color || COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
