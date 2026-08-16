'use client';

import * as React from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { backdropVariants, bottomSheetVariants } from '@/lib/animations';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function BottomSheet({ isOpen, onClose, title, children, className }: BottomSheetProps) {
  const dragControls = useDragControls();

  // Escape key handler
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[var(--z-modal)] md:hidden"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title || 'Drawer'}
            variants={bottomSheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            drag="y"
            dragDirectionLock
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.8 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) onClose();
            }}
            className={cn(
              'fixed bottom-0 left-0 right-0 max-h-[92vh] z-[var(--z-modal)] md:hidden',
              'glass-4 rounded-t-[1.75rem] border-t border-white/50 dark:border-white/10',
              'shadow-[0_-8px_32px_rgba(0,0,0,0.08)] flex flex-col'
            )}
          >
            {/* Drag Handle Indicator */}
            <div
              className="flex items-center justify-center py-3 cursor-grab active:cursor-grabbing shrink-0"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-10 h-1 bg-muted-foreground/30 dark:bg-white/15 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 border-b border-border/30 shrink-0">
              {title ? (
                <h2 className="text-sm font-bold text-foreground tracking-tight">{title}</h2>
              ) : (
                <div />
              )}
              <button
                onClick={onClose}
                aria-label="Close sheet"
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-foreground/5 dark:hover:bg-white/5 text-muted-foreground transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-5 py-4 pb-8">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
