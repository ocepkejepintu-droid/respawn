/**
 * PlanFeatureList Component
 * 
 * Displays a comprehensive list of features for each plan tier.
 * Useful for comparing plans and highlighting feature differences.
 */

'use client';

import { Check, X, HelpCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePricingTiers } from '@/hooks/use-subscription';
import type { SubscriptionTier } from '@/types/billing';

interface PlanFeatureListProps {
  currentTier?: SubscriptionTier;
  highlightTier?: SubscriptionTier;
  showComparison?: boolean;
  className?: string;
}

// All features across all tiers
const ALL_FEATURES = [
  {
    key: 'competitors',
    label: 'Competitor Tracking',
    description: 'Number of competitors you can track simultaneously',
    tiers: { FREE: '3', PRO: '10', AGENCY: '50' },
  },
  {
    key: 'hashtags',
    label: 'Hashtag Monitors',
    description: 'Number of hashtags you can monitor',
    tiers: { FREE: '5', PRO: '20', AGENCY: '100' },
  },
  {
    key: 'scrapes',
    label: 'Monthly Scrapes',
    description: 'Number of posts you can scrape per month',
    tiers: { FREE: '100', PRO: '1,000', AGENCY: '5,000' },
  },
  {
    key: 'reports',
    label: 'Analysis Reports',
    description: 'Number of detailed reports you can generate',
    tiers: { FREE: '5', PRO: '50', AGENCY: '500' },
  },
  {
    key: 'team',
    label: 'Team Members',
    description: 'Number of team members you can invite',
    tiers: { FREE: '1', PRO: '5', AGENCY: '20' },
  },
  {
    key: 'history',
    label: 'Data History',
    description: 'How long your data is retained',
    tiers: { FREE: '7 days', PRO: '90 days', AGENCY: 'Unlimited' },
  },
  {
    key: 'analytics',
    label: 'Advanced Analytics',
    description: 'Detailed analytics and insights',
    tiers: { FREE: 'Basic', PRO: true, AGENCY: true },
  },
  {
    key: 'export',
    label: 'Export to CSV/PDF',
    description: 'Export your data and reports',
    tiers: { FREE: false, PRO: true, AGENCY: true },
  },
  {
    key: 'api',
    label: 'API Access',
    description: 'Programmatic access to your data',
    tiers: { FREE: false, PRO: false, AGENCY: true },
  },
  {
    key: 'whitelabel',
    label: 'White-label Reports',
    description: 'Remove RESPAWN Analytics branding from reports',
    tiers: { FREE: false, PRO: false, AGENCY: true },
  },
  {
    key: 'support',
    label: 'Support',
    description: 'Customer support options',
    tiers: { FREE: 'Email', PRO: 'Priority Email', AGENCY: 'Priority Chat & Email' },
  },
  {
    key: 'accountManager',
    label: 'Dedicated Account Manager',
    description: 'Personal account manager for your team',
    tiers: { FREE: false, PRO: false, AGENCY: true },
  },
] as const;

export function PlanFeatureList({ 
  currentTier = 'FREE', 
  highlightTier,
  showComparison = true,
  className 
}: PlanFeatureListProps) {
  const { data: tiers, isLoading } = usePricingTiers();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
        </CardContent>
      </Card>
    );
  }

  const tierIds: SubscriptionTier[] = ['FREE', 'PRO', 'AGENCY'];
  const tierNames = {
    FREE: 'Free',
    PRO: 'Pro',
    AGENCY: 'Agency',
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Plan Comparison</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800">
                <th className="text-left py-4 px-6 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                  Feature
                </th>
                {tierIds.map((tier) => (
                  <th
                    key={tier}
                    className={cn(
                      'text-center py-4 px-4 text-sm font-medium',
                      highlightTier === tier
                        ? 'bg-primary-50/50 dark:bg-primary-900/10 text-primary-900 dark:text-primary-100'
                        : 'text-neutral-900 dark:text-white',
                      currentTier === tier && 'border-b-2 border-primary-500'
                    )}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span>{tierNames[tier]}</span>
                      {currentTier === tier && (
                        <Badge variant="success" size="sm">Current</Badge>
                      )}
                      {highlightTier === tier && currentTier !== tier && (
                        <Badge variant="primary" size="sm">Recommended</Badge>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {ALL_FEATURES.map((feature) => (
                <tr 
                  key={feature.key}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                >
                  <td className="py-4 px-6">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 cursor-help">
                            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                              {feature.label}
                            </span>
                            <HelpCircle className="h-4 w-4 text-neutral-400" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{feature.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </td>
                  {tierIds.map((tier) => {
                    const value = feature.tiers[tier];
                    const isAvailable = value !== false;
                    const isString = typeof value === 'string';

                    return (
                      <td
                        key={tier}
                        className={cn(
                          'py-4 px-4 text-center',
                          highlightTier === tier && 'bg-primary-50/30 dark:bg-primary-900/5'
                        )}
                      >
                        {isString ? (
                          <span className={cn(
                            'text-sm',
                            tier === currentTier ? 'font-medium text-neutral-900 dark:text-white' : 'text-neutral-600 dark:text-neutral-400'
                          )}>
                            {value}
                          </span>
                        ) : isAvailable ? (
                          <Check className={cn(
                            'h-5 w-5 mx-auto',
                            tier === currentTier ? 'text-primary-600' : 'text-success-600'
                          )} />
                        ) : (
                          <X className="h-5 w-5 mx-auto text-neutral-300 dark:text-neutral-700" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            {showComparison && (
              <tfoot>
                <tr className="border-t-2 border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                  <td className="py-4 px-6 text-sm font-medium text-neutral-900 dark:text-white">
                    Price
                  </td>
                  {tierIds.map((tier) => (
                    <td
                      key={tier}
                      className={cn(
                        'py-4 px-4 text-center',
                        highlightTier === tier && 'bg-primary-50/50 dark:bg-primary-900/10'
                      )}
                    >
                      <span className="text-lg font-bold text-neutral-900 dark:text-white">
                        {tier === 'FREE' ? 'Free' : `$${tiers?.[tier]?.price}`}
                      </span>
                      {tier !== 'FREE' && (
                        <span className="text-sm text-neutral-500 dark:text-neutral-400">/mo</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Simple Feature List (for use in pricing cards)
// ============================================================================

interface SimpleFeatureListProps {
  features: string[];
  notIncluded?: string[];
  showIncluded?: boolean;
  className?: string;
}

export function SimpleFeatureList({ 
  features, 
  notIncluded = [], 
  showIncluded = true,
  className 
}: SimpleFeatureListProps) {
  return (
    <ul className={cn('space-y-3', className)}>
      {features.map((feature, index) => (
        <li key={index} className="flex items-start gap-3">
          <Check className="h-5 w-5 text-success-600 dark:text-success-400 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-neutral-600 dark:text-neutral-300">
            {feature}
          </span>
        </li>
      ))}
      {showIncluded && notIncluded.map((feature, index) => (
        <li key={`not-${index}`} className="flex items-start gap-3 opacity-50">
          <X className="h-5 w-5 text-neutral-400 dark:text-neutral-600 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-neutral-500 dark:text-neutral-500 line-through">
            {feature}
          </span>
        </li>
      ))}
    </ul>
  );
}

// ============================================================================
// Feature Badge (inline feature indicator)
// ============================================================================

interface FeatureBadgeProps {
  feature: string;
  tier: SubscriptionTier;
  currentTier: SubscriptionTier;
  className?: string;
}

export function FeatureBadge({ feature, tier, currentTier, className }: FeatureBadgeProps) {
  const tierOrder: SubscriptionTier[] = ['FREE', 'PRO', 'AGENCY'];
  const featureTierIndex = tierOrder.indexOf(tier);
  const currentTierIndex = tierOrder.indexOf(currentTier);
  const hasFeature = currentTierIndex >= featureTierIndex;

  if (hasFeature) {
    return (
      <Badge variant="success" size="sm" className={className}>
        <Check className="h-3 w-3 mr-1" />
        Included
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" size="sm" className={className}>
      <X className="h-3 w-3 mr-1" />
      {tier} required
    </Badge>
  );
}
