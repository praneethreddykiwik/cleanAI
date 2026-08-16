'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  Headphones,
  FileQuestion,
  Phone,
  Mail,
  ChevronDown,
  Send,
  CheckCircle2,
  Briefcase,
  DollarSign,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { containerVariants, cardVariants } from '@/lib/animations';
import { toast } from 'sonner';

const FAQS = [
  {
    q: 'How are vendor job assignments determined?',
    a: 'CleanAI Vendor Matching Agent calculates job matches based on 5 parameters: verified service category, geodesic distance & ETA, technician availability, vendor rating, and job acceptance history.',
  },
  {
    q: 'When do I receive payouts for completed jobs?',
    a: 'Payouts are processed automatically to your linked bank account every 48 hours or weekly depending on your payout schedule, after deducting the standard 5% platform commission fee.',
  },
  {
    q: 'How do I add or verify new technicians/agents?',
    a: 'Navigate to "Agents" in your Vendor Portal dashboard, click "+ Add Agent", and input their contact & skill details. Assigned agents can immediately receive dispatched jobs.',
  },
];

export default function VendorSupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('Payout Query');
  const [ticketMessage, setTicketMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) {
      toast.error('Please enter a subject and detailed message.');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const ticketId = `VP-${Math.floor(100000 + Math.random() * 900000)}`;
      setSubmittedTicketId(ticketId);
      toast.success('Partner support ticket submitted!');
      setTicketSubject('');
      setTicketMessage('');
    }, 800);
  };

  return (
    <DashboardLayout
      role="vendor"
      breadcrumbs={[{ label: 'Vendor Portal' }, { label: 'Help & Support' }]}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto space-y-6 pb-12"
      >
        <div className="bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-indigo-500/10 border border-violet-500/20 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-600 dark:text-violet-400 border border-violet-500/30 text-[10px] font-bold">
              <Headphones size={12} /> Partner Support Desk
            </div>
            <h2 className="text-xl font-bold text-foreground">Vendor Partner Help & Resolution Center</h2>
            <p className="text-xs text-muted-foreground max-w-xl">
              Get assistance with job payouts, technician verification, dispute appeals, and catalog pricing configurations.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div variants={cardVariants} className="p-4 bg-card border border-border/50 rounded-2xl space-y-2 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center">
              <Phone size={16} />
            </div>
            <h3 className="text-xs font-bold text-foreground">Partner Line</h3>
            <p className="text-[10px] text-muted-foreground">1800-888-CLEAN (Partner Priority)</p>
          </motion.div>

          <motion.div variants={cardVariants} className="p-4 bg-card border border-border/50 rounded-2xl space-y-2 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <DollarSign size={16} />
            </div>
            <h3 className="text-xs font-bold text-foreground">Payout Escalation</h3>
            <p className="text-[10px] text-muted-foreground">payouts@cleanai.com</p>
          </motion.div>

          <motion.div variants={cardVariants} className="p-4 bg-card border border-border/50 rounded-2xl space-y-2 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Briefcase size={16} />
            </div>
            <h3 className="text-xs font-bold text-foreground">Agent Compliance</h3>
            <p className="text-[10px] text-muted-foreground">verification@cleanai.com</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <FileQuestion size={16} className="text-violet-600" /> Vendor Knowledge Base
            </h3>

            <div className="space-y-2.5">
              {FAQS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx} className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-xs">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-4 flex items-center justify-between gap-4 text-left font-bold text-xs text-foreground cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        size={14}
                        className={`text-muted-foreground transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 text-[11px] text-muted-foreground leading-relaxed border-t border-border/30 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Send size={16} className="text-violet-600" /> Log Partner Issue
            </h3>

            <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4 shadow-xs">
              {submittedTicketId ? (
                <div className="py-6 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={20} />
                  </div>
                  <h4 className="text-xs font-bold text-foreground">Issue Logged</h4>
                  <p className="text-[10px] text-muted-foreground font-mono">{submittedTicketId}</p>
                  <Button size="xs" variant="outline" onClick={() => setSubmittedTicketId(null)} className="w-full text-[10px] rounded-xl mt-2">
                    Submit Another Query
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmitTicket} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Category</label>
                    <select
                      value={ticketCategory}
                      onChange={(e) => setTicketCategory(e.target.value)}
                      className="w-full h-8 px-2 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary"
                    >
                      <option value="Payout Query">Payout Query</option>
                      <option value="Dispatch Dispute">Dispatch Dispute</option>
                      <option value="Agent Document Issue">Agent Document Issue</option>
                      <option value="Technical Support">Technical Support</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Subject</label>
                    <input
                      type="text"
                      required
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder="Brief subject..."
                      className="w-full h-8 px-3 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Message</label>
                    <textarea
                      rows={3}
                      required
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      placeholder="Describe issue..."
                      className="w-full p-2.5 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary"
                    />
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full gap-1.5 rounded-xl text-xs">
                    <Send size={12} /> {isSubmitting ? 'Submitting...' : 'Submit Issue'}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
