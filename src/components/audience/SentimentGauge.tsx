"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SentimentGaugeProps {
  value: number; // -1 to 1
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { width: 120, strokeWidth: 8, fontSize: 24 },
  md: { width: 160, strokeWidth: 12, fontSize: 32 },
  lg: { width: 200, strokeWidth: 16, fontSize: 40 },
};

export function SentimentGauge({
  value,
  size = "md",
  showLabels = true,
  className,
}: SentimentGaugeProps) {
  const config = sizeConfig[size];
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = radius * Math.PI;
  const center = config.width / 2;
  
  // Normalize value to 0-1 for the gauge (semicircle)
  const normalizedValue = (value + 1) / 2;
  const strokeDashoffset = circumference * (1 - normalizedValue);
  
  // Determine color based on value
  const getColor = (val: number) => {
    if (val >= 0.5) return "text-emerald-500";
    if (val >= 0.2) return "text-emerald-400";
    if (val >= -0.2) return "text-amber-400";
    if (val >= -0.5) return "text-orange-500";
    return "text-red-500";
  };
  
  const getGradientColor = (val: number) => {
    if (val >= 0.5) return "#10b981";
    if (val >= 0.2) return "#34d399";
    if (val >= -0.2) return "#fbbf24";
    if (val >= -0.5) return "#f97316";
    return "#ef4444";
  };
  
  const getLabel = (val: number) => {
    if (val >= 0.5) return "Very Positive";
    if (val >= 0.2) return "Positive";
    if (val >= -0.2) return "Neutral";
    if (val >= -0.5) return "Negative";
    return "Very Negative";
  };
  
  const percentage = Math.round(((value + 1) / 2) * 100);
  
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative">
        <svg
          width={config.width}
          height={config.width / 2 + 20}
          viewBox={`0 0 ${config.width} ${config.width / 2 + 20}`}
        >
          {/* Gradient definition */}
          <defs>
            <linearGradient id={`gaugeGradient-${size}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="25%" stopColor="#f97316" />
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="75%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          
          {/* Background arc */}
          <path
            d={`M ${config.strokeWidth / 2} ${center} A ${radius} ${radius} 0 0 1 ${config.width - config.strokeWidth / 2} ${center}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            className="text-neutral-200 dark:text-neutral-800"
          />
          
          {/* Value arc */}
          <path
            d={`M ${config.strokeWidth / 2} ${center} A ${radius} ${radius} 0 0 1 ${config.width - config.strokeWidth / 2} ${center}`}
            fill="none"
            stroke={`url(#gaugeGradient-${size})`}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
          
          {/* Center value */}
          <text
            x={center}
            y={center - 10}
            textAnchor="middle"
            className={cn("font-bold", getColor(value))}
            style={{ fontSize: config.fontSize }}
          >
            {percentage}%
          </text>
          
          {/* Label */}
          {showLabels && (
            <text
              x={center}
              y={center + 20}
              textAnchor="middle"
              className="fill-neutral-500 text-sm font-medium"
            >
              {getLabel(value)}
            </text>
          )}
        </svg>
        
        {/* Min/Max labels */}
        {showLabels && (
          <>
            <span className="absolute bottom-0 left-0 text-xs text-neutral-400">
              Negative
            </span>
            <span className="absolute bottom-0 right-0 text-xs text-neutral-400">
              Positive
            </span>
          </>
        )}
      </div>
    </div>
  );
}

interface SentimentBreakdownProps {
  positive: number;
  negative: number;
  neutral: number;
  className?: string;
}

export function SentimentBreakdown({
  positive,
  negative,
  neutral,
  className,
}: SentimentBreakdownProps) {
  const total = positive + negative + neutral;
  
  return (
    <div className={cn("space-y-3", className)}>
      {/* Positive */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Positive
          </span>
          <span className="font-medium">{positive}%</span>
        </div>
        <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${positive}%` }}
          />
        </div>
      </div>
      
      {/* Neutral */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Neutral
          </span>
          <span className="font-medium">{neutral}%</span>
        </div>
        <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800">
          <div
            className="h-full rounded-full bg-amber-400 transition-all"
            style={{ width: `${neutral}%` }}
          />
        </div>
      </div>
      
      {/* Negative */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Negative
          </span>
          <span className="font-medium">{negative}%</span>
        </div>
        <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800">
          <div
            className="h-full rounded-full bg-red-500 transition-all"
            style={{ width: `${negative}%` }}
          />
        </div>
      </div>
    </div>
  );
}
