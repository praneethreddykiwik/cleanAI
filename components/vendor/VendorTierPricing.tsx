'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Users } from 'lucide-react';
import { apiCall } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Tier {
  id?: string;
  level: number;
  label: string;
  price: number;
}

interface VendorServiceTiers {
  id: string;
  serviceId: string;
  price: number;
  service: { id: string; name: string; category: string; icon: string; basePrice: number };
  pricingTiers: Tier[];
}

const LEVELS = [1, 2, 3, 4, 5];

/**
 * Lets a vendor set their own price for each of the five AI dirtiness levels.
 * These rates take precedence over the platform defaults when this vendor is
 * matched to a job, so the quote a customer sees is the vendor's own.
 */
export function VendorTierPricing() {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<VendorServiceTiers[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['vendor-pricing-tiers'],
    queryFn: () => apiCall('/vendors/pricing-tiers'),
  });

  const { data: capacity } = useQuery({
    queryKey: ['vendor-capacity'],
    queryFn: () => apiCall('/vendors/capacity'),
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (data?.data) setRows(data.data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: ({ serviceId, tiers }: { serviceId: string; tiers: Tier[] }) =>
      apiCall(`/vendors/pricing-tiers/${serviceId}`, {
        method: 'PUT',
        body: JSON.stringify({
          tiers: tiers.map((t) => ({ level: t.level, price: t.price, label: t.label })),
        }),
      }),
    onSuccess: () => {
      toast.success('Tier pricing saved');
      queryClient.invalidateQueries({ queryKey: ['vendor-pricing-tiers'] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to save tier pricing'),
    onSettled: () => setSavingId(null),
  });

  const setPrice = (serviceId: string, level: number, value: string) => {
    const parsed = value === '' ? 0 : Number(value);
    if (Number.isNaN(parsed) || parsed < 0) return;
    setRows((prev) =>
      prev.map((r) =>
        r.serviceId !== serviceId
          ? r
          : {
              ...r,
              pricingTiers: LEVELS.map((lvl) => {
                const existing = r.pricingTiers.find((t) => t.level === lvl) ?? {
                  level: lvl,
                  label: `Level ${lvl}`,
                  price: 0,
                };
                return lvl === level ? { ...existing, price: parsed } : existing;
              }),
            }
      )
    );
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground py-6">Loading tier pricing…</div>;
  }

  if (error) {
    return (
      <div className="text-sm text-destructive py-6">
        {(error as Error).message || 'Could not load tier pricing'}
      </div>
    );
  }

  const cap = capacity?.data;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-foreground">Dirtiness-Based Pricing</h3>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Our AI rates each customer photo from 1 to 5 stars for how dirty the job is.
            Set what you charge at each level — your rates override the platform
            defaults. Travel distance and GST are added on top automatically.
          </p>
        </div>

        {cap && (
          <div
            className={`rounded-xl border px-4 py-3 text-xs ${
              cap.acceptingJobs
                ? 'border-emerald-500/30 bg-emerald-500/10'
                : 'border-amber-500/30 bg-amber-500/10'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <Users size={14} />
              {cap.acceptingJobs ? 'Accepting jobs' : 'Not receiving jobs'}
            </div>
            <div className="mt-1 text-muted-foreground">
              <span className="text-emerald-500 font-medium">{cap.AVAILABLE} free</span>
              {' · '}
              <span className="text-amber-500 font-medium">{cap.BUSY} busy</span>
              {' · '}
              {cap.OFFLINE} offline
            </div>
            {!cap.acceptingJobs && (
              <p className="mt-1 max-w-[15rem] text-muted-foreground">
                Bookings only route to vendors with a free agent.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xl" aria-hidden>{row.service.icon}</span>
                <div>
                  <p className="font-semibold text-sm text-foreground">{row.service.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {row.service.category} · your flat rate {row.price}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                disabled={savingId === row.serviceId}
                onClick={() => {
                  setSavingId(row.serviceId);
                  saveMutation.mutate({ serviceId: row.serviceId, tiers: row.pricingTiers });
                }}
              >
                <Save size={13} />
                {savingId === row.serviceId ? 'Saving…' : 'Save'}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {LEVELS.map((level) => {
                const tier =
                  row.pricingTiers.find((t) => t.level === level) ??
                  ({ level, label: `Level ${level}`, price: 0 } as Tier);
                return (
                  <div key={level} className="rounded-lg border border-border/60 p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-foreground">{tier.label}</span>
                      <span className="text-[11px] text-amber-500" aria-label={`${level} stars`}>
                        {'★'.repeat(level)}
                        <span className="text-muted-foreground/40">{'☆'.repeat(5 - level)}</span>
                      </span>
                    </div>
                    <label className="flex items-center gap-1 rounded-md border border-input px-2 py-1">
                      <span className="text-xs text-muted-foreground">₹</span>
                      <input
                        type="number"
                        min={0}
                        step={10}
                        value={tier.price}
                        onChange={(e) => setPrice(row.serviceId, level, e.target.value)}
                        className="w-full bg-transparent text-sm outline-none text-foreground"
                        aria-label={`${row.service.name} level ${level} price`}
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VendorTierPricing;
