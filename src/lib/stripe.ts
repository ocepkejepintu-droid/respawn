/**
 * Stripe Client Configuration
 * 
 * Centralized Stripe configuration for the Real Buzzer SaaS billing system.
 * Uses Stripe Test Mode for development.
 */

import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// ============================================================================
// Server-side Stripe Instance
// ============================================================================

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

if (!STRIPE_SECRET_KEY) {
  console.warn('[Stripe] STRIPE_SECRET_KEY is not set. Billing features will be disabled.');
}

export const stripe = new Stripe(STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

export const stripeWebhookSecret = STRIPE_WEBHOOK_SECRET || '';

// ============================================================================
// Client-side Stripe Promise
// ============================================================================

const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export const getStripe = () => {
  if (!STRIPE_PUBLISHABLE_KEY) {
    console.warn('[Stripe] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set.');
    return null;
  }
  return loadStripe(STRIPE_PUBLISHABLE_KEY);
};

// ============================================================================
// Pricing Configuration
// ============================================================================

export type BillingInterval = 'month' | 'year';

export interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: number;
  yearlyPrice: number;
  yearlyDiscount: number; // Percentage off for yearly billing
  interval: BillingInterval;
  features: string[];
  notIncluded: string[];
  cta: string;
  popular?: boolean;
  trialDays: number;
  limits: {
    competitors: number;
    hashtags: number;
    scrapes: number;
    teamMembers: number;
    reports: number;
  };
  stripePriceIds: {
    monthly: string;
    yearly: string;
  };
}

// Price IDs - Replace with your actual Stripe Price IDs
// These are placeholder values - create actual prices in Stripe Dashboard
export const STRIPE_PRICE_IDS = {
  FREE: {
    MONTHLY: 'price_free',
    YEARLY: 'price_free_yearly',
  },
  PRO: {
    MONTHLY: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly',
    YEARLY: process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly',
  },
  AGENCY: {
    MONTHLY: process.env.STRIPE_AGENCY_MONTHLY_PRICE_ID || 'price_agency_monthly',
    YEARLY: process.env.STRIPE_AGENCY_YEARLY_PRICE_ID || 'price_agency_yearly',
  },
} as const;

export const PRICING_TIERS: Record<string, PricingTier> = {
  FREE: {
    id: 'FREE',
    name: 'Free',
    description: 'Perfect for getting started with competitor analysis',
    price: 0,
    yearlyPrice: 0,
    yearlyDiscount: 0,
    interval: 'month',
    features: [
      '3 competitors tracking',
      '5 hashtag monitors',
      '100 scrapes per month',
      'Basic analytics dashboard',
      'Email support',
      '7-day data history',
    ],
    notIncluded: [
      'Team collaboration',
      'Advanced reports',
      'API access',
      'Priority support',
    ],
    cta: 'Get Started Free',
    trialDays: 0,
    limits: {
      competitors: 3,
      hashtags: 5,
      scrapes: 100,
      teamMembers: 1,
      reports: 5,
    },
    stripePriceIds: {
      monthly: STRIPE_PRICE_IDS.FREE.MONTHLY,
      yearly: STRIPE_PRICE_IDS.FREE.YEARLY,
    },
  },
  PRO: {
    id: 'PRO',
    name: 'Pro',
    description: 'For growing brands and content creators',
    price: 29,
    yearlyPrice: 313, // $29 * 12 * 0.9 (10% discount)
    yearlyDiscount: 10,
    interval: 'month',
    features: [
      '10 competitors tracking',
      '20 hashtag monitors',
      '1,000 scrapes per month',
      'Advanced analytics & insights',
      'Priority email support',
      '90-day data history',
      '5 team members',
      'Custom reports',
      'Export to CSV/PDF',
    ],
    notIncluded: [
      'API access',
      'White-label reports',
    ],
    cta: 'Start Pro Trial',
    popular: true,
    trialDays: 14,
    limits: {
      competitors: 10,
      hashtags: 20,
      scrapes: 1000,
      teamMembers: 5,
      reports: 50,
    },
    stripePriceIds: {
      monthly: STRIPE_PRICE_IDS.PRO.MONTHLY,
      yearly: STRIPE_PRICE_IDS.PRO.YEARLY,
    },
  },
  AGENCY: {
    id: 'AGENCY',
    name: 'Agency',
    description: 'For agencies managing multiple clients',
    price: 99,
    yearlyPrice: 1069, // $99 * 12 * 0.9 (10% discount)
    yearlyDiscount: 10,
    interval: 'month',
    features: [
      '50 competitors tracking',
      '100 hashtag monitors',
      '5,000 scrapes per month',
      'White-label reports',
      'API access',
      'Priority chat & email support',
      'Unlimited data history',
      '20 team members',
      'Custom integrations',
      'Dedicated account manager',
    ],
    notIncluded: [],
    cta: 'Contact Sales',
    trialDays: 14,
    limits: {
      competitors: 50,
      hashtags: 100,
      scrapes: 5000,
      teamMembers: 20,
      reports: 500,
    },
    stripePriceIds: {
      monthly: STRIPE_PRICE_IDS.AGENCY.MONTHLY,
      yearly: STRIPE_PRICE_IDS.AGENCY.YEARLY,
    },
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

export function getPriceId(tierId: string, interval: BillingInterval): string {
  const tier = PRICING_TIERS[tierId];
  if (!tier) {
    throw new Error(`Invalid tier: ${tierId}`);
  }
  return interval === 'year' ? tier.stripePriceIds.yearly : tier.stripePriceIds.monthly;
}

export function getTierByPriceId(priceId: string): PricingTier | null {
  for (const tier of Object.values(PRICING_TIERS)) {
    if (tier.stripePriceIds.monthly === priceId || tier.stripePriceIds.yearly === priceId) {
      return tier;
    }
  }
  return null;
}

export function formatPrice(price: number, currency: string = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function calculateSavings(tierId: string): number {
  const tier = PRICING_TIERS[tierId];
  if (!tier || tier.price === 0) return 0;
  
  const monthlyCost = tier.price * 12;
  const yearlyCost = tier.yearlyPrice;
  return monthlyCost - yearlyCost;
}

// ============================================================================
// Stripe Event Types
// ============================================================================

export type StripeWebhookEvent = 
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.payment_succeeded'
  | 'invoice.payment_failed'
  | 'invoice.created'
  | 'invoice.finalized'
  | 'customer.created'
  | 'customer.updated'
  | 'customer.deleted'
  | 'payment_method.attached'
  | 'payment_method.detached';

export const IMPORTANT_STRIPE_EVENTS: StripeWebhookEvent[] = [
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
];

// ============================================================================
// Error Handling
// ============================================================================

export class StripeError extends Error {
  constructor(
    message: string,
    public code: string,
    public stripeCode?: string
  ) {
    super(message);
    this.name = 'StripeError';
  }
}

export function handleStripeError(error: unknown): never {
  if (error instanceof Stripe.errors.StripeError) {
    throw new StripeError(
      error.message,
      'STRIPE_ERROR',
      error.code || undefined
    );
  }
  throw error;
}
