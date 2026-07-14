'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

interface BottomNavigationProps {
  items: NavItem[];
}

export function BottomNavigation({ items }: BottomNavigationProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-[var(--z-header)] pb-[env(safe-area-inset-bottom,0px)]"
    >
      {/* Floating capsule container */}
      <div className="mx-4 mb-4">
        <div
          className={cn(
            'flex items-center justify-around h-[58px] px-2',
            'rounded-[2rem] glass-3',
            'shadow-[0_-1px_0_rgba(0,0,0,0.04),0_8px_32px_rgba(0,0,0,0.10),0_20px_40px_rgba(0,0,0,0.06)]',
            'dark:shadow-[0_-1px_0_rgba(255,255,255,0.04),0_8px_32px_rgba(0,0,0,0.50),0_20px_40px_rgba(0,0,0,0.30)]'
          )}
        >
          {items.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-[3px]',
                  'min-w-[52px] h-full py-2 px-2 rounded-[1.5rem]',
                  'transition-colors duration-150',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground/70 hover:text-foreground/80 dark:text-muted-foreground/60 dark:hover:text-foreground/70'
                )}
              >
                {/* Active background pill */}
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-active"
                    className="absolute inset-0 bg-foreground/6 dark:bg-white/8 rounded-[1.5rem] border border-foreground/5 dark:border-white/8"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}

                {/* Icon with badge */}
                <div className="relative z-10">
                  <motion.div
                    animate={isActive ? { scale: 1.08 } : { scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    <Icon
                      size={18}
                      strokeWidth={isActive ? 2.2 : 1.8}
                      className={cn(
                        isActive
                          ? 'drop-shadow-[0_1px_6px_rgba(0,0,0,0.08)] dark:drop-shadow-[0_1px_8px_rgba(255,255,255,0.20)]'
                          : ''
                      )}
                    />
                  </motion.div>

                  {/* Notification badge */}
                  <AnimatePresence>
                    {item.badge != null && item.badge > 0 && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                        className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[8px] font-black px-[3px] border border-background"
                      >
                        {item.badge > 9 ? '9+' : item.badge}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                {/* Label */}
                <span
                  className={cn(
                    'relative z-10 text-[9px] tracking-wide leading-none transition-all duration-150',
                    isActive ? 'font-bold' : 'font-semibold'
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
