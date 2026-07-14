'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  Briefcase,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Star,
  ShieldCheck,
  ShieldAlert,
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
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

// ==================
// Mock Data
// ==================
const initialVendors = [
  { id: '1', name: 'CleanPro Solutions', owner: 'Piyush Malhotra', email: 'piyush@cleanpro.com', status: 'APPROVED', rating: 4.8, totalJobs: 142, gst: '29GGGGG1314R9Z8' },
  { id: '2', name: 'TechFix Solutions', owner: 'Sanjay Mehta', email: 'sanjay@techfix.com', status: 'PENDING', rating: 0.0, totalJobs: 0, gst: '29AAAPA1212B1Z0' },
  { id: '3', name: 'CityClean Pros', owner: 'Radha Krishnan', email: 'radha@cityclean.in', status: 'PENDING', rating: 0.0, totalJobs: 0, gst: '29CCCPA1010C1Z2' },
  { id: '4', name: 'PestAway Experts', owner: 'Vikram Patel', email: 'vikram@pestaway.in', status: 'APPROVED', rating: 4.6, totalJobs: 89, gst: '29BBBBA4444X1Z9' },
  { id: '5', name: 'Bad Quality Vendor', owner: 'Vijay Kumar', email: 'vijay@badquality.com', status: 'SUSPENDED', rating: 3.1, totalJobs: 12, gst: '29DDDDD5555Y1Z1' },
];

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState(initialVendors);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'SUSPENDED'>('ALL');

  const handleApprove = (id: string) => {
    setVendors((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: 'APPROVED' } : v))
    );
    toast.success('Vendor onboarding request approved.');
  };

  const handleReject = (id: string) => {
    setVendors((prev) => prev.filter((v) => v.id !== id));
    toast.error('Vendor onboarding request rejected.');
  };

  const handleToggleSuspension = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'APPROVED' ? 'SUSPENDED' : 'APPROVED';
    setVendors((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: nextStatus } : v))
    );
    if (nextStatus === 'SUSPENDED') {
      toast.error('Vendor business suspended.');
    } else {
      toast.success('Vendor business activated.');
    }
  };

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.gst.includes(searchQuery);

    if (statusFilter === 'ALL') return matchesSearch;
    return vendor.status === statusFilter && matchesSearch;
  });

  return (
    <DashboardLayout
      role="admin"
      breadcrumbs={[{ label: 'Admin Portal' }, { label: 'Vendors' }]}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto space-y-6"
      >
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-foreground">Vendors Directory</h2>
          <p className="text-sm text-muted-foreground">
            Approve new business partners, view ratings, and toggle suspensions.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex bg-muted/60 p-1 rounded-xl border border-border/50 self-start">
            {(['ALL', 'PENDING', 'APPROVED', 'SUSPENDED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  statusFilter === tab
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.toLowerCase()}
              </button>
            ))}
          </div>

          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search Business, GST, Owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-9 pr-4 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all"
            />
          </div>
        </div>

        {/* Vendors List */}
        <div className="space-y-4">
          {filteredVendors.map((vendor, i) => (
            <motion.div
              key={vendor.id}
              custom={i}
              variants={tableRowVariants}
              className="bg-card border border-border/50 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-all"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-md">
                    GSTIN: {vendor.gst}
                  </span>
                  <StatusBadge status={vendor.status} size="sm" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    {vendor.name}
                    {vendor.status === 'APPROVED' && (
                      <ShieldCheck size={13} className="text-green-600" />
                    )}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Owner: {vendor.owner} · {vendor.email}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <Star size={11} className="fill-amber-400 text-amber-400" />
                    {vendor.rating > 0 ? vendor.rating : 'N/A'}
                  </span>
                  <span>{vendor.totalJobs} Jobs Completed</span>
                </div>
              </div>

              <div className="flex gap-2">
                {vendor.status === 'PENDING' && (
                  <>
                    <Button
                      size="xs"
                      variant="destructive"
                      onClick={() => handleReject(vendor.id)}
                      className="rounded-lg"
                    >
                      Reject
                    </Button>
                    <Button
                      size="xs"
                      onClick={() => handleApprove(vendor.id)}
                      className="rounded-lg bg-green-600 hover:bg-green-700 text-white"
                    >
                      Approve
                    </Button>
                  </>
                )}

                {vendor.status === 'APPROVED' && (
                  <Button
                    size="xs"
                    variant="destructive"
                    onClick={() => handleToggleSuspension(vendor.id, vendor.status)}
                    className="rounded-lg"
                  >
                    Deactivate
                  </Button>
                )}

                {vendor.status === 'SUSPENDED' && (
                  <Button
                    size="xs"
                    onClick={() => handleToggleSuspension(vendor.id, vendor.status)}
                    className="rounded-lg bg-green-600 hover:bg-green-700 text-white"
                  >
                    Activate
                  </Button>
                )}

                <Button variant="ghost" size="xs" className="gap-1 rounded-lg text-[11px]">
                  <Eye size={11} /> View Docs
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

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
