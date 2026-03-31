"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "What social media platforms does RESPAWN Analytics support?",
    answer:
      "RESPAWN Analytics currently supports Instagram, TikTok, Twitter/X, YouTube, and LinkedIn. We're constantly adding new platforms based on user demand. Our multi-platform dashboard gives you a unified view of all your social media performance.",
  },
  {
    question: "How does the competitor tracking work?",
    answer:
      "Simply add your competitors' public profiles to your dashboard. Our AI analyzes their content strategy, posting frequency, engagement rates, hashtag usage, and audience growth. You'll receive daily briefings with actionable insights and trend alerts.",
  },
  {
    question: "Can I try RESPAWN Analytics before committing to a paid plan?",
    answer:
      "Absolutely! We offer a 14-day free trial with full access to all Professional plan features. No credit card required. You can upgrade, downgrade, or cancel at any time.",
  },
  {
    question: "How accurate are the AI-powered insights?",
    answer:
      "Our AI models are trained on millions of social media posts and are constantly learning. Our insights have a 94% accuracy rate according to user feedback. We combine AI analysis with human-verified data patterns to ensure reliability.",
  },
  {
    question: "Is my data secure with RESPAWN Analytics?",
    answer:
      "Security is our top priority. We use bank-level encryption (AES-256) for all data, are GDPR compliant, and never share your data with third parties. We're SOC 2 Type II certified and undergo regular security audits.",
  },
  {
    question: "Can I export reports for my clients or team?",
    answer:
      "Yes! Professional and Agency plans include custom report generation with your branding. Export as PDF, PowerPoint, or CSV. Agency plans also include white-label options for client presentations.",
  },
  {
    question: "What happens if I exceed my competitor tracking limit?",
    answer:
      "We'll notify you when you're approaching your limit. You can easily upgrade your plan at any time, or archive older competitors to make room for new ones. Your historical data is always preserved.",
  },
  {
    question: "Do you offer refunds if I'm not satisfied?",
    answer:
      "Yes, we offer a 30-day money-back guarantee for all paid plans. If RESPAWN Analytics doesn't meet your expectations, contact our support team for a full refund, no questions asked.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-20 lg:py-32 bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-neutral-700 text-sm font-medium mb-4 shadow-sm border border-neutral-200">
            <HelpCircle className="w-4 h-4" />
            Got Questions?
          </span>
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-neutral-900 mb-6">
            Frequently asked{" "}
            <span className="bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
              questions
            </span>
          </h2>
          <p className="text-lg text-neutral-600">
          Everything you need to know about RESPAWN Analytics. Can't find the answer
            you're looking for? Feel free to contact our support team.
          </p>
        </motion.div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-white rounded-xl border border-neutral-200 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-neutral-50 transition-colors"
              >
                <span className="font-semibold text-neutral-900 pr-4">
                  {faq.question}
                </span>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0"
                >
                  <ChevronDown className="w-5 h-5 text-neutral-500" />
                </motion.div>
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-6 pb-5 text-neutral-600 leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 text-center p-8 bg-white rounded-2xl border border-neutral-200"
        >
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">
            Still have questions?
          </h3>
          <p className="text-neutral-600 mb-6">
            Our friendly team is here to help. Get in touch and we'll respond as soon as possible.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors"
          >
            Contact support
          </a>
        </motion.div>
      </div>
    </section>
  );
}
