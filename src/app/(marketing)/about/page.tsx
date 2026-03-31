import type { Metadata } from "next";
import Link from "next/link";
import { TeamMember } from "@/components/marketing/TeamMember";
import { Button } from "@/components/ui/button";
import { ArrowRight, Target, Heart, Zap, Globe, Users, Award } from "lucide-react";

export const metadata: Metadata = {
  title: "About - Real Buzzer",
  description: "Learn about Real Buzzer's mission to help creators and agencies grow with data-driven social media intelligence.",
};

const teamMembers = [
  {
    name: "Alex Rivera",
    role: "CEO & Co-Founder",
    bio: "Former product lead at Meta. Obsessed with helping creators turn data into growth.",
    initials: "AR",
    color: "blue",
  },
  {
    name: "Jamie Chen",
    role: "CTO & Co-Founder",
    bio: "Ex-Google engineer. Built the first version of Real Buzzer in a weekend hackathon.",
    initials: "JC",
    color: "purple",
  },
  {
    name: "Morgan Taylor",
    role: "Head of Design",
    bio: "Previously at Figma. Believes analytics should be beautiful and accessible to everyone.",
    initials: "MT",
    color: "pink",
  },
];

const values = [
  {
    icon: Target,
    title: "Data-Driven",
    description: "Every decision we make is backed by data. We believe in measuring what matters.",
  },
  {
    icon: Heart,
    title: "Creator-First",
    description: "We build for creators, not advertisers. Your growth is our only metric of success.",
  },
  {
    icon: Zap,
    title: "Move Fast",
    description: "Social media moves fast. So do we. We're constantly shipping improvements.",
  },
  {
    icon: Globe,
    title: "Global Impact",
    description: "We're helping creators from 120+ countries grow their audiences and businesses.",
  },
];

const stats = [
  { value: "2021", label: "Founded" },
  { value: "2,000+", label: "Active Users" },
  { value: "50M+", label: "Posts Analyzed" },
  { value: "120+", label: "Countries" },
];

export default function AboutPage() {
  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="py-20 lg:py-32 bg-gradient-to-b from-primary-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-primary-700 text-sm font-medium mb-6 shadow-sm">
              <Users className="w-4 h-4" />
              Our Story
            </span>
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-neutral-900 mb-6">
              We're on a mission to democratize{" "}
              <span className="bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                social intelligence
              </span>
            </h1>
            <p className="text-lg lg:text-xl text-neutral-600">
              Real Buzzer was born from a simple observation: the tools that big brands 
              use to dominate social media were completely inaccessible to individual creators.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <p className="text-xl text-neutral-600 leading-relaxed">
              In 2021, our founders were working at some of the biggest tech companies in the world, 
              helping brands spend millions on social media advertising. They had access to incredible 
              tools—sophisticated analytics, competitor tracking, audience insights. But they noticed 
              something troubling.
            </p>

            <p className="text-neutral-600 leading-relaxed mt-6">
              Individual creators—the people actually making the content that drives engagement—had 
              nothing comparable. They were flying blind, guessing at what might work, while big brands 
              used data to systematically dominate every niche.
            </p>

            <p className="text-neutral-600 leading-relaxed mt-6">
              Real Buzzer was built to change that. We set out to create the same caliber of intelligence 
              tools that Fortune 500 companies use, but make them accessible and affordable for creators 
              and small agencies.
            </p>

            <blockquote className="border-l-4 border-primary-500 pl-6 my-8">
              <p className="text-xl font-medium text-neutral-900 italic">
                "Every creator deserves access to the same data that big brands use. 
                Knowledge shouldn't be gated by budget."
              </p>
              <cite className="text-neutral-500 not-italic mt-2 block">
                — Alex Rivera, CEO & Co-Founder
              </cite>
            </blockquote>

            <p className="text-neutral-600 leading-relaxed">
              Today, Real Buzzer helps over 2,000 creators and agencies across 120+ countries make 
              smarter decisions about their social media strategy. We've analyzed over 50 million posts 
              and helped our users achieve an average 340% increase in engagement.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-neutral-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-700 text-sm font-medium mb-4">
              <Award className="w-4 h-4" />
              Our Values
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900">
              What we believe
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={value.title} className="text-center p-6">
                <div className="w-14 h-14 rounded-xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-7 h-7 text-primary-600" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">
                  {value.title}
                </h3>
                <p className="text-neutral-600 text-sm">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 lg:py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
              Meet the team
            </h2>
            <p className="text-neutral-600 max-w-2xl mx-auto">
              We're a small but mighty team of creators, engineers, and data nerds 
              passionate about helping you grow.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {teamMembers.map((member, index) => (
              <TeamMember key={member.name} member={member} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
            Want to join our team?
          </h2>
          <p className="text-neutral-600 mb-8">
            We're always looking for talented people who are passionate about helping creators succeed.
          </p>
          <Button asChild className="bg-primary-600 hover:bg-primary-700">
            <Link href="/contact" className="flex items-center gap-2">
              Get in touch
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
