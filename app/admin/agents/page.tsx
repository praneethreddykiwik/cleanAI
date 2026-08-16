'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Users, Search, Star } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { containerVariants, cardVariants } from '@/lib/animations';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { apiCall } from '@/lib/api';
import { PageSkeleton } from '@/components/shared/Skeletons';

export default function AdminAgentsPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-agents'],
    queryFn: () => apiCall('/agents'),
  });
  const agents: any[] = data?.data || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-50 text-green-700 border border-green-200">Available</span>;
      case 'BUSY':
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Busy</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-muted text-muted-foreground border border-border">Offline</span>;
    }
  };

  const filteredAgents = agents.filter((a) => {
    const name = a.user ? `${a.user.firstName || ''} ${a.user.lastName || ''}`.trim() : (a.name || '');
    const vendorName = a.vendor?.businessName || a.vendorName || '';
    return (
      name.toLowerCase().includes(search.toLowerCase()) ||
      vendorName.toLowerCase().includes(search.toLowerCase())
    );
  });

  if (isLoading) {
    return (
      <DashboardLayout role="admin" breadcrumbs={[{ label: 'Admin Portal' }, { label: 'Field Agents Directory' }]}>
        <PageSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="admin"
      breadcrumbs={[{ label: 'Admin Portal' }, { label: 'Field Agents Directory' }]}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto space-y-6"
      >
        <div>
          <h2 className="text-2xl font-bold text-foreground">Field Agents Directory</h2>
          <p className="text-sm text-muted-foreground">
            All platform field agents — real-time status, ratings, and vendor assignments.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-card border border-border/50 p-3 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-3 py-1.5 flex-1 max-w-md">
            <Search size={14} className="text-muted-foreground" />
            <input
              type="text"
              placeholder="Search agents by name or vendor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-0 outline-none text-xs w-full text-foreground"
            />
          </div>
          <div className="text-xs text-muted-foreground font-semibold px-2">
            {filteredAgents.length} agent{filteredAgents.length !== 1 ? 's' : ''} found
          </div>
        </div>

        {filteredAgents.length === 0 ? (
          <div className="text-center py-16 text-sm text-muted-foreground font-semibold">
            No agents registered yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredAgents.map((agent) => {
              const firstName = agent.user?.firstName || '';
              const lastName = agent.user?.lastName || '';
              const name = agent.name || `${firstName} ${lastName}`.trim() || 'Agent';
              const vendorName = agent.vendor?.businessName || agent.vendorName || 'N/A';
              const skills: string[] = agent.skills || [];
              return (
                <motion.div
                  key={agent.id}
                  variants={cardVariants}
                  className="p-5 bg-card border border-border/50 rounded-2xl shadow-sm space-y-4 hover:border-border transition-colors relative"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 shrink-0">
                        <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                          {getInitials(firstName || name.split(' ')[0], lastName || name.split(' ')[1] || '')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-0.5">
                        <h3 className="text-xs font-bold text-foreground">{name}</h3>
                        <p className="text-[10px] text-muted-foreground font-semibold truncate max-w-[150px]">
                          {vendorName}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(agent.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-muted/20 p-2.5 rounded-xl text-center text-[10px]">
                    <div>
                      <span className="text-muted-foreground block">Rating</span>
                      <span className="font-extrabold text-foreground flex items-center justify-center gap-0.5">
                        <Star size={10} className="fill-amber-500 text-amber-500" />
                        {agent.rating ? agent.rating.toFixed(1) : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Jobs Done</span>
                      <span className="font-extrabold text-foreground">{agent.totalJobs || 0}</span>
                    </div>
                  </div>

                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {skills.slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-accent text-foreground text-[8px] font-bold rounded-lg border border-border/40">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="h-px bg-border/40" />

                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-muted-foreground font-medium">
                      ID: {agent.id.substring(0, 8).toUpperCase()}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      agent.status === 'AVAILABLE' ? 'text-green-600' :
                      agent.status === 'BUSY' ? 'text-blue-600' : 'text-muted-foreground'
                    }`}>
                      {agent.status}
                    </span>
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
