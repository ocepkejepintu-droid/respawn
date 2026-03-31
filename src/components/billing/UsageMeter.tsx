/**
 * UsageMeter Component
 * 
 * Visual display of quota usage with progress bars and warnings.
 * Can be displayed as a full card or compact widget.
 */

'use client';

import { Activity, Users, Hash, FileSearch, FileText, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUsageStats, useQuotaWarnings } from '@/hooks/use-subscription';
import type { ResourceType, UsageStats, QuotaWarning } from '@/types/billing';

interface UsageMeterProps {
  workspaceId: string;
  variant?: 'full' | 'compact' | 'minimal';
  showWarnings?: boolean;
  className?: string;
}

const RESOURCE_CONFIG: Record<ResourceType, { label: string; icon: typeof Activity; color: string }> = {
  competitors: { label: 'Competitors', icon: Users, color: 'bg-blue-500' },
  hashtags: { label: 'Hashtags', icon: Hash, color: 'bg-purple-500' },
  scrapes: { label: 'Scrapes', icon: FileSearch, color: 'bg-green-500' },
  reports: { label: 'Reports', icon: FileText, color: 'bg-orange-500' },
  teamMembers: { label: 'Team Members', icon: Users, color: 'bg-pink-500' },
};

export function UsageMeter({ 
  workspaceId, 
  variant = 'full', 
  showWarnings = true, 
  className 
}: UsageMeterProps) {
  const { data: usage, isLoading: usageLoading } = useUsageStats(workspaceId);
  const { data: warnings, isLoading: warningsLoading } = useQuotaWarnings(workspaceId);

  const isLoading = usageLoading || warningsLoading;

  if (isLoading) {
    return <UsageMeterSkeleton variant={variant} className={className} />;
  }

  if (!usage) {
    return (
      <Card className={className}>
        <CardContent className="py-6 text-center text-neutral-500">
          Failed to load usage data
        </CardContent>
      </Card>
    );
  }

  if (variant === 'minimal') {
    return <MinimalUsageMeter usage={usage} className={className} />;
  }

  if (variant === 'compact') {
    return (
      <CompactUsageMeter 
        usage={usage} 
        warnings={showWarnings ? warnings : undefined}
        className={className} 
      />
    );
  }

  return (
    <FullUsageMeter 
      usage={usage} 
      warnings={showWarnings ? warnings : undefined}
      className={className} 
    />
  );
}

// ============================================================================
// Full Usage Meter (detailed card view)
// ============================================================================

interface FullUsageMeterProps {
  usage: UsageStats;
  warnings?: QuotaWarning[];
  className?: string;
}

function FullUsageMeter({ usage, warnings, className }: FullUsageMeterProps) {
  const resources: ResourceType[] = ['competitors', 'hashtags', 'scrapes', 'reports', 'teamMembers'];

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Usage Overview</CardTitle>
            <CardDescription>Your current plan usage</CardDescription>
          </div>
          {warnings && warnings.length > 0 && (
            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{warnings.length} warning{warnings.length !== 1 && 's'}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Warnings */}
        {warnings && warnings.length > 0 && (
          <div className="space-y-2">
            {warnings.slice(0, 2).map((warning) => (
              <div
                key={warning.resource}
                className={cn(
                  'flex items-start gap-2 p-3 rounded-lg text-sm',
                  warning.severity === 'critical' 
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200' 
                    : 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200'
                )}
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{warning.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Usage Bars */}
        <div className="space-y-5">
          {resources.map((resource) => (
            <ResourceBar 
              key={resource}
              resource={resource}
              stats={usage[resource]}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Compact Usage Meter (smaller card view)
// ============================================================================

interface CompactUsageMeterProps {
  usage: UsageStats;
  warnings?: QuotaWarning[];
  className?: string;
}

function CompactUsageMeter({ usage, warnings, className }: CompactUsageMeterProps) {
  const criticalWarnings = warnings?.filter(w => w.severity === 'critical') || [];

  return (
    <Card className={className}>
      <CardContent className="p-4">
        {criticalWarnings.length > 0 && (
          <div className="mb-4 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{criticalWarnings[0].message}</span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <CompactResourceRow resource="competitors" stats={usage.competitors} />
          <CompactResourceRow resource="hashtags" stats={usage.hashtags} />
          <CompactResourceRow resource="scrapes" stats={usage.scrapes} />
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Minimal Usage Meter (inline display)
// ============================================================================

interface MinimalUsageMeterProps {
  usage: UsageStats;
  className?: string;
}

function MinimalUsageMeter({ usage, className }: MinimalUsageMeterProps) {
  // Find the most used resource
  const resources = Object.entries(usage) as [ResourceType, typeof usage.competitors][];
  const mostUsed = resources.reduce((a, b) => a[1].percentage > b[1].percentage ? a : b);
  const config = RESOURCE_CONFIG[mostUsed[0]];
  const Icon = config.icon;

  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      <Icon className="h-4 w-4 text-neutral-400" />
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
          <div 
            className={cn('h-full rounded-full', config.color)}
            style={{ width: `${mostUsed[1].percentage}%` }}
          />
        </div>
        <span className="text-neutral-600 dark:text-neutral-400">
          {Math.round(mostUsed[1].percentage)}% used
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// Resource Bar Component
// ============================================================================

interface ResourceBarProps {
  resource: ResourceType;
  stats: {
    used: number;
    limit: number;
    remaining: number;
    percentage: number;
  };
}

function ResourceBar({ resource, stats }: ResourceBarProps) {
  const config = RESOURCE_CONFIG[resource];
  const Icon = config.icon;

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-amber-500';
    return config.color;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-neutral-500" />
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {config.label}
          </span>
        </div>
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          <span className={cn(
            'font-medium',
            stats.percentage >= 90 && 'text-red-600 dark:text-red-400'
          )}>
            {stats.used}
          </span>
          <span className="text-neutral-400"> / {stats.limit}</span>
          {stats.percentage >= 75 && (
            <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
              ({stats.remaining} left)
            </span>
          )}
        </div>
      </div>
      <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', getProgressColor(stats.percentage))}
          style={{ width: `${Math.min(100, stats.percentage)}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Compact Resource Row
// ============================================================================

function CompactResourceRow({ 
  resource, 
  stats 
}: { 
  resource: ResourceType; 
  stats: { used: number; limit: number; percentage: number };
}) {
  const config = RESOURCE_CONFIG[resource];
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-neutral-400" />
        <span className="text-sm text-neutral-600 dark:text-neutral-400">{config.label}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-20 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
          <div 
            className={cn(
              'h-full rounded-full',
              stats.percentage >= 90 ? 'bg-red-500' : stats.percentage >= 75 ? 'bg-amber-500' : config.color
            )}
            style={{ width: `${Math.min(100, stats.percentage)}%` }}
          />
        </div>
        <span className={cn(
          'text-sm font-medium min-w-[60px] text-right',
          stats.percentage >= 90 ? 'text-red-600 dark:text-red-400' : 'text-neutral-700 dark:text-neutral-300'
        )}>
          {stats.used}/{stats.limit}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// Skeleton Loading
// ============================================================================

function UsageMeterSkeleton({ variant, className }: { variant: string; className?: string }) {
  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="h-4 w-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
        <div className="w-16 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
        <div className="h-4 w-16 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <Card className={className}>
      {variant === 'full' && (
        <CardHeader>
          <div className="h-5 w-32 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
          <div className="h-4 w-48 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse mt-1" />
        </CardHeader>
      )}
      <CardContent className={variant === 'compact' ? 'p-4' : undefined}>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
                <div className="h-4 w-16 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
              </div>
              <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Individual Resource Usage (for inline use)
// ============================================================================

interface ResourceUsageProps {
  workspaceId: string;
  resource: ResourceType;
  className?: string;
}

export function ResourceUsage({ workspaceId, resource, className }: ResourceUsageProps) {
  const { data: usage, isLoading } = useUsageStats(workspaceId);

  if (isLoading || !usage) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="h-4 w-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
        <div className="h-4 w-16 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
      </div>
    );
  }

  const stats = usage[resource];
  const config = RESOURCE_CONFIG[resource];
  const Icon = config.icon;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Icon className="h-4 w-4 text-neutral-400" />
      <span className="text-sm text-neutral-600 dark:text-neutral-400">
        {stats.used}/{stats.limit} {config.label.toLowerCase()}
      </span>
    </div>
  );
}
