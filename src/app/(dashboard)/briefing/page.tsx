"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/trpc/client";
import { cn } from "@/lib/utils";
import { PageHeader, PageContent } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendAlertItem,
  CompetitorActivityFeed,
  HashtagVelocityChart,
  HashtagSparkline,
  BriefingSettings,
} from "@/components/briefing";
import { AlertSeverity, TimeRange } from "@/types/briefing";
import {
  Sunrise,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Users,
  Sparkles,
  Target,
  ArrowRight,
  Clock,
} from "lucide-react";

export default function BriefingPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.LAST_24H);

  const workspaceId = session?.user?.currentWorkspaceId;
  const hasWorkspace = Boolean(workspaceId);

  const briefingQuery = trpc.briefing.getLatest.useQuery(
    { workspaceId: workspaceId ?? "" },
    { enabled: hasWorkspace }
  );
  const historyQuery = trpc.briefing.getHistory.useQuery(
    { workspaceId: workspaceId ?? "", limit: 6 },
    { enabled: hasWorkspace }
  );

  const refreshMutation = trpc.briefing.generate.useMutation({
    onSuccess: async () => {
      await Promise.all([briefingQuery.refetch(), historyQuery.refetch()]);
      setActiveTab("overview");
    },
  });

  const markAlertReadMutation = trpc.briefing.markAlertRead.useMutation({
    onSuccess: async () => {
      await briefingQuery.refetch();
    },
  });

  const markAllReadMutation = trpc.briefing.markAllRead.useMutation({
    onSuccess: async () => {
      await briefingQuery.refetch();
    },
  });

  const briefing = briefingQuery.data?.briefing ?? null;
  const history = historyQuery.data?.briefings ?? [];
  const unreadAlerts = briefing?.alerts.filter((alert) => !alert.isRead) || [];
  const isLoading =
    status === "loading" ||
    (hasWorkspace && (briefingQuery.isLoading || historyQuery.isLoading));
  const isRefreshing = refreshMutation.isPending;
  const panelClassName =
    "border-[color:var(--card-border)] bg-[var(--card-background)]/95 backdrop-blur-sm shadow-[0_18px_48px_-28px_rgba(2,6,23,0.72)] dark:bg-[linear-gradient(180deg,rgba(19,29,44,0.96),rgba(15,23,32,0.98))]";

  const rangeLabels: Record<TimeRange, string> = {
    [TimeRange.LAST_24H]: "24h",
    [TimeRange.LAST_7D]: "7d",
    [TimeRange.LAST_30D]: "30d",
  };

  const handleRefresh = async () => {
    if (!workspaceId) return;
    await refreshMutation.mutateAsync({ workspaceId, timeRange });
  };

  const handleMarkAlertRead = async (alertId: string) => {
    if (!briefing) return;
    await markAlertReadMutation.mutateAsync({
      briefingId: briefing.id,
      alertId,
    });
  };

  const handleMarkAllRead = async () => {
    if (!briefing) return;
    await markAllReadMutation.mutateAsync({
      briefingId: briefing.id,
    });
  };

  const handleSaveSettings = (settings: unknown) => {
    console.log("Saving settings:", settings);
  };

  return (
    <>
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <Sunrise className="h-8 w-8 text-primary-500" />
            <span>Morning Briefing</span>
          </div>
        }
        description="Your daily digest of overnight trends, competitor activity, and engagement insights"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Briefing" }]}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-[color:var(--card-border)] bg-[rgba(19,29,44,0.82)] p-1">
              <Button
                variant={timeRange === TimeRange.LAST_24H ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTimeRange(TimeRange.LAST_24H)}
              >
                24h
              </Button>
              <Button
                variant={timeRange === TimeRange.LAST_7D ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTimeRange(TimeRange.LAST_7D)}
              >
                7d
              </Button>
              <Button
                variant={timeRange === TimeRange.LAST_30D ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTimeRange(TimeRange.LAST_30D)}
              >
                30d
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={!workspaceId || isRefreshing}
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
              Refresh from Apify
            </Button>
          </div>
        }
      />

      <PageContent>
        {isLoading && (
          <Card className={cn(panelClassName, "py-12")}>
            <CardContent className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-neutral-700 border-t-primary-500" />
              <h3 className="mb-2 text-lg font-medium">Loading briefing</h3>
              <p className="text-neutral-500">
                Fetching the latest saved briefing for your workspace.
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && !hasWorkspace && (
          <Card className={cn(panelClassName, "py-12")}>
            <CardContent className="text-center">
              <Sunrise className="mx-auto mb-4 h-12 w-12 text-neutral-400" />
              <h3 className="mb-2 text-lg font-medium">No workspace selected</h3>
              <p className="mb-4 text-neutral-500">
                Pick a workspace to load the latest briefing and run Apify refreshes.
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && hasWorkspace && briefing && (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard
                icon={AlertTriangle}
                label="Total Alerts"
                value={briefing.summary.totalAlerts}
                subtext={`${briefing.summary.criticalAlerts} critical`}
                color="danger"
              />
              <StatCard
                icon={TrendingUp}
                label="Trending Hashtags"
                value={briefing.summary.trendingHashtags}
                subtext="Up from yesterday"
                color="success"
              />
              <StatCard
                icon={Users}
                label="Competitor Posts"
                value={briefing.summary.totalCompetitorPosts}
                subtext="New content"
                color="primary"
              />
              <StatCard
                icon={Clock}
                label="Generated"
                value={new Date(briefing.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                subtext={`Today - ${rangeLabels[timeRange]} window`}
                color="neutral"
              />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 border border-[color:var(--card-border)] bg-[rgba(19,29,44,0.78)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] lg:w-auto">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="alerts">
                  Alerts
                  {unreadAlerts.length > 0 && (
                    <Badge variant="danger" className="ml-2">
                      {unreadAlerts.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="competitors">Competitors</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-7">
                  <div className="space-y-6 lg:col-span-4">
                    <Card className={panelClassName}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-warning-500" />
                          Key Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          {briefing.insights.map((insight, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                                {index + 1}
                              </div>
                              <p className="text-neutral-700 dark:text-neutral-300">{insight}</p>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className={panelClassName}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-success-500" />
                          Recommendations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          {briefing.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <ArrowRight className="mt-0.5 h-5 w-5 shrink-0 text-success-500" />
                              <p className="text-neutral-700 dark:text-neutral-300">{rec}</p>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {unreadAlerts.filter(
                      (alert) =>
                        alert.severity === AlertSeverity.CRITICAL ||
                        alert.severity === AlertSeverity.HIGH
                    ).length > 0 && (
                      <Card className={panelClassName}>
                        <CardHeader className="flex flex-row items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-danger-600">
                            <AlertTriangle className="h-5 w-5" />
                            Priority Alerts
                          </CardTitle>
                          <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
                            Mark all read
                          </Button>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {unreadAlerts
                            .filter(
                              (alert) =>
                                alert.severity === AlertSeverity.CRITICAL ||
                                alert.severity === AlertSeverity.HIGH
                            )
                            .slice(0, 3)
                            .map((alert) => (
                              <TrendAlertItem
                                key={alert.id}
                                alert={alert}
                                onMarkRead={handleMarkAlertRead}
                              />
                            ))}
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  <div className="space-y-6 lg:col-span-3">
                    <HashtagSparkline trends={briefing.hashtagTrends.slice(0, 5)} />
                    <HashtagVelocityChart trends={briefing.hashtagTrends} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="alerts" className="space-y-6">
                <Card className={panelClassName}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>All Alerts</CardTitle>
                      <p className="text-sm text-neutral-500">
                        {unreadAlerts.length} unread out of {briefing.alerts.length} total
                      </p>
                    </div>
                    {unreadAlerts.length > 0 && (
                      <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                        Mark all as read
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {briefing.alerts.map((alert) => (
                      <TrendAlertItem
                        key={alert.id}
                        alert={alert}
                        onMarkRead={handleMarkAlertRead}
                      />
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="competitors">
                <CompetitorActivityFeed activities={briefing.competitorActivity} />
              </TabsContent>

              <TabsContent value="settings">
                <BriefingSettings settings={null} onSave={handleSaveSettings} />
              </TabsContent>
            </Tabs>
          </>
        )}

        {!isLoading && hasWorkspace && (
          <Card className={panelClassName}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Briefing History</CardTitle>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Latest saved briefings for this workspace
                </p>
              </div>
              <Badge variant="secondary">{history.length} saved</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {history.length > 0 ? (
                history.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-col gap-2 rounded-xl border border-[color:var(--card-border)] bg-black/10 p-4 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-white">
                        {new Date(entry.date).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {entry.summary.totalAlerts} alerts, {entry.summary.totalCompetitorPosts} competitor posts, {entry.summary.trendingHashtags} trending hashtags
                      </p>
                    </div>
                    <Badge variant="outline" className="w-fit">
                      {entry.summary.criticalAlerts} critical
                    </Badge>
                  </div>
                ))
              ) : (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    No saved briefings yet. Click "Refresh from Apify" to generate the first one.
                  </p>
              )}
            </CardContent>
          </Card>
        )}

        {!isLoading && hasWorkspace && !briefing && (
          <Card className={cn(panelClassName, "py-12")}>
            <CardContent className="text-center">
              <Sunrise className="mx-auto mb-4 h-12 w-12 text-neutral-400" />
              <h3 className="mb-2 text-lg font-medium">No briefing available</h3>
              <p className="mb-4 text-neutral-500">
                Your workspace does not have a saved briefing yet. Use "Refresh from Apify" to generate one.
              </p>
              <Button onClick={handleRefresh} disabled={!workspaceId || isRefreshing}>
                <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
                Refresh from Apify
              </Button>
            </CardContent>
          </Card>
        )}
      </PageContent>
    </>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext: string;
  color: "danger" | "success" | "primary" | "neutral";
}

function StatCard({ icon: Icon, label, value, subtext, color }: StatCardProps) {
  const colorClasses = {
    danger: "bg-danger-50 text-danger-600 dark:bg-danger-900/20 dark:text-danger-400",
    success: "bg-success-50 text-success-600 dark:bg-success-900/20 dark:text-success-400",
    primary: "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400",
    neutral: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
  };

  return (
    <Card className="border-[color:var(--card-border)] bg-[var(--card-background)]/95 shadow-[0_18px_48px_-28px_rgba(2,6,23,0.72)] backdrop-blur-sm dark:bg-[linear-gradient(180deg,rgba(19,29,44,0.96),rgba(15,23,32,0.98))]">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl border border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
              colorClasses[color]
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
              {label}
            </p>
            <p className="font-mono text-2xl font-semibold text-neutral-900 dark:text-white">
              {value}
            </p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500">{subtext}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
