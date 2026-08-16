'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, Home, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { authCardVariants, authBlobVariants } from '@/lib/animations';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { UserRole } from '@/types';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean(),
});

type LoginForm = z.infer<typeof loginSchema>;

type LoginRole = {
  value: UserRole;
  label: string;
  color: string;
  bg: string;
  description: string;
};

const roles: LoginRole[] = [
  { value: 'CUSTOMER', label: 'Customer', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', description: 'Book home services' },
  { value: 'VENDOR', label: 'Vendor', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', description: 'Manage your business' },
  { value: 'ADMIN', label: 'Admin', color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200', description: 'Platform management' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('CUSTOMER');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsSubmitting(true);
    try {
      await login({ ...data });
      toast.success('Welcome back! Redirecting to dashboard...');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Invalid credentials. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background blobs */}
      <motion.div
        variants={authBlobVariants}
        animate="animate"
        className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400/20 blur-3xl pointer-events-none"
        style={{ borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' }}
      />
      <motion.div
        variants={authBlobVariants}
        animate="animate"
        transition={{ delay: 2 }}
        className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-400/15 blur-3xl pointer-events-none"
        style={{ borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' }}
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 blur-3xl pointer-events-none rounded-full"
      />

      {/* Auth Card */}
      <motion.div
        variants={authCardVariants}
        initial="hidden"
        animate="visible"
        className="glass w-full max-w-md rounded-3xl p-8 shadow-2xl relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <motion.div
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.5 }}
            className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm"
          >
            <Home size={18} className="text-primary-foreground" />
          </motion.div>
          <div>
            <span className="font-bold text-xl text-foreground">Clean</span>
            <span className="font-bold text-xl text-primary">AI</span>
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-1">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>

        {/* Role Selector */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
            Sign in as
          </p>
          <div className="grid grid-cols-3 gap-2">
            {roles.map((role) => (
              <motion.button
                key={role.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedRole(role.value)}
                className={cn(
                  'relative px-3 py-2.5 rounded-xl border text-center transition-all duration-200',
                  selectedRole === role.value
                    ? `${role.bg} ${role.color} border-current shadow-sm`
                    : 'bg-muted/50 text-muted-foreground border-transparent hover:border-border'
                )}
              >
                {selectedRole === role.value && (
                  <motion.div
                    layoutId="role-active-bg"
                    className={cn('absolute inset-0 rounded-xl', role.bg)}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 block text-xs font-semibold">
                  {role.label}
                </span>
                <span className="relative z-10 block text-[10px] mt-0.5 opacity-70">
                  {role.description}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Email Field */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email address
            </label>
            <div className="relative">
              <Mail
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                placeholder="name@example.com"
                className={cn(
                  'w-full h-11 pl-9 pr-4 text-sm rounded-xl border bg-muted/50',
                  'placeholder:text-muted-foreground/60 transition-all duration-200 outline-none',
                  errors.email
                    ? 'border-destructive ring-1 ring-destructive/30 bg-destructive/5'
                    : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/10 focus:bg-background'
                )}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
            </div>
            <AnimatePresence>
              {errors.email && (
                <motion.p
                  id="email-error"
                  initial={{ opacity: 0, y: -4, x: -4 }}
                  animate={{ opacity: 1, y: 0, x: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-xs text-destructive font-medium"
                  role="alert"
                >
                  {errors.email.message}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-xs text-primary hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                {...register('password')}
                placeholder="Enter your password"
                className={cn(
                  'w-full h-11 pl-9 pr-10 text-sm rounded-xl border bg-muted/50',
                  'placeholder:text-muted-foreground/60 transition-all duration-200 outline-none',
                  errors.password
                    ? 'border-destructive ring-1 ring-destructive/30 bg-destructive/5'
                    : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/10 focus:bg-background'
                )}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <AnimatePresence mode="wait">
                  {showPassword ? (
                    <motion.div key="hide" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }}>
                      <EyeOff size={15} />
                    </motion.div>
                  ) : (
                    <motion.div key="show" initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -90 }}>
                      <Eye size={15} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>
            <AnimatePresence>
              {errors.password && (
                <motion.p
                  id="password-error"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-xs text-destructive font-medium"
                  role="alert"
                >
                  {errors.password.message}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Remember Me */}
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              {...register('rememberMe')}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
            />
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              Remember me for 30 days
            </span>
          </label>

          {/* Submit Button */}
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 text-sm font-semibold rounded-xl gap-2 shadow-sm"
              style={{ boxShadow: 'var(--shadow-primary)' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={15} />
                </>
              )}
            </Button>
          </motion.div>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link
            href="/auth/register"
            className="text-primary hover:underline font-semibold"
          >
            Create one free
          </Link>
        </p>

      </motion.div>
    </div>
  );
}
