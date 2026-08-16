'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  Headphones,
  Sparkles,
  MessageSquare,
  FileQuestion,
  Phone,
  Mail,
  ChevronDown,
  Send,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { containerVariants, cardVariants } from '@/lib/animations';
import { AIChatInterface } from '@/components/shared/AIChatInterface';
import { toast } from 'sonner';

const FAQS = [
  {
    q: 'How does the Criska AI Supervisor pricing estimate work?',
    a: 'Criska AI analyzes your uploaded service area photos to estimate room complexity, heavy oil deposits, tile grout stains, and labour required. It generates a multi-factor pricing breakdown based on local city market multipliers and severity metrics.',
  },
  {
    q: 'Can I cancel or reschedule my booking?',
    a: 'Yes, you can cancel or reschedule any upcoming booking up to 2 hours before the scheduled time slot directly from your "My Bookings" dashboard with zero cancellation fees.',
  },
  {
    q: 'What if I am not satisfied with the service quality?',
    a: 'CleanAI guarantees 100% satisfaction. If any area is missed or not cleaned up to standard, you can request a free revisit within 24 hours of job completion through the app or by contacting support.',
  },
  {
    q: 'Are the service providers and technicians verified?',
    a: 'All partner vendors and technicians undergo strict background verification, government ID audit, and skill assessment before receiving active dispatch assignments.',
  },
];

export default function CustomerSupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  
  // Ticket Form State
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('Booking Issue');
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
      const ticketId = `TK-${Math.floor(100000 + Math.random() * 900000)}`;
      setSubmittedTicketId(ticketId);
      toast.success('Support ticket submitted successfully!');
      setTicketSubject('');
      setTicketMessage('');
    }, 800);
  };

  return (
    <DashboardLayout
      role="customer"
      breadcrumbs={[{ label: 'Customer Portal' }, { label: 'Help & Support' }]}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto space-y-6 pb-12"
      >
        {/* Banner */}
        <div className="bg-gradient-to-r from-primary/10 via-blue-500/10 to-indigo-500/10 border border-primary/20 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden shadow-sm">
          <div className="space-y-1 z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-[10px] font-bold">
              <Headphones size={12} /> 24/7 Priority Support
            </div>
            <h2 className="text-xl font-bold text-foreground">How can we assist you today?</h2>
            <p className="text-xs text-muted-foreground max-w-xl">
              Get instant assistance from Criska AI Supervisor, browse quick FAQs, or connect directly with customer support.
            </p>
          </div>
          <Button
            onClick={() => setIsAIChatOpen(true)}
            className="rounded-xl gap-2 z-10 shadow-md font-bold text-xs"
          >
            <Sparkles size={14} className="animate-pulse text-amber-300" /> Ask Criska AI Supervisor
          </Button>
        </div>

        {/* Quick Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div
            variants={cardVariants}
            className="p-4 bg-card border border-border/50 rounded-2xl space-y-2 hover:border-primary/40 transition-colors shadow-xs"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Phone size={16} />
            </div>
            <h3 className="text-xs font-bold text-foreground">Helpline Hotline</h3>
            <p className="text-[10px] text-muted-foreground">Toll-Free 1800-123-9876 (09:00 AM - 09:00 PM)</p>
          </motion.div>

          <motion.div
            variants={cardVariants}
            className="p-4 bg-card border border-border/50 rounded-2xl space-y-2 hover:border-primary/40 transition-colors shadow-xs"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Mail size={16} />
            </div>
            <h3 className="text-xs font-bold text-foreground">Email Support</h3>
            <p className="text-[10px] text-muted-foreground">support@cleanai.com (Avg response &lt; 2 hrs)</p>
          </motion.div>

          <motion.div
            variants={cardVariants}
            className="p-4 bg-card border border-border/50 rounded-2xl space-y-2 hover:border-primary/40 transition-colors shadow-xs"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Clock size={16} />
            </div>
            <h3 className="text-xs font-bold text-foreground">Instant Resolution</h3>
            <p className="text-[10px] text-muted-foreground">Live AI diagnostics & automated refund status</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* FAQ Accordion */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <FileQuestion size={16} className="text-primary" /> Frequently Asked Questions
            </h3>

            <div className="space-y-2.5">
              {FAQS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-xs transition-colors"
                  >
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

          {/* Ticket Submission Form */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <MessageSquare size={16} className="text-primary" /> Submit a Ticket
            </h3>

            <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4 shadow-xs">
              {submittedTicketId ? (
                <div className="py-6 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={20} />
                  </div>
                  <h4 className="text-xs font-bold text-foreground">Ticket Logged</h4>
                  <p className="text-[10px] text-muted-foreground">Your support ticket has been created.</p>
                  <p className="text-[10px] font-mono bg-muted px-2 py-1 rounded-md text-muted-foreground inline-block select-all">
                    {submittedTicketId}
                  </p>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => setSubmittedTicketId(null)}
                    className="w-full text-[10px] rounded-xl mt-2"
                  >
                    Submit Another Ticket
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
                      <option value="Booking Issue">Booking Issue</option>
                      <option value="Payment / Refund">Payment / Refund</option>
                      <option value="Technician Behavior">Technician Behavior</option>
                      <option value="AI Estimate Query">AI Estimate Query</option>
                      <option value="Other">Other</option>
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
                      placeholder="Describe your query or issue..."
                      className="w-full p-2.5 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full gap-1.5 rounded-xl text-xs shadow-xs"
                  >
                    <Send size={12} /> {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* AI Supervisor Floating Modal */}
        {isAIChatOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl p-4 shadow-2xl text-left overflow-hidden">
              <button
                onClick={() => setIsAIChatOpen(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white z-10 transition-colors cursor-pointer"
              >
                Close Chat
              </button>
              <AIChatInterface
                serviceName="Deep Cleaning"
                onBookingCreated={(num) => {
                  toast.success(`Booking created: ${num}`);
                  setIsAIChatOpen(false);
                }}
                onCancel={() => setIsAIChatOpen(false)}
              />
            </div>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
