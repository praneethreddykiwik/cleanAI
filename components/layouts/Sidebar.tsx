'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Grid3X3,
  User,
  Bell,
  Settings,
  ChevronRight,
  Briefcase,
  Users,
  FileText,
  TrendingUp,
  DollarSign,
  Shield,
  BarChart3,
  BookOpen,
  Headphones,
  Home,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { sidebarItemVariants, containerVariants, sidebarPillVariants } from '@/lib/animations';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { useState, useEffect } from 'react';

// ==================
// Nav Item Types
// ==================
interface SidebarNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

// ==================
// Navigation Configs
// ==================
const CUSTOMER_NAV: SidebarNavItem[] = [
  { label: 'Dashboard', href: '/customer/dashboard', icon: LayoutDashboard },
  { label: 'Services', href: '/customer/services', icon: Grid3X3 },
  { label: 'My Bookings', href: '/customer/bookings', icon: Calendar },
  { label: 'Notifications', href: '/customer/notifications', icon: Bell },
  { label: 'Profile', href: '/customer/profile', icon: User },
  { label: 'Settings', href: '/customer/settings', icon: Settings },
];

const VENDOR_NAV: SidebarNavItem[] = [
  { label: 'Dashboard', href: '/vendor/dashboard', icon: LayoutDashboard },
  { label: 'Jobs', href: '/vendor/jobs', icon: Briefcase },
  { label: 'Agents', href: '/vendor/agents', icon: Users },
  { label: 'Analytics', href: '/vendor/analytics', icon: TrendingUp },
  { label: 'Pricing', href: '/vendor/pricing', icon: DollarSign },
  { label: 'Documents', href: '/vendor/documents', icon: FileText },
  { label: 'Notifications', href: '/vendor/notifications', icon: Bell },
  { label: 'Profile', href: '/vendor/profile', icon: User },
  { label: 'Settings', href: '/vendor/settings', icon: Settings },
];

const ADMIN_NAV: SidebarNavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Vendors', href: '/admin/vendors', icon: Briefcase },
  { label: 'Bookings', href: '/admin/bookings', icon: Calendar },
  { label: 'Agents', href: '/admin/agents', icon: Wrench },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Reports', href: '/admin/reports', icon: BookOpen },
  { label: 'Support', href: '/admin/support', icon: Headphones },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

// ==================
// Single Nav Item
// ==================
interface NavItemProps {
  item: SidebarNavItem;
  isCollapsed: boolean;
  index: number;
  role: 'customer' | 'vendor' | 'admin';
}

function NavItem({ item, isCollapsed, index, role }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  const Icon = item.icon;

  const roleActiveClasses = {
    customer: 'text-primary dark:text-blue-400',
    vendor: 'text-violet-600 dark:text-violet-400',
    admin: 'text-slate-700 dark:text-slate-300',
  };

  const rolePillClasses = {
    customer: 'bg-primary/5 dark:bg-primary/8 border-primary/8 dark:border-primary/15',
    vendor: 'bg-violet-500/5 dark:bg-violet-500/8 border-violet-500/8 dark:border-violet-500/15',
    admin: 'bg-slate-500/5 dark:bg-slate-500/8 border-slate-500/8 dark:border-slate-500/15',
  };

  return (
    <motion.div
      custom={index}
      variants={sidebarItemVariants}
      className="relative px-2 py-0.5"
    >
      <Link
        href={item.href}
        aria-label={item.label}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
          isCollapsed ? 'justify-center' : 'justify-start',
          isActive
            ? cn(roleActiveClasses[role], 'font-semibold')
            : 'text-muted-foreground/80 hover:text-foreground hover:bg-foreground/3 dark:hover:bg-white/3'
        )}
      >
        {/* Spring active pill background */}
        {isActive && (
          <motion.div
            layoutId="sidebar-active-pill"
            layout
            transition={{
              type: 'spring',
              stiffness: 380,
              damping: 30,
              mass: 1,
            }}
            className={cn('absolute inset-0 rounded-xl border', rolePillClasses[role])}
          />
        )}

        {/* Icon */}
        <div className={cn('relative z-10 shrink-0 flex items-center justify-center', isCollapsed ? '' : 'pl-0.5')}>
          <Icon
            size={16}
            strokeWidth={isActive ? 2.0 : 1.7}
            className="transition-transform duration-200 group-hover:scale-105"
          />
        </div>

        {/* Label */}
        {!isCollapsed && (
          <span className="relative z-10 whitespace-nowrap overflow-hidden text-ellipsis flex-1">
            {item.label}
          </span>
        )}

        {/* Badge */}
        {item.badge != null && item.badge > 0 && (
          <div className="relative z-10">
            {!isCollapsed ? (
              <Badge
                variant="secondary"
                className={cn(
                  'h-[18px] min-w-[18px] text-[9px] px-1 font-bold rounded-full flex items-center justify-center transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-foreground/5 text-muted-foreground group-hover:bg-foreground/8'
                )}
              >
                {item.badge}
              </Badge>
            ) : (
              <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-primary rounded-full ring-1 ring-background" />
            )}
          </div>
        )}

        {/* Collapsed state Tooltip */}
        {isCollapsed && (
          <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-popover/90 backdrop-blur-md text-popover-foreground text-xs font-semibold rounded-lg shadow-lg border border-border/40 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
            {item.label}
          </div>
        )}
      </Link>
    </motion.div>
  );
}

// ==================
// Main Sidebar
// ==================
interface SidebarProps {
  role: 'customer' | 'vendor' | 'admin';
  className?: string;
}

export function Sidebar({ role, className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && window.innerWidth < 1024) {
        setIsCollapsed(true);
      } else if (window.innerWidth >= 1024) {
        setIsCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems =
    role === 'customer'
      ? CUSTOMER_NAV
      : role === 'vendor'
      ? VENDOR_NAV
      : ADMIN_NAV;

  const roleBadgeStyles = {
    customer: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25',
    vendor: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/25',
    admin: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/25',
  };

  const roleText = {
    customer: 'Customer',
    vendor: 'Partner',
    admin: 'Admin',
  };

  return (
    <div className="relative flex h-screen sticky top-0 shrink-0 z-20">
      <motion.aside
        animate={{ width: isCollapsed ? 72 : 248 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className={cn(
          'flex flex-col border-r border-border/40 glass-1 h-full shrink-0 overflow-hidden select-none',
          className
        )}
      >
        {/* Brand Header */}
        <div
          className={cn(
            'flex items-center h-16 px-4 border-b border-border/30 shrink-0 gap-2.5',
            isCollapsed ? 'justify-center' : 'justify-between'
          )}
        >
          <Link href={`/${role}/dashboard`} className="flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 rounded-lg">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-[var(--shadow-primary)]">
              <Home size={15} className="text-primary-foreground" />
            </div>
            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-baseline"
                >
                  <span className="font-extrabold text-[15px] tracking-tight text-foreground">Clean</span>
                  <span className="font-extrabold text-[15px] tracking-tight text-primary">AI</span>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>

          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                roleBadgeStyles[role]
              )}
            >
              {roleText[role]}
            </motion.span>
          )}
        </div>

        {/* Main Navigation Links */}
        <nav className="flex-1 py-4 overflow-y-auto scrollbar-none space-y-1">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-1"
          >
            {navItems.map((item, index) => (
              <NavItem
                key={item.href}
                item={item}
                isCollapsed={isCollapsed}
                index={index}
                role={role}
              />
            ))}
          </motion.div>
        </nav>

        {/* Sidebar Profile Card Footer */}
        <div className="border-t border-border/30 p-3 shrink-0">
          <div
            className={cn(
              'flex items-center gap-2.5 p-2 rounded-xl hover:bg-foreground/5 dark:hover:bg-white/5 cursor-pointer transition-colors duration-150',
              isCollapsed ? 'justify-center' : ''
            )}
            onClick={logout}
            title="Sign out"
          >
            <Avatar className="w-7 h-7 shrink-0 ring-2 ring-border/40">
              <AvatarImage src={user?.avatar} alt={user ? `${user.firstName} ${user.lastName}` : 'Account'} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-xs font-bold text-foreground truncate">
                    {user ? `${user.firstName} ${user.lastName}` : 'Account'}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">
                    {user?.email}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>

      {/* Toggle button outside aside to prevent clipping */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-[74px] w-6 h-6 bg-card border border-border/60 rounded-full flex items-center justify-center shadow-md hover:bg-accent transition-colors duration-200 z-50 cursor-pointer"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <motion.div
          animate={{ rotate: isCollapsed ? 0 : 180 }}
          transition={{ duration: 0.25 }}
        >
          <ChevronRight size={11} className="text-muted-foreground" />
        </motion.div>
      </button>
    </div>
  );
}
