'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { FileText, Download, Calendar, Search, Filter } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { containerVariants, cardVariants } from '@/lib/animations';
import { toast } from 'sonner';

interface ReportItem {
  id: string;
  title: string;
  description: string;
  fileSize: string;
  createdAt: string;
  category: 'FINANCIAL' | 'OPERATIONS' | 'AUDIT';
}

const INITIAL_REPORTS: ReportItem[] = [
  { id: '1', title: 'Q2 Financial Summary', description: 'Platform gross merchandise value, commission splits, and net revenues sheets.', fileSize: '2.4 MB', createdAt: '2026-07-10', category: 'FINANCIAL' },
  { id: '2', title: 'Vendor Onboarding logs', description: 'Audits logs of compliance statuses, active vendors counts, and rejection reports.', fileSize: '840 KB', createdAt: '2026-07-09', category: 'AUDIT' },
  { id: '3', title: 'Service Bookings Analytics', description: 'Comprehensive tracking sheets of completed jobs, cancellations, and ratings distributions.', fileSize: '4.8 MB', createdAt: '2026-07-08', category: 'OPERATIONS' },
];

export default function AdminReportsPage() {
  const [reports] = useState<ReportItem[]>(INITIAL_REPORTS);

  const handleDownload = (title: string) => {
    toast.success(`Exporting and downloading: ${title}...`);
  };

  return (
    <DashboardLayout
      role="admin"
      breadcrumbs={[{ label: 'Admin Portal' }, { label: 'Platform Reports' }]}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto space-y-6"
      >
        {/* Title */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Operational Reports</h2>
            <p className="text-sm text-muted-foreground">
              Generate platform performance summaries, download transaction logs, and export system audit sheets.
            </p>
          </div>
          <Button size="sm" className="rounded-xl font-semibold shadow-sm">Export New Report</Button>
        </div>

        {/* Reports Directory */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reports.map((report) => (
            <motion.div
              key={report.id}
              variants={cardVariants}
              className="p-5 bg-card border border-border/50 rounded-2xl shadow-sm flex flex-col justify-between hover:border-border transition-colors h-48"
            >
              <div className="space-y-2">
                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[8px] font-bold tracking-wide uppercase">
                  {report.category}
                </span>
                <h3 className="text-xs font-bold text-foreground truncate">{report.title}</h3>
                <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
                  {report.description}
                </p>
              </div>

              <div className="flex justify-between items-center text-[10px] pt-4 border-t border-border/40">
                <span className="text-muted-foreground font-semibold flex items-center gap-1">
                  <Calendar size={12} /> {report.createdAt} ({report.fileSize})
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDownload(report.title)}
                  className="w-8 h-8 rounded-lg text-primary hover:bg-primary/5"
                >
                  <Download size={14} />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
