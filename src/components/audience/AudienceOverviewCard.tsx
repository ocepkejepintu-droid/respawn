"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { SentimentGauge, SentimentBreakdown } from "./SentimentGauge";
import type { AudienceOverview, AIInsight, SentimentAnalysis } from "@/types/audience";

interface AudienceOverviewCardProps {
  overview: AudienceOverview;
  className?: string;
}

export function AudienceOverviewCard({ overview, className }: AudienceOverviewCardProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Comments"
          value={overview.totalComments.toLocaleString()}
          change={+12.5}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          }
        />
        <MetricCard
          title="Total Engagement"
          value={overview.totalEngagement.toLocaleString()}
          change={+8.3}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          }
        />
        <MetricCard
          title="Sentiment Score"
          value={`${(overview.sentimentAnalysis.overall.compound * 100).toFixed(0)}%`}
          valueColor={overview.sentimentAnalysis.overall.compound > 0.2 ? 'text-emerald-600' : overview.sentimentAnalysis.overall.compound < -0.2 ? 'text-red-600' : 'text-amber-600'}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <MetricCard
          title="Analysis Confidence"
          value={`${(overview.sentimentAnalysis.confidence * 100).toFixed(0)}%`}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>
      
      {/* Sentiment Overview */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <h3 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white">
            Overall Sentiment
          </h3>
          <div className="flex justify-center">
            <SentimentGauge
              value={overview.sentimentAnalysis.overall.compound}
              size="lg"
            />
          </div>
        </div>
        
        <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <h3 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white">
            Sentiment Breakdown
          </h3>
          <SentimentBreakdown
            positive={overview.sentimentAnalysis.overall.positive}
            negative={overview.sentimentAnalysis.overall.negative}
            neutral={overview.sentimentAnalysis.overall.neutral}
          />
        </div>
        
        <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <h3 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white">
            Top Insights
          </h3>
          <div className="space-y-3">
            {overview.insights.slice(0, 3).map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  valueColor?: string;
  icon: React.ReactNode;
}

function MetricCard({ title, value, change, valueColor, icon }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{title}</p>
          <p className={cn("mt-1 text-2xl font-bold", valueColor || "text-neutral-900 dark:text-white")}>
            {value}
          </p>
          {change !== undefined && (
            <p className={cn(
              "mt-1 text-sm",
              change >= 0 ? "text-emerald-600" : "text-red-600"
            )}>
              {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
            </p>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
          {icon}
        </div>
      </div>
    </div>
  );
}

interface InsightCardProps {
  insight: AIInsight;
}

function InsightCard({ insight }: InsightCardProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
          </span>
        );
      case 'risk':
      case 'alert':
        return (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </span>
        );
      default:
        return (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </span>
        );
    }
  };
  
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'medium':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };
  
  return (
    <div className="flex items-start gap-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
      {getTypeIcon(insight.type)}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
            {insight.title}
          </p>
          <span className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
            getPriorityBadge(insight.priority)
          )}>
            {insight.priority}
          </span>
        </div>
        <p className="mt-1 text-xs text-neutral-500 line-clamp-2">
          {insight.description}
        </p>
      </div>
    </div>
  );
}

interface SentimentByPlatformProps {
  byPlatform: Record<string, SentimentAnalysis['overall']>;
  className?: string;
}

export function SentimentByPlatform({ byPlatform, className }: SentimentByPlatformProps) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
      {Object.entries(byPlatform).map(([platform, sentiment]) => (
        <div
          key={platform}
          className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-medium capitalize text-neutral-900 dark:text-white">
              {platform}
            </h4>
            <span className={cn(
              "text-lg font-bold",
              sentiment.compound > 0.2 ? "text-emerald-600" :
              sentiment.compound < -0.2 ? "text-red-600" : "text-amber-600"
            )}>
              {(sentiment.compound * 100).toFixed(0)}%
            </span>
          </div>
          
          <div className="mt-3 flex h-2 overflow-hidden rounded-full">
            <div
              className="bg-emerald-500"
              style={{ width: `${sentiment.positive}%` }}
            />
            <div
              className="bg-amber-400"
              style={{ width: `${sentiment.neutral}%` }}
            />
            <div
              className="bg-red-500"
              style={{ width: `${sentiment.negative}%` }}
            />
          </div>
          
          <div className="mt-2 flex justify-between text-xs text-neutral-500">
            <span>{sentiment.positive}% positive</span>
            <span>{sentiment.negative}% negative</span>
          </div>
        </div>
      ))}
    </div>
  );
}
