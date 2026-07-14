'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Headphones, ShieldAlert, MessageSquare, Check, Eye } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { containerVariants, cardVariants } from '@/lib/animations';
import { toast } from 'sonner';

interface TicketItem {
  id: string;
  userEmail: string;
  issue: string;
  category: 'DISPUTE' | 'REFUND' | 'SYSTEM';
  status: 'OPEN' | 'RESOLVED';
  createdAt: string;
}

const INITIAL_TICKETS: TicketItem[] = [
  { id: '1', userEmail: 'ramesh.s@gmail.com', issue: 'Service delay: Agent did not start cleaning on scheduled time window.', category: 'DISPUTE', status: 'OPEN', createdAt: '30 mins ago' },
  { id: '2', userEmail: 'priya_sharma@gmail.com', issue: 'Refund request: Charged platform fee twice during checkout failure.', category: 'REFUND', status: 'OPEN', createdAt: '2 hours ago' },
  { id: '3', userEmail: 'vendor.superplumb@cleanai.in', issue: 'GST certificate document rejected audit issue query.', category: 'SYSTEM', status: 'RESOLVED', createdAt: '1 day ago' },
];

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<TicketItem[]>(INITIAL_TICKETS);

  const handleResolve = (id: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'RESOLVED' } : t))
    );
    toast.success('Ticket status marked as Resolved.');
  };

  return (
    <DashboardLayout
      role="admin"
      breadcrumbs={[{ label: 'Admin Portal' }, { label: 'Disputes & Support Queue' }]}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto space-y-6"
      >
        {/* Title */}
        <div>
          <h2 className="text-2xl font-bold text-foreground">Support & Disputes Queue</h2>
          <p className="text-sm text-muted-foreground">
            Manage customer complaints, coordinate service disputes resolution, and issue checkout transaction refunds.
          </p>
        </div>

        {/* Tickets Checklist */}
        <div className="space-y-3">
          {tickets.map((t) => (
            <motion.div
              key={t.id}
              variants={cardVariants}
              className="p-5 bg-card border border-border/50 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-border transition-colors shadow-sm"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold tracking-wide uppercase ${
                    t.category === 'DISPUTE'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : t.category === 'REFUND'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {t.category}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    Submitted {t.createdAt} by {t.userEmail}
                  </span>
                </div>
                <p className="text-xs font-semibold text-foreground leading-relaxed">
                  {t.issue}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                {t.status === 'OPEN' ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleResolve(t.id)}
                      className="gap-1 rounded-xl text-[10px] h-8 bg-green-600 hover:bg-green-700"
                    >
                      <Check size={12} /> Mark Resolved
                    </Button>
                  </>
                ) : (
                  <span className="text-[10px] text-green-700 font-bold bg-green-50 px-2 py-1 rounded-xl border border-green-200">
                    Resolved
                  </span>
                )}
                <Button variant="outline" size="icon" className="w-8 h-8 rounded-lg text-muted-foreground">
                  <Eye size={14} />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
