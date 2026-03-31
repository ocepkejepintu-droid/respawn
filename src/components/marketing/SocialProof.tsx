"use client";

import { motion } from "framer-motion";
import { useRef } from "react";

const companies = [
  { name: "Spotify", logo: "S" },
  { name: "Airbnb", logo: "A" },
  { name: "Stripe", logo: "St" },
  { name: "Notion", logo: "N" },
  { name: "Figma", logo: "F" },
  { name: "Slack", logo: "Sl" },
  { name: "Vercel", logo: "V" },
  { name: "Linear", logo: "L" },
];

const stats = [
  { value: "2,000+", label: "Active creators" },
  { value: "50M+", label: "Posts analyzed" },
  { value: "340%", label: "Avg. growth increase" },
  { value: "4.9/5", label: "User rating" },
];

export function SocialProof() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <section className="py-16 lg:py-24 bg-neutral-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-2">
            Trusted by industry leaders
          </p>
          <h2 className="text-2xl lg:text-3xl font-bold text-neutral-900">
            Powering growth for creators and agencies worldwide
          </h2>
        </motion.div>

        {/* Logo Ticker */}
        <div className="relative mb-16">
          {/* Gradient Masks */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-neutral-50 to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-neutral-50 to-transparent z-10" />
          
          {/* Ticker */}
          <div ref={containerRef} className="flex overflow-hidden">
            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
              className="flex gap-12 items-center"
            >
              {[...companies, ...companies].map((company, i) => (
                <div
                  key={`${company.name}-${i}`}
                  className="flex items-center gap-3 px-6 py-3 bg-white rounded-xl shadow-sm border border-neutral-100 hover:shadow-md transition-shadow flex-shrink-0"
                >
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-lg font-bold text-neutral-600">
                    {company.logo}
                  </div>
                  <span className="text-lg font-semibold text-neutral-700 whitespace-nowrap">
                    {company.name}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center p-6 bg-white rounded-2xl shadow-sm border border-neutral-100"
            >
              <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="mt-2 text-sm text-neutral-600">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
