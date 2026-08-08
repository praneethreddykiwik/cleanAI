import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers/Providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
});

import { APP_CONFIG } from '@/lib/config';

export const metadata: Metadata = {
  metadataBase: new URL(APP_CONFIG.appUrl),
  title: {
    default: 'Clean AI — AI-Powered Home Services',
    template: '%s | Clean AI',
  },
  description:
    'Connect with verified home service professionals. Powered by AI to match you with the best vendors for cleaning, plumbing, electrical, painting, and more.',
  keywords: [
    'home services',
    'cleaning',
    'plumbing',
    'electrical',
    'AI marketplace',
    'vendor platform',
  ],
  authors: [{ name: 'Clean AI Team' }],
  creator: 'Clean AI',
  publisher: 'Clean AI',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: '/',
    title: 'Clean AI — AI-Powered Home Services',
    description: 'Enterprise-grade AI Home Services Marketplace',
    siteName: 'Clean AI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clean AI — AI-Powered Home Services',
    description: 'Enterprise-grade AI Home Services Marketplace',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0f1a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
