import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Calendar, User, Share2, Link as LinkIcon, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

const blogPosts: Record<string, {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  authorInitials: string;
  date: string;
  readTime: string;
}> = {
  "how-to-analyze-competitors-social-media": {
    title: "How to Analyze Competitors' Social Media Strategy",
    excerpt: "Learn the exact framework top creators use to dissect competitor strategies and find opportunities to outperform them.",
    category: "Strategy",
    author: "Sarah Chen",
    authorInitials: "SC",
    date: "Mar 28, 2026",
    readTime: "8 min read",
    content: `
      <p className="text-lg text-neutral-600 leading-relaxed mb-6">
        In the fast-paced world of social media, understanding your competitors isn't just helpful—it's essential. 
        But most creators approach competitive analysis all wrong. They scroll through feeds, save a few posts, 
        and call it research. That's not analysis; that's browsing.
      </p>

      <h2 className="text-2xl font-bold text-neutral-900 mt-10 mb-4">The Framework That Actually Works</h2>
      
      <p className="text-neutral-600 leading-relaxed mb-6">
        After analyzing over 10,000 social media accounts across every major platform, we've identified the 
        four pillars of effective competitive analysis:
      </p>

      <h3 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">1. Content Pattern Analysis</h3>
      
      <p className="text-neutral-600 leading-relaxed mb-6">
        Don't just look at what they post—look at <em>when</em>, <em>how often</em>, and <em>in what sequence</em>. 
        Top performers follow patterns. They might alternate between educational content and personal stories, 
        or they might front-load their best content at the beginning of each month.
      </p>

      <p className="text-neutral-600 leading-relaxed mb-6">
        Here's what to track:
      </p>

      <ul className="list-disc list-inside text-neutral-600 leading-relaxed mb-6 space-y-2">
        <li>Posting frequency and consistency</li>
        <li>Content type distribution (educational, entertaining, promotional)</li>
        <li>Format preferences (carousel, video, static image)</li>
        <li>Caption structure and length patterns</li>
      </ul>

      <h3 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">2. Engagement Velocity Tracking</h3>
      
      <p className="text-neutral-600 leading-relaxed mb-6">
        The most important metric nobody talks about: <strong>engagement velocity</strong>. This measures how 
        quickly a post accumulates engagement in its first hour. Posts with high velocity get pushed to more 
        feeds by the algorithm.
      </p>

      <h3 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">3. Audience Overlap Analysis</h3>
      
      <p className="text-neutral-600 leading-relaxed mb-6">
        Who follows both you and your competitors? These people are goldmines of insight. They chose to follow 
        both accounts for a reason. Understanding this overlap helps you identify content gaps and opportunities.
      </p>

      <h3 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">4. Hashtag Strategy Decoding</h3>
      
      <p className="text-neutral-600 leading-relaxed mb-6">
        Your competitors have already done the hashtag research. Analyze which hashtags consistently drive 
        engagement for them, but don't just copy—find the gaps where they're not showing up.
      </p>

      <h2 className="text-2xl font-bold text-neutral-900 mt-10 mb-4">Putting It Into Practice</h2>

      <p className="text-neutral-600 leading-relaxed mb-6">
        Start with your top 3 competitors. Spend 30 minutes analyzing each account using the framework above. 
        Document your findings. Look for patterns. Then ask yourself: what are they missing that I can provide?
      </p>

      <p className="text-neutral-600 leading-relaxed mb-6">
        Remember: the goal isn't to copy your competitors. It's to understand the landscape so you can 
        differentiate yourself more effectively.
      </p>

      <div className="bg-primary-50 rounded-xl p-6 my-8">
        <p className="text-neutral-700 font-medium mb-2">Pro Tip</p>
        <p className="text-neutral-600 text-sm">
          Use Real Buzzer's competitor tracking to automate this analysis. Get daily briefings on competitor 
          activity, engagement trends, and content opportunities delivered straight to your inbox.
        </p>
      </div>
    `,
  },
  "viral-content-patterns-2026": {
    title: "The 5 Content Patterns Going Viral in 2026",
    excerpt: "We analyzed 10 million posts to identify the exact content formats and hooks driving the highest engagement this year.",
    category: "Trends",
    author: "Marcus Johnson",
    authorInitials: "MJ",
    date: "Mar 25, 2026",
    readTime: "6 min read",
    content: `
      <p className="text-lg text-neutral-600 leading-relaxed mb-6">
        What makes content go viral in 2026? We analyzed 10 million posts across Instagram, TikTok, and X 
        to find the answer. The results might surprise you.
      </p>

      <h2 className="text-2xl font-bold text-neutral-900 mt-10 mb-4">Pattern #1: The Contrarian Hook</h2>
      
      <p className="text-neutral-600 leading-relaxed mb-6">
        Content that challenges commonly accepted wisdom is performing 340% better than average. But there's 
        a catch—it has to be backed by data or personal experience.
      </p>

      <p className="text-neutral-600 leading-relaxed mb-6">
        Example: "Everything you know about Instagram hashtags is wrong. Here's what actually works in 2026..."
      </p>

      <h2 className="text-2xl font-bold text-neutral-900 mt-10 mb-4">Pattern #2: The Process Reveal</h2>
      
      <p className="text-neutral-600 leading-relaxed mb-6">
        Audiences are tired of seeing polished final products. They want to see the messy middle. Content 
        showing behind-the-scenes processes gets 2.3x more saves and shares.
      </p>
    `,
  },
};

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts[slug];
  
  if (!post) {
    return {
      title: "Post Not Found - Real Buzzer Blog",
    };
  }

  return {
    title: `${post.title} - Real Buzzer Blog`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = blogPosts[slug];

  if (!post) {
    notFound();
  }

  return (
    <div className="pt-20">
      {/* Article Header */}
      <section className="py-12 lg:py-16 bg-gradient-to-b from-primary-50 to-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            href="/blog" 
            className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to blog
          </Link>

          <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full mb-4">
            {post.category}
          </span>

          <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-neutral-900 mb-6">
            {post.title}
          </h1>

          <p className="text-lg lg:text-xl text-neutral-600 mb-8">
            {post.excerpt}
          </p>

          {/* Author & Meta */}
          <div className="flex items-center gap-4 py-6 border-y border-neutral-200">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
              {post.authorInitials}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-neutral-900">{post.author}</div>
              <div className="flex items-center gap-4 text-sm text-neutral-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {post.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {post.readTime}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg hover:bg-neutral-100 transition-colors" aria-label="Share on Twitter">
                <Globe className="w-5 h-5 text-neutral-600" />
              </button>
              <button className="p-2 rounded-lg hover:bg-neutral-100 transition-colors" aria-label="Share on LinkedIn">
                <LinkIcon className="w-5 h-5 text-neutral-600" />
              </button>
              <button className="p-2 rounded-lg hover:bg-neutral-100 transition-colors" aria-label="Share on Facebook">
                <Globe className="w-5 h-5 text-neutral-600" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <article 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-10 pt-10 border-t border-neutral-200">
            {["Social Media", "Strategy", "Growth", "Analytics"].map((tag) => (
              <span 
                key={tag} 
                className="px-3 py-1 bg-neutral-100 text-neutral-600 text-sm rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Author Bio */}
      <section className="py-12 bg-neutral-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-6 p-6 bg-white rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-xl text-white font-semibold flex-shrink-0">
              {post.authorInitials}
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900 mb-2">
                Written by {post.author}
              </h3>
              <p className="text-neutral-600 text-sm mb-4">
                Social media strategist and data analyst with 8+ years of experience helping creators 
                and brands grow their online presence through data-driven strategies.
              </p>
              <Button variant="outline" size="sm">
                Follow
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Related Posts CTA */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">
            Enjoyed this article?
          </h2>
          <p className="text-neutral-600 mb-8">
            Get more insights like this delivered to your inbox weekly.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Button className="bg-primary-600 hover:bg-primary-700 px-6">
              Subscribe
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
