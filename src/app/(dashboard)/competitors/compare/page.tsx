"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Download, Share2, Lightbulb } from "lucide-react";
import { PageContent } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ComparisonChart,
  HashtagOverlapAnalysis,
  ContentTypeBreakdown,
} from "@/components/competitors";

// Demo data for comparison
const DEMO_COMPARISON_DATA = {
  competitors: [
    {
      id: "comp_1",
      username: "fashionforward",
      displayName: "Fashion Forward",
      profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
      followers: 245000,
      engagementRate: 3.2,
      postsCount: 1247,
      avgLikes: 7840,
      avgComments: 156,
      growthRate: 5.8,
      color: "#4f46e5",
    },
    {
      id: "comp_2",
      username: "techtalkdaily",
      displayName: "Tech Talk Daily",
      profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
      followers: 189000,
      engagementRate: 4.1,
      postsCount: 892,
      avgLikes: 7749,
      avgComments: 312,
      growthRate: 8.2,
      color: "#22c55e",
    },
    {
      id: "comp_3",
      username: "fitwithsarah",
      displayName: "Sarah | Fitness Coach",
      profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
      followers: 423000,
      engagementRate: 2.8,
      postsCount: 2156,
      avgLikes: 11844,
      avgComments: 423,
      growthRate: 12.5,
      color: "#f59e0b",
    },
  ],
  contentGaps: [
    { contentType: "reel", competitorAvgFrequency: 15, yourFrequency: 8, gap: 7, opportunity: "high" },
    { contentType: "carousel", competitorAvgFrequency: 12, yourFrequency: 10, gap: 2, opportunity: "medium" },
    { contentType: "video", competitorAvgFrequency: 5, yourFrequency: 2, gap: 3, opportunity: "medium" },
    { contentType: "post", competitorAvgFrequency: 20, yourFrequency: 25, gap: -5, opportunity: "low" },
  ],
  hashtagOverlap: [
    { hashtag: "lifestyle", yourUsage: 12, competitorUsage: 28, avgEngagement: 2.5 },
    { hashtag: "daily", yourUsage: 8, competitorUsage: 22, avgEngagement: 2.8 },
    { hashtag: "instagood", yourUsage: 15, competitorUsage: 35, avgEngagement: 3.1 },
    { hashtag: "photooftheday", yourUsage: 6, competitorUsage: 18, avgEngagement: 2.9 },
    { hashtag: "love", yourUsage: 10, competitorUsage: 20, avgEngagement: 2.4 },
    { hashtag: "beautiful", yourUsage: 4, competitorUsage: 15, avgEngagement: 3.2 },
    { hashtag: "happy", yourUsage: 7, competitorUsage: 12, avgEngagement: 2.6 },
    { hashtag: "art", yourUsage: 3, competitorUsage: 10, avgEngagement: 3.5 },
  ],
  recommendations: [
    {
      id: "rec_1",
      type: "content_strategy",
      title: "Increase Reel Content",
      description: "Competitors post 15 Reels on average while you post 8. This content type shows strong engagement potential.",
      priority: "high",
      expectedImpact: "Potential 4.8% engagement increase",
      actionItems: [
        "Create 3-5 Reels per week",
        "Study top-performing competitor examples",
        "A/B test different formats",
      ],
    },
    {
      id: "rec_2",
      title: "Optimize Posting Times",
      description: "Competitors see high engagement on Wednesdays at 7PM and Fridays at 6PM.",
      priority: "medium",
      expectedImpact: "20-40% engagement boost",
      actionItems: [
        "Test posting at recommended times",
        "Track engagement rates by time slot",
        "Use scheduling tools",
      ],
    },
    {
      id: "rec_3",
      title: "Leverage Untapped Hashtags",
      description: "Found 8 hashtags that competitors use successfully but you haven't tried.",
      priority: "high",
      expectedImpact: "15-25% reach expansion",
      actionItems: [
        "Research hashtag relevance",
        "Start with 3-5 hashtags per post",
        "Mix popular and niche hashtags",
      ],
    },
  ],
  shareOfVoice: {
    totalEngagement: 245000,
    shares: {
      fashionforward: { username: "fashionforward", engagement: 78400, percentage: 32, posts: 45 },
      techtalkdaily: { username: "techtalkdaily", engagement: 77490, percentage: 31.6, posts: 32 },
      fitwithsarah: { username: "fitwithsarah", engagement: 89110, percentage: 36.4, posts: 58 },
    },
  },
};

export default function ComparePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = React.useState("overview");

  const competitorIds = searchParams.get("ids")?.split(",") || [];
  const selectedCompetitors = DEMO_COMPARISON_DATA.competitors.filter((c) =>
    competitorIds.length > 0 ? competitorIds.includes(c.id) : true
  );

  const handleExport = async (format: "csv" | "pdf") => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    alert(`Export as ${format.toUpperCase()} functionality would be implemented here`);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <PageContent>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/competitors")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
              Competitor Comparison
            </h1>
            <p className="text-neutral-500">
              Comparing {selectedCompetitors.length} competitors
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleExport("csv")}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport("pdf")}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Selected Competitors */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4">
            {selectedCompetitors.map((competitor) => (
              <div
                key={competitor.id}
                className="flex items-center gap-3 rounded-lg border p-3"
                style={{ borderColor: competitor.color }}
              >
                <img
                  src={competitor.profileImage}
                  alt={competitor.username}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">
                    {competitor.displayName}
                  </p>
                  <p className="text-sm text-neutral-500">@{competitor.username}</p>
                </div>
                <div
                  className="ml-4 h-3 w-3 rounded-full"
                  style={{ backgroundColor: competitor.color }}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content Analysis</TabsTrigger>
          <TabsTrigger value="hashtags">Hashtags</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <ComparisonChart
            competitors={selectedCompetitors}
            categories={["followers", "engagement", "posts", "growth"]}
          />

          {/* Side-by-Side Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Side-by-Side Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="pb-3 text-left font-medium text-neutral-500">Metric</th>
                      {selectedCompetitors.map((c) => (
                        <th key={c.id} className="pb-3 text-left font-medium">
                          <div className="flex items-center gap-2">
                            <img src={c.profileImage} alt={c.username} className="h-6 w-6 rounded-full" />
                            {c.username}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="py-3 text-neutral-500">Followers</td>
                      {selectedCompetitors.map((c) => (
                        <td key={c.id} className="py-3 font-medium">
                          {formatNumber(c.followers)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 text-neutral-500">Engagement Rate</td>
                      {selectedCompetitors.map((c) => (
                        <td key={c.id} className="py-3 font-medium">
                          {c.engagementRate.toFixed(2)}%
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 text-neutral-500">Posts (30 days)</td>
                      {selectedCompetitors.map((c) => (
                        <td key={c.id} className="py-3 font-medium">
                          {c.postsCount}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 text-neutral-500">Growth Rate</td>
                      {selectedCompetitors.map((c) => (
                        <td key={c.id} className="py-3 font-medium">
                          <span className={c.growthRate > 0 ? "text-success-600" : "text-danger-600"}>
                            {c.growthRate > 0 ? "+" : ""}
                            {c.growthRate.toFixed(1)}%
                          </span>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 text-neutral-500">Avg Likes</td>
                      {selectedCompetitors.map((c) => (
                        <td key={c.id} className="py-3 font-medium">
                          {formatNumber(c.avgLikes)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 text-neutral-500">Avg Comments</td>
                      {selectedCompetitors.map((c) => (
                        <td key={c.id} className="py-3 font-medium">
                          {formatNumber(c.avgComments)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Share of Voice */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Share of Voice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.values(DEMO_COMPARISON_DATA.shareOfVoice.shares).map((share) => (
                  <div key={share.username} className="flex items-center gap-4">
                    <div className="w-24 truncate text-sm font-medium">{share.username}</div>
                    <div className="flex-1">
                      <div className="h-4 rounded-full bg-neutral-100 dark:bg-neutral-800">
                        <div
                          className="h-4 rounded-full bg-primary-500 transition-all"
                          style={{ width: `${share.percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-16 text-right text-sm font-medium">{share.percentage.toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Analysis Tab */}
        <TabsContent value="content" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <ContentTypeBreakdown
              data={[
                { contentType: "post", count: 45, avgEngagementRate: 2.8, percentageOfTotal: 37.5 },
                { contentType: "reel", count: 38, avgEngagementRate: 4.2, percentageOfTotal: 31.7 },
                { contentType: "carousel", count: 28, avgEngagementRate: 3.6, percentageOfTotal: 23.3 },
                { contentType: "video", count: 9, avgEngagementRate: 3.1, percentageOfTotal: 7.5 },
              ]}
            />

            <Card>
              <CardHeader>
                <CardTitle>Content Gaps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {DEMO_COMPARISON_DATA.contentGaps.map((gap) => (
                    <div
                      key={gap.contentType}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <p className="font-medium capitalize">{gap.contentType}</p>
                        <p className="text-sm text-neutral-500">
                          You: {gap.yourFrequency} | Competitors: {gap.competitorAvgFrequency}
                        </p>
                      </div>
                      <Badge
                        variant={
                          gap.opportunity === "high"
                            ? "danger"
                            : gap.opportunity === "medium"
                            ? "warning"
                            : "secondary"
                        }
                      >
                        Gap: {gap.gap > 0 ? `+${gap.gap}` : gap.gap}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Hashtags Tab */}
        <TabsContent value="hashtags" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hashtag Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <HashtagOverlapAnalysis
                hashtags={DEMO_COMPARISON_DATA.hashtagOverlap}
                showComparison={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <div className="grid gap-6">
            {DEMO_COMPARISON_DATA.recommendations.map((rec) => (
              <Card key={rec.id} className="border-l-4 border-l-primary-500">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-primary-100 p-3 dark:bg-primary-900/20">
                      <Lightbulb className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{rec.title}</h3>
                        <Badge
                          variant={
                            rec.priority === "high"
                              ? "danger"
                              : rec.priority === "medium"
                              ? "warning"
                              : "secondary"
                          }
                        >
                          {rec.priority} priority
                        </Badge>
                      </div>
                      <p className="mt-1 text-neutral-600 dark:text-neutral-300">
                        {rec.description}
                      </p>
                      <p className="mt-2 text-sm font-medium text-success-600">
                        Expected Impact: {rec.expectedImpact}
                      </p>
                      <div className="mt-4">
                        <p className="text-sm font-medium">Action Items:</p>
                        <ul className="mt-1 list-inside list-disc text-sm text-neutral-500">
                          {rec.actionItems.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </PageContent>
  );
}
