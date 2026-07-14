'use client';

import { motion } from 'framer-motion';
import { Check, Clock, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { timelineVariants } from '@/lib/animations';

export interface TimelineStep {
  title: string;
  description?: string;
  time?: string;
  status: 'completed' | 'active' | 'upcoming' | 'failed';
}

interface ActivityTimelineProps {
  steps: TimelineStep[];
  className?: string;
}

export function ActivityTimeline({ steps, className }: ActivityTimelineProps) {
  return (
    <div className={cn('relative pl-6 space-y-6 select-none', className)}>
      {/* Central timeline track line */}
      <div className="absolute left-[9px] top-2 bottom-2 w-[2px] bg-border/40" />

      {steps.map((step, idx) => {
        const isCompleted = step.status === 'completed';
        const isActive = step.status === 'active';
        const isFailed = step.status === 'failed';

        return (
          <motion.div
            key={idx}
            custom={idx}
            variants={timelineVariants}
            initial="hidden"
            animate="visible"
            className="relative flex gap-4 items-start"
          >
            {/* Step node dot indicator */}
            <div className="absolute -left-[23px] flex items-center justify-center">
              {isCompleted ? (
                <div className="w-5 h-5 rounded-full bg-success text-white flex items-center justify-center shadow-[var(--shadow-success)]">
                  <Check size={11} strokeWidth={3} />
                </div>
              ) : isActive ? (
                <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center timeline-step-active ring-4 ring-primary/20">
                  <Clock size={11} strokeWidth={2.5} />
                </div>
              ) : isFailed ? (
                <div className="w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center shadow-[var(--shadow-error)]">
                  <ShieldAlert size={11} strokeWidth={2.5} />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-muted dark:bg-white/5 border-2 border-border/80 flex items-center justify-center" />
              )}
            </div>

            {/* Content panel */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <h4
                  className={cn(
                    'text-xs font-bold tracking-tight',
                    isActive ? 'text-foreground font-extrabold' : 'text-foreground/80',
                    isFailed && 'text-destructive'
                  )}
                >
                  {step.title}
                </h4>
                {step.time && (
                  <span className="text-[10px] font-bold text-muted-foreground/60 shrink-0">
                    {step.time}
                  </span>
                )}
              </div>
              {step.description && (
                <p className="text-[11px] text-muted-foreground/85 mt-1 leading-relaxed font-semibold">
                  {step.description}
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
