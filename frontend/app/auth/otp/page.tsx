'use client';

import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authCardVariants } from '@/lib/animations';
import { toast } from 'sonner';

export default function OtpPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(59);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    if (text.length === 6 && !isNaN(Number(text))) {
      setOtp(text.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleResend = () => {
    if (countdown > 0) return;
    setCountdown(59);
    toast.success('A new OTP has been sent to your registered mobile and email.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pin = otp.join('');
    if (pin.length < 6) {
      toast.error('Please enter the complete 6-digit OTP.');
      return;
    }

    setIsSubmitting(true);
    // Simulate verification API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSuccess(true);

    setTimeout(() => {
      router.push('/customer/dashboard');
    }, 1500);
  };

  return (
    <motion.div
      variants={authCardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="w-full max-w-md p-8 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl shadow-2xl relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-primary/5 pointer-events-none" />

      <div className="relative z-10 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">OTP Verification</h1>
          <p className="text-sm text-muted-foreground">
            We have sent a 6-digit verification code to your registered details.
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
              <h2 className="text-md font-semibold text-foreground">Verification Successful</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your device has been verified successfully. Redirecting you to dashboard...
              </p>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-between gap-2 max-w-xs mx-auto" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-10 h-11 text-center font-semibold text-base border border-border bg-background rounded-xl outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all"
                />
              ))}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-9 rounded-xl font-medium shadow-sm gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify & Proceed'
              )}
            </Button>

            <div className="text-center space-y-3">
              <p className="text-xs text-muted-foreground font-semibold">
                {countdown > 0 ? (
                  `Resend code in ${countdown}s`
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-primary hover:underline font-semibold"
                  >
                    Resend OTP
                  </button>
                )}
              </p>

              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft size={13} />
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </motion.div>
  );
}
