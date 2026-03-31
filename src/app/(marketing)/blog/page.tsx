import type { Metadata } from "next";
import Link from "next/link";
import { BlogCard } from "@/components/marketing/BlogCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog - RESPAWN Analytics",
  description: "Insights, strategies, and tips for growing your social media presence with data-driven approaches.",
};

const blogPosts = [
  {
    slug: "how-to-analyze-competitors-social-media",
    title: "How to Analyze Competitors' Social Media Strategy",
    excerpt: "Learn the exact framework top creators use to dissect competitor strategies and find opportunities to outperform them.",
    coverImage: "/blog/competitor-analysis.jpg",
    category: "Strategy",
    author: "Sarah Chen",
    date: "Mar 28, 2026",
    readTime: "8 min read",
  },
  {
    slug: "viral-content-patterns-2026",
    title: "The 5 Content Patterns Going Viral in 2026",
    excerpt: "We analyzed 10 million posts to identify the exact content formats and hooks driving the highest engagement this year.",
    coverImage: "/blog/viral-patterns.jpg",
    category: "Trends",
    author: "Marcus Johnson",
    date: "Mar 25, 2026",
    readTime: "6 min read",
  },
  {
    slug: "instagram-algorithm-secrets",
    title: "Instagram Algorithm Secrets: What Actually Works",
    excerpt: "A data-backed breakdown of how the Instagram algorithm really works and how to optimize your content for maximum reach.",
    coverImage: "/blog/instagram-algorithm.jpg",
    category: "Instagram",
    author: "Elena Rodriguez",
    date: "Mar 22, 2026",
    readTime: "10 min read",
  },
  {
    slug: "building-content-calendar",
    title: "How to Build a Content Calendar That Actually Works",
    excerpt: "Stop winging it. Learn how top creators plan months of content in advance while maintaining authenticity.",
    coverImage: "/blog/content-calendar.jpg",
    category: "Productivity",
    author: "David Kim",
    date: "Mar 18, 2026",
    readTime: "7 min read",
  },
  {
    slug: "tiktok-growth-strategy",
    title: "The Ultimate TikTok Growth Strategy for 2026",
    excerpt: "From zero to 100K followers: A comprehensive playbook based on real case studies and platform data.",
    coverImage: "/blog/tiktok-growth.jpg",
    category: "TikTok",
    author: "Priya Patel",
    date: "Mar 15, 2026",
    readTime: "12 min read",
  },
  {
    slug: "social-media-roi-guide",
    title: "Measuring Social Media ROI: A Complete Guide",
    excerpt: "Stop guessing. Learn how to track, measure, and optimize your social media return on investment.",
    coverImage: "/blog/social-roi.jpg",
    category: "Analytics",
    author: "James Wilson",
    date: "Mar 12, 2026",
    readTime: "9 min read",
  },
];

const categories = ["All", "Strategy", "Trends", "Instagram", "TikTok", "Productivity", "Analytics"];

export default function BlogPage() {
  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="py-20 lg:py-24 bg-gradient-to-b from-primary-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-primary-700 text-sm font-medium mb-6 shadow-sm">
              <BookOpen className="w-4 h-4" />
          RESPAWN Analytics Blog
            </span>
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-neutral-900 mb-6">
              Insights for{" "}
              <span className="bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                smarter growth
              </span>
            </h1>
            <p className="text-lg lg:text-xl text-neutral-600">
              Strategies, trends, and tips from the team behind the world's most 
              advanced social media intelligence platform.
            </p>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-2 mt-10">
            {categories.map((category) => (
              <button
                key={category}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  category === "All"
                    ? "bg-primary-600 text-white"
                    : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post, index) => (
              <BlogCard key={post.slug} post={post} index={index} />
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <Button variant="outline" className="px-8">
              Load more articles
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">
            Get the latest insights delivered to your inbox
          </h2>
          <p className="text-neutral-600 mb-8">
            Join 15,000+ marketers receiving weekly tips on content strategy and growth tactics.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Button className="bg-primary-600 hover:bg-primary-700 px-6">
              Subscribe
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
