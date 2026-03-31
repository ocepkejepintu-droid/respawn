"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Check,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Trash2,
  Settings,
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  read?: boolean;
  timestamp: Date;
  action?: {
    label: string;
    href: string;
  };
}

interface NotificationBellProps extends React.HTMLAttributes<HTMLDivElement> {
  notifications?: Notification[];
  onNotificationClick?: (notificationId: string) => void;
  onMarkAllRead?: () => void;
  onClearAll?: () => void;
  onSettingsClick?: () => void;
  maxDisplay?: number;
}

const typeIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

const typeColors = {
  info: "bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400",
  success:
    "bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400",
  warning:
    "bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400",
  error: "bg-danger-100 text-danger-600 dark:bg-danger-900/30 dark:text-danger-400",
};

const NotificationBell = React.forwardRef<HTMLDivElement, NotificationBellProps>(
  (
    {
      className,
      notifications = [],
      onNotificationClick,
      onMarkAllRead,
      onClearAll,
      onSettingsClick,
      maxDisplay = 5,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter((n) => !n.read).length;
    const displayNotifications = notifications.slice(0, maxDisplay);

    // Close dropdown when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const formatTimestamp = (date: Date) => {
      const now = new Date();
      const diff = now.getTime() - new Date(date).getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return "Just now";
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      return new Date(date).toLocaleDateString();
    };

    const handleNotificationClick = (notificationId: string) => {
      onNotificationClick?.(notificationId);
      setIsOpen(false);
    };

    return (
      <div ref={ref} className={cn("relative", className)} {...props}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>

        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute right-0 top-full z-50 mt-2 w-96 rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
              <h3 className="font-semibold text-neutral-900 dark:text-white">
                Notifications
              </h3>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onMarkAllRead}
                    className="h-8 text-xs"
                  >
                    <Check className="mr-1 h-3 w-3" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onSettingsClick}
                  className="h-8 w-8"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {displayNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                    <Bell className="h-6 w-6 text-neutral-400" />
                  </div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">
                    No notifications
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    You're all caught up!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {displayNotifications.map((notification) => {
                    const Icon = typeIcons[notification.type || "info"];
                    return (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification.id)}
                        className={cn(
                          "flex w-full gap-3 px-4 py-3 text-left transition-colors",
                          !notification.read
                            ? "bg-primary-50/50 dark:bg-primary-900/10"
                            : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                            typeColors[notification.type || "info"]
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 dark:text-white">
                            {notification.title}
                            {!notification.read && (
                              <span className="ml-2 inline-block h-2 w-2 rounded-full bg-primary-500" />
                            )}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500 dark:text-neutral-400">
                            {notification.message}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-xs text-neutral-400">
                              {formatTimestamp(notification.timestamp)}
                            </span>
                            {notification.action && (
                              <Badge variant="outline" className="text-[10px]">
                                {notification.action.label}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-neutral-200 px-4 py-2 dark:border-neutral-800">
                <div className="flex items-center justify-between">
                  <button
                    onClick={onClearAll}
                    className="flex items-center gap-1 text-xs text-neutral-500 hover:text-danger-600 dark:text-neutral-400 dark:hover:text-danger-400"
                  >
                    <Trash2 className="h-3 w-3" />
                    Clear all
                  </button>
                  <button className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);
NotificationBell.displayName = "NotificationBell";

export { NotificationBell };
export type { Notification };
