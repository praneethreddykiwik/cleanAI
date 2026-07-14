'use client';

import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:brightness-105 active:brightness-95 shadow-[var(--shadow-primary)] bg-gradient-to-b from-primary to-primary-hover",
        outline:
          "border-border/40 bg-white/10 dark:bg-white/5 backdrop-blur-xs hover:bg-foreground/5 dark:hover:bg-white/8 hover:text-foreground hover:border-border/70 aria-expanded:bg-foreground/5 aria-expanded:text-foreground dark:border-border/20",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-muted active:bg-muted/80 border border-border/20 shadow-2xs",
        ghost:
          "hover:bg-foreground/5 hover:text-foreground active:bg-foreground/8 aria-expanded:bg-foreground/5 aria-expanded:text-foreground dark:hover:bg-white/5 dark:active:bg-white/8",
        destructive:
          "bg-destructive text-destructive-foreground hover:brightness-105 active:brightness-95 shadow-[var(--shadow-error)]",
        success:
          "bg-success text-white hover:brightness-105 active:brightness-95 shadow-[var(--shadow-success)]",
        danger:
          "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/25 hover:bg-red-500/20 active:bg-red-500/15",
        glass:
          "glass-2 border border-white/40 dark:border-white/10 shadow-glass hover:shadow-glass-hover hover:bg-white/30 dark:hover:bg-white/12",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-9.5 gap-1.5 px-4.5 has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5",
        xs: "h-6.5 gap-1 px-3 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 px-3.5 text-[0.8rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-1.5 px-5.5 text-base",
        icon: "size-9.5 rounded-full",
        "icon-xs":
          "size-6.5 rounded-full [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm":
          "size-8 rounded-full",
        "icon-lg": "size-11 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, isLoading = false, disabled, children, ...props }, ref) => {
    const isButtonDisabled = disabled || isLoading;

    if (asChild) {
      return (
        <Slot
          data-slot="button"
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...(props as any)}
        />
      )
    }

    return (
      <motion.button
        data-slot="button"
        disabled={isButtonDisabled}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        whileHover={isButtonDisabled ? undefined : { scale: 1.02, y: -0.5 }}
        whileTap={isButtonDisabled ? undefined : { scale: 0.97, y: 0 }}
        transition={{ type: "spring", stiffness: 450, damping: 22 }}
        {...(props as any)}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5 text-current"
              fill="none"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </motion.button>
    )
  }
)

Button.displayName = "Button"

export { Button, buttonVariants }
