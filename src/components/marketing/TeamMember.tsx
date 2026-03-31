"use client";

import { motion } from "framer-motion";
import { Link as LinkIcon, Globe } from "lucide-react";

interface TeamMemberProps {
  member: {
    name: string;
    role: string;
    bio: string;
    initials: string;
    color: string;
  };
  index?: number;
}

const colorClasses: Record<string, string> = {
  blue: "from-blue-400 to-blue-600",
  green: "from-green-400 to-green-600",
  purple: "from-purple-400 to-purple-600",
  orange: "from-orange-400 to-orange-600",
  pink: "from-pink-400 to-pink-600",
  indigo: "from-indigo-400 to-indigo-600",
};

export function TeamMember({ member, index = 0 }: TeamMemberProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group text-center"
    >
      {/* Avatar */}
      <div className="relative mb-6 mx-auto w-32 h-32">
        <div className={`w-full h-full rounded-full bg-gradient-to-br ${colorClasses[member.color]} flex items-center justify-center text-3xl font-bold text-white shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300`}>
          {member.initials}
        </div>
        {/* Ring */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-neutral-200 group-hover:border-primary-300 group-hover:rotate-180 transition-all duration-700 scale-110" />
      </div>

      {/* Info */}
      <h3 className="text-xl font-bold text-neutral-900 mb-1">
        {member.name}
      </h3>
      <p className="text-primary-600 font-medium text-sm mb-3">
        {member.role}
      </p>
      <p className="text-neutral-600 text-sm mb-4 max-w-xs mx-auto">
        {member.bio}
      </p>

      {/* Social Links */}
      <div className="flex items-center justify-center gap-3">
        <a
          href="#"
          className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-primary-100 flex items-center justify-center text-neutral-500 hover:text-primary-600 transition-colors"
          aria-label={`${member.name}'s Twitter`}
        >
          <Globe className="w-4 h-4" />
        </a>
        <a
          href="#"
          className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-primary-100 flex items-center justify-center text-neutral-500 hover:text-primary-600 transition-colors"
          aria-label={`${member.name}'s LinkedinIcon`}
        >
          <LinkIcon className="w-4 h-4" />
        </a>
      </div>
    </motion.div>
  );
}
