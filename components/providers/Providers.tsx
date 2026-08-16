'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { type ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/design-system/theme/ThemeProvider';

interface ProvidersProps {
  children: ReactNode;
}

let browserQueryClient: QueryClient | undefined = undefined;

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: (failureCount, error: unknown) => {
          // Don't retry on auth errors
          if (
            error instanceof Error &&
            (error.message.includes('401') || error.message.includes('403'))
          ) {
            return false;
          }
          return failureCount < 3;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export function Providers({ children }: ProvidersProps) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider delay={200}>
            {children}
            <Toaster
              position="top-right"
              expand={false}
              richColors
              closeButton
              toastOptions={{
                duration: 4000,
                classNames: {
                  toast: 'glass-3 border-border/40 shadow-[var(--shadow-lg)] rounded-2xl text-foreground',
                  title: 'font-semibold text-sm text-foreground',
                  description: 'text-muted-foreground text-xs',
                  closeButton: 'text-muted-foreground hover:text-foreground',
                  error: 'bg-destructive/10 border-destructive/20 text-destructive',
                  success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600',
                },
              }}
            />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
