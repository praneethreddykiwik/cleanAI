'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, Calendar, CreditCard, Sparkles, ShieldAlert, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNotifications, NotificationItem } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { dropdownVariants, backdropVariants } from '@/lib/animations';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'customer' | 'vendor' | 'admin';
}

export function NotificationDropdown({ isOpen, onClose, role }: NotificationDropdownProps) {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Fetch latest notifications scoped to dropdown limit = 5; only when auth is ready
  const { notifications, unreadCount, markAsRead, deleteNotification, markAllRead, isLoading } = useNotifications({
    status: 'ALL',
    limit: 5,
    isAuthenticated: isAuthenticated && !authLoading,
  });

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const getIconConfig = (type: NotificationItem['type']) => {
    switch (type) {
      case 'BOOKING':
        return {
          icon: <Calendar size={14} />,
          bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        };
      case 'PAYMENT':
        return {
          icon: <CreditCard size={14} />,
          bg: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
        };
      case 'PROMOTION':
        return {
          icon: <Sparkles size={14} />,
          bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        };
      case 'ALERT':
        return {
          icon: <ShieldAlert size={14} />,
          bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        };
      default:
        return {
          icon: <Bell size={14} />,
          bg: 'bg-primary/10 text-primary border-primary/20',
        };
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.isRead) {
      markAsRead(item.id);
    }
    onClose();
    if (item.actionUrl) {
      router.push(item.actionUrl);
    } else {
      router.push(`/${role}/notifications`);
    }
  };

  const getRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / (60 * 1000));
      const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
      const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Mobile Overlay */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/20 backdrop-blur-xs z-[var(--z-dropdown)] sm:hidden"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            ref={dropdownRef}
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              'fixed sm:absolute top-20 sm:top-full left-4 right-4 sm:left-auto sm:right-0 mt-2 sm:w-96 rounded-2xl border shadow-[var(--shadow-xl)] z-[var(--z-dropdown)] overflow-hidden',
              'glass-3 border-white/40 dark:border-white/10'
            )}
            role="menu"
            aria-label="Notifications list"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/30 bg-muted/20 dark:bg-white/3">
              <h2 className="font-bold text-xs uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5 leading-none">
                Notifications
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-[9px] font-extrabold bg-primary text-primary-foreground rounded-full animate-breathe leading-none">
                    {unreadCount}
                  </span>
                )}
              </h2>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead()}
                  className="text-xs text-primary hover:text-primary-hover font-semibold transition-colors duration-150"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* List items */}
            <div className="max-h-[340px] overflow-y-auto divide-y divide-border/20">
              {isLoading ? (
                <div className="p-8 text-center text-xs text-muted-foreground/80 font-medium">Loading notifications...</div>
              ) : notifications.length === 0 ? (
                <div className="p-10 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-foreground/5 dark:bg-white/5 flex items-center justify-center text-muted-foreground/50">
                    <Bell size={18} strokeWidth={1.5} />
                  </div>
                  <p className="font-semibold text-foreground/80">All caught up</p>
                  <p className="text-[10px] text-muted-foreground/60">No new alerts to display.</p>
                </div>
              ) : (
                notifications.map((item: NotificationItem) => {
                  const cfg = getIconConfig(item.type);
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'p-4 flex gap-3 hover:bg-foreground/4 dark:hover:bg-white/4 cursor-pointer transition-colors duration-150 relative group',
                        !item.isRead && 'bg-primary/[0.03] dark:bg-primary/[0.04]'
                      )}
                      onClick={() => handleNotificationClick(item)}
                    >
                      {/* Left Icon Wrapper */}
                      <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border', cfg.bg)}>
                        {cfg.icon}
                      </div>

                      {/* Content details */}
                      <div className="flex-1 min-w-0 pr-6">
                        <p className={cn('text-xs text-foreground truncate', !item.isRead ? 'font-bold' : 'font-medium')}>
                          {item.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground/90 line-clamp-2 mt-0.5 leading-relaxed">
                          {item.message}
                        </p>
                        <span className="text-[9px] font-bold text-muted-foreground/50 block mt-1.5">
                          {getRelativeTime(item.createdAt)}
                        </span>
                      </div>

                      {/* Floating actions */}
                      <div className="absolute right-3.5 top-3.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20">
                        {!item.isRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(item.id);
                            }}
                            className="p-1 hover:bg-foreground/5 dark:hover:bg-white/10 rounded-lg text-muted-foreground hover:text-primary transition-colors duration-100"
                            title="Mark as read"
                          >
                            <Check size={12} strokeWidth={2.5} />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(item.id);
                          }}
                          className="p-1 hover:bg-foreground/5 dark:hover:bg-white/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors duration-100"
                          title="Delete notification"
                        >
                          <Trash2 size={12} strokeWidth={2} />
                        </button>
                      </div>

                      {/* Pulse dot indicator */}
                      {!item.isRead && (
                        <div className="absolute right-4.5 bottom-4.5 w-2 h-2 rounded-full bg-primary ring-2 ring-background animate-pulse" />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <Link
              href={`/${role}/notifications`}
              onClick={onClose}
              className="flex items-center justify-center gap-1.5 py-3.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/30 border-t border-border/30 transition-all duration-200"
            >
              See all notifications
              <ArrowRight size={13} strokeWidth={2.2} />
            </Link>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
