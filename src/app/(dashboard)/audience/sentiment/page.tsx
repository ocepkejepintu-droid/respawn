"use client";

import * as React from "react";
import { useState } from "react";
import { PageHeader, PageContent } from "@/components/dashboard/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/trpc/client";
import {
  SentimentGauge,
  SentimentTimeline,
  SentimentByPlatform,
  KeywordList,
} from "@/components/audience";
import {
  ArrowLeft,
  Download,
  Filter,
  BarChart3,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  Info,
  Sparkles,
} from "lucide-react";

export default function SentimentAnalysisPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  
  // Fetch sentiment analysis
  const { data: sentiment, isLoading } = trpc.audience.getSentimentAnalysis.useQuery({
    workspaceId: 'demo-workspace',
    platform: 'all',
    period,
  });
  
  // Fetch sentiment trends
  const { data: trends } = trpc.audience.getSentimentTrends.useQuery({
    workspaceId: 'demo-workspace',
    days: period === '7d' ? 7 : period === '30d' ? 30 : 90,
  });
  
  // Fetch keywords
  const { data: keywords } = trpc.audience.getKeywords.useQuery({
    workspaceId: 'demo-workspace',
    limit: 20,
  });
  
  if (isLoading || !sentiment) {
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
        title="Sentiment Analysis"
        description="Deep dive into audience sentiment trends and patterns"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Audience', href: '/dashboard/audience' },
          { label: 'Sentiment' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="/dashboard/audience">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Audience
              </a>
            </Button>
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
              <Download className="h-4 w-4" />
            </Button>
          </div>
        }
      />
      
      {/* Overview Cards */}
      <div className="grid gap-6 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overall Sentiment</CardDescription>
            <CardTitle className="text-3xl">
              <span className={sentiment.overall.compound > 0.2 ? 'text-emerald-600' : sentiment.overall.compound < -0.2 ? 'text-red-600' : 'text-amber-600'}>
                {(sentiment.overall.compound * 100).toFixed(0)}%
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SentimentGauge value={sentiment.overall.compound} size="sm" showLabels={false} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Positive</CardDescription>
            <CardTitle className="text-3xl text-emerald-600">
              {sentiment.overall.positive}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span className="text-sm text-emerald-600">Healthy level</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${sentiment.overall.positive}%` }} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Neutral</CardDescription>
            <CardTitle className="text-3xl text-amber-500">
              {sentiment.overall.neutral}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-amber-500">Room for improvement</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
              <div className="h-full rounded-full bg-amber-400" style={{ width: `${sentiment.overall.neutral}%` }} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Negative</CardDescription>
            <CardTitle className="text-3xl text-red-600">
              {sentiment.overall.negative}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {sentiment.overall.negative > 30 ? (
                <>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-600">Action needed</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm text-emerald-600">Within normal range</span>
                </>
              )}
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
              <div className="h-full rounded-full bg-red-500" style={{ width: `${sentiment.overall.negative}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList>
          <TabsTrigger value="trends">
            <TrendingUp className="mr-2 h-4 w-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="platforms">
            <BarChart3 className="mr-2 h-4 w-4" />
            By Platform
          </TabsTrigger>
          <TabsTrigger value="keywords">
            <MessageSquare className="mr-2 h-4 w-4" />
            Keywords
          </TabsTrigger>
        </TabsList>
        
        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sentiment Trends Over Time</CardTitle>
              <CardDescription>Track how audience sentiment changes day by day</CardDescription>
            </CardHeader>
            <CardContent>
              {trends && <SentimentTimeline data={trends} showAreas height={400} />}
            </CardContent>
          </Card>
          
          {/* Trend Analysis */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Trend Direction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    <TrendingUp className="h-8 w-8 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">+5.2%</p>
                    <p className="text-sm text-neutral-500">vs previous period</p>
                  </div>
                </div>
                <div className="mt-4 rounded-lg bg-emerald-50 p-3 dark:bg-emerald-900/20">
                  <p className="text-sm text-emerald-800 dark:text-emerald-300">
                    Sentiment is trending positively. Your recent content is resonating well with the audience.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Best Performing Day</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">Friday</p>
                  <p className="mt-2 text-sm text-neutral-500">
                    Average sentiment: 78% positive
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                    <div
                      key={i}
                      className={`rounded py-2 ${
                        day === 'F'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                      }`}
                    >
                      {day}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Confidence Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <span className="text-2xl font-bold text-blue-600">
                      {(sentiment.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">High Confidence</p>
                    <p className="text-sm text-neutral-500">
                      Based on {trends?.reduce((sum, t) => sum + t.total, 0) || 0} analyzed comments
                    </p>
                  </div>
                </div>
                <div className="mt-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Analysis confidence is high. The sample size is sufficient for reliable insights.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Platforms Tab */}
        <TabsContent value="platforms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sentiment by Platform</CardTitle>
              <CardDescription>Compare sentiment across different social platforms</CardDescription>
            </CardHeader>
            <CardContent>
              <SentimentByPlatform byPlatform={sentiment.byPlatform} />
            </CardContent>
          </Card>
          
          {/* Platform Breakdown */}
          <div className="grid gap-6 lg:grid-cols-2">
            {Object.entries(sentiment.byPlatform).map(([platform, platformSentiment]) => (
              <Card key={platform}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="capitalize">{platform}</CardTitle>
                    <CardDescription>Sentiment breakdown</CardDescription>
                  </div>
                  <Badge
                    variant={platformSentiment.compound > 0.2 ? 'success' : platformSentiment.compound < -0.2 ? 'danger' : 'warning'}
                  >
                    {(platformSentiment.compound * 100).toFixed(0)}% Score
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-emerald-600">Positive</span>
                        <span className="font-medium">{platformSentiment.positive}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${platformSentiment.positive}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-amber-500">Neutral</span>
                        <span className="font-medium">{platformSentiment.neutral}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800">
                        <div
                          className="h-full rounded-full bg-amber-400"
                          style={{ width: `${platformSentiment.neutral}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-red-600">Negative</span>
                        <span className="font-medium">{platformSentiment.negative}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800">
                        <div
                          className="h-full rounded-full bg-red-500"
                          style={{ width: `${platformSentiment.negative}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Keywords Tab */}
        <TabsContent value="keywords" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sentiment by Keywords</CardTitle>
              <CardDescription>Most mentioned terms and their sentiment</CardDescription>
            </CardHeader>
            <CardContent>
              {keywords && <KeywordList keywords={keywords} />}
            </CardContent>
          </Card>
          
          {/* Keyword Sentiment Breakdown */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Positive Keywords</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {keywords?.filter(k => k.sentiment === 'positive').slice(0, 10).map((keyword) => (
                    <Badge key={keyword.term} variant="success" className="text-xs">
                      {keyword.term} ({keyword.frequency})
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Neutral Keywords</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {keywords?.filter(k => k.sentiment === 'neutral').slice(0, 10).map((keyword) => (
                    <Badge key={keyword.term} variant="warning" className="text-xs">
                      {keyword.term} ({keyword.frequency})
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Negative Keywords</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {keywords?.filter(k => k.sentiment === 'negative').slice(0, 10).map((keyword) => (
                    <Badge key={keyword.term} variant="danger" className="text-xs">
                      {keyword.term} ({keyword.frequency})
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </PageContent>
  );
}
