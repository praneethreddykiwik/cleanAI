'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Star,
  Activity,
  User,
  ShieldAlert,
  Loader2,
  Trash2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  containerVariants,
  cardVariants,
  tableRowVariants,
} from '@/lib/animations';
import { toast } from 'sonner';

// ==================
// Mock Data
// ==================
const initialAgents = [
  { id: '1', name: 'Ramesh Kumar', phone: '9988776655', email: 'ramesh@cleanpro.com', rating: 4.8, totalJobs: 142, status: 'AVAILABLE', skills: ['Deep Cleaning', 'Sofa Cleaning'] },
  { id: '2', name: 'Suresh Singh', phone: '9876543210', email: 'suresh@cleanpro.com', rating: 4.7, totalJobs: 98, status: 'BUSY', skills: ['Kitchen Cleaning', 'AC Service'] },
  { id: '3', name: 'Karan Johar', phone: '9012345678', email: 'karan@cleanpro.com', rating: 4.9, totalJobs: 76, status: 'AVAILABLE', skills: ['Bathroom Cleaning', 'Plumbing'] },
  { id: '4', name: 'Vijay Mallya', phone: '9555666777', email: 'vijay@cleanpro.com', rating: 4.2, totalJobs: 18, status: 'OFFLINE', skills: ['Gardening'] },
];

export default function VendorAgentsPage() {
  const [agents, setAgents] = useState(initialAgents);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentPhone, setNewAgentPhone] = useState('');
  const [newAgentEmail, setNewAgentEmail] = useState('');
  const [newAgentSkill, setNewAgentSkill] = useState('Deep Cleaning');

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName || !newAgentPhone || !newAgentEmail) {
      toast.error('Please fill in all required agent details.');
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);

    const newAgent = {
      id: String(agents.length + 1),
      name: newAgentName,
      phone: newAgentPhone,
      email: newAgentEmail,
      rating: 5.0,
      totalJobs: 0,
      status: 'AVAILABLE' as const,
      skills: [newAgentSkill],
    };

    setAgents([newAgent, ...agents]);
    setShowAddModal(false);

    // Reset Form
    setNewAgentName('');
    setNewAgentPhone('');
    setNewAgentEmail('');
    toast.success('Agent added successfully. Verification pending.');
  };

  const handleRemoveAgent = (id: string) => {
    setAgents(agents.filter((a) => a.id !== id));
    toast.error('Agent removed from platform list.');
  };

  const filteredAgents = agents.filter((agent) =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAgents.map((agent, i) => (
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
                    {agent.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground">{agent.name}</h3>
                    <p className="text-[10px] text-muted-foreground">{agent.phone}</p>
                  </div>
                </div>
                <StatusBadge status={agent.status} size="sm" />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 border-y border-border/40 py-2.5 text-center">
                <div>
                  <p className="text-[9px] text-muted-foreground">Rating</p>
                  <p className="text-xs font-bold text-foreground flex items-center justify-center gap-0.5">
                    <Star size={10} className="fill-amber-400 text-amber-400" />
                    {agent.rating}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground">Total Jobs</p>
                  <p className="text-xs font-bold text-foreground">{agent.totalJobs}</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground">Compliance</p>
                  <p className="text-xs font-bold text-foreground">98%</p>
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-1.5">
                <p className="text-[9px] text-muted-foreground font-semibold">Specialization</p>
                <div className="flex flex-wrap gap-1">
                  {agent.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-[9px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-semibold border border-border/50"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-2 border-t border-border/40">
                <span className="text-[10px] text-muted-foreground">ID: AGT-0{agent.id}</span>
                <div className="flex gap-1.5">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => handleRemoveAgent(agent.id)}
                    className="text-red-600 hover:bg-red-50 rounded-lg h-7 w-7 p-0"
                    aria-label="Remove agent"
                  >
                    <Trash2 size={12} />
                  </Button>
                  <Button variant="outline" size="xs" className="h-7 text-[11px] rounded-lg">
                    Configure
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

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
                    <option value="AC Service">AC Service</option>
                    <option value="Plumbing">Plumbing</option>
                  </select>
                </div>

                <div className="flex gap-2 justify-end pt-3">
                  <Button variant="outline" size="sm" type="button" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : 'Register Agent'}
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
