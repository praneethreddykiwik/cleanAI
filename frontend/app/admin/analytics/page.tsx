'use client';

import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, DollarSign, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { containerVariants, cardVariants } from '@/lib/animations';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function AdminAnalyticsPage() {
  const stats = [
    { label: 'Platform GMV', value: formatCurrency(1894200), change: '+18.4%', trend: 'up', icon: DollarSign },
    { label: 'Active Users', value: '4,821', change: '+24.1%', trend: 'up', icon: Users },
    { label: 'Total Bookings', value: '12,982', change: '-2.4%', trend: 'down', icon: Activity },
    { label: 'Platform Comm.', value: formatCurrency(189420), change: '+18.4%', trend: 'up', icon: TrendingUp },
  ];

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
        {/* Title */}
        <div>
          <h2 className="text-2xl font-bold text-foreground">Global Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Monitor platform revenue trends, user growth metrics, and B2B/B2C conversions in real-time.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, idx) => (
            <motion.div
              key={idx}
              variants={cardVariants}
              className="p-5 bg-card border border-border/50 rounded-2xl flex items-center justify-between shadow-sm hover:border-primary/20 hover:shadow-md transition-all duration-300 group"
            >
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</span>
                <h3 className="text-xl font-extrabold text-foreground">{s.value}</h3>
                <span className={cn(
                  'text-[10px] font-semibold flex items-center gap-0.5',
                  s.trend === 'up' ? 'text-green-600' : 'text-red-600'
                )}>
                  {s.trend === 'up' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />} {s.change} this month
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <s.icon size={18} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Growth graphs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            variants={cardVariants}
            className="p-6 bg-card border border-border/50 rounded-3xl shadow-sm lg:col-span-2 space-y-4"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <BarChart3 size={16} className="text-primary" /> Month-on-Month Platform GMV Growth
              </h3>
              <select className="text-xs font-semibold bg-accent border border-border rounded-lg p-1.5 outline-none">
                <option>Last 6 Months</option>
                <option>Last Year</option>
              </select>
            </div>
            <div className="h-64 flex items-end justify-between gap-2 pt-6">
              {[
                { month: 'Jan', val: 55 },
                { month: 'Feb', val: 70 },
                { month: 'Mar', val: 82 },
                { month: 'Apr', val: 105 },
                { month: 'May', val: 140 },
                { month: 'Jun', val: 189 },
              ].map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(bar.val / 189) * 100}%` }}
                    transition={{ delay: i * 0.1, duration: 0.8, ease: 'easeOut' }}
                    className="w-full max-w-[40px] bg-gradient-to-t from-primary/80 to-primary rounded-t-lg relative group"
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[9px] font-bold py-1 px-1.5 rounded shadow border opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                      ₹{bar.val}k
                    </div>
                  </motion.div>
                  <span className="text-[10px] font-bold text-muted-foreground">{bar.month}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* User Distribution */}
          <motion.div
            variants={cardVariants}
            className="p-6 bg-card border border-border/50 rounded-3xl shadow-sm space-y-4"
          >
            <h3 className="text-sm font-bold text-foreground">User Distribution by Role</h3>
            <div className="space-y-4 pt-2">
              {[
                { role: 'Customers', count: '4,102', percentage: 85, color: 'bg-primary' },
                { role: 'Vendors', count: '512', percentage: 10, color: 'bg-green-500' },
                { role: 'Agents', count: '207', percentage: 5, color: 'bg-blue-500' },
              ].map((item, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-foreground">{item.role}</span>
                    <span className="text-muted-foreground">{item.count} ({item.percentage}%)</span>
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
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
