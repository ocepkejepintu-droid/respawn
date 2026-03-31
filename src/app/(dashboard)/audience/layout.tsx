import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Audience Intelligence - Real Buzzer",
  description: "Understand your audience sentiment, demographics, and engagement patterns",
};

export default function AudienceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
