"use client";

import { motion } from "framer-motion";
import { Search, LineChart, Rocket } from "lucide-react";

const steps = [
  {
    icon: Search,
    number: "01",
    title: "Connect & Analyze",
    description:
      "Connect your social accounts and add your competitors. Our AI automatically analyzes performance data, content patterns, and audience behaviors across all platforms.",
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    icon: LineChart,
    number: "02",
    title: "Get Insights",
    description:
      "Receive daily briefings with actionable insights. Discover what's working in your niche, emerging trends, and opportunities to outperform your competition.",
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    icon: Rocket,
    number: "03",
    title: "Grow Faster",
    description:
      "Apply data-driven recommendations to optimize your content strategy. Watch your engagement soar as you post what your audience actually wants to see.",
    color: "from-primary-500 to-primary-600",
    bgColor: "bg-primary-50",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 lg:py-32 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16 lg:mb-20"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-neutral-700 text-sm font-medium mb-4 shadow-sm border border-neutral-200">
            Simple Process
          </span>
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-neutral-900 mb-6">
            How it{" "}
            <span className="bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
              works
            </span>
          </h2>
          <p className="text-lg text-neutral-600">
            Get started in minutes and see results within days. Our streamlined 
            process makes social media intelligence accessible to everyone.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line (Desktop) */}
          <div className="hidden lg:block absolute top-24 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-primary-200" />

          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative"
              >
                <div className="bg-white rounded-2xl p-8 lg:p-10 shadow-sm border border-neutral-100 hover:shadow-lg hover:border-neutral-200 transition-all duration-300 h-full">
                  {/* Number Badge */}
                  <div className="absolute -top-4 left-8">
                    <span className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} text-white text-lg font-bold shadow-lg`}>
                      {step.number}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl ${step.bgColor} flex items-center justify-center mb-6 mt-4`}>
                    <step.icon className="w-8 h-8 text-neutral-700" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl lg:text-2xl font-bold text-neutral-900 mb-4">
                    {step.title}
                  </h3>
                  <p className="text-neutral-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-16"
        >
          <p className="text-neutral-600 mb-4">
            Ready to see it in action?
          </p>
          <a
            href="/signin"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-primary-600/25"
          >
            Start your free trial
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
