'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type ThemeOption = 'light' | 'dark' | 'system';

const icons: Record<ThemeOption, React.ReactNode> = {
  light:  <Sun size={15} strokeWidth={2} />,
  dark:   <Moon size={15} strokeWidth={2} />,
  system: <Monitor size={14} strokeWidth={2} />,
};

const labels: Record<ThemeOption, string> = {
  light:  'Light mode',
  dark:   'Dark mode',
  system: 'System theme',
};

interface ThemeToggleProps {
  /** 'cycle' — one button cycling through modes. 'select' — 3-way segmented control. */
  variant?: 'cycle' | 'select';
  className?: string;
}

export function ThemeToggle({ variant = 'cycle', className }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();

  if (variant === 'select') {
    const options: ThemeOption[] = ['light', 'dark', 'system'];
    return (
      <div
        role="radiogroup"
        aria-label="Theme"
        className={cn(
          'flex items-center gap-0.5 p-1 rounded-xl glass-2 border border-border/40',
          className
        )}
      >
        {options.map((opt) => (
          <button
            key={opt}
            role="radio"
            aria-checked={theme === opt}
            onClick={() => setTheme(opt)}
            aria-label={labels[opt]}
            className={cn(
              'relative flex items-center justify-center w-7 h-7 rounded-lg transition-colors duration-150',
              theme === opt
                ? 'text-foreground'
                : 'text-muted-foreground/60 hover:text-muted-foreground'
            )}
          >
            {theme === opt && (
              <motion.div
                layoutId="theme-select-indicator"
                className="absolute inset-0 bg-background dark:bg-white/8 rounded-lg border border-border/40 shadow-xs"
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              />
            )}
            <span className="relative z-10">{icons[opt]}</span>
          </button>
        ))}
      </div>
    );
  }

  // Default: single cycle button
  const nextTheme: ThemeOption =
    resolvedTheme === 'light' ? 'dark' : 'light';

  return (
    <Tooltip>
      <TooltipTrigger
        onClick={() => setTheme(nextTheme)}
        aria-label={resolvedTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        className={cn(
          'relative flex items-center justify-center w-9 h-9 rounded-xl',
          'text-foreground transition-colors duration-150',
          'hover:bg-foreground/6 dark:hover:bg-white/8',
          'focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2',
          className
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={resolvedTheme}
            initial={{ opacity: 0, rotate: -30, scale: 0.7 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 30, scale: 0.7 }}
            transition={{ duration: 0.18, ease: [0.34, 1.56, 0.64, 1] }}
            className="flex items-center justify-center"
          >
            {resolvedTheme === 'dark' ? (
              <Moon size={15} strokeWidth={2} />
            ) : (
              <Sun size={15} strokeWidth={2} />
            )}
          </motion.span>
        </AnimatePresence>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6}>
        {resolvedTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      </TooltipContent>
    </Tooltip>
  );
}
