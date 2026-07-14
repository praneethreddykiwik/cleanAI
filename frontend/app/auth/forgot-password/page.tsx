'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authCardVariants } from '@/lib/animations';
import { cn } from '@/lib/utils';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <motion.div
        variants={authCardVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full max-w-md p-8 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl shadow-2xl relative overflow-hidden"
      >
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-primary/5 pointer-events-none" />

      <div className="relative z-10 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Forgot Password</h1>
          <p className="text-sm text-muted-foreground">
            No worries, we will send you password reset instructions.
          </p>
        </div>

        {isSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 text-center py-4"
          >
            <div className="mx-auto w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
              <CheckCircle2 size={24} />
            </div>
            <div className="space-y-2">
              <h2 className="text-md font-semibold text-foreground">Check your email</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We have sent reset instructions to your email address. Follow the link in that email to reset your password.
              </p>
            </div>
            <Link href="/auth/login" className="block">
              <Button className="w-full h-9 rounded-xl font-medium shadow-sm">
                Back to Login
              </Button>
            </Link>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-muted-foreground">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className={cn(
                    'w-full h-9 pl-9 pr-4 rounded-xl border border-border bg-background text-sm font-medium outline-none transition-all focus:border-primary focus:ring-3 focus:ring-primary/10',
                    errors.email && 'border-destructive focus:border-destructive focus:ring-destructive/15'
                  )}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-xs font-semibold text-destructive">{errors.email.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-9 rounded-xl font-medium shadow-sm gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending Link...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>

            <Link
              href="/auth/login"
              className="flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              <ArrowLeft size={13} />
              Back to Login
            </Link>
          </form>
        )}
      </div>
    </motion.div>
  </div>
  );
}
