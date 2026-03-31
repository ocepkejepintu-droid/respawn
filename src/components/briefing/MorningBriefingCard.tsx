"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendIndicator } from "@/components/ui/trend-indicator";
import { TrendAlertItem } from "./TrendAlertItem";
import type { Briefing, TrendAlert } from "@/types/briefing";
import {
  AlertSeverity,
  AlertType,
} from "@/types/briefing";
import {
  Bell,
  TrendingUp,
  Users,
  Hash,
  ArrowRight,
  Sparkles,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface MorningBriefingCardProps {
  briefing: Briefing | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export function MorningBriefingCard({
  briefing,
  isLoading = false,
  onRefresh,
  className,
}: MorningBriefingCardProps) {
  const [expanded, setExpanded] = React.useState(false);

  if (isLoading) {
    return <MorningBriefingCardSkeleton />;
  }

  if (!briefing) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SunriseIcon className="h-5 w-5" />
              <CardTitle className="text-white">Morning Briefing</CardTitle>
            </div>
            <Clock className="h-4 w-4 opacity-80" />
          </div>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
            <Bell className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="mb-2 font-medium text-neutral-900 dark:text-white">
            No briefing available yet
          </h3>
          <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
            We&apos;re preparing your first morning briefing. Check back soon!
          </p>
          <Button onClick={onRefresh} variant="outline" size="sm">
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  const criticalAlerts = briefing.alerts.filter(
    (a) => a.severity === AlertSeverity.CRITICAL
  );
  const highAlerts = briefing.alerts.filter(
    (a) => a.severity === AlertSeverity.HIGH
  );
  const unreadAlerts = briefing.alerts.filter((a) => !a.isRead);

  const displayedAlerts = expanded
    ? briefing.alerts.filter((a) => !a.isRead)
    : briefing.alerts.filter((a) => !a.isRead).slice(0, 3);

  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Header */}
      <CardHeader className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <SunriseIcon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg text-white">Morning Briefing</CardTitle>
              <p className="text-xs text-white/80">
                {new Date(briefing.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadAlerts.length > 0 && (
              <Badge
                variant="danger"
                className="bg-white text-danger-600 hover:bg-white/90"
              >
                {unreadAlerts.length} new
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={onRefresh}
            >
              <Clock className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 border-b border-neutral-200 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-900/50">
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <div className="mb-1 flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400">
            <AlertTriangle className="h-4 w-4" />
            <span>Alerts</span>
          </div>
          <span className="text-2xl font-bold text-neutral-900 dark:text-white">
            {briefing.summary.totalAlerts}
          </span>
          {(criticalAlerts.length > 0 || highAlerts.length > 0) && (
            <span className="mt-1 text-xs text-danger-500">
              {criticalAlerts.length + highAlerts.length} urgent
            </span>
          )}
        </div>
        <div className="flex flex-col items-center justify-center border-x border-neutral-200 p-4 text-center dark:border-neutral-800">
          <div className="mb-1 flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400">
            <TrendingUp className="h-4 w-4" />
            <span>Trending</span>
          </div>
          <span className="text-2xl font-bold text-neutral-900 dark:text-white">
            {briefing.summary.trendingHashtags}
          </span>
          {briefing.summary.trendingHashtags > 0 && (
            <span className="mt-1 text-xs text-success-500">
              +{briefing.summary.trendingHashtags} this period
            </span>
          )}
        </div>
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <div className="mb-1 flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400">
            <Users className="h-4 w-4" />
            <span>Competitors</span>
          </div>
          <span className="text-2xl font-bold text-neutral-900 dark:text-white">
            {briefing.summary.totalCompetitorPosts}
          </span>
          <span className="mt-1 text-xs text-neutral-500">new posts</span>
        </div>
      </div>

      {/* Alerts Section */}
      <CardContent className="p-0">
        {displayedAlerts.length > 0 ? (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {displayedAlerts.map((alert) => (
              <TrendAlertItem key={alert.id} alert={alert} compact />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <CheckCircle2 className="mb-2 h-8 w-8 text-success-500" />
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              All caught up! No new alerts.
            </p>
          </div>
        )}

        {/* Expand/Collapse */}
        {unreadAlerts.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex w-full items-center justify-center gap-2 py-3 text-sm font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20"
          >
            {expanded ? (
              <>
                Show less <TrendIndicator direction="up" value={0} showIcon />
              </>
            ) : (
              <>
                Show {unreadAlerts.length - 3} more alerts{" "}
                <TrendIndicator direction="down" value={0} showIcon />
              </>
            )}
          </button>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-warning-500" />
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              {briefing.insights.length} insights
            </span>
          </div>
          <Link href="/briefing">
            <Button variant="ghost" size="sm" className="gap-1">
              Full Briefing
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function SunriseIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2v8" />
      <path d="m4.93 10.93 1.41 1.41" />
      <path d="M2 18h2" />
      <path d="M20 18h2" />
      <path d="m19.07 10.93-1.41 1.41" />
      <path d="M22 22H2" />
      <path d="M16 6l-4 4-4-4" />
      <path d="M16 18a4 4 0 0 0-8 0" />
    </svg>
  );
}

function MorningBriefingCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="h-24 bg-gradient-to-r from-primary-500 to-primary-600" />
      <div className="p-4">
        <div className="mb-4 grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
              <div className="mx-auto h-8 w-12 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800"
            />
          ))}
        </div>
      </div>
    </Card>
  );
}
