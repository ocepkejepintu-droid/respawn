"use client";

import Link from "next/link";
import { Zap, Link as LinkIcon, Play, Code, Camera, Globe } from "lucide-react";

const footerLinks = {
  Product: [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Integrations", href: "#" },
    { label: "Changelog", href: "#" },
    { label: "Roadmap", href: "#" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Careers", href: "#" },
    { label: "Press", href: "#" },
    { label: "Partners", href: "#" },
  ],
  Resources: [
    { label: "Documentation", href: "#" },
    { label: "Help Center", href: "#" },
    { label: "Community", href: "#" },
    { label: "Templates", href: "#" },
    { label: "Webinars", href: "#" },
  ],
  Legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
    { label: "Security", href: "#" },
    { label: "Cookies", href: "#" },
    { label: "Licenses", href: "#" },
  ],
};

const socialLinks = [
  { icon: Globe, href: "https://twitter.com/realbuzzer", label: "Twitter" },
  { icon: LinkIcon, href: "https://linkedin.com/company/realbuzzer", label: "LinkedIn" },
  { icon: Camera, href: "https://instagram.com/realbuzzer", label: "Instagram" },
  { icon: Play, href: "https://youtube.com/realbuzzer", label: "YouTube" },
  { icon: Code, href: "https://github.com/realbuzzer", label: "GitHub" },
];

export function Footer() {
  return (
    <footer className="bg-neutral-900 text-neutral-300">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6 lg:gap-12">
          <div className="col-span-2">
            <Link href="/" className="mb-6 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">RESPAWN Analytics</span>
            </Link>
            <p className="mb-6 max-w-xs text-sm text-neutral-400">
              Data-driven growth for creators and agencies. Replace fake engagement with real intelligence.
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-800 transition-colors hover:bg-neutral-700"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="mb-4 font-semibold text-white">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-neutral-800 pt-8 md:flex-row">
          <p className="text-sm text-neutral-500">
            &copy; {new Date().getFullYear()} RESPAWN Analytics. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-sm text-neutral-500 transition-colors hover:text-neutral-300">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-neutral-500 transition-colors hover:text-neutral-300">
              Terms of Service
            </Link>
            <Link href="/cookies" className="text-sm text-neutral-500 transition-colors hover:text-neutral-300">
              Cookie Settings
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
