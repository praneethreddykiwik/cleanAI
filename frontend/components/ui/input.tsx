'use client';

import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from "@/lib/utils"
import { errorShakeVariants } from '@/lib/animations'

export interface InputProps extends React.ComponentProps<"input"> {
  label?: string;
  error?: string;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, success, leftIcon, rightIcon, containerClassName, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const hasValue = props.value !== undefined && props.value !== '';

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
        <div className="relative flex items-center w-full">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3.5 text-muted-foreground/60 z-10 flex items-center justify-center pointer-events-none">
              {leftIcon}
            </div>
          )}

          <InputPrimitive
            type={type}
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
              "h-10 w-full min-w-0 rounded-xl border px-3.5 py-2 text-sm transition-all duration-200 outline-none",
              "bg-white/40 dark:bg-white/5 backdrop-blur-xs",
              "text-foreground placeholder:text-muted-foreground/50",
              leftIcon && "pl-10",
              (rightIcon || error || success) && "pr-10",
              error
                ? "border-destructive ring-2 ring-destructive/20 focus-visible:ring-destructive/30 dark:border-destructive/60 dark:ring-destructive/40"
                : success
                ? "border-success ring-2 ring-success/15 dark:border-success/60 dark:ring-success/30"
                : isFocused
                ? "border-primary shadow-[0_0_16px_rgba(59,130,246,0.15)] ring-2 ring-primary/20 dark:ring-primary/40"
                : "border-border/60 hover:border-border-strong focus:border-primary",
              "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-50",
              className
            )}
            {...props}
          />

          {/* Right Indicator (Error, Success, or Custom rightIcon) */}
          <div className="absolute right-3.5 z-10 flex items-center justify-center">
            {error ? (
              <AlertCircle size={15} className="text-destructive animate-fade-in" />
            ) : success ? (
              <CheckCircle2 size={15} className="text-success animate-fade-in" />
            ) : rightIcon ? (
              <div className="text-muted-foreground/60 pointer-events-none">{rightIcon}</div>
            ) : null}
          </div>
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
Input.displayName = "Input"

export { Input }
