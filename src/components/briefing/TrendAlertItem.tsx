"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TrendIndicator } from "@/components/ui/trend-indicator";
import {
  AlertSeverity,
  AlertType,
  type TrendAlert,
} from "@/types/briefing";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Hash,
  Zap,
  MessageSquare,
  FileText,
  AlertCircle,
  Bell,
  Flame,
  Check,
} from "lucide-react";

interface TrendAlertItemProps {
  alert: TrendAlert;
  compact?: boolean;
  onMarkRead?: (alertId: string) => void;
  className?: string;
}

export function TrendAlertItem({
  alert,
  compact = false,
  onMarkRead,
  className,
}: TrendAlertItemProps) {
  const [isRead, setIsRead] = React.useState(alert.isRead);

  const handleMarkRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isRead && onMarkRead) {
      onMarkRead(alert.id);
      setIsRead(true);
    }
  };

  const severityConfig = {
    [AlertSeverity.CRITICAL]: {
      badge: "danger" as const,
      bg: "bg-danger-50 dark:bg-danger-900/20",
      border: "border-danger-200 dark:border-danger-800",
      iconColor: "text-danger-500",
    },
    [AlertSeverity.HIGH]: {
      badge: "warning" as const,
      bg: "bg-warning-50 dark:bg-warning-900/20",
      border: "border-warning-200 dark:border-warning-800",
      iconColor: "text-warning-500",
    },
    [AlertSeverity.MEDIUM]: {
      badge: "default" as const,
      bg: "bg-primary-50 dark:bg-primary-900/20",
      border: "border-primary-200 dark:border-primary-800",
      iconColor: "text-primary-500",
    },
    [AlertSeverity.LOW]: {
      badge: "secondary" as const,
      bg: "bg-neutral-50 dark:bg-neutral-900/50",
      border: "border-neutral-200 dark:border-neutral-800",
      iconColor: "text-neutral-500",
    },
  };

  const typeConfig = {
    [AlertType.HASHTAG_TRENDING]: {
      icon: TrendingUp,
      label: "Trending",
      color: "text-success-500",
    },
    [AlertType.HASHTAG_DECLINING]: {
      icon: TrendingDown,
      label: "Declining",
      color: "text-danger-500",
    },
    [AlertType.COMPETITOR_POST]: {
      icon: Users,
      label: "Competitor",
      color: "text-primary-500",
    },
    [AlertType.ENGAGEMENT_SPIKE]: {
      icon: Zap,
      label: "Engagement",
      color: "text-warning-500",
    },
    [AlertType.SENTIMENT_SHIFT]: {
      icon: MessageSquare,
      label: "Sentiment",
      color: "text-info-500",
    },
    [AlertType.NEW_CONTENT_FORMAT]: {
      icon: FileText,
      label: "New Format",
      color: "text-purple-500",
    },
    [AlertType.VIRAL_CONTENT]: {
      icon: Flame,
      label: "Viral",
      color: "text-orange-500",
    },
    [AlertType.MENTION_ALERT]: {
      icon: Bell,
      label: "Mention",
      color: "text-pink-500",
    },
  };

  const severity = severityConfig[alert.severity];
  const type = typeConfig[alert.type];
  const Icon = type.icon;

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-start gap-3 p-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
          isRead && "opacity-60",
          className
        )}
      >
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            severity.bg
          )}
        >
          <Icon className={cn("h-5 w-5", type.color)} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-neutral-900 dark:text-white">
                {alert.title}
              </p>
              <p className="mt-0.5 line-clamp-2 text-sm text-neutral-500 dark:text-neutral-400">
                {alert.description}
              </p>
            </div>
            {!isRead && (
              <Badge variant={severity.badge} className="shrink-0">
                {alert.severity}
              </Badge>
            )}
          </div>

          <div className="mt-2 flex items-center gap-3">
            <TrendIndicator
              direction={alert.changePercent > 0 ? "up" : "down"}
              value={Math.abs(alert.changePercent)}
              size="sm"
            />
            <span className="text-xs text-neutral-400">
              {new Date(alert.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {!isRead && onMarkRead && (
              <button
                onClick={handleMarkRead}
                className="ml-auto flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                <Check className="h-3 w-3" />
                Mark read
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Full version
  return (
    <div
      className={cn(
        "group relative rounded-lg border p-4 transition-all",
        severity.bg,
        severity.border,
        isRead && "opacity-60",
        className
      )}
    >
      {/* Unread indicator */}
      {!isRead && (
        <div className="absolute -left-px top-4 bottom-4 w-1 rounded-full bg-primary-500" />
      )}

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-neutral-800">
          <Icon className={cn("h-6 w-6", type.color)} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-neutral-900 dark:text-white">
              {alert.title}
            </h3>
            <Badge variant={severity.badge}>{alert.severity}</Badge>
            <Badge variant="outline" className="text-xs">
              {type.label}
            </Badge>
          </div>

          {/* Description */}
          <p className="mt-1 text-neutral-600 dark:text-neutral-300">
            {alert.description}
          </p>

          {/* Metrics */}
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-500">Change:</span>
              <TrendIndicator
                direction={alert.changePercent > 0 ? "up" : "down"}
                value={Math.abs(alert.changePercent)}
                format="percentage"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-500">Previous:</span>
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                {alert.previousValue.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-500">Current:</span>
              <span className="font-medium text-neutral-900 dark:text-white">
                {alert.currentValue.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-neutral-400">
              {new Date(alert.createdAt).toLocaleString()}
            </span>

            {!isRead && onMarkRead && (
              <button
                onClick={handleMarkRead}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-primary-600 hover:bg-primary-100 dark:text-primary-400 dark:hover:bg-primary-900/30"
              >
                <Check className="h-4 w-4" />
                Mark as read
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
