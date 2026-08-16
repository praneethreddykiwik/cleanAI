'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// ==================
// Skeleton Base
// ==================
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'circle' | 'rectangle';
}

export function Skeleton({ className, variant = 'rectangle', ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'skeleton-shimmer bg-muted/60',
        variant === 'circle' ? 'rounded-full' : 'rounded-xl',
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

// ==================
// Card Skeleton
// ==================
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'glass-2 rounded-2xl p-5 border border-white/40 dark:border-white/10 shadow-xs',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <Skeleton className="w-9 h-9 rounded-xl" />
        <Skeleton className="w-14 h-5 rounded-full" />
      </div>
      <Skeleton className="h-5 w-28 mb-2" />
      <Skeleton className="h-3 w-40" />
    </div>
  );
}

// ==================
// Stats Grid Skeleton
// ==================
export function StatsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

// ==================
// Table Skeleton
// ==================
export function TableSkeleton({
  rows = 5,
  columns = 5,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-4 w-full', className)}>
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-3.5" style={{ flex: i === 0 ? 2 : 1 }} />
        ))}
      </div>
      <div className="h-px bg-border/40" />
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowI) => (
        <div key={rowI} className="flex gap-4 items-center py-1">
          {Array.from({ length: columns }).map((_, colI) => (
            <Skeleton
              key={colI}
              className="h-4.5"
              style={{ flex: colI === 0 ? 2 : 1 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ==================
// User Card Skeleton
// ==================
export function UserCardSkeleton() {
  return (
    <div className="glass-2 rounded-2xl p-4 border border-white/40 dark:border-white/10 flex items-center gap-4 shadow-xs">
      <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3.5 w-20" />
      </div>
      <Skeleton className="w-16 h-7 rounded-xl" />
    </div>
  );
}

// ==================
// Service Card Skeleton
// ==================
export function ServiceCardSkeleton() {
  return (
    <div className="glass-2 rounded-2xl overflow-hidden border border-white/40 dark:border-white/10 shadow-xs">
      <Skeleton className="h-36 rounded-none" />
      <div className="p-4 space-y-3.5">
        <Skeleton className="h-4.5 w-28" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-3/4" />
        <div className="flex items-center justify-between mt-5">
          <Skeleton className="h-4.5 w-16" />
          <Skeleton className="h-8.5 w-22 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ==================
// Page Skeleton
// ==================
export function PageSkeleton() {
  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-3.5 w-56" />
        </div>
        <Skeleton className="h-9.5 w-28 rounded-xl" />
      </div>

      {/* Stats */}
      <StatsGridSkeleton count={4} />

      {/* Content */}
      <div className="glass-2 rounded-2xl p-5 border border-white/40 dark:border-white/10 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4.5 w-28" />
          <div className="flex gap-2">
            <Skeleton className="h-8.5 w-32 rounded-xl" />
            <Skeleton className="h-8.5 w-20 rounded-xl" />
          </div>
        </div>
        <TableSkeleton rows={5} columns={5} />
      </div>
    </div>
  );
}

// ==================
// Chat/Notification Skeleton
// ==================
export function NotificationSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-3 p-3.5 rounded-xl bg-foreground/[0.01]">
          <Skeleton className="w-9 h-9 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ==================
// Empty State (DEPRECATED - Use EmptyState.tsx directly)
// ==================
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      className={cn(
        'flex flex-col items-center justify-center py-12 px-6 text-center rounded-2xl border border-dashed border-border/60',
        className
      )}
    >
      {icon && (
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-4 text-3xl opacity-75"
        >
          {icon}
        </motion.div>
      )}
      <h3 className="text-sm font-bold text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-muted-foreground/80 max-w-xs leading-relaxed font-semibold">{description}</p>
      )}
      {action && (
        <div className="mt-5">
          {action}
        </div>
      )}
    </motion.div>
  );
}

// ==================
// Error State
// ==================
interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'flex flex-col items-center justify-center py-12 px-6 text-center rounded-2xl border border-border/40 bg-red-500/[0.01]',
        className
      )}
    >
      <div className="text-3xl mb-4 animate-breathe">⚠️</div>
      <h3 className="text-sm font-bold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground/80 max-w-xs mb-5 font-semibold leading-relaxed">{description}</p>
      {onRetry && (
        <Button
          variant="glass"
          size="sm"
          onClick={onRetry}
          className="border border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/10"
        >
          Try Again
        </Button>
      )}
    </motion.div>
  );
}

// ==================
// Loading Spinner
// ==================
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  const borders = { sm: 'border-2', md: 'border-2', lg: 'border-[3px]' };

  return (
    <div
      className={cn(
        'rounded-full border-primary border-t-transparent animate-spin-smooth',
        sizes[size],
        borders[size],
        className
      )}
      aria-label="Loading"
      role="status"
    />
  );
}

// ==================
// Full Page Loader
// ==================
export function PageLoader() {
  return (
    <div className="fixed inset-0 bg-background/60 backdrop-blur-xs flex items-center justify-center z-[var(--z-max)]">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" />
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="text-xs text-muted-foreground font-bold tracking-wider uppercase"
        >
          Loading CleanAI...
        </motion.p>
      </div>
    </div>
  );
}
