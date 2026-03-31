"use client";

import * as React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Hash, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface HashtagData {
  hashtag: string;
  yourUsage: number;
  competitorUsage: number;
  avgEngagement?: number;
  overlap?: boolean;
  performance?: 'better' | 'worse' | 'similar';
}

interface HashtagOverlapAnalysisProps {
  hashtags: HashtagData[];
  showComparison?: boolean;
}

export function HashtagOverlapAnalysis({
  hashtags,
  showComparison = false,
}: HashtagOverlapAnalysisProps) {
  const [sortBy, setSortBy] = React.useState<'usage' | 'engagement'>('engagement');

  const sortedHashtags = React.useMemo(() => {
    return [...hashtags]
      .filter(h => h.competitorUsage > 0 || h.yourUsage > 0)
      .sort((a, b) => {
        if (sortBy === 'usage') {
          return b.competitorUsage - a.competitorUsage;
        }
        return (b.avgEngagement || 0) - (a.avgEngagement || 0);
      })
      .slice(0, 15);
  }, [hashtags, sortBy]);

  const chartData = sortedHashtags.map(h => ({
    name: h.hashtag,
    you: h.yourUsage,
    competitor: h.competitorUsage,
    engagement: h.avgEngagement || 0,
  }));

  const getPerformanceIcon = (performance?: string) => {
    switch (performance) {
      case 'better':
        return <TrendingUp className="h-4 w-4 text-success-500" />;
      case 'worse':
        return <TrendingDown className="h-4 w-4 text-danger-500" />;
      default:
        return <Minus className="h-4 w-4 text-neutral-400" />;
    }
  };

  const getPerformanceBadge = (performance?: string) => {
    switch (performance) {
      case 'better':
        return <Badge variant="success" className="text-xs">Performing Better</Badge>;
      case 'worse':
        return <Badge variant="danger" className="text-xs">Opportunity</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Similar</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 80, right: 30, top: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis 
              type="category" 
              dataKey="name" 
              tick={{ fontSize: 11 }} 
              width={70}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-white p-3 shadow-lg dark:bg-neutral-800">
                      <p className="font-medium text-neutral-900 dark:text-white flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        {label}
                      </p>
                      <div className="mt-2 space-y-1 text-sm">
                        {payload.map((entry: any) => (
                          <div key={entry.name} className="flex items-center justify-between gap-4">
                            <span className="text-neutral-500">{entry.name}:</span>
                            <span className="font-medium">{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            {showComparison ? (
              <>
                <Bar dataKey="you" name="Your Usage" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                <Bar dataKey="competitor" name="Competitor Usage" fill="#22c55e" radius={[0, 4, 4, 0]} />
              </>
            ) : (
              <Bar dataKey="competitor" name="Usage Count" fill="#4f46e5" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.engagement > 3 ? '#22c55e' : entry.engagement > 1.5 ? '#f59e0b' : '#94a3b8'}
                  />
                ))}
              </Bar>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed List */}
      <div className="space-y-2">
        <h4 className="font-medium text-neutral-900 dark:text-white">Top Hashtags</h4>
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {sortedHashtags.slice(0, 8).map((hashtag) => (
            <div
              key={hashtag.hashtag}
              className="flex items-center justify-between py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/20">
                  <Hash className="h-4 w-4 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">
                    #{hashtag.hashtag}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {hashtag.competitorUsage} uses
                    {hashtag.avgEngagement && ` • ${hashtag.avgEngagement.toFixed(2)}% avg engagement`}
                  </p>
                </div>
              </div>
              {showComparison && hashtag.performance && (
                <div className="flex items-center gap-2">
                  {getPerformanceIcon(hashtag.performance)}
                  {getPerformanceBadge(hashtag.performance)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      {showComparison && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-success-50 p-4 text-center dark:bg-success-900/20">
            <p className="text-2xl font-bold text-success-600">
              {hashtags.filter(h => h.performance === 'better').length}
            </p>
            <p className="text-sm text-success-700">Performing Better</p>
          </div>
          <div className="rounded-lg bg-warning-50 p-4 text-center dark:bg-warning-900/20">
            <p className="text-2xl font-bold text-warning-600">
              {hashtags.filter(h => h.performance === 'similar').length}
            </p>
            <p className="text-sm text-warning-700">On Par</p>
          </div>
          <div className="rounded-lg bg-primary-50 p-4 text-center dark:bg-primary-900/20">
            <p className="text-2xl font-bold text-primary-600">
              {hashtags.filter(h => h.performance === 'worse').length}
            </p>
            <p className="text-sm text-primary-700">Opportunities</p>
          </div>
        </div>
      )}
    </div>
  );
}
