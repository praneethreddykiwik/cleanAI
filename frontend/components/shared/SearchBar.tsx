'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  defaultValue?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showFilterButton?: boolean;
  onFilterClick?: () => void;
  filterCount?: number;
  isLoading?: boolean;
}

export function SearchBar({
  placeholder = 'Search...',
  onSearch,
  defaultValue = '',
  className,
  size = 'md',
  showFilterButton = false,
  onFilterClick,
  filterCount = 0,
  isLoading = false,
}: SearchBarProps) {
  const [value, setValue] = useState(defaultValue);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedValue = useDebounce(value, 300);

  // Trigger search when debounced value changes
  useEffect(() => {
    onSearch(debouncedValue);
  }, [debouncedValue, onSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleClear = () => {
    setValue('');
    inputRef.current?.focus();
  };

  const heights = {
    sm: 'h-8.5 rounded-xl',
    md: 'h-10 rounded-xl',
    lg: 'h-11 rounded-2xl',
  }[size];

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }[size];

  const iconSizes = {
    sm: 13,
    md: 15,
    lg: 17,
  }[size];

  return (
    <div className={cn('flex items-center gap-2 w-full', className)}>
      <div className="relative flex-1 flex items-center">
        {/* Search Icon / Loader */}
        <div className="absolute left-3.5 z-10 flex items-center justify-center pointer-events-none">
          {isLoading ? (
            <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin-smooth" />
          ) : (
            <motion.div
              animate={{ rotate: isFocused ? 15 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <Search size={iconSizes} className="text-muted-foreground/60" />
            </motion.div>
          )}
        </div>

        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          aria-label={placeholder}
          className={cn(
            'w-full pl-10 pr-10 outline-none transition-all duration-200 border',
            'bg-white/40 dark:bg-white/5 backdrop-blur-xs',
            'placeholder:text-muted-foreground/50 text-foreground',
            heights,
            textSizes,
            isFocused
              ? 'border-primary ring-2 ring-primary/20 dark:ring-primary/45 shadow-[0_0_16px_rgba(59,130,246,0.12)]'
              : 'border-border/60 hover:border-border-strong hover:bg-accent/40'
          )}
        />

        {/* Clear icon */}
        <AnimatePresence>
          {value && (
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={handleClear}
              className="absolute right-3.5 z-10 text-muted-foreground/60 hover:text-foreground transition-colors duration-150"
              aria-label="Clear search"
            >
              <X size={14} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Filter drawer trigger */}
      {showFilterButton && (
        <Button
          variant="glass"
          size={size === 'lg' ? 'default' : 'sm'}
          onClick={onFilterClick}
          className={cn('gap-2 relative border border-white/50 dark:border-white/10 shrink-0', heights)}
          aria-label={`Filters${filterCount > 0 ? ` (${filterCount} active)` : ''}`}
        >
          <SlidersHorizontal size={14} className="opacity-75" />
          <span className="hidden sm:inline">Filters</span>
          {filterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-primary text-primary-foreground text-[8.5px] font-black rounded-full flex items-center justify-center border border-background shadow-[var(--shadow-primary)] animate-bounce-in">
              {filterCount}
            </span>
          )}
        </Button>
      )}
    </div>
  );
}
