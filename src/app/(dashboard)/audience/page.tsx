"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { PageHeader, PageContent } from "@/components/dashboard/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatCard, StatCardGrid } from "@/components/ui/stat-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/trpc/client";
import {
  Users,
  MessageSquare,
  TrendingUp,
  Heart,
  Download,
  Filter,
  RefreshCw,
  ShieldCheck,
  Activity,
  Clock3,
} from "lucide-react";

export default function AudiencePage() {
  const { data: session, status } = useSession();
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [tiktokHandle, setTiktokHandle] = useState("");

  const workspaceId = session?.user?.currentWorkspaceId;
  const hasWorkspace = Boolean(workspaceId);

  const { data: overview, isLoading } = trpc.audience.getOverview.useQuery(
    { workspaceId: workspaceId ?? "", period },
    { enabled: hasWorkspace }
  );

  const heroAnalyticsQuery = trpc.audience.getHeroAnalytics.useQuery(
    { workspaceId: workspaceId ?? "", limit: 6 },
    { enabled: hasWorkspace }
  );

  const heroRefreshMutation = trpc.audience.refreshHeroAnalytics.useMutation({
    onSuccess: async ({ report }) => {
      await heroAnalyticsQuery.refetch();

      if (report?.handles.instagramHandle) {
        setInstagramHandle(report.handles.instagramHandle);
      }

      if (report?.handles.tiktokHandle) {
        setTiktokHandle(report.handles.tiktokHandle);
      }
    },
  });

  useEffect(() => {
    const latest = heroAnalyticsQuery.data?.latest;
    if (!latest) return;

    if (!instagramHandle && latest.handles.instagramHandle) {
      setInstagramHandle(latest.handles.instagramHandle);
    }

    if (!tiktokHandle && latest.handles.tiktokHandle) {
      setTiktokHandle(latest.handles.tiktokHandle);
    }
  }, [heroAnalyticsQuery.data?.latest, instagramHandle, tiktokHandle]);

  const handleRefresh = async () => {
    if (!workspaceId) return;

    await heroRefreshMutation.mutateAsync({
      workspaceId,
      instagramHandle,
      tiktokHandle,
    });
  };

  if (status === "loading" || (hasWorkspace && isLoading)) {
    return (
      <PageContent>
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-blue-600" />
        </div>
      </PageContent>
    );
  }

  if (!hasWorkspace) {
    return (
      <PageContent>
        <Card>
          <CardHeader>
            <CardTitle>No workspace selected</CardTitle>
            <CardDescription>
              Pick a workspace before loading audience intelligence and account analytics.
            </CardDescription>
          </CardHeader>
        </Card>
      </PageContent>
    );
  }

  const latestHeroReport = heroAnalyticsQuery.data?.latest ?? null;
  const heroHistory = heroAnalyticsQuery.data?.history ?? [];

  return (
    <PageContent>
      <PageHeader
        title="Audience Intelligence"
        description="Review audience signals and run manual account analytics on your own Instagram and TikTok profiles."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Audience" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-neutral-200 p-1 dark:border-neutral-800">
              {(["7d", "30d", "90d"] as const).map((value) => (
                <button
                  key={value}
                  onClick={() => setPeriod(value)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    period === value
                      ? "bg-blue-600 text-white"
                      : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                  }`}
                >
                  {value === "7d" ? "7 Days" : value === "30d" ? "30 Days" : "90 Days"}
                </button>
              ))}
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary-500" />
            Hero Account Analytics
          </CardTitle>
          <CardDescription>
            Add your own Instagram and/or TikTok handle, then run a manual server update to analyze what content is actually working.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Instagram handle
              </label>
              <Input
                value={instagramHandle}
                onChange={(event) => setInstagramHandle(event.target.value)}
                placeholder="@yourbrand or instagram.com/yourbrand"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                TikTok handle
              </label>
              <Input
                value={tiktokHandle}
                onChange={(event) => setTiktokHandle(event.target.value)}
                placeholder="@yourbrand or tiktok.com/@yourbrand"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleRefresh}
                disabled={
                  heroRefreshMutation.isPending ||
                  (!instagramHandle.trim() && !tiktokHandle.trim())
                }
                className="w-full lg:w-auto"
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${heroRefreshMutation.isPending ? "animate-spin" : ""}`}
                />
                Update from Server
              </Button>
            </div>
          </div>

          {latestHeroReport ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                <Badge variant="secondary">Latest snapshot</Badge>
                <span>{new Date(latestHeroReport.createdAt).toLocaleString()}</span>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {latestHeroReport.accounts.map((account) => (
                  <Card
                    key={`${account.platform}-${account.handle}`}
                    className="border-[color:var(--card-border)] bg-[var(--card-background)]/95"
                  >
                    <CardHeader className="space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <CardTitle className="text-lg">
                            {account.platform === "instagram" ? "Instagram" : "TikTok"} @{account.handle}
                          </CardTitle>
                          <CardDescription>{account.profile.displayName}</CardDescription>
                        </div>
                        <Badge
                          variant={
                            account.audienceQualitySignals.score >= 70 ? "success" : "warning"
                          }
                        >
                          Quality score {account.audienceQualitySignals.score}
                        </Badge>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <MetricPill
                          label="Followers"
                          value={formatCompactNumber(account.profile.followersCount)}
                        />
                        <MetricPill
                          label="Engagement"
                          value={`${account.performance.avgEngagementRate.toFixed(1)}%`}
                        />
                        <MetricPill
                          label="Posting cadence"
                          value={`${account.performance.postingFrequency.toFixed(1)}/wk`}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div>
                        <p className="mb-2 text-sm font-medium text-neutral-800 dark:text-neutral-200">
                          What is working
                        </p>
                        <div className="space-y-3">
                          {account.standoutContent.length > 0 ? (
                            account.standoutContent.map((item) => (
                              <div
                                key={item.id}
                                className="rounded-xl border border-neutral-200/80 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-medium text-neutral-900 dark:text-white">
                                      {item.title}
                                    </p>
                                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                      {item.reason}
                                    </p>
                                  </div>
                                  <Badge variant="outline">
                                    {item.engagementRate.toFixed(1)}%
                                  </Badge>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-3 text-xs text-neutral-500 dark:text-neutral-400">
                                  <span>{formatCompactNumber(item.likes)} likes</span>
                                  <span>{formatCompactNumber(item.comments)} comments</span>
                                  {item.views !== undefined && (
                                    <span>{formatCompactNumber(item.views)} views</span>
                                  )}
                                  {item.shares !== undefined && (
                                    <span>{formatCompactNumber(item.shares)} shares</span>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                              Recent standout content was not available from the latest fetch.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="mb-2 text-sm font-medium text-neutral-800 dark:text-neutral-200">
                            Top hashtags
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {account.performance.topHashtags.length > 0 ? (
                              account.performance.topHashtags.slice(0, 6).map((tag) => (
                                <Badge key={tag} variant="secondary">
                                  #{tag}
                                </Badge>
                              ))
                            ) : (
                              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                No recurring hashtags detected yet.
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="mb-2 text-sm font-medium text-neutral-800 dark:text-neutral-200">
                            Quality signals
                          </p>
                          <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
                            {account.audienceQualitySignals.signals.map((signal) => (
                              <div key={signal} className="flex items-start gap-2">
                                <Activity className="mt-0.5 h-4 w-4 text-primary-500" />
                                <span>{signal}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Current insights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {latestHeroReport.insights.map((insight) => (
                      <div
                        key={insight}
                        className="rounded-xl border border-neutral-200/80 p-3 text-sm dark:border-white/10"
                      >
                        {insight}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recommended next moves</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {latestHeroReport.recommendations.map((recommendation) => (
                      <div
                        key={recommendation}
                        className="rounded-xl border border-neutral-200/80 p-3 text-sm dark:border-white/10"
                      >
                        {recommendation}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>History</CardTitle>
                    <CardDescription>
                      Each manual server update is saved so the analysis does not get lost.
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{heroHistory.length} saved</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {heroHistory.map((report) => (
                    <div
                      key={report.id}
                      className="flex flex-col gap-2 rounded-xl border border-neutral-200/80 p-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white">
                          {new Date(report.createdAt).toLocaleString()}
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          {report.accounts
                            .map((account) => `${account.platform} @${account.handle}`)
                            .join(" • ")}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {report.accounts.length} account
                        {report.accounts.length === 1 ? "" : "s"}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
              No hero account snapshots yet. Add your handle and run your first server update.
            </div>
          )}
        </CardContent>
      </Card>

      <StatCardGrid columns={4}>
        <StatCard
          title="Total Audience"
          value="12.5K"
          trend={{ value: 12.5, label: "vs last period", direction: "up" }}
          icon={<Users className="h-5 w-5" />}
          iconColor="primary"
        />
        <StatCard
          title="Comments Analyzed"
          value={overview?.totalComments?.toLocaleString() ?? "0"}
          trend={{ value: 8.3, label: "vs last period", direction: "up" }}
          icon={<MessageSquare className="h-5 w-5" />}
          iconColor="success"
        />
        <StatCard
          title="Avg. Sentiment"
          value={
            overview
              ? `${(overview.sentimentAnalysis.overall.compound * 100).toFixed(0)}%`
              : "0%"
          }
          trend={{ value: 5.2, label: "vs last period", direction: "up" }}
          icon={<Heart className="h-5 w-5" />}
          iconColor={
            overview && overview.sentimentAnalysis.overall.compound > 0
              ? "success"
              : "warning"
          }
        />
        <StatCard
          title="Engagement Rate"
          value="4.8%"
          trend={{ value: 2.1, label: "vs last period", direction: "up" }}
          icon={<TrendingUp className="h-5 w-5" />}
          iconColor="primary"
        />
      </StatCardGrid>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Audience overview</CardTitle>
              <CardDescription>
                This section is still using the existing audience insight pipeline while hero-account analytics now runs from live server updates.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <InfoPill
                icon={<MessageSquare className="h-4 w-4" />}
                title="Comment analysis"
                description="Sentiment and keyword extraction are available from the audience module."
              />
              <InfoPill
                icon={<Clock3 className="h-4 w-4" />}
                title="Historical snapshots"
                description="Every manual hero analysis is saved in report history instead of being overwritten."
              />
              <InfoPill
                icon={<ShieldCheck className="h-4 w-4" />}
                title="Heuristic quality signals"
                description="Audience quality is expressed as a confidence-style score, not a fake exact bot percentage."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Current scope</CardTitle>
              <CardDescription>
                Hero account analytics is now connected to the live profile scrapers for manual refreshes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-neutral-600 dark:text-neutral-300">
              <p>Instagram analysis covers follower counts, posting cadence, average engagement, strongest hashtags, and standout posts.</p>
              <p>TikTok analysis covers followers, views, likes, comments, shares, strongest hashtags, and standout videos.</p>
              <p>The page keeps history at the report level so each refresh is saved and reviewable later.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContent>
  );
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function MetricPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200/80 bg-black/5 p-3 dark:border-white/10 dark:bg-white/5">
      <p className="text-[11px] uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
        {label}
      </p>
      <p className="mt-1 font-mono text-lg font-semibold text-neutral-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function InfoPill({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200/80 p-4 dark:border-white/10">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
        {icon}
      </div>
      <p className="font-medium text-neutral-900 dark:text-white">{title}</p>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
    </div>
  );
}
