/**
 * Subscription Service - Business logic for subscription management
 * 
 * Handles workspace subscriptions, tier management, upgrades/downgrades,
 * and coordinates with Stripe.
 */

import { prisma } from '@/lib/prisma';
import { SubscriptionTier, SubscriptionStatus, Prisma } from '@prisma/client';
import {
  createStripeCustomer,
  updateStripeCustomer,
  createStripeSubscription,
  updateStripeSubscription,
  cancelStripeSubscription,
  reactivateStripeSubscription,
  createCheckoutSession,
  createBillingPortalSession as createStripeBillingPortalSession,
  listPaymentMethods,
  retrieveStripeSubscription,
  type CreateSubscriptionParams,
} from './stripe';
import {
  PRICING_TIERS,
  getPriceId,
  type BillingInterval,
  type PricingTier,
} from '@/lib/stripe';

// ============================================================================
// Types
// ============================================================================

export interface SubscriptionWithRelations {
  id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  trialStartsAt: Date | null;
  trialEndsAt: Date | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  maxCompetitors: number;
  maxHashtagTracks: number;
  maxScrapedPosts: number;
  maxAnalysisReports: number;
  maxTeamMembers: number;
  usedCompetitorSlots: number;
  usedHashtagTracks: number;
  usedScrapedPosts: number;
  usedAnalysisReports: number;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
  workspace: {
    id: string;
    name: string;
    slug: string;
    ownerId: string;
    owner: {
      id: string;
      email: string;
      name: string | null;
    };
  };
}

export interface SubscriptionDetails {
  subscription: SubscriptionWithRelations;
  tier: PricingTier;
  isActive: boolean;
  isTrialing: boolean;
  isCanceled: boolean;
  daysUntilRenewal: number;
  paymentMethod: {
    brand: string | null;
    last4: string | null;
    expMonth: number | null;
    expYear: number | null;
  } | null;
}

// ============================================================================
// Subscription Creation & Initialization
// ============================================================================

export async function createWorkspaceSubscription(
  workspaceId: string,
  userId: string,
  email: string,
  name?: string
): Promise<void> {
  // Check if subscription already exists
  const existing = await prisma.subscription.findUnique({
    where: { workspaceId },
  });

  if (existing) {
    throw new Error('Subscription already exists for this workspace');
  }

  // Create Stripe customer
  const customer = await createStripeCustomer({
    email,
    name,
    workspaceId,
    userId,
  });

  // Create FREE subscription in database
  await prisma.subscription.create({
    data: {
      workspaceId,
      tier: SubscriptionTier.FREE,
      status: SubscriptionStatus.ACTIVE,
      stripeCustomerId: customer.id,
      maxCompetitors: PRICING_TIERS.FREE.limits.competitors,
      maxHashtagTracks: PRICING_TIERS.FREE.limits.hashtags,
      maxScrapedPosts: PRICING_TIERS.FREE.limits.scrapes,
      maxAnalysisReports: PRICING_TIERS.FREE.limits.reports,
      maxTeamMembers: PRICING_TIERS.FREE.limits.teamMembers,
    },
  });
}

export async function initializeFreeSubscription(workspaceId: string): Promise<void> {
  const existing = await prisma.subscription.findUnique({
    where: { workspaceId },
  });

  if (existing) {
    return; // Already exists
  }

  await prisma.subscription.create({
    data: {
      workspaceId,
      tier: SubscriptionTier.FREE,
      status: SubscriptionStatus.ACTIVE,
      maxCompetitors: PRICING_TIERS.FREE.limits.competitors,
      maxHashtagTracks: PRICING_TIERS.FREE.limits.hashtags,
      maxScrapedPosts: PRICING_TIERS.FREE.limits.scrapes,
      maxAnalysisReports: PRICING_TIERS.FREE.limits.reports,
      maxTeamMembers: PRICING_TIERS.FREE.limits.teamMembers,
    },
  });
}

// ============================================================================
// Checkout Flow
// ============================================================================

export async function createUpgradeCheckout(
  workspaceId: string,
  tierId: string,
  interval: BillingInterval,
  returnUrl: string
): Promise<{ sessionId: string; url: string | null }> {
  const subscription = await getSubscriptionWithWorkspace(workspaceId);

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  if (!subscription.stripeCustomerId) {
    throw new Error('Stripe customer not found');
  }

  const priceId = getPriceId(tierId, interval);
  const tier = PRICING_TIERS[tierId];

  const session = await createCheckoutSession({
    customerId: subscription.stripeCustomerId,
    priceId,
    successUrl: `${returnUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${returnUrl}?canceled=true`,
    trialDays: tier.trialDays,
    metadata: {
      workspaceId,
      tierId,
      interval,
    },
    clientReferenceId: workspaceId,
  });

  return {
    sessionId: session.id,
    url: session.url,
  };
}

export async function createBillingPortalSession(
  workspaceId: string,
  returnUrl: string
): Promise<{ url: string | null }> {
  const subscription = await getSubscriptionWithWorkspace(workspaceId);

  if (!subscription?.stripeCustomerId) {
    throw new Error('Stripe customer not found');
  }

  const session = await createStripeBillingPortalSession(subscription.stripeCustomerId, returnUrl);

  return { url: session.url };
}

// ============================================================================
// Subscription Management
// ============================================================================

export async function upgradeSubscription(
  workspaceId: string,
  newTierId: string,
  interval: BillingInterval
): Promise<void> {
  const subscription = await getSubscriptionWithWorkspace(workspaceId);

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  if (!subscription.stripeSubscriptionId) {
    throw new Error('No active Stripe subscription found');
  }

  const priceId = getPriceId(newTierId, interval);
  const tier = PRICING_TIERS[newTierId];

  // Update Stripe subscription
  await updateStripeSubscription(subscription.stripeSubscriptionId, {
    priceId,
    prorationBehavior: 'create_prorations',
  });

  // Update database subscription
  await prisma.subscription.update({
    where: { workspaceId },
    data: {
      tier: newTierId as SubscriptionTier,
      stripePriceId: priceId,
      maxCompetitors: tier.limits.competitors,
      maxHashtagTracks: tier.limits.hashtags,
      maxScrapedPosts: tier.limits.scrapes,
      maxAnalysisReports: tier.limits.reports,
      maxTeamMembers: tier.limits.teamMembers,
    },
  });
}

export async function downgradeSubscription(
  workspaceId: string,
  newTierId: string,
  interval: BillingInterval
): Promise<void> {
  const subscription = await getSubscriptionWithWorkspace(workspaceId);

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  if (newTierId === 'FREE') {
    // Downgrade to free - cancel at period end
    if (subscription.stripeSubscriptionId) {
      await cancelStripeSubscription(subscription.stripeSubscriptionId);
    }

    // Update database
    await prisma.subscription.update({
      where: { workspaceId },
      data: {
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.ACTIVE,
        stripePriceId: null,
        cancelAtPeriodEnd: false,
        maxCompetitors: PRICING_TIERS.FREE.limits.competitors,
        maxHashtagTracks: PRICING_TIERS.FREE.limits.hashtags,
        maxScrapedPosts: PRICING_TIERS.FREE.limits.scrapes,
        maxAnalysisReports: PRICING_TIERS.FREE.limits.reports,
        maxTeamMembers: PRICING_TIERS.FREE.limits.teamMembers,
      },
    });
  } else {
    // Downgrade to lower paid tier
    if (!subscription.stripeSubscriptionId) {
      throw new Error('No active Stripe subscription found');
    }

    const priceId = getPriceId(newTierId, interval);
    const tier = PRICING_TIERS[newTierId];

    await updateStripeSubscription(subscription.stripeSubscriptionId, {
      priceId,
      prorationBehavior: 'create_prorations',
    });

    await prisma.subscription.update({
      where: { workspaceId },
      data: {
        tier: newTierId as SubscriptionTier,
        stripePriceId: priceId,
        maxCompetitors: tier.limits.competitors,
        maxHashtagTracks: tier.limits.hashtags,
        maxScrapedPosts: tier.limits.scrapes,
        maxAnalysisReports: tier.limits.reports,
        maxTeamMembers: tier.limits.teamMembers,
      },
    });
  }
}

export async function cancelSubscription(
  workspaceId: string,
  cancelImmediately: boolean = false
): Promise<void> {
  const subscription = await getSubscriptionWithWorkspace(workspaceId);

  if (!subscription?.stripeSubscriptionId) {
    throw new Error('No active Stripe subscription found');
  }

  await cancelStripeSubscription(subscription.stripeSubscriptionId, {
    cancelImmediately,
    invoiceNow: cancelImmediately,
  });

  if (cancelImmediately) {
    // Downgrade to free immediately
    await prisma.subscription.update({
      where: { workspaceId },
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
  } else {
    // Set to cancel at period end
    await prisma.subscription.update({
      where: { workspaceId },
      data: {
        cancelAtPeriodEnd: true,
      },
    });
  }
}

export async function reactivateSubscription(workspaceId: string): Promise<void> {
  const subscription = await getSubscriptionWithWorkspace(workspaceId);

  if (!subscription?.stripeSubscriptionId) {
    throw new Error('No active Stripe subscription found');
  }

  await reactivateStripeSubscription(subscription.stripeSubscriptionId);

  await prisma.subscription.update({
    where: { workspaceId },
    data: {
      cancelAtPeriodEnd: false,
    },
  });
}

// ============================================================================
// Subscription Queries
// ============================================================================

export async function getSubscriptionWithWorkspace(
  workspaceId: string
): Promise<SubscriptionWithRelations | null> {
  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId },
    include: {
      workspace: {
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return subscription as SubscriptionWithRelations | null;
}

export async function getSubscriptionByStripeCustomerId(
  stripeCustomerId: string
): Promise<SubscriptionWithRelations | null> {
  const subscription = await prisma.subscription.findUnique({
    where: { stripeCustomerId },
    include: {
      workspace: {
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return subscription as SubscriptionWithRelations | null;
}

export async function getSubscriptionByStripeSubscriptionId(
  stripeSubscriptionId: string
): Promise<SubscriptionWithRelations | null> {
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId },
    include: {
      workspace: {
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return subscription as SubscriptionWithRelations | null;
}

export async function getDetailedSubscription(
  workspaceId: string
): Promise<SubscriptionDetails | null> {
  const subscription = await getSubscriptionWithWorkspace(workspaceId);

  if (!subscription) {
    return null;
  }

  const tier = PRICING_TIERS[subscription.tier];
  const now = new Date();

  // Calculate days until renewal
  let daysUntilRenewal = 0;
  if (subscription.currentPeriodEnd) {
    const diffTime = subscription.currentPeriodEnd.getTime() - now.getTime();
    daysUntilRenewal = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Get payment method info from Stripe if available
  let paymentMethod = null;
  if (subscription.stripeCustomerId) {
    const methods = await listPaymentMethods(subscription.stripeCustomerId);
    const defaultMethod = methods[0];
    if (defaultMethod && defaultMethod.card) {
      paymentMethod = {
        brand: defaultMethod.card.brand,
        last4: defaultMethod.card.last4,
        expMonth: defaultMethod.card.exp_month,
        expYear: defaultMethod.card.exp_year,
      };
    }
  }

  return {
    subscription,
    tier,
    isActive:
      subscription.status === SubscriptionStatus.ACTIVE ||
      subscription.status === SubscriptionStatus.TRIALING,
    isTrialing: subscription.status === SubscriptionStatus.TRIALING,
    isCanceled:
      subscription.status === SubscriptionStatus.CANCELED ||
      subscription.cancelAtPeriodEnd,
    daysUntilRenewal: Math.max(0, daysUntilRenewal),
    paymentMethod,
  };
}

// ============================================================================
// Database Updates from Stripe Webhooks
// ============================================================================

export async function updateSubscriptionFromStripe(
  workspaceId: string,
  stripeSubscription: {
    id: string;
    status: string;
    current_period_start: number;
    current_period_end: number;
    trial_start?: number | null;
    trial_end?: number | null;
    cancel_at_period_end: boolean;
    canceled_at?: number | null;
    items: {
      data: Array<{
        price: {
          id: string;
        };
      }>;
    };
  }
): Promise<void> {
  const priceId = stripeSubscription.items.data[0]?.price.id;
  const tier = Object.values(PRICING_TIERS).find(
    (t) => t.stripePriceIds.monthly === priceId || t.stripePriceIds.yearly === priceId
  );

  await prisma.subscription.update({
    where: { workspaceId },
    data: {
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: priceId,
      status: stripeSubscription.status as SubscriptionStatus,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      trialStartsAt: stripeSubscription.trial_start
        ? new Date(stripeSubscription.trial_start * 1000)
        : null,
      trialEndsAt: stripeSubscription.trial_end
        ? new Date(stripeSubscription.trial_end * 1000)
        : null,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      canceledAt: stripeSubscription.canceled_at
        ? new Date(stripeSubscription.canceled_at * 1000)
        : null,
      ...(tier && {
        tier: tier.id as SubscriptionTier,
        maxCompetitors: tier.limits.competitors,
        maxHashtagTracks: tier.limits.hashtags,
        maxScrapedPosts: tier.limits.scrapes,
        maxAnalysisReports: tier.limits.reports,
        maxTeamMembers: tier.limits.teamMembers,
      }),
    },
  });
}

export async function handlePaymentFailure(
  workspaceId: string,
  invoiceId: string
): Promise<void> {
  await prisma.subscription.update({
    where: { workspaceId },
    data: {
      status: SubscriptionStatus.PAST_DUE,
    },
  });
}

export async function handlePaymentSuccess(
  workspaceId: string,
  invoiceId: string
): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId },
  });

  if (subscription?.status === SubscriptionStatus.PAST_DUE) {
    await prisma.subscription.update({
      where: { workspaceId },
      data: {
        status: SubscriptionStatus.ACTIVE,
      },
    });
  }
}

// ============================================================================
// Subscription Comparison
// ============================================================================

export function compareSubscriptions(
  currentTier: SubscriptionTier,
  newTier: SubscriptionTier
): {
  isUpgrade: boolean;
  isDowngrade: boolean;
  isSame: boolean;
  priceDifference: number;
} {
  const tierOrder = [SubscriptionTier.FREE, SubscriptionTier.PRO, SubscriptionTier.AGENCY];
  const currentIndex = tierOrder.indexOf(currentTier);
  const newIndex = tierOrder.indexOf(newTier);

  const currentPrice = PRICING_TIERS[currentTier]?.price || 0;
  const newPrice = PRICING_TIERS[newTier]?.price || 0;

  return {
    isUpgrade: newIndex > currentIndex,
    isDowngrade: newIndex < currentIndex,
    isSame: newIndex === currentIndex,
    priceDifference: newPrice - currentPrice,
  };
}
