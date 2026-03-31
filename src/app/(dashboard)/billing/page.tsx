/**
 * Billing Dashboard Page
 * 
 * Main billing management page for authenticated users.
 * Shows current subscription, usage, payment methods, and billing history.
 */

'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CreditCard, Receipt, BarChart3, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CurrentPlanCard,
  UsageMeter,
  PaymentMethodCard,
  BillingHistoryTable,
  UpgradeModal,
} from '@/components/billing';
import { useSubscription } from '@/hooks/use-subscription';

// Mock workspace ID - in production, get from context/session
const WORKSPACE_ID = 'workspace-1';

export default function BillingPage() {
  const searchParams = useSearchParams();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Handle success/cancel from Stripe checkout
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');

  const { data: subscription, isLoading } = useSubscription(WORKSPACE_ID);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Billing & Subscription
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Manage your subscription, payment methods, and billing history
          </p>
        </div>
        {subscription?.tier.id !== 'AGENCY' && (
          <Button onClick={() => setIsUpgradeModalOpen(true)}>
            Upgrade Plan
          </Button>
        )}
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="flex items-center gap-3 py-4">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <p className="text-green-800 dark:text-green-200">
              Payment successful! Your subscription has been updated.
            </p>
          </CardContent>
        </Card>
      )}

      {canceled && (
        <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <p className="text-amber-800 dark:text-amber-200">
              Payment was canceled. Your subscription remains unchanged.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Billing History
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment Methods
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CurrentPlanCard workspaceId={WORKSPACE_ID} />
            <UsageMeter workspaceId={WORKSPACE_ID} variant="full" />
          </div>

          {/* Quick Actions */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsUpgradeModalOpen(true)}
                >
                  Change Plan
                </Button>
                {subscription?.subscription.stripeSubscriptionId && (
                  <Button variant="outline">
                    Cancel Subscription
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing History Tab */}
        <TabsContent value="history">
          <BillingHistoryTable workspaceId={WORKSPACE_ID} />
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value="payment">
          <div className="max-w-2xl">
            <PaymentMethodCard workspaceId={WORKSPACE_ID} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Upgrade Modal */}
      <UpgradeModal
        workspaceId={WORKSPACE_ID}
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </div>
  );
}
