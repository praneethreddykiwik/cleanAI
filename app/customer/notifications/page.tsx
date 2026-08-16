'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Bell, Check, Trash2, Calendar, ShieldAlert, CreditCard, Sparkles } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { containerVariants, cardVariants } from '@/lib/animations';
import { useNotifications, NotificationItem } from '@/hooks/useNotifications';
import { useRouter } from 'next/navigation';

export default function CustomerNotificationsPage() {
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const { notifications, unreadCount, markAsRead, markAllRead, deleteNotification, isLoading } = useNotifications({
    status: filter,
  });
  const router = useRouter();

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.isRead) {
      markAsRead(item.id);
    }
    if (item.actionUrl) {
      router.push(item.actionUrl);
    }
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'BOOKING':
        return <Calendar className="text-blue-500" size={16} />;
      case 'PAYMENT':
        return <CreditCard className="text-green-500" size={16} />;
      case 'PROMOTION':
        return <Sparkles className="text-purple-500" size={16} />;
      case 'ALERT':
        return <ShieldAlert className="text-amber-500" size={16} />;
      default:
        return <Bell className="text-primary" size={16} />;
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
    <DashboardLayout
      role="customer"
      breadcrumbs={[{ label: 'Home Services' }, { label: 'Notifications' }]}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Notifications</h2>
            <p className="text-sm text-muted-foreground">
              Stay updated with booking requests, support alerts, and platform offers.
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllRead()}
              className="gap-1.5 rounded-xl text-xs font-semibold"
            >
              <Check size={14} /> Mark all read
            </Button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="flex bg-muted/60 p-1 rounded-xl border border-border/50 self-start w-fit">
          <button
            onClick={() => setFilter('ALL')}
            className={cn(
              'px-4 py-1.5 rounded-lg text-xs font-semibold transition-all',
              filter === 'ALL' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            )}
          >
            All Alerts
          </button>
          <button
            onClick={() => setFilter('UNREAD')}
            className={cn(
              'px-4 py-1.5 rounded-lg text-xs font-semibold transition-all',
              filter === 'UNREAD' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            )}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-muted-foreground">Loading...</div>
          ) : notifications.length > 0 ? (
            notifications.map((notif: NotificationItem) => (
              <motion.div
                key={notif.id}
                variants={cardVariants}
                className={cn(
                  'flex items-start gap-4 p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden cursor-pointer',
                  notif.isRead
                    ? 'bg-card border-border/40 hover:border-border'
                    : 'bg-gradient-to-r from-primary/5 to-card border-primary/20 shadow-sm'
                )}
                onClick={() => handleNotificationClick(notif)}
              >
                {/* Visual Read State Bar */}
                {!notif.isRead && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                )}

                {/* Left Icon Panel */}
                <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shrink-0">
                  {getIcon(notif.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className={cn('text-xs text-foreground truncate', !notif.isRead ? 'font-bold' : 'font-normal')}>
                      {notif.title}
                    </h3>
                    {!notif.isRead && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {notif.message}
                  </p>
                  <span className="inline-block text-[10px] text-muted-foreground font-medium pt-1">
                    {getRelativeTime(notif.createdAt)}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {!notif.isRead && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => markAsRead(notif.id)}
                      className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
                      title="Mark as read"
                    >
                      <Check size={14} />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteNotification(notif.id)}
                    className="w-8 h-8 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-12 bg-card border border-dashed border-border/60 rounded-3xl text-center space-y-3">
              <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center">
                <Bell size={20} className="text-muted-foreground" />
              </div>
              <p className="text-xs font-bold text-foreground">All caught up!</p>
              <p className="text-[11px] text-muted-foreground max-w-xs">
                You have no new notifications at this time.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
