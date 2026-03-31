import { Hero } from "@/components/marketing/Hero";
import { SocialProof } from "@/components/marketing/SocialProof";
import { Features } from "@/components/marketing/Features";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Pricing } from "@/components/marketing/Pricing";
import { Testimonials } from "@/components/marketing/Testimonials";
import { FAQ } from "@/components/marketing/FAQ";
import { CTA } from "@/components/marketing/CTA";
import { NewsletterForm } from "@/components/marketing/NewsletterForm";
import { JsonLd } from "@/components/marketing/JsonLd";

export default function HomePage() {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Real Buzzer",
    url: "https://realbuzzer.com",
    description: "Data-driven growth for creators and agencies",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://realbuzzer.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Real Buzzer",
    url: "https://realbuzzer.com",
    logo: "https://realbuzzer.com/logo.png",
    sameAs: [
      "https://twitter.com/realbuzzer",
      "https://linkedin.com/company/realbuzzer",
      "https://instagram.com/realbuzzer",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      email: "support@realbuzzer.com",
      contactType: "customer support",
    },
  };

  const softwareAppSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Real Buzzer",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "29.00",
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "1247",
    },
  };

  return (
    <>
      <JsonLd data={websiteSchema} />
      <JsonLd data={organizationSchema} />
      <JsonLd data={softwareAppSchema} />
      
      <Hero />
      <SocialProof />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTA />
      <NewsletterForm />
    </>
  );
}
