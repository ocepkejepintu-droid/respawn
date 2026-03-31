/**
 * Public Pricing Page
 * 
 * Marketing page displaying all pricing tiers and features.
 * Accessible without authentication.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Check, ArrowRight, Sparkles, Shield, Zap, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlanFeatureList } from '@/components/billing';
import { PRICING_TIERS } from '@/lib/stripe';

export const metadata: Metadata = {
  title: 'Pricing - RESPAWN Analytics',
  description: 'Simple, transparent pricing for competitor analysis. Start free, upgrade when you need more.',
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 dark:text-white mb-6">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto mb-8">
            Start free and upgrade as you grow. No hidden fees, no surprises. 
            Cancel anytime with no questions asked.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="px-8">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#compare">
              <Button variant="outline" size="lg" className="px-8">
                Compare Plans
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Cards Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Object.values(PRICING_TIERS).map((tier) => (
              <PricingCard key={tier.id} tier={tier} />
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Section */}
      <section id="compare" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">
              Compare all features
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              Everything you need to know about our plans
            </p>
          </div>
          <PlanFeatureList showComparison={true} />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-white text-center mb-12">
            Frequently asked questions
          </h2>
          <div className="grid gap-6">
            <FaqItem
              question="Can I try before I buy?"
              answer="Yes! Our Pro and Agency plans come with a 14-day free trial. No credit card required to start. You can upgrade, downgrade, or cancel at any time."
            />
            <FaqItem
              question="What happens when I hit my limits?"
              answer="You'll receive email notifications when you approach your limits. If you exceed them, you won't be able to add more competitors or hashtags until you upgrade or remove existing ones."
            />
            <FaqItem
              question="Can I change my plan later?"
              answer="Absolutely! You can upgrade or downgrade your plan at any time. When upgrading, you'll be charged prorated for the remainder of your billing cycle. When downgrading, the new rate applies at the next billing cycle."
            />
            <FaqItem
              question="Do you offer refunds?"
              answer="Yes, we offer a 30-day money-back guarantee. If you're not satisfied with your subscription for any reason, contact us within 30 days for a full refund."
            />
            <FaqItem
              question="What payment methods do you accept?"
              answer="We accept all major credit cards (Visa, Mastercard, American Express, Discover) through our secure payment processor Stripe. We do not store your card details."
            />
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TrustCard
              icon={Shield}
              title="Secure Payments"
              description="Your payment information is encrypted and processed securely by Stripe. We never store your full card details."
            />
            <TrustCard
              icon={Zap}
              title="Instant Access"
              description="Get immediate access to all features in your plan after signing up. No waiting, no setup required."
            />
            <TrustCard
              icon={Users}
              title="Team Collaboration"
              description="Invite team members to collaborate on competitor analysis. Share insights and reports with your whole team."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-primary-600 dark:bg-primary-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to start tracking your competitors?
          </h2>
          <p className="text-primary-100 text-lg mb-8">
            Join thousands of marketers using RESPAWN Analytics to stay ahead of the competition.
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="px-8">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}

// ============================================================================
// Pricing Card Component
// ============================================================================

function PricingCard({ tier }: { tier: typeof PRICING_TIERS['FREE'] }) {
  const isFree = tier.price === 0;

  return (
    <Card className={`relative flex flex-col h-full ${tier.popular ? 'ring-2 ring-primary-500' : ''}`}>
      {tier.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-500 text-white text-sm font-medium rounded-full">
            <Sparkles className="h-3 w-3" />
            Most Popular
          </span>
        </div>
      )}

      <CardContent className="flex flex-col h-full p-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
            {tier.name}
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            {tier.description}
          </p>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold text-neutral-900 dark:text-white">
              {isFree ? 'Free' : `$${tier.price}`}
            </span>
            {!isFree && (
              <span className="text-neutral-500 dark:text-neutral-400">/month</span>
            )}
          </div>
          {!isFree && (
            <p className="text-sm text-success-600 dark:text-success-400 mt-1">
              or ${Math.round(tier.yearlyPrice / 12)}/mo billed annually
            </p>
          )}
        </div>

        <ul className="space-y-3 mb-6 flex-1">
          {tier.features.slice(0, 6).map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className="h-5 w-5 text-success-600 dark:text-success-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-neutral-600 dark:text-neutral-300">{feature}</span>
            </li>
          ))}
        </ul>

        <Link href="/signup" className="mt-auto">
          <Button 
            variant={tier.popular ? 'primary' : 'outline'} 
            className="w-full"
            size="lg"
          >
            {tier.cta}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// FAQ Item Component
// ============================================================================

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 shadow-sm border border-neutral-200 dark:border-neutral-800">
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
        {question}
      </h3>
      <p className="text-neutral-600 dark:text-neutral-400">
        {answer}
      </p>
    </div>
  );
}

// ============================================================================
// Trust Card Component
// ============================================================================

function TrustCard({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: typeof Shield; 
  title: string; 
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 mb-4">
        <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
      </div>
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-neutral-600 dark:text-neutral-400">
        {description}
      </p>
    </div>
  );
}
