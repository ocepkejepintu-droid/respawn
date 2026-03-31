"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { TrendIndicator } from "./trend-indicator";
import { ProgressBar } from "./progress-bar";

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
    direction: "up" | "down" | "neutral";
  };
  icon?: React.ReactNode;
  iconColor?: "primary" | "success" | "warning" | "danger" | "neutral";
  progress?: {
    current: number;
    max: number;
    label?: string;
  };
  loading?: boolean;
  href?: string;
  onClick?: () => void;
}

const iconColorClasses = {
  primary: "bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400",
  success: "bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400",
  warning: "bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400",
  danger: "bg-danger-100 text-danger-600 dark:bg-danger-900/30 dark:text-danger-400",
  neutral: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
};

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      className,
      title,
      value,
      subtitle,
      trend,
      icon,
      iconColor = "primary",
      progress,
      loading = false,
      href,
      onClick,
      ...props
    },
    ref
  ) => {
    const cardContent = (
      <>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              {title}
            </p>
            {loading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
            ) : (
              <p className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                {value}
              </p>
            )}
          </div>
          {icon && (
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-lg",
                iconColorClasses[iconColor]
              )}
            >
              {icon}
            </div>
          )}
        </div>

        {(trend || subtitle || progress) && (
          <div className="mt-4 space-y-3">
            {trend && (
              <div className="flex items-center gap-2">
                <TrendIndicator
                  direction={trend.direction}
                  value={trend.value}
                />
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                  {trend.label}
                </span>
              </div>
            )}
            {subtitle && !trend && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {subtitle}
              </p>
            )}
            {progress && (
              <div className="space-y-2">
                <ProgressBar
                  value={progress.current}
                  max={progress.max}
                  size="sm"
                  variant={
                    progress.current / progress.max >= 0.9
                      ? "success"
                      : progress.current / progress.max >= 0.7
                      ? "warning"
                      : "default"
                  }
                />
                {progress.label && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {progress.label}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </>
    );

    const baseClasses = cn(
      "rounded-lg border border-neutral-200 bg-white p-6 shadow-sm transition-all dark:border-neutral-800 dark:bg-neutral-900",
      (href || onClick) &&
        "cursor-pointer hover:border-primary-300 hover:shadow-md dark:hover:border-primary-700",
      className
    );

    if (href) {
      return (
        <a ref={ref as React.Ref<HTMLAnchorElement>} href={href} className={baseClasses} {...props}>
          {cardContent}
        </a>
      );
    }

    return (
      <div
        ref={ref}
        className={baseClasses}
        onClick={onClick}
        {...props}
      >
        {cardContent}
      </div>
    );
  }
);
StatCard.displayName = "StatCard";

interface StatCardGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
}

const StatCardGrid = React.forwardRef<HTMLDivElement, StatCardGridProps>(
  ({ className, columns = 4, gap = "md", children, ...props }, ref) => {
    const columnClasses = {
      1: "grid-cols-1",
      2: "grid-cols-1 sm:grid-cols-2",
      3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    };

    const gapClasses = {
      sm: "gap-4",
      md: "gap-6",
      lg: "gap-8",
    };

    return (
      <div
        ref={ref}
        className={cn("grid", columnClasses[columns], gapClasses[gap], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
StatCardGrid.displayName = "StatCardGrid";

export { StatCard, StatCardGrid };
