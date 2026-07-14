'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Sun, CloudSun, Moon, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { heroTextContainerVariants, heroTextItemVariants } from '@/lib/animations';

interface WelcomeHeroProps {
  name: string;
  subtitle?: string;
  action?: React.ReactNode;
  role?: 'customer' | 'vendor' | 'admin';
}

export function WelcomeHero({
  name,
  subtitle = 'Your home services at a glance.',
  action,
  role = 'customer',
}: WelcomeHeroProps) {
  const [greeting] = useState(() => {
    if (typeof window === 'undefined') {
      return { text: 'Welcome back', icon: Sparkles };
    }
    const hours = new Date().getHours();
    if (hours < 12) {
      return { text: 'Good morning', icon: Sun };
    } else if (hours < 18) {
      return { text: 'Good afternoon', icon: CloudSun };
    } else {
      return { text: 'Good evening', icon: Moon };
    }
  });

  const roleGradients = {
    customer: 'from-primary/10 via-transparent to-accent/5 dark:from-primary/15 dark:to-zinc-950/40',
    vendor: 'from-violet-500/10 via-transparent to-purple-500/5 dark:from-violet-500/15 dark:to-zinc-950/40',
    admin: 'from-slate-500/10 via-transparent to-slate-500/5 dark:from-slate-500/15 dark:to-zinc-950/40',
  }[role];

  const roleTextColors = {
    customer: 'from-primary to-blue-600 dark:to-blue-400',
    vendor: 'from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400',
    admin: 'from-slate-700 to-slate-500 dark:from-slate-400 dark:to-slate-300',
  }[role];

  const roleAccentBg = {
    customer: 'bg-primary/10 text-primary border-primary/20',
    vendor: 'bg-violet-500/10 text-vendor dark:text-violet-400 border-violet-500/20',
    admin: 'bg-slate-500/10 text-muted-foreground border-slate-500/25',
  }[role];

  const roleAccentDot = {
    customer: 'bg-primary',
    vendor: 'bg-violet-500 dark:bg-violet-400',
    admin: 'bg-slate-500 dark:bg-slate-400',
  }[role];

  const GreetingIcon = greeting.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 26 }}
      className={cn(
        'relative overflow-hidden rounded-[2rem] p-6 md:p-8',
        'glass-2 border border-white/50 dark:border-white/8 shadow-[var(--shadow-sm)]',
        'bg-gradient-to-br',
        roleGradients
      )}
    >
      {/* Specular glows in background */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 20, 0],
          y: [0, -10, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-1/2 left-1/3 -translate-y-1/2 w-48 h-48 bg-primary/10 dark:bg-primary/20 rounded-full blur-[80px] pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          x: [0, -20, 0],
          y: [0, 10, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
        className="absolute top-1/4 right-1/4 w-36 h-36 bg-blue-500/8 dark:bg-blue-500/10 rounded-full blur-[65px] pointer-events-none"
      />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <motion.div
          variants={heroTextContainerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-2.5"
        >
          {/* Accent session badge */}
          <motion.div
            variants={heroTextItemVariants}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium tracking-normal border leading-none',
              roleAccentBg
            )}
          >
            <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', roleAccentDot)} />
            System Live
          </motion.div>

          {/* Heading */}
          <motion.h2
            variants={heroTextItemVariants}
            className="text-xl md:text-2xl font-semibold text-foreground tracking-tight leading-tight flex items-center gap-2 flex-wrap"
          >
            <span>{greeting.text},</span>
            <span className={cn('bg-gradient-to-r bg-clip-text text-transparent', roleTextColors)}>
              {name}
            </span>
            <GreetingIcon size={18} className="text-amber-500 animate-breathe shrink-0" />
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            variants={heroTextItemVariants}
            className="text-xs md:text-sm text-muted-foreground max-w-md font-medium leading-relaxed"
          >
            {subtitle}
          </motion.p>
        </motion.div>

        {action && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35, duration: 0.3 }}
            className="shrink-0 flex items-center"
          >
            {action}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
