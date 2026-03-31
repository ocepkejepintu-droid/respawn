"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Users, Plus, TrendingUp, Activity, Target } from "lucide-react";
import { PageHeader, PageContent } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompetitorList, AddCompetitorModal } from "@/components/competitors";
import type { Competitor } from "@/types/competitor";

// Demo data - in production this would come from your API
const DEMO_COMPETITORS: Competitor[] = [
  {
    id: "comp_1",
    workspaceId: "ws_1",
    username: "fashionforward",
    displayName: "Fashion Forward",
    platform: "INSTAGRAM" as const,
    profileUrl: "https://instagram.com/fashionforward",
    profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    bio: "Daily fashion inspiration ✨ | Style tips & trends",
    followers: 245000,
    following: 850,
    postsCount: 1247,
    niche: "Fashion",
    tags: ["fashion", "style", "lifestyle"],
    monitoringFrequency: "daily",
    isActive: true,
    lastSyncedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date(),
  },
  {
    id: "comp_2",
    workspaceId: "ws_1",
    username: "techtalkdaily",
    displayName: "Tech Talk Daily",
    platform: "INSTAGRAM" as const,
    profileUrl: "https://instagram.com/techtalkdaily",
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
    bio: "Your daily dose of tech 📱 | Reviews & news",
    followers: 189000,
    following: 450,
    postsCount: 892,
    niche: "Technology",
    tags: ["tech", "gadgets", "reviews"],
    monitoringFrequency: "daily",
    isActive: true,
    lastSyncedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date(),
  },
  {
    id: "comp_3",
    workspaceId: "ws_1",
    username: "fitwithsarah",
    displayName: "Sarah | Fitness Coach",
    platform: "INSTAGRAM" as const,
    profileUrl: "https://instagram.com/fitwithsarah",
    profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
    bio: "Certified PT 💪 | Home workouts | Meal plans",
    followers: 423000,
    following: 520,
    postsCount: 2156,
    niche: "Fitness",
    tags: ["fitness", "health", "wellness"],
    monitoringFrequency: "daily",
    isActive: true,
    lastSyncedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date(),
  },
  {
    id: "comp_4",
    workspaceId: "ws_1",
    username: "foodieadventures",
    displayName: "Foodie Adventures",
    platform: "INSTAGRAM" as const,
    profileUrl: "https://instagram.com/foodieadventures",
    profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop",
    bio: "🍕 Food lover | 📍 NYC | Restaurant reviews",
    followers: 156000,
    following: 1200,
    postsCount: 567,
    niche: "Food",
    tags: ["food", "restaurants", "recipes"],
    monitoringFrequency: "weekly",
    isActive: true,
    lastSyncedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date(),
  },
  {
    id: "comp_5",
    workspaceId: "ws_1",
    username: "travelwithalex",
    displayName: "Alex | Travel Blogger",
    platform: "TIKTOK" as const,
    profileUrl: "https://tiktok.com/@travelwithalex",
    profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
    bio: "Exploring the world 🌍 | Travel tips",
    followers: 678000,
    following: 200,
    postsCount: 445,
    niche: "Travel",
    tags: ["travel", "adventure", "photography"],
    monitoringFrequency: "daily",
    isActive: true,
    lastSyncedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date(),
  },
];

// Stats for the dashboard
const DASHBOARD_STATS = {
  totalCompetitors: 5,
  activeMonitors: 5,
  avgEngagementRate: 3.24,
  totalFollowers: 1691000,
  recentlyUpdated: 3,
};

export default function CompetitorsPage() {
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [competitors, setCompetitors] = React.useState<Competitor[]>(DEMO_COMPETITORS);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleAddCompetitor = async (data: {
    username: string;
    platform: "instagram" | "tiktok";
    niche?: string;
    tags?: string[];
    monitoringFrequency: string;
  }) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    const newCompetitor: Competitor = {
      id: `comp_${Date.now()}`,
      workspaceId: "ws_1",
      username: data.username,
      displayName: data.username,
      platform: data.platform.toUpperCase() as 'INSTAGRAM' | 'TIKTOK',
      profileUrl: `https://${data.platform}.com/${data.username}`,
      followers: 0,
      following: 0,
      postsCount: 0,
      niche: data.niche,
      tags: data.tags || [],
      monitoringFrequency: data.monitoringFrequency as any,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setCompetitors([...competitors, newCompetitor]);
    setIsLoading(false);
    setIsAddModalOpen(false);
  };

  const handleRefresh = async (competitorId: string) => {
    // Simulate refresh
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    setCompetitors(
      competitors.map((c) =>
        c.id === competitorId ? { ...c, lastSyncedAt: new Date() } : c
      )
    );
  };

  const handleDelete = async (competitorId: string) => {
    if (confirm("Are you sure you want to stop monitoring this competitor?")) {
      setCompetitors(competitors.filter((c) => c.id !== competitorId));
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <PageContent>
      <PageHeader
        title="Competitor Analysis"
        description="Monitor your competitors, analyze their strategies, and gain actionable insights."
        actions={
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Competitor
          </Button>
        }
      />

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500">Total Competitors</p>
                <p className="mt-2 text-3xl font-bold">{DASHBOARD_STATS.totalCompetitors}</p>
              </div>
              <div className="rounded-full bg-primary-100 p-3 dark:bg-primary-900/20">
                <Users className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500">Active Monitors</p>
                <p className="mt-2 text-3xl font-bold">{DASHBOARD_STATS.activeMonitors}</p>
              </div>
              <div className="rounded-full bg-success-100 p-3 dark:bg-success-900/20">
                <Activity className="h-6 w-6 text-success-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500">Avg. Engagement</p>
                <p className="mt-2 text-3xl font-bold">{DASHBOARD_STATS.avgEngagementRate}%</p>
              </div>
              <div className="rounded-full bg-warning-100 p-3 dark:bg-warning-900/20">
                <TrendingUp className="h-6 w-6 text-warning-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500">Total Reach</p>
                <p className="mt-2 text-3xl font-bold">{formatNumber(DASHBOARD_STATS.totalFollowers)}</p>
              </div>
              <div className="rounded-full bg-secondary-100 p-3 dark:bg-secondary-900/20">
                <Target className="h-6 w-6 text-secondary-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Competitor List */}
      <Card>
        <CardHeader>
          <CardTitle>Monitored Competitors</CardTitle>
        </CardHeader>
        <CardContent>
          <CompetitorList
            competitors={competitors}
            isLoading={isLoading}
            onAddClick={() => setIsAddModalOpen(true)}
            onRefresh={handleRefresh}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      {/* Add Competitor Modal */}
      <AddCompetitorModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSubmit={handleAddCompetitor}
        isLoading={isLoading}
      />
    </PageContent>
  );
}
