"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  min?: number;
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  showLabel?: boolean;
  labelPosition?: "inside" | "outside";
  labelFormat?: "percentage" | "value" | "fraction";
  animated?: boolean;
  striped?: boolean;
  indeterminate?: boolean;
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      className,
      value,
      max = 100,
      min = 0,
      size = "md",
      variant = "default",
      showLabel = false,
      labelPosition = "outside",
      labelFormat = "percentage",
      animated = true,
      striped = false,
      indeterminate = false,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(
      100,
      Math.max(0, ((value - min) / (max - min)) * 100)
    );

    const sizeClasses = {
      xs: "h-1",
      sm: "h-2",
      md: "h-3",
      lg: "h-4",
    };

    const variantClasses = {
      default: "bg-primary-600",
      primary: "bg-primary-600",
      success: "bg-success-500",
      warning: "bg-warning-500",
      danger: "bg-danger-500",
    };

    const getLabel = (): string => {
      switch (labelFormat) {
        case "percentage":
          return `${Math.round(percentage)}%`;
        case "value":
          return `${value}`;
        case "fraction":
          return `${value}/${max}`;
        default:
          return `${Math.round(percentage)}%`;
      }
    };

    return (
      <div
        ref={ref}
        className={cn("w-full", className)}
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : value}
        aria-valuemin={min}
        aria-valuemax={max}
        {...props}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "relative w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700",
              sizeClasses[size]
            )}
          >
            {indeterminate ? (
              <div
                className={cn(
                  "absolute h-full w-1/3 animate-[shimmer_1.5s_infinite] rounded-full",
                  variantClasses[variant]
                )}
                style={{
                  animation: "progress-indeterminate 1.5s ease-in-out infinite",
                }}
              />
            ) : (
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500 ease-out",
                  variantClasses[variant],
                  animated && "transition-all duration-500",
                  striped &&
                    "bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_25%,rgba(255,255,255,0.3)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.3)_75%,rgba(255,255,255,0.3)_100%)] bg-[length:1rem_1rem]",
                  striped && animated && "animate-[progress-stripes_1s_linear_infinite]"
                )}
                style={{ width: `${percentage}%` }}
              />
            )}
          </div>
          {showLabel && labelPosition === "outside" && (
            <span className="min-w-[3rem] text-right text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {getLabel()}
            </span>
          )}
        </div>
        {showLabel && labelPosition === "inside" && !indeterminate && (
          <div className="mt-1 text-center text-xs font-medium text-neutral-600 dark:text-neutral-400">
            {getLabel()}
          </div>
        )}
      </div>
    );
  }
);
ProgressBar.displayName = "ProgressBar";

interface MultiProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  segments: {
    value: number;
    color: string;
    label?: string;
  }[];
  max?: number;
  size?: "xs" | "sm" | "md" | "lg";
  showLegend?: boolean;
}

const MultiProgressBar = React.forwardRef<HTMLDivElement, MultiProgressBarProps>(
  (
    { className, segments, max = 100, size = "md", showLegend = false, ...props },
    ref
  ) => {
    const totalValue = segments.reduce((sum, seg) => sum + seg.value, 0);
    const percentage = Math.min(100, (totalValue / max) * 100);

    const sizeClasses = {
      xs: "h-1",
      sm: "h-2",
      md: "h-3",
      lg: "h-4",
    };

    return (
      <div ref={ref} className={cn("w-full space-y-2", className)} {...props}>
        <div
          className={cn(
            "flex w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700",
            sizeClasses[size]
          )}
        >
          {segments.map((segment, index) => {
            const segmentPercentage = (segment.value / max) * 100;
            return (
              <div
                key={index}
                className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                style={{
                  width: `${segmentPercentage}%`,
                  backgroundColor: segment.color,
                }}
                title={`${segment.label || `Segment ${index + 1}`}: ${segment.value}`}
              />
            );
          })}
        </div>
        {showLegend && (
          <div className="flex flex-wrap gap-3">
            {segments.map((segment, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-xs text-neutral-600 dark:text-neutral-400">
                  {segment.label || `Segment ${index + 1}`} ({segment.value})
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);
MultiProgressBar.displayName = "MultiProgressBar";

// Add keyframe animation for indeterminate progress
const progressStyles = `
@keyframes progress-indeterminate {
  0% {
    left: -33%;
  }
  100% {
    left: 100%;
  }
}

@keyframes progress-stripes {
  0% {
    background-position: 1rem 0;
  }
  100% {
    background-position: 0 0;
  }
}
`;

export { ProgressBar, MultiProgressBar, progressStyles };
