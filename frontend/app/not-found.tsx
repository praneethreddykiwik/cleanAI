'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Compass, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1a] relative overflow-hidden flex flex-col items-center justify-center p-6 text-center">
      {/* Premium Decorative backgrounds */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[10000ms]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        className="max-w-md w-full space-y-6 relative z-10"
      >
        {/* Animated Compass Icon */}
        <div className="relative w-20 h-20 bg-primary/10 text-primary flex items-center justify-center rounded-3xl mx-auto shadow-sm">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
          >
            <Compass size={40} className="stroke-[1.5]" />
          </motion.div>
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-mono tracking-widest uppercase bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold">
            Error 404
          </span>
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight sm:text-3xl">
            Page Not Found
          </h2>
          <p className="text-muted-foreground text-xs leading-relaxed max-w-sm mx-auto">
            The page you are looking for doesn&apos;t exist, has been moved, or resides under private permissions context.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
          <Button
            variant="outline"
            className="w-full sm:flex-1 gap-2 rounded-xl text-xs"
            onClick={() => window.history.back()}
          >
            <ArrowLeft size={13} />
            Go Back
          </Button>
          <Link href="/" className="w-full sm:flex-1">
            <Button className="w-full gap-2 rounded-xl text-xs shadow-xs">
              <Home size={13} />
              Return Home
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
