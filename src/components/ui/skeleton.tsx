"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "circle" | "text";
  animation?: "pulse" | "shimmer" | "none";
}

function Skeleton({
  className,
  variant = "default",
  animation = "pulse",
  ...props
}: SkeletonProps) {
  const baseClasses = "bg-neutral-200 dark:bg-neutral-700";

  const variantClasses = {
    default: "rounded-md",
    circle: "rounded-full",
    text: "rounded",
  };

  const animationClasses = {
    pulse: "animate-pulse",
    shimmer: "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
    none: "",
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      {...props}
    />
  );
}

interface SkeletonTextProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number;
  lastLineWidth?: string;
}

function SkeletonText({
  className,
  lines = 3,
  lastLineWidth = "60%",
  ...props
}: SkeletonTextProps) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={cn(
            "h-4 w-full",
            i === lines - 1 && lastLineWidth !== "100%" && `w-[${lastLineWidth}]`
          )}
          style={i === lines - 1 ? { width: lastLineWidth } : undefined}
        />
      ))}
    </div>
  );
}

interface SkeletonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hasImage?: boolean;
  hasHeader?: boolean;
  hasFooter?: boolean;
  contentLines?: number;
}

function SkeletonCard({
  className,
  hasImage = false,
  hasHeader = true,
  hasFooter = false,
  contentLines = 3,
  ...props
}: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900",
        className
      )}
      {...props}
    >
      {hasImage && (
        <Skeleton className="mb-4 h-48 w-full rounded-lg" />
      )}
      {hasHeader && (
        <div className="mb-4 flex items-center gap-3">
          <Skeleton variant="circle" className="h-10 w-10" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="h-4 w-1/3" />
            <Skeleton variant="text" className="h-3 w-1/4" />
          </div>
        </div>
      )}
      <SkeletonText lines={contentLines} />
      {hasFooter && (
        <div className="mt-4 flex items-center justify-between">
          <Skeleton variant="text" className="h-8 w-24" />
          <Skeleton variant="text" className="h-8 w-20" />
        </div>
      )}
    </div>
  );
}

interface SkeletonStatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hasTrend?: boolean;
}

function SkeletonStatCard({
  className,
  hasTrend = true,
  ...props
}: SkeletonStatCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton variant="text" className="h-4 w-24" />
          <Skeleton variant="text" className="h-8 w-32" />
        </div>
        <Skeleton variant="circle" className="h-10 w-10" />
      </div>
      {hasTrend && (
        <div className="mt-4 flex items-center gap-2">
          <Skeleton variant="text" className="h-4 w-16" />
          <Skeleton variant="text" className="h-4 w-20" />
        </div>
      )}
    </div>
  );
}

interface SkeletonTableProps extends React.HTMLAttributes<HTMLDivElement> {
  rows?: number;
  columns?: number;
  hasHeader?: boolean;
}

function SkeletonTable({
  className,
  rows = 5,
  columns = 4,
  hasHeader = true,
  ...props
}: SkeletonTableProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900",
        className
      )}
      {...props}
    >
      {hasHeader && (
        <div className="border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
          <div className="flex gap-4">
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton
                key={i}
                variant="text"
                className="h-4 flex-1"
              />
            ))}
          </div>
        </div>
      )}
      <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-4 px-6 py-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                variant="text"
                className="h-4 flex-1"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonStatCard,
  SkeletonTable,
};
