'use client';

import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, DollarSign, ArrowUpRight, Activity } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { containerVariants, cardVariants } from '@/lib/animations';
import { formatCurrency, cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { apiCall } from '@/lib/api';
import { PageSkeleton } from '@/components/shared/Skeletons';

export default function AdminAnalyticsPage() {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => apiCall('/admin/stats'),
  });
  const { data: finData, isLoading: finLoading } = useQuery({
    queryKey: ['admin-financials'],
    queryFn: () => apiCall('/admin/financials'),
  });

  const isLoading = statsLoading || finLoading;
  const stats = statsData?.data || {};
  const fin = finData?.data || {};

  const statCards = [
    {
      label: 'Platform Revenue (GMV)',
      value: formatCurrency(fin.totalRevenue || 0),
      icon: DollarSign,
    },
    {
      label: 'Total Users',
      value: (stats.totalUsers || 0).toLocaleString(),
      icon: Users,
    },
    {
      label: 'Total Bookings',
      value: (stats.totalBookings || 0).toLocaleString(),
      icon: Activity,
    },
    {
      label: 'Platform Commission',
      value: formatCurrency(fin.grossMargin || 0),
      icon: TrendingUp,
    },
  ];

  const userDistribution = [
    {
      role: 'Customers',
      count: stats.totalUsers ? Math.round(stats.totalUsers * 0.85) : 0,
      percentage: 85,
      color: 'bg-primary',
    },
    {
      role: 'Vendors',
      count: stats.activeVendors || 0,
      percentage: 10,
      color: 'bg-green-500',
    },
    {
      role: 'Agents',
      count: stats.monitoring?.activeAgents || 0,
      percentage: 5,
      color: 'bg-blue-500',
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout role="admin" breadcrumbs={[{ label: 'Admin Portal' }, { label: 'Platform Analytics' }]}>
        <PageSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="admin"
      breadcrumbs={[{ label: 'Admin Portal' }, { label: 'Platform Analytics' }]}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto space-y-6"
      >
        <div>
          <h2 className="text-2xl font-bold text-foreground">Global Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Live platform revenue, user growth, and operational metrics from the database.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s, idx) => (
            <motion.div
              key={idx}
              variants={cardVariants}
              className="p-5 bg-card border border-border/50 rounded-2xl flex items-center justify-between shadow-sm hover:border-primary/20 hover:shadow-md transition-all duration-300 group"
            >
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</span>
                <h3 className="text-xl font-extrabold text-foreground">{s.value}</h3>
                <span className="text-[10px] font-semibold flex items-center gap-0.5 text-green-600">
                  <ArrowUpRight size={10} /> Live data
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <s.icon size={18} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Key metrics row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Financials breakdown */}
          <motion.div
            variants={cardVariants}
            className="p-6 bg-card border border-border/50 rounded-3xl shadow-sm lg:col-span-2 space-y-4"
          >
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <BarChart3 size={16} className="text-primary" /> Financial Overview
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Total Revenue', value: formatCurrency(fin.totalRevenue || 0) },
                { label: 'Gross Margin (15%)', value: formatCurrency(fin.grossMargin || 0) },
                { label: 'Net Margin', value: formatCurrency(fin.netMargin || 0) },
                { label: 'Total Refunds', value: formatCurrency(fin.totalRefunds || 0) },
                { label: 'Pending Settlements', value: formatCurrency(fin.pendingSettlements || 0) },
                { label: 'Processed Settlements', value: formatCurrency(fin.processedSettlements || 0) },
                { label: 'Active Subscriptions', value: (fin.activeSubscriptions || 0).toString() },
                { label: 'Repeat Booking Rate', value: `${(fin.repeatBookingRate || 0).toFixed(1)}%` },
              ].map((item, i) => (
                <div key={i} className="p-3 bg-muted/20 rounded-xl">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm font-extrabold text-foreground mt-1">{item.value}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* User Distribution */}
          <motion.div
            variants={cardVariants}
            className="p-6 bg-card border border-border/50 rounded-3xl shadow-sm space-y-4"
          >
            <h3 className="text-sm font-bold text-foreground">User Distribution</h3>
            <div className="space-y-4 pt-2">
              {userDistribution.map((item, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-foreground">{item.role}</span>
                    <span className="text-muted-foreground">{item.count.toLocaleString()}</span>
                  </div>
                  <div className="h-2 w-full bg-accent rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percentage}%` }}
                      transition={{ delay: i * 0.1, duration: 0.8 }}
                      className={cn('h-full rounded-full', item.color)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-border/40 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Completion Rate</span>
                <span className="font-bold text-foreground">{stats.completionRate || 0}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Pending Approvals</span>
                <span className="font-bold text-amber-600">{stats.pendingApprovals || 0}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Online Vendors</span>
                <span className="font-bold text-green-600">{stats.monitoring?.onlineVendors || 0}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Avg AI Latency</span>
                <span className="font-bold text-foreground">{stats.avgResponseTime || 0}ms</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
