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
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";
import type { PeakEngagement, ActiveHour } from "@/types/audience";

interface PeakEngagementChartProps {
  data: PeakEngagement;
  height?: number;
  className?: string;
}

export function PeakEngagementChart({
  data,
  height = 250,
  className,
}: PeakEngagementChartProps) {
  const formatHour = (hour: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 || 12;
    return `${h} ${ampm}`;
  };
  
  const CustomTooltip = ({ active, payload }: {
    active?: boolean;
    payload?: Array<{ payload: ActiveHour }>;
  }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
          <p className="font-medium text-neutral-900 dark:text-white">
            {formatHour(item.hour)}
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Engagement: {item.engagement}
          </p>
          <p className="text-xs text-neutral-500">
            {item.posts} posts
          </p>
        </div>
      );
    }
    return null;
  };
  
  // Find the max value for highlighting
  const maxEngagement = Math.max(...data.hourlyDistribution.map(d => d.engagement));
  
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.hourlyDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="hour"
            tickFormatter={formatHour}
            stroke="#9ca3af"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            interval={2}
          />
          <YAxis
            stroke="#9ca3af"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="engagement" radius={[4, 4, 0, 0]}>
            {data.hourlyDistribution.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.engagement === maxEngagement ? '#3b82f6' : '#93c5fd'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface BestTimesSummaryProps {
  data: PeakEngagement;
  className?: string;
}

export function BestTimesSummary({ data, className }: BestTimesSummaryProps) {
  const getDayIcon = (day: string) => {
    const icons: Record<string, string> = {
      'Monday': 'M',
      'Tuesday': 'T',
      'Wednesday': 'W',
      'Thursday': 'T',
      'Friday': 'F',
      'Saturday': 'S',
      'Sunday': 'S',
    };
    return icons[day] || day.charAt(0);
  };
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Best Days */}
      <div>
        <h4 className="mb-2 text-sm font-medium text-neutral-900 dark:text-white">
          Best Days to Post
        </h4>
        <div className="flex flex-wrap gap-2">
          {data.bestDays.map((day, index) => (
            <div
              key={day}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2",
                index === 0
                  ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20"
                  : "border-neutral-200 dark:border-neutral-800"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                  index === 0
                    ? "bg-emerald-500 text-white"
                    : "bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300"
                )}
              >
                {getDayIcon(day)}
              </span>
              <span className="text-sm font-medium">{day}</span>
              {index === 0 && (
                <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                  Best
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Best Hours */}
      <div>
        <h4 className="mb-2 text-sm font-medium text-neutral-900 dark:text-white">
          Best Hours to Post
        </h4>
        <div className="flex flex-wrap gap-2">
          {data.bestHours.map((hour, index) => (
            <div
              key={hour}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2",
                index === 0
                  ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
                  : "border-neutral-200 dark:border-neutral-800"
              )}
            >
              <svg className="h-4 w-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">
                {hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
              </span>
              {index === 0 && (
                <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  Peak
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Timezone */}
      {data.timezone && (
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Timezone: {data.timezone}
        </div>
      )}
    </div>
  );
}

interface EngagementHeatmapProps {
  data: Array<{ day: string; hour: number; engagement: number }>;
  className?: string;
}

export function EngagementHeatmap({ data, className }: EngagementHeatmapProps) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 12 }, (_, i) => i * 2); // Every 2 hours
  
  const getIntensity = (engagement: number) => {
    if (engagement >= 80) return 'bg-emerald-500';
    if (engagement >= 60) return 'bg-emerald-400';
    if (engagement >= 40) return 'bg-emerald-300';
    if (engagement >= 20) return 'bg-emerald-200';
    return 'bg-emerald-100';
  };
  
  const getDataForCell = (day: string, hour: number) => {
    return data.find(d => d.day.toLowerCase().includes(day.toLowerCase()) && d.hour === hour);
  };
  
  return (
    <div className={cn("overflow-x-auto", className)}>
      <div className="min-w-[500px]">
        {/* Header */}
        <div className="flex">
          <div className="w-12" /> {/* Corner */}
          {hours.map(hour => (
            <div key={hour} className="flex-1 px-1 py-2 text-center text-xs text-neutral-500">
              {hour === 0 ? '12a' : hour === 12 ? '12p' : hour > 12 ? `${hour - 12}p` : `${hour}a`}
            </div>
          ))}
        </div>
        
        {/* Rows */}
        {days.map(day => (
          <div key={day} className="flex items-center">
            <div className="w-12 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300">
              {day}
            </div>
            {hours.map(hour => {
              const cellData = getDataForCell(day, hour);
              const engagement = cellData?.engagement || 0;
              
              return (
                <div
                  key={`${day}-${hour}`}
                  className={cn(
                    "flex-1 m-0.5 h-8 rounded transition-all hover:ring-2 hover:ring-blue-500",
                    getIntensity(engagement)
                  )}
                  title={`${day} ${hour}:00 - Engagement: ${engagement}`}
                />
              );
            })}
          </div>
        ))}
        
        {/* Legend */}
        <div className="mt-4 flex items-center justify-end gap-2">
          <span className="text-xs text-neutral-500">Low</span>
          <div className="flex gap-1">
            <div className="h-4 w-4 rounded bg-emerald-100" />
            <div className="h-4 w-4 rounded bg-emerald-200" />
            <div className="h-4 w-4 rounded bg-emerald-300" />
            <div className="h-4 w-4 rounded bg-emerald-400" />
            <div className="h-4 w-4 rounded bg-emerald-500" />
          </div>
          <span className="text-xs text-neutral-500">High</span>
        </div>
      </div>
    </div>
  );
}
