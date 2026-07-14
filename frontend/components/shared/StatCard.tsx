'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { useCountUp } from '@/hooks/useCountUp';
import { statCardVariants } from '@/lib/animations';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  index?: number;
  format?: 'number' | 'currency' | 'percent';
  description?: string;
  onClick?: () => void;
  trendData?: number[]; // Mini sparkline values (7 points)
}

export function StatCard({
  title,
  value,
  prefix = '',
  suffix = '',
  change,
  changeLabel = 'vs last month',
  icon: Icon,
  iconColor = 'text-primary',
  iconBg = 'bg-primary/10',
  index = 0,
  format = 'number',
  description,
  onClick,
  trendData,
}: StatCardProps) {
  const animatedValue = useCountUp(value, 800);

  const displayValue = () => {
    if (format === 'currency') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
        notation: value >= 100000 ? 'compact' : 'standard',
      }).format(animatedValue);
    }
    if (format === 'percent') {
      return `${animatedValue}%`;
    }
    return formatNumber(animatedValue);
  };

  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change !== undefined && change === 0;

  // Simple SVG Sparkline Generator
  const generateSparklinePath = (data: number[]) => {
    if (data.length < 2) return '';
    const width = 45;
    const height = 12;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  return (
    <motion.div
      custom={index}
      variants={statCardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{
        y: -2,
        scale: 1.005,
        transition: { type: 'spring', stiffness: 450, damping: 22 },
      }}
      onClick={onClick}
      className={cn(
        'relative glass-2 rounded-2xl p-4 overflow-hidden border border-white/30 dark:border-white/5 bg-linear-to-br from-white/5 via-transparent to-transparent',
        'transition-all duration-300 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]',
        onClick && 'cursor-pointer'
      )}
    >
      {/* Light Reflection overlay */}
      <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />

      {/* Top row: Icon and Title (Title Case) */}
      <div className="flex items-center gap-2 relative z-10">
        <div
          className={cn(
            'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-white/30 dark:border-white/10 shadow-3xs',
            iconBg
          )}
        >
          <Icon size={13} className={cn('relative z-10', iconColor)} />
        </div>
        <span className="text-xs font-medium text-muted-foreground/75 tracking-normal truncate">{title}</span>
      </div>

      {/* Middle row: Large number + trend */}
      <div className="mt-3.5 relative z-10 flex items-baseline justify-between">
        <div className="flex items-baseline gap-0.5">
          {prefix && (
            <span className="text-xs font-medium text-muted-foreground/60 mr-0.5">{prefix}</span>
          )}
          <span className="text-xl font-semibold text-foreground tracking-tight leading-none">
            {format === 'currency' ? displayValue() : `${prefix}${displayValue()}${suffix}`}
          </span>
        </div>

        {/* Change indicator & sparkline right-aligned */}
        <div className="flex items-center gap-2">
          {trendData && trendData.length >= 2 && (
            <div className="shrink-0">
              <svg width="45" height="12" className="overflow-visible">
                <path
                  d={generateSparklinePath(trendData)}
                  fill="none"
                  stroke={isPositive ? 'oklch(0.7 0.16 164.44)' : 'oklch(0.66 0.21 25.77)'}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}

          {change !== undefined && (
            <div
              className={cn(
                'flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full border shadow-3xs leading-none',
                isPositive && 'text-green-600 bg-green-500/10 border-green-500/15 dark:text-green-400',
                isNegative && 'text-red-500 bg-red-500/10 border-red-500/15 dark:text-red-400',
                isNeutral && 'text-muted-foreground bg-muted/30 border-border/20'
              )}
            >
              {isPositive && <TrendingUp size={9} />}
              {isNegative && <TrendingDown size={9} />}
              {isNeutral && <Minus size={9} />}
              <span>
                {isPositive && '+'}
                {Math.abs(change)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ==================
// Stats Grid Container
// ==================
interface StatsGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatsGrid({ children, columns = 4, className }: StatsGridProps) {
  return (
    <div
      className={cn(
        'grid gap-4 w-full',
        columns === 2 && 'grid-cols-1 sm:grid-cols-2',
        columns === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        columns === 4 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
        className
      )}
    >
      {children}
    </div>
  );
}
