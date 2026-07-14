import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Customer Portal',
  description: 'Manage your home service bookings',
};

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
