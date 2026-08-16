'use client';

import * as React from "react"
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import { cn } from "@/lib/utils"
import { errorShakeVariants } from '@/lib/animations'

export interface TextareaProps extends React.ComponentProps<"textarea"> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, containerClassName, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);

    return (
      <motion.div
        variants={errorShakeVariants}
        animate={error ? "shake" : "initial"}
        className={cn("flex flex-col gap-1.5 w-full", containerClassName)}
      >
        {label && (
          <label className="text-xs font-bold text-foreground/80 tracking-wide select-none">
            {label}
          </label>
        )}
        <div className="relative flex w-full">
          <textarea
            ref={ref}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            className={cn(
              "flex min-h-20 w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all duration-200 outline-none resize-y",
              "bg-white/40 dark:bg-white/5 backdrop-blur-xs",
              "text-foreground placeholder:text-muted-foreground/50",
              error
                ? "border-destructive ring-2 ring-destructive/20 focus-visible:ring-destructive/30 dark:border-destructive/60 dark:ring-destructive/40"
                : isFocused
                ? "border-primary shadow-[0_0_16px_rgba(59,130,246,0.15)] ring-2 ring-primary/20 dark:ring-primary/40"
                : "border-border/60 hover:border-border-strong focus:border-primary",
              "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-50",
              className
            )}
            {...props}
          />

          {error && (
            <div className="absolute right-3.5 top-3 z-10">
              <AlertCircle size={15} className="text-destructive animate-fade-in" />
            </div>
          )}
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="text-[11px] font-semibold text-destructive mt-0.5 leading-none"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
