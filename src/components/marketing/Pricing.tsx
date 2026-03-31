"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Check, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Starter",
    description: "Perfect for individual creators getting started",
    monthlyPrice: 29,
    yearlyPrice: 24,
    popular: false,
    features: [
      { text: "3 competitor tracking", included: true },
      { text: "Daily insights & reports", included: true },
      { text: "Basic analytics dashboard", included: true },
      { text: "Email support", included: true },
      { text: "Hashtag recommendations", included: false },
      { text: "AI content optimization", included: false },
      { text: "Custom reports", included: false },
      { text: "API access", included: false },
    ],
    cta: "Start free trial",
    href: "/signin",
  },
  {
    name: "Professional",
    description: "For growing creators and small agencies",
    monthlyPrice: 79,
    yearlyPrice: 66,
    popular: true,
    features: [
      { text: "10 competitor tracking", included: true },
      { text: "Real-time insights & alerts", included: true },
      { text: "Advanced analytics dashboard", included: true },
      { text: "Priority support", included: true },
      { text: "Hashtag recommendations", included: true },
      { text: "AI content optimization", included: true },
      { text: "Custom reports", included: false },
      { text: "API access", included: false },
    ],
    cta: "Start free trial",
    href: "/signin",
  },
  {
    name: "Agency",
    description: "For agencies managing multiple accounts",
    monthlyPrice: 199,
    yearlyPrice: 166,
    popular: false,
    features: [
      { text: "Unlimited competitor tracking", included: true },
      { text: "Real-time insights & alerts", included: true },
      { text: "White-label analytics", included: true },
      { text: "24/7 dedicated support", included: true },
      { text: "Advanced hashtag tools", included: true },
      { text: "AI content optimization", included: true },
      { text: "Custom reports & exports", included: true },
      { text: "Full API access", included: true },
    ],
    cta: "Contact sales",
    href: "/contact",
  },
];

export function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="py-20 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-700 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Simple Pricing
          </span>
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-neutral-900 mb-6">
            Choose your{" "}
            <span className="bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
              growth plan
            </span>
          </h2>
          <p className="text-lg text-neutral-600">
            Start free for 14 days. No credit card required. 
            Cancel anytime.
          </p>
        </motion.div>

        {/* Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center justify-center gap-4 mb-12"
        >
          <span className={`text-sm font-medium ${!isYearly ? "text-neutral-900" : "text-neutral-500"}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className="relative w-14 h-7 bg-neutral-200 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            aria-label="Toggle yearly billing"
          >
            <motion.div
              animate={{ x: isYearly ? 28 : 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
            />
          </button>
          <span className={`text-sm font-medium ${isYearly ? "text-neutral-900" : "text-neutral-500"}`}>
            Yearly
          </span>
          {isYearly && (
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
              Save 20%
            </span>
          )}
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative rounded-2xl p-8 ${
                plan.popular
                  ? "bg-gradient-to-b from-primary-600 to-primary-700 text-white shadow-xl shadow-primary-600/25 scale-105 z-10"
                  : "bg-white border border-neutral-200 hover:border-neutral-300 hover:shadow-lg transition-all"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className={`text-xl font-bold mb-2 ${plan.popular ? "text-white" : "text-neutral-900"}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm ${plan.popular ? "text-primary-100" : "text-neutral-500"}`}>
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className={`text-4xl font-bold ${plan.popular ? "text-white" : "text-neutral-900"}`}>
                    ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <span className={plan.popular ? "text-primary-200" : "text-neutral-500"}>
                    /month
                  </span>
                </div>
                {isYearly && (
                  <p className={`text-sm mt-1 ${plan.popular ? "text-primary-200" : "text-neutral-500"}`}>
                    Billed annually (${plan.yearlyPrice * 12}/year)
                  </p>
                )}
              </div>

              <Button
                asChild
                className={`w-full mb-8 ${
                  plan.popular
                    ? "bg-white text-primary-600 hover:bg-neutral-100"
                    : "bg-primary-600 text-white hover:bg-primary-700"
                }`}
              >
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>

              <ul className="space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature.text} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className={`w-5 h-5 flex-shrink-0 ${plan.popular ? "text-primary-200" : "text-green-500"}`} />
                    ) : (
                      <X className={`w-5 h-5 flex-shrink-0 ${plan.popular ? "text-primary-400" : "text-neutral-300"}`} />
                    )}
                    <span className={`text-sm ${plan.popular ? "text-primary-100" : feature.included ? "text-neutral-700" : "text-neutral-400"}`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Enterprise CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <p className="text-neutral-600">
            Need a custom solution for your enterprise?{" "}
            <Link href="/contact" className="text-primary-600 font-medium hover:underline">
              Let's talk
            </Link>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
