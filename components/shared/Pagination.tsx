'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  className?: string;
  showPageNumbers?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  hasNextPage,
  hasPreviousPage,
  className,
  showPageNumbers = true,
}: PaginationProps) {
  const canPrev = hasPreviousPage ?? currentPage > 1;
  const canNext = hasNextPage ?? currentPage < totalPages;

  const getVisiblePages = () => {
    const delta = 2;
    const range: (number | '...')[] = [];
    const rangeWithDots: (number | '...')[] = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <p className="text-sm text-muted-foreground">
        Page{' '}
        <span className="font-semibold text-foreground">{currentPage}</span> of{' '}
        <span className="font-semibold text-foreground">{totalPages}</span>
      </p>

      <div className="flex items-center gap-1">
        {/* First page */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(1)}
          disabled={!canPrev}
          aria-label="First page"
        >
          <ChevronsLeft size={14} />
        </Button>

        {/* Previous */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canPrev}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </Button>

        {/* Page numbers */}
        {showPageNumbers && (
          <div className="flex items-center gap-1">
            {getVisiblePages().map((page, i) =>
              page === '...' ? (
                <span
                  key={`dots-${i}`}
                  className="w-8 h-8 flex items-center justify-center text-sm text-muted-foreground"
                >
                  …
                </span>
              ) : (
                <motion.button
                  key={page}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onPageChange(page as number)}
                  className={cn(
                    'relative w-8 h-8 rounded-lg text-sm font-medium transition-all duration-150',
                    currentPage === page
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                  aria-label={`Page ${page}`}
                  aria-current={currentPage === page ? 'page' : undefined}
                >
                  {currentPage === page && (
                    <motion.div
                      layoutId="pagination-active"
                      className="absolute inset-0 bg-primary rounded-lg"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{page}</span>
                </motion.button>
              )
            )}
          </div>
        )}

        {/* Next */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canNext}
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </Button>

        {/* Last page */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(totalPages)}
          disabled={!canNext}
          aria-label="Last page"
        >
          <ChevronsRight size={14} />
        </Button>
      </div>
    </div>
  );
}
