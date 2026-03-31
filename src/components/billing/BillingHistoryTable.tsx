/**
 * BillingHistoryTable Component
 * 
 * Displays a table of past invoices with download links and status.
 */

'use client';

import { useState } from 'react';
import { Download, FileText, ChevronDown, ChevronUp, Loader2, ExternalLink } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBillingHistory } from '@/hooks/use-subscription';
import type { Invoice } from '@/types/billing';

interface BillingHistoryTableProps {
  workspaceId: string;
  className?: string;
}

export function BillingHistoryTable({ workspaceId, className }: BillingHistoryTableProps) {
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);
  const { data, isLoading, error } = useBillingHistory(workspaceId);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>View and download your invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-neutral-500">
            Failed to load billing history
          </div>
        </CardContent>
      </Card>
    );
  }

  const invoices = data?.invoices || [];

  if (invoices.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>View and download your invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
            <p className="text-neutral-500 dark:text-neutral-400">
              No billing history yet
            </p>
            <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">
              Your invoices will appear here once you have a paid subscription
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Billing History</CardTitle>
        <CardDescription>View and download your invoices</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800">
                <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {invoices.map((invoice) => (
                <InvoiceRow
                  key={invoice.id}
                  invoice={invoice}
                  isExpanded={expandedInvoice === invoice.id}
                  onToggle={() => setExpandedInvoice(
                    expandedInvoice === invoice.id ? null : invoice.id
                  )}
                />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Invoice Row Component
// ============================================================================

interface InvoiceRowProps {
  invoice: Invoice;
  isExpanded: boolean;
  onToggle: () => void;
}

function InvoiceRow({ invoice, isExpanded, onToggle }: InvoiceRowProps) {
  const handleDownload = () => {
    if (invoice.pdfUrl) {
      window.open(invoice.pdfUrl, '_blank');
    }
  };

  const handleView = () => {
    if (invoice.hostedInvoiceUrl) {
      window.open(invoice.hostedInvoiceUrl, '_blank');
    }
  };

  return (
    <>
      <tr className="group hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
        <td className="py-4 px-4">
          <div className="text-sm text-neutral-900 dark:text-white">
            {formatDate(invoice.created)}
          </div>
          {invoice.periodStart && invoice.periodEnd && (
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
            </div>
          )}
        </td>
        <td className="py-4 px-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-neutral-400" />
            <span className="text-sm font-medium text-neutral-900 dark:text-white">
              {invoice.number || 'Invoice'}
            </span>
          </div>
        </td>
        <td className="py-4 px-4">
          <InvoiceStatusBadge status={invoice.status} />
        </td>
        <td className="py-4 px-4 text-right">
          <div className="text-sm font-medium text-neutral-900 dark:text-white">
            {formatCurrency(invoice.amount / 100, invoice.currency)}
          </div>
        </td>
        <td className="py-4 px-4 text-right">
          <div className="flex items-center justify-end gap-2">
            {invoice.lineItems.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="h-8 w-8 p-0"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
            {invoice.hostedInvoiceUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleView}
                className="h-8 w-8 p-0"
                title="View invoice"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
            {invoice.pdfUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="h-8 w-8 p-0"
                title="Download PDF"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded Details */}
      {isExpanded && invoice.lineItems.length > 0 && (
        <tr>
          <td colSpan={5} className="py-0">
            <div className="bg-neutral-50 dark:bg-neutral-800/30 px-4 py-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="text-left py-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                      Description
                    </th>
                    <th className="text-right py-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700/50">
                  {invoice.lineItems.map((item, index) => (
                    <tr key={index}>
                      <td className="py-2 text-sm text-neutral-600 dark:text-neutral-400">
                        {item.description || 'Subscription'}
                      </td>
                      <td className="py-2 text-sm text-right text-neutral-900 dark:text-white">
                        {formatCurrency(item.amount / 100, item.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {(invoice.subtotal !== undefined || invoice.total !== undefined) && (
                  <tfoot>
                    {invoice.subtotal !== undefined && (
                      <tr>
                        <td className="py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 text-right">
                          Subtotal
                        </td>
                        <td className="py-2 text-sm font-medium text-right text-neutral-900 dark:text-white">
                          {formatCurrency(invoice.subtotal / 100, invoice.currency)}
                        </td>
                      </tr>
                    )}
                    {invoice.tax !== undefined && invoice.tax > 0 && (
                      <tr>
                        <td className="py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 text-right">
                          Tax
                        </td>
                        <td className="py-2 text-sm font-medium text-right text-neutral-900 dark:text-white">
                          {formatCurrency(invoice.tax / 100, invoice.currency)}
                        </td>
                      </tr>
                    )}
                    {invoice.total !== undefined && (
                      <tr className="border-t border-neutral-200 dark:border-neutral-700">
                        <td className="py-2 text-sm font-bold text-neutral-900 dark:text-white text-right">
                          Total
                        </td>
                        <td className="py-2 text-sm font-bold text-right text-neutral-900 dark:text-white">
                          {formatCurrency(invoice.total / 100, invoice.currency)}
                        </td>
                      </tr>
                    )}
                  </tfoot>
                )}
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ============================================================================
// Invoice Status Badge
// ============================================================================

function InvoiceStatusBadge({ status }: { status: Invoice['status'] }) {
  const variants: Record<Invoice['status'], 'success' | 'warning' | 'danger' | 'secondary'> = {
    paid: 'success',
    draft: 'secondary',
    open: 'warning',
    uncollectible: 'danger',
    void: 'secondary',
  };

  const labels: Record<Invoice['status'], string> = {
    paid: 'Paid',
    draft: 'Draft',
    open: 'Pending',
    uncollectible: 'Failed',
    void: 'Void',
  };

  return (
    <Badge variant={variants[status]}>
      {labels[status]}
    </Badge>
  );
}

// ============================================================================
// Compact Billing History (for use in smaller spaces)
// ============================================================================

interface CompactBillingHistoryProps {
  workspaceId: string;
  limit?: number;
  className?: string;
}

export function CompactBillingHistory({ workspaceId, limit = 5, className }: CompactBillingHistoryProps) {
  const { data, isLoading } = useBillingHistory(workspaceId, { limit });

  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
            <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
            <div className="h-4 w-16 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  const invoices = data?.invoices || [];

  if (invoices.length === 0) {
    return (
      <div className={cn('text-center py-6 text-neutral-500', className)}>
        No billing history
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {invoices.map((invoice) => (
        <div
          key={invoice.id}
          className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileText className="h-4 w-4 text-neutral-400" />
            <div>
              <div className="text-sm font-medium text-neutral-900 dark:text-white">
                {invoice.number || 'Invoice'}
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                {formatDate(invoice.created)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-neutral-900 dark:text-white">
              {formatCurrency(invoice.amount / 100, invoice.currency)}
            </span>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
        </div>
      ))}
    </div>
  );
}
