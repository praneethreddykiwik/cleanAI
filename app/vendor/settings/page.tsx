'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Shield, Bell, Key, Smartphone, ToggleLeft, ToggleRight, Save } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { containerVariants, cardVariants } from '@/lib/animations';
import { toast } from 'sonner';

export default function VendorSettingsPage() {
  const [acceptJobs, setAcceptJobs] = useState(true);
  const [autoAssign, setAutoAssign] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);

  const handleSave = () => {
    toast.success('System settings saved successfully.');
  };

  return (
    <DashboardLayout
      role="vendor"
      breadcrumbs={[{ label: 'Vendor Portal' }, { label: 'Settings' }]}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto space-y-6"
      >
        <div>
          <h2 className="text-2xl font-bold text-foreground">Control Settings</h2>
          <p className="text-sm text-muted-foreground">
            Configure automated dispatch, notify preferences, and toggle operational mode.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Dispatch Rules */}
            <motion.div
              variants={cardVariants}
              className="bg-card border border-border/50 rounded-2xl p-6 space-y-4"
            >
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Shield size={14} className="text-muted-foreground" /> Dispatch rules
              </h3>

              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-foreground">Accepting New Jobs</p>
                    <p className="text-[10px] text-muted-foreground max-w-sm">
                      Toggle whether your business is active and appearing in matching searches.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAcceptJobs(!acceptJobs)}
                    className="text-primary"
                  >
                    {acceptJobs ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-muted-foreground" />}
                  </button>
                </div>

                <div className="flex items-start justify-between gap-4 border-t border-border/40 pt-4">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-foreground">Auto-assign Available Agents</p>
                    <p className="text-[10px] text-muted-foreground max-w-sm">
                      Automatically direct accepted jobs to closest available agent.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoAssign(!autoAssign)}
                    className="text-primary"
                  >
                    {autoAssign ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-muted-foreground" />}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Notification triggers */}
            <motion.div
              variants={cardVariants}
              className="bg-card border border-border/50 rounded-2xl p-6 space-y-4"
            >
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Bell size={14} className="text-muted-foreground" /> Communications
              </h3>

              <div className="space-y-3">
                <label className="flex items-center gap-2.5 text-xs text-muted-foreground font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={() => setEmailAlerts(!emailAlerts)}
                    className="w-4 h-4 accent-primary rounded"
                  />
                  Receive dispatch updates via email
                </label>
                <label className="flex items-center gap-2.5 text-xs text-muted-foreground font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={whatsappAlerts}
                    onChange={() => setWhatsappAlerts(!whatsappAlerts)}
                    className="w-4 h-4 accent-primary rounded"
                  />
                  Receive critical booking updates via WhatsApp SMS
                </label>
              </div>
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div
              variants={cardVariants}
              className="bg-card border border-border/50 rounded-2xl p-5 space-y-4"
            >
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Key size={14} className="text-muted-foreground" /> Security Audit
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Confirm your account credentials or review active system logging diagnostics.
              </p>
              <Button variant="outline" size="sm" className="w-full text-xs">
                Reset API Access Token
              </Button>
            </motion.div>

            <Button onClick={handleSave} className="w-full gap-1.5 rounded-xl">
              <Save size={13} /> Save Configuration
            </Button>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
