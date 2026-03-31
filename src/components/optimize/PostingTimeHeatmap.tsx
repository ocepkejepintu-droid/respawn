"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PostingTimeHeatmap as HeatmapData, DayOfWeek } from "@/types/optimize";
import { Clock, Info } from "lucide-react";

interface PostingTimeHeatmapProps {
  data: HeatmapData[];
  className?: string;
  onTimeSelect?: (day: DayOfWeek, hour: number) => void;
  selectedSlot?: { day: DayOfWeek; hour: number } | null;
}

const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function PostingTimeHeatmap({
  data,
  className,
  onTimeSelect,
  selectedSlot,
}: PostingTimeHeatmapProps) {
  const [hoveredSlot, setHoveredSlot] = useState<{ day: DayOfWeek; hour: number } | null>(null);

  const maxScore = useMemo(() => {
    return Math.max(...data.map(d => d.score));
  }, [data]);

  const getScoreForSlot = (day: DayOfWeek, hour: number): number => {
    const slot = data.find(d => d.day === day && d.hour === hour);
    return slot?.score || 0;
  };

  const getEngagementForSlot = (day: DayOfWeek, hour: number): number => {
    const slot = data.find(d => d.day === day && d.hour === hour);
    return slot?.avgEngagementRate || 0;
  };

  const getPostCountForSlot = (day: DayOfWeek, hour: number): number => {
    const slot = data.find(d => d.day === day && d.hour === hour);
    return slot?.totalPosts || 0;
  };

  const getHeatmapColor = (score: number): string => {
    const intensity = score / 100;
    if (intensity >= 0.8) return "bg-success-500";
    if (intensity >= 0.6) return "bg-success-400";
    if (intensity >= 0.5) return "bg-primary-400";
    if (intensity >= 0.4) return "bg-primary-300";
    if (intensity >= 0.3) return "bg-warning-300";
    if (intensity >= 0.2) return "bg-warning-200";
    if (intensity >= 0.1) return "bg-neutral-200";
    return "bg-neutral-100 dark:bg-neutral-800";
  };

  const hoveredData = hoveredSlot ? {
    score: getScoreForSlot(hoveredSlot.day, hoveredSlot.hour),
    engagement: getEngagementForSlot(hoveredSlot.day, hoveredSlot.hour),
    posts: getPostCountForSlot(hoveredSlot.day, hoveredSlot.hour),
  } : null;

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary-500" />
              Best Times to Post
            </CardTitle>
            <CardDescription>
              Based on your historical engagement data
            </CardDescription>
          </div>
          {hoveredData && (
            <div className="rounded-lg bg-neutral-50 px-4 py-2 text-sm dark:bg-neutral-800">
              <div className="font-medium text-neutral-900 dark:text-white">
                {capitalize(hoveredSlot!.day)} at {formatHour(hoveredSlot!.hour)}
              </div>
              <div className="text-neutral-500 dark:text-neutral-400">
                Score: {hoveredData.score.toFixed(0)}/100
              </div>
              <div className="text-neutral-500 dark:text-neutral-400">
                Engagement: {(hoveredData.engagement * 100).toFixed(2)}%
              </div>
              <div className="text-neutral-500 dark:text-neutral-400">
                Posts analyzed: {hoveredData.posts}
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Heatmap Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Day Labels */}
              <div className="mb-2 flex">
                <div className="w-12" /> {/* Spacer for hour labels */}
                <div className="flex flex-1">
                  {DAY_LABELS.map((label) => (
                    <div
                      key={label}
                      className="flex-1 text-center text-xs font-medium text-neutral-500 dark:text-neutral-400"
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Heatmap Rows */}
              <div className="space-y-1">
                {Array.from({ length: 24 }, (_, hour) => (
                  <div key={hour} className="flex items-center">
                    {/* Hour Label */}
                    <div className="w-12 pr-2 text-right text-xs text-neutral-400 dark:text-neutral-500">
                      {formatHour(hour)}
                    </div>
                    
                    {/* Day Cells */}
                    <div className="flex flex-1 gap-0.5">
                      {DAYS.map((day) => {
                        const score = getScoreForSlot(day, hour);
                        const isSelected = selectedSlot?.day === day && selectedSlot?.hour === hour;
                        const isHovered = hoveredSlot?.day === day && hoveredSlot?.hour === hour;

                        return (
                          <button
                            key={`${day}-${hour}`}
                            className={cn(
                              "flex-1 aspect-square rounded transition-all duration-200",
                              getHeatmapColor(score),
                              isSelected && "ring-2 ring-primary-500 ring-offset-2",
                              isHovered && "ring-2 ring-neutral-400 ring-offset-1",
                              score === 0 && "opacity-30",
                              onTimeSelect && "cursor-pointer hover:opacity-80"
                            )}
                            onMouseEnter={() => setHoveredSlot({ day, hour })}
                            onMouseLeave={() => setHoveredSlot(null)}
                            onClick={() => onTimeSelect?.(day, hour)}
                            title={`${capitalize(day)} ${formatHour(hour)}: Score ${score.toFixed(0)}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-4 py-3 text-sm dark:bg-neutral-800">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-neutral-400" />
              <span className="text-neutral-600 dark:text-neutral-400">
                Hover over cells to see detailed metrics
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">Low</span>
                <div className="flex gap-0.5">
                  <div className="h-4 w-4 rounded bg-neutral-100 dark:bg-neutral-800" />
                  <div className="h-4 w-4 rounded bg-warning-200" />
                  <div className="h-4 w-4 rounded bg-warning-300" />
                  <div className="h-4 w-4 rounded bg-primary-300" />
                  <div className="h-4 w-4 rounded bg-primary-400" />
                  <div className="h-4 w-4 rounded bg-success-400" />
                  <div className="h-4 w-4 rounded bg-success-500" />
                </div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">High</span>
              </div>
            </div>
          </div>

          {/* Key Insights */}
          <div className="grid gap-3 sm:grid-cols-3">
            <InsightCard
              label="Best Day"
              value={getBestDay(data)}
              icon="calendar"
            />
            <InsightCard
              label="Best Hour"
              value={getBestHour(data)}
              icon="clock"
            />
            <InsightCard
              label="Peak Score"
              value={`${maxScore.toFixed(0)}/100`}
              icon="trending"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InsightCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: "calendar" | "clock" | "trending";
}) {
  const icons = {
    calendar: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    clock: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    trending: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-800">
      <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
        {icons[icon]}
        <span className="text-xs">{label}</span>
      </div>
      <div className="mt-1 text-lg font-semibold text-neutral-900 dark:text-white">
        {value}
      </div>
    </div>
  );
}

// Helper functions
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatHour(hour: number): string {
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour} ${ampm}`;
}

function getBestDay(data: HeatmapData[]): string {
  const dayScores: Record<DayOfWeek, number> = {
    monday: 0, tuesday: 0, wednesday: 0, thursday: 0,
    friday: 0, saturday: 0, sunday: 0
  };
  
  data.forEach(d => {
    dayScores[d.day] += d.score;
  });
  
  const bestDay = Object.entries(dayScores).sort((a, b) => b[1] - a[1])[0];
  return bestDay ? capitalize(bestDay[0]) : "-";
}

function getBestHour(data: HeatmapData[]): string {
  const hourScores: Record<number, number> = {};
  
  data.forEach(d => {
    hourScores[d.hour] = (hourScores[d.hour] || 0) + d.score;
  });
  
  const bestHour = Object.entries(hourScores).sort((a, b) => b[1] - a[1])[0];
  return bestHour ? formatHour(parseInt(bestHour[0])) : "-";
}
