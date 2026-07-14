'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  Building,
  Save,
  CheckCircle,
  ShieldCheck,
  FileText,
  Upload,
  User,
  Phone,
  Mail,
  IndianRupee,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { containerVariants, cardVariants } from '@/lib/animations';
import { toast } from 'sonner';

export default function VendorProfilePage() {
  const [businessName, setBusinessName] = useState('CleanPro Solutions');
  const [ownerName, setOwnerName] = useState('Piyush Malhotra');
  const [phone, setPhone] = useState('9988776655');
  const [email, setEmail] = useState('contact@cleanpro.com');
  const [gstNumber, setGstNumber] = useState('29GGGGG1314R9Z8');
  
  // Pricing lists
  const [servicePricing, setServicePricing] = useState([
    { id: '1', name: 'Deep Cleaning', minPrice: 1200, maxPrice: 2000 },
    { id: '2', name: 'Kitchen Cleaning', minPrice: 800, maxPrice: 1200 },
    { id: '3', name: 'AC General Service', minPrice: 400, maxPrice: 600 },
  ]);

  const handlePriceChange = (id: string, field: 'minPrice' | 'maxPrice', value: number) => {
    setServicePricing((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Vendor profile configurations updated.');
  };

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
        {/* Title */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              Business Profile
              <span className="text-xs bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shrink-0">
                <ShieldCheck size={11} /> Verified Partner
              </span>
            </h2>
            <p className="text-sm text-muted-foreground">
              Review verification documents, billing coordinates, and service price ranges.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
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
                    className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Registered GSTIN</label>
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Owner / Director</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full h-9 pl-9 pr-4 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Mobile Contact</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-9 pl-9 pr-4 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
                    />
                  </div>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground">Official Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-9 pl-9 pr-4 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Pricing Details */}
            <motion.div
              variants={cardVariants}
              className="bg-card border border-border/50 rounded-2xl p-6 space-y-4"
            >
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <IndianRupee size={14} className="text-muted-foreground" /> Service Pricing Catalog (₹)
              </h3>
              <p className="text-xs text-muted-foreground">
                Set custom budget guidelines per service category to assist match filters.
              </p>

              <div className="space-y-3">
                {servicePricing.map((serv) => (
                  <div
                    key={serv.id}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3.5 border border-border/60 rounded-xl gap-3 bg-muted/10"
                  >
                    <span className="text-xs font-semibold text-foreground">{serv.name}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={serv.minPrice}
                        onChange={(e) => handlePriceChange(serv.id, 'minPrice', parseInt(e.target.value))}
                        className="w-20 h-8 px-2 rounded-lg border border-border bg-background text-xs text-center"
                      />
                      <span className="text-xs text-muted-foreground">to</span>
                      <input
                        type="number"
                        value={serv.maxPrice}
                        onChange={(e) => handlePriceChange(serv.id, 'maxPrice', parseInt(e.target.value))}
                        className="w-20 h-8 px-2 rounded-lg border border-border bg-background text-xs text-center"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Verification Docs / Status */}
          <div className="space-y-6">
            <motion.div
              variants={cardVariants}
              className="bg-card border border-border/50 rounded-2xl p-5 space-y-4"
            >
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <FileText size={14} className="text-muted-foreground" /> Legal Documents
              </h3>
              <p className="text-xs text-muted-foreground">
                Verification documents submitted for onboarding compliance check.
              </p>

              <div className="space-y-3">
                {[
                  { name: 'Business License (PAN / Tax)', status: 'Approved', size: '2.4 MB' },
                  { name: 'GST Certification Document', status: 'Approved', size: '1.8 MB' },
                  { name: 'Onboarding Agreement Signed', status: 'Approved', size: '920 KB' },
                ].map((doc, idx) => (
                  <div
                    key={idx}
                    className="p-3 border border-border/60 rounded-xl flex items-center justify-between text-xs bg-background"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{doc.name}</p>
                      <p className="text-[10px] text-muted-foreground">{doc.size} · PDF</p>
                    </div>
                    <span className="text-[10px] bg-green-50 text-green-700 font-bold px-1.5 py-0.5 rounded border border-green-200">
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border border-dashed border-border rounded-xl p-4 text-center space-y-2 hover:bg-accent/40 cursor-pointer transition-colors">
                <Upload size={16} className="mx-auto text-muted-foreground" />
                <p className="text-xs font-semibold text-foreground">Upload Updated Files</p>
                <p className="text-[10px] text-muted-foreground">PDF or PNG up to 5MB</p>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <div className="flex gap-3">
              <Button type="submit" className="w-full gap-1.5 rounded-xl shadow-sm">
                <Save size={13} /> Save Business Profile
              </Button>
            </div>
          </div>
        </form>
      </motion.div>
    </DashboardLayout>
  );
}
