"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Play, Sparkles, TrendingUp, Users, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 lg:pt-0 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-primary-50/50" />
      
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute -top-1/2 -right-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-primary-200/30 to-primary-400/10 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, -45, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute -bottom-1/2 -left-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-primary-300/20 to-purple-300/10 blur-3xl"
        />
      </div>

      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Now with AI-powered insights</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-neutral-900 leading-[1.1] tracking-tight"
            >
              Replace Fake Engagement with{" "}
              <span className="bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                Real Intelligence
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={fadeInUp}
              className="mt-6 text-lg sm:text-xl text-neutral-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
            >
              The smarter way to grow on social media. Get daily insights on competitors, 
              trends, and what actually works in your niche.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={fadeInUp}
              className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button
                asChild
                size="lg"
                className="bg-primary-600 hover:bg-primary-700 text-white text-base px-8 py-6 shadow-xl shadow-primary-600/25 hover:shadow-primary-600/40 transition-all group"
              >
                <Link href="/signin" className="flex items-center gap-2">
                  Get started free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="text-base px-8 py-6 border-2 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-all group"
              >
                <Link href="#demo" className="flex items-center gap-2">
                  <Play className="w-5 h-5 text-primary-600" />
                  Watch demo
                </Link>
              </Button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              variants={fadeInUp}
              className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-neutral-500"
            >
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 border-2 border-white flex items-center justify-center text-xs text-white font-medium"
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <span className="font-medium text-neutral-700">2,000+</span>
                <span>creators trust us</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="font-medium text-neutral-700">4.9/5</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Product Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            {/* Main Dashboard Preview */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary-900/20 border border-neutral-200/50 bg-white">
              {/* Header */}
              <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 text-center text-xs text-neutral-400 font-medium">
                    RESPAWN Analytics Dashboard
                </div>
              </div>
              
              {/* Dashboard Content */}
              <div className="p-6 space-y-4">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Engagement", value: "+24.5%", icon: TrendingUp, color: "green" },
                    { label: "Followers", value: "12.4K", icon: Users, color: "blue" },
                    { label: "Reach", value: "89.2K", icon: Target, color: "purple" },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-neutral-50 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <stat.icon className={`w-4 h-4 text-${stat.color}-500`} />
                        <span className="text-xs text-neutral-500">{stat.label}</span>
                      </div>
                      <div className="text-lg font-bold text-neutral-900">{stat.value}</div>
                    </div>
                  ))}
                </div>

                {/* Chart Placeholder */}
                <div className="bg-neutral-50 rounded-xl p-4 h-32 flex items-end justify-between gap-2">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95].map((height, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ duration: 0.5, delay: 0.5 + i * 0.05 }}
                      className="flex-1 bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-sm opacity-80 hover:opacity-100 transition-opacity"
                    />
                  ))}
                </div>

                {/* Competitor Cards */}
                <div className="space-y-2">
                  {["Competitor A", "Competitor B", "Competitor C"].map((name, i) => (
                    <div key={name} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-neutral-200" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-neutral-900">{name}</div>
                        <div className="text-xs text-neutral-500">Posted 2 hours ago</div>
                      </div>
                      <div className="text-sm font-medium text-green-600">+{12 + i * 8}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating Cards */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 -left-4 bg-white rounded-xl shadow-xl p-4 border border-neutral-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-xs text-neutral-500">Growth Rate</div>
                  <div className="text-lg font-bold text-neutral-900">+47%</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-xl p-4 border border-neutral-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <div className="text-xs text-neutral-500">AI Insights</div>
                  <div className="text-sm font-medium text-neutral-900">3 new trends</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
