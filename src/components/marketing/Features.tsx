"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  Users,
  Target,
  Zap,
  TrendingUp,
  MessageSquare,
  Calendar,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Competitor Intelligence",
    description:
      "Track your competitors' every move. Analyze their content strategy, posting patterns, and engagement metrics to stay ahead.",
    color: "blue",
  },
  {
    icon: Users,
    title: "Audience Insights",
    description:
      "Deep dive into your audience demographics, behaviors, and preferences. Understand what makes them engage and convert.",
    color: "green",
  },
  {
    icon: Target,
    title: "Content Optimization",
    description:
      "Get AI-powered recommendations for the best posting times, hashtags, and content formats for maximum reach.",
    color: "purple",
  },
  {
    icon: Zap,
    title: "Trend Detection",
    description:
      "Stay ahead of viral trends with real-time monitoring. Get alerts when new trends emerge in your niche.",
    color: "orange",
  },
  {
    icon: TrendingUp,
    title: "Performance Analytics",
    description:
      "Comprehensive dashboards tracking all your key metrics. Visualize your growth with beautiful, actionable reports.",
    color: "pink",
  },
  {
    icon: MessageSquare,
    title: "Sentiment Analysis",
    description:
      "Understand how your audience feels about your content. Track sentiment trends and respond to feedback effectively.",
    color: "cyan",
  },
  {
    icon: Calendar,
    title: "Content Calendar",
    description:
      "Plan and schedule your content with an intelligent calendar that suggests optimal posting times.",
    color: "indigo",
  },
  {
    icon: Shield,
    title: "Brand Safety",
    description:
      "Monitor mentions and protect your brand reputation. Get instant alerts for potential PR issues.",
    color: "red",
  },
];

const colorClasses: Record<string, { bg: string; icon: string; border: string }> = {
  blue: { bg: "bg-blue-50", icon: "text-blue-600", border: "border-blue-100" },
  green: { bg: "bg-green-50", icon: "text-green-600", border: "border-green-100" },
  purple: { bg: "bg-purple-50", icon: "text-purple-600", border: "border-purple-100" },
  orange: { bg: "bg-orange-50", icon: "text-orange-600", border: "border-orange-100" },
  pink: { bg: "bg-pink-50", icon: "text-pink-600", border: "border-pink-100" },
  cyan: { bg: "bg-cyan-50", icon: "text-cyan-600", border: "border-cyan-100" },
  indigo: { bg: "bg-indigo-50", icon: "text-indigo-600", border: "border-indigo-100" },
  red: { bg: "bg-red-50", icon: "text-red-600", border: "border-red-100" },
};

export function Features() {
  return (
    <section id="features" className="py-20 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16 lg:mb-20"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-700 text-sm font-medium mb-4">
            <Zap className="w-4 h-4" />
            Powerful Features
          </span>
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-neutral-900 mb-6">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
              dominate social media
            </span>
          </h2>
          <p className="text-lg text-neutral-600">
            Our comprehensive suite of tools gives you the competitive edge you need 
            to grow your audience and maximize engagement.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature, index) => {
            const colors = colorClasses[feature.color];
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`group p-6 lg:p-8 rounded-2xl bg-white border ${colors.border} hover:border-primary-200 hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300`}
              >
                <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-6 h-6 ${colors.icon}`} />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-3 group-hover:text-primary-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
