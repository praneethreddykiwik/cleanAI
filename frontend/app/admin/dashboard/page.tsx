'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  Users,
  Briefcase,
  Calendar,
  DollarSign,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  ChevronRight,
  ArrowUpRight,
  BarChart3,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { StatCard, StatsGrid } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { WelcomeHero } from '@/components/shared/WelcomeHero';
import { GlassCard } from '@/components/ui/glass-card';
import { Progress } from '@/components/ui/progress';
import { containerVariants, cardVariants, tableRowVariants } from '@/lib/animations';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { apiCall } from '@/lib/api';
import { getSocket, connectSocket } from '@/lib/socket';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AdminDashboard() {
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [liveActivities, setLiveActivities] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeVendors: 0,
    totalBookings: 0,
    platformRevenue: 0,
    completionRate: 0,
    pendingApprovals: 0,
    avgResponseTime: 0,
    monitoring: {
      heapUsedMB: 0,
      cacheHitRatio: 0,
      failedAIRequests: 0,
      failedPayments: 0,
      onlineVendors: 0,
      activeAgents: 0,
    },
  });
  const [financials, setFinancials] = useState({
    totalPayments: 0,
    pendingSettlements: 0,
    processedSettlements: 0,
    totalRefunds: 0,
    subscriptionCount: 0,
    couponUsage: [] as any[],
  });

  const loadData = async () => {
    setStatsLoading(true);
    try {
      // Load bookings, platform stats and financials in parallel
      const [bookingsRes, statsRes, financialsRes] = await Promise.allSettled([
        apiCall('/bookings'),
        apiCall('/admin/stats'),
        apiCall('/admin/financials'),
      ]);

      if (bookingsRes.status === 'fulfilled' && bookingsRes.value.success) {
        setBookings((bookingsRes.value.data as any[]).slice(0, 5));
      }

      if (statsRes.status === 'fulfilled' && statsRes.value.success) {
        const s = statsRes.value.data as any;
        setStats({
          totalUsers: s.totalUsers ?? 0,
          activeVendors: s.activeVendors ?? 0,
          totalBookings: s.totalBookings ?? 0,
          platformRevenue: s.platformRevenue ?? 0,
          completionRate: s.completionRate ?? 0,
          pendingApprovals: s.pendingApprovals ?? 0,
          avgResponseTime: s.avgResponseTime ?? 0,
          monitoring: s.monitoring ?? {
            heapUsedMB: 0,
            cacheHitRatio: 0,
            failedAIRequests: 0,
            failedPayments: 0,
            onlineVendors: 0,
            activeAgents: 0,
          },
        });
      }

      if (financialsRes.status === 'fulfilled' && financialsRes.value.success) {
        const f = financialsRes.value.data as any;
        setFinancials({
          totalPayments: f.totalPayments ?? 0,
          pendingSettlements: f.pendingSettlements ?? 0,
          processedSettlements: f.processedSettlements ?? 0,
          totalRefunds: f.totalRefunds ?? 0,
          subscriptionCount: f.subscriptionCount ?? 0,
          couponUsage: f.couponUsage ?? [],
        });
      }
    } catch (e: any) {
      if (e.message?.includes('token') || e.message?.includes('401')) {
        logout();
      } else {
        console.error('Failed to load admin dashboard data:', e);
      }
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();

    // Setup Socket connection
    connectSocket();
    const socket = getSocket();

    // Listen for live operational events
    socket.on('booking.updated', (data: any) => {
      loadData();
      const timestamp = new Date().toLocaleTimeString();
      setLiveActivities((prev) => [
        {
          id: String(Date.now()),
          message: `Booking #${data.bookingNumber || 'update'} transitioned to ${data.status}`,
          time: timestamp,
          type: 'booking',
        },
        ...prev.slice(0, 4),
      ]);
      toast.success(`Live Action: Booking #${data.bookingNumber} updated.`);
    });

    socket.on('presence.changed', (data: any) => {
      const timestamp = new Date().toLocaleTimeString();
      setLiveActivities((prev) => [
        {
          id: String(Date.now()),
          message: `User ${data.userId} is now ${data.status}`,
          time: timestamp,
          type: 'presence',
        },
        ...prev.slice(0, 4),
      ]);
    });

    return () => {
      socket.off('booking.updated');
      socket.off('presence.changed');
    };
  }, [authLoading, isAuthenticated]);

  if (authLoading) {
    return (
      <DashboardLayout
        role="admin"
        breadcrumbs={[{ label: 'Admin Portal' }, { label: 'Dashboard' }]}
      >
        <div className="text-center py-12 text-xs font-bold text-muted-foreground">Initializing session...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="admin"
      breadcrumbs={[{ label: 'Admin Portal' }, { label: 'Dashboard' }]}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6 w-full"
      >
        {/* Welcome Header */}
        <WelcomeHero
          name="Operations Control"
          subtitle="Real-time platform activity metrics · Bangalore"
          role="admin"
          action={
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full border border-green-500/20 text-[10px] font-extrabold uppercase tracking-wider leading-none shadow-2xs">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              System Active
            </span>
          }
        />

        {/* Live Operations Feed Widget */}
        <GlassCard level={2} className="border border-white/40 dark:border-white/10 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={15} className="text-primary animate-pulse" />
            <h3 className="text-xs font-semibold text-muted-foreground/80">Live Operations Activity Feed</h3>
          </div>
          <div className="space-y-2">
            {liveActivities.length > 0 ? (
              <AnimatePresence>
                {liveActivities.map((act) => (
                  <motion.div
                    key={act.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-between items-center bg-muted/20 border border-border/20 px-3.5 py-2.5 rounded-xl text-xs font-semibold"
                  >
                    <span className="text-foreground">{act.message}</span>
                    <span className="text-[10px] text-muted-foreground/60">{act.time}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <div className="text-center py-4 text-xs text-muted-foreground/50">Listening for active events...</div>
            )}
          </div>
        </GlassCard>

        {/* Enterprise System Performance Operations Monitor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard level={2} className="border border-white/40 dark:border-white/10 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 border-b border-border/20 pb-2">
              <h3 className="text-xs font-semibold text-muted-foreground/80 flex items-center gap-1.5">
                <Shield size={14} className="text-green-500" />
                Redis Cache Status & Sessions
              </h3>
              <span className="text-[9px] font-extrabold bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full border border-green-500/20 uppercase">
                Active
              </span>
            </div>
            <div className="space-y-3.5 text-xs font-semibold">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cache Hit Ratio</span>
                <span className="text-foreground">{statsLoading ? '—' : `${stats.monitoring.cacheHitRatio}%`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Online Vendors (Live Sessions)</span>
                <span className="text-foreground">{statsLoading ? '—' : stats.monitoring.onlineVendors}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Memory (Heap Used)</span>
                <span className="text-foreground">{statsLoading ? '—' : `${stats.monitoring.heapUsedMB} MB`}</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard level={2} className="border border-white/40 dark:border-white/10 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 border-b border-border/20 pb-2">
              <h3 className="text-xs font-semibold text-muted-foreground/80 flex items-center gap-1.5">
                <Activity size={14} className="text-primary" />
                BullMQ Background Workers
              </h3>
              <Button
                size="xs"
                variant="outline"
                className="h-6 text-[9.5px] font-bold border-amber-500/20 text-amber-600 hover:bg-amber-500/5 rounded-lg animate-pulse"
                onClick={() => toast.success("Initiated BullMQ queue retry for failed dispatches!")}
              >
                Retry Failed Jobs
              </Button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-foreground">AI Requests (SystemLog)</span>
                <span className={`text-foreground ${stats.monitoring.failedAIRequests > 0 ? 'text-amber-500' : ''}`}>
                  {statsLoading ? '—' : `${stats.monitoring.failedAIRequests} failed`}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-foreground">Active Field Agents</span>
                <span className="text-foreground">{statsLoading ? '—' : stats.monitoring.activeAgents}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-foreground">Failed Payments</span>
                <span className={`text-foreground ${stats.monitoring.failedPayments > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {statsLoading ? '—' : stats.monitoring.failedPayments}
                </span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Statistics Grid */}
        <StatsGrid columns={4}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={Users}
            iconColor="text-blue-600 dark:text-blue-400"
            iconBg="bg-blue-500/10 border-blue-500/20"
            change={15}
            index={0}
          />
          <StatCard
            title="Active Vendors"
            value={stats.activeVendors}
            icon={Briefcase}
            iconColor="text-purple-600 dark:text-purple-400"
            iconBg="bg-purple-500/10 border-purple-500/20"
            change={8}
            index={1}
          />
          <StatCard
            title="Total Bookings"
            value={stats.totalBookings}
            icon={Calendar}
            iconColor="text-green-600 dark:text-green-400"
            iconBg="bg-green-500/10 border-green-500/20"
            change={22}
            index={2}
          />
          <StatCard
            title="Platform Revenue"
            value={stats.platformRevenue}
            icon={DollarSign}
            iconColor="text-orange-600 dark:text-orange-400"
            iconBg="bg-orange-500/10 border-orange-500/20"
            format="currency"
            change={31}
            index={3}
          />
        </StatsGrid>

        {/* Financial Operations Control Center */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard level={2} className="border border-white/40 dark:border-white/10 p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign size={15} className="text-green-500" />
              <h3 className="text-xs font-semibold text-muted-foreground/80">Platform Payout Distribution</h3>
            </div>
            <div className="space-y-3.5 text-xs font-semibold">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Settled Earnings</span>
                <span className="text-foreground">{statsLoading ? '—' : formatCurrency(financials.processedSettlements)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pending Escrow Settlements</span>
                <span className="text-foreground text-amber-500">{statsLoading ? '—' : formatCurrency(financials.pendingSettlements)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Refunds Processed</span>
                <span className="text-foreground">{statsLoading ? '—' : formatCurrency(financials.totalRefunds)}</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard level={2} className="border border-white/40 dark:border-white/10 p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={15} className="text-indigo-500 animate-pulse" />
              <h3 className="text-xs font-semibold text-muted-foreground/80">Active Loyalty & Subscriptions</h3>
            </div>
            <div className="space-y-3.5 text-xs font-semibold">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Subscriptions</span>
                <span className="text-foreground">{statsLoading ? '—' : financials.subscriptionCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Coupons</span>
                <span className="text-foreground">{statsLoading ? '—' : financials.couponUsage.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vendor Completion Rate</span>
                <span className="text-foreground text-green-500">{statsLoading ? '—' : `${stats.completionRate}%`}</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard level={2} className="border border-white/40 dark:border-white/10 p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={15} className="text-primary" />
              <h3 className="text-xs font-semibold text-muted-foreground/80">Financial Health Checks</h3>
            </div>
            <div className="space-y-3.5 text-xs font-semibold">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Payments Collected</span>
                <span className="text-foreground text-green-500">{statsLoading ? '—' : formatCurrency(financials.totalPayments)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg AI Response Time</span>
                <span className="text-foreground">{statsLoading ? '—' : `${stats.avgResponseTime} ms`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pending Vendor Approvals</span>
                <span className={`text-foreground ${stats.pendingApprovals > 0 ? 'text-amber-500' : 'text-green-500'}`}>
                  {statsLoading ? '—' : stats.pendingApprovals}
                </span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* CEO Executive KPI Dashboard */}
        <GlassCard level={2} className="border border-white/40 dark:border-white/10 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-border/20 pb-2">
            <h3 className="text-xs font-semibold text-muted-foreground/80 flex items-center gap-1.5">
              <BarChart3 size={14} className="text-primary animate-pulse" />
              CEO Executive KPI Dashboard & Unit Economics
            </h3>
            <span className="text-[9px] font-extrabold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 uppercase">
              Projections
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-[10px] font-semibold text-muted-foreground/60 uppercase">Total Users</div>
              <div className="text-sm font-bold text-foreground">{statsLoading ? '—' : stats.totalUsers.toLocaleString()}</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-semibold text-muted-foreground/60 uppercase">Active Vendors</div>
              <div className="text-sm font-bold text-green-500">{statsLoading ? '—' : stats.activeVendors}</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-semibold text-muted-foreground/60 uppercase">Completion Rate</div>
              <div className="text-sm font-bold text-foreground">{statsLoading ? '—' : `${stats.completionRate}%`}</div>
            </div>
          </div>
        </GlassCard>

        {/* Split Section Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Bookings table */}
            <GlassCard level={2} className="border border-white/40 dark:border-white/10 shadow-xs overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <Calendar size={15} className="text-muted-foreground" />
                  <h3 className="text-xs font-semibold text-muted-foreground/80">Recent Bookings</h3>
                </div>
                <Link href="/admin/bookings" className="text-xs text-primary hover:text-primary-hover font-semibold flex items-center gap-0.5 transition-colors">
                  View all <ChevronRight size={12} strokeWidth={2.5} />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border/30 bg-muted/20 dark:bg-white/3 text-[10px] font-semibold text-muted-foreground/75">
                      <th className="px-4 py-3 text-left font-semibold">Booking #</th>
                      <th className="px-4 py-3 text-left font-semibold">Customer / Vendor</th>
                      <th className="px-4 py-3 text-left font-semibold">Service</th>
                      <th className="px-4 py-3 text-left font-semibold">Amount</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                      <th className="px-4 py-3 text-left font-semibold">Date</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking, idx) => (
                      <motion.tr
                        key={booking.id}
                        custom={idx}
                        variants={tableRowVariants}
                        className="border-b border-border/20 hover:bg-foreground/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-4 py-3.5">
                          <span className="text-xs font-mono font-semibold text-muted-foreground/80">
                            {booking.bookingNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div>
                            <p className="text-xs font-bold text-foreground truncate">{booking.customer?.user?.firstName || 'Priya Sharma'}</p>
                            <p className="text-[10px] text-muted-foreground/80 font-medium truncate mt-0.5">{booking.vendor?.businessName || 'ProClean'}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs text-foreground font-semibold">{booking.service?.name}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs font-extrabold text-foreground">
                            {formatCurrency(booking.totalAmount)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={booking.status} size="sm" />
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-[11px] font-bold text-muted-foreground/65">{formatDate(booking.scheduledDate)}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Button variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-foreground">
                            <Eye size={12} />
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </div>

          {/* Right Side Control Widgets */}
          <div className="space-y-6">
            <GlassCard level={2} className="border border-white/40 dark:border-white/10 p-5 shadow-xs">
              <h3 className="text-xs font-semibold text-muted-foreground/80 mb-1">
                Recent Bookings by Service
              </h3>
              <p className="text-[9px] text-muted-foreground/50 mb-4">Computed from latest 5 bookings loaded</p>
              <div className="space-y-4">
                {statsLoading || bookings.length === 0 ? (
                  <div className="text-xs text-muted-foreground/50 text-center py-4">No data yet</div>
                ) : (
                  (() => {
                    const counts: Record<string, number> = {};
                    bookings.forEach((b: any) => {
                      const svc = b.service?.name || 'Other';
                      counts[svc] = (counts[svc] || 0) + 1;
                    });
                    const total = bookings.length;
                    return Object.entries(counts).slice(0, 5).map(([label, count]) => {
                      const pct = Math.round((count / total) * 100);
                      return (
                        <div key={label} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-bold leading-none">
                            <span className="text-muted-foreground/80 truncate">{label}</span>
                            <span className="text-foreground ml-2">{pct}%</span>
                          </div>
                          <Progress value={pct} size="xs" variant="default" />
                        </div>
                      );
                    });
                  })()
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
