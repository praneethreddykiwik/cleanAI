'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  label?: string;
}

export function Progress({
  className,
  value,
  max = 100,
  size = 'sm',
  variant = 'default',
  showLabel = false,
  label,
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    xs: 'h-1',
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  }[size];

  const variantColors = {
    default: 'bg-primary shadow-[0_0_12px_rgba(59,130,246,0.25)]',
    success: 'bg-success shadow-[0_0_12px_rgba(22,163,74,0.25)]',
    warning: 'bg-warning shadow-[0_0_12px_rgba(217,119,6,0.25)]',
    error: 'bg-destructive shadow-[0_0_12px_rgba(220,38,38,0.25)]',
  }[variant];

  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)} {...props}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground leading-none">
          <span>{label || 'Progress'}</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        className={cn(
          'w-full bg-muted/60 dark:bg-white/5 rounded-full overflow-hidden border border-border/10',
          sizeClasses
        )}
      >
        <motion.div
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', stiffness: 220, damping: 26 }}
          className={cn('h-full rounded-full transition-all', variantColors)}
        />
      </div>
    </div>
  );
}
