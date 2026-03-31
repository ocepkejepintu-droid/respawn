/**
 * Billing tRPC Router
 * 
 * Handles all billing-related API endpoints including subscription management,
 * checkout sessions, usage tracking, and billing history.
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/trpc';
import {
  getDetailedSubscription,
  getSubscriptionWithWorkspace,
  createUpgradeCheckout,
  createBillingPortalSession,
  upgradeSubscription,
  downgradeSubscription,
  cancelSubscription,
  reactivateSubscription,
  compareSubscriptions,
  initializeFreeSubscription,
} from '@/server/services/billing/subscription';
import {
  getUsageStats,
  checkQuota,
  checkQuotaBulk,
  getQuotaWarnings,
  getUsageHistory,
  logUsage,
} from '@/server/services/billing/usage';
import { listInvoices, retrieveInvoice } from '@/server/services/billing/stripe';
import { PRICING_TIERS, type BillingInterval } from '@/lib/stripe';
import { BillingIntervalSchema, SubscriptionTierEnum } from '@/types/billing';

// ============================================================================
// Input Schemas
// ============================================================================

const workspaceIdSchema = z.object({
  workspaceId: z.string(),
});

const checkoutSchema = z.object({
  workspaceId: z.string(),
  tierId: SubscriptionTierEnum.exclude(['FREE']),
  interval: BillingIntervalSchema,
});

const upgradeSchema = z.object({
  workspaceId: z.string(),
  tierId: SubscriptionTierEnum,
  interval: BillingIntervalSchema,
});

const cancelSchema = z.object({
  workspaceId: z.string(),
  immediately: z.boolean().default(false),
});

const quotaCheckSchema = z.object({
  workspaceId: z.string(),
  resource: z.enum(['competitors', 'hashtags', 'scrapes', 'reports', 'teamMembers']),
  requested: z.number().min(1).default(1),
});

const usageHistorySchema = z.object({
  workspaceId: z.string(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  limit: z.number().min(1).max(1000).default(100),
});

// ============================================================================
// Billing Router
// ============================================================================

export const billingRouter = createTRPCRouter({
  // ==========================================================================
  // Subscription Queries
  // ==========================================================================

  /**
   * Get current subscription details for a workspace
   */
  getSubscription: protectedProcedure
    .input(workspaceIdSchema)
    .query(async ({ input }) => {
      const subscription = await getDetailedSubscription(input.workspaceId);

      if (!subscription) {
        // Initialize free subscription if none exists
        await initializeFreeSubscription(input.workspaceId);
        return getDetailedSubscription(input.workspaceId);
      }

      return subscription;
    }),

  /**
   * Get raw subscription data
   */
  getSubscriptionRaw: protectedProcedure
    .input(workspaceIdSchema)
    .query(async ({ input }) => {
      return getSubscriptionWithWorkspace(input.workspaceId);
    }),

  /**
   * Get available pricing tiers
   */
  getPricingTiers: publicProcedure.query(() => {
    return PRICING_TIERS;
  }),

  /**
   * Compare current tier with a new tier
   */
  compareTiers: protectedProcedure
    .input(
      z.object({
        currentTier: SubscriptionTierEnum,
        newTier: SubscriptionTierEnum,
      })
    )
    .query(async ({ input }) => {
      return compareSubscriptions(input.currentTier, input.newTier);
    }),

  // ==========================================================================
  // Checkout & Billing Portal
  // ==========================================================================

  /**
   * Create a checkout session for upgrading subscription
   */
  createCheckout: protectedProcedure
    .input(checkoutSchema)
    .mutation(async ({ input }) => {
      const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`;

      const { sessionId, url } = await createUpgradeCheckout(
        input.workspaceId,
        input.tierId,
        input.interval,
        returnUrl
      );

      return { sessionId, url };
    }),

  /**
   * Create a billing portal session for managing subscription
   */
  createPortalSession: protectedProcedure
    .input(workspaceIdSchema)
    .mutation(async ({ input }) => {
      const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`;

      const { url } = await createBillingPortalSession(input.workspaceId, returnUrl);

      return { url };
    }),

  // ==========================================================================
  // Subscription Management
  // ==========================================================================

  /**
   * Upgrade subscription to a higher tier
   */
  upgrade: protectedProcedure
    .input(upgradeSchema)
    .mutation(async ({ input }) => {
      await upgradeSubscription(input.workspaceId, input.tierId, input.interval);

      return {
        success: true,
        message: `Upgraded to ${input.tierId} plan`,
      };
    }),

  /**
   * Downgrade subscription to a lower tier
   */
  downgrade: protectedProcedure
    .input(upgradeSchema)
    .mutation(async ({ input }) => {
      await downgradeSubscription(input.workspaceId, input.tierId, input.interval);

      return {
        success: true,
        message: `Downgraded to ${input.tierId} plan`,
      };
    }),

  /**
   * Cancel subscription
   */
  cancel: protectedProcedure
    .input(cancelSchema)
    .mutation(async ({ input }) => {
      await cancelSubscription(input.workspaceId, input.immediately);

      return {
        success: true,
        message: input.immediately
          ? 'Subscription canceled immediately'
          : 'Subscription will cancel at the end of the billing period',
      };
    }),

  /**
   * Reactivate a subscription scheduled for cancellation
   */
  reactivate: protectedProcedure
    .input(workspaceIdSchema)
    .mutation(async ({ input }) => {
      await reactivateSubscription(input.workspaceId);

      return {
        success: true,
        message: 'Subscription reactivated',
      };
    }),

  // ==========================================================================
  // Usage & Quotas
  // ==========================================================================

  /**
   * Get usage statistics for a workspace
   */
  getUsage: protectedProcedure
    .input(workspaceIdSchema)
    .query(async ({ input }) => {
      return getUsageStats(input.workspaceId);
    }),

  /**
   * Check if a specific resource can be used
   */
  checkQuota: protectedProcedure
    .input(quotaCheckSchema)
    .query(async ({ input }) => {
      return checkQuota(input.workspaceId, input.resource, input.requested);
    }),

  /**
   * Check quotas for multiple resources
   */
  checkQuotaBulk: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        checks: z.array(
          z.object({
            resource: z.enum(['competitors', 'hashtags', 'scrapes', 'reports', 'teamMembers']),
            requested: z.number().min(1).default(1),
          })
        ),
      })
    )
    .query(async ({ input }) => {
      return checkQuotaBulk(input.workspaceId, input.checks);
    }),

  /**
   * Get quota warnings for a workspace
   */
  getQuotaWarnings: protectedProcedure
    .input(workspaceIdSchema)
    .query(async ({ input }) => {
      return getQuotaWarnings(input.workspaceId);
    }),

  /**
   * Get usage history
   */
  getUsageHistory: protectedProcedure
    .input(usageHistorySchema)
    .query(async ({ input }) => {
      return getUsageHistory(input.workspaceId, {
        startDate: input.startDate,
        endDate: input.endDate,
        limit: input.limit,
      });
    }),

  /**
   * Log usage
   */
  logUsage: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        action: z.string(),
        resourceType: z.string(),
        resourceId: z.string().optional(),
        count: z.number().default(1),
        metadata: z.record(z.unknown()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await logUsage(
        input.workspaceId,
        input.action,
        input.resourceType,
        input.resourceId,
        input.count,
        ctx.user?.id,
        input.metadata
      );

      return { success: true };
    }),

  // ==========================================================================
  // Invoices & Billing History
  // ==========================================================================

  /**
   * Get billing history (invoices)
   */
  getBillingHistory: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        limit: z.number().min(1).max(100).default(12),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const subscription = await getSubscriptionWithWorkspace(input.workspaceId);

      if (!subscription?.stripeCustomerId) {
        return { invoices: [], hasMore: false };
      }

      const invoices = await listInvoices(subscription.stripeCustomerId, {
        limit: input.limit,
        startingAfter: input.cursor,
      });

      // Format invoices for the frontend
      const formattedInvoices = invoices.map((invoice) => ({
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        amount: invoice.amount_due,
        currency: invoice.currency,
        created: new Date(invoice.created * 1000),
        dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
        periodStart: invoice.period_start
          ? new Date(invoice.period_start * 1000)
          : null,
        periodEnd: invoice.period_end
          ? new Date(invoice.period_end * 1000)
          : null,
        pdfUrl: invoice.invoice_pdf,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        lineItems: invoice.lines.data.map((line) => ({
          description: line.description,
          amount: line.amount,
          currency: line.currency,
          period: line.period,
        })),
      }));

      return {
        invoices: formattedInvoices,
        hasMore: invoices.length === input.limit,
      };
    }),

  /**
   * Get a single invoice by ID
   */
  getInvoice: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        invoiceId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const subscription = await getSubscriptionWithWorkspace(input.workspaceId);

      if (!subscription?.stripeCustomerId) {
        throw new Error('No billing information found');
      }

      const invoice = await retrieveInvoice(input.invoiceId);

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Verify invoice belongs to this customer
      if (invoice.customer !== subscription.stripeCustomerId) {
        throw new Error('Invoice does not belong to this workspace');
      }

      return {
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        amount: invoice.amount_due,
        currency: invoice.currency,
        created: new Date(invoice.created * 1000),
        dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
        periodStart: invoice.period_start
          ? new Date(invoice.period_start * 1000)
          : null,
        periodEnd: invoice.period_end
          ? new Date(invoice.period_end * 1000)
          : null,
        pdfUrl: invoice.invoice_pdf,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        lineItems: invoice.lines.data.map((line) => ({
          description: line.description,
          amount: line.amount,
          currency: line.currency,
          quantity: line.quantity,
          period: line.period,
        })),
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        total: invoice.total,
      };
    }),

  // ==========================================================================
  // Payment Methods
  // ==========================================================================

  /**
   * Get payment methods
   */
  getPaymentMethods: protectedProcedure
    .input(workspaceIdSchema)
    .query(async ({ input }) => {
      const { listPaymentMethods } = await import('@/server/services/billing/stripe');
      const subscription = await getSubscriptionWithWorkspace(input.workspaceId);

      if (!subscription?.stripeCustomerId) {
        return { paymentMethods: [] };
      }

      const methods = await listPaymentMethods(subscription.stripeCustomerId);

      return {
        paymentMethods: methods.map((method) => ({
          id: method.id,
          brand: method.card?.brand,
          last4: method.card?.last4,
          expMonth: method.card?.exp_month,
          expYear: method.card?.exp_year,
          isDefault: false, // Will be set based on customer default
        })),
      };
    }),
});
