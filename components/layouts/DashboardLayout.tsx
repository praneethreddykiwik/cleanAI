'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNavigation } from './BottomNavigation';
import { PageTransition } from '@/components/shared/PageTransition';
import type { BreadcrumbItem } from '@/types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Grid3X3,
  Calendar,
  Bell,
  Settings,
  Users,
  Briefcase,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'customer' | 'vendor' | 'admin';
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
}

export function DashboardLayout({
  children,
  role,
  title,
  breadcrumbs,
  className,
}: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/auth/login');
      } else if (user.role !== role.toUpperCase() && user.role !== 'ADMIN') {
        const redirectMap: Record<string, string> = {
          CUSTOMER: '/customer/dashboard',
          VENDOR: '/vendor/dashboard',
          ADMIN: '/admin/dashboard',
        };
        router.replace(redirectMap[user.role] || '/customer/dashboard');
      }
    }
  }, [user, isLoading, role, router]);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setTimeout(() => {
      setIsMobileMenuOpen((open) => (open ? false : open));
    }, 0);
  }, [pathname]);

  const bottomNavItems = {
    customer: [
      { label: 'Dashboard', href: '/customer/dashboard', icon: LayoutDashboard },
      { label: 'Services', href: '/customer/services', icon: Grid3X3 },
      { label: 'Bookings', href: '/customer/bookings', icon: Calendar },
      { label: 'Alerts', href: '/customer/notifications', icon: Bell },
    ],
    vendor: [
      { label: 'Dashboard', href: '/vendor/dashboard', icon: LayoutDashboard },
      { label: 'Jobs', href: '/vendor/jobs', icon: Briefcase },
      { label: 'Agents', href: '/vendor/agents', icon: Users },
      { label: 'Settings', href: '/vendor/settings', icon: Settings },
    ],
    admin: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Users', href: '/admin/users', icon: Users },
      { label: 'Bookings', href: '/admin/bookings', icon: Calendar },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  }[role];

  if (isLoading || !user || (user.role !== role.toUpperCase() && user.role !== 'ADMIN')) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin-smooth" />
          <p className="text-xs text-muted-foreground font-semibold">Verifying role permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar role={role} />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 h-full z-50 md:hidden"
            >
              <Sidebar role={role} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title={title}
          breadcrumbs={breadcrumbs}
          role={role}
          onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isMobileMenuOpen={isMobileMenuOpen}
        />

        <main id="main-content" className={cn('flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 outline-none', className)}>
          <PageTransition transitionKey={pathname}>
            {children}
          </PageTransition>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNavigation items={bottomNavItems} />
    </div>
  );
}
