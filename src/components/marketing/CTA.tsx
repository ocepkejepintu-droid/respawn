"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="py-20 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-8 lg:p-16 text-center"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                backgroundSize: '40px 40px',
              }}
            />
          </div>

          {/* Floating Elements */}
          <motion.div
            animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-2xl backdrop-blur-sm hidden lg:block"
          />
          <motion.div
            animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute bottom-10 right-10 w-24 h-24 bg-white/10 rounded-full backdrop-blur-sm hidden lg:block"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute top-1/2 right-20 w-4 h-4 bg-yellow-400 rounded-full hidden lg:block"
          />

          {/* Content */}
          <div className="relative z-10 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium mb-6 backdrop-blur-sm border border-white/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start your free 14-day trial today</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-3xl lg:text-5xl xl:text-6xl font-bold text-white mb-6"
            >
              Ready to replace guesswork with data?
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-lg lg:text-xl text-primary-100 mb-10 max-w-2xl mx-auto"
            >
            Join 2,000+ creators and agencies using RESPAWN Analytics to grow faster,
              work smarter, and stay ahead of the competition.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button
                asChild
                size="lg"
                className="bg-white text-primary-700 hover:bg-neutral-100 text-base px-8 py-6 shadow-xl shadow-black/10 group"
              >
                <Link href="/signin" className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Get started free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-2 border-white/30 text-white hover:bg-white/10 text-base px-8 py-6"
              >
                <Link href="/contact">Talk to sales</Link>
              </Button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-6 text-sm text-primary-200"
            >
              No credit card required • 14-day free trial • Cancel anytime
            </motion.p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
