import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vendor Portal',
  description: 'Manage your home services business',
};

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
