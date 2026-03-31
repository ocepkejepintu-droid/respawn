/**
 * PaymentMethodCard Component
 * 
 * Displays and manages payment methods for a workspace.
 * Shows default card, allows adding/removing cards.
 */

'use client';

import { CreditCard, Plus, Trash2, Check, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePaymentMethods, useRedirectToPortal } from '@/hooks/use-subscription';

interface PaymentMethodCardProps {
  workspaceId: string;
  className?: string;
}

// Brand icon mapping
const BRAND_ICONS: Record<string, string> = {
  visa: 'VISA',
  mastercard: 'MC',
  amex: 'AMEX',
  discover: 'DISC',
  jcb: 'JCB',
  diners: 'DIN',
  unionpay: 'UP',
};

// Brand colors
const BRAND_COLORS: Record<string, string> = {
  visa: 'bg-blue-600',
  mastercard: 'bg-red-600',
  amex: 'bg-green-600',
  discover: 'bg-orange-600',
  jcb: 'bg-green-700',
  diners: 'bg-blue-800',
  unionpay: 'bg-red-700',
};

export function PaymentMethodCard({ workspaceId, className }: PaymentMethodCardProps) {
  const { data, isLoading, error } = usePaymentMethods(workspaceId);
  const { redirect, isLoading: isPortalLoading } = useRedirectToPortal();

  const paymentMethods = data?.paymentMethods || [];
  const defaultMethod = paymentMethods[0]; // Stripe handles default on their side

  const handleManagePaymentMethods = async () => {
    await redirect(workspaceId);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Manage your payment methods</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-neutral-500">
            Failed to load payment methods
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Manage your payment methods</CardDescription>
          </div>
          <CreditCard className="h-5 w-5 text-neutral-400" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {paymentMethods.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg">
            <CreditCard className="h-12 w-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
            <p className="text-neutral-500 dark:text-neutral-400">
              No payment methods on file
            </p>
            <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">
              Add a payment method to upgrade your plan
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <PaymentMethodItem
                key={method.id}
                method={method}
                isDefault={method.id === defaultMethod?.id}
              />
            ))}
          </div>
        )}

        {/* Security Note */}
        <div className="flex items-start gap-2 text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>
            Your payment information is securely stored by Stripe. We never store your full card details.
          </p>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          variant="secondary"
          className="w-full"
          onClick={handleManagePaymentMethods}
          loading={isPortalLoading}
        >
          <Plus className="mr-2 h-4 w-4" />
          {paymentMethods.length === 0 ? 'Add Payment Method' : 'Manage Payment Methods'}
        </Button>
      </CardFooter>
    </Card>
  );
}

// ============================================================================
// Payment Method Item
// ============================================================================

interface PaymentMethodItemProps {
  method: {
    id: string;
    brand?: string;
    last4?: string;
    expMonth?: number;
    expYear?: number;
    isDefault?: boolean;
  };
  isDefault?: boolean;
}

function PaymentMethodItem({ method, isDefault }: PaymentMethodItemProps) {
  const brand = method.brand || 'unknown';
  const brandKey = brand.toLowerCase();
  const brandLabel = BRAND_ICONS[brandKey] || brand.toUpperCase();
  const brandColor = BRAND_COLORS[brandKey] || 'bg-neutral-600';

  const isExpired = method.expYear && method.expMonth
    ? new Date(method.expYear, method.expMonth - 1) < new Date()
    : false;

  return (
    <div className={cn(
      'flex items-center justify-between p-4 rounded-lg border',
      isDefault 
        ? 'bg-primary-50/50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800' 
        : 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-800'
    )}>
      <div className="flex items-center gap-3">
        {/* Brand Icon */}
        <div className={cn(
          'h-10 w-14 rounded flex items-center justify-center text-white text-xs font-bold',
          brandColor
        )}>
          {brandLabel}
        </div>

        {/* Card Info */}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-neutral-900 dark:text-white">
              •••• {method.last4}
            </span>
            {isDefault && (
              <Badge variant="primary" size="sm">Default</Badge>
            )}
            {isExpired && (
              <Badge variant="danger" size="sm">Expired</Badge>
            )}
          </div>
          <div className="text-sm text-neutral-500 dark:text-neutral-400">
            Expires {method.expMonth?.toString().padStart(2, '0')}/{method.expYear}
          </div>
        </div>
      </div>

      {/* Expiry Warning */}
      {isExpired && (
        <div className="text-xs text-danger-600 dark:text-danger-400">
          Please update your card
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Mini Payment Method (for use in headers/sidebars)
// ============================================================================

interface MiniPaymentMethodProps {
  workspaceId: string;
  className?: string;
}

export function MiniPaymentMethod({ workspaceId, className }: MiniPaymentMethodProps) {
  const { data, isLoading } = usePaymentMethods(workspaceId);

  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-neutral-500', className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading...
      </div>
    );
  }

  const methods = data?.paymentMethods || [];
  const defaultMethod = methods[0];

  if (!defaultMethod) {
    return (
      <div className={cn(
        'flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400',
        className
      )}>
        <AlertCircle className="h-4 w-4" />
        No payment method
      </div>
    );
  }

  const brand = defaultMethod.brand || 'card';
  const brandKey = brand.toLowerCase();
  const brandColor = BRAND_COLORS[brandKey] || 'bg-neutral-600';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('h-5 w-8 rounded flex items-center justify-center text-white text-[10px] font-bold', brandColor)}>
        {BRAND_ICONS[brandKey] || 'CARD'}
      </div>
      <span className="text-sm text-neutral-600 dark:text-neutral-400">
        •••• {defaultMethod.last4}
      </span>
    </div>
  );
}

// ============================================================================
// Payment Method Required Alert
// ============================================================================

interface PaymentMethodRequiredProps {
  workspaceId: string;
  onAddPaymentMethod?: () => void;
  className?: string;
}

export function PaymentMethodRequired({ workspaceId, onAddPaymentMethod, className }: PaymentMethodRequiredProps) {
  return (
    <div className={cn(
      'rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4',
      className
    )}>
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-amber-900 dark:text-amber-100">
            Payment Method Required
          </h4>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
            You need to add a payment method before you can upgrade your subscription.
          </p>
          {onAddPaymentMethod && (
            <Button
              variant="warning"
              size="sm"
              className="mt-3"
              onClick={onAddPaymentMethod}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Payment Method
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
