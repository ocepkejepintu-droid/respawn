"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import type { AgeRange, GeographicData, InterestCategory } from "@/types/audience";

// ============================================================================
// Age Distribution Chart
// ============================================================================

interface AgeDistributionChartProps {
  data: AgeRange[];
  height?: number;
  className?: string;
}

export function AgeDistributionChart({
  data,
  height = 250,
  className,
}: AgeDistributionChartProps) {
  const CustomTooltip = ({ active, payload }: {
    active?: boolean;
    payload?: Array<{ payload: AgeRange }>;
  }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
          <p className="font-medium text-neutral-900 dark:text-white">{item.range} years</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {item.percentage}% ({item.count.toLocaleString()} users)
          </p>
          {item.engagementRate && (
            <p className="text-xs text-neutral-500">
              {item.engagementRate.toFixed(1)}% engagement
            </p>
          )}
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="range"
            stroke="#9ca3af"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#9ca3af"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="percentage"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================================
// Geographic Distribution Chart
// ============================================================================

interface GeographicChartProps {
  data: GeographicData[];
  height?: number;
  className?: string;
}

const COUNTRY_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

export function GeographicChart({
  data,
  height = 300,
  className,
}: GeographicChartProps) {
  const chartData = data.slice(0, 10).map((item, index) => ({
    name: item.country,
    value: item.percentage,
    count: item.count,
    color: COUNTRY_COLORS[index % COUNTRY_COLORS.length],
  }));
  
  const CustomTooltip = ({ active, payload }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; payload: { count: number } }>;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
          <p className="font-medium text-neutral-900 dark:text-white">{payload[0].name}</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {payload[0].value}% ({payload[0].payload.count.toLocaleString()} users)
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="middle"
            align="right"
            layout="vertical"
            iconType="circle"
            wrapperStyle={{ fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================================
// Interest Categories Chart
// ============================================================================

interface InterestChartProps {
  data: InterestCategory[];
  height?: number;
  className?: string;
}

export function InterestChart({
  data,
  height = 300,
  className,
}: InterestChartProps) {
  const sortedData = [...data]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  
  const getBarColor = (affinity: string) => {
    switch (affinity) {
      case 'high':
        return '#10b981';
      case 'medium':
        return '#3b82f6';
      default:
        return '#9ca3af';
    }
  };
  
  const CustomTooltip = ({ active, payload }: {
    active?: boolean;
    payload?: Array<{ payload: InterestCategory }>;
  }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
          <p className="font-medium text-neutral-900 dark:text-white">{item.name}</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Score: {item.score}/100
          </p>
          <p className="text-xs capitalize text-neutral-500">
            {item.affinity} affinity
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 80, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            stroke="#9ca3af"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#9ca3af"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={75}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="score"
            radius={[0, 4, 4, 0]}
            fill="#3b82f6"
          >
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.affinity)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================================
// Gender Distribution
// ============================================================================

interface GenderDistributionProps {
  male: number;
  female: number;
  other: number;
  className?: string;
}

export function GenderDistribution({
  male,
  female,
  other,
  className,
}: GenderDistributionProps) {
  const total = male + female + other;
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Female */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
            </svg>
            Female
          </span>
          <span className="font-medium">{female}%</span>
        </div>
        <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800">
          <div
            className="h-full rounded-full bg-pink-500 transition-all"
            style={{ width: `${(female / total) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Male */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
            </svg>
            Male
          </span>
          <span className="font-medium">{male}%</span>
        </div>
        <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800">
          <div
            className="h-full rounded-full bg-blue-500 transition-all"
            style={{ width: `${(male / total) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Other */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
            </svg>
            Other/Prefer not to say
          </span>
          <span className="font-medium">{other}%</span>
        </div>
        <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800">
          <div
            className="h-full rounded-full bg-purple-500 transition-all"
            style={{ width: `${(other / total) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Device Distribution
// ============================================================================

interface DeviceDistributionProps {
  devices: Record<string, number>;
  className?: string;
}

const DEVICE_ICONS: Record<string, React.ReactNode> = {
  Mobile: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  Desktop: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Tablet: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
};

export function DeviceDistribution({
  devices,
  className,
}: DeviceDistributionProps) {
  const total = Object.values(devices).reduce((sum, val) => sum + val, 0);
  const sorted = Object.entries(devices).sort((a, b) => b[1] - a[1]);
  
  return (
    <div className={cn("space-y-3", className)}>
      {sorted.map(([device, percentage]) => (
        <div
          key={device}
          className="flex items-center justify-between rounded-lg border border-neutral-200 p-3 dark:border-neutral-800"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
              {DEVICE_ICONS[device] || DEVICE_ICONS.Desktop}
            </div>
            <span className="font-medium">{device}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="h-2 w-24 rounded-full bg-neutral-100 dark:bg-neutral-800">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="w-12 text-right font-medium">{percentage}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}
