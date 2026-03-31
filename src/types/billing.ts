/**
 * Billing Types
 * 
 * Type definitions and Zod schemas for the billing system.
 */

import { z } from 'zod';
import { SubscriptionTier, SubscriptionStatus } from '@prisma/client';

// ============================================================================
// Enums
// ============================================================================

export const SubscriptionTierEnum = z.nativeEnum(SubscriptionTier);
export const SubscriptionStatusEnum = z.nativeEnum(SubscriptionStatus);

export const BillingIntervalSchema = z.enum(['month', 'year']);
export type BillingInterval = z.infer<typeof BillingIntervalSchema>;

// ============================================================================
// Pricing Tier
// ============================================================================

export const PricingTierSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  yearlyPrice: z.number(),
  yearlyDiscount: z.number(),
  interval: BillingIntervalSchema,
  features: z.array(z.string()),
  notIncluded: z.array(z.string()),
  cta: z.string(),
  popular: z.boolean().optional(),
  trialDays: z.number(),
  limits: z.object({
    competitors: z.number(),
    hashtags: z.number(),
    scrapes: z.number(),
    teamMembers: z.number(),
    reports: z.number(),
  }),
  stripePriceIds: z.object({
    monthly: z.string(),
    yearly: z.string(),
  }),
});

export type PricingTier = z.infer<typeof PricingTierSchema>;

// ============================================================================
// Subscription
// ============================================================================

export const SubscriptionSchema = z.object({
  id: z.string(),
  tier: SubscriptionTierEnum,
  status: SubscriptionStatusEnum,
  stripeCustomerId: z.string().nullable(),
  stripeSubscriptionId: z.string().nullable(),
  stripePriceId: z.string().nullable(),
  currentPeriodStart: z.date().nullable(),
  currentPeriodEnd: z.date().nullable(),
  trialStartsAt: z.date().nullable(),
  trialEndsAt: z.date().nullable(),
  cancelAtPeriodEnd: z.boolean(),
  canceledAt: z.date().nullable(),
  maxCompetitors: z.number(),
  maxHashtagTracks: z.number(),
  maxScrapedPosts: z.number(),
  maxAnalysisReports: z.number(),
  maxTeamMembers: z.number(),
  usedCompetitorSlots: z.number(),
  usedHashtagTracks: z.number(),
  usedScrapedPosts: z.number(),
  usedAnalysisReports: z.number(),
  workspaceId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Subscription = z.infer<typeof SubscriptionSchema>;

// ============================================================================
// Usage Stats
// ============================================================================

export const ResourceUsageSchema = z.object({
  used: z.number(),
  limit: z.number(),
  remaining: z.number(),
  percentage: z.number(),
});

export type ResourceUsage = z.infer<typeof ResourceUsageSchema>;

export const UsageStatsSchema = z.object({
  competitors: ResourceUsageSchema,
  hashtags: ResourceUsageSchema,
  scrapes: ResourceUsageSchema,
  reports: ResourceUsageSchema,
  teamMembers: ResourceUsageSchema,
});

export type UsageStats = z.infer<typeof UsageStatsSchema>;

// ============================================================================
// Quota Check
// ============================================================================

export const QuotaCheckSchema = z.object({
  allowed: z.boolean(),
  reason: z.string().optional(),
  current: z.number(),
  limit: z.number(),
});

export type QuotaCheck = z.infer<typeof QuotaCheckSchema>;

export const ResourceTypeSchema = z.enum([
  'competitors',
  'hashtags',
  'scrapes',
  'reports',
  'teamMembers',
]);

export type ResourceType = z.infer<typeof ResourceTypeSchema>;

// ============================================================================
// Quota Warning
// ============================================================================

export const QuotaWarningSchema = z.object({
  resource: ResourceTypeSchema,
  severity: z.enum(['info', 'warning', 'critical']),
  message: z.string(),
  current: z.number(),
  limit: z.number(),
  percentage: z.number(),
});

export type QuotaWarning = z.infer<typeof QuotaWarningSchema>;

// ============================================================================
// Invoice
// ============================================================================

export const InvoiceSchema = z.object({
  id: z.string(),
  number: z.string().nullable(),
  status: z.enum(['draft', 'open', 'paid', 'uncollectible', 'void']).nullable(),
  amount: z.number(),
  currency: z.string(),
  created: z.union([z.date(), z.string()]),
  dueDate: z.union([z.date(), z.string()]).nullable(),
  periodStart: z.union([z.date(), z.string()]).nullable(),
  periodEnd: z.union([z.date(), z.string()]).nullable(),
  pdfUrl: z.string().nullable().optional(),
  hostedInvoiceUrl: z.string().nullable().optional(),
  lineItems: z.array(
    z.object({
      description: z.string().nullable(),
      amount: z.number(),
      currency: z.string(),
      quantity: z.number().nullable(),
      period: z
        .object({
          start: z.number(),
          end: z.number(),
        })
        .optional(),
    })
  ),
  subtotal: z.number().optional(),
  tax: z.number().optional(),
  total: z.number().optional(),
});

export type Invoice = z.infer<typeof InvoiceSchema>;

// ============================================================================
// Payment Method
// ============================================================================

export const PaymentMethodSchema = z.object({
  id: z.string(),
  brand: z.string().optional(),
  last4: z.string().optional(),
  expMonth: z.number().optional(),
  expYear: z.number().optional(),
  isDefault: z.boolean(),
});

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

// ============================================================================
// Checkout
// ============================================================================

export const CheckoutSessionSchema = z.object({
  sessionId: z.string(),
  url: z.string().nullable(),
});

export type CheckoutSession = z.infer<typeof CheckoutSessionSchema>;

// ============================================================================
// Billing Portal
// ============================================================================

export const BillingPortalSchema = z.object({
  url: z.string().nullable(),
});

export type BillingPortal = z.infer<typeof BillingPortalSchema>;

// ============================================================================
// Subscription Comparison
// ============================================================================

export const SubscriptionComparisonSchema = z.object({
  isUpgrade: z.boolean(),
  isDowngrade: z.boolean(),
  isSame: z.boolean(),
  priceDifference: z.number(),
});

export type SubscriptionComparison = z.infer<typeof SubscriptionComparisonSchema>;

// ============================================================================
// Detailed Subscription (for UI)
// ============================================================================

export const DetailedSubscriptionSchema = z.object({
  subscription: SubscriptionSchema,
  tier: PricingTierSchema,
  isActive: z.boolean(),
  isTrialing: z.boolean(),
  isCanceled: z.boolean(),
  daysUntilRenewal: z.number(),
  paymentMethod: z
    .object({
      brand: z.string().nullable(),
      last4: z.string().nullable(),
      expMonth: z.number().nullable(),
      expYear: z.number().nullable(),
    })
    .nullable(),
});

export type DetailedSubscription = z.infer<typeof DetailedSubscriptionSchema>;

// ============================================================================
// Usage Log
// ============================================================================

export const UsageLogSchema = z.object({
  id: z.string(),
  action: z.string(),
  resourceType: z.string(),
  resourceId: z.string().nullable(),
  count: z.number(),
  metadata: z.record(z.unknown()).nullable(),
  createdAt: z.date(),
  user: z
    .object({
      id: z.string(),
      name: z.string().nullable(),
      email: z.string(),
    })
    .nullable(),
});

export type UsageLog = z.infer<typeof UsageLogSchema>;
