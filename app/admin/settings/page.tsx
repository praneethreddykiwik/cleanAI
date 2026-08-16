'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Shield, Sparkles, Bell, ToggleLeft, ToggleRight, Save, DollarSign } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { containerVariants, cardVariants } from '@/lib/animations';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [vendorAutoApprove, setVendorAutoApprove] = useState(false);
  const [platformFee, setPlatformFee] = useState(49);
  const [aiMatchingEnabled, setAiMatchingEnabled] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Platform global configurations updated.');
  };

  return (
    <DashboardLayout
      role="admin"
      breadcrumbs={[{ label: 'Admin Portal' }, { label: 'Platform Settings' }]}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto space-y-6"
      >
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-foreground">Global Platform Settings</h2>
          <p className="text-sm text-muted-foreground">
            Configure system maintenance, operational platform fees, and onboarding rules.
          </p>
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* System Status Controls */}
            <motion.div
              variants={cardVariants}
              className="bg-card border border-border/50 rounded-2xl p-6 space-y-4"
            >
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Shield size={14} className="text-muted-foreground" /> Operations
              </h3>

              <div className="space-y-4">
                {/* Maintenance Mode */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-foreground">Maintenance Mode</p>
                    <p className="text-[10px] text-muted-foreground max-w-sm">
                      Puts the platform in offline state. Customers will not be able to schedule bookings.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMaintenanceMode(!maintenanceMode)}
                    className="text-primary"
                  >
                    {maintenanceMode ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-muted-foreground" />}
                  </button>
                </div>

                {/* Auto Approve */}
                <div className="flex items-start justify-between gap-4 border-t border-border/40 pt-4">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-foreground">Vendor Auto Approval</p>
                    <p className="text-[10px] text-muted-foreground max-w-sm">
                      Automatically approve and onboard vendors upon valid GST details check.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVendorAutoApprove(!vendorAutoApprove)}
                    className="text-primary"
                  >
                    {vendorAutoApprove ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-muted-foreground" />}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* AI Rules (Placeholder) */}
            <motion.div
              variants={cardVariants}
              className="bg-card border border-border/50 rounded-2xl p-6 space-y-4"
            >
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Sparkles size={14} className="text-primary" /> AI Dispatch Controls (Placeholder)
              </h3>

              <div className="flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-foreground">AI Dispatch & Matching Engine</p>
                  <p className="text-[10px] text-muted-foreground max-w-sm">
                    Allow the AI system to automatically match booking bids to eligible vendor pricing rules.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAiMatchingEnabled(!aiMatchingEnabled)}
                  className="text-primary"
                >
                  {aiMatchingEnabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-muted-foreground" />}
                </button>
              </div>
            </motion.div>
          </div>

          {/* Pricing Config Column */}
          <div className="space-y-6">
            <motion.div
              variants={cardVariants}
              className="bg-card border border-border/50 rounded-2xl p-5 space-y-4"
            >
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <DollarSign size={14} className="text-muted-foreground" /> Platform Fees
              </h3>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground">Fixed Booking Commission (₹)</label>
                <input
                  type="number"
                  value={platformFee}
                  onChange={(e) => setPlatformFee(parseInt(e.target.value))}
                  className="w-full h-8 px-3 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
                />
              </div>
            </motion.div>

            <Button type="submit" className="w-full gap-1.5 rounded-xl">
              <Save size={13} /> Save System Settings
            </Button>
          </div>
        </form>
      </motion.div>
    </DashboardLayout>
  );
}
