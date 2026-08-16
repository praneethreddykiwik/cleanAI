'use client';

import * as React from "react"
import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar"
import { cn } from "@/lib/utils"

export type AvatarStatus = 'online' | 'busy' | 'offline' | 'none';

export interface AvatarProps extends AvatarPrimitive.Root.Props {
  size?: 'xs' | 'sm' | 'default' | 'lg' | 'xl';
  status?: AvatarStatus;
}

function Avatar({
  className,
  size = "default",
  status = "none",
  ...props
}: AvatarProps) {
  const sizeClasses = {
    xs: 'size-6 text-[9px]',
    sm: 'size-7.5 text-xs',
    default: 'size-9 text-sm',
    lg: 'size-11 text-base',
    xl: 'size-14 text-lg',
  };

  const statusColor = {
    online: 'bg-success ring-white dark:ring-zinc-950',
    busy: 'bg-warning ring-white dark:ring-zinc-950',
    offline: 'bg-muted-foreground/60 ring-white dark:ring-zinc-950',
    none: 'hidden',
  }[status];

  const statusSize = {
    xs: 'size-1.5',
    sm: 'size-2',
    default: 'size-2.5',
    lg: 'size-3',
    xl: 'size-3.5',
  }[size];

  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn(
        "group/avatar relative flex shrink-0 rounded-full select-none shadow-xs border border-border/20",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {props.children}
      {status !== 'none' && (
        <span
          data-slot="avatar-status"
          className={cn(
            "absolute right-0 bottom-0 z-10 inline-block rounded-full ring-2",
            statusColor,
            statusSize,
            status === 'online' ? 'animate-pulse' : ''
          )}
        />
      )}
    </AvatarPrimitive.Root>
  )
}

function AvatarImage({ className, ...props }: AvatarPrimitive.Image.Props) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn(
        "aspect-square size-full rounded-full object-cover",
        className
      )}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: AvatarPrimitive.Fallback.Props) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full font-bold",
        "bg-gradient-to-br from-primary/10 to-primary/20 text-primary dark:from-primary/20 dark:to-primary/30 dark:text-blue-400",
        className
      )}
      {...props}
    />
  )
}

function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        "group/avatar-group flex -space-x-2.5 items-center hover:space-x-[-4px] transition-all duration-300",
        "*:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background",
        className
      )}
      {...props}
    />
  )
}

function AvatarGroupCount({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        "relative flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-2 ring-background",
        "bg-muted/80 backdrop-blur-xs text-muted-foreground border border-border/40 shadow-xs",
        "group-data-[size=xs]/avatar-group:size-6",
        "group-data-[size=sm]/avatar-group:size-7.5",
        "group-data-[size=lg]/avatar-group:size-11",
        "group-data-[size=xl]/avatar-group:size-14",
        className
      )}
      {...props}
    />
  )
}

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
}
