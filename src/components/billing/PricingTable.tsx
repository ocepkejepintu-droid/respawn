/**
 * PricingTable Component
 * 
 * Displays a comparison of all pricing tiers with features and pricing.
 * Supports monthly/yearly toggle and highlights the recommended tier.
 */

'use client';

import { useState } from 'react';
import { Check, X, Sparkles, Loader2 } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePricingTiers, useRedirectToCheckout } from '@/hooks/use-subscription';
import type { BillingInterval, SubscriptionTier } from '@/types/billing';

interface PricingTableProps {
  currentTierId?: SubscriptionTier;
  workspaceId?: string;
  className?: string;
}

export function PricingTable({ currentTierId = 'FREE', workspaceId, className }: PricingTableProps) {
  const [interval, setInterval] = useState<BillingInterval>('month');
  const { data: tiers, isLoading } = usePricingTiers();
  const { redirect, isLoading: isRedirecting } = useRedirectToCheckout();

  const handleUpgrade = async (tierId: Exclude<SubscriptionTier, 'FREE'>) => {
    if (!workspaceId) return;
    await redirect(workspaceId, tierId, interval);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const tierList = tiers ? Object.values(tiers) : [];

  return (
    <div className={cn('w-full', className)}>
      {/* Billing Interval Toggle */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
          <button
            onClick={() => setInterval('month')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-all',
              interval === 'month'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval('year')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2',
              interval === 'year'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            )}
          >
            Yearly
            <Badge variant="success" size="sm">
              Save 10%
            </Badge>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {tierList.map((tier) => (
          <PricingCard
            key={tier.id}
            tier={tier}
            interval={interval}
            isCurrent={currentTierId === tier.id}
            onUpgrade={tier.id !== 'FREE' ? () => handleUpgrade(tier.id as Exclude<SubscriptionTier, 'FREE'>) : undefined}
            isLoading={isRedirecting}
          />
        ))}
      </div>

      {/* Money-back Guarantee */}
      <p className="text-center text-sm text-neutral-500 dark:text-neutral-400 mt-8">
        30-day money-back guarantee. Cancel anytime. No questions asked.
      </p>
    </div>
  );
}

// ============================================================================
// Pricing Card Component
// ============================================================================

interface PricingCardProps {
  tier: {
    id: string;
    name: string;
    description: string;
    price: number;
    yearlyPrice: number;
    features: string[];
    notIncluded: string[];
    cta: string;
    popular?: boolean;
    limits: {
      competitors: number;
      hashtags: number;
      scrapes: number;
      teamMembers: number;
      reports: number;
    };
  };
  interval: BillingInterval;
  isCurrent: boolean;
  onUpgrade?: () => void;
  isLoading: boolean;
}

function PricingCard({ tier, interval, isCurrent, onUpgrade, isLoading }: PricingCardProps) {
  const price = interval === 'year' ? tier.yearlyPrice : tier.price;
  const isFree = tier.price === 0;

  return (
    <Card
      className={cn(
        'relative flex flex-col h-full',
        tier.popular && 'ring-2 ring-primary-500 dark:ring-primary-400'
      )}
    >
      {/* Popular Badge */}
      {tier.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="primary" className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Most Popular
          </Badge>
        </div>
      )}

      {/* Current Plan Badge */}
      {isCurrent && (
        <div className="absolute -top-3 right-4">
          <Badge variant="success">Current Plan</Badge>
        </div>
      )}

      <CardHeader className="text-center pb-4">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
          {tier.name}
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          {tier.description}
        </p>
        <div className="mt-4">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold text-neutral-900 dark:text-white">
              {isFree ? 'Free' : formatCurrency(price / (interval === 'year' ? 12 : 1))}
            </span>
            {!isFree && (
              <span className="text-neutral-500 dark:text-neutral-400">
                /month
              </span>
            )}
          </div>
          {interval === 'year' && !isFree && (
            <p className="text-sm text-success-600 dark:text-success-400 mt-1">
              {formatCurrency(price)} billed annually
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        {/* Limits Summary */}
        <div className="grid grid-cols-2 gap-2 mb-6 text-sm">
          <div className="text-center p-2 bg-neutral-50 dark:bg-neutral-800 rounded">
            <div className="font-semibold text-neutral-900 dark:text-white">
              {tier.limits.competitors}
            </div>
            <div className="text-neutral-500 dark:text-neutral-400">Competitors</div>
          </div>
          <div className="text-center p-2 bg-neutral-50 dark:bg-neutral-800 rounded">
            <div className="font-semibold text-neutral-900 dark:text-white">
              {tier.limits.hashtags}
            </div>
            <div className="text-neutral-500 dark:text-neutral-400">Hashtags</div>
          </div>
          <div className="text-center p-2 bg-neutral-50 dark:bg-neutral-800 rounded">
            <div className="font-semibold text-neutral-900 dark:text-white">
              {tier.limits.scrapes.toLocaleString()}
            </div>
            <div className="text-neutral-500 dark:text-neutral-400">Scrapes/mo</div>
          </div>
          <div className="text-center p-2 bg-neutral-50 dark:bg-neutral-800 rounded">
            <div className="font-semibold text-neutral-900 dark:text-white">
              {tier.limits.teamMembers}
            </div>
            <div className="text-neutral-500 dark:text-neutral-400">Team</div>
          </div>
        </div>

        {/* Features List */}
        <ul className="space-y-3">
          {tier.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className="h-5 w-5 text-success-600 dark:text-success-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-neutral-600 dark:text-neutral-300">
                {feature}
              </span>
            </li>
          ))}
          {tier.notIncluded.map((feature, index) => (
            <li key={`not-${index}`} className="flex items-start gap-3 opacity-50">
              <X className="h-5 w-5 text-neutral-400 dark:text-neutral-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-neutral-500 dark:text-neutral-500 line-through">
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          variant={tier.popular ? 'primary' : 'secondary'}
          size="lg"
          className="w-full"
          disabled={isCurrent || isLoading || !onUpgrade}
          onClick={onUpgrade}
          loading={isLoading}
        >
          {isCurrent
            ? 'Current Plan'
            : isFree
            ? 'Get Started'
            : tier.cta}
        </Button>
      </CardFooter>
    </Card>
  );
}

// ============================================================================
// Compact Pricing Table (for use in other pages)
// ============================================================================

interface CompactPricingTableProps {
  currentTierId?: SubscriptionTier;
  className?: string;
}

export function CompactPricingTable({ currentTierId = 'FREE', className }: CompactPricingTableProps) {
  const { data: tiers, isLoading } = usePricingTiers();

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
      </div>
    );
  }

  const tierList = tiers ? Object.values(tiers) : [];

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-200 dark:border-neutral-800">
            <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Plan
            </th>
            <th className="text-center py-3 px-4 text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Price
            </th>
            <th className="text-center py-3 px-4 text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Competitors
            </th>
            <th className="text-center py-3 px-4 text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Hashtags
            </th>
            <th className="text-center py-3 px-4 text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Scrapes/mo
            </th>
          </tr>
        </thead>
        <tbody>
          {tierList.map((tier) => (
            <tr
              key={tier.id}
              className={cn(
                'border-b border-neutral-100 dark:border-neutral-800 last:border-0',
                currentTierId === tier.id && 'bg-primary-50/50 dark:bg-primary-900/10'
              )}
            >
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-neutral-900 dark:text-white">
                    {tier.name}
                  </span>
                  {currentTierId === tier.id && (
                    <Badge variant="success" size="sm">Current</Badge>
                  )}
                  {tier.popular && (
                    <Badge variant="primary" size="sm">Popular</Badge>
                  )}
                </div>
              </td>
              <td className="text-center py-3 px-4 text-neutral-900 dark:text-white">
                {tier.price === 0 ? 'Free' : `$${tier.price}/mo`}
              </td>
              <td className="text-center py-3 px-4 text-neutral-600 dark:text-neutral-400">
                {tier.limits.competitors}
              </td>
              <td className="text-center py-3 px-4 text-neutral-600 dark:text-neutral-400">
                {tier.limits.hashtags}
              </td>
              <td className="text-center py-3 px-4 text-neutral-600 dark:text-neutral-400">
                {tier.limits.scrapes.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
