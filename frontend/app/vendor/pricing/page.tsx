'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Sparkles, Save, Edit3, DollarSign, Power, Plus, Trash2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { containerVariants, cardVariants } from '@/lib/animations';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface PricingItem {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  myPrice: number;
  isActive: boolean;
}

const INITIAL_PRICING: PricingItem[] = [
  { id: '1', name: 'Deep Home Cleaning', category: 'Cleaning', basePrice: 1499, myPrice: 1399, isActive: true },
  { id: '2', name: 'Kitchen Sanitization', category: 'Cleaning', basePrice: 999, myPrice: 950, isActive: true },
  { id: '3', name: 'Sofa Cleaning (3-Seater)', category: 'Cleaning', basePrice: 799, myPrice: 750, isActive: true },
  { id: '4', name: 'Bathroom Deep Cleaning', category: 'Cleaning', basePrice: 499, myPrice: 450, isActive: false },
];

export default function VendorPricingPage() {
  const [pricing, setPricing] = useState<PricingItem[]>(INITIAL_PRICING);
  const [editId, setEditId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');

  const handleToggleActive = (id: string) => {
    setPricing((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p))
    );
    toast.success('Service status updated.');
  };

  const handleStartEdit = (item: PricingItem) => {
    setEditId(item.id);
    setTempPrice(item.myPrice.toString());
  };

  const handleSaveEdit = (id: string) => {
    const updatedVal = parseInt(tempPrice);
    if (isNaN(updatedVal) || updatedVal <= 0) {
      toast.error('Invalid price amount entered.');
      return;
    }
    setPricing((prev) =>
      prev.map((p) => (p.id === id ? { ...p, myPrice: updatedVal } : p))
    );
    setEditId(null);
    toast.success('Pricing changes saved successfully.');
  };

  return (
    <DashboardLayout
      role="vendor"
      breadcrumbs={[{ label: 'B2B Portal' }, { label: 'Service Pricing plans' }]}
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
            <h2 className="text-2xl font-bold text-foreground">Service Pricing</h2>
            <p className="text-sm text-muted-foreground">
              Define pricing policies, configure agent rate overrides, and activate services.
            </p>
          </div>
          <Button size="sm" className="gap-1 rounded-xl font-semibold shadow-sm">
            <Plus size={14} /> Add Service
          </Button>
        </div>

        {/* Pricing List */}
        <div className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-muted/20 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="p-4">Service Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Base Platform Price</th>
                  <th className="p-4">Your Custom Rate</th>
                  <th className="p-4">Visibility</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs">
                {pricing.map((item) => (
                  <tr key={item.id} className="hover:bg-accent/20 transition-colors">
                    <td className="p-4 font-bold text-foreground">{item.name}</td>
                    <td className="p-4 text-muted-foreground">{item.category}</td>
                    <td className="p-4 text-muted-foreground font-semibold">
                      {formatCurrency(item.basePrice)}
                    </td>
                    <td className="p-4">
                      {editId === item.id ? (
                        <div className="flex items-center gap-1.5 w-24">
                          <span className="text-muted-foreground font-semibold">₹</span>
                          <input
                            type="number"
                            value={tempPrice}
                            onChange={(e) => setTempPrice(e.target.value)}
                            className="w-full bg-background border border-border rounded-lg px-2 py-1 outline-none font-semibold text-foreground focus:border-primary"
                          />
                        </div>
                      ) : (
                        <span className="font-extrabold text-foreground">
                          {formatCurrency(item.myPrice)}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleActive(item.id)}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ${
                          item.isActive ? 'bg-primary' : 'bg-muted border border-border/60'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                            item.isActive ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      {editId === item.id ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleSaveEdit(item.id)}
                          className="w-8 h-8 rounded-lg text-primary hover:bg-primary/5"
                        >
                          <Save size={14} />
                        </Button>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleStartEdit(item)}
                          className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
                        >
                          <Edit3 size={14} />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
