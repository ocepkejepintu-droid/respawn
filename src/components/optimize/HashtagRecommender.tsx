"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HashtagRecommendation } from "@/types/optimize";
import { 
  Hash, 
  Copy, 
  Check, 
  TrendingUp, 
  Users, 
  Target,
  Sparkles,
  RefreshCw,
  Plus,
  X
} from "lucide-react";

interface HashtagRecommenderProps {
  recommendations: HashtagRecommendation[];
  selectedHashtags?: string[];
  className?: string;
  onHashtagSelect?: (hashtag: string) => void;
  onHashtagRemove?: (hashtag: string) => void;
  onGenerateMore?: () => void;
  loading?: boolean;
}

export function HashtagRecommender({
  recommendations,
  selectedHashtags = [],
  className,
  onHashtagSelect,
  onHashtagRemove,
  onGenerateMore,
  loading = false,
}: HashtagRecommenderProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<HashtagRecommendation['category'] | 'all'>("all");
  const [copied, setCopied] = useState(false);

  const filteredHashtags = recommendations.filter(tag => {
    const matchesSearch = tag.hashtag.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || tag.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCopyAll = () => {
    navigator.clipboard.writeText(selectedHashtags.map(h => `#${h}`).join(" "));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleHashtag = (hashtag: string) => {
    if (selectedHashtags.includes(hashtag)) {
      onHashtagRemove?.(hashtag);
    } else {
      onHashtagSelect?.(hashtag);
    }
  };

  const categoryLabels: Record<HashtagRecommendation['category'], string> = {
    niche: "Niche",
    popular: "Popular",
    trending: "Trending",
    branded: "Branded",
  };

  const categoryColors: Record<HashtagRecommendation['category'], string> = {
    niche: "bg-success-100 text-success-700 dark:bg-success-900/20 dark:text-success-400",
    popular: "bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400",
    trending: "bg-warning-100 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400",
    branded: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
  };

  const competitionColors: Record<HashtagRecommendation['competitionLevel'], string> = {
    low: "text-success-600 dark:text-success-400",
    medium: "text-warning-600 dark:text-warning-400",
    high: "text-danger-600 dark:text-danger-400",
  };

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Hash className="h-5 w-5 text-primary-500" />
              Hashtag Recommender
            </CardTitle>
            <CardDescription>
              Find the best hashtags for maximum reach
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {selectedHashtags.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyAll}
              >
                {copied ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                {copied ? "Copied!" : "Copy All"}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Search and Filter */}
        <div className="space-y-3">
          <Input
            placeholder="Search hashtags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
          
          <div className="flex flex-wrap gap-2">
            <FilterChip
              label="All"
              active={activeCategory === 'all'}
              onClick={() => setActiveCategory('all')}
              count={recommendations.length}
            />
            {(['niche', 'popular', 'trending', 'branded'] as const).map((category) => (
              <FilterChip
                key={category}
                label={categoryLabels[category]}
                active={activeCategory === category}
                onClick={() => setActiveCategory(category)}
                count={recommendations.filter(t => t.category === category).length}
                colorClass={categoryColors[category]}
              />
            ))}
          </div>
        </div>

        {/* Selected Hashtags */}
        {selectedHashtags.length > 0 && (
          <div className="rounded-lg bg-primary-50 p-4 dark:bg-primary-900/10">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-primary-900 dark:text-primary-100">
                Selected ({selectedHashtags.length}/30)
              </span>
              <span className="text-xs text-primary-600 dark:text-primary-400">
                {selectedHashtags.length < 20 ? "Add more for better reach" : 
                 selectedHashtags.length > 30 ? "Too many hashtags" : "Optimal count"}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedHashtags.map((hashtag) => (
                <span
                  key={hashtag}
                  className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-sm text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                >
                  #{hashtag}
                  <button
                    onClick={() => toggleHashtag(hashtag)}
                    className="ml-1 rounded-full p-0.5 hover:bg-primary-200 dark:hover:bg-primary-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Hashtag List */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800"
                />
              ))}
            </div>
          ) : filteredHashtags.length === 0 ? (
            <div className="py-8 text-center text-neutral-500 dark:text-neutral-400">
              No hashtags found
            </div>
          ) : (
            filteredHashtags.map((tag) => (
              <HashtagCard
                key={tag.hashtag}
                tag={tag}
                isSelected={selectedHashtags.includes(tag.hashtag)}
                onToggle={() => toggleHashtag(tag.hashtag)}
                categoryColors={categoryColors}
                competitionColors={competitionColors}
                categoryLabels={categoryLabels}
              />
            ))
          )}
        </div>

        {/* Stats Summary */}
        <div className="grid gap-3 rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800/50 sm:grid-cols-3">
          <StatCard
            icon={<Target className="h-4 w-4" />}
            label="Recommended"
            value={recommendations.filter(t => t.recommended).length}
            color="text-success-600 dark:text-success-400"
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Trending"
            value={recommendations.filter(t => t.category === 'trending').length}
            color="text-warning-600 dark:text-warning-400"
          />
          <StatCard
            icon={<Users className="h-4 w-4" />}
            label="Avg Engagement"
            value={`${(recommendations.reduce((sum, t) => sum + t.avgEngagement, 0) / recommendations.length || 0).toFixed(1)}%`}
            color="text-primary-600 dark:text-primary-400"
          />
        </div>

        {/* Generate More Button */}
        {onGenerateMore && (
          <Button
            onClick={onGenerateMore}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate More Hashtags
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function HashtagCard({
  tag,
  isSelected,
  onToggle,
  categoryColors,
  competitionColors,
  categoryLabels,
}: {
  tag: HashtagRecommendation;
  isSelected: boolean;
  onToggle: () => void;
  categoryColors: Record<HashtagRecommendation['category'], string>;
  competitionColors: Record<HashtagRecommendation['competitionLevel'], string>;
  categoryLabels: Record<HashtagRecommendation['category'], string>;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border p-3 transition-all",
        isSelected
          ? "border-primary-300 bg-primary-50 dark:border-primary-700 dark:bg-primary-900/10"
          : "border-neutral-200 hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600"
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-neutral-900 dark:text-white">
            #{tag.hashtag}
          </span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              categoryColors[tag.category]
            )}
          >
            {categoryLabels[tag.category]}
          </span>
          {tag.recommended && (
            <span className="rounded-full bg-success-100 px-2 py-0.5 text-xs font-medium text-success-700 dark:bg-success-900/20 dark:text-success-400">
              Recommended
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
          <span>{formatNumber(tag.postCount)} posts</span>
          <span>{tag.avgEngagement.toFixed(1)}% avg engagement</span>
          <span className={competitionColors[tag.competitionLevel]}>
            {tag.competitionLevel} competition
          </span>
          <span>Relevance: {tag.relevanceScore}/100</span>
        </div>
      </div>
      <Button
        size="sm"
        variant={isSelected ? "primary" : "outline"}
        onClick={onToggle}
        className="ml-2 flex-shrink-0"
      >
        {isSelected ? (
          <>
            <Check className="mr-1 h-3 w-3" />
            Added
          </>
        ) : (
          <>
            <Plus className="mr-1 h-3 w-3" />
            Add
          </>
        )}
      </Button>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  count,
  colorClass,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count: number;
  colorClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? colorClass || "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
      )}
    >
      {label}
      <span className="ml-1 opacity-70">({count})</span>
    </button>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-white dark:bg-neutral-700", color)}>
        {icon}
      </div>
      <div>
        <div className="text-lg font-semibold text-neutral-900 dark:text-white">
          {value}
        </div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400">
          {label}
        </div>
      </div>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + "B";
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}
