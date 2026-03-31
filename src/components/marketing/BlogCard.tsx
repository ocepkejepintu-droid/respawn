"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, ArrowRight, User } from "lucide-react";

interface BlogCardProps {
  post: {
    slug: string;
    title: string;
    excerpt: string;
    coverImage: string;
    category: string;
    author: string;
    date: string;
    readTime: string;
  };
  index?: number;
}

export function BlogCard({ post, index = 0 }: BlogCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group bg-white rounded-2xl overflow-hidden border border-neutral-200 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-500/10 transition-all duration-300"
    >
      <Link href={`/blog/${post.slug}`} className="block">
        {/* Image */}
        <div className="relative h-48 overflow-hidden bg-neutral-100">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-primary-200 group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl font-bold text-primary-300/50">{post.title.charAt(0)}</span>
          </div>
          {/* Category Badge */}
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium text-neutral-700 rounded-full">
              {post.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-neutral-900 mb-3 group-hover:text-primary-600 transition-colors line-clamp-2">
            {post.title}
          </h3>
          <p className="text-neutral-600 text-sm mb-4 line-clamp-2">
            {post.excerpt}
          </p>

          {/* Meta */}
          <div className="flex items-center justify-between text-sm text-neutral-500">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-4">
              <span>{post.date}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {post.readTime}
              </span>
            </div>
          </div>

          {/* Read More */}
          <div className="mt-4 flex items-center gap-2 text-primary-600 font-medium text-sm group-hover:gap-3 transition-all">
            Read more
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
