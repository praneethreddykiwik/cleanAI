'use client';

import * as React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children?: React.ReactNode;
  /** Glass overlay layer: 1 (thinnest/nav) to 4 (most opaque/modal) */
  level?: 1 | 2 | 3 | 4;
  /** Rounded radius alias */
  rounded?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full';
  /** Specular overlay highlight glow */
  glow?: boolean;
  /** Add micro-grain texture noise */
  noise?: boolean;
  /** Add interactive hover motion lift and shadow expansion */
  interactive?: boolean;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      children,
      className,
      level = 2,
      rounded = '2xl',
      glow = true,
      noise = false,
      interactive = false,
      ...props
    },
    ref
  ) => {
    const Component = interactive ? motion.div : 'div';

    const roundedClasses = {
      none: 'rounded-none',
      xs: 'rounded-xs',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      '2xl': 'rounded-2xl',
      '3xl': 'rounded-3xl',
      '4xl': 'rounded-4xl',
      full: 'rounded-full',
    };

    const glassClasses = {
      1: 'glass-1',
      2: 'glass-2',
      3: 'glass-3',
      4: 'glass-4',
    };

    const interactionProps = interactive
      ? {
          whileHover: { y: -3, scale: 1.01 },
          whileTap: { y: -1, scale: 0.995 },
          transition: { type: 'spring', stiffness: 400, damping: 25 },
        }
      : {};

    return (
      // @ts-expect-error - Component is dynamically styled motion.div or div
      <Component
        ref={ref}
        className={cn(
          'relative overflow-hidden transition-all duration-300',
          glassClasses[level],
          roundedClasses[rounded],
          interactive && 'cursor-pointer hover:shadow-card-hover select-none',
          className
        )}
        {...interactionProps}
        {...props}
      >
        {/* Light reflection gradient */}
        {glow && (
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none z-0" />
        )}

        {/* Grain texture noise */}
        {noise && (
          <div className="absolute inset-0 glass-noise pointer-events-none z-0 opacity-[0.25]" />
        )}

        <div className="relative z-10 w-full h-full">{children}</div>
      </Component>
    );
  }
);

GlassCard.displayName = 'GlassCard';
