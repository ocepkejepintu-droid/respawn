import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers";
import { ThemeInitializer } from "@/components/providers/theme-initializer";
import { TRPCProvider } from "@/trpc/provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "RESPAWN Analytics - Data-Driven Growth for Creators & Agencies",
    template: "%s - RESPAWN Analytics",
  },
  description: "Replace fake engagement with real intelligence. Get daily insights on competitors, trends, and what actually works in your niche.",
  keywords: ["social media analytics", "competitor analysis", "content optimization", "Instagram analytics", "TikTok analytics", "social media intelligence"],
  authors: [{ name: "RESPAWN Analytics" }],
  creator: "RESPAWN Analytics",
  publisher: "RESPAWN Analytics",
  metadataBase: new URL("https://realbuzzer.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "RESPAWN Analytics - Data-Driven Growth for Creators & Agencies",
    description: "Replace fake engagement with real intelligence. Get daily insights on competitors, trends, and what actually works in your niche.",
    type: "website",
    url: "https://realbuzzer.com",
    siteName: "RESPAWN Analytics",
    locale: "en_US",
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
    creator: "@realbuzzer",
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
  verification: {
    google: "your-google-verification-code",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeInitializer />
        <TRPCProvider>
          <SessionProvider>
            {children}
          </SessionProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
