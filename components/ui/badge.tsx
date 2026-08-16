'use client';

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 font-bold whitespace-nowrap transition-all select-none border border-transparent leading-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[var(--shadow-primary)]",
        secondary: "bg-secondary text-secondary-foreground border-border/30",
        destructive: "bg-destructive text-destructive-foreground shadow-[var(--shadow-error)]",
        outline: "border-border text-foreground bg-white/20 dark:bg-white/5",
        glass: "glass-2 border-white/40 dark:border-white/10 text-foreground",
        success: "bg-success text-white shadow-[var(--shadow-success)]",
        warning: "bg-warning text-white shadow-[var(--shadow-warning)]",
        info: "bg-info text-foreground border-info/30",
        glow: "bg-primary/8 dark:bg-primary/15 text-primary border-primary/20 dark:border-primary/45 shadow-[var(--shadow-primary)]",
      },
      size: {
        xs: "h-[16px] rounded-full px-1.5 text-[8.5px] uppercase tracking-wider",
        sm: "h-[20px] rounded-full px-2 text-[10px] uppercase tracking-wider",
        default: "h-[22px] rounded-full px-2.5 text-[11px]",
        lg: "h-[26px] rounded-full px-3 text-xs font-semibold",
      },
      shape: {
        pill: "rounded-full",
        square: "rounded-lg",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "pill",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({
  className,
  variant,
  size,
  shape,
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const dotColorClass = {
    default: "bg-primary-foreground",
    secondary: "bg-primary",
    destructive: "bg-destructive-foreground",
    outline: "bg-primary",
    glass: "bg-primary",
    success: "bg-white",
    warning: "bg-white",
    info: "bg-primary",
    glow: "bg-primary",
  }[variant || "default"];

  return (
    <span
      className={cn(badgeVariants({ variant, size, shape }), className)}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0 mr-1",
            dotColorClass,
            variant === "glow" || variant === "glass" ? "animate-pulse" : ""
          )}
        />
      )}
      {children}
    </span>
  );
}

export { Badge, badgeVariants }
