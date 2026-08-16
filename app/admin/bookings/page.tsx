'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Download,
  Eye,
  Loader2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/shared/Pagination';
import {
  containerVariants,
  cardVariants,
  tableRowVariants,
} from '@/lib/animations';
import { formatCurrency, formatDate } from '@/lib/utils';
import { apiCall } from '@/lib/api';
import { toast } from 'sonner';

// ==================
// CSV Export Helper
// ==================
function buildBookingCSV(bookings: any[]): string {
  const headers = ['Booking #', 'Service', 'Customer', 'Vendor', 'Amount', 'Status', 'Payment', 'Date'];
  const rows = bookings.map((b) => [
    b.bookingNumber || b.id || '',
    b.service?.name || b.service || '',
    `${b.customer?.user?.firstName || ''} ${b.customer?.user?.lastName || ''}`.trim() || b.customer || '',
    b.vendor?.businessName || b.vendor || '',
    String(b.totalAmount ?? b.amount ?? ''),
    b.status || '',
    b.paymentMethod || '',
    b.scheduledAt || b.createdAt || b.date || '',
  ]);
  return [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
}

export default function AdminBookingsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: async () => {
      const res = await apiCall('/bookings');
      if (!res.success) throw new Error(res.message || 'Failed to load bookings');
      return res.data ?? [];
    },
  });

  const bookings: any[] = data ?? [];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const csv = buildBookingCSV(bookings);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cleanai_bookings_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Bookings exported to CSV.');
    } catch {
      toast.error('Export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const service = b.service?.name || b.service || '';
    const customer = `${b.customer?.user?.firstName || ''} ${b.customer?.user?.lastName || ''}`.trim() || b.customer || '';
    const vendor = b.vendor?.businessName || b.vendor || '';
    const number = b.bookingNumber || b.id || '';

    const matchesSearch =
      service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      number.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'ALL') return matchesSearch;
    return b.status === statusFilter && matchesSearch;
  });

  return (
    <DashboardLayout
      role="admin"
      breadcrumbs={[{ label: 'Admin Portal' }, { label: 'Bookings' }]}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Global Bookings</h2>
            <p className="text-sm text-muted-foreground">
              Monitor customer order bookings status and dispatch values.
            </p>
          </div>
          <Button size="sm" onClick={handleExport} disabled={isExporting} className="gap-1.5 rounded-xl shadow-sm self-start sm:self-auto">
            {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Export Sheet
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex bg-muted/60 p-1 rounded-xl border border-border/50 self-start overflow-x-auto max-w-full">
            {(['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab as 'ALL' | 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all whitespace-nowrap ${
                  statusFilter === tab
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.toLowerCase().replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search ID, Service, Customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-9 pr-4 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all"
            />
          </div>
        </div>

        {/* Bookings Table */}
        <motion.div
          variants={cardVariants}
          className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground text-sm">
              <Loader2 size={16} className="animate-spin" /> Loading bookings...
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center py-20 text-sm text-red-500">
              Failed to load bookings. Check your connection.
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
              No bookings found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Booking #
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-5 py-3 text-right" />
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking, idx) => {
                    const serviceName = booking.service?.name || booking.service || 'N/A';
                    const customerName = `${booking.customer?.user?.firstName || ''} ${booking.customer?.user?.lastName || ''}`.trim() || booking.customer || 'N/A';
                    const vendorName = booking.vendor?.businessName || booking.vendor || 'N/A';
                    const bookingNum = booking.bookingNumber || booking.id?.substring(0, 8).toUpperCase() || '';
                    const amount = booking.totalAmount ?? booking.amount ?? 0;
                    const date = booking.scheduledAt || booking.createdAt || booking.date || '';

                    return (
                      <motion.tr
                        key={booking.id}
                        custom={idx}
                        variants={tableRowVariants}
                        className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                      >
                        <td className="px-5 py-3">
                          <span className="text-xs font-mono font-bold text-muted-foreground">{bookingNum}</span>
                        </td>
                        <td className="px-5 py-3">
                          <div>
                            <p className="text-xs font-bold text-foreground">{serviceName}</p>
                            <p className="text-[10px] text-muted-foreground">
                              Cust: {customerName} · Vend: {vendorName}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs font-bold text-foreground">{formatCurrency(amount)}</span>
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={booking.status} size="sm" />
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs text-muted-foreground">{date ? formatDate(date) : 'N/A'}</span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Button variant="ghost" size="xs" className="gap-1 rounded-lg">
                            <Eye size={12} /> View
                          </Button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Pagination */}
        <Pagination
          currentPage={1}
          totalPages={1}
          onPageChange={() => {}}
          hasNextPage={false}
          hasPreviousPage={false}
        />
      </motion.div>
    </DashboardLayout>
  );
}
