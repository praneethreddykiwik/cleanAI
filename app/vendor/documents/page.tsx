'use client';

import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { FileText, Upload, CheckCircle, ShieldAlert, Clock, Eye, Download, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { containerVariants, cardVariants } from '@/lib/animations';
import { apiCall } from '@/lib/api';
import { toast } from 'sonner';

interface DocumentItem {
  id: string;
  type: string;
  name: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  updatedAt: string;
  url?: string;
}

export default function VendorDocumentsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['vendor-documents'],
    queryFn: async () => {
      const res = await apiCall('/vendors/profile');
      if (!res.success) throw new Error(res.message || 'Failed to load documents');
      // documents are nested in vendor profile
      const raw: any[] = res.data?.documents ?? [];
      return raw.map((d: any): DocumentItem => ({
        id: d.id,
        type: d.documentType || d.type || 'Document',
        name: d.documentUrl ? d.documentUrl.split('/').pop() || d.documentUrl : (d.name || 'file'),
        status: (d.status as DocumentItem['status']) || 'PENDING',
        updatedAt: d.updatedAt || d.createdAt || '',
        url: d.documentUrl || d.url,
      }));
    },
  });

  const docs: DocumentItem[] = data ?? [];

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

  const hasRejected = docs.some((d) => d.status === 'REJECTED');

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

        {/* Warning Banner — only shown when there are rejected docs */}
        {hasRejected && (
          <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl flex items-start gap-3">
            <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={16} />
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-amber-900">Action Required</h4>
              <p className="text-[10px] text-amber-700 leading-relaxed max-w-2xl">
                One or more documents were rejected. Please re-upload a clear, valid PDF to prevent service suspensions.
              </p>
            </div>
          </div>
        )}

        {/* Document Checklist cards */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground text-sm">
            <Loader2 size={16} className="animate-spin" /> Loading documents...
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-20 text-sm text-red-500">
            Failed to load documents. Check your connection.
          </div>
        ) : docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground text-sm">
            <FileText size={32} className="text-muted-foreground/40" />
            <p>No documents uploaded yet.</p>
            <Button size="sm" onClick={handleUploadClick} className="gap-1.5 rounded-xl">
              <Upload size={14} /> Upload First Document
            </Button>
          </div>
        ) : (
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
                  <span className="text-[10px] text-muted-foreground">
                    {doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown date'}
                  </span>
                  <div className="flex gap-1">
                    {doc.url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
                        onClick={() => window.open(doc.url, '_blank')}
                        title="View document"
                      >
                        <Eye size={14} />
                      </Button>
                    )}
                    {doc.url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
                        onClick={() => { const a = document.createElement('a'); a.href = doc.url!; a.download = doc.name; a.click(); }}
                        title="Download document"
                      >
                        <Download size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
