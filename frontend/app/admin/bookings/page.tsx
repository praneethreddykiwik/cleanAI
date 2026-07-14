'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  Calendar,
  Clock,
  Search,
  Download,
  Filter,
  Eye,
  MapPin,
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
import { toast } from 'sonner';

// ==================
// Mock Data
// ==================
const initialBookings = [
  { id: '1', number: 'CAI-A1B2', service: 'Deep Cleaning', customer: 'Priya Sharma', vendor: 'CleanPro', amount: 1499, status: 'COMPLETED', date: new Date(Date.now() - 86400000).toISOString(), address: 'Sector 4, HSR Layout, Bengaluru' },
  { id: '2', number: 'CAI-C3D4', service: 'Electrical Repair', customer: 'Rahul Gupta', vendor: 'QuickFix', amount: 399, status: 'IN_PROGRESS', date: new Date().toISOString(), address: 'Flat 101, Indiranagar, Bengaluru' },
  { id: '3', number: 'CAI-E5F6', service: 'Pest Control', customer: 'Ananya Iyer', vendor: 'PestAway', amount: 799, status: 'PENDING', date: new Date(Date.now() + 86400000).toISOString(), address: 'G-02, Koramangala, Bengaluru' },
  { id: '4', number: 'CAI-G7H8', service: 'AC Service', customer: 'Vikram Nair', vendor: 'CoolBreeze', amount: 599, status: 'CANCELLED', date: new Date(Date.now() - 2 * 86400000).toISOString(), address: 'Block C, Whitefield, Bengaluru' },
];

export default function AdminBookingsPage() {
  const [bookings] = useState(initialBookings);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'>('ALL');

  const handleExport = () => {
    toast.success('Bookings sheet exported successfully to CSV.');
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.number.toLowerCase().includes(searchQuery.toLowerCase());

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
          <Button size="sm" onClick={handleExport} className="gap-1.5 rounded-xl shadow-sm self-start sm:self-auto">
            <Download size={14} /> Export Sheet
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
                {filteredBookings.map((booking, idx) => (
                  <motion.tr
                    key={booking.id}
                    custom={idx}
                    variants={tableRowVariants}
                    className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <span className="text-xs font-mono font-bold text-muted-foreground">{booking.number}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div>
                        <p className="text-xs font-bold text-foreground">{booking.service}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Cust: {booking.customer} · Vend: {booking.vendor}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-bold text-foreground">{formatCurrency(booking.amount)}</span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={booking.status} size="sm" />
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-muted-foreground">{formatDate(booking.date)}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button variant="ghost" size="xs" className="gap-1 rounded-lg">
                        <Eye size={12} /> View
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
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
