"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { TrendIndicator } from "@/components/ui/trend-indicator";
import { ContentScore } from "@/types/optimize";
import { Sparkles, AlertCircle, CheckCircle2, Target } from "lucide-react";

interface ContentScoreCardProps {
  score: ContentScore;
  className?: string;
  showBreakdown?: boolean;
  showSuggestions?: boolean;
  onOptimize?: () => void;
  loading?: boolean;
}

const gradeColors = {
  A: "text-success-600 bg-success-50 dark:bg-success-900/20",
  B: "text-primary-600 bg-primary-50 dark:bg-primary-900/20",
  C: "text-warning-600 bg-warning-50 dark:bg-warning-900/20",
  D: "text-orange-600 bg-orange-50 dark:bg-orange-900/20",
  F: "text-danger-600 bg-danger-50 dark:bg-danger-900/20",
};

const gradeLabels = {
  A: "Excellent",
  B: "Good",
  C: "Average",
  D: "Needs Work",
  F: "Poor",
};

export function ContentScoreCard({
  score,
  className,
  showBreakdown = true,
  showSuggestions = true,
  onOptimize,
  loading = false,
}: ContentScoreCardProps) {
  if (loading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader>
          <div className="h-6 w-32 rounded bg-neutral-200 dark:bg-neutral-700" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-32 rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-4 rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-4 rounded bg-neutral-200 dark:bg-neutral-700" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-primary-500" />
            Content Score
          </CardTitle>
          {score.overall >= 80 ? (
            <CheckCircle2 className="h-5 w-5 text-success-500" />
          ) : score.overall >= 60 ? (
            <AlertCircle className="h-5 w-5 text-warning-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-danger-500" />
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="flex items-center gap-6">
          <div className="relative flex h-28 w-28 items-center justify-center">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-neutral-100 dark:text-neutral-800"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${score.overall * 2.64} 264`}
                className={cn(
                  "transition-all duration-1000 ease-out",
                  score.overall >= 80 ? "text-success-500" :
                  score.overall >= 60 ? "text-warning-500" :
                  "text-danger-500"
                )}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-neutral-900 dark:text-white">
                {score.overall}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                /100
              </span>
            </div>
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-sm font-semibold",
                  gradeColors[score.grade]
                )}
              >
                {score.grade}
              </span>
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {gradeLabels[score.grade]}
              </span>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {score.overall >= 80
                ? "Your content is well-optimized!"
                : score.overall >= 60
                ? "Good foundation with room for improvement"
                : "Several optimizations recommended"}
            </p>
            {onOptimize && score.overall < 90 && (
              <button
                onClick={onOptimize}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/30"
              >
                <Sparkles className="h-4 w-4" />
                Auto-Optimize
              </button>
            )}
          </div>
        </div>

        {/* Score Breakdown */}
        {showBreakdown && (
          <div className="space-y-3 rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800/50">
            <h4 className="text-sm font-medium text-neutral-900 dark:text-white">
              Score Breakdown
            </h4>
            <div className="space-y-3">
              <ScoreBar label="Caption" score={score.breakdown.caption} />
              <ScoreBar label="Hashtags" score={score.breakdown.hashtags} />
              <ScoreBar label="Timing" score={score.breakdown.timing} />
              <ScoreBar label="Visual" score={score.breakdown.visual} />
              <ScoreBar label="Engagement" score={score.breakdown.engagement} />
            </div>
          </div>
        )}

        {/* Suggestions */}
        {showSuggestions && score.suggestions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-neutral-900 dark:text-white">
              Suggestions
            </h4>
            <ul className="space-y-2">
              {score.suggestions.slice(0, 3).map((suggestion, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning-500" />
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-neutral-600 dark:text-neutral-400">{label}</span>
        <span
          className={cn(
            "font-medium",
            score >= 80
              ? "text-success-600 dark:text-success-400"
              : score >= 60
              ? "text-warning-600 dark:text-warning-400"
              : "text-danger-600 dark:text-danger-400"
          )}
        >
          {score}
        </span>
      </div>
      <ProgressBar
        value={score}
        max={100}
        size="sm"
        variant={
          score >= 80 ? "success" : score >= 60 ? "warning" : "danger"
        }
      />
    </div>
  );
}
