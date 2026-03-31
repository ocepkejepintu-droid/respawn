"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { StatCard, StatCardGrid } from "@/components/ui/stat-card";
import {
  ContentScoreCard,
  PostingTimeHeatmap,
  ContentTypePerformance,
  CaptionOptimizer,
  HashtagRecommender,
  ContentIdeaGenerator,
  PostPreview,
  OptimizationChecklist,
} from "@/components/optimize";
import {
  Sparkles,
  TrendingUp,
  Calendar,
  Target,
  Zap,
  Lightbulb,
  Hash,
  Type,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import type { ContentRecommendation } from "@/types/optimize";
import Link from "next/link";

const MOCK_WORKSPACE_ID = "workspace_1";

export default function OptimizePage() {
  const router = useRouter();
  const [selectedContentType, setSelectedContentType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "optimizer" | "ideas">("overview");

  // Fetch performance analysis
  const { data: performance, isLoading: performanceLoading } = trpc.optimize.analyzePerformance.useQuery({
    workspaceId: MOCK_WORKSPACE_ID,
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
  });

  // Fetch recommendations
  const { data: recommendations, isLoading: recommendationsLoading } = trpc.optimize.getRecommendations.useQuery({
    workspaceId: MOCK_WORKSPACE_ID,
  });

  // Fetch content ideas
  const { data: contentIdeas, isLoading: ideasLoading, refetch: refetchIdeas } = trpc.optimize.generateContentIdeas.useQuery({
    workspaceId: MOCK_WORKSPACE_ID,
    count: 5,
  });

  // Calculate score
  const { mutate: calculateScore, data: scoreData, isPending: scoreLoading } = trpc.optimize.calculateScore.useMutation();

  // Generate hashtags
  const { data: hashtagRecommendations, isLoading: hashtagsLoading } = trpc.optimize.recommendHashtags.useQuery({
    workspaceId: MOCK_WORKSPACE_ID,
    niche: "content creation",
    count: 30,
  });

  const handleOptimize = () => {
    calculateScore({
      workspaceId: MOCK_WORKSPACE_ID,
      caption: "Check out my latest content!",
      hashtags: ["content", "creator", "socialmedia"],
      contentType: "carousel",
      platform: "instagram",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Content Optimization
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            Analyze, optimize, and improve your content performance
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/optimize/calendar">
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Calendar
            </Button>
          </Link>
          <Button onClick={handleOptimize}>
            <Sparkles className="mr-2 h-4 w-4" />
            Analyze Content
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <StatCardGrid columns={4}>
        <StatCard
          title="Overall Score"
          value={scoreData?.overall || "-"}
          icon={<Target className="h-5 w-5" />}
          iconColor={scoreData?.overall && scoreData.overall >= 80 ? "success" : scoreData?.overall && scoreData.overall >= 60 ? "warning" : "neutral"}
          subtitle={scoreData?.grade ? `Grade ${scoreData.grade}` : "Calculate your score"}
          loading={scoreLoading}
        />
        <StatCard
          title="Best Content Type"
          value={performance?.patterns.bestContentType 
            ? performance.patterns.bestContentType.charAt(0).toUpperCase() + performance.patterns.bestContentType.slice(1).replace('_', ' ')
            : "-"}
          icon={<TrendingUp className="h-5 w-5" />}
          iconColor="success"
          subtitle="Based on engagement"
          loading={performanceLoading}
        />
        <StatCard
          title="Best Time to Post"
          value={performance?.patterns.bestPostingDay 
            ? `${performance.patterns.bestPostingDay.charAt(0).toUpperCase() + performance.patterns.bestPostingDay.slice(1)} at ${performance.patterns.bestPostingHour}:00`
            : "-"}
          icon={<Zap className="h-5 w-5" />}
          iconColor="warning"
          subtitle="Peak engagement"
          loading={performanceLoading}
        />
        <StatCard
          title="Active Recommendations"
          value={recommendations?.length || 0}
          icon={<Lightbulb className="h-5 w-5" />}
          iconColor="primary"
          subtitle="Actions to take"
          loading={recommendationsLoading}
        />
      </StatCardGrid>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Content Type Performance */}
          {performance && (
            <ContentTypePerformance
              data={performance.contentTypePerformance}
              onTypeSelect={(type) => setSelectedContentType(type)}
            />
          )}

          {/* Posting Time Heatmap */}
          {performance && (
            <PostingTimeHeatmap
              data={performance.postingTimeHeatmap}
            />
          )}

          {/* Caption Optimizer */}
          <CaptionOptimizer
            initialCaption=""
            initialHashtags={[]}
            onCaptionChange={(caption) => console.log("Caption:", caption)}
            onHashtagsChange={(hashtags) => console.log("Hashtags:", hashtags)}
            suggestions={undefined}
            onGenerateSuggestions={handleOptimize}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Content Score */}
          {scoreData && (
            <ContentScoreCard
              score={scoreData}
              onOptimize={handleOptimize}
            />
          )}

          {/* Content Ideas */}
          {contentIdeas && (
            <ContentIdeaGenerator
              ideas={contentIdeas}
              onRefresh={() => refetchIdeas()}
              onAddToQueue={(idea) => console.log("Add to queue:", idea)}
              onSchedule={(idea) => console.log("Schedule:", idea)}
              loading={ideasLoading}
            />
          )}

          {/* Hashtag Recommender */}
          {hashtagRecommendations && (
            <HashtagRecommender
              recommendations={hashtagRecommendations}
              selectedHashtags={[]}
              onHashtagSelect={(hashtag) => console.log("Select:", hashtag)}
              onHashtagRemove={(hashtag) => console.log("Remove:", hashtag)}
              onGenerateMore={() => console.log("Generate more")}
            />
          )}
        </div>
      </div>

      {/* Recommendations Section */}
      {recommendations && recommendations.length > 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-neutral-900 dark:text-white">
            <Sparkles className="h-5 w-5 text-primary-500" />
            AI Recommendations
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.slice(0, 6).map((rec) => (
              <RecommendationCard key={rec.id} recommendation={rec} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RecommendationCard({ recommendation }: { recommendation: ContentRecommendation }) {
  const priorityColors = {
    high: "border-danger-200 bg-danger-50 dark:border-danger-800 dark:bg-danger-900/10",
    medium: "border-warning-200 bg-warning-50 dark:border-warning-800 dark:bg-warning-900/10",
    low: "border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800",
  };

  const priorityLabels = {
    high: "High Priority",
    medium: "Medium Priority",
    low: "Low Priority",
  };

  return (
    <div className={cn(
      "rounded-lg border p-4 transition-all hover:shadow-sm",
      priorityColors[recommendation.priority]
    )}>
      <div className="flex items-start justify-between">
        <span className={cn(
          "rounded-full px-2 py-0.5 text-xs font-medium",
          recommendation.priority === "high" && "bg-danger-100 text-danger-700 dark:bg-danger-900/20 dark:text-danger-400",
          recommendation.priority === "medium" && "bg-warning-100 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400",
          recommendation.priority === "low" && "bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300",
        )}>
          {priorityLabels[recommendation.priority]}
        </span>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {recommendation.basedOn.confidence}% confidence
        </span>
      </div>
      
      <h3 className="mt-2 font-medium text-neutral-900 dark:text-white">
        {recommendation.title}
      </h3>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        {recommendation.description}
      </p>
      
      <div className="mt-3 flex items-center gap-2 text-sm">
        <span className="font-medium text-success-600 dark:text-success-400">
          +{recommendation.expectedImpact.improvement}%
        </span>
        <span className="text-neutral-500 dark:text-neutral-400">
          {recommendation.expectedImpact.metric}
        </span>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        className="mt-3 w-full"
        onClick={() => console.log("Apply recommendation:", recommendation.id)}
      >
        {recommendation.action}
        <ArrowRight className="ml-2 h-3 w-3" />
      </Button>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
