import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";

export const metadata: Metadata = {
  title: "RESPAWN Analytics - Data-Driven Growth for Creators & Agencies",
  description: "Replace fake engagement with real intelligence. Get daily insights on competitors, trends, and what actually works in your niche.",
  keywords: ["social media analytics", "competitor analysis", "content optimization", "Instagram analytics", "TikTok analytics"],
  authors: [{ name: "RESPAWN Analytics" }],
  openGraph: {
    title: "RESPAWN Analytics - Data-Driven Growth for Creators & Agencies",
    description: "Replace fake engagement with real intelligence. Get daily insights on competitors, trends, and what actually works in your niche.",
    type: "website",
    url: "https://realbuzzer.com",
    siteName: "RESPAWN Analytics",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "RESPAWN Analytics - Social Media Intelligence Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RESPAWN Analytics - Data-Driven Growth for Creators & Agencies",
    description: "Replace fake engagement with real intelligence. Get daily insights on competitors, trends, and what actually works in your niche.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://realbuzzer.com",
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
