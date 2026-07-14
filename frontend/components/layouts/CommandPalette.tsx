'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Command, Search, X, ArrowRight, Keyboard } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { backdropVariants, modalVariants } from '@/lib/animations';

interface CommandItem {
  category: string;
  label: string;
  icon: string;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
}

export function CommandPalette({ isOpen, onClose, commands }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        setQuery('');
        setSelectedIndex(0);
      }, 50);
    }
  }, [isOpen]);

  const filtered = query.trim()
    ? commands.filter((c) =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.category.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  // Group by category
  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const flatFiltered = Object.values(grouped).flat();

  const execute = useCallback(
    (item: CommandItem) => {
      item.action();
      onClose();
    },
    [onClose]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, flatFiltered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (flatFiltered[selectedIndex]) execute(flatFiltered[selectedIndex]);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, flatFiltered, selectedIndex, execute, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  // Highlight matched text
  const highlight = (text: string) => {
    if (!query.trim()) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-primary/15 text-primary rounded px-[1px]">
          {text.slice(idx, idx + query.length)}
        </mark>
        {text.slice(idx + query.length)}
      </>
    );
  };

  let flatIdx = 0;

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
            className="fixed inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm z-[var(--z-command)]"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            role="dialog"
            aria-label="Command palette"
            aria-modal="true"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              'fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-lg mx-4 z-[var(--z-command)]',
              'glass-4 rounded-[1.75rem] overflow-hidden'
            )}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40">
              <Search size={16} className="text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                placeholder="Search actions..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                aria-label="Search commands"
                autoComplete="off"
                spellCheck={false}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
              <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-muted-foreground bg-muted/60 border border-border/60 rounded-md select-none">
                esc
              </kbd>
            </div>

            {/* Command list */}
            <ul
              ref={listRef}
              role="listbox"
              aria-label="Commands"
              className="max-h-72 overflow-y-auto py-2 px-2"
            >
              {flatFiltered.length === 0 ? (
                <li className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No results for &ldquo;{query}&rdquo;
                </li>
              ) : (
                Object.entries(grouped).map(([category, items]) => (
                  <li key={category} role="group" aria-label={category}>
                    <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                      {category}
                    </p>
                    <ul>
                      {items.map((item) => {
                        const isSelected = flatIdx === selectedIndex;
                        const currentIdx = flatIdx++;
                        return (
                          <li
                            key={item.label}
                            role="option"
                            aria-selected={isSelected}
                          >
                            <button
                              onClick={() => execute(item)}
                              onMouseEnter={() => setSelectedIndex(currentIdx)}
                              className={cn(
                                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors duration-100 text-left',
                                isSelected
                                  ? 'bg-primary/8 dark:bg-primary/12 text-foreground'
                                  : 'text-foreground/80 hover:bg-muted/60'
                              )}
                            >
                              <span className="text-base leading-none">{item.icon}</span>
                              <span className="flex-1 font-medium">
                                {highlight(item.label)}
                              </span>
                              {item.shortcut && (
                                <kbd className="text-[10px] text-muted-foreground/70 bg-muted/50 border border-border/50 px-1.5 py-0.5 rounded-md">
                                  {item.shortcut}
                                </kbd>
                              )}
                              <ArrowRight size={12} className={cn('shrink-0 transition-opacity', isSelected ? 'opacity-60' : 'opacity-0')} />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))
              )}
            </ul>

            {/* Footer */}
            <div className="flex items-center gap-4 px-5 py-3 border-t border-border/40">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
                <Keyboard size={11} />
                <span>↑↓ navigate · Enter select · Esc close</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
