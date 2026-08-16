'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Search, Eye, Star, ShieldCheck } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/shared/Pagination';
import { containerVariants, tableRowVariants } from '@/lib/animations';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiCall } from '@/lib/api';
import { PageSkeleton } from '@/components/shared/Skeletons';

export default function AdminVendorsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'SUSPENDED'>('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-vendors'],
    queryFn: () => apiCall('/admin/vendors'),
  });
  const vendors: any[] = data?.data || [];

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiCall(`/admin/vendors/${id}/approve`, { method: 'PATCH' }),
    onSuccess: () => {
      toast.success('Vendor onboarding approved.');
      queryClient.invalidateQueries({ queryKey: ['admin-vendors'] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to approve vendor'),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => apiCall(`/admin/vendors/${id}/reject`, { method: 'PATCH' }),
    onSuccess: () => {
      toast.error('Vendor application rejected.');
      queryClient.invalidateQueries({ queryKey: ['admin-vendors'] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to reject vendor'),
  });

  const filteredVendors = vendors.filter((vendor) => {
    const name = vendor.businessName || '';
    const owner = vendor.user ? `${vendor.user.firstName} ${vendor.user.lastName}` : '';
    const gst = vendor.gstNumber || '';
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gst.includes(searchQuery);
    if (statusFilter === 'ALL') return matchesSearch;
    return vendor.status === statusFilter && matchesSearch;
  });

  if (isLoading) {
    return (
      <DashboardLayout role="admin" breadcrumbs={[{ label: 'Admin Portal' }, { label: 'Vendors' }]}>
        <PageSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="admin"
      breadcrumbs={[{ label: 'Admin Portal' }, { label: 'Vendors' }]}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto space-y-6"
      >
        <div>
          <h2 className="text-2xl font-bold text-foreground">Vendors Directory</h2>
          <p className="text-sm text-muted-foreground">
            Approve new business partners, view ratings, and manage status.
          </p>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex bg-muted/60 p-1 rounded-xl border border-border/50 self-start">
            {(['ALL', 'PENDING', 'APPROVED', 'SUSPENDED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  statusFilter === tab
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.toLowerCase()}
              </button>
            ))}
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search Business, GST, Owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-9 pr-4 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary"
            />
          </div>
        </div>

        {filteredVendors.length === 0 ? (
          <div className="text-center py-16 text-sm text-muted-foreground font-semibold">
            No vendors found.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredVendors.map((vendor, i) => {
              const ownerName = vendor.user
                ? `${vendor.user.firstName} ${vendor.user.lastName}`
                : 'Unknown';
              const ownerEmail = vendor.user?.email || '';
              return (
                <motion.div
                  key={vendor.id}
                  custom={i}
                  variants={tableRowVariants}
                  className="bg-card border border-border/50 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-all"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      {vendor.gstNumber && (
                        <span className="text-[10px] font-mono font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-md">
                          GSTIN: {vendor.gstNumber}
                        </span>
                      )}
                      <StatusBadge status={vendor.status} size="sm" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        {vendor.businessName || 'Unnamed Business'}
                        {vendor.status === 'APPROVED' && (
                          <ShieldCheck size={13} className="text-green-600" />
                        )}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Owner: {ownerName} · {ownerEmail}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <Star size={11} className="fill-amber-400 text-amber-400" />
                        {vendor.rating > 0 ? vendor.rating.toFixed(1) : 'N/A'}
                      </span>
                      <span>{vendor.totalJobs || 0} Jobs Completed</span>
                      {vendor.createdAt && (
                        <span>Joined {formatDate(vendor.createdAt)}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {vendor.status === 'PENDING' && (
                      <>
                        <Button
                          size="xs"
                          variant="destructive"
                          onClick={() => rejectMutation.mutate(vendor.id)}
                          disabled={rejectMutation.isPending}
                          className="rounded-lg"
                        >
                          Reject
                        </Button>
                        <Button
                          size="xs"
                          onClick={() => approveMutation.mutate(vendor.id)}
                          disabled={approveMutation.isPending}
                          className="rounded-lg bg-green-600 hover:bg-green-700 text-white"
                        >
                          Approve
                        </Button>
                      </>
                    )}
                    {vendor.status === 'APPROVED' && (
                      <span className="text-[10px] text-green-700 font-bold bg-green-50 px-2 py-1 rounded-xl border border-green-200">
                        Active
                      </span>
                    )}
                    {vendor.status === 'REJECTED' && (
                      <span className="text-[10px] text-red-700 font-bold bg-red-50 px-2 py-1 rounded-xl border border-red-200">
                        Rejected
                      </span>
                    )}
                    <Button variant="ghost" size="xs" className="gap-1 rounded-lg text-[11px]">
                      <Eye size={11} /> Docs
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <Pagination
          currentPage={1}
          totalPages={1}
          onPageChange={() => {}}
          hasNextPage={false}
          hasPreviousPage={false}
        />
      </motion.div>
    </DashboardLayout>
  );
}
