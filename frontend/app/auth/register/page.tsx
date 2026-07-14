'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import {
  Eye, EyeOff, Mail, Lock, User, Phone, Home, ArrowRight, Loader2, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authCardVariants, authBlobVariants } from '@/lib/animations';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import type { RegisterRequest } from '@/types';

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  role: z.enum(['CUSTOMER', 'VENDOR']),
  agreeToTerms: z.literal(true).refine((val) => val === true, {
    message: 'You must agree to the terms',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

const roleOptions = [
  {
    value: 'CUSTOMER' as const,
    label: 'Customer',
    icon: '🏠',
    description: 'Book home services',
    color: 'border-blue-200 bg-blue-50 text-blue-700',
    activeColor: 'ring-2 ring-blue-400',
  },
  {
    value: 'VENDOR' as const,
    label: 'Service Vendor',
    icon: '🏪',
    description: 'Offer home services',
    color: 'border-purple-200 bg-purple-50 text-purple-700',
    activeColor: 'ring-2 ring-purple-400',
  },
];

interface PasswordStrengthProps {
  password: string;
}

function PasswordStrength({ password }: PasswordStrengthProps) {
  const checks = [
    { label: '8+ characters', met: password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Number', met: /[0-9]/.test(password) },
  ];
  const strength = checks.filter((c) => c.met).length;
  const strengthColors = ['', 'bg-red-500', 'bg-amber-500', 'bg-green-500'];
  const strengthLabels = ['', 'Weak', 'Fair', 'Strong'];

  if (!password) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="space-y-2"
    >
      <div className="flex items-center gap-1.5">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-all duration-500',
              i <= strength ? strengthColors[strength] : 'bg-muted'
            )}
          />
        ))}
        <span
          className={cn(
            'text-[11px] font-medium ml-1',
            strength === 1
              ? 'text-red-600'
              : strength === 2
              ? 'text-amber-600'
              : 'text-green-600'
          )}
        >
          {strengthLabels[strength]}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {checks.map((check) => (
          <div key={check.label} className="flex items-center gap-1">
            <div
              className={cn(
                'w-3.5 h-3.5 rounded-full flex items-center justify-center',
                check.met ? 'bg-green-500' : 'bg-muted'
              )}
            >
              {check.met && <Check size={8} className="text-white" strokeWidth={3} />}
            </div>
            <span
              className={cn(
                'text-[10px]',
                check.met ? 'text-green-700' : 'text-muted-foreground'
              )}
            >
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'CUSTOMER' },
  });

  const selectedRole = watch('role');
  const password = watch('password', '');

  const onSubmit = async (data: RegisterForm) => {
    setIsSubmitting(true);
    try {
      await registerUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: data.role,
      });
      toast.success('Account created! Please verify your email.');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Registration failed. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    cn(
      'w-full h-11 pl-9 pr-4 text-sm rounded-xl border bg-muted/50',
      'placeholder:text-muted-foreground/60 transition-all duration-200 outline-none',
      hasError
        ? 'border-destructive ring-1 ring-destructive/30 bg-destructive/5'
        : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/10 focus:bg-background'
    );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12 relative overflow-hidden">
      {/* Background blobs */}
      <motion.div
        variants={authBlobVariants}
        animate="animate"
        className="absolute top-20 right-20 w-56 h-56 bg-purple-400/15 blur-3xl pointer-events-none"
      />
      <motion.div
        variants={authBlobVariants}
        animate="animate"
        transition={{ delay: 3 }}
        className="absolute bottom-20 left-20 w-64 h-64 bg-blue-400/15 blur-3xl pointer-events-none"
      />

      <motion.div
        variants={authCardVariants}
        initial="hidden"
        animate="visible"
        className="glass w-full max-w-md rounded-3xl p-8 shadow-2xl relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm">
            <Home size={18} className="text-primary-foreground" />
          </div>
          <div>
            <span className="font-bold text-xl text-foreground">Clean</span>
            <span className="font-bold text-xl text-primary">AI</span>
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-1">Create account</h1>
          <p className="text-sm text-muted-foreground">
            Join thousands of happy customers and vendors
          </p>
        </div>

        {/* Role Selector */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
            I want to
          </p>
          <div className="grid grid-cols-2 gap-2">
            {roleOptions.map((option) => (
              <motion.button
                key={option.value}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setValue('role', option.value)}
                className={cn(
                  'p-3 rounded-xl border text-left transition-all duration-200',
                  selectedRole === option.value
                    ? `${option.color} ${option.activeColor}`
                    : 'border-border bg-muted/40 text-muted-foreground hover:border-border hover:bg-accent'
                )}
              >
                <span className="text-lg block mb-1">{option.icon}</span>
                <span className="text-xs font-semibold block">{option.label}</span>
                <span className="text-[10px] opacity-70 block">{option.description}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
          {/* Name Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="firstName" className="text-xs font-medium text-foreground">
                First Name
              </label>
              <div className="relative">
                <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  {...register('firstName')}
                  placeholder="John"
                  className={inputClass(!!errors.firstName)}
                  aria-invalid={!!errors.firstName}
                />
              </div>
              {errors.firstName && (
                <p className="text-[11px] text-destructive">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="lastName" className="text-xs font-medium text-foreground">
                Last Name
              </label>
              <div className="relative">
                <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  {...register('lastName')}
                  placeholder="Doe"
                  className={inputClass(!!errors.lastName)}
                  aria-invalid={!!errors.lastName}
                />
              </div>
              {errors.lastName && (
                <p className="text-[11px] text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-medium text-foreground">
              Email address
            </label>
            <div className="relative">
              <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                placeholder="name@example.com"
                className={inputClass(!!errors.email)}
                aria-invalid={!!errors.email}
              />
            </div>
            {errors.email && (
              <p className="text-[11px] text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label htmlFor="phone" className="text-xs font-medium text-foreground">
              Mobile Number
            </label>
            <div className="relative">
              <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                {...register('phone')}
                placeholder="9876543210"
                className={cn(inputClass(!!errors.phone), 'pl-9')}
                aria-invalid={!!errors.phone}
              />
            </div>
            {errors.phone && (
              <p className="text-[11px] text-destructive">{errors.phone.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-medium text-foreground">
              Password
            </label>
            <div className="relative">
              <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                {...register('password')}
                placeholder="Create a strong password"
                className={cn(inputClass(!!errors.password), 'pr-10')}
                aria-invalid={!!errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
            <PasswordStrength password={password} />
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="text-xs font-medium text-foreground">
              Confirm Password
            </label>
            <div className="relative">
              <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                {...register('confirmPassword')}
                placeholder="Repeat your password"
                className={cn(inputClass(!!errors.confirmPassword), 'pr-10')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-[11px] text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Terms */}
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              {...register('agreeToTerms')}
              className="w-4 h-4 mt-0.5 rounded border-border text-primary cursor-pointer shrink-0"
            />
            <span className="text-xs text-muted-foreground">
              I agree to the{' '}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.agreeToTerms && (
            <p className="text-[11px] text-destructive">{errors.agreeToTerms.message}</p>
          )}

          {/* Submit */}
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="pt-1">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 text-sm font-semibold rounded-xl gap-2"
              style={{ boxShadow: 'var(--shadow-primary)' }}
            >
              {isSubmitting ? (
                <><Loader2 size={15} className="animate-spin" /> Creating account...</>
              ) : (
                <>Create Account <ArrowRight size={15} /></>
              )}
            </Button>
          </motion.div>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary hover:underline font-semibold">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
