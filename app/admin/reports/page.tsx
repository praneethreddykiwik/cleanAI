'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { FileText, Download, Calendar, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { containerVariants, cardVariants } from '@/lib/animations';
import { toast } from 'sonner';
import { apiCall } from '@/lib/api';

interface ReportDef {
  id: string;
  title: string;
  description: string;
  category: 'FINANCIAL' | 'OPERATIONS' | 'AUDIT';
  endpoint: string;
  filename: string;
}

const REPORT_DEFINITIONS: ReportDef[] = [
  {
    id: 'financials',
    title: 'Financial Summary',
    description: 'Platform gross revenue, commission splits, refunds, settlements, and net margins.',
    category: 'FINANCIAL',
    endpoint: '/admin/financials',
    filename: 'cleanai_financial_summary.csv',
  },
  {
    id: 'vendors',
    title: 'Vendor Onboarding Audit',
    description: 'Compliance statuses, approved/pending/rejected vendor counts, and registration logs.',
    category: 'AUDIT',
    endpoint: '/admin/vendors',
    filename: 'cleanai_vendor_audit.csv',
  },
  {
    id: 'stats',
    title: 'Platform Operations Report',
    description: 'Bookings, completions, AI latency, cache performance, active agents and monitoring data.',
    category: 'OPERATIONS',
    endpoint: '/admin/stats',
    filename: 'cleanai_operations_report.csv',
  },
];

function flattenToCSV(obj: any, prefix = ''): string[][] {
  const rows: string[][] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      rows.push(...flattenToCSV(value as any, fullKey));
    } else if (Array.isArray(value)) {
      rows.push([fullKey, `[${value.length} items]`]);
    } else {
      rows.push([fullKey, String(value ?? '')]);
    }
  }
  return rows;
}

function downloadCSV(data: any, filename: string) {
  const rows = flattenToCSV(data);
  const csvContent = ['Field,Value', ...rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminReportsPage() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (report: ReportDef) => {
    setDownloading(report.id);
    try {
      const response = await apiCall(report.endpoint);
      if (!response.success) throw new Error(response.message || 'Failed to fetch data');
      downloadCSV(response.data, report.filename);
      toast.success(`${report.title} exported successfully.`);
    } catch (err: any) {
      toast.error(err.message || `Failed to export ${report.title}`);
    } finally {
      setDownloading(null);
    }
  };

  const today = new Date().toISOString().split('T')[0];

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
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Operational Reports</h2>
            <p className="text-sm text-muted-foreground">
              Generate and download live platform data as CSV exports from the database.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {REPORT_DEFINITIONS.map((report) => (
            <motion.div
              key={report.id}
              variants={cardVariants}
              className="p-5 bg-card border border-border/50 rounded-2xl shadow-sm flex flex-col justify-between hover:border-border transition-colors"
            >
              <div className="space-y-2">
                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[8px] font-bold tracking-wide uppercase">
                  {report.category}
                </span>
                <h3 className="text-xs font-bold text-foreground">{report.title}</h3>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  {report.description}
                </p>
              </div>

              <div className="flex justify-between items-center text-[10px] pt-4 border-t border-border/40 mt-4">
                <span className="text-muted-foreground font-semibold flex items-center gap-1">
                  <Calendar size={12} /> {today} · Live CSV
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDownload(report)}
                  disabled={downloading === report.id}
                  className="w-8 h-8 rounded-lg text-primary hover:bg-primary/5"
                  title={`Download ${report.title}`}
                >
                  {downloading === report.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Download size={14} />
                  )}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="p-4 bg-muted/30 rounded-2xl border border-border/40 text-xs text-muted-foreground">
          <strong className="text-foreground">Note:</strong> All reports are generated live from the Neon PostgreSQL database.
          Data is exported as CSV and reflects the current state of the platform at the time of download.
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
