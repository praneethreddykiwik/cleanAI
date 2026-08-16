'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Shield,
  Key,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Save,
  Lock,
  Globe,
  Loader2,
  Download,
  X,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { containerVariants, cardVariants } from '@/lib/animations';
import { apiCall } from '@/lib/api';
import { APP_CONFIG } from '@/lib/config';
import { toast } from 'sonner';

export default function CustomerSettingsPage() {
  const queryClient = useQueryClient();

  // Notification Preferences State
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [whatsappUpdates, setWhatsappUpdates] = useState(true);
  const [promoEmails, setPromoEmails] = useState(false);

  // AI & Privacy State
  const [aiHistoryConsent, setAiHistoryConsent] = useState(true);
  const [smartRecommendations, setSmartRecommendations] = useState(true);

  // Security State
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [currency, setCurrency] = useState('INR');

  // Password Change Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Fetch initial preferences from Backend DB
  const { data: prefData, isLoading } = useQuery({
    queryKey: ['customer-preferences'],
    queryFn: async () => {
      const res = await apiCall('/users/me/preferences');
      if (!res.success) throw new Error(res.message || 'Failed to load preferences');
      return res.data;
    },
  });

  // Populate state when backend data arrives
  useEffect(() => {
    if (prefData) {
      if (prefData.emailAlerts !== undefined) setEmailAlerts(prefData.emailAlerts);
      if (prefData.whatsappUpdates !== undefined) setWhatsappUpdates(prefData.whatsappUpdates);
      if (prefData.promoEmails !== undefined) setPromoEmails(prefData.promoEmails);
      if (prefData.aiHistoryConsent !== undefined) setAiHistoryConsent(prefData.aiHistoryConsent);
      if (prefData.smartRecommendations !== undefined) setSmartRecommendations(prefData.smartRecommendations);
      if (prefData.twoFactorAuth !== undefined) setTwoFactorAuth(prefData.twoFactorAuth);
      if (prefData.currency !== undefined) setCurrency(prefData.currency);
    }
  }, [prefData]);

  // Save Preferences Mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiCall('/users/me/preferences', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      if (!res.success) throw new Error(res.message || 'Failed to save configuration');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-preferences'] });
      toast.success('Configuration and preferences saved successfully to database!');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to save configuration.'),
  });

  // Password Change Mutation
  const passwordMutation = useMutation({
    mutationFn: async (payload: { currentPassword: string; newPassword: string }) => {
      const res = await apiCall('/users/me/change-password', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.success) throw new Error(res.message || 'Failed to change password');
      return res.data;
    },
    onSuccess: () => {
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated successfully!');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update password.'),
  });

  const handleSave = () => {
    saveMutation.mutate({
      emailAlerts,
      whatsappUpdates,
      promoEmails,
      aiHistoryConsent,
      smartRecommendations,
      twoFactorAuth,
      currency,
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }
    passwordMutation.mutate({ currentPassword, newPassword });
  };

  const handleExportData = () => {
    let token = '';
    if (typeof window !== 'undefined') {
      const tokensStr = localStorage.getItem('cleanai_tokens');
      if (tokensStr) {
        try {
          token = JSON.parse(tokensStr).accessToken;
        } catch (e) {}
      }
    }
    
    // Trigger download via authenticated URL or blob
    fetch(`${APP_CONFIG.apiUrl}/users/me/export-data`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cleanai_customer_data_export.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success('Customer archive downloaded successfully.');
      })
      .catch(() => toast.error('Failed to export customer data archive.'));
  };

  return (
    <DashboardLayout
      role="customer"
      breadcrumbs={[{ label: 'Customer Portal' }, { label: 'Settings' }]}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto space-y-6 pb-12"
      >
        <div>
          <h2 className="text-2xl font-bold text-foreground">Account & App Settings</h2>
          <p className="text-sm text-muted-foreground">
            Manage your notifications, AI Supervisor preferences, security settings, and app options.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground text-sm">
            <Loader2 size={16} className="animate-spin" /> Loading your settings...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* AI Supervisor & Personalization */}
              <motion.div
                variants={cardVariants}
                className="bg-card border border-border/50 rounded-2xl p-6 space-y-4 shadow-sm"
              >
                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles size={16} className="text-primary" /> AI Supervisor & Personalization
                </h3>

                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-foreground">Save Uploaded Photos for AI Training</p>
                      <p className="text-[10px] text-muted-foreground max-w-sm">
                        Allow Criska AI to retain service area photos to improve visual defect detection accuracy.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAiHistoryConsent(!aiHistoryConsent)}
                      className="text-primary focus:outline-none"
                    >
                      {aiHistoryConsent ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-muted-foreground" />}
                    </button>
                  </div>

                  <div className="flex items-start justify-between gap-4 border-t border-border/40 pt-4">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-foreground">Smart Maintenance Recommendations</p>
                      <p className="text-[10px] text-muted-foreground max-w-sm">
                        Get predictive suggestions on when your HVAC, kitchen, or deep cleaning is due.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSmartRecommendations(!smartRecommendations)}
                      className="text-primary focus:outline-none"
                    >
                      {smartRecommendations ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-muted-foreground" />}
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Notification Preferences */}
              <motion.div
                variants={cardVariants}
                className="bg-card border border-border/50 rounded-2xl p-6 space-y-4 shadow-sm"
              >
                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Bell size={16} className="text-primary" /> Notification Preferences
                </h3>

                <div className="space-y-3">
                  <label className="flex items-center gap-2.5 text-xs text-muted-foreground font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={whatsappUpdates}
                      onChange={() => setWhatsappUpdates(!whatsappUpdates)}
                      className="w-4 h-4 accent-primary rounded"
                    />
                    WhatsApp & SMS real-time technician tracking updates
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-muted-foreground font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailAlerts}
                      onChange={() => setEmailAlerts(!emailAlerts)}
                      className="w-4 h-4 accent-primary rounded"
                    />
                    Email booking confirmations & GST invoices
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-muted-foreground font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={promoEmails}
                      onChange={() => setPromoEmails(!promoEmails)}
                      className="w-4 h-4 accent-primary rounded"
                    />
                    Special offers, seasonal discounts & feature updates
                  </label>
                </div>
              </motion.div>

              {/* Security & Access */}
              <motion.div
                variants={cardVariants}
                className="bg-card border border-border/50 rounded-2xl p-6 space-y-4 shadow-sm"
              >
                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Shield size={16} className="text-primary" /> Security & Privacy
                </h3>

                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-foreground">Two-Factor Authentication (2FA)</p>
                      <p className="text-[10px] text-muted-foreground max-w-sm">
                        Require an SMS OTP every time you log in to your CleanAI account.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTwoFactorAuth(!twoFactorAuth)}
                      className="text-primary focus:outline-none"
                    >
                      {twoFactorAuth ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-muted-foreground" />}
                    </button>
                  </div>

                  <div className="border-t border-border/40 pt-4 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-semibold text-foreground">Change Account Password</p>
                      <p className="text-[10px] text-muted-foreground">Update password securely in database</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPasswordModal(true)}
                      className="gap-1 rounded-xl text-xs"
                    >
                      <Lock size={12} /> Update Password
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Sidebar Column */}
            <div className="space-y-6">
              <motion.div
                variants={cardVariants}
                className="bg-card border border-border/50 rounded-2xl p-5 space-y-4 shadow-sm"
              >
                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Globe size={16} className="text-primary" /> Regional Options
                </h3>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground">Display Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full h-8 px-2 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
                  >
                    <option value="INR">INR (₹) — Indian Rupee</option>
                    <option value="USD">USD ($) — US Dollar</option>
                    <option value="EUR">EUR (€) — Euro</option>
                  </select>
                </div>
              </motion.div>

              <motion.div
                variants={cardVariants}
                className="bg-card border border-border/50 rounded-2xl p-5 space-y-4 shadow-sm"
              >
                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Key size={16} className="text-primary" /> Data & Export
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Download a copy of your booking history, invoices, and service records.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportData}
                  className="w-full gap-1.5 text-xs rounded-xl"
                >
                  <Download size={13} /> Request Data Archive
                </Button>
              </motion.div>

              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="w-full gap-1.5 rounded-xl shadow-md"
              >
                {saveMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <>
                    <Save size={14} /> Save Configuration
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Change Password Modal Overlay */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl relative"
            >
              <button
                onClick={() => setShowPasswordModal(false)}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>

              <div>
                <h3 className="text-base font-bold text-foreground">Change Password</h3>
                <p className="text-xs text-muted-foreground">Enter your current password to set a new one.</p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-8 px-3 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-8 px-3 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-8 px-3 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" type="submit" disabled={passwordMutation.isPending}>
                    {passwordMutation.isPending ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      'Update Password'
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
