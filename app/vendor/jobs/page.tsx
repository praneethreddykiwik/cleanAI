'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Search,
  CheckCircle2,
  XCircle,
  UserPlus,
  Users,
  Eye,
  Loader2,
  Compass,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/shared/Pagination';
import {
  containerVariants,
  cardVariants,
  tableRowVariants,
} from '@/lib/animations';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiCall } from '@/lib/api';
import { GoogleMapProvider } from '@/components/shared/GoogleMapProvider';
import { BookingMapPreview } from '@/components/shared/BookingMapPreview';
import { VendorNavigationButton } from '@/components/shared/VendorNavigationButton';

export default function VendorJobsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'COMPLETED'>('ALL');
  
  // Assign Agent Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [activeJobId, setActiveJobId] = useState('');

  // Fetch Vendor Bookings/Jobs
  const { data: bookingsData, refetch, isLoading } = useQuery({
    queryKey: ['vendor-jobs'],
    queryFn: () => apiCall('/bookings'),
  });
  const jobs = bookingsData?.data || [];

  // Fetch Vendor Agents (for assigning)
  const { data: agentsData } = useQuery({
    queryKey: ['vendor-agents'],
    queryFn: () => apiCall('/vendors/agents'),
  });
  const agents = agentsData?.data || [];

  // Accept Job Mutation
  const acceptMutation = useMutation({
    mutationFn: (id: string) => {
      return apiCall(`/bookings/${id}/accept`, { method: 'PATCH' });
    },
    onSuccess: () => {
      toast.success('Job accepted successfully!');
      queryClient.invalidateQueries({ queryKey: ['vendor-jobs'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to accept job');
    },
  });

  // Decline/Reject Job Mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => {
      return apiCall(`/bookings/${id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      });
    },
    onSuccess: () => {
      toast.success('Job declined successfully.');
      queryClient.invalidateQueries({ queryKey: ['vendor-jobs'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to decline job');
    },
  });

  // Assign Agent Mutation
  const assignAgentMutation = useMutation({
    mutationFn: ({ bookingId, agentId }: { bookingId: string; agentId: string }) => {
      return apiCall(`/bookings/${bookingId}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ agentId }),
      });
    },
    onSuccess: () => {
      toast.success('Agent assigned successfully.');
      setShowAssignModal(false);
      queryClient.invalidateQueries({ queryKey: ['vendor-jobs'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to assign agent');
    },
  });

  const handleAcceptJob = (id: string) => {
    acceptMutation.mutate(id);
  };

  const handleRejectJob = (id: string) => {
    const reason = prompt('Please enter decline reason:');
    if (reason) {
      rejectMutation.mutate({ id, reason });
    }
  };

  const handleAssignAgent = (agentId: string, agentName: string) => {
    assignAgentMutation.mutate({ bookingId: activeJobId, agentId });
  };

  // Filter Jobs
  const filteredJobs = jobs.filter((job: any) => {
    const custName = job.customer?.user 
      ? `${job.customer.user.firstName} ${job.customer.user.lastName}` 
      : 'Customer';
    const matchesSearch =
      (job.service?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      custName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.bookingNumber || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'ALL') return matchesSearch;
    if (statusFilter === 'PENDING') return job.status === 'PENDING' && matchesSearch;
    if (statusFilter === 'ACCEPTED') {
      return (job.status === 'CONFIRMED' || job.status === 'VENDOR_ACCEPTED' || job.status === 'AGENT_ASSIGNED' || job.status === 'IN_PROGRESS') && matchesSearch;
    }
    if (statusFilter === 'COMPLETED') return job.status === 'COMPLETED' && matchesSearch;

    return matchesSearch;
  });

  return (
    <DashboardLayout
      role="vendor"
      breadcrumbs={[{ label: 'Vendor Portal' }, { label: 'Jobs' }]}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Jobs Management</h2>
            <p className="text-sm text-muted-foreground">
              Review requests, accept tasks, and dispatch agents.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex bg-muted/60 p-1 rounded-xl border border-border/50 self-start">
            {(['ALL', 'PENDING', 'ACCEPTED', 'COMPLETED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
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
              placeholder="Search Customer, ID, Service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-9 pr-4 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all"
            />
          </div>
        </div>

        {/* Jobs List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-xs text-muted-foreground">
              <Loader2 size={24} className="animate-spin text-primary mb-2" />
              Loading vendor jobs feed...
            </div>
          ) : filteredJobs.length > 0 ? (
            filteredJobs.map((job: any, i: number) => {
              const customerName = job.customer?.user 
                ? `${job.customer.user.firstName} ${job.customer.user.lastName}` 
                : 'Customer';
              
              return (
                <motion.div
                  key={job.id}
                  custom={i}
                  variants={tableRowVariants}
                  className="bg-card rounded-2xl border border-border/50 p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-border/20">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-md border border-border/20">
                          {job.bookingNumber}
                        </span>
                        <StatusBadge status={job.status} size="sm" />
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{job.service?.name}</h3>
                        <p className="text-xs text-muted-foreground font-semibold">
                          Customer: {customerName} · {job.customer?.user?.phone || 'No phone number'}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground font-semibold">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-muted-foreground/60" />
                          {formatDate(job.scheduledDate)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock size={13} className="text-muted-foreground/60" />
                          {job.scheduledTime}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-muted-foreground/60" />
                          {job.address?.line1}
                        </span>
                      </div>

                      {job.agent && (
                        <div className="pt-1 flex items-center gap-1.5 text-xs text-primary font-semibold">
                          <Users size={13} />
                          <span>Assigned Agent: {job.agent.user?.firstName} {job.agent.user?.lastName}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-row md:flex-col items-end gap-3 justify-between w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-border/50 shrink-0">
                      <div className="text-left md:text-right">
                        <p className="text-[10px] text-muted-foreground font-medium">Job Value</p>
                        <p className="text-sm font-bold text-foreground">{formatCurrency(job.totalAmount)}</p>
                      </div>

                      <div className="flex gap-2">
                        {job.status === 'PENDING' && (
                          <>
                            <Button
                              size="xs"
                              variant="destructive"
                              disabled={rejectMutation.isPending}
                              onClick={() => handleRejectJob(job.id)}
                              className="rounded-lg"
                            >
                              <XCircle size={11} /> Reject
                            </Button>
                            <Button
                              size="xs"
                              disabled={acceptMutation.isPending}
                              onClick={() => handleAcceptJob(job.id)}
                              className="rounded-lg bg-green-600 hover:bg-green-700 text-white border-green-600"
                            >
                              <CheckCircle2 size={11} /> Accept
                            </Button>
                          </>
                        )}

                        {job.status === 'CONFIRMED' && (
                          <Button
                            size="xs"
                            onClick={() => {
                              setActiveJobId(job.id);
                              setShowAssignModal(true);
                            }}
                            className="gap-1 rounded-lg"
                          >
                            <UserPlus size={11} /> Assign Agent
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Location picker & Map navigation area */}
                  {job.status !== 'PENDING' && (
                    <div className="mt-4 pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2 space-y-2 text-xs flex flex-col justify-between">
                        <div className="space-y-1">
                          <p className="font-semibold text-foreground">Service Address Details</p>
                          <p className="text-muted-foreground leading-relaxed">
                            {job.address?.line1} {job.address?.line2 ? `· ${job.address.line2}` : ''}
                            <br />
                            {job.address?.city}, {job.address?.state} - {job.address?.pincode}
                          </p>
                          <p className="text-muted-foreground font-medium">
                            Country: {job.country || 'India'}
                          </p>
                        </div>

                        <div className="pt-2 w-full max-w-xs">
                          <VendorNavigationButton latitude={job.latitude} longitude={job.longitude} />
                        </div>
                      </div>

                      <div className="w-full h-32 rounded-xl overflow-hidden border border-border/20 shadow-3xs">
                        <GoogleMapProvider>
                          <BookingMapPreview latitude={job.latitude} longitude={job.longitude} />
                        </GoogleMapProvider>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })
          ) : (
            <motion.div
              variants={cardVariants}
              className="text-center py-16 border border-dashed border-border rounded-2xl bg-card/50"
            >
              <Users className="mx-auto w-10 h-10 text-muted-foreground/60 mb-3" />
              <h3 className="text-sm font-semibold text-foreground">No jobs found</h3>
              <p className="text-xs text-muted-foreground mt-1">
                There are no job bookings matches this filter state.
              </p>
            </motion.div>
          )}
        </div>

        {/* Pagination */}
        {filteredJobs.length > 0 && (
          <div className="pt-4">
            <Pagination
              currentPage={1}
              totalPages={1}
              onPageChange={() => {}}
              hasNextPage={false}
              hasPreviousPage={false}
            />
          </div>
        )}

        {/* Assign Agent Dialog Overlay */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl"
            >
              <div>
                <h3 className="text-base font-bold text-foreground">Assign Service Agent</h3>
                <p className="text-xs text-muted-foreground">Select a verified professional to dispatch.</p>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {agents.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No active agents found.</p>
                ) : (
                  agents.map((agent: any) => (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => handleAssignAgent(agent.id, `${agent.user.firstName} ${agent.user.lastName}`)}
                      className="w-full flex items-center justify-between p-3 border border-border/60 rounded-xl hover:bg-muted/40 transition-colors text-left"
                    >
                      <div>
                        <p className="text-xs font-semibold text-foreground">{agent.user.firstName} {agent.user.lastName}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">
                          Status: {agent.status.toLowerCase()}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'w-2.5 h-2.5 rounded-full',
                          agent.status === 'AVAILABLE' ? 'bg-green-500' : 'bg-amber-500'
                        )}
                      />
                    </button>
                  ))
                )}
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setShowAssignModal(false)}>
                  Cancel
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
