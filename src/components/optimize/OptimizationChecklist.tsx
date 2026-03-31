"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { OptimizationChecklist as ChecklistType } from "@/types/optimize";
import { 
  CheckCircle2, 
  Circle, 
  AlertCircle,
  ListTodo,
  Type,
  Hash,
  Image,
  Clock,
  Heart,
  Sparkles
} from "lucide-react";

interface OptimizationChecklistProps {
  checklist: ChecklistType;
  className?: string;
  onItemToggle?: (itemId: string) => void;
  showCategories?: boolean;
}

const categoryIcons = {
  caption: <Type className="h-4 w-4" />,
  hashtags: <Hash className="h-4 w-4" />,
  visual: <Image className="h-4 w-4" />,
  timing: <Clock className="h-4 w-4" />,
  engagement: <Heart className="h-4 w-4" />,
};

const categoryLabels = {
  caption: "Caption",
  hashtags: "Hashtags",
  visual: "Visual",
  timing: "Timing",
  engagement: "Engagement",
};

const impactColors = {
  high: "text-danger-600 dark:text-danger-400",
  medium: "text-warning-600 dark:text-warning-400",
  low: "text-neutral-500 dark:text-neutral-400",
};

export function OptimizationChecklist({
  checklist,
  className,
  onItemToggle,
  showCategories = true,
}: OptimizationChecklistProps) {
  const completionPercentage = checklist.totalCount > 0
    ? Math.round((checklist.completedCount / checklist.totalCount) * 100)
    : 0;

  const groupedItems = checklist.items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof checklist.items>);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success-600 dark:text-success-400";
    if (score >= 60) return "text-warning-600 dark:text-warning-400";
    return "text-danger-600 dark:text-danger-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-success-500";
    if (score >= 60) return "bg-warning-500";
    return "bg-danger-500";
  };

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ListTodo className="h-5 w-5 text-primary-500" />
              Optimization Checklist
            </CardTitle>
            <CardDescription>
              Ensure your content is fully optimized
            </CardDescription>
          </div>
          <div className="text-right">
            <div className={cn("text-2xl font-bold", getScoreColor(checklist.score))}>
              {checklist.score}%
            </div>
            <div className="text-sm text-neutral-500 dark:text-neutral-400">
              {checklist.completedCount}/{checklist.totalCount} completed
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600 dark:text-neutral-400">Completion</span>
            <span className={cn("font-medium", getScoreColor(completionPercentage))}>
              {completionPercentage}%
            </span>
          </div>
          <ProgressBar
            value={completionPercentage}
            max={100}
            size="md"
            variant={completionPercentage >= 80 ? "success" : completionPercentage >= 60 ? "warning" : "danger"}
          />
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-3 gap-3 rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800/50">
          <div className="text-center">
            <div className={cn("text-xl font-bold", getScoreColor(checklist.score))}>
              {checklist.score}
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Overall Score</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-neutral-900 dark:text-white">
              {checklist.items.filter(i => i.isRequired).length}
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Required</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-neutral-900 dark:text-white">
              {checklist.items.filter(i => i.impact === 'high').length}
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">High Impact</div>
          </div>
        </div>

        {/* Checklist Items by Category */}
        {showCategories ? (
          Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                  {categoryIcons[category as keyof typeof categoryIcons]}
                </div>
                <h4 className="font-medium text-neutral-900 dark:text-white">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </h4>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                  ({items.filter(i => i.isCompleted).length}/{items.length})
                </span>
              </div>
              
              <div className="space-y-2">
                {items.map((item) => (
                  <ChecklistItem
                    key={item.id}
                    item={item}
                    onToggle={() => onItemToggle?.(item.id)}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="space-y-2">
            {checklist.items.map((item) => (
              <ChecklistItem
                key={item.id}
                item={item}
                onToggle={() => onItemToggle?.(item.id)}
              />
            ))}
          </div>
        )}

        {/* Summary */}
        <div className="rounded-lg bg-primary-50 p-4 dark:bg-primary-900/10">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-500" />
            <div>
              <h4 className="font-medium text-primary-900 dark:text-primary-100">
                {checklist.score >= 80 
                  ? "Excellent! Your content is well-optimized"
                  : checklist.score >= 60
                  ? "Good progress! A few more optimizations recommended"
                  : "Your content needs optimization"}
              </h4>
              <p className="mt-1 text-sm text-primary-700 dark:text-primary-300">
                {checklist.score >= 80 
                  ? "You're following best practices. Your content should perform well!"
                  : checklist.score >= 60
                  ? `Complete ${checklist.totalCount - checklist.completedCount} more items to improve your score.`
                  : `Complete ${checklist.totalCount - checklist.completedCount} items to significantly improve your content's performance.`}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChecklistItem({
  item,
  onToggle,
}: {
  item: ChecklistType['items'][0];
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3 transition-all",
        item.isCompleted
          ? "border-success-200 bg-success-50/50 dark:border-success-800 dark:bg-success-900/10"
          : "border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800",
        onToggle && "cursor-pointer hover:border-primary-300 dark:hover:border-primary-700"
      )}
      onClick={onToggle}
    >
      <div className="mt-0.5 flex-shrink-0">
        {item.isCompleted ? (
          <CheckCircle2 className="h-5 w-5 text-success-500" />
        ) : item.isRequired ? (
          <AlertCircle className="h-5 w-5 text-danger-500" />
        ) : (
          <Circle className="h-5 w-5 text-neutral-300 dark:text-neutral-600" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "font-medium",
              item.isCompleted
                ? "text-neutral-500 line-through dark:text-neutral-400"
                : "text-neutral-900 dark:text-white"
            )}
          >
            {item.title}
          </span>
          {item.isRequired && !item.isCompleted && (
            <span className="rounded-full bg-danger-100 px-2 py-0.5 text-xs font-medium text-danger-700 dark:bg-danger-900/20 dark:text-danger-400">
              Required
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
          {item.description}
        </p>
        <div className="mt-2 flex items-center gap-3">
          <span
            className={cn(
              "text-xs font-medium",
              impactColors[item.impact]
            )}
          >
            {item.impact.charAt(0).toUpperCase() + item.impact.slice(1)} Impact
          </span>
          {item.autoCheckable && (
            <span className="text-xs text-neutral-400 dark:text-neutral-500">
              Auto-checked
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Simple Stat Card for use in other components
export function ChecklistMini({
  score,
  completed,
  total,
  className,
}: {
  score: number;
  completed: number;
  total: number;
  className?: string;
}) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className={cn("rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-primary-500" />
          <span className="font-medium text-neutral-900 dark:text-white">
            Checklist
          </span>
        </div>
        <span
          className={cn(
            "text-lg font-bold",
            score >= 80
              ? "text-success-600 dark:text-success-400"
              : score >= 60
              ? "text-warning-600 dark:text-warning-400"
              : "text-danger-600 dark:text-danger-400"
          )}
        >
          {score}%
        </span>
      </div>
      <div className="mt-3">
        <ProgressBar
          value={percentage}
          max={100}
          size="sm"
          variant={percentage >= 80 ? "success" : percentage >= 60 ? "warning" : "danger"}
        />
      </div>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        {completed} of {total} items completed
      </p>
    </div>
  );
}
