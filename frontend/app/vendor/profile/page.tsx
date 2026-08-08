'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  Building,
  Save,
  ShieldCheck,
  FileText,
  Upload,
  User,
  Phone,
  Mail,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { containerVariants, cardVariants } from '@/lib/animations';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiCall } from '@/lib/api';
import { PageSkeleton } from '@/components/shared/Skeletons';

export default function VendorProfilePage() {
  const queryClient = useQueryClient();
  const [businessName, setBusinessName] = useState('');
  const [ownerFirstName, setOwnerFirstName] = useState('');
  const [ownerLastName, setOwnerLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-profile'],
    queryFn: () => apiCall('/vendors/profile'),
  });

  useEffect(() => {
    if (data?.data) {
      const p = data.data;
      setBusinessName(p.businessName || '');
      setGstNumber(p.gstNumber || '');
      setBusinessDescription(p.businessDescription || '');
      setPhone(p.user?.phone || '');
      setEmail(p.user?.email || '');
      const ownerParts = (p.ownerName || '').split(' ');
      setOwnerFirstName(ownerParts[0] || '');
      setOwnerLastName(ownerParts.slice(1).join(' ') || '');
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (payload: any) =>
      apiCall('/vendors/profile', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      toast.success('Business profile updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['vendor-profile'] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update profile'),
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      businessName,
      businessDescription,
      gstNumber,
      ownerFirstName,
      ownerLastName,
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout role="vendor" breadcrumbs={[{ label: 'Vendor Portal' }, { label: 'Business Profile' }]}>
        <PageSkeleton />
      </DashboardLayout>
    );
  }

  const profile = data?.data || {};

  return (
    <DashboardLayout
      role="vendor"
      breadcrumbs={[{ label: 'Vendor Portal' }, { label: 'Business Profile' }]}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              Business Profile
              {profile.status === 'APPROVED' && (
                <span className="text-xs bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shrink-0">
                  <ShieldCheck size={11} /> Verified Partner
                </span>
              )}
              {profile.status === 'PENDING' && (
                <span className="text-xs bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-full font-bold shrink-0">
                  Pending Approval
                </span>
              )}
            </h2>
            <p className="text-sm text-muted-foreground">
              Manage business details, legal documents, and service areas.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              variants={cardVariants}
              className="bg-card border border-border/50 rounded-2xl p-6 space-y-4"
            >
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Building size={14} className="text-muted-foreground" /> Business Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Business Name</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Registered GSTIN</label>
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">First Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <input
                      type="text"
                      value={ownerFirstName}
                      onChange={(e) => setOwnerFirstName(e.target.value)}
                      className="w-full h-9 pl-9 pr-4 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Last Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <input
                      type="text"
                      value={ownerLastName}
                      onChange={(e) => setOwnerLastName(e.target.value)}
                      className="w-full h-9 pl-9 pr-4 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Mobile (read-only)</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <input
                      type="tel"
                      value={phone}
                      readOnly
                      className="w-full h-9 pl-9 pr-4 rounded-xl border border-border bg-muted text-xs text-muted-foreground cursor-not-allowed"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Email (read-only)</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <input
                      type="email"
                      value={email}
                      readOnly
                      className="w-full h-9 pl-9 pr-4 rounded-xl border border-border bg-muted text-xs text-muted-foreground cursor-not-allowed"
                    />
                  </div>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground">Business Description</label>
                  <textarea
                    value={businessDescription}
                    onChange={(e) => setBusinessDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none"
                  />
                </div>
              </div>
            </motion.div>

            {/* Platform Stats */}
            <motion.div
              variants={cardVariants}
              className="bg-card border border-border/50 rounded-2xl p-6 space-y-4"
            >
              <h3 className="text-sm font-bold text-foreground">Platform Statistics</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-muted/20 rounded-xl">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Rating</p>
                  <p className="text-lg font-extrabold text-foreground">{profile.rating?.toFixed(1) || '0.0'}</p>
                </div>
                <div className="p-3 bg-muted/20 rounded-xl">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Jobs</p>
                  <p className="text-lg font-extrabold text-foreground">{profile.totalJobs || 0}</p>
                </div>
                <div className="p-3 bg-muted/20 rounded-xl">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Status</p>
                  <p className="text-sm font-extrabold text-foreground">{profile.status || 'N/A'}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <motion.div
              variants={cardVariants}
              className="bg-card border border-border/50 rounded-2xl p-5 space-y-4"
            >
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <FileText size={14} className="text-muted-foreground" /> Legal Documents
              </h3>
              <p className="text-xs text-muted-foreground">
                Compliance documents for onboarding verification.
              </p>

              {profile.documents && profile.documents.length > 0 ? (
                <div className="space-y-3">
                  {profile.documents.map((doc: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 border border-border/60 rounded-xl flex items-center justify-between text-xs bg-background"
                    >
                      <div>
                        <p className="font-semibold text-foreground">{doc.name || doc.type}</p>
                        <p className="text-[10px] text-muted-foreground">{doc.type}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        doc.status === 'APPROVED'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No documents uploaded yet.</p>
              )}

              <div className="border border-dashed border-border rounded-xl p-4 text-center space-y-2 hover:bg-accent/40 cursor-pointer transition-colors">
                <Upload size={16} className="mx-auto text-muted-foreground" />
                <p className="text-xs font-semibold text-foreground">Upload Documents</p>
                <p className="text-[10px] text-muted-foreground">PDF or PNG up to 5MB</p>
              </div>
            </motion.div>

            <Button
              type="submit"
              className="w-full gap-1.5 rounded-xl shadow-sm"
              disabled={updateMutation.isPending}
            >
              <Save size={13} /> {updateMutation.isPending ? 'Saving…' : 'Save Business Profile'}
            </Button>
          </div>
        </form>
      </motion.div>
    </DashboardLayout>
  );
}
