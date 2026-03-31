/**
 * Subscription Hooks
 * 
 * React hooks for managing subscriptions, usage, and billing operations.
 * Uses tRPC for data fetching and mutations.
 */

'use client';

import { useCallback } from 'react';
import { trpc } from '@/trpc/client';
import type {
  BillingInterval,
  SubscriptionTier,
  ResourceType,
  DetailedSubscription,
  UsageStats,
  QuotaWarning,
  Invoice,
} from '@/types/billing';

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook to get subscription details for a workspace
 */
export function useSubscription(workspaceId: string) {
  return trpc.billing.getSubscription.useQuery(
    { workspaceId },
    {
      enabled: !!workspaceId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}

/**
 * Hook to get pricing tiers
 */
export function usePricingTiers() {
  return trpc.billing.getPricingTiers.useQuery();
}

/**
 * Hook to get usage statistics
 */
export function useUsageStats(workspaceId: string) {
  return trpc.billing.getUsage.useQuery(
    { workspaceId },
    {
      enabled: !!workspaceId,
      staleTime: 60 * 1000, // 1 minute
    }
  );
}

/**
 * Hook to get quota warnings
 */
export function useQuotaWarnings(workspaceId: string) {
  return trpc.billing.getQuotaWarnings.useQuery(
    { workspaceId },
    {
      enabled: !!workspaceId,
      staleTime: 60 * 1000,
    }
  );
}

/**
 * Hook to get billing history
 */
export function useBillingHistory(
  workspaceId: string,
  params?: { limit?: number; cursor?: string }
) {
  return trpc.billing.getBillingHistory.useQuery(
    {
      workspaceId,
      limit: params?.limit ?? 12,
      cursor: params?.cursor,
    },
    {
      enabled: !!workspaceId,
      staleTime: 5 * 60 * 1000,
    }
  );
}

/**
 * Hook to get payment methods
 */
export function usePaymentMethods(workspaceId: string) {
  return trpc.billing.getPaymentMethods.useQuery(
    { workspaceId },
    {
      enabled: !!workspaceId,
      staleTime: 5 * 60 * 1000,
    }
  );
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook to create a checkout session for upgrading
 */
export function useCreateCheckout() {
  const utils = trpc.useUtils();

  return trpc.billing.createCheckout.useMutation({
    onSuccess: () => {
      // Invalidate subscription cache
      utils.billing.getSubscription.invalidate();
    },
  });
}

/**
 * Hook to create a billing portal session
 */
export function useCreatePortalSession() {
  return trpc.billing.createPortalSession.useMutation();
}

/**
 * Hook to upgrade subscription
 */
export function useUpgradeSubscription() {
  const utils = trpc.useUtils();

  return trpc.billing.upgrade.useMutation({
    onSuccess: () => {
      utils.billing.getSubscription.invalidate();
      utils.billing.getUsage.invalidate();
    },
  });
}

/**
 * Hook to downgrade subscription
 */
export function useDowngradeSubscription() {
  const utils = trpc.useUtils();

  return trpc.billing.downgrade.useMutation({
    onSuccess: () => {
      utils.billing.getSubscription.invalidate();
      utils.billing.getUsage.invalidate();
    },
  });
}

/**
 * Hook to cancel subscription
 */
export function useCancelSubscription() {
  const utils = trpc.useUtils();

  return trpc.billing.cancel.useMutation({
    onSuccess: () => {
      utils.billing.getSubscription.invalidate();
    },
  });
}

/**
 * Hook to reactivate subscription
 */
export function useReactivateSubscription() {
  const utils = trpc.useUtils();

  return trpc.billing.reactivate.useMutation({
    onSuccess: () => {
      utils.billing.getSubscription.invalidate();
    },
  });
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook to check if user has quota for a specific resource
 */
export function useCheckQuota(workspaceId: string, resource: ResourceType, requested: number = 1) {
  return trpc.billing.checkQuota.useQuery(
    { workspaceId, resource, requested },
    {
      enabled: !!workspaceId,
      staleTime: 30 * 1000, // 30 seconds
    }
  );
}

/**
 * Hook to redirect to checkout
 */
export function useRedirectToCheckout() {
  const createCheckout = useCreateCheckout();

  const redirect = useCallback(
    async (workspaceId: string, tierId: Exclude<SubscriptionTier, 'FREE'>, interval: BillingInterval) => {
      try {
        const { url } = await createCheckout.mutateAsync({
          workspaceId,
          tierId,
          interval,
        });

        if (url) {
          window.location.href = url;
        } else {
          throw new Error('No checkout URL returned');
        }
      } catch (error) {
        console.error('Failed to create checkout session:', error);
        throw error;
      }
    },
    [createCheckout]
  );

  return {
    redirect,
    isLoading: createCheckout.isPending,
    error: createCheckout.error,
  };
}

/**
 * Hook to redirect to billing portal
 */
export function useRedirectToPortal() {
  const createPortalSession = useCreatePortalSession();

  const redirect = useCallback(
    async (workspaceId: string) => {
      try {
        const { url } = await createPortalSession.mutateAsync({ workspaceId });

        if (url) {
          window.location.href = url;
        } else {
          throw new Error('No portal URL returned');
        }
      } catch (error) {
        console.error('Failed to create portal session:', error);
        throw error;
      }
    },
    [createPortalSession]
  );

  return {
    redirect,
    isLoading: createPortalSession.isPending,
    error: createPortalSession.error,
  };
}

// ============================================================================
// Combined Hooks
// ============================================================================

interface SubscriptionStatus {
  subscription: DetailedSubscription | null | undefined;
  usage: UsageStats | null | undefined;
  warnings: QuotaWarning[] | null | undefined;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to get all subscription-related data at once
 */
export function useSubscriptionStatus(workspaceId: string): SubscriptionStatus {
  const subscriptionQuery = useSubscription(workspaceId);
  const usageQuery = useUsageStats(workspaceId);
  const warningsQuery = useQuotaWarnings(workspaceId);

  return {
    subscription: subscriptionQuery.data,
    usage: usageQuery.data,
    warnings: warningsQuery.data,
    isLoading: subscriptionQuery.isLoading || usageQuery.isLoading || warningsQuery.isLoading,
    error: (subscriptionQuery.error || usageQuery.error || warningsQuery.error) as Error | null,
  };
}

/**
 * Hook to determine if user can perform an action based on quota
 */
export function useCanPerformAction(
  workspaceId: string,
  resource: ResourceType,
  requested: number = 1
): {
  canPerform: boolean;
  isLoading: boolean;
  current: number;
  limit: number;
} {
  const { data, isLoading } = useCheckQuota(workspaceId, resource, requested);

  return {
    canPerform: data?.allowed ?? false,
    isLoading,
    current: data?.current ?? 0,
    limit: data?.limit ?? 0,
  };
}

/**
 * Hook to get tier comparison
 */
export function useTierComparison(currentTier: SubscriptionTier, newTier: SubscriptionTier) {
  return trpc.billing.compareTiers.useQuery(
    { currentTier, newTier },
    {
      enabled: !!currentTier && !!newTier,
    }
  );
}

// ============================================================================
// Type Guards
// ============================================================================

export function isActiveSubscription(subscription?: DetailedSubscription | null): boolean {
  if (!subscription) return false;
  return subscription.isActive;
}

export function isTrialingSubscription(subscription?: DetailedSubscription | null): boolean {
  if (!subscription) return false;
  return subscription.isTrialing;
}

export function isCanceledSubscription(subscription?: DetailedSubscription | null): boolean {
  if (!subscription) return false;
  return subscription.isCanceled;
}

export function hasFeature(
  subscription: DetailedSubscription | null | undefined,
  feature: string
): boolean {
  if (!subscription) return false;
  return subscription.tier.features.includes(feature);
}
