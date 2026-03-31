/**
 * Stripe Webhook Handlers
 * 
 * Processes incoming Stripe webhook events and updates the database
 * accordingly. All handlers are idempotent to handle duplicate events.
 */

import { prisma } from '@/lib/prisma';
import { SubscriptionStatus, SubscriptionTier } from '@prisma/client';
import type Stripe from 'stripe';
import {
  getSubscriptionByStripeCustomerId,
  getSubscriptionByStripeSubscriptionId,
  updateSubscriptionFromStripe,
  handlePaymentFailure,
  handlePaymentSuccess,
} from './subscription';
import { PRICING_TIERS } from '@/lib/stripe';

// ============================================================================
// Event Processor
// ============================================================================

export interface WebhookResult {
  success: boolean;
  eventId: string;
  message?: string;
  error?: string;
}

export async function processStripeWebhook(
  event: Stripe.Event
): Promise<WebhookResult> {
  const eventId = event.id;

  try {
    // Check if we've already processed this event
    const existing = await prisma.auditLog.findFirst({
      where: {
        action: `stripe.webhook.${event.type}`,
        entityId: eventId,
      },
    });

    if (existing) {
      return {
        success: true,
        eventId,
        message: 'Event already processed',
      };
    }

    // Process based on event type
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        return {
          success: false,
          eventId,
          message: `Unhandled event type: ${event.type}`,
        };
    }

    // Log the processed event
    await prisma.auditLog.create({
      data: {
        workspaceId: 'system',
        action: `stripe.webhook.${event.type}`,
        entityType: 'stripe_event',
        entityId: eventId,
        newValues: {
          eventType: event.type,
          processedAt: new Date().toISOString(),
        },
      },
    });

    return {
      success: true,
      eventId,
    };
  } catch (error) {
    console.error(`[Stripe Webhook] Error processing event ${eventId}:`, error);

    return {
      success: false,
      eventId,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// Subscription Event Handlers
// ============================================================================

async function handleSubscriptionCreated(
  stripeSubscription: Stripe.Subscription
): Promise<void> {
  const customerId = stripeSubscription.customer as string;
  const subscription = await getSubscriptionByStripeCustomerId(customerId);

  if (!subscription) {
    console.warn(`[Stripe Webhook] No subscription found for customer ${customerId}`);
    return;
  }

  await updateSubscriptionFromStripe(subscription.workspaceId, stripeSubscription);

  console.log(`[Stripe Webhook] Subscription created for workspace ${subscription.workspaceId}`);
}

async function handleSubscriptionUpdated(
  stripeSubscription: Stripe.Subscription
): Promise<void> {
  const subscription = await getSubscriptionByStripeSubscriptionId(stripeSubscription.id);

  if (!subscription) {
    console.warn(`[Stripe Webhook] No subscription found for ${stripeSubscription.id}`);
    return;
  }

  await updateSubscriptionFromStripe(subscription.workspaceId, stripeSubscription);

  // Handle specific status changes
  if (stripeSubscription.status === 'past_due') {
    await prisma.subscription.update({
      where: { workspaceId: subscription.workspaceId },
      data: { status: SubscriptionStatus.PAST_DUE },
    });
  }

  console.log(`[Stripe Webhook] Subscription updated for workspace ${subscription.workspaceId}`);
}

async function handleSubscriptionDeleted(
  stripeSubscription: Stripe.Subscription
): Promise<void> {
  const subscription = await getSubscriptionByStripeSubscriptionId(stripeSubscription.id);

  if (!subscription) {
    console.warn(`[Stripe Webhook] No subscription found for ${stripeSubscription.id}`);
    return;
  }

  // Downgrade to free tier
  await prisma.subscription.update({
    where: { workspaceId: subscription.workspaceId },
    data: {
      tier: SubscriptionTier.FREE,
      status: SubscriptionStatus.CANCELED,
      stripeSubscriptionId: null,
      stripePriceId: null,
      cancelAtPeriodEnd: false,
      canceledAt: new Date(),
      maxCompetitors: PRICING_TIERS.FREE.limits.competitors,
      maxHashtagTracks: PRICING_TIERS.FREE.limits.hashtags,
      maxScrapedPosts: PRICING_TIERS.FREE.limits.scrapes,
      maxAnalysisReports: PRICING_TIERS.FREE.limits.reports,
      maxTeamMembers: PRICING_TIERS.FREE.limits.teamMembers,
    },
  });

  console.log(`[Stripe Webhook] Subscription canceled for workspace ${subscription.workspaceId}`);
}

// ============================================================================
// Invoice Event Handlers
// ============================================================================

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  const customerId = invoice.customer as string;
  const subscription = await getSubscriptionByStripeCustomerId(customerId);

  if (!subscription) {
    console.warn(`[Stripe Webhook] No subscription found for customer ${customerId}`);
    return;
  }

  // Handle subscription invoice
  if (invoice.subscription) {
    await handlePaymentSuccess(subscription.workspaceId, invoice.id);

    // Update subscription status if it was past_due
    if (subscription.status === SubscriptionStatus.PAST_DUE) {
      await prisma.subscription.update({
        where: { workspaceId: subscription.workspaceId },
        data: { status: SubscriptionStatus.ACTIVE },
      });
    }
  }

  // Store invoice record if needed
  // You might want to create an Invoice model in your database

  console.log(`[Stripe Webhook] Payment succeeded for workspace ${subscription.workspaceId}`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const customerId = invoice.customer as string;
  const subscription = await getSubscriptionByStripeCustomerId(customerId);

  if (!subscription) {
    console.warn(`[Stripe Webhook] No subscription found for customer ${customerId}`);
    return;
  }

  await handlePaymentFailure(subscription.workspaceId, invoice.id);

  // Store failed payment record
  await prisma.auditLog.create({
    data: {
      workspaceId: subscription.workspaceId,
      action: 'stripe.payment_failed',
      entityType: 'invoice',
      entityId: invoice.id,
      newValues: {
        amount: invoice.amount_due,
        currency: invoice.currency,
        attemptCount: invoice.attempt_count,
        nextPaymentAttempt: invoice.next_payment_attempt,
      },
    },
  });

  console.log(`[Stripe Webhook] Payment failed for workspace ${subscription.workspaceId}`);
}

// ============================================================================
// Customer Event Handlers (for future use)
// ============================================================================

export async function handleCustomerUpdated(
  customer: Stripe.Customer
): Promise<void> {
  const subscription = await getSubscriptionByStripeCustomerId(customer.id);

  if (!subscription) {
    return;
  }

  // Update customer info if needed
  await prisma.subscription.update({
    where: { workspaceId: subscription.workspaceId },
    data: {
      // Update any customer-related fields
    },
  });
}

// ============================================================================
// Webhook Verification
// ============================================================================

export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  const { constructWebhookEvent } = require('./stripe');
  return constructWebhookEvent(payload, signature, secret);
}

// ============================================================================
// Event Replay Protection
// ============================================================================

export async function isEventProcessed(eventId: string): Promise<boolean> {
  const existing = await prisma.auditLog.findFirst({
    where: {
      action: { startsWith: 'stripe.webhook.' },
      entityId: eventId,
    },
  });

  return !!existing;
}

// ============================================================================
// Webhook Event Types
// ============================================================================

export const STRIPE_WEBHOOK_EVENTS = {
  SUBSCRIPTION_CREATED: 'customer.subscription.created',
  SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  INVOICE_PAYMENT_SUCCEEDED: 'invoice.payment_succeeded',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
  INVOICE_CREATED: 'invoice.created',
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated',
  CUSTOMER_DELETED: 'customer.deleted',
} as const;

// ============================================================================
// Retry Logic
// ============================================================================

interface FailedWebhook {
  eventId: string;
  eventType: string;
  payload: unknown;
  error: string;
  retryCount: number;
  lastAttempt: Date;
}

const failedWebhooks: Map<string, FailedWebhook> = new Map();

export function queueFailedWebhook(
  eventId: string,
  eventType: string,
  payload: unknown,
  error: string
): void {
  const existing = failedWebhooks.get(eventId);

  failedWebhooks.set(eventId, {
    eventId,
    eventType,
    payload,
    error,
    retryCount: existing ? existing.retryCount + 1 : 1,
    lastAttempt: new Date(),
  });
}

export function getFailedWebhooks(): FailedWebhook[] {
  return Array.from(failedWebhooks.values());
}

export function removeFailedWebhook(eventId: string): void {
  failedWebhooks.delete(eventId);
}

// ============================================================================
// Health Check
// ============================================================================

export async function getWebhookHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  failedCount: number;
  lastProcessedAt?: Date;
}> {
  const failedCount = failedWebhooks.size;

  const lastProcessed = await prisma.auditLog.findFirst({
    where: {
      action: { startsWith: 'stripe.webhook.' },
    },
    orderBy: { createdAt: 'desc' },
  });

  return {
    status: failedCount > 10 ? 'unhealthy' : failedCount > 0 ? 'degraded' : 'healthy',
    failedCount,
    lastProcessedAt: lastProcessed?.createdAt,
  };
}
