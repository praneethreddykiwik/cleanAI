'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  ClipboardList,
  TrendingUp,
  ChevronRight,
  Bell,
  CheckCircle2,
  Timer,
  Sparkles,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard, StatsGrid } from '@/components/shared/StatCard';
import { BookingCard } from '@/components/shared/BookingCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { WelcomeHero } from '@/components/shared/WelcomeHero';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  containerVariants,
  cardVariants,
  containerFastVariants,
} from '@/lib/animations';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiCall } from '@/lib/api';
import { useNotifications, NotificationItem } from '@/hooks/useNotifications';
import { PageSkeleton } from '@/components/shared/Skeletons';
import { cn } from '@/lib/utils';
import { SupportChatbot } from '@/components/shared/SupportChatbot';
import { useState } from 'react';

// ==================
// Profile Completion
// ==================
function ProfileCompletionBanner({ percentage }: { percentage: number }) {
  return (
    <GlassCard
      level={2}
      glow
      className="p-5 border border-white/50 dark:border-white/8 shadow-xs"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex-1 space-y-3">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              Complete your profile setup
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
              Add a verified address and payment info to unlock 1-click booking and priority matching with top-rated local technicians.
            </p>
          </div>
          <Progress value={percentage} size="xs" variant="default" showLabel={false} />
        </div>

        <Button
          variant="glass"
          size="sm"
          className="self-start md:self-auto border-white/40 dark:border-white/10 shrink-0 font-bold"
          asChild
        >
          <Link href="/customer/profile">Finish Setup</Link>
        </Button>
      </div>
    </GlassCard>
  );
}

// ==================
// AI Booking Promo
// ==================
function AIBookingPromo() {
  return (
    <GlassCard
      level={3}
      glow
      className="bg-gradient-to-br from-indigo-900/40 via-indigo-950/20 to-slate-950/40 border-indigo-500/15 dark:border-indigo-500/25 p-5 text-foreground shadow-lg"
    >
      <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-indigo-500/8 rounded-full blur-2xl pointer-events-none" />
      <div className="relative z-10 space-y-4">
        <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-500/15 border border-indigo-400/20 rounded-full text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider leading-none">
          <Sparkles size={9} className="fill-indigo-400 shrink-0" />
          AI Matchmaker
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold leading-tight uppercase tracking-wider text-indigo-400">Match with top agents instantly</h4>
          <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
            Our smart matching engine links you with verified local cleaners or repair technicians in under 2 minutes.
          </p>
        </div>
        <Button
          variant="default"
          size="sm"
          className="w-full bg-primary hover:bg-primary-hover font-bold text-xs rounded-xl shadow-md gap-1.5"
          asChild
        >
          <Link href="/customer/services">
            Book Service Now <ChevronRight size={12} strokeWidth={2.5} />
          </Link>
        </Button>
      </div>
    </GlassCard>
  );
}

// ==================
// Customer Dashboard
// ==================
export default function CustomerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [showSupportChat, setShowSupportChat] = useState(false);

  // Query actual bookings list
  const { data: bookingsData, isLoading: isBookingsLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const res = await apiCall('/bookings');
      return res.data as any[];
    },
  });

  // Query actual notifications
  const { notifications: allNotifications, isLoading: isNotificationsLoading } = useNotifications({
    status: 'ALL',
    limit: 5,
  });

  const bookings = bookingsData || [];

  const upcomingBookings = bookings.filter((b) =>
    ['PENDING', 'CONFIRMED', 'VENDOR_ACCEPTED', 'AGENT_ASSIGNED', 'IN_PROGRESS'].includes(b.status)
  );

  const completedBookings = bookings.filter((b) => b.status === 'COMPLETED');

  const totalSpent = completedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const isLoading = isBookingsLoading || isNotificationsLoading;

  if (isLoading) {
    return (
      <DashboardLayout role="customer" breadcrumbs={[{ label: 'Home Services' }, { label: 'Dashboard' }]}>
        <PageSkeleton />
      </DashboardLayout>
    );
  }

  // Formatting booking data for our unified BookingCard component
  const formatBookingForCard = (b: any) => ({
    id: b.id,
    serviceName: b.service?.name || 'Home Service',
    serviceCategory: b.service?.category || 'Service',
    status: b.status || 'PENDING',
    date: b.scheduledDate || '',
    time: b.scheduledTime || '10:00 AM',
    price: b.totalAmount || 0,
    address: b.address?.streetAddress ? `${b.address.streetAddress}, ${b.address.city}` : undefined,
    vendorName: b.vendor?.businessName,
    agent: b.agent ? { name: `${b.agent.firstName} ${b.agent.lastName}`, avatar: b.agent.avatar } : undefined,
  });

  return (
    <DashboardLayout
      role="customer"
      breadcrumbs={[
        { label: 'Home Services' },
        { label: 'Dashboard' },
      ]}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6 w-full"
      >
        {/* Welcome Header */}
        <WelcomeHero
          name={user?.firstName || 'User'}
          subtitle="Here's what's happening with your bookings today."
          role="customer"
        />

        {/* Profile Completion */}
        <ProfileCompletionBanner percentage={user?.customer?.profileCompletionPercentage || 75} />

        {/* Statistics Cards Grid */}
        <StatsGrid columns={4}>
          <StatCard
            title="Total Bookings"
            value={bookings.length}
            icon={ClipboardList}
            iconColor="text-blue-600 dark:text-blue-400"
            iconBg="bg-blue-500/10 border-blue-500/20"
            trendData={[2, 4, 3, 5, 4, 6, bookings.length]}
            index={0}
          />
          <StatCard
            title="Upcoming"
            value={upcomingBookings.length}
            icon={Calendar}
            iconColor="text-purple-600 dark:text-purple-400"
            iconBg="bg-purple-500/10 border-purple-500/20"
            trendData={[1, 2, 2, 3, 1, 2, upcomingBookings.length]}
            index={1}
          />
          <StatCard
            title="Completed"
            value={completedBookings.length}
            icon={CheckCircle2}
            iconColor="text-green-600 dark:text-green-400"
            iconBg="bg-green-500/10 border-green-500/20"
            trendData={[0, 1, 1, 2, 3, 4, completedBookings.length]}
            index={2}
          />
          <StatCard
            title="Total Spent"
            value={totalSpent}
            icon={TrendingUp}
            iconColor="text-orange-600 dark:text-orange-400"
            iconBg="bg-orange-500/10 border-orange-500/20"
            format="currency"
            trendData={[1500, 2000, 1800, 3200, 2800, 4100, totalSpent]}
            index={3}
          />
        </StatsGrid>

        {/* Page layout split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Bookings */}
            <GlassCard level={2} className="border border-white/40 dark:border-white/10 shadow-xs">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <Timer size={15} className="text-primary" />
                  <h3 className="text-xs font-semibold text-muted-foreground/80">Upcoming Bookings</h3>
                  <span className="text-[10px] font-extrabold bg-primary/10 text-primary px-2 py-0.5 rounded-full leading-none">
                    {upcomingBookings.length}
                  </span>
                </div>
                <Link
                  href="/customer/bookings"
                  className="text-xs text-primary hover:text-primary-hover flex items-center gap-0.5 font-semibold transition-colors"
                >
                  View all <ChevronRight size={12} strokeWidth={2.5} />
                </Link>
              </div>

              <motion.div
                variants={containerFastVariants}
                initial="hidden"
                animate="visible"
                className="p-5 space-y-4"
              >
                {upcomingBookings.length > 0 ? (
                  upcomingBookings.slice(0, 3).map((booking, i) => (
                    <BookingCard
                      key={booking.id}
                      booking={formatBookingForCard(booking)}
                      index={i}
                      variant="full"
                      onClick={() => router.push(`/customer/bookings`)}
                    />
                  ))
                ) : (
                  <EmptyState
                    icon={Calendar}
                    title="No upcoming bookings"
                    description="Schedule a local service technician to get started."
                    action={{
                      label: "Browse Services",
                      onClick: () => router.push('/customer/services'),
                    }}
                  />
                )}
              </motion.div>
            </GlassCard>

            {/* Recent activity list */}
            <GlassCard level={2} className="border border-white/40 dark:border-white/10 shadow-xs">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <ClipboardList size={15} className="text-muted-foreground" />
                  <h3 className="text-xs font-semibold text-muted-foreground/80">Recent Activity</h3>
                </div>
                <Link
                  href="/customer/bookings"
                  className="text-xs text-primary hover:text-primary-hover flex items-center gap-0.5 font-semibold transition-colors"
                >
                  View all <ChevronRight size={12} strokeWidth={2.5} />
                </Link>
              </div>

              <motion.div
                variants={containerFastVariants}
                initial="hidden"
                animate="visible"
                className="p-5 space-y-3"
              >
                {completedBookings.length === 0 ? (
                  <div className="text-center py-6 text-xs font-semibold text-muted-foreground/80">
                    No completed jobs found in your history.
                  </div>
                ) : (
                  completedBookings.slice(0, 3).map((booking, i) => (
                    <BookingCard
                      key={booking.id}
                      booking={formatBookingForCard(booking)}
                      index={i}
                      variant="compact"
                      onClick={() => router.push(`/customer/bookings`)}
                    />
                  ))
                )}
              </motion.div>
            </GlassCard>
          </div>

          {/* Right Column Widget lists */}
          <div className="space-y-6">
            <AIBookingPromo />

            {/* Notifications panel widget */}
            <GlassCard level={2} className="border border-white/40 dark:border-white/10 shadow-xs">
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <Bell size={14} className="text-muted-foreground" />
                  <h3 className="text-xs font-semibold text-muted-foreground/80">Notifications</h3>
                </div>
                <Link
                  href="/customer/notifications"
                  className="text-xs text-primary hover:text-primary-hover font-semibold transition-colors"
                >
                  All Alerts
                </Link>
              </div>

              <div className="p-4 divide-y divide-border/20">
                {allNotifications.length === 0 ? (
                  <div className="text-center py-4 text-xs font-semibold text-muted-foreground/80">
                    No recent alerts.
                  </div>
                ) : (
                  allNotifications.slice(0, 3).map((notif: NotificationItem) => (
                    <div key={notif.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
                      <div className="text-sm shrink-0 mt-0.5 leading-none">🔔</div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-xs text-foreground truncate', !notif.isRead ? 'font-bold' : 'font-medium')}>
                          {notif.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground/85 line-clamp-1 mt-0.5 leading-relaxed font-semibold">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      </motion.div>

      {/* Floating AI Support Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={() => setShowSupportChat(!showSupportChat)}
          className="rounded-full shadow-lg bg-primary hover:bg-primary-hover text-white flex items-center gap-1.5 px-4 h-11 font-bold text-xs"
        >
          <Sparkles size={14} className="animate-pulse" />
          <span>AI Help Desk</span>
        </Button>
      </div>

      {/* AI Help Desk Chat Modal */}
      <AnimatePresence>
        {showSupportChat && (
          <div className="fixed inset-0 bg-black/45 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md"
            >
              <SupportChatbot onCancel={() => setShowSupportChat(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
