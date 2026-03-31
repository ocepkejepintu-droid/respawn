"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Sarah Chen",
    role: "Content Creator",
    company: "@sarahcreates",
    avatar: "SC",
    content:
    "RESPAWN Analytics completely transformed how I approach content. The competitor insights helped me identify gaps in my strategy that I never knew existed. My engagement rate increased by 340% in just 3 months!",
    rating: 5,
    metric: "340%",
    metricLabel: "engagement increase",
  },
  {
    id: 2,
    name: "Marcus Johnson",
    role: "Social Media Manager",
    company: "Bloom Agency",
    avatar: "MJ",
    content:
    "Managing 15+ client accounts used to be overwhelming. RESPAWN Analytics' automated briefings save me hours every day. I can now focus on strategy instead of manually tracking competitors.",
    rating: 5,
    metric: "10hrs",
    metricLabel: "saved weekly",
  },
  {
    id: 3,
    name: "Elena Rodriguez",
    role: "Influencer",
    company: "@elena.lifestyle",
    avatar: "ER",
    content:
      "The trend detection feature is a game-changer. I've jumped on viral trends hours before my competitors, leading to my highest-performing posts ever. Worth every penny.",
    rating: 5,
    metric: "2.5M",
    metricLabel: "viral post views",
  },
  {
    id: 4,
    name: "David Kim",
    role: "Founder",
    company: "GrowthLabs",
    avatar: "DK",
    content:
    "We tried 5 different analytics tools before finding RESPAWN Analytics. The depth of insights combined with the intuitive interface is unmatched. Our agency's client retention improved significantly.",
    rating: 5,
    metric: "95%",
    metricLabel: "client retention",
  },
  {
    id: 5,
    name: "Priya Patel",
    role: "Marketing Director",
    company: "TechStart Inc",
    avatar: "PP",
    content:
      "The AI-powered content recommendations are incredibly accurate. It's like having a data scientist and creative strategist in one platform. Our ROI on social media has never been higher.",
    rating: 5,
    metric: "4.2x",
    metricLabel: "ROI improvement",
  },
  {
    id: 6,
    name: "James Wilson",
    role: "Creator Economy",
    company: "Creator Fund",
    avatar: "JW",
    content:
    "I recommend RESPAWN Analytics to all the creators in our portfolio. The competitive intelligence helps them understand their market position and make data-driven decisions about content.",
    rating: 5,
    metric: "500+",
    metricLabel: "creators supported",
  },
];

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prevIndex) => {
      let nextIndex = prevIndex + newDirection;
      if (nextIndex < 0) nextIndex = testimonials.length - 1;
      if (nextIndex >= testimonials.length) nextIndex = 0;
      return nextIndex;
    });
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="py-20 lg:py-32 bg-gradient-to-b from-neutral-50 to-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-neutral-700 text-sm font-medium mb-4 shadow-sm border border-neutral-200">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            Loved by creators
          </span>
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-neutral-900 mb-6">
            Don't just take our word for it
          </h2>
          <p className="text-lg text-neutral-600">
            Join thousands of creators and agencies who have transformed their 
              social media strategy with RESPAWN Analytics.
          </p>
        </motion.div>

        {/* Testimonial Carousel */}
        <div className="relative max-w-4xl mx-auto">
          <div className="relative h-[400px] lg:h-[350px]">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className="absolute inset-0"
              >
                <div className="bg-white rounded-2xl shadow-xl shadow-neutral-200/50 border border-neutral-100 p-8 lg:p-12 h-full">
                  <div className="flex flex-col lg:flex-row gap-8 h-full">
                    {/* Left - Content */}
                    <div className="flex-1 flex flex-col">
                      <Quote className="w-10 h-10 text-primary-200 mb-4" />
                      <p className="text-lg lg:text-xl text-neutral-700 leading-relaxed flex-1">
                        "{currentTestimonial.content}"
                      </p>
                      <div className="mt-6">
                        <div className="flex items-center gap-1 mb-2">
                          {[...Array(currentTestimonial.rating)].map((_, i) => (
                            <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                          ))}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
                            {currentTestimonial.avatar}
                          </div>
                          <div>
                            <div className="font-semibold text-neutral-900">
                              {currentTestimonial.name}
                            </div>
                            <div className="text-sm text-neutral-500">
                              {currentTestimonial.role} at {currentTestimonial.company}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right - Metric */}
                    <div className="lg:w-48 flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6">
                      <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                        {currentTestimonial.metric}
                      </div>
                      <div className="text-sm text-neutral-600 mt-2 text-center">
                        {currentTestimonial.metricLabel}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => paginate(-1)}
              className="p-3 rounded-full bg-white border border-neutral-200 hover:border-neutral-300 hover:shadow-md transition-all"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-5 h-5 text-neutral-600" />
            </button>

            {/* Dots */}
            <div className="flex items-center gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setDirection(index > currentIndex ? 1 : -1);
                    setCurrentIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? "w-6 bg-primary-600"
                      : "bg-neutral-300 hover:bg-neutral-400"
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={() => paginate(1)}
              className="p-3 rounded-full bg-white border border-neutral-200 hover:border-neutral-300 hover:shadow-md transition-all"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-5 h-5 text-neutral-600" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
