"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

interface TrendIndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  direction: "up" | "down" | "neutral";
  value: number;
  showIcon?: boolean;
  format?: "percentage" | "number" | "currency";
  currency?: string;
  decimals?: number;
  size?: "sm" | "md" | "lg";
  inverseColors?: boolean;
}

const TrendIndicator = React.forwardRef<HTMLSpanElement, TrendIndicatorProps>(
  (
    {
      className,
      direction,
      value,
      showIcon = true,
      format = "percentage",
      currency = "$",
      decimals = 1,
      size = "md",
      inverseColors = false,
      ...props
    },
    ref
  ) => {
    const formatValue = (val: number): string => {
      const absValue = Math.abs(val);
      switch (format) {
        case "percentage":
          return `${absValue.toFixed(decimals)}%`;
        case "currency":
          return `${currency}${absValue.toFixed(decimals)}`;
        case "number":
          return absValue.toFixed(decimals);
        default:
          return `${absValue.toFixed(decimals)}%`;
      }
    };

    const getDirectionColor = () => {
      if (direction === "neutral") {
        return "text-neutral-500 dark:text-neutral-400";
      }

      const isPositive = direction === "up";
      const shouldShowPositive = inverseColors ? !isPositive : isPositive;

      return shouldShowPositive
        ? "text-success-600 dark:text-success-400"
        : "text-danger-600 dark:text-danger-400";
    };

    const getBgColor = () => {
      if (direction === "neutral") {
        return "bg-neutral-100 dark:bg-neutral-800";
      }

      const isPositive = direction === "up";
      const shouldShowPositive = inverseColors ? !isPositive : isPositive;

      return shouldShowPositive
        ? "bg-success-100 dark:bg-success-900/30"
        : "bg-danger-100 dark:bg-danger-900/30";
    };

    const sizeClasses = {
      sm: "text-xs gap-0.5 px-1.5 py-0.5",
      md: "text-sm gap-1 px-2 py-1",
      lg: "text-base gap-1.5 px-2.5 py-1.5",
    };

    const iconSizes = {
      sm: "h-3 w-3",
      md: "h-4 w-4",
      lg: "h-5 w-5",
    };

    const getIcon = () => {
      switch (direction) {
        case "up":
          return <ArrowUp className={iconSizes[size]} />;
        case "down":
          return <ArrowDown className={iconSizes[size]} />;
        case "neutral":
          return <Minus className={iconSizes[size]} />;
      }
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full font-medium",
          getDirectionColor(),
          getBgColor(),
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {showIcon && getIcon()}
        <span>{formatValue(value)}</span>
      </span>
    );
  }
);
TrendIndicator.displayName = "TrendIndicator";

interface TrendComparisonProps extends React.HTMLAttributes<HTMLDivElement> {
  current: number;
  previous: number;
  label?: string;
  format?: "percentage" | "number" | "currency";
  inverseColors?: boolean;
}

const TrendComparison = React.forwardRef<HTMLDivElement, TrendComparisonProps>(
  (
    {
      className,
      current,
      previous,
      label,
      format = "percentage",
      inverseColors = false,
      ...props
    },
    ref
  ) => {
    const calculateChange = (): { direction: "up" | "down" | "neutral"; value: number } => {
      if (previous === 0) {
        return { direction: current > 0 ? "up" : "neutral", value: current > 0 ? 100 : 0 };
      }

      const change = ((current - previous) / Math.abs(previous)) * 100;

      if (Math.abs(change) < 0.01) {
        return { direction: "neutral", value: 0 };
      }

      return {
        direction: change > 0 ? "up" : "down",
        value: Math.abs(change),
      };
    };

    const { direction, value } = calculateChange();

    const formatDisplay = (val: number): string => {
      switch (format) {
        case "percentage":
          return `${val.toFixed(1)}%`;
        case "currency":
          return `$${val.toFixed(2)}`;
        case "number":
          return val.toLocaleString();
        default:
          return `${val.toFixed(1)}%`;
      }
    };

    return (
      <div ref={ref} className={cn("space-y-1", className)} {...props}>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-neutral-900 dark:text-white">
            {formatDisplay(current)}
          </span>
          <TrendIndicator
            direction={direction}
            value={value}
            format="percentage"
            inverseColors={inverseColors}
          />
        </div>
        {label && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
        )}
      </div>
    );
  }
);
TrendComparison.displayName = "TrendComparison";

export { TrendIndicator, TrendComparison };
