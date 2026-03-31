"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarEvent, ContentType, PlatformType } from "@/types/optimize";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Clock,
  Film,
  Images,
  Image,
  Play,
  Video,
  Camera,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Trash2
} from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks } from "date-fns";

interface ContentCalendarProps {
  events: CalendarEvent[];
  className?: string;
  view?: "week" | "month";
  onViewChange?: (view: "week" | "month") => void;
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  onAddEvent?: (date: Date) => void;
  onDeleteEvent?: (eventId: string) => void;
  onPublishEvent?: (eventId: string) => void;
  loading?: boolean;
}

const contentTypeIcons: Record<ContentType, React.ReactNode> = {
  reel: <Film className="h-3 w-3" />,
  carousel: <Images className="h-3 w-3" />,
  single_image: <Image className="h-3 w-3" />,
  story: <Play className="h-3 w-3" />,
  video: <Video className="h-3 w-3" />,
};

const contentTypeColors: Record<ContentType, string> = {
  reel: "bg-primary-100 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400",
  carousel: "bg-success-100 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400",
  single_image: "bg-warning-100 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400",
  story: "bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400",
  video: "bg-danger-100 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400",
};

const statusIcons = {
  draft: <AlertCircle className="h-3 w-3 text-warning-500" />,
  scheduled: <Clock className="h-3 w-3 text-primary-500" />,
  published: <CheckCircle2 className="h-3 w-3 text-success-500" />,
  failed: <AlertCircle className="h-3 w-3 text-danger-500" />,
};

export function ContentCalendar({
  events,
  className,
  view = "week",
  onViewChange,
  onEventClick,
  onDateClick,
  onAddEvent,
  onDeleteEvent,
  onPublishEvent,
  loading = false,
}: ContentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const calendarRange = useMemo(() => {
    if (view === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return { start, end, days: eachDayOfInterval({ start, end }) };
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      // Include days from previous and next months to fill the grid
      const calendarStart = startOfWeek(start, { weekStartsOn: 1 });
      const calendarEnd = endOfWeek(end, { weekStartsOn: 1 });
      return { start, end, days: eachDayOfInterval({ start: calendarStart, end: calendarEnd }) };
    }
  }, [currentDate, view]);

  const navigatePrevious = () => {
    if (view === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const navigateNext = () => {
    if (view === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  const getEventsForDay = (date: Date) => {
    return events.filter(event => 
      isSameDay(new Date(event.scheduledAt), date)
    );
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(selectedEvent?.id === event.id ? null : event);
    onEventClick?.(event);
  };

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary-500" />
              Content Calendar
            </CardTitle>
            <CardDescription>
              Schedule and manage your content
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex rounded-lg border border-neutral-200 p-1 dark:border-neutral-700">
              <button
                onClick={() => onViewChange?.("week")}
                className={cn(
                  "rounded px-3 py-1 text-sm font-medium transition-colors",
                  view === "week"
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                )}
              >
                Week
              </button>
              <button
                onClick={() => onViewChange?.("month")}
                className={cn(
                  "rounded px-3 py-1 text-sm font-medium transition-colors",
                  view === "month"
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                )}
              >
                Month
              </button>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={navigatePrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={navigateToday}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={navigateNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Button onClick={() => onAddEvent?.(currentDate)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Post
            </Button>
          </div>
        </div>

        {/* Current Period Display */}
        <div className="text-center">
          <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">
            {view === "week" 
              ? `${format(calendarRange.start, "MMM d")} - ${format(calendarRange.end, "MMM d, yyyy")}`
              : format(currentDate, "MMMM yyyy")
            }
          </h3>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="h-96 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
        ) : (
          <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div
                  key={day}
                  className="px-4 py-2 text-center text-sm font-medium text-neutral-600 dark:text-neutral-400"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className={cn("grid grid-cols-7", view === "month" ? "grid-rows-6" : "grid-rows-1")}>
              {calendarRange.days.map((day, index) => {
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isToday = isSameDay(day, new Date());
                
                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => onDateClick?.(day)}
                    className={cn(
                      "min-h-[120px] border-b border-r border-neutral-200 p-2 transition-colors",
                      !isCurrentMonth && view === "month" && "bg-neutral-50/50 dark:bg-neutral-800/30",
                      isToday && "bg-primary-50/30 dark:bg-primary-900/10",
                      "hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
                      "cursor-pointer"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          isToday
                            ? "flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-white"
                            : !isCurrentMonth && view === "month"
                            ? "text-neutral-400 dark:text-neutral-600"
                            : "text-neutral-700 dark:text-neutral-300"
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <button
                          key={event.id}
                          onClick={(e) => handleEventClick(event, e)}
                          className={cn(
                            "flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-xs transition-colors",
                            contentTypeColors[event.contentType],
                            selectedEvent?.id === event.id && "ring-2 ring-primary-500"
                          )}
                        >
                          {contentTypeIcons[event.contentType]}
                          <span className="flex-1 truncate">{event.title}</span>
                          {statusIcons[event.status]}
                        </button>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Event Details Panel */}
        {selectedEvent && (
          <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-neutral-900 dark:text-white">
                  {selectedEvent.title}
                </h4>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {format(new Date(selectedEvent.scheduledAt), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
              <div className="flex gap-2">
                {onPublishEvent && selectedEvent.status !== "published" && (
                  <Button
                    size="sm"
                    onClick={() => onPublishEvent(selectedEvent.id)}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Publish
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteEvent?.(selectedEvent.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
            
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">Type</span>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                  {selectedEvent.contentType}
                </p>
              </div>
              <div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">Platform</span>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                  {selectedEvent.platform}
                </p>
              </div>
              <div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">Status</span>
                <p className="text-sm font-medium capitalize text-neutral-900 dark:text-white">
                  {selectedEvent.status}
                </p>
              </div>
              {selectedEvent.content?.caption && (
                <div className="sm:col-span-2">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">Caption</span>
                  <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
                    {selectedEvent.content.caption}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
          <span className="text-neutral-500 dark:text-neutral-400">Content Types:</span>
          {Object.entries(contentTypeLabels).map(([type, label]) => (
            <div key={type} className="flex items-center gap-1.5">
              <span className={cn("rounded px-2 py-0.5 text-xs", contentTypeColors[type as ContentType])}>
                {contentTypeIcons[type as ContentType]}
              </span>
              <span className="text-neutral-600 dark:text-neutral-400">{label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const contentTypeLabels: Record<ContentType, string> = {
  reel: "Reel",
  carousel: "Carousel",
  single_image: "Image",
  story: "Story",
  video: "Video",
};
