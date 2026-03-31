/**
 * CurrentPlanCard Component
 * 
 * Displays the current subscription plan with status, renewal date,
 * and quick actions for managing the subscription.
 */

'use client';

import { CreditCard, Calendar, AlertTriangle, Loader2 } from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscription, useRedirectToPortal } from '@/hooks/use-subscription';

interface CurrentPlanCardProps {
  workspaceId: string;
  className?: string;
}

export function CurrentPlanCard({ workspaceId, className }: CurrentPlanCardProps) {
  const { data: subscription, isLoading, error } = useSubscription(workspaceId);
  const { redirect, isLoading: isPortalLoading } = useRedirectToPortal();

  if (isLoading) {
    return (
      <Card className={cn('h-full', className)}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
        </CardContent>
      </Card>
    );
  }

  if (error || !subscription) {
    return (
      <Card className={cn('h-full', className)}>
        <CardContent className="flex items-center justify-center py-12 text-neutral-500">
          Failed to load subscription details
        </CardContent>
      </Card>
    );
  }

  const { subscription: sub, tier, isActive, isTrialing, isCanceled, daysUntilRenewal, paymentMethod } = subscription;

  const handleManageBilling = async () => {
    await redirect(workspaceId);
  };

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Current Plan</CardTitle>
            <CardDescription>Your subscription details</CardDescription>
          </div>
          <PlanStatusBadge 
            status={sub.status} 
            isTrialing={isTrialing} 
            isCanceled={isCanceled}
            cancelAtPeriodEnd={sub.cancelAtPeriodEnd}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Plan Info */}
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <div className="text-xl font-bold text-neutral-900 dark:text-white">
              {tier.name}
            </div>
            <div className="text-sm text-neutral-500 dark:text-neutral-400">
              {tier.price === 0 
                ? 'Free forever' 
                : `${formatCurrency(tier.price)}/month`}
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {isTrialing && sub.trialEndsAt && (
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Trial Period
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Your trial ends on {formatDate(sub.trialEndsAt)}. 
                  Upgrade to keep your access.
                </p>
              </div>
            </div>
          </div>
        )}

        {isCanceled && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                  Subscription Canceled
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Your subscription will end on {sub.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : 'N/A'}.
                  You can reactivate anytime before then.
                </p>
              </div>
            </div>
          </div>
        )}

        {sub.cancelAtPeriodEnd && !isCanceled && (
          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                  Canceling Soon
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Your subscription will cancel on {sub.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : 'N/A'}.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Renewal Info */}
        {isActive && !isCanceled && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500 dark:text-neutral-400">Renewal date</span>
              <span className="font-medium text-neutral-900 dark:text-white">
                {sub.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : 'N/A'}
              </span>
            </div>
            {daysUntilRenewal > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">Days until renewal</span>
                <span className="font-medium text-neutral-900 dark:text-white">
                  {daysUntilRenewal} days
                </span>
              </div>
            )}
          </div>
        )}

        {/* Limits Summary */}
        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4">
          <h4 className="text-sm font-medium text-neutral-900 dark:text-white mb-3">
            Plan Limits
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <LimitItem label="Competitors" used={sub.usedCompetitorSlots} limit={sub.maxCompetitors} />
            <LimitItem label="Hashtags" used={sub.usedHashtagTracks} limit={sub.maxHashtagTracks} />
            <LimitItem label="Scrapes" used={sub.usedScrapedPosts} limit={sub.maxScrapedPosts} />
            <LimitItem label="Reports" used={sub.usedAnalysisReports} limit={sub.maxAnalysisReports} />
          </div>
        </div>

        {/* Payment Method */}
        {paymentMethod && tier.price > 0 && (
          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4">
            <h4 className="text-sm font-medium text-neutral-900 dark:text-white mb-2">
              Payment Method
            </h4>
            <div className="flex items-center gap-3">
              <div className="h-8 w-12 rounded bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs font-medium uppercase">
                {paymentMethod.brand}
              </div>
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                •••• {paymentMethod.last4}
              </span>
              <span className="text-sm text-neutral-500 dark:text-neutral-500">
                Expires {paymentMethod.expMonth}/{paymentMethod.expYear}
              </span>
            </div>
          </div>
        )}
      </CardContent>

      {tier.price > 0 && (
        <CardFooter>
          <Button
            variant="secondary"
            className="w-full"
            onClick={handleManageBilling}
            loading={isPortalLoading}
          >
            Manage Subscription
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

interface PlanStatusBadgeProps {
  status: string;
  isTrialing: boolean;
  isCanceled: boolean;
  cancelAtPeriodEnd: boolean;
}

function PlanStatusBadge({ status, isTrialing, isCanceled, cancelAtPeriodEnd }: PlanStatusBadgeProps) {
  if (isCanceled) {
    return <Badge variant="danger">Canceled</Badge>;
  }

  if (cancelAtPeriodEnd) {
    return <Badge variant="warning">Ending Soon</Badge>;
  }

  if (isTrialing) {
    return <Badge variant="primary">Trial</Badge>;
  }

  if (status === 'ACTIVE') {
    return <Badge variant="success">Active</Badge>;
  }

  if (status === 'PAST_DUE') {
    return <Badge variant="warning">Past Due</Badge>;
  }

  return <Badge variant="secondary">{status}</Badge>;
}

interface LimitItemProps {
  label: string;
  used: number;
  limit: number;
}

function LimitItem({ label, used, limit }: LimitItemProps) {
  const percentage = Math.min(100, (used / limit) * 100);
  const isNearLimit = percentage >= 80;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-neutral-500 dark:text-neutral-400">{label}</span>
        <span className={cn(
          'font-medium',
          isNearLimit ? 'text-danger-600 dark:text-danger-400' : 'text-neutral-700 dark:text-neutral-300'
        )}>
          {used}/{limit}
        </span>
      </div>
      <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            isNearLimit ? 'bg-danger-500' : 'bg-primary-500'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Mini Plan Card (compact version for sidebar/headers)
// ============================================================================

interface MiniPlanCardProps {
  workspaceId: string;
  className?: string;
}

export function MiniPlanCard({ workspaceId, className }: MiniPlanCardProps) {
  const { data: subscription, isLoading } = useSubscription(workspaceId);

  if (isLoading) {
    return (
      <div className={cn('p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg', className)}>
        <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!subscription) {
    return null;
  }

  const { tier, isTrialing, daysUntilRenewal } = subscription;

  return (
    <div className={cn(
      'p-3 rounded-lg border',
      tier.popular 
        ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800' 
        : 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-800',
      className
    )}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-neutral-900 dark:text-white">
            {tier.name}
            {isTrialing && (
              <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">Trial</span>
            )}
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            {tier.price === 0 
              ? 'Free' 
              : `${formatCurrency(tier.price)}/mo`}
          </div>
        </div>
        {tier.popular && (
          <Badge variant="primary" size="sm">Pro</Badge>
        )}
      </div>
      {daysUntilRenewal > 0 && tier.price > 0 && (
        <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
          Renews in {daysUntilRenewal} days
        </div>
      )}
    </div>
  );
}
