"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { PageHeader, PageContent } from "@/components/dashboard/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/trpc/client";
import {
  Activity,
  BarChart3,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";

export default function AudiencePage() {
  const { data: session, status } = useSession();
  const [instagramHandle, setInstagramHandle] = useState("");
  const [tiktokHandle, setTiktokHandle] = useState("");
  const workspaceId = session?.user?.currentWorkspaceId;
  const hasWorkspace = Boolean(workspaceId);

  const dashboardQuery = trpc.audience.getHeroDashboard.useQuery(
    { workspaceId: workspaceId ?? "" },
    { enabled: hasWorkspace }
  );

  const refreshMutation = trpc.audience.refreshHeroAnalytics.useMutation({
    onSuccess: async (result) => {
      await dashboardQuery.refetch();
      if (result.dashboard.handles.instagramHandle) {
        setInstagramHandle(result.dashboard.handles.instagramHandle);
      }
      if (result.dashboard.handles.tiktokHandle) {
        setTiktokHandle(result.dashboard.handles.tiktokHandle);
      }
    },
  });

  useEffect(() => {
    const handles = dashboardQuery.data?.handles;
    if (!handles) return;
    if (!instagramHandle && handles.instagramHandle) setInstagramHandle(handles.instagramHandle);
    if (!tiktokHandle && handles.tiktokHandle) setTiktokHandle(handles.tiktokHandle);
  }, [dashboardQuery.data?.handles, instagramHandle, tiktokHandle]);

  const onRefresh = async () => {
    if (!workspaceId) return;
    await refreshMutation.mutateAsync({
      workspaceId,
      instagramHandle,
      tiktokHandle,
    });
  };

  if (status === "loading" || (hasWorkspace && dashboardQuery.isLoading)) {
    return (
      <PageContent>
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-primary-600" />
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
            <CardDescription>Pick a workspace before loading content intelligence.</CardDescription>
          </CardHeader>
        </Card>
      </PageContent>
    );
  }

  const dashboard = dashboardQuery.data;

  return (
    <PageContent>
      <PageHeader
        title="Audience Intelligence"
        description="Own-account content intelligence, comment mining, and next-post recommendations."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Audience" },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary-500" />
            Hero Account Analytics
          </CardTitle>
          <CardDescription>
            Add your Instagram and/or TikTok handle, then run a manual server update.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Instagram handle
            </label>
            <Input
              value={instagramHandle}
              onChange={(event) => setInstagramHandle(event.target.value)}
              placeholder="@yourbrand"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              TikTok handle
            </label>
            <Input
              value={tiktokHandle}
              onChange={(event) => setTiktokHandle(event.target.value)}
              placeholder="@yourbrand"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={onRefresh}
              disabled={refreshMutation.isPending || (!instagramHandle.trim() && !tiktokHandle.trim())}
              className="w-full lg:w-auto"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
              Update from Server
            </Button>
          </div>
        </CardContent>
      </Card>

      {dashboard && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard label="Owned Accounts" value={dashboard.overview.accountCount} icon={<ShieldCheck className="h-4 w-4" />} />
            <MetricCard label="Posts Analyzed" value={dashboard.overview.contentCount} icon={<BarChart3 className="h-4 w-4" />} />
            <MetricCard label="Comments Analyzed" value={dashboard.overview.commentsAnalyzed} icon={<MessageSquare className="h-4 w-4" />} />
            <MetricCard label="Avg Engagement" value={`${dashboard.overview.avgEngagementRate.toFixed(1)}%`} icon={<TrendingUp className="h-4 w-4" />} />
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="winning">Winning Content</TabsTrigger>
              <TabsTrigger value="comments">Comment Intelligence</TabsTrigger>
              <TabsTrigger value="gaps">Content Gaps</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-4 xl:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Accounts</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dashboard.accounts.map((account) => (
                      <div key={account.id} className="rounded-xl border border-neutral-200/80 p-4 dark:border-white/10">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-neutral-900 dark:text-white">
                              {account.platform === "instagram" ? "Instagram" : "TikTok"} @{account.handle}
                            </p>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                              {formatCompactNumber(account.followersCount)} followers • {account.avgEngagementRate.toFixed(1)}% engagement
                            </p>
                          </div>
                          <Badge variant="secondary">{account.postCount} posts</Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Next Moves</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dashboard.recommendations.map((recommendation) => (
                      <div key={recommendation} className="rounded-xl border border-neutral-200/80 p-3 text-sm dark:border-white/10">
                        {recommendation}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="winning" className="space-y-4">
              {dashboard.winningContent.slice(0, 12).map((item) => (
                <Card key={item.id}>
                  <CardContent className="space-y-3 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white">
                          {item.title}
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          {item.platform} @{item.handle} • {new Date(item.publishedAt).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline">{item.metrics.engagementRate.toFixed(1)}% engagement</Badge>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-4">
                      <MiniMetric label="Efficiency" value={item.metrics.engagementEfficiency.toFixed(1)} />
                      <MiniMetric label="Repeatability" value={item.metrics.repeatabilityScore.toFixed(1)} />
                      <MiniMetric label="Conversion" value={item.metrics.conversionIntentScore.toFixed(1)} />
                      <MiniMetric label="Retention" value={item.metrics.retentionProxyScore.toFixed(1)} />
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                      {item.topic && <Badge variant="secondary">{item.topic}</Badge>}
                      {item.captionType && <Badge variant="secondary">{item.captionType}</Badge>}
                      {item.ctaType && <Badge variant="secondary">{item.ctaType}</Badge>}
                      {item.hashtags.slice(0, 4).map((tag) => (
                        <Badge key={tag} variant="secondary">#{tag}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="comments" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                {Object.entries(dashboard.commentIntelligence.categoryBreakdown).map(([key, value]) => (
                  <Card key={key}>
                    <CardContent className="p-5">
                      <p className="text-xs uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
                        {key.replace(/_/g, " ")}
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-white">{value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Questions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dashboard.commentIntelligence.topQuestions.map((question) => (
                      <div key={question.question} className="rounded-xl border border-neutral-200/80 p-4 dark:border-white/10">
                        <p className="font-medium text-neutral-900 dark:text-white">{question.question}</p>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                          {question.frequency} mentions • {question.suggestedAnswer}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Pain Points</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dashboard.commentIntelligence.painPoints.map((pain) => (
                      <div key={pain.issue} className="rounded-xl border border-neutral-200/80 p-4 dark:border-white/10">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-neutral-900 dark:text-white">{pain.issue}</p>
                          <Badge variant={pain.severity === "high" ? "danger" : pain.severity === "medium" ? "warning" : "secondary"}>
                            {pain.severity}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                          {pain.frequency} objection signals
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Audience Language Patterns</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {dashboard.commentIntelligence.languagePatterns.map((term) => (
                    <Badge key={term} variant="secondary">{term}</Badge>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gaps" className="space-y-4">
              {dashboard.contentGaps.map((gap) => (
                <Card key={gap.topic}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white">{gap.topic}</p>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{gap.reason}</p>
                      </div>
                      <Badge variant="warning">Opportunity {gap.opportunityScore.toFixed(1)}</Badge>
                    </div>
                    <p className="mt-3 text-sm text-neutral-700 dark:text-neutral-300">{gap.suggestedAngle}</p>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              {dashboard.reports.map((report) => (
                <Card key={report.id}>
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white">{report.title}</p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          {new Date(report.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline">{report.source.replace(/^hero-/, "")}</Badge>
                    </div>
                    <div className="space-y-2">
                      {report.insights.slice(0, 3).map((insight) => (
                        <div key={insight} className="rounded-xl border border-neutral-200/80 p-3 text-sm dark:border-white/10">
                          <Sparkles className="mr-2 inline h-4 w-4 text-primary-500" />
                          {insight}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </>
      )}
    </PageContent>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
          {icon}
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-white">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-200/80 p-3 dark:border-white/10">
      <p className="text-[11px] uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold text-neutral-900 dark:text-white">{value}</p>
    </div>
  );
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
