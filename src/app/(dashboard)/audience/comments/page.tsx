"use client";

import * as React from "react";
import { useState } from "react";
import { PageHeader, PageContent } from "@/components/dashboard/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/trpc/client";
import {
  CommentAnalysisTable,
  QuestionList,
  PainPointList,
} from "@/components/audience";
import type { CommentInsight } from "@/types/audience";
import {
  ArrowLeft,
  Download,
  Filter,
  Search,
  MessageSquare,
  HelpCircle,
  AlertTriangle,
  Smile,
  Frown,
  Meh,
} from "lucide-react";

export default function CommentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSentiment, setSelectedSentiment] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  
  // Fetch comments
  const { data: commentsData, isLoading } = trpc.audience.getComments.useQuery({
    workspaceId: 'demo-workspace',
    limit: 50,
    filters: {
      sentiment: selectedSentiment ? [selectedSentiment as 'positive' | 'negative' | 'neutral'] : undefined,
      platform: selectedPlatform ? [selectedPlatform] : undefined,
      search: searchQuery || undefined,
    },
  });
  
  // Fetch questions
  const { data: questions } = trpc.audience.getQuestions.useQuery({
    workspaceId: 'demo-workspace',
  });
  
  // Fetch pain points
  const { data: painPoints } = trpc.audience.getPainPoints.useQuery({
    workspaceId: 'demo-workspace',
  });
  
  if (isLoading) {
    return (
      <PageContent>
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-blue-600" />
        </div>
      </PageContent>
    );
  }
  
  const comments = commentsData?.comments || [];
  
  // Calculate stats
  const positiveCount = comments.filter(c => c.sentiment === 'positive').length;
  const negativeCount = comments.filter(c => c.sentiment === 'negative').length;
  const neutralCount = comments.filter(c => c.sentiment === 'neutral').length;
  
  return (
    <PageContent>
      <PageHeader
        title="Comment Analysis"
        description="Browse, filter, and analyze audience comments"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Audience', href: '/dashboard/audience' },
          { label: 'Comments' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="/dashboard/audience">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Audience
              </a>
            </Button>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        }
      />
      
      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard
          title="Total Comments"
          value={commentsData?.total || 0}
          icon={<MessageSquare className="h-4 w-4" />}
          color="blue"
        />
        <StatCard
          title="Positive"
          value={positiveCount}
          subtitle={`${((positiveCount / (comments.length || 1)) * 100).toFixed(1)}%`}
          icon={<Smile className="h-4 w-4" />}
          color="emerald"
        />
        <StatCard
          title="Neutral"
          value={neutralCount}
          subtitle={`${((neutralCount / (comments.length || 1)) * 100).toFixed(1)}%`}
          icon={<Meh className="h-4 w-4" />}
          color="amber"
        />
        <StatCard
          title="Negative"
          value={negativeCount}
          subtitle={`${((negativeCount / (comments.length || 1)) * 100).toFixed(1)}%`}
          icon={<Frown className="h-4 w-4" />}
          color="red"
        />
      </div>
      
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                placeholder="Search comments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={selectedSentiment === null ? 'primary' : 'secondary'}
                className="cursor-pointer"
                onClick={() => setSelectedSentiment(null)}
              >
                All
              </Badge>
              <Badge
                variant={selectedSentiment === 'positive' ? 'success' : 'secondary'}
                className="cursor-pointer"
                onClick={() => setSelectedSentiment('positive')}
              >
                Positive
              </Badge>
              <Badge
                variant={selectedSentiment === 'neutral' ? 'warning' : 'secondary'}
                className="cursor-pointer"
                onClick={() => setSelectedSentiment('neutral')}
              >
                Neutral
              </Badge>
              <Badge
                variant={selectedSentiment === 'negative' ? 'danger' : 'secondary'}
                className="cursor-pointer"
                onClick={() => setSelectedSentiment('negative')}
              >
                Negative
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedPlatform === null ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedPlatform(null)}
              >
                All Platforms
              </Button>
              <Button
                variant={selectedPlatform === 'instagram' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedPlatform('instagram')}
              >
                Instagram
              </Button>
              <Button
                variant={selectedPlatform === 'tiktok' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedPlatform('tiktok')}
              >
                TikTok
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Main Content Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">
            <MessageSquare className="mr-2 h-4 w-4" />
            All Comments
          </TabsTrigger>
          <TabsTrigger value="questions">
            <HelpCircle className="mr-2 h-4 w-4" />
            Questions
          </TabsTrigger>
          <TabsTrigger value="issues">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Pain Points
          </TabsTrigger>
        </TabsList>
        
        {/* All Comments Tab */}
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Comments</CardTitle>
              <CardDescription>
                Showing {comments.length} of {commentsData?.total || 0} comments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CommentAnalysisTable
                comments={comments}
                onCommentClick={(comment) => console.log('Clicked:', comment)}
              />
              
              {commentsData?.hasMore && (
                <div className="mt-6 flex justify-center">
                  <Button variant="outline">Load More</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Questions Tab */}
        <TabsContent value="questions">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>
                Common questions from your audience with suggested responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {questions && <QuestionList questions={questions} />}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Pain Points Tab */}
        <TabsContent value="issues">
          <Card>
            <CardHeader>
              <CardTitle>Pain Points & Issues</CardTitle>
              <CardDescription>
                Identified problems and complaints from your audience
              </CardDescription>
            </CardHeader>
            <CardContent>
              {painPoints && <PainPointList painPoints={painPoints} />}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContent>
  );
}

// Helper Components

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'blue' | 'emerald' | 'amber' | 'red';
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  };
  
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm text-neutral-500">{title}</p>
          <p className="mt-1 text-2xl font-bold">{value.toLocaleString()}</p>
          {subtitle && <p className="text-xs text-neutral-500">{subtitle}</p>}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
