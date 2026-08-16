'use client';

import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, IndianRupee, ArrowRight, UserCheck } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { cardVariants } from '@/lib/animations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge } from './StatusBadge';

interface Agent {
  name: string;
  avatar?: string;
}

interface Booking {
  id: string;
  serviceName: string;
  serviceCategory?: string;
  status: string;
  date: string;
  time?: string;
  price: number;
  address?: string;
  agent?: Agent;
  vendorName?: string;
}

interface BookingCardProps {
  booking: Booking;
  index?: number;
  variant?: 'compact' | 'full';
  onClick?: () => void;
  onActionClick?: (e: React.MouseEvent) => void;
  actionLabel?: string;
}

export function BookingCard({
  booking,
  index = 0,
  variant = 'full',
  onClick,
  onActionClick,
  actionLabel = 'Manage details',
}: BookingCardProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  const formattedDate = () => {
    try {
      const d = new Date(booking.date);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return booking.date;
    }
  };

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -2, scale: 1.005 }}
      onClick={onClick}
      className={cn(
        'relative overflow-hidden transition-all duration-300 border rounded-2xl p-5',
        'glass-2 border-white/30 dark:border-white/5 bg-linear-to-br from-white/5 via-transparent to-transparent',
        'shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]',
        onClick && 'cursor-pointer'
      )}
    >
      {/* Glow highlight */}
      <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />

      {variant === 'compact' ? (
        // COMPACT VARIANT
        <div className="flex items-center gap-4 relative z-10 justify-between">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">{booking.serviceName}</h3>
            <div className="flex items-center gap-3 mt-1.5 text-[11px] font-medium text-muted-foreground/80">
              <span className="flex items-center gap-1">
                <Calendar size={12} className="opacity-60" />
                {formattedDate()}
              </span>
              {booking.time && (
                <span className="flex items-center gap-1">
                  <Clock size={12} className="opacity-60" />
                  {booking.time}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm font-semibold text-foreground">{formatCurrency(booking.price)}</span>
            <StatusBadge status={booking.status} size="sm" />
          </div>
        </div>
      ) : (
        // FULL VARIANT
        <div className="space-y-4 relative z-10">
          {/* Header row */}
          <div className="flex items-start justify-between gap-4">
            <div>
              {booking.serviceCategory && (
                <Badge variant="glow" size="xs" className="mb-2">
                  {booking.serviceCategory}
                </Badge>
              )}
              <h3 className="text-sm font-semibold text-foreground tracking-tight leading-snug">
                {booking.serviceName}
              </h3>
            </div>
            <StatusBadge status={booking.status} />
          </div>

          {/* Specs row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3 border-y border-border/20 text-xs font-medium text-muted-foreground/80">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar size={13} className="text-muted-foreground/50 shrink-0" />
                <span>Scheduled: {formattedDate()}</span>
              </div>
              {booking.time && (
                <div className="flex items-center gap-2">
                  <Clock size={13} className="text-muted-foreground/50 shrink-0" />
                  <span>Time Slot: {booking.time}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <IndianRupee size={13} className="text-muted-foreground/50 shrink-0" />
                <span className="text-foreground font-semibold">Total Paid: {formatCurrency(booking.price)}</span>
              </div>
              {booking.address && (
                <div className="flex items-center gap-2">
                  <MapPin size={13} className="text-muted-foreground/50 shrink-0" aria-hidden="true" />
                  <span className="truncate" title={booking.address}>{booking.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer row (agent/vendor and buttons) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            {/* Assigned Partner / Agent info */}
            {booking.agent ? (
              <div className="flex items-center gap-2.5">
                <Avatar size="sm" status="online">
                  <AvatarImage src={booking.agent.avatar} alt={booking.agent.name} />
                  <AvatarFallback className="text-[10px] font-bold">
                    {getInitials(booking.agent.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-[9px] font-medium text-muted-foreground/60 leading-none">
                    Assigned Agent
                  </p>
                  <p className="text-xs font-semibold text-foreground mt-1 leading-none">{booking.agent.name}</p>
                </div>
              </div>
            ) : booking.vendorName ? (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <UserCheck size={12} />
                </div>
                <div>
                  <p className="text-[9px] font-medium text-muted-foreground/60 leading-none">
                    Vendor Partner
                  </p>
                  <p className="text-xs font-semibold text-foreground mt-0.5 leading-none">{booking.vendorName}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground/50">
                <div className="w-6 h-6 rounded-lg bg-foreground/5 flex items-center justify-center">
                  <Clock size={12} />
                </div>
                <span className="text-[11px] font-medium">Awaiting AI Matchmaker...</span>
              </div>
            )}

            {/* CTAs */}
            {onActionClick && (
              <Button
                variant="glass"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onActionClick(e);
                }}
                className="w-full sm:w-auto"
              >
                {actionLabel}
                <ArrowRight size={13} strokeWidth={2.2} />
              </Button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
