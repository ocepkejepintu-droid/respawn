import Link from "next/link";
import {
  BarChart3,
  Bell,
  Briefcase,
  Compass,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { PageContent, PageHeader } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const quickLinks = [
  {
    title: "Morning Briefing",
    description: "Start with daily trends, alerts, and competitor movement.",
    href: "/briefing",
    icon: Bell,
  },
  {
    title: "Competitors",
    description: "Track who is posting, growing, and outperforming in your niche.",
    href: "/competitors",
    icon: Users,
  },
  {
    title: "Audience Insights",
    description: "Review sentiment, demographics, and what your audience responds to.",
    href: "/audience",
    icon: BarChart3,
  },
  {
    title: "Optimize Content",
    description: "Get ideas, timing guidance, and recommendations for better reach.",
    href: "/optimize",
    icon: Sparkles,
  },
];

const highlights = [
  {
    label: "Tracked competitors",
    value: "5",
    icon: Users,
  },
  {
    label: "New trend alerts",
    value: "3",
    icon: TrendingUp,
  },
  {
    label: "Active workspace",
    value: "1",
    icon: Briefcase,
  },
];

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Your main workspace for monitoring competitors, audience insights, and content performance."
        actions={
          <Button asChild>
            <Link href="/briefing">Open Morning Briefing</Link>
          </Button>
        }
      />

      <PageContent>
        <div className="grid gap-4 md:grid-cols-3">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label}>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">{item.label}</p>
                    <p className="text-2xl font-semibold text-neutral-900">{item.value}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-primary-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="rounded-xl border border-neutral-200 p-5 transition-colors hover:border-primary-300 hover:bg-primary-50/40"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="font-semibold text-neutral-900">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">{item.description}</p>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </PageContent>
    </>
  );
}
