/**
 * UpgradeModal Component
 * 
 * Modal dialog for upgrading subscription plans.
 * Shows pricing comparison and handles the upgrade flow.
 */

'use client';

import { useState } from 'react';
import { X, Check, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { usePricingTiers, useRedirectToCheckout, useTierComparison, useSubscription } from '@/hooks/use-subscription';
import type { BillingInterval, SubscriptionTier } from '@/types/billing';

interface UpgradeModalProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  targetTier?: Exclude<SubscriptionTier, 'FREE'>;
}

export function UpgradeModal({ workspaceId, isOpen, onClose, targetTier }: UpgradeModalProps) {
  const { data: subscription } = useSubscription(workspaceId);
  const { data: tiers, isLoading: tiersLoading } = usePricingTiers();
  const { redirect, isLoading: isRedirecting } = useRedirectToCheckout();

  const [interval, setInterval] = useState<BillingInterval>('month');
  const [selectedTier, setSelectedTier] = useState<Exclude<SubscriptionTier, 'FREE'>>(targetTier || 'PRO');

  const currentTier = subscription?.subscription.tier || 'FREE';
  const tierList = tiers ? Object.values(tiers).filter(t => t.id !== 'FREE') : [];

  const handleUpgrade = async () => {
    await redirect(workspaceId, selectedTier, interval);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary-500" />
            Upgrade Your Plan
          </DialogTitle>
          <DialogDescription>
            Choose the plan that best fits your needs. Upgrade or downgrade anytime.
          </DialogDescription>
        </DialogHeader>

        {/* Billing Interval Toggle */}
        <div className="flex justify-center py-4">
          <div className="inline-flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
            <button
              onClick={() => setInterval('month')}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-all',
                interval === 'month'
                  ? 'bg-white dark:bg-neutral-700 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval('year')}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2',
                interval === 'year'
                  ? 'bg-white dark:bg-neutral-700 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400'
              )}
            >
              Yearly
              <Badge variant="success" size="sm">Save 10%</Badge>
            </button>
          </div>
        </div>

        {/* Tier Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tierList.map((tier) => (
            <TierOption
              key={tier.id}
              tier={tier}
              interval={interval}
              isSelected={selectedTier === tier.id}
              isCurrent={currentTier === tier.id}
              currentTier={currentTier}
              onSelect={() => setSelectedTier(tier.id as Exclude<SubscriptionTier, 'FREE'>)}
            />
          ))}
        </div>

        {/* Selected Tier Details */}
        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4">
          <h4 className="text-sm font-medium text-neutral-900 dark:text-white mb-3">
            What's included in {tiers?.[selectedTier]?.name}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {tiers?.[selectedTier]?.features.slice(0, 6).map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                <Check className="h-4 w-4 text-success-500 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={onClose} className="sm:w-auto w-full">
            Cancel
          </Button>
          <Button
            onClick={handleUpgrade}
            loading={isRedirecting}
            disabled={selectedTier === currentTier}
            className="sm:w-auto w-full"
          >
            {selectedTier === currentTier 
              ? 'Current Plan' 
              : `Upgrade to ${tiers?.[selectedTier]?.name}`}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Tier Option Component
// ============================================================================

interface TierOptionProps {
  tier: {
    id: string;
    name: string;
    description: string;
    price: number;
    yearlyPrice: number;
    features: string[];
    popular?: boolean;
    limits: {
      competitors: number;
      hashtags: number;
      scrapes: number;
      teamMembers: number;
    };
  };
  interval: BillingInterval;
  isSelected: boolean;
  isCurrent: boolean;
  currentTier: string;
  onSelect: () => void;
}

function TierOption({ tier, interval, isSelected, isCurrent, currentTier, onSelect }: TierOptionProps) {
  const price = interval === 'year' ? tier.yearlyPrice : tier.price;
  const { data: comparison } = useTierComparison(
    currentTier as SubscriptionTier,
    tier.id as SubscriptionTier
  );

  return (
    <div
      onClick={onSelect}
      className={cn(
        'relative p-4 rounded-lg border-2 cursor-pointer transition-all',
        isSelected
          ? 'border-primary-500 dark:border-primary-400 bg-primary-50/50 dark:bg-primary-900/20'
          : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700',
        isCurrent && 'opacity-75'
      )}
    >
      {/* Badges */}
      <div className="absolute top-2 right-2 flex gap-1">
        {tier.popular && (
          <Badge variant="primary" size="sm">Popular</Badge>
        )}
        {isCurrent && (
          <Badge variant="success" size="sm">Current</Badge>
        )}
      </div>

      <div className="flex items-start gap-3">
        <div className={cn(
          'mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
          isSelected
            ? 'border-primary-500 bg-primary-500'
            : 'border-neutral-300 dark:border-neutral-600'
        )}>
          {isSelected && <Check className="h-3 w-3 text-white" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <h3 className="font-semibold text-neutral-900 dark:text-white">
              {tier.name}
            </h3>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            {tier.description}
          </p>

          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                {formatCurrency(price / (interval === 'year' ? 12 : 1))}
              </span>
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                /month
              </span>
            </div>
            {interval === 'year' && (
              <p className="text-xs text-success-600 dark:text-success-400 mt-0.5">
                {formatCurrency(price)} billed annually
              </p>
            )}
          </div>

          {/* Comparison Badge */}
          {comparison?.data && !isCurrent && (
            <div className="mt-2">
              {comparison.data.isUpgrade ? (
                <span className="text-xs text-success-600 dark:text-success-400">
                  +{formatCurrency(comparison.data.priceDifference)}/mo from current plan
                </span>
              ) : comparison.data.isDowngrade ? (
                <span className="text-xs text-amber-600 dark:text-amber-400">
                  {formatCurrency(Math.abs(comparison.data.priceDifference))}/mo less than current plan
                </span>
              ) : null}
            </div>
          )}

          {/* Limits Summary */}
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div className="text-neutral-600 dark:text-neutral-400">
              <span className="font-medium text-neutral-900 dark:text-white">{tier.limits.competitors}</span> competitors
            </div>
            <div className="text-neutral-600 dark:text-neutral-400">
              <span className="font-medium text-neutral-900 dark:text-white">{tier.limits.hashtags}</span> hashtags
            </div>
            <div className="text-neutral-600 dark:text-neutral-400">
              <span className="font-medium text-neutral-900 dark:text-white">{tier.limits.scrapes.toLocaleString()}</span> scrapes
            </div>
            <div className="text-neutral-600 dark:text-neutral-400">
              <span className="font-medium text-neutral-900 dark:text-white">{tier.limits.teamMembers}</span> team
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Inline Upgrade Prompt (for use in other components)
// ============================================================================

interface UpgradePromptProps {
  feature: string;
  currentTier: SubscriptionTier;
  onUpgrade: () => void;
  className?: string;
}

export function UpgradePrompt({ feature, currentTier, onUpgrade, className }: UpgradePromptProps) {
  return (
    <div className={cn(
      'rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4',
      className
    )}>
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-amber-900 dark:text-amber-100">
            Upgrade Required
          </h4>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
            {feature} is not available on your {currentTier} plan. Upgrade to unlock this feature.
          </p>
          <Button
            variant="warning"
            size="sm"
            className="mt-3"
            onClick={onUpgrade}
          >
            Upgrade Now
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Feature Locked Overlay
// ============================================================================

interface FeatureLockedProps {
  feature: string;
  requiredTier: string;
  onUpgrade: () => void;
  className?: string;
}

export function FeatureLocked({ feature, requiredTier, onUpgrade, className }: FeatureLockedProps) {
  return (
    <div className={cn(
      'relative rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/50 p-6',
      className
    )}>
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 mb-3">
          <Sparkles className="h-6 w-6 text-neutral-400" />
        </div>
        <h4 className="text-sm font-medium text-neutral-900 dark:text-white">
          {feature}
        </h4>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Available on {requiredTier} and above
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-3"
          onClick={onUpgrade}
        >
          Upgrade to Unlock
        </Button>
      </div>
    </div>
  );
}
