'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants } from '@/lib/animations';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  /** Use a unique key to trigger re-animation on route change */
  transitionKey?: string;
}

/**
 * PageTransition — wraps page content with Framer Motion entrance.
 * Respects prefers-reduced-motion natively through CSS.
 */
export function PageTransition({ children, className, transitionKey }: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transitionKey}
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
