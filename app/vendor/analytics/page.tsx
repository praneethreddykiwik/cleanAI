'use client';

import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Briefcase, Award, ArrowUpRight, BarChart2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { containerVariants, cardVariants } from '@/lib/animations';
import { formatCurrency, cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { apiCall } from '@/lib/api';
import { PageSkeleton } from '@/components/shared/Skeletons';

export default function VendorAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['vendor-analytics'],
    queryFn: () => apiCall('/vendors/analytics'),
  });
  const analytics = data?.data || {};

  const monthlyRevenue: { month: string; val: number }[] = analytics.monthlyRevenue || [];
  const serviceBreakdown: { name: string; count: number; percentage: number }[] = analytics.serviceBreakdown || [];
  const maxVal = Math.max(...monthlyRevenue.map((m) => m.val), 1);

  const statCards = [
    {
      label: 'Total Earnings',
      value: formatCurrency(analytics.totalEarnings || 0),
      icon: DollarSign,
    },
    {
      label: 'Completed Jobs',
      value: (analytics.completedJobs || 0).toString(),
      icon: Briefcase,
    },
    {
      label: 'Average Ticket Size',
      value: formatCurrency(analytics.avgTicket || 0),
      icon: TrendingUp,
    },
    {
      label: 'Customer Rating',
      value: `${(analytics.rating || 0).toFixed(1)}/5.0`,
      icon: Award,
    },
  ];

  const COLORS = ['bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-purple-500'];

  if (isLoading) {
    return (
      <DashboardLayout role="vendor" breadcrumbs={[{ label: 'B2B Portal' }, { label: 'Analytics & Insights' }]}>
        <PageSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="vendor"
      breadcrumbs={[{ label: 'B2B Portal' }, { label: 'Analytics & Insights' }]}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto space-y-6"
      >
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analytics & Insights</h2>
          <p className="text-sm text-muted-foreground">
            Live business performance metrics from your completed jobs and payments.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s, idx) => (
            <motion.div
              key={idx}
              variants={cardVariants}
              className="p-5 bg-card border border-border/50 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden group hover:border-primary/20 hover:shadow-md transition-all duration-300"
            >
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</span>
                <h3 className="text-xl font-extrabold text-foreground">{s.value}</h3>
                <span className="text-[10px] text-green-600 font-semibold flex items-center gap-0.5">
                  <ArrowUpRight size={10} /> Live data
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <s.icon size={18} />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Revenue Chart */}
          <motion.div
            variants={cardVariants}
            className="p-6 bg-card border border-border/50 rounded-3xl shadow-sm lg:col-span-2 space-y-4"
          >
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <BarChart2 size={16} className="text-primary" /> Monthly Revenue Trend (₹000s)
            </h3>
            {monthlyRevenue.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-muted-foreground font-semibold">
                No revenue data yet.
              </div>
            ) : (
              <div className="h-64 flex items-end justify-between gap-2 pt-6">
                {monthlyRevenue.map((bar, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(bar.val / maxVal) * 100}%` }}
                      transition={{ delay: i * 0.1, duration: 0.8, ease: 'easeOut' }}
                      className="w-full max-w-[40px] bg-gradient-to-t from-primary/80 to-primary rounded-t-lg relative group"
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[9px] font-bold py-1 px-1.5 rounded shadow border opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap">
                        ₹{bar.val}k
                      </div>
                    </motion.div>
                    <span className="text-[10px] font-bold text-muted-foreground">{bar.month}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Service distribution */}
          <motion.div
            variants={cardVariants}
            className="p-6 bg-card border border-border/50 rounded-3xl shadow-sm space-y-4"
          >
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <TrendingUp size={16} className="text-primary" /> Popular Services
            </h3>
            {serviceBreakdown.length === 0 ? (
              <div className="pt-8 text-center text-sm text-muted-foreground font-semibold">
                Complete jobs to see service breakdown.
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                {serviceBreakdown.map((serv, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-foreground truncate max-w-[150px]">{serv.name}</span>
                      <span className="text-muted-foreground">{serv.count} jobs ({serv.percentage}%)</span>
                    </div>
                    <div className="h-2 w-full bg-accent rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${serv.percentage}%` }}
                        transition={{ delay: i * 0.1, duration: 0.8 }}
                        className={cn('h-full rounded-full', COLORS[i % COLORS.length])}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
