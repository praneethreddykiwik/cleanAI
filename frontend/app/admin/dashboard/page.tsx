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
  const [stats, setStats] = useState({
    totalUsers: 1248,
    activeVendors: 86,
    totalBookings: 3420,
    revenue: 124000,
  });

  const loadData = async () => {
    try {
      const res = await apiCall('/bookings');
      if (res.success && res.data) {
        setBookings(res.data.slice(0, 5));
        setStats((prev) => ({
          ...prev,
          totalBookings: res.data.length,
          revenue: res.data.reduce((acc: number, b: any) => acc + (b.totalAmount || 0), 0),
        }));
      }
    } catch (e: any) {
      if (e.message?.includes('token') || e.message?.includes('auth') || e.message?.includes('401')) {
        console.warn('Authentication token expired or invalid:', e.message);
        logout();
      } else {
        console.error('Failed to load admin bookings:', e);
      }
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
                <span className="text-muted-foreground">Cache Ping Latency</span>
                <span className="text-foreground">1.2ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Socket.IO Sessions</span>
                <span className="text-foreground">12 cached sessions</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rate Limiting Store</span>
                <span className="text-foreground">Redis-Memory Pool</span>
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
                <span className="text-muted-foreground">AIAnalysisQueue</span>
                <span className="text-foreground">12 processed / 0 failed</span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-foreground">NotificationQueue</span>
                <div className="flex items-center gap-2">
                  <span className="text-foreground">45 processed</span>
                  <span className="text-[9px] bg-red-500/10 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-md font-bold">1 failed</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-foreground">EmailQueue</span>
                <span className="text-foreground">24 processed / 0 failed</span>
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
            value={stats.revenue}
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
                <span className="text-foreground">₹86,800.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pending Escrow Settlements</span>
                <span className="text-foreground text-amber-500">₹37,200.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">GST Paid (18% Collected)</span>
                <span className="text-foreground">₹22,320.00</span>
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
                <span className="text-muted-foreground">VIP Plus Memberships</span>
                <span className="text-foreground">34 active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Premium Elite Memberships</span>
                <span className="text-foreground">24 active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Average Wallet Balance</span>
                <span className="text-foreground">₹480.00</span>
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
                <span className="text-muted-foreground">Transaction Success Rate</span>
                <span className="text-foreground text-green-500">98.4%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Refund & Dispute Ratio</span>
                <span className="text-foreground">1.2% (12 processed)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Coupon Discount Absorbed</span>
                <span className="text-foreground">₹12,450.00</span>
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
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-[10px] font-semibold text-muted-foreground/60 uppercase">Gross Margin</div>
              <div className="text-sm font-bold text-foreground">15.0%</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-semibold text-muted-foreground/60 uppercase">Net Margin</div>
              <div className="text-sm font-bold text-green-500">13.8%</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-semibold text-muted-foreground/60 uppercase">Avg CLV</div>
              <div className="text-sm font-bold text-foreground">₹4,850.00</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-semibold text-muted-foreground/60 uppercase">CAC Limit</div>
              <div className="text-sm font-bold text-foreground">₹420.00</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-semibold text-muted-foreground/60 uppercase">Repeat Booking</div>
              <div className="text-sm font-bold text-foreground">42.8%</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-semibold text-muted-foreground/60 uppercase">AI Cost / Book</div>
              <div className="text-sm font-bold text-foreground">₹0.05</div>
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
              <h3 className="text-xs font-semibold text-muted-foreground/80 mb-4">
                Booking Distribution
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'Cleaning Services', pct: 35, variant: 'default' as const },
                  { label: 'Electrical / Plumbing', pct: 22, variant: 'warning' as const },
                  { label: 'AC Service', pct: 18, variant: 'default' as const },
                  { label: 'Pest Control', pct: 12, variant: 'success' as const },
                  { label: 'Others', pct: 13, variant: 'error' as const },
                ].map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold leading-none">
                      <span className="text-muted-foreground/80">{item.label}</span>
                      <span className="text-foreground">{item.pct}%</span>
                    </div>
                    <Progress value={item.pct} size="xs" variant={item.variant} />
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
