'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  level?: 1 | 2 | 3 | 4;
}

export function GlassPanel({ children, className, level = 1, ...props }: GlassPanelProps) {
  const glassClasses = {
    1: 'glass-1',
    2: 'glass-2',
    3: 'glass-3',
    4: 'glass-4',
  };

  return (
    <div
      className={cn(
        'relative border-border/30 backdrop-blur-md',
        glassClasses[level],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface GlassDividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
}

export function GlassDivider({ className, orientation = 'horizontal', ...props }: GlassDividerProps) {
  return (
    <div
      className={cn(
        'bg-linear-to-r from-transparent via-border/40 to-transparent shrink-0',
        orientation === 'horizontal' ? 'h-[1px] w-full' : 'w-[1px] h-full',
        className
      )}
      {...props}
    />
  );
}
