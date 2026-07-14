'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  withDot?: boolean;
  className?: string;
}

const STATUS_CONFIGS: Record<
  string,
  {
    bg: string;
    text: string;
    dot: string;
    label: string;
    animate?: boolean;
  }
> = {
  // Booking Statuses
  PENDING: {
    bg: 'bg-amber-500/10 border-amber-500/20 dark:border-amber-500/25',
    text: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500 dark:bg-amber-400',
    label: 'Pending',
  },
  CONFIRMED: {
    bg: 'bg-blue-500/10 border-blue-500/20 dark:border-blue-500/25',
    text: 'text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500 dark:bg-blue-400',
    label: 'Confirmed',
  },
  VENDOR_ACCEPTED: {
    bg: 'bg-purple-500/10 border-purple-500/20 dark:border-purple-500/25',
    text: 'text-purple-600 dark:text-purple-400',
    dot: 'bg-purple-500 dark:bg-purple-400',
    label: 'Accepted',
  },
  AGENT_ASSIGNED: {
    bg: 'bg-indigo-500/10 border-indigo-500/20 dark:border-indigo-500/25',
    text: 'text-indigo-600 dark:text-indigo-400',
    dot: 'bg-indigo-500 dark:bg-indigo-400',
    label: 'Agent Assigned',
  },
  IN_PROGRESS: {
    bg: 'bg-orange-500/10 border-orange-500/20 dark:border-orange-500/25',
    text: 'text-orange-600 dark:text-orange-400',
    dot: 'bg-orange-500 dark:bg-orange-400',
    label: 'In Progress',
    animate: true,
  },
  COMPLETED: {
    bg: 'bg-green-500/10 border-green-500/20 dark:border-green-500/25',
    text: 'text-green-600 dark:text-green-400',
    dot: 'bg-green-500 dark:bg-green-400',
    label: 'Completed',
  },
  CANCELLED: {
    bg: 'bg-red-500/10 border-red-500/20 dark:border-red-500/25',
    text: 'text-red-600 dark:text-red-400',
    dot: 'bg-red-500 dark:bg-red-400',
    label: 'Cancelled',
  },
  DISPUTED: {
    bg: 'bg-rose-500/10 border-rose-500/20 dark:border-rose-500/25',
    text: 'text-rose-600 dark:text-rose-400',
    dot: 'bg-rose-500 dark:bg-rose-400',
    label: 'Disputed',
    animate: true,
  },

  // Vendor / Agent Statuses
  APPROVED: {
    bg: 'bg-green-500/10 border-green-500/20 dark:border-green-500/25',
    text: 'text-green-600 dark:text-green-400',
    dot: 'bg-green-500 dark:bg-green-400',
    label: 'Approved',
  },
  REJECTED: {
    bg: 'bg-red-500/10 border-red-500/20 dark:border-red-500/25',
    text: 'text-red-600 dark:text-red-400',
    dot: 'bg-red-500 dark:bg-red-400',
    label: 'Rejected',
  },
  SUSPENDED: {
    bg: 'bg-amber-500/10 border-amber-500/20 dark:border-amber-500/25',
    text: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500 dark:bg-amber-400',
    label: 'Suspended',
  },
  AVAILABLE: {
    bg: 'bg-green-500/10 border-green-500/20 dark:border-green-500/25',
    text: 'text-green-600 dark:text-green-400',
    dot: 'bg-green-500 dark:bg-green-400',
    label: 'Available',
    animate: true,
  },
  BUSY: {
    bg: 'bg-amber-500/10 border-amber-500/20 dark:border-amber-500/25',
    text: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500 dark:bg-amber-400',
    label: 'Busy',
  },
  OFFLINE: {
    bg: 'bg-zinc-500/10 border-zinc-500/20 dark:border-zinc-500/25',
    text: 'text-zinc-500 dark:text-zinc-400',
    dot: 'bg-zinc-500 dark:bg-zinc-400',
    label: 'Offline',
  },

  // Payment Statuses
  PAID: {
    bg: 'bg-green-500/10 border-green-500/20 dark:border-green-500/25',
    text: 'text-green-600 dark:text-green-400',
    dot: 'bg-green-500 dark:bg-green-400',
    label: 'Paid',
  },
  REFUNDED: {
    bg: 'bg-blue-500/10 border-blue-500/20 dark:border-blue-500/25',
    text: 'text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500 dark:bg-blue-400',
    label: 'Refunded',
  },
  FAILED: {
    bg: 'bg-red-500/10 border-red-500/20 dark:border-red-500/25',
    text: 'text-red-600 dark:text-red-400',
    dot: 'bg-red-500 dark:bg-red-400',
    label: 'Failed',
  },

  // Generic Statuses
  ACTIVE: {
    bg: 'bg-green-500/10 border-green-500/20 dark:border-green-500/25',
    text: 'text-green-600 dark:text-green-400',
    dot: 'bg-green-500 dark:bg-green-400',
    label: 'Active',
  },
  INACTIVE: {
    bg: 'bg-zinc-500/10 border-zinc-500/20 dark:border-zinc-500/25',
    text: 'text-zinc-500 dark:text-zinc-400',
    dot: 'bg-zinc-500 dark:bg-zinc-400',
    label: 'Inactive',
  },
};

const DEFAULT_CONFIG = {
  bg: 'bg-zinc-500/10 border-zinc-500/20 dark:border-zinc-500/25',
  text: 'text-zinc-600 dark:text-zinc-400',
  dot: 'bg-zinc-500 dark:bg-zinc-450',
  label: 'Unknown',
};

export function StatusBadge({
  status,
  label,
  size = 'md',
  withDot = true,
  className,
}: StatusBadgeProps) {
  const normStatus = status.toUpperCase();
  const config = STATUS_CONFIGS[normStatus] || { ...DEFAULT_CONFIG, label: status };
  const displayLabel = label || config.label;

  const sizeClasses = {
    sm: 'text-[9.5px] px-2 py-0.5 font-extrabold uppercase tracking-wide gap-1',
    md: 'text-[11px] px-2.5 py-0.5 font-bold gap-1.5',
    lg: 'text-xs px-3 py-1 font-bold gap-2',
  }[size];

  const dotSize = {
    sm: 'w-1 h-1',
    md: 'w-1.5 h-1.5',
    lg: 'w-2 h-2',
  }[size];

  const pulseSize = {
    sm: 4,
    md: 6,
    lg: 8,
  }[size];

  return (
    <span
      className={cn(
        'inline-flex items-center border rounded-full leading-none transition-colors select-none',
        sizeClasses,
        config.bg,
        config.text,
        className
      )}
    >
      {withDot && (
        <span className="relative flex items-center shrink-0">
          {config.animate && (
            <motion.span
              className={cn('absolute inline-flex rounded-full opacity-75', config.dot)}
              animate={{ scale: [1, 2.5, 2.5], opacity: [0.6, 0, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
              style={{ width: pulseSize, height: pulseSize }}
            />
          )}
          <span className={cn('relative inline-flex rounded-full shrink-0', config.dot, dotSize)} />
        </span>
      )}
      {displayLabel}
    </span>
  );
}
