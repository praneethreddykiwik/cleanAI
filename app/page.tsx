'use client';

import { motion, type Variants } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles, Shield, Briefcase, User, Calendar, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1a] relative overflow-hidden flex flex-col justify-between">
      {/* Decorative gradient blob background elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[10000ms]" />

      {/* Navigation Header */}
      <header className="border-b border-border/40 bg-background/50 backdrop-blur-md relative z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent flex items-center gap-1.5">
              Clean AI
            </span>
            <span className="text-[9px] font-mono tracking-widest uppercase bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded font-bold">
              Beta
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="text-xs font-semibold rounded-xl">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm" className="text-xs font-semibold rounded-xl shadow-sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-20 flex-1 flex flex-col justify-center items-center text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8 max-w-3xl"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="inline-flex items-center gap-1.5 bg-primary/5 border border-primary/20 rounded-full px-3.5 py-1 text-primary text-[11px] font-bold">
            <Sparkles size={11} />
            AI-Powered Home Services Platform
          </motion.div>

          {/* Title */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
              World-class professionals.{' '}
              <span className="bg-gradient-to-r from-primary via-blue-500 to-indigo-500 bg-clip-text text-transparent">
                Dispatched by AI.
              </span>
            </h1>
            <p className="text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Connect with verified local businesses for deep cleaning, plumbing, electrical services, and pest control. Powered by intelligent match dispatch rules.
            </p>
          </motion.div>

          {/* Action portals links */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 max-w-2xl mx-auto">
            {/* Customer Link card */}
            <Link
              href="/auth/login"
              className="p-5 border border-border bg-card hover:border-primary/30 rounded-2xl text-left block transition-all hover:-translate-y-1 shadow-sm group"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <User size={15} />
              </div>
              <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                Book Services <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
              </h3>
              <p className="text-[10px] text-muted-foreground mt-1 leading-normal">
                Schedule vetted cleaning, electrical, and household tasks.
              </p>
            </Link>

            {/* Vendor Link card */}
            <Link
              href="/auth/login"
              className="p-5 border border-border bg-card hover:border-primary/30 rounded-2xl text-left block transition-all hover:-translate-y-1 shadow-sm group"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                <Briefcase size={15} />
              </div>
              <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                Vendor Hub <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
              </h3>
              <p className="text-[10px] text-muted-foreground mt-1 leading-normal">
                Onboard your agency, assign jobs to agents, and grow operations.
              </p>
            </Link>

            {/* Admin Link card */}
            <Link
              href="/auth/login"
              className="p-5 border border-border bg-card hover:border-primary/30 rounded-2xl text-left block transition-all hover:-translate-y-1 shadow-sm group"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-3">
                <Shield size={15} />
              </div>
              <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                Admin Console <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
              </h3>
              <p className="text-[10px] text-muted-foreground mt-1 leading-normal">
                Review audits, monitor platform metrics, and verify vendor accounts.
              </p>
            </Link>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 text-center text-[10px] text-muted-foreground bg-background/30 relative z-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Clean AI Technologies Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:underline">Terms of Use</a>
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
