"use client";

import * as React from "react";
import { useState } from "react";
import { PageHeader, PageContent } from "@/components/dashboard/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard, StatCardGrid } from "@/components/ui/stat-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/trpc/client";
import {
  SentimentGauge,
  SentimentTimeline,
  KeywordCloud,
  AgeDistributionChart,
  GeographicChart,
  AudienceOverviewCard,
  PeakEngagementChart,
  BestTimesSummary,
} from "@/components/audience";
import {
  Users,
  MessageSquare,
  TrendingUp,
  Heart,
  Download,
  Filter,
  Calendar,
  BarChart3,
  Globe,
  Clock,
  Zap,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

export default function AudiencePage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  
  // Fetch audience overview
  const { data: overview, isLoading } = trpc.audience.getOverview.useQuery({
    workspaceId: 'demo-workspace',
    period,
  });
  
  // Fetch sentiment trends
  const { data: trends } = trpc.audience.getSentimentTrends.useQuery({
    workspaceId: 'demo-workspace',
    days: period === '7d' ? 7 : period === '30d' ? 30 : 90,
  });
  
  // Fetch demographics
  const { data: demographics } = trpc.audience.getDemographics.useQuery({
    workspaceId: 'demo-workspace',
  });
  
  // Fetch word cloud data
  const { data: wordCloudData } = trpc.audience.getWordCloud.useQuery({
    workspaceId: 'demo-workspace',
    maxWords: 50,
  });
  
  // Fetch peak engagement
  const { data: peakEngagement } = trpc.audience.getPeakEngagement.useQuery({
    workspaceId: 'demo-workspace',
  });
  
  if (isLoading || !overview) {
    return (
      <PageContent>
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-blue-600" />
        </div>
      </PageContent>
    );
  }
  
  return (
    <PageContent>
      <PageHeader
        title="Audience Intelligence"
        description="Understand your audience sentiment, demographics, and engagement patterns"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Audience' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-neutral-200 p-1 dark:border-neutral-800">
              {(['7d', '30d', '90d'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    period === p
                      ? 'bg-blue-600 text-white'
                      : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
                  }`}
                >
                  {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
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
      
      {/* Stats Overview */}
      <StatCardGrid columns={4}>
        <StatCard
          title="Total Audience"
          value="12.5K"
          trend={{ value: 12.5, label: 'vs last period', direction: 'up' }}
          icon={<Users className="h-5 w-5" />}
          iconColor="primary"
        />
        <StatCard
          title="Comments Analyzed"
          value={overview.totalComments.toLocaleString()}
          trend={{ value: 8.3, label: 'vs last period', direction: 'up' }}
          icon={<MessageSquare className="h-5 w-5" />}
          iconColor="success"
        />
        <StatCard
          title="Avg. Sentiment"
          value={`${(overview.sentimentAnalysis.overall.compound * 100).toFixed(0)}%`}
          trend={{ value: 5.2, label: 'vs last period', direction: 'up' }}
          icon={<Heart className="h-5 w-5" />}
          iconColor={overview.sentimentAnalysis.overall.compound > 0 ? 'success' : 'warning'}
        />
        <StatCard
          title="Engagement Rate"
          value="4.8%"
          trend={{ value: 2.1, label: 'vs last period', direction: 'up' }}
          icon={<TrendingUp className="h-5 w-5" />}
          iconColor="primary"
        />
      </StatCardGrid>
      
      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <AudienceOverviewCard overview={overview} />
          
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Trend</CardTitle>
                <CardDescription>How audience sentiment has changed over time</CardDescription>
              </CardHeader>
              <CardContent>
                {trends && <SentimentTimeline data={trends} height={250} />}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Keyword Cloud</CardTitle>
                <CardDescription>Most mentioned terms in audience conversations</CardDescription>
              </CardHeader>
              <CardContent>
                {wordCloudData && (
                  <KeywordCloud data={wordCloudData} onWordClick={(word) => console.log(word)} />
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Quick Links */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <QuickLinkCard
              title="Sentiment Analysis"
              description="Deep dive into sentiment metrics"
              href="/dashboard/audience/sentiment"
              icon={<BarChart3 className="h-5 w-5" />}
            />
            <QuickLinkCard
              title="Comment Analysis"
              description="Browse and filter all comments"
              href="/dashboard/audience/comments"
              icon={<MessageSquare className="h-5 w-5" />}
            />
            <QuickLinkCard
              title="Demographics"
              description="Age, location & interests"
              href="/dashboard/audience#demographics"
              icon={<Globe className="h-5 w-5" />}
            />
            <QuickLinkCard
              title="Best Times"
              description="Optimal posting schedules"
              href="/dashboard/audience#engagement"
              icon={<Clock className="h-5 w-5" />}
            />
          </div>
        </TabsContent>
        
        {/* Sentiment Tab */}
        <TabsContent value="sentiment" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Sentiment Gauge</CardTitle>
                <CardDescription>Overall audience sentiment score</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <SentimentGauge
                  value={overview.sentimentAnalysis.overall.compound}
                  size="lg"
                  showLabels
                />
              </CardContent>
            </Card>
            
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Sentiment Breakdown</CardTitle>
                <CardDescription>Distribution across all analyzed content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <SentimentMetricCard
                      label="Positive"
                      value={overview.sentimentAnalysis.overall.positive}
                      color="bg-emerald-500"
                      icon="😊"
                    />
                    <SentimentMetricCard
                      label="Neutral"
                      value={overview.sentimentAnalysis.overall.neutral}
                      color="bg-amber-400"
                      icon="😐"
                    />
                    <SentimentMetricCard
                      label="Negative"
                      value={overview.sentimentAnalysis.overall.negative}
                      color="bg-red-500"
                      icon="😞"
                    />
                  </div>
                  
                  {/* By Platform */}
                  <div className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
                    <h4 className="mb-3 text-sm font-medium">By Platform</h4>
                    <div className="space-y-3">
                      {Object.entries(overview.sentimentAnalysis.byPlatform).map(([platform, sentiment]) => (
                        <div key={platform} className="flex items-center justify-between">
                          <span className="capitalize text-neutral-600 dark:text-neutral-400">{platform}</span>
                          <div className="flex items-center gap-2">
                            <div className="flex h-2 w-32 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                              <div className="bg-emerald-500" style={{ width: `${sentiment.positive}%` }} />
                              <div className="bg-amber-400" style={{ width: `${sentiment.neutral}%` }} />
                              <div className="bg-red-500" style={{ width: `${sentiment.negative}%` }} />
                            </div>
                            <span className="w-12 text-right text-sm font-medium">
                              {(sentiment.compound * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Sentiment Timeline</CardTitle>
              <CardDescription>Track sentiment changes over time</CardDescription>
            </CardHeader>
            <CardContent>
              {trends && <SentimentTimeline data={trends} showAreas height={300} />}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Demographics Tab */}
        <TabsContent value="demographics" className="space-y-6">
          {demographics && (
            <>
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Age Distribution</CardTitle>
                    <CardDescription>Breakdown by age groups</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AgeDistributionChart data={demographics.ageRanges} />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Geographic Distribution</CardTitle>
                    <CardDescription>Top countries by audience</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <GeographicChart data={demographics.countries} />
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid gap-6 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Interests</CardTitle>
                    <CardDescription>Top audience interests</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {demographics.interests.slice(0, 8).map((interest) => (
                        <div key={interest.name} className="flex items-center justify-between">
                          <span className="text-sm">{interest.name}</span>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                              <div
                                className={`h-full rounded-full ${
                                  interest.affinity === 'high' ? 'bg-emerald-500' :
                                  interest.affinity === 'medium' ? 'bg-blue-500' : 'bg-neutral-400'
                                }`}
                                style={{ width: `${interest.score}%` }}
                              />
                            </div>
                            <span className="w-8 text-right text-xs text-neutral-500">{interest.score}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Gender</CardTitle>
                    <CardDescription>Audience gender distribution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {demographics.gender && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-pink-500" />
                            <span>Female</span>
                          </div>
                          <span className="font-medium">{demographics.gender.female}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-blue-500" />
                            <span>Male</span>
                          </div>
                          <span className="font-medium">{demographics.gender.male}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-purple-500" />
                            <span>Other</span>
                          </div>
                          <span className="font-medium">{demographics.gender.other}%</span>
                        </div>
                        <div className="h-4 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                          <div className="flex h-full">
                            <div className="bg-pink-500" style={{ width: `${demographics.gender.female}%` }} />
                            <div className="bg-blue-500" style={{ width: `${demographics.gender.male}%` }} />
                            <div className="bg-purple-500" style={{ width: `${demographics.gender.other}%` }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Devices</CardTitle>
                    <CardDescription>Device usage breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {demographics.devices && (
                      <div className="space-y-3">
                        {Object.entries(demographics.devices).map(([device, percentage]) => (
                          <div key={device} className="flex items-center justify-between rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
                            <div className="flex items-center gap-2">
                              {device === 'Mobile' ? (
                                <svg className="h-5 w-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              ) : device === 'Desktop' ? (
                                <svg className="h-5 w-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              ) : (
                                <svg className="h-5 w-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              )}
                              <span>{device}</span>
                            </div>
                            <span className="font-medium">{percentage}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
        
        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-6">
          {peakEngagement && (
            <>
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Peak Engagement Hours</CardTitle>
                    <CardDescription>When your audience is most active</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PeakEngagementChart data={peakEngagement} />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Best Times Summary</CardTitle>
                    <CardDescription>Optimal posting recommendations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <BestTimesSummary data={peakEngagement} />
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Insights</CardTitle>
                  <CardDescription>AI-generated recommendations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <InsightCard
                      icon={<Clock className="h-5 w-5" />}
                      title="Optimal Posting Time"
                      description={`Schedule important content at ${peakEngagement.bestHours[0]}:00 for maximum reach`}
                      color="blue"
                    />
                    <InsightCard
                      icon={<Calendar className="h-5 w-5" />}
                      title="Best Day"
                      description={`${peakEngagement.bestDays[0]}s show highest engagement rates`}
                      color="emerald"
                    />
                    <InsightCard
                      icon={<Zap className="h-5 w-5" />}
                      title="Peak Engagement"
                      description={`Engagement is ${Math.round((peakEngagement.hourlyDistribution.find(h => h.hour === peakEngagement.bestHours[0])?.engagement || 0) / 10)}x higher during peak hours`}
                      color="amber"
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </PageContent>
  );
}

// Helper Components

function QuickLinkCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="group flex items-center justify-between rounded-lg border border-neutral-200 p-4 transition-all hover:border-blue-300 hover:shadow-sm dark:border-neutral-800 dark:hover:border-blue-700"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
          {icon}
        </div>
        <div>
          <h3 className="font-medium text-neutral-900 dark:text-white">{title}</h3>
          <p className="text-sm text-neutral-500">{description}</p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-neutral-400 transition-transform group-hover:translate-x-1" />
    </a>
  );
}

function SentimentMetricCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: string;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 p-4 text-center dark:border-neutral-800">
      <div className="text-2xl">{icon}</div>
      <p className="mt-2 text-2xl font-bold">{value}%</p>
      <p className="text-sm text-neutral-500">{label}</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
        <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function InsightCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'blue' | 'emerald' | 'amber' | 'red';
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  };
  
  return (
    <div className="flex items-start gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${colorClasses[color]}`}>
        {icon}
      </div>
      <div>
        <h4 className="font-medium text-neutral-900 dark:text-white">{title}</h4>
        <p className="mt-1 text-sm text-neutral-500">{description}</p>
      </div>
    </div>
  );
}
