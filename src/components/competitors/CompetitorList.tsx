"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  RefreshCw,
  Trash2,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Users,
  Heart,
  Camera,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import type { Competitor } from "@/types/competitor";

interface CompetitorListProps {
  competitors: Competitor[];
  isLoading?: boolean;
  onAddClick: () => void;
  onRefresh?: (competitorId: string) => void;
  onDelete?: (competitorId: string) => void;
}

export function CompetitorList({
  competitors,
  isLoading = false,
  onAddClick,
  onRefresh,
  onDelete,
}: CompetitorListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterPlatform, setFilterPlatform] = React.useState<string>("all");

  const filteredCompetitors = React.useMemo(() => {
    return competitors.filter((competitor) => {
      const matchesSearch =
        searchQuery === "" ||
        competitor.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        competitor.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        competitor.niche?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPlatform =
        filterPlatform === "all" || competitor.platform === filterPlatform;

      return matchesSearch && matchesPlatform;
    });
  }, [competitors, searchQuery, filterPlatform]);

  if (isLoading) {
    return <CompetitorListSkeleton />;
  }

  if (competitors.length === 0) {
    return (
      <EmptyState
        title="No competitors tracked yet"
        description="Add your first competitor to start monitoring their performance and gain insights."
        icon={Users}
        action={{
          label: "Add Competitor",
          onClick: onAddClick,
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Search competitors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="h-10 rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          >
            <option value="all">All Platforms</option>
            <option value="Camera">Camera</option>
            <option value="tiktok">TikTok</option>
          </select>
        </div>
        <Button onClick={onAddClick}>
          <Plus className="mr-2 h-4 w-4" />
          Add Competitor
        </Button>
      </div>

      {/* Results count */}
      <p className="text-sm text-neutral-500">
        Showing {filteredCompetitors.length} of {competitors.length} competitors
      </p>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCompetitors.map((competitor) => (
          <CompetitorCard
            key={competitor.id}
            competitor={competitor}
            onClick={() => router.push(`/competitors/${competitor.id}`)}
            onRefresh={() => onRefresh?.(competitor.id)}
            onDelete={() => onDelete?.(competitor.id)}
          />
        ))}
      </div>

      {filteredCompetitors.length === 0 && competitors.length > 0 && (
        <EmptyState
          title="No matches found"
          description="Try adjusting your search or filters."
          icon={Search}
        />
      )}
    </div>
  );
}

interface CompetitorCardProps {
  competitor: Competitor;
  onClick: () => void;
  onRefresh: () => void;
  onDelete: () => void;
}

function CompetitorCard({ competitor, onClick, onRefresh, onDelete }: CompetitorCardProps) {
  const [showActions, setShowActions] = React.useState(false);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Camera':
        return <Camera className="h-4 w-4" />;
      case 'tiktok':
        return <Play className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getFrequencyLabel = (freq: string) => {
    const labels: Record<string, string> = {
      hourly: 'Every hour',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
    };
    return labels[freq] || freq;
  };

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all hover:shadow-md",
        !competitor.isActive && "opacity-60"
      )}
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative">
            <img
              src={competitor.profileImage || '/placeholder-avatar.png'}
              alt={competitor.username}
              className="h-12 w-12 rounded-full object-cover"
            />
            <div className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5 dark:bg-neutral-800">
              {getPlatformIcon(competitor.platform)}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-neutral-900 truncate dark:text-white">
                {competitor.displayName}
              </h3>
              {competitor.niche && (
                <Badge variant="secondary" className="text-xs">
                  {competitor.niche}
                </Badge>
              )}
            </div>
            <p className="text-sm text-neutral-500 truncate">@{competitor.username}</p>

            {/* Stats */}
            <div className="mt-3 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-neutral-400" />
                <span className="font-medium">{formatNumber(competitor.followers)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4 text-neutral-400" />
                <span className="font-medium">{formatNumber(competitor.postsCount)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div
            className={cn(
              "flex flex-col gap-1 transition-opacity",
              showActions ? "opacity-100" : "opacity-0"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onRefresh}
              className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
              title="Refresh data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              className="rounded p-1 text-neutral-400 hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-900/20"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {getFrequencyLabel(competitor.monitoringFrequency)}
            </Badge>
            {competitor.lastSyncedAt && (
              <span className="text-xs text-neutral-400">
                Synced {new Date(competitor.lastSyncedAt).toLocaleDateString()}
              </span>
            )}
          </div>
          {!competitor.isActive && (
            <Badge variant="secondary" className="text-xs">
              Paused
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CompetitorListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32 ml-auto" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                  <div className="flex gap-4 pt-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
