'use client';

import { motion } from 'framer-motion';
import { Check, Eye, MessageSquare } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { containerVariants, cardVariants } from '@/lib/animations';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiCall } from '@/lib/api';
import { PageSkeleton } from '@/components/shared/Skeletons';
import { formatDate } from '@/lib/utils';

export default function AdminSupportPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-support-tickets'],
    queryFn: () => apiCall('/admin/support-tickets'),
  });
  const tickets: any[] = data?.data || [];

  const resolveMutation = useMutation({
    mutationFn: (id: string) => apiCall(`/admin/support-tickets/${id}/resolve`, { method: 'PATCH' }),
    onSuccess: () => {
      toast.success('Ticket marked as resolved.');
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to resolve ticket'),
  });

  const getCategoryLabel = (ticket: any) => {
    const issue = ticket.issue || ticket.issueDescription || '';
    if (issue.toLowerCase().includes('refund')) return { label: 'REFUND', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (issue.toLowerCase().includes('dispute') || issue.toLowerCase().includes('delay')) return { label: 'DISPUTE', cls: 'bg-red-50 text-red-700 border-red-200' };
    return { label: 'SUPPORT', cls: 'bg-blue-50 text-blue-700 border-blue-200' };
  };

  if (isLoading) {
    return (
      <DashboardLayout role="admin" breadcrumbs={[{ label: 'Admin Portal' }, { label: 'Disputes & Support Queue' }]}>
        <PageSkeleton />
      </DashboardLayout>
    );
  }

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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Support & Disputes Queue</h2>
            <p className="text-sm text-muted-foreground">
              Manage customer complaints, disputes, and transaction refund requests.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
            <MessageSquare size={14} />
            {tickets.filter((t) => t.status === 'PENDING' || t.status === 'OPEN').length} open
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="text-center py-16 text-sm text-muted-foreground font-semibold">
            No support tickets found.
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => {
              const cat = getCategoryLabel(t);
              const issue = t.issue || t.issueDescription || 'No description';
              const isOpen = t.status === 'PENDING' || t.status === 'OPEN';
              return (
                <motion.div
                  key={t.id}
                  variants={cardVariants}
                  className="p-5 bg-card border border-border/50 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-border transition-colors shadow-sm"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold tracking-wide uppercase border ${cat.cls}`}>
                        {cat.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        {t.userName || t.userEmail} · {formatDate(t.createdAt)}
                      </span>
                      {t.bookingRef && (
                        <span className="text-[10px] font-mono text-muted-foreground">
                          #{t.bookingRef}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-foreground leading-relaxed">{issue}</p>
                    {t.aiAnalysis && (
                      <p className="text-[10px] text-primary/80 font-medium">AI: {t.aiAnalysis}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {isOpen ? (
                      <Button
                        size="sm"
                        onClick={() => resolveMutation.mutate(t.id)}
                        disabled={resolveMutation.isPending}
                        className="gap-1 rounded-xl text-[10px] h-8 bg-green-600 hover:bg-green-700"
                      >
                        <Check size={12} /> Mark Resolved
                      </Button>
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
              );
            })}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
