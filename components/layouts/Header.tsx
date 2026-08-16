'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, Menu, ChevronRight, Home } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getInitials, cn } from '@/lib/utils';
import { bellVariants, badgeBounceVariants } from '@/lib/animations';
import type { BreadcrumbItem } from '@/types';
import Link from 'next/link';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationDropdown } from './NotificationDropdown';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import { CommandPalette } from './CommandPalette';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  title?: string;
  breadcrumbs?: BreadcrumbItem[]  ;
  role: 'customer' | 'vendor' | 'admin';
  onMobileMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

export function Header({
  title,
  breadcrumbs,
  role,
  onMobileMenuToggle,
  isMobileMenuOpen,
}: HeaderProps) {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [bellShake, setBellShake] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCmdPaletteOpen, setIsCmdPaletteOpen] = useState(false);
  // Only fetch unread count once auth is confirmed — prevents 401 floods on cold load
  const { unreadCount } = useNotifications({
    enabledFeed: false,
    isAuthenticated: isAuthenticated && !authLoading,
  });

  // Scroll-aware glass intensification
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ⌘K command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCmdPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleBellClick = () => {
    setBellShake(true);
    setTimeout(() => setBellShake(false), 700);
    setIsNotificationsOpen((prev) => !prev);
  };

  const commands = [
    { category: 'Navigation', label: 'Go to Dashboard', icon: '📊', action: () => router.push(`/${role}/dashboard`) },
    {
      category: 'Navigation',
      label: role === 'vendor' ? 'Manage Jobs' : 'My Bookings',
      icon: '📅',
      action: () => router.push(role === 'vendor' ? '/vendor/jobs' : '/customer/bookings'),
    },
    ...(role === 'customer'
      ? [{ category: 'Navigation', label: 'Services Catalog', icon: '✨', action: () => router.push('/customer/services') }]
      : []),
    { category: 'Navigation', label: 'Notifications', icon: '🔔', action: () => router.push(`/${role}/notifications`) },
    { category: 'Navigation', label: 'Settings', icon: '⚙️', action: () => router.push(`/${role}/settings`) },
    { category: 'Account', label: 'Sign Out', icon: '🚪', action: () => { logout(); router.push('/auth/login'); } },
  ];

  return (
    <>
      {/* Skip-to-content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[99] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-xl focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Floating header container */}
      <div className={cn('sticky top-0 z-[var(--z-header)] px-4 pt-4 pb-0 w-full shrink-0 transition-all duration-300', isScrolled && 'pt-2')}>
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.30, ease: [0.16, 1, 0.3, 1] }}
          role="banner"
          className={cn(
            'flex items-center h-14 px-4 md:px-5 gap-3 rounded-2xl',
            'transition-all duration-300',
            isScrolled
              ? 'glass-2 shadow-[var(--shadow-header)] border border-white/45 dark:border-white/8'
              : 'glass-1 shadow-[var(--shadow-xs)] border border-white/40 dark:border-white/6'
          )}
        >
          {/* Mobile menu button */}
          <button
            onClick={onMobileMenuToggle}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-foreground/4 dark:hover:bg-white/4 text-foreground transition-colors"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={isMobileMenuOpen ? 'close' : 'menu'}
                initial={{ opacity: 0, rotate: -90, scale: 0.7 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.7 }}
                transition={{ duration: 0.16 }}
              >
                {isMobileMenuOpen ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <Menu size={15} />
                )}
              </motion.div>
            </AnimatePresence>
          </button>

          {/* Mobile brand logo */}
          <div className="flex md:hidden items-center gap-2 shrink-0">
            <Link href={`/${role}/dashboard`} className="flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 rounded-lg" aria-label="CleanAI Home">
              <div className="w-7 h-7 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-[var(--shadow-primary)]">
                <Home size={14} className="text-primary-foreground" />
              </div>
              <span className="font-extrabold text-sm text-foreground tracking-tight select-none">
                Clean<span className="text-primary">AI</span>
              </span>
            </Link>
          </div>

          {/* Desktop: Title / Breadcrumbs */}
          <div className="flex-1 min-w-0 hidden md:block">
            {breadcrumbs && breadcrumbs.length > 0 ? (
              <nav aria-label="Breadcrumb">
                <ol className="flex items-center gap-1.5 text-sm" role="list">
                  {breadcrumbs.map((crumb, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      {i > 0 && <ChevronRight size={11} className="text-muted-foreground/40" aria-hidden="true" />}
                      {crumb.href && i < breadcrumbs.length - 1 ? (
                        <Link
                          href={crumb.href}
                          className="text-muted-foreground hover:text-foreground transition-colors duration-150 font-medium"
                        >
                          {crumb.label}
                        </Link>
                      ) : (
                        <span
                          className={cn(
                            i === breadcrumbs.length - 1
                              ? 'font-semibold text-foreground'
                              : 'text-muted-foreground'
                          )}
                          aria-current={i === breadcrumbs.length - 1 ? 'page' : undefined}
                        >
                          {crumb.label}
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            ) : title ? (
              <h1 className="text-[15px] font-semibold text-foreground truncate tracking-[-0.01em]">{title}</h1>
            ) : null}
          </div>

          {/* Spacer for mobile */}
          <div className="flex-1 md:hidden" />

          {/* Search / Command Palette Trigger */}
          <button
            onClick={() => setIsCmdPaletteOpen(true)}
            aria-label="Open command palette (⌘K)"
            className={cn(
              'hidden sm:flex items-center gap-2 h-8 px-3 w-44 text-left text-xs rounded-xl',
              'bg-foreground/4 dark:bg-white/5 hover:bg-foreground/7 dark:hover:bg-white/8',
              'border border-border/40 hover:border-border/60',
              'text-muted-foreground transition-all duration-200 cursor-pointer',
              'focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2'
            )}
          >
            <Search size={13} aria-hidden="true" />
            <span>Search...</span>
            <kbd className="ml-auto text-[9px] bg-background/80 dark:bg-white/8 border border-border/50 px-1.5 py-0.5 rounded-md font-semibold opacity-70 select-none">
              ⌘K
            </kbd>
          </button>

          {/* Right Actions group */}
          <div className="flex items-center gap-1 ml-auto md:ml-0">
            {/* Theme toggle */}
            <ThemeToggle />

            {/* Notification bell */}
            <div className="relative">
              <motion.button
                variants={bellVariants}
                animate={bellShake ? 'shake' : 'idle'}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                onClick={handleBellClick}
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                aria-expanded={isNotificationsOpen}
                className="w-9 h-9 rounded-xl hover:bg-foreground/4 dark:hover:bg-white/5 flex items-center justify-center text-foreground transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
              >
                <Bell size={15} strokeWidth={1.9} />
              </motion.button>

              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.div
                    variants={badgeBounceVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="absolute -top-0.5 -right-0.5"
                    aria-hidden="true"
                  >
                    <div className="min-w-[16px] h-4 bg-primary rounded-full flex items-center justify-center px-[3px] border-2 border-background shadow-[var(--shadow-primary)]">
                      <span className="text-[8.5px] font-black text-primary-foreground leading-none">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <NotificationDropdown
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
                role={role}
              />
            </div>

            {/* User account menu */}
            <UserMenu />
          </div>
        </motion.header>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCmdPaletteOpen}
        onClose={() => setIsCmdPaletteOpen(false)}
        commands={commands}
      />
    </>
  );
}
