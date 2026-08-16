'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Plus,
  Star,
  Loader2,
  Trash2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  containerVariants,
  tableRowVariants,
} from '@/lib/animations';
import { apiCall } from '@/lib/api';
import { toast } from 'sonner';

export default function VendorAgentsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentPhone, setNewAgentPhone] = useState('');
  const [newAgentEmail, setNewAgentEmail] = useState('');
  const [newAgentSkill, setNewAgentSkill] = useState('Deep Cleaning');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['vendor-agents'],
    queryFn: async () => {
      const res = await apiCall('/vendors/agents');
      if (!res.success) throw new Error(res.message || 'Failed to load agents');
      return res.data ?? [];
    },
  });

  const agents: any[] = Array.isArray(data) 
    ? data 
    : (data && typeof data === 'object' && Array.isArray((data as any).data)) 
      ? (data as any).data 
      : [];

  const addMutation = useMutation({
    mutationFn: async (payload: { firstName: string; lastName: string; phone: string; email: string; skills: string[] }) => {
      const res = await apiCall('/agents', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.success) throw new Error(res.message || 'Failed to add agent');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-agents'] });
      setShowAddModal(false);
      setNewAgentName('');
      setNewAgentPhone('');
      setNewAgentEmail('');
      toast.success('Agent registered. Verification pending.');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to register agent.'),
  });

  const removeMutation = useMutation({
    mutationFn: async (agentId: string) => {
      const res = await apiCall(`/agents/${agentId}`, { method: 'DELETE' });
      if (!res.success) throw new Error(res.message || 'Failed to remove agent');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-agents'] });
      toast.success('Agent removed.');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to remove agent.'),
  });

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName || !newAgentPhone || !newAgentEmail) {
      toast.error('Please fill in all required agent details.');
      return;
    }
    const [firstName, ...rest] = newAgentName.trim().split(' ');
    const lastName = rest.join(' ') || '';
    addMutation.mutate({ firstName, lastName, phone: newAgentPhone, email: newAgentEmail, skills: [newAgentSkill] });
  };

  const filteredAgents = agents.filter((agent) => {
    const name = agent.user ? `${agent.user.firstName || ''} ${agent.user.lastName || ''}`.trim() : (agent.name || '');
    const skills: string[] = agent.skills || [];
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skills.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <DashboardLayout
      role="vendor"
      breadcrumbs={[{ label: 'Vendor Portal' }, { label: 'Agents' }]}
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
            <h2 className="text-2xl font-bold text-foreground">Agents Registry</h2>
            <p className="text-sm text-muted-foreground">
              Monitor agent availability, ratings, and configure schedules.
            </p>
          </div>
          <Button size="sm" onClick={() => setShowAddModal(true)} className="gap-1 rounded-xl">
            <Plus size={14} /> Add Agent
          </Button>
        </div>

        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Search Agent, Skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-9 pr-4 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all"
          />
        </div>

        {/* Grid cards */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground text-sm">
            <Loader2 size={16} className="animate-spin" /> Loading agents...
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-20 text-sm text-red-500">
            Failed to load agents. Check your connection.
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
            No agents found. Add your first agent to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAgents.map((agent, i) => {
              const name = agent.user
                ? `${agent.user.firstName || ''} ${agent.user.lastName || ''}`.trim()
                : (agent.name || 'Unknown');
              const phone = agent.user?.phone || agent.phone || 'N/A';
              const skills: string[] = agent.skills || [];
              const rating = agent.rating ?? 0;
              const totalJobs = agent._count?.bookings ?? agent.totalJobs ?? 0;
              const status = agent.availability || agent.status || 'OFFLINE';
              const agentId = agent.id?.substring(0, 8).toUpperCase() || '';

              return (
                <motion.div
                  key={agent.id}
                  custom={i}
                  variants={tableRowVariants}
                  className="bg-card border border-border/50 rounded-2xl p-5 space-y-4 hover:shadow-md transition-shadow relative"
                >
                  {/* Card top */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                        {name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-foreground">{name}</h3>
                        <p className="text-[10px] text-muted-foreground">{phone}</p>
                      </div>
                    </div>
                    <StatusBadge status={status} size="sm" />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 border-y border-border/40 py-2.5 text-center">
                    <div>
                      <p className="text-[9px] text-muted-foreground">Rating</p>
                      <p className="text-xs font-bold text-foreground flex items-center justify-center gap-0.5">
                        <Star size={10} className="fill-amber-400 text-amber-400" />
                        {Number(rating).toFixed(1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground">Total Jobs</p>
                      <p className="text-xs font-bold text-foreground">{totalJobs}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground">Status</p>
                      <p className="text-xs font-bold text-foreground capitalize">{status.toLowerCase()}</p>
                    </div>
                  </div>

                  {/* Skills */}
                  {skills.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[9px] text-muted-foreground font-semibold">Specialization</p>
                      <div className="flex flex-wrap gap-1">
                        {skills.map((skill: string) => (
                          <span
                            key={skill}
                            className="text-[9px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-semibold border border-border/50"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-2 border-t border-border/40">
                    <span className="text-[10px] text-muted-foreground">ID: AGT-{agentId}</span>
                    <div className="flex gap-1.5">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => removeMutation.mutate(agent.id)}
                        disabled={removeMutation.isPending}
                        className="text-red-600 hover:bg-red-50 rounded-lg h-7 w-7 p-0"
                        aria-label="Remove agent"
                      >
                        {removeMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                      </Button>
                      <Button variant="outline" size="xs" className="h-7 text-[11px] rounded-lg">
                        Configure
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Add Agent Modal Overlay */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl"
            >
              <div>
                <h3 className="text-base font-bold text-foreground">Register New Agent</h3>
                <p className="text-xs text-muted-foreground">Add a new verified professional to your business.</p>
              </div>

              <form onSubmit={handleAddAgent} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                    placeholder="Amit Kumar"
                    className="w-full h-8 px-3 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground">Mobile Phone</label>
                  <input
                    type="tel"
                    required
                    value={newAgentPhone}
                    onChange={(e) => setNewAgentPhone(e.target.value)}
                    placeholder="9988776655"
                    className="w-full h-8 px-3 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground">Email Address</label>
                  <input
                    type="email"
                    required
                    value={newAgentEmail}
                    onChange={(e) => setNewAgentEmail(e.target.value)}
                    placeholder="amit@company.com"
                    className="w-full h-8 px-3 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground">Primary Skill</label>
                  <select
                    value={newAgentSkill}
                    onChange={(e) => setNewAgentSkill(e.target.value)}
                    className="w-full h-8 px-2 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
                  >
                    <option value="Deep Cleaning">Deep Cleaning</option>
                    <option value="Kitchen Cleaning">Kitchen Cleaning</option>
                    <option value="Bathroom Cleaning">Bathroom Cleaning</option>
                    <option value="Sofa Cleaning">Sofa Cleaning</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="AC Service">AC Service</option>
                    <option value="Pest Control">Pest Control</option>
                    <option value="Laundry">Laundry</option>
                    <option value="Gardening">Gardening</option>
                    <option value="Car Wash">Car Wash</option>
                  </select>
                </div>

                <div className="flex gap-2 justify-end pt-3">
                  <Button variant="outline" size="sm" type="button" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" type="submit" disabled={addMutation.isPending}>
                    {addMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : 'Register Agent'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
