import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3,
  Users,
  Target,
  Zap,
  TrendingUp,
  MessageSquare,
  Calendar,
  Shield,
  ArrowRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Features - Real Buzzer",
  description: "Explore all the powerful features Real Buzzer offers to help you grow on social media with data-driven insights.",
};

const features = [
  {
    icon: BarChart3,
    title: "Competitor Intelligence",
    description: "Track your competitors' every move with comprehensive analytics. Understand their content strategy, posting patterns, and engagement metrics to stay ahead of the curve.",
    benefits: [
      "Unlimited competitor tracking",
      "Content performance analysis",
      "Hashtag strategy insights",
      "Audience overlap detection",
    ],
    color: "blue",
  },
  {
    icon: Users,
    title: "Audience Insights",
    description: "Deep dive into your audience demographics, behaviors, and preferences. Know exactly who your followers are and what content resonates with them.",
    benefits: [
      "Demographic breakdowns",
      "Interest analysis",
      "Engagement patterns",
      "Follower growth tracking",
    ],
    color: "green",
  },
  {
    icon: Target,
    title: "Content Optimization",
    description: "Get AI-powered recommendations for maximum reach and engagement. Our algorithms analyze millions of posts to find what works in your niche.",
    benefits: [
      "Optimal posting times",
      "Hashtag recommendations",
      "Content format suggestions",
      "Caption optimization",
    ],
    color: "purple",
  },
  {
    icon: Zap,
    title: "Trend Detection",
    description: "Stay ahead of viral trends with real-time monitoring. Get instant alerts when new trends emerge in your niche so you can capitalize early.",
    benefits: [
      "Real-time trend alerts",
      "Viral content prediction",
      "Niche trend analysis",
      "Historical trend data",
    ],
    color: "orange",
  },
  {
    icon: TrendingUp,
    title: "Performance Analytics",
    description: "Comprehensive dashboards tracking all your key metrics. Visualize your growth with beautiful, actionable reports that matter.",
    benefits: [
      "Custom dashboard creation",
      "Exportable reports",
      "Cross-platform analytics",
      "ROI tracking",
    ],
    color: "pink",
  },
  {
    icon: MessageSquare,
    title: "Sentiment Analysis",
    description: "Understand how your audience feels about your content. Track sentiment trends and respond to feedback effectively.",
    benefits: [
      "Comment sentiment analysis",
      "Brand mention tracking",
      "Crisis detection alerts",
      "Sentiment trend reports",
    ],
    color: "cyan",
  },
  {
    icon: Calendar,
    title: "Content Calendar",
    description: "Plan and schedule your content with an intelligent calendar. Our AI suggests optimal posting times based on your audience activity.",
    benefits: [
      "Visual content planner",
      "Best time suggestions",
      "Team collaboration",
      "Auto-scheduling",
    ],
    color: "indigo",
  },
  {
    icon: Shield,
    title: "Brand Safety",
    description: "Monitor mentions and protect your brand reputation. Get instant alerts for potential PR issues before they escalate.",
    benefits: [
      "24/7 mention monitoring",
      "Crisis alert system",
      "Reputation tracking",
      "Competitor mention alerts",
    ],
    color: "red",
  },
];

const colorClasses: Record<string, { light: string; border: string; text: string }> = {
  blue: { light: "bg-blue-50", border: "border-blue-100", text: "text-blue-600" },
  green: { light: "bg-green-50", border: "border-green-100", text: "text-green-600" },
  purple: { light: "bg-purple-50", border: "border-purple-100", text: "text-purple-600" },
  orange: { light: "bg-orange-50", border: "border-orange-100", text: "text-orange-600" },
  pink: { light: "bg-pink-50", border: "border-pink-100", text: "text-pink-600" },
  cyan: { light: "bg-cyan-50", border: "border-cyan-100", text: "text-cyan-600" },
  indigo: { light: "bg-indigo-50", border: "border-indigo-100", text: "text-indigo-600" },
  red: { light: "bg-red-50", border: "border-red-100", text: "text-red-600" },
};

export default function FeaturesPage() {
  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-b from-primary-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-primary-700 text-sm font-medium mb-6 shadow-sm">
              <Zap className="w-4 h-4" />
              Powerful Features
            </span>
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-neutral-900 mb-6">
              Everything you need to{" "}
              <span className="bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                win on social media
              </span>
            </h1>
            <p className="text-lg lg:text-xl text-neutral-600 mb-8">
              Our comprehensive suite of tools gives you the competitive edge 
              you need to grow your audience and maximize engagement.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-primary-600 hover:bg-primary-700">
                <Link href="/signin">Start free trial</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/pricing">View pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {features.map((feature) => {
              const colors = colorClasses[feature.color];
              return (
                <div
                  key={feature.title}
                  className={`flex gap-6 p-8 rounded-2xl bg-white border ${colors.border} hover:shadow-lg transition-all duration-300`}
                >
                  <div className={`flex-shrink-0 w-14 h-14 rounded-xl ${colors.light} flex items-center justify-center`}>
                    <feature.icon className="w-7 h-7 text-neutral-700" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-neutral-600 mb-4 leading-relaxed">
                      {feature.description}
                    </p>
                    <ul className="space-y-2">
                      {feature.benefits.map((benefit) => (
                        <li key={benefit} className="flex items-center gap-2 text-sm text-neutral-600">
                          <Check className={`w-4 h-4 ${colors.text}`} />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-neutral-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to experience these features?
          </h2>
          <p className="text-lg text-neutral-400 mb-8">
            Start your 14-day free trial today. No credit card required.
          </p>
          <Button asChild size="lg" className="bg-white text-neutral-900 hover:bg-neutral-100">
            <Link href="/signin" className="flex items-center gap-2">
              Get started now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
