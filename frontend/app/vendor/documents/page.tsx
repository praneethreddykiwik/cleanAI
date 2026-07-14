'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { FileText, Upload, CheckCircle, ShieldAlert, Clock, Eye, Download } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { containerVariants, cardVariants } from '@/lib/animations';
import { toast } from 'sonner';

interface DocumentItem {
  id: string;
  type: string;
  name: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  updatedAt: string;
}

const INITIAL_DOCS: DocumentItem[] = [
  { id: '1', type: 'GST Registration Certificate', name: 'gst_certificate.pdf', status: 'VERIFIED', updatedAt: '2 days ago' },
  { id: '2', type: 'PAN Card copy', name: 'pan_card.jpg', status: 'VERIFIED', updatedAt: '2 days ago' },
  { id: '3', type: 'Workmen Liability Insurance Certificate', name: 'insurance_policy.pdf', status: 'PENDING', updatedAt: '1 hour ago' },
  { id: '4', type: 'Trade License Copy', name: 'trade_license_2026.pdf', status: 'REJECTED', updatedAt: '3 days ago' },
];

export default function VendorDocumentsPage() {
  const [docs, setDocs] = useState<DocumentItem[]>(INITIAL_DOCS);

  const getStatusBadge = (status: DocumentItem['status']) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
            <CheckCircle size={10} /> Verified
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock size={10} /> Pending Audit
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
            <ShieldAlert size={10} /> Rejected
          </span>
        );
    }
  };

  const handleUploadClick = () => {
    toast.info('Document upload engine started. Drag-and-drop file to submit.');
  };

  return (
    <DashboardLayout
      role="vendor"
      breadcrumbs={[{ label: 'B2B Portal' }, { label: 'Compliance Documents' }]}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto space-y-6"
      >
        {/* Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Compliance Documents</h2>
            <p className="text-sm text-muted-foreground">
              Submit regulatory credentials to verify your business and unlock client bookings.
            </p>
          </div>
          <Button size="sm" onClick={handleUploadClick} className="gap-1.5 rounded-xl font-semibold shadow-sm">
            <Upload size={14} /> Upload File
          </Button>
        </div>

        {/* Warning Banner */}
        <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={16} />
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-amber-900">Verification Pending</h4>
            <p className="text-[10px] text-amber-700 leading-relaxed max-w-2xl">
              Your trade license upload was rejected. Please re-upload a clear, non-expired PDF of your valid municipal trade certificate to prevent service suspensions.
            </p>
          </div>
        </div>

        {/* Document Checklist cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {docs.map((doc) => (
            <motion.div
              key={doc.id}
              variants={cardVariants}
              className="p-5 bg-card border border-border/50 rounded-2xl shadow-sm space-y-4 hover:border-border transition-colors group"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-foreground">{doc.type}</h3>
                  <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5">
                    <FileText size={12} className="text-primary" /> {doc.name}
                  </p>
                </div>
                {getStatusBadge(doc.status)}
              </div>

              <div className="h-px bg-border/40" />

              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground">Uploaded {doc.updatedAt}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent">
                    <Eye size={14} />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent">
                    <Download size={14} />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
