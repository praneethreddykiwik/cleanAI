'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Users, Search, Filter, ShieldAlert, Award, Star, Eye } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { containerVariants, cardVariants } from '@/lib/animations';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

interface AgentItem {
  id: string;
  name: string;
  vendorName: string;
  rating: number;
  totalJobs: number;
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  skills: string[];
}

const INITIAL_AGENTS: AgentItem[] = [
  { id: '1', name: 'Rajesh Kumar', vendorName: 'QuickClean Providers', rating: 4.8, totalJobs: 54, status: 'AVAILABLE', skills: ['Deep Cleaning', 'Sanitization'] },
  { id: '2', name: 'Amit Sharma', vendorName: 'SuperPlumbers India', rating: 4.9, totalJobs: 82, status: 'BUSY', skills: ['Plumbing', 'Water Leakages'] },
  { id: '3', name: 'Vikram Singh', vendorName: 'VoltFix Electricals', rating: 4.5, totalJobs: 30, status: 'OFFLINE', skills: ['Wiring', 'Switchboards'] },
];

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<AgentItem[]>(INITIAL_AGENTS);
  const [search, setSearch] = useState('');

  const getStatusBadge = (status: AgentItem['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-50 text-green-700 border border-green-200">Available</span>;
      case 'BUSY':
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Busy</span>;
      case 'OFFLINE':
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-muted text-muted-foreground border border-border">Offline</span>;
    }
  };

  const filteredAgents = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.vendorName.toLowerCase().includes(search.toLowerCase())
  );

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
        {/* Title */}
        <div>
          <h2 className="text-2xl font-bold text-foreground">Field Agents Directory</h2>
          <p className="text-sm text-muted-foreground">
            Manage platform field agents, track real-time occupancy status, and review performance reports.
          </p>
        </div>

        {/* Filter Bar */}
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
          <Button variant="outline" size="sm" className="gap-1 rounded-xl text-xs font-semibold">
            <Filter size={14} /> Filter Status
          </Button>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredAgents.map((agent) => (
            <motion.div
              key={agent.id}
              variants={cardVariants}
              className="p-5 bg-card border border-border/50 rounded-2xl shadow-sm space-y-4 hover:border-border transition-colors relative"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 shrink-0">
                    <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                      {getInitials(agent.name.split(' ')[0], agent.name.split(' ')[1] || '')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-bold text-foreground">{agent.name}</h3>
                    <p className="text-[10px] text-muted-foreground font-semibold truncate max-w-[150px]">
                      {agent.vendorName}
                    </p>
                  </div>
                </div>
                {getStatusBadge(agent.status)}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 bg-muted/20 p-2.5 rounded-xl text-center text-[10px]">
                <div>
                  <span className="text-muted-foreground block">Rating</span>
                  <span className="font-extrabold text-foreground flex items-center justify-center gap-0.5">
                    <Star size={10} className="fill-amber-500 text-amber-500" /> {agent.rating}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Jobs Done</span>
                  <span className="font-extrabold text-foreground">{agent.totalJobs}</span>
                </div>
              </div>

              {/* Skills badges */}
              <div className="flex flex-wrap gap-1">
                {agent.skills.map((skill, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-accent text-foreground text-[8px] font-bold rounded-lg border border-border/40">
                    {skill}
                  </span>
                ))}
              </div>

              <div className="h-px bg-border/40" />

              {/* Footer details */}
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-muted-foreground font-medium">ID: AGT-{agent.id}092</span>
                <Button variant="ghost" size="sm" className="h-7 px-2 gap-1 rounded-lg text-primary text-[10px]">
                  <Eye size={12} /> View Profiles
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
