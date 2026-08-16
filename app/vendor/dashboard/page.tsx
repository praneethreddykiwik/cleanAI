'use client';

import { motion } from 'framer-motion';
import {
  Briefcase,
  Users,
  DollarSign,
  ChevronRight,
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard, StatsGrid } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { WelcomeHero } from '@/components/shared/WelcomeHero';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  containerVariants,
  cardVariants,
  containerFastVariants,
  listItemVariants,
} from '@/lib/animations';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiCall } from '@/lib/api';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageSkeleton } from '@/components/shared/Skeletons';

export default function VendorDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query dashboard-summary from Express
  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ['vendor-dashboard'],
    queryFn: async () => {
      const res = await apiCall('/vendors/dashboard-summary');
      return res.data;
    },
  });

  // Accept Job Mutation
  const acceptMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiCall(`/bookings/${id}/accept`, { method: 'PATCH' });
    },
    onSuccess: () => {
      toast.success('Job accepted successfully!');
      queryClient.invalidateQueries({ queryKey: ['vendor-dashboard'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to accept job');
    },
  });

  // Reject Job Mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return apiCall(`/bookings/${id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      });
    },
    onSuccess: () => {
      toast.success('Job declined.');
      queryClient.invalidateQueries({ queryKey: ['vendor-dashboard'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to decline job');
    },
  });

  // Assign Agent Mutation
  const assignAgentMutation = useMutation({
    mutationFn: async ({ bookingId, agentId }: { bookingId: string; agentId: string }) => {
      return apiCall(`/bookings/${bookingId}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ agentId }),
      });
    },
    onSuccess: () => {
      toast.success('Agent assigned successfully.');
      queryClient.invalidateQueries({ queryKey: ['vendor-dashboard'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to assign agent');
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout role="vendor" breadcrumbs={[{ label: 'Vendor Portal' }, { label: 'Dashboard' }]}>
        <PageSkeleton />
      </DashboardLayout>
    );
  }

  const { stats, incomingJobs = [], todayJobs = [], agents = [] } = dashboardData || {};

  return (
    <DashboardLayout
      role="vendor"
      breadcrumbs={[
        { label: 'Vendor Portal' },
        { label: 'Dashboard' },
      ]}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6 w-full"
      >
        {/* Premium Welcome Header */}
        <WelcomeHero
          name={user?.firstName || 'Partner'}
          subtitle={`${user?.vendor?.businessName || 'CleanPro Services'} · Bangalore`}
          role="vendor"
          action={
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full border border-green-500/20 text-[10px] font-extrabold uppercase tracking-wider leading-none shadow-2xs">
                <CheckCircle2 size={12} />
                Verified
              </span>

              <Button
                variant="glass"
                size="sm"
                className="border border-white/40 dark:border-white/10 text-xs font-bold"
                asChild
              >
                <Link href="/vendor/jobs">
                  View Jobs <ChevronRight size={13} strokeWidth={2.5} />
                </Link>
              </Button>
            </div>
          }
        />

        {/* Statistics Grid */}
        <StatsGrid columns={4}>
          <StatCard
            title="Incoming Jobs"
            value={stats?.incomingJobsCount ?? 0}
            icon={AlertCircle}
            iconColor="text-amber-600 dark:text-amber-400"
            iconBg="bg-amber-500/10 border-amber-500/20"
            trendData={[4, 2, 6, 3, 5, 2, stats?.incomingJobsCount ?? 0]}
            index={0}
          />
          <StatCard
            title="Today's Jobs"
            value={stats?.todayJobsCount ?? 0}
            icon={Briefcase}
            iconColor="text-blue-600 dark:text-blue-400"
            iconBg="bg-blue-500/10 border-blue-500/20"
            trendData={[2, 3, 1, 4, 3, 2, stats?.todayJobsCount ?? 0]}
            index={1}
          />
          <StatCard
            title="This Month Revenue"
            value={stats?.monthlyRevenue ?? 0}
            icon={DollarSign}
            iconColor="text-green-600 dark:text-green-400"
            iconBg="bg-green-500/10 border-green-500/20"
            format="currency"
            trendData={[5000, 7500, 10000, 9200, 12800, 15400, stats?.monthlyRevenue ?? 0]}
            index={2}
          />
          <StatCard
            title="Active Agents"
            value={stats?.activeAgentsCount ?? 0}
            icon={Users}
            iconColor="text-purple-600 dark:text-purple-400"
            iconBg="bg-purple-500/10 border-purple-500/20"
            trendData={[3, 4, 4, 5, 5, 6, stats?.activeAgentsCount ?? 0]}
            index={3}
          />
        </StatsGrid>

        {/* Main Section split layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Area - Incoming & Today's jobs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Incoming Jobs list */}
            <GlassCard level={2} className="border border-white/40 dark:border-white/10 shadow-xs">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <AlertCircle size={15} className="text-amber-500" />
                  <h3 className="text-xs font-semibold text-muted-foreground/80">Incoming Jobs</h3>
                  <span className="text-[10px] font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20 leading-none">
                    {incomingJobs.length} new
                  </span>
                </div>
                <Link
                  href="/vendor/jobs"
                  className="text-xs text-primary hover:text-primary-hover font-semibold flex items-center gap-0.5 transition-colors"
                >
                  All Jobs <ChevronRight size={12} strokeWidth={2.5} />
                </Link>
              </div>

              <motion.div
                variants={containerFastVariants}
                initial="hidden"
                animate="visible"
                className="p-5 space-y-4"
              >
                {incomingJobs.length === 0 ? (
                  <div className="text-center py-6 text-xs font-semibold text-muted-foreground/80">
                    No pending job requests found for your catalog.
                  </div>
                ) : (
                  incomingJobs.map((job: any, i: number) => (
                    <motion.div
                      key={job.id}
                      custom={i}
                      variants={listItemVariants}
                      className="flex items-center gap-4 p-4 rounded-xl border border-white/30 dark:border-white/5 bg-foreground/[0.01] hover:bg-foreground/4 dark:hover:bg-white/4 transition-colors duration-250 group relative"
                    >
                      <div className="w-10 h-10 bg-amber-500/10 text-amber-600 border border-amber-500/25 rounded-xl flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
                        ✨
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-bold text-foreground truncate">{job.service.name}</p>
                          <StatusBadge status={job.status} size="sm" />
                        </div>
                        <p className="text-xs text-muted-foreground/90 font-semibold truncate leading-tight mt-0.5">
                          by {job.customer?.user?.name || 'Customer'} · {job.address?.city || 'Bangalore'}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground/60 font-semibold mt-2">
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {formatDate(job.scheduledDate)} · {job.scheduledTime}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex flex-col items-end gap-2">
                        <p className="text-sm font-extrabold text-foreground leading-none">
                          {formatCurrency(job.totalAmount)}
                        </p>
                        <div className="flex gap-1.5">
                          <motion.button
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => acceptMutation.mutate(job.id)}
                            className="w-7 h-7 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/25 flex items-center justify-center transition-colors"
                            title="Accept job"
                          >
                            <CheckCircle2 size={13} strokeWidth={2.5} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => {
                              const reason = prompt('Please enter decline reason:');
                              if (reason) {
                                rejectMutation.mutate({ id: job.id, reason });
                              }
                            }}
                            className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/25 flex items-center justify-center transition-colors"
                            title="Decline job"
                          >
                            <XCircle size={13} />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            </GlassCard>

            {/* Today's schedule list */}
            <GlassCard level={2} className="border border-white/40 dark:border-white/10 shadow-xs">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <Clock size={15} className="text-blue-500" />
                  <h3 className="text-xs font-semibold text-muted-foreground/80">Today&apos;s Schedule</h3>
                </div>
              </div>

              <motion.div
                variants={containerFastVariants}
                initial="hidden"
                animate="visible"
                className="p-3"
              >
                {todayJobs.length === 0 ? (
                  <div className="text-center py-8 text-xs font-semibold text-muted-foreground/80">
                    No service bookings scheduled for today.
                  </div>
                ) : (
                  todayJobs.map((job: any, i: number) => (
                    <motion.div
                      key={job.id}
                      custom={i}
                      variants={listItemVariants}
                      className="flex items-center gap-3.5 p-3.5 rounded-xl hover:bg-foreground/4 dark:hover:bg-white/4 transition-colors cursor-pointer"
                    >
                      <div className="w-8.5 h-8.5 bg-primary/10 rounded-lg flex items-center justify-center text-base shrink-0">
                        ⚡
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{job.service.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate leading-snug mt-0.5 font-medium">
                          {job.customer?.user?.name || 'Customer'} · {job.scheduledTime}
                        </p>
                        <p className="text-[10px] font-semibold text-primary/80 mt-1 tracking-normal">
                          Agent:{' '}
                          {job.agent
                            ? `${job.agent.user?.firstName || 'Assigned'} ${job.agent.user?.lastName || ''}`
                            : 'Unassigned'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <StatusBadge status={job.status} size="sm" />
                        <p className="text-xs font-bold text-foreground mt-1.5 leading-none">
                          {formatCurrency(job.totalAmount)}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            </GlassCard>
          </div>

          {/* Right Column widgets */}
          <div className="space-y-6">
            {/* Active Agents list */}
            <GlassCard level={2} className="border border-white/40 dark:border-white/10 shadow-xs">
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-muted-foreground" />
                  <h3 className="text-xs font-semibold text-muted-foreground/80">Your Agents</h3>
                </div>
                <Link
                  href="/vendor/agents"
                  className="text-xs text-primary hover:text-primary-hover font-semibold transition-colors"
                >
                  Manage
                </Link>
              </div>

              <motion.div
                variants={containerFastVariants}
                initial="hidden"
                animate="visible"
                className="p-3.5 space-y-3"
              >
                {agents.length === 0 ? (
                  <div className="text-center py-6 text-xs font-semibold text-muted-foreground/80">
                    No agents in registry.
                  </div>
                ) : (
                  agents.map((agent: any, i: number) => {
                    const initials = `${agent.user.firstName || ''}${agent.user.lastName || ''}`.substring(0, 2).toUpperCase() || 'A';
                    const fullName = `${agent.user.firstName} ${agent.user.lastName}`;
                    return (
                      <motion.div
                        key={agent.id}
                        custom={i}
                        variants={listItemVariants}
                        className="glass-2 rounded-xl p-3.5 border border-white/40 dark:border-white/10 shadow-2xs hover:shadow-xs transition-all duration-200"
                      >
                        <div className="flex items-center gap-3 mb-2.5">
                          <Avatar size="sm" status={agent.status === 'AVAILABLE' ? 'online' : 'busy'}>
                            <AvatarImage src={agent.user.avatar} alt={fullName} />
                            <AvatarFallback className="text-[10px] font-bold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">
                              {fullName}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5 leading-none">
                              <Star size={10} className="text-amber-500 fill-amber-500" />
                              <span className="text-[10px] text-muted-foreground/80 font-semibold">
                                {agent.rating} · {agent.totalJobs} jobs
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {agent.skills?.slice(0, 3).map((skill: string) => (
                            <span
                              key={skill}
                              className="text-[9px] font-extrabold uppercase px-2 py-0.5 bg-foreground/5 dark:bg-white/5 border border-border/20 rounded-full text-muted-foreground/80"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>

                        {/* Assign Agent popup dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="glass" size="xs" className="w-full text-[11px] rounded-lg h-7 font-bold border-white/30 dark:border-white/10">
                              Assign Job
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 p-1.5">
                            {todayJobs.filter((job: any) => !job.agentId).length === 0 ? (
                              <div className="text-[11px] font-semibold p-2 text-center text-muted-foreground">
                                No unassigned jobs scheduled today
                              </div>
                            ) : (
                              todayJobs
                                .filter((job: any) => !job.agentId)
                                .map((job: any) => (
                                  <DropdownMenuItem
                                    key={job.id}
                                    onClick={() =>
                                      assignAgentMutation.mutate({
                                        bookingId: job.id,
                                        agentId: agent.id,
                                      })
                                    }
                                    className="text-xs cursor-pointer"
                                  >
                                    {job.service.name} (Ref: {job.bookingNumber.substring(0, 8)})
                                  </DropdownMenuItem>
                                ))
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            </GlassCard>

            {/* Quick Actions Panel */}
            <GlassCard level={2} className="border border-white/40 dark:border-white/10 p-4 shadow-xs">
              <h3 className="text-xs font-semibold text-muted-foreground/80 mb-3">Quick Actions</h3>
              <div className="space-y-1">
                {[
                  { label: 'Add New Agent', href: '/vendor/agents', icon: '👷' },
                  { label: 'Update Pricing', href: '/vendor/pricing', icon: '💰' },
                  { label: 'Upload Documents', href: '/vendor/documents', icon: '📄' },
                  { label: 'View Analytics', href: '/vendor/analytics', icon: '📊' },
                ].map((act) => (
                  <Link
                    key={act.label}
                    href={act.href}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-foreground/5 dark:hover:bg-white/6 transition-colors group"
                  >
                    <span className="text-base select-none leading-none">{act.icon}</span>
                    <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                      {act.label}
                    </span>
                    <ChevronRight size={12} className="ml-auto text-muted-foreground/45 group-hover:text-foreground transition-colors" />
                  </Link>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
