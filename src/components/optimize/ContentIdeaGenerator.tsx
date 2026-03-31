"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContentIdea, ContentType, PlatformType } from "@/types/optimize";
import { 
  Lightbulb, 
  Sparkles, 
  TrendingUp, 
  Clock, 
  Target,
  Plus,
  Calendar,
  Copy,
  Check,
  RefreshCw,
  Film,
  Images,
  Image,
  Video
} from "lucide-react";

interface ContentIdeaGeneratorProps {
  ideas: ContentIdea[];
  className?: string;
  onRefresh?: () => void;
  onAddToQueue?: (idea: ContentIdea) => void;
  onSchedule?: (idea: ContentIdea) => void;
  loading?: boolean;
  platform?: PlatformType;
  contentType?: ContentType;
}

const contentTypeIcons: Record<ContentType, React.ReactNode> = {
  reel: <Film className="h-4 w-4" />,
  carousel: <Images className="h-4 w-4" />,
  single_image: <Image className="h-4 w-4" />,
  story: <Clock className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
};

const contentTypeLabels: Record<ContentType, string> = {
  reel: "Reel",
  carousel: "Carousel",
  single_image: "Single Image",
  story: "Story",
  video: "Video",
};

const sourceLabels: Record<ContentIdea['source'], { label: string; color: string; icon: React.ReactNode }> = {
  ai: { 
    label: "AI Generated", 
    color: "bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400",
    icon: <Sparkles className="h-3 w-3" />
  },
  trending: { 
    label: "Trending", 
    color: "bg-warning-100 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400",
    icon: <TrendingUp className="h-3 w-3" />
  },
  competitor: { 
    label: "Competitor Insight", 
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
    icon: <Target className="h-3 w-3" />
  },
  historical: { 
    label: "Based on History", 
    color: "bg-success-100 text-success-700 dark:bg-success-900/20 dark:text-success-400",
    icon: <Clock className="h-3 w-3" />
  },
};

export function ContentIdeaGenerator({
  ideas,
  className,
  onRefresh,
  onAddToQueue,
  onSchedule,
  loading = false,
  platform,
  contentType,
}: ContentIdeaGeneratorProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleCopy = (idea: ContentIdea) => {
    const text = `${idea.title}\n\n${idea.description}\n\nCaption: ${idea.suggestedCaption}\n\nHashtags: ${idea.suggestedHashtags.join(" ")}`;
    navigator.clipboard.writeText(text);
    setCopiedId(idea.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpand = (ideaId: string) => {
    setExpandedId(expandedId === ideaId ? null : ideaId);
  };

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-primary-500" />
              Content Ideas
            </CardTitle>
            <CardDescription>
              AI-powered ideas tailored for your audience
            </CardDescription>
          </div>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800"
              />
            ))}
          </div>
        ) : ideas.length === 0 ? (
          <div className="py-12 text-center">
            <Lightbulb className="mx-auto h-12 w-12 text-neutral-300 dark:text-neutral-600" />
            <p className="mt-4 text-neutral-500 dark:text-neutral-400">
              No ideas generated yet. Click refresh to get started!
            </p>
          </div>
        ) : (
          ideas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              isExpanded={expandedId === idea.id}
              isCopied={copiedId === idea.id}
              onToggleExpand={() => toggleExpand(idea.id)}
              onCopy={() => handleCopy(idea)}
              onAddToQueue={() => onAddToQueue?.(idea)}
              onSchedule={() => onSchedule?.(idea)}
            />
          ))
        )}

        {/* Summary Stats */}
        {!loading && ideas.length > 0 && (
          <div className="grid gap-3 rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800/50 sm:grid-cols-4">
            <StatItem
              label="Total Ideas"
              value={ideas.length}
            />
            <StatItem
              label="Avg Engagement"
              value={`${(ideas.reduce((sum, i) => sum + i.estimatedEngagement, 0) / ideas.length).toFixed(1)}%`}
            />
            <StatItem
              label="Trending"
              value={ideas.filter(i => i.source === 'trending').length}
            />
            <StatItem
              label="AI Generated"
              value={ideas.filter(i => i.source === 'ai').length}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function IdeaCard({
  idea,
  isExpanded,
  isCopied,
  onToggleExpand,
  onCopy,
  onAddToQueue,
  onSchedule,
}: {
  idea: ContentIdea;
  isExpanded: boolean;
  isCopied: boolean;
  onToggleExpand: () => void;
  onCopy: () => void;
  onAddToQueue: () => void;
  onSchedule: () => void;
}) {
  const source = sourceLabels[idea.source];

  return (
    <div
      className={cn(
        "rounded-lg border transition-all",
        isExpanded
          ? "border-primary-300 bg-primary-50/50 dark:border-primary-700 dark:bg-primary-900/5"
          : "border-neutral-200 hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600"
      )}
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-semibold text-neutral-900 dark:text-white">
                {idea.title}
              </h4>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                  source.color
                )}
              >
                {source.icon}
                {source.label}
              </span>
            </div>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              {idea.description}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
              <span className="flex items-center gap-1">
                {contentTypeIcons[idea.contentType]}
                {contentTypeLabels[idea.contentType]}
              </span>
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                {idea.platform}
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {idea.trendScore}/100 trend score
              </span>
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {idea.relevanceScore}/100 relevance
              </span>
            </div>
          </div>
          <div className="ml-4 flex flex-col items-end gap-2">
            <div className="text-right">
              <div className="text-lg font-semibold text-neutral-900 dark:text-white">
                {idea.estimatedEngagement.toFixed(1)}%
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                Est. engagement
              </div>
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 space-y-4 border-t border-neutral-200 pt-4 dark:border-neutral-700">
            <div>
              <h5 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Suggested Caption
              </h5>
              <p className="mt-1 rounded-lg bg-white p-3 text-sm text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                {idea.suggestedCaption}
              </p>
            </div>
            <div>
              <h5 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Suggested Hashtags
              </h5>
              <div className="mt-1 flex flex-wrap gap-2">
                {idea.suggestedHashtags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleExpand}
          >
            {isExpanded ? "Show Less" : "Show More"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCopy}
          >
            {isCopied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </>
            )}
          </Button>
          {onAddToQueue && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAddToQueue}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add to Queue
            </Button>
          )}
          {onSchedule && (
            <Button
              size="sm"
              onClick={onSchedule}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Schedule
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <div className="text-lg font-semibold text-neutral-900 dark:text-white">
        {value}
      </div>
      <div className="text-xs text-neutral-500 dark:text-neutral-400">
        {label}
      </div>
    </div>
  );
}
