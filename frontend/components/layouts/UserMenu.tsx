'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
  Shield,
  Bell,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { dropdownVariants, backdropVariants } from '@/lib/animations';

const roleLabel: Record<string, string> = {
  CUSTOMER: 'Customer',
  VENDOR:   'Service Provider',
  ADMIN:    'Administrator',
};

const roleColor: Record<string, string> = {
  CUSTOMER: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  VENDOR:   'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
  ADMIN:    'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
};

interface UserMenuProps {
  className?: string;
}

export function UserMenu({ className }: UserMenuProps) {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  if (!user) return null;

  const initials = `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase() || 'U';
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Account';
  const roleBadge = roleColor[user.role as string] || roleColor.CUSTOMER;

  const menuItems = [
    {
      label: 'Profile',
      icon: User,
      action: () => {
        router.push(`/${user.role.toLowerCase()}/settings`);
        setIsOpen(false);
      },
      shortcut: '⌘P',
    },
    {
      label: 'Notifications',
      icon: Bell,
      action: () => {
        router.push(`/${user.role.toLowerCase()}/notifications`);
        setIsOpen(false);
      },
    },
    {
      label: 'Settings',
      icon: Settings,
      action: () => {
        router.push(`/${user.role.toLowerCase()}/settings`);
        setIsOpen(false);
      },
      shortcut: '⌘,',
    },
    {
      label: 'Help & Support',
      icon: HelpCircle,
      action: () => setIsOpen(false),
    },
  ];

  return (
    <div className={cn('relative', className)}>
      {/* Trigger button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Account menu"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.97 }}
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 rounded-xl',
          'hover:bg-foreground/5 dark:hover:bg-white/6',
          'transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2'
        )}
      >
        {/* Avatar */}
        <div
          className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0',
            'bg-gradient-to-br from-primary to-blue-600 text-primary-foreground',
            'ring-2 ring-background'
          )}
          aria-hidden="true"
        >
          {initials}
        </div>

        {/* Name (hidden on small screens) */}
        <span className="hidden sm:block text-sm font-semibold text-foreground max-w-[100px] truncate">
          {user.firstName || 'Account'}
        </span>

        <ChevronDown
          size={12}
          className={cn(
            'text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </motion.button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Click-away backdrop */}
            <motion.div
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 z-[var(--z-dropdown)]"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            {/* Menu panel */}
            <motion.div
              role="menu"
              aria-label="Account options"
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={cn(
                'absolute top-full right-0 mt-2 w-64 z-[var(--z-dropdown)]',
                'glass-3 rounded-[1.5rem] overflow-hidden',
                'shadow-[var(--shadow-xl)] border border-white/40 dark:border-white/10'
              )}
            >
              {/* User info header */}
              <div className="px-4 py-4 border-b border-border/30">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 bg-gradient-to-br from-primary to-blue-600 text-primary-foreground ring-2 ring-background"
                    aria-hidden="true"
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border',
                        roleBadge
                      )}
                    >
                      <Shield size={9} />
                      {roleLabel[user.role as string] || user.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="p-2">
                {menuItems.map((item) => (
                  <button
                    key={item.label}
                    role="menuitem"
                    onClick={item.action}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm',
                      'text-foreground/80 hover:text-foreground hover:bg-foreground/5 dark:hover:bg-white/6',
                      'transition-colors duration-100 text-left group'
                    )}
                  >
                    <item.icon size={15} className="shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <span className="flex-1 font-medium">{item.label}</span>
                    {item.shortcut && (
                      <kbd className="text-[10px] text-muted-foreground/60 bg-muted/60 border border-border/50 px-1.5 py-0.5 rounded-md">
                        {item.shortcut}
                      </kbd>
                    )}
                  </button>
                ))}
              </div>

              {/* Logout */}
              <div className="p-2 border-t border-border/30">
                <button
                  role="menuitem"
                  onClick={() => { logout(); setIsOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-destructive hover:bg-destructive/8 transition-colors duration-100 text-left group"
                >
                  <LogOut size={15} className="shrink-0" />
                  <span className="flex-1 font-medium">Sign out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
