'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circle' | 'rectangle' | 'card';
}

export function Skeleton({ className, variant = 'rectangle', ...props }: SkeletonProps) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Loading content..."
      className={cn(
        'skeleton-shimmer bg-muted/60',
        variant === 'circle' && 'rounded-full',
        variant === 'text' && 'h-3.5 w-full rounded-md my-1',
        variant === 'rectangle' && 'rounded-xl',
        variant === 'card' && 'rounded-2xl h-36 w-full',
        className
      )}
      {...props}
    />
  );
}
