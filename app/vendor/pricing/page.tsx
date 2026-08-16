'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Save, Edit3, Plus } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { containerVariants, cardVariants } from '@/lib/animations';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiCall } from '@/lib/api';
import { PageSkeleton } from '@/components/shared/Skeletons';

export default function VendorPricingPage() {
  const queryClient = useQueryClient();
  const [editId, setEditId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');
  const [localPricing, setLocalPricing] = useState<any[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-pricing'],
    queryFn: () => apiCall('/vendors/pricing'),
  });

  useEffect(() => {
    if (data?.data) setLocalPricing(data.data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (payload: any[]) =>
      apiCall('/vendors/pricing', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      toast.success('Pricing saved successfully.');
      queryClient.invalidateQueries({ queryKey: ['vendor-pricing'] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to save pricing'),
  });

  const handleToggleActive = (id: string) => {
    setLocalPricing((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p))
    );
  };

  const handleStartEdit = (item: any) => {
    setEditId(item.id);
    setTempPrice(item.price.toString());
  };

  const handleSaveEdit = (item: any) => {
    const updatedVal = parseFloat(tempPrice);
    if (isNaN(updatedVal) || updatedVal <= 0) {
      toast.error('Invalid price amount.');
      return;
    }
    setLocalPricing((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, price: updatedVal } : p))
    );
    setEditId(null);
  };

  const handleSaveAll = () => {
    const payload = localPricing.map((p) => ({
      serviceId: p.serviceId,
      price: p.price,
      isActive: p.isActive,
    }));
    saveMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <DashboardLayout role="vendor" breadcrumbs={[{ label: 'B2B Portal' }, { label: 'Service Pricing' }]}>
        <PageSkeleton />
      </DashboardLayout>
    );
  }

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
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Service Pricing</h2>
            <p className="text-sm text-muted-foreground">
              Configure your custom rates for each service. Changes are saved to the database.
            </p>
          </div>
          <Button
            size="sm"
            className="gap-1 rounded-xl font-semibold shadow-sm"
            onClick={handleSaveAll}
            disabled={saveMutation.isPending}
          >
            <Save size={14} /> Save All
          </Button>
        </div>

        {localPricing.length === 0 ? (
          <div className="text-center py-16 text-sm text-muted-foreground font-semibold">
            No services configured yet. Add services to your catalog first.
          </div>
        ) : (
          <div className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/20 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="p-4">Service Name</th>
                    <th className="p-4">Platform Base Price</th>
                    <th className="p-4">Your Custom Rate</th>
                    <th className="p-4">Active</th>
                    <th className="p-4 text-right">Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-xs">
                  {localPricing.map((item) => (
                    <tr key={item.id} className="hover:bg-accent/20 transition-colors">
                      <td className="p-4 font-bold text-foreground">{item.serviceName}</td>
                      <td className="p-4 text-muted-foreground font-semibold">
                        {formatCurrency(item.minPrice || item.service?.basePrice || 0)}
                      </td>
                      <td className="p-4">
                        {editId === item.id ? (
                          <div className="flex items-center gap-1.5 w-28">
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
                            {formatCurrency(item.price)}
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
                            onClick={() => handleSaveEdit(item)}
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
        )}
      </motion.div>
    </DashboardLayout>
  );
}
