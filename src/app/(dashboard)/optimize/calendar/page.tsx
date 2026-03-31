"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { ContentCalendar } from "@/components/optimize";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  ChevronLeft,
  Plus,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import Link from "next/link";

const MOCK_WORKSPACE_ID = "workspace_1";

export default function CalendarPage() {
  const router = useRouter();
  const [view, setView] = useState<"week" | "month">("week");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Calculate date range based on view
  const dateRange = React.useMemo(() => {
    if (view === "week") {
      return {
        start: startOfWeek(currentDate, { weekStartsOn: 1 }),
        end: endOfWeek(currentDate, { weekStartsOn: 1 }),
      };
    } else {
      return {
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
      };
    }
  }, [view, currentDate]);

  // Fetch calendar data
  const { data: calendar, isLoading: calendarLoading } = trpc.optimize.calendar.get.useQuery({
    workspaceId: MOCK_WORKSPACE_ID,
    startDate: dateRange.start,
    endDate: dateRange.end,
    view,
  });

  // Fetch upcoming events
  const { data: upcomingEvents, isLoading: upcomingLoading } = trpc.optimize.calendar.getUpcoming.useQuery({
    workspaceId: MOCK_WORKSPACE_ID,
    limit: 5,
  });

  // Fetch calendar analytics
  const { data: analytics, isLoading: analyticsLoading } = trpc.optimize.getCalendarAnalytics.useQuery({
    workspaceId: MOCK_WORKSPACE_ID,
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  // Fetch content queue
  const { data: queue, isLoading: queueLoading } = trpc.optimize.queue.get.useQuery({
    workspaceId: MOCK_WORKSPACE_ID,
  });

  // Create event mutation
  const { mutate: createEvent } = trpc.optimize.calendar.create.useMutation({
    onSuccess: () => {
      // Refetch calendar data
      window.location.reload();
    },
  });

  const handleAddEvent = (date: Date) => {
    // In a real app, this would open a modal
    createEvent({
      workspaceId: MOCK_WORKSPACE_ID,
      title: "New Post",
      contentType: "single_image",
      platform: "instagram",
      scheduledAt: date,
    });
  };

  const handleEventClick = (event: any) => {
    console.log("Event clicked:", event);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/optimize">
            <Button variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
              Content Calendar
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400">
              Plan and schedule your content
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </Button>
          <Button onClick={() => handleAddEvent(new Date())}>
            <Plus className="mr-2 h-4 w-4" />
            Schedule Post
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Scheduled Posts"
          value={analytics?.totalScheduled || 0}
          icon={<Calendar className="h-4 w-4" />}
          color="primary"
        />
        <StatCard
          title="Published"
          value={analytics?.totalPublished || 0}
          icon={<CheckCircle2 className="h-4 w-4" />}
          color="success"
        />
        <StatCard
          title="Drafts"
          value={analytics?.totalDrafts || 0}
          icon={<AlertCircle className="h-4 w-4" />}
          color="warning"
        />
        <StatCard
          title="Consistency Score"
          value={`${analytics?.consistencyScore || 0}%`}
          icon={<Clock className="h-4 w-4" />}
          color="purple"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Calendar */}
        <div className="lg:col-span-2">
          {calendar && (
            <ContentCalendar
              events={calendar.events}
              view={view}
              onViewChange={setView}
              onEventClick={handleEventClick}
              onDateClick={handleAddEvent}
              onAddEvent={handleAddEvent}
              loading={calendarLoading}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Posts */}
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-neutral-900 dark:text-white">
                <Clock className="h-5 w-5 text-primary-500" />
                Upcoming Posts
              </h3>
              {upcomingLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
                  ))}
                </div>
              ) : upcomingEvents && upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <UpcomingEventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
                  No upcoming posts scheduled
                </p>
              )}
            </CardContent>
          </Card>

          {/* Content Ideas Queue */}
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-neutral-900 dark:text-white">
                <Sparkles className="h-5 w-5 text-primary-500" />
                Content Ideas
              </h3>
              {queueLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
                  ))}
                </div>
              ) : queue?.ideas && queue.ideas.length > 0 ? (
                <div className="space-y-3">
                  {queue.ideas.slice(0, 3).map((idea) => (
                    <IdeaCard key={idea.id} idea={idea} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
                  No content ideas in queue
                </p>
              )}
              <Button variant="outline" className="mt-4 w-full">
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Ideas
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 font-semibold text-neutral-900 dark:text-white">
                This Period
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    Posts by Type
                  </span>
                </div>
                {analytics?.postsByType && Object.entries(analytics.postsByType).map(([type, count]) => (
                  count > 0 && (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm capitalize text-neutral-700 dark:text-neutral-300">
                        {type.replace("_", " ")}
                      </span>
                      <span className="font-medium text-neutral-900 dark:text-white">
                        {count}
                      </span>
                    </div>
                  )
                ))}
                
                <div className="border-t border-neutral-200 pt-4 dark:border-neutral-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      Posts by Platform
                    </span>
                  </div>
                  {analytics?.postsByPlatform && Object.entries(analytics.postsByPlatform).map(([platform, count]) => (
                    count > 0 && (
                      <div key={platform} className="mt-2 flex items-center justify-between">
                        <span className="text-sm capitalize text-neutral-700 dark:text-neutral-300">
                          {platform}
                        </span>
                        <span className="font-medium text-neutral-900 dark:text-white">
                          {count}
                        </span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: "primary" | "success" | "warning" | "purple";
}) {
  const colorClasses = {
    primary: "bg-primary-100 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400",
    success: "bg-success-100 text-success-600 dark:bg-success-900/20 dark:text-success-400",
    warning: "bg-warning-100 text-warning-600 dark:bg-warning-900/20 dark:text-warning-400",
    purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{title}</p>
          <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", colorClasses[color])}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function UpcomingEventCard({ event }: { event: any }) {
  const contentTypeColors: Record<string, string> = {
    reel: "bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400",
    carousel: "bg-success-100 text-success-700 dark:bg-success-900/20 dark:text-success-400",
    single_image: "bg-warning-100 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400",
    story: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400",
    video: "bg-danger-100 text-danger-700 dark:bg-danger-900/20 dark:text-danger-400",
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
      <div className={cn("rounded-lg px-2 py-1 text-xs font-medium", contentTypeColors[event.contentType])}>
        {event.contentType.replace("_", " ")}
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
          {event.title}
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {format(new Date(event.scheduledAt), "MMM d, h:mm a")}
        </p>
      </div>
      <div className="text-xs text-neutral-400 dark:text-neutral-500">
        {event.platform}
      </div>
    </div>
  );
}

function IdeaCard({ idea }: { idea: any }) {
  return (
    <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
      <h4 className="font-medium text-neutral-900 dark:text-white">{idea.title}</h4>
      <p className="mt-1 line-clamp-2 text-sm text-neutral-500 dark:text-neutral-400">
        {idea.description}
      </p>
      <div className="mt-2 flex items-center gap-2 text-xs">
        <span className="text-primary-600 dark:text-primary-400">
          {idea.estimatedEngagement.toFixed(1)}% est. engagement
        </span>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
