'use client';

import { motion } from 'framer-motion';
import { type LucideIcon, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'search' | 'error';
  className?: string;
}

export function EmptyState({
  icon: Icon = HelpCircle,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 md:p-14 rounded-[2rem]',
        'glass-2 border border-white/30 dark:border-white/5 shadow-[var(--shadow-sm)]',
        className
      )}
    >
      {/* Floating glass illustration container */}
      <div className="relative mb-6 flex items-center justify-center w-20 h-20">
        {/* Soft blur background halos */}
        <div className="absolute w-20 h-20 bg-primary/10 dark:bg-primary/15 rounded-full blur-xl pointer-events-none" />
        
        {/* Floating background circle */}
        <motion.div
          animate={{
            y: [0, -6, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-1 -left-1 w-7 h-7 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-xs pointer-events-none"
        />

        {/* Floating background diamond */}
        <motion.div
          animate={{
            y: [0, 8, 0],
            rotate: [45, 60, 45],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
          className="absolute -bottom-2 -right-2 w-6 h-6 rounded-md bg-purple-500/10 border border-purple-500/20 backdrop-blur-xs pointer-events-none"
        />

        {/* Central Glass Plate */}
        <motion.div
          animate={{
            y: [0, -4, 0],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-14 h-14 rounded-2xl glass-3 border border-white/50 dark:border-white/10 flex items-center justify-center text-muted-foreground relative z-10 shadow-xs"
        >
          <Icon size={20} strokeWidth={1.5} className="text-primary/80 dark:text-primary-hover animate-pulse" />
        </motion.div>
      </div>

      {/* Info details */}
      <h3 className="text-sm font-semibold text-foreground tracking-tight">{title}</h3>
      <p className="text-xs text-muted-foreground/80 max-w-xs mt-2 leading-relaxed font-medium">
        {description}
      </p>

      {/* Action buttons */}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 mt-6">
          {secondaryAction && (
            <Button
              variant="ghost"
              size="xs"
              onClick={secondaryAction.onClick}
              className="text-muted-foreground hover:text-foreground font-semibold text-xs px-3"
            >
              {secondaryAction.label}
            </Button>
          )}
          {action && (
            <Button
              variant="glass"
              size="xs"
              onClick={action.onClick}
              className="border border-white/50 dark:border-white/10 font-bold text-xs shadow-2xs px-4"
            >
              {action.label}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}
