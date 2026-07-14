'use client';

import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Briefcase, Award, CheckCircle, ArrowUpRight, BarChart2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { containerVariants, cardVariants } from '@/lib/animations';
import { formatCurrency, cn } from '@/lib/utils';

export default function VendorAnalyticsPage() {
  const stats = [
    { label: 'Total Earnings', value: formatCurrency(145800), change: '+12.4%', icon: DollarSign, trend: 'up' },
    { label: 'Completed Jobs', value: '112', change: '+8.3%', icon: CheckCircle, trend: 'up' },
    { label: 'Average Ticket Size', value: formatCurrency(1300), change: '+2.1%', icon: Briefcase, trend: 'up' },
    { label: 'Customer Rating', value: '4.9/5.0', change: 'Top 5%', icon: Award, trend: 'up' },
  ];

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
        {/* Title */}
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analytics & Insights</h2>
          <p className="text-sm text-muted-foreground">
            Track business growth, earnings history, and service team performance metrics.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, idx) => (
            <motion.div
              key={idx}
              variants={cardVariants}
              className="p-5 bg-card border border-border/50 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden group hover:border-primary/20 hover:shadow-md transition-all duration-300"
            >
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</span>
                <h3 className="text-xl font-extrabold text-foreground">{s.value}</h3>
                <span className="text-[10px] text-green-600 font-semibold flex items-center gap-0.5">
                  <ArrowUpRight size={10} /> {s.change} this month
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <s.icon size={18} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Core Charts Area (Static mock cards showing clean UI) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Earnings card */}
          <motion.div
            variants={cardVariants}
            className="p-6 bg-card border border-border/50 rounded-3xl shadow-sm lg:col-span-2 space-y-4"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <BarChart2 size={16} className="text-primary" /> Monthly Revenue Trend
              </h3>
              <select className="text-xs font-semibold bg-accent border border-border rounded-lg p-1.5 outline-none">
                <option>Last 6 Months</option>
                <option>Last Year</option>
              </select>
            </div>
            <div className="h-64 flex items-end justify-between gap-2 pt-6">
              {[
                { month: 'Jan', val: 65 },
                { month: 'Feb', val: 78 },
                { month: 'Mar', val: 95 },
                { month: 'Apr', val: 110 },
                { month: 'May', val: 125 },
                { month: 'Jun', val: 145 },
              ].map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${bar.val}%` }}
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

          {/* Service distribution */}
          <motion.div
            variants={cardVariants}
            className="p-6 bg-card border border-border/50 rounded-3xl shadow-sm space-y-4"
          >
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <TrendingUp size={16} className="text-primary" /> Popular Services
            </h3>
            <div className="space-y-4 pt-2">
              {[
                { name: 'Deep Home Cleaning', count: 48, percentage: 42, color: 'bg-blue-500' },
                { name: 'Kitchen Sanitization', count: 32, percentage: 28, color: 'bg-green-500' },
                { name: 'AC Servicing & Repair', count: 20, percentage: 18, color: 'bg-amber-500' },
                { name: 'Bathroom Cleaning', count: 12, percentage: 12, color: 'bg-purple-500' },
              ].map((serv, i) => (
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
                      className={cn('h-full rounded-full', serv.color)}
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
