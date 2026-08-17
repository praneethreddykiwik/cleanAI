'use client';

import { useEffect, useState } from 'react';
import { apiCall } from '@/lib/api';
import { toast } from 'sonner';

interface PricingTier {
  id?: string;
  level: number;
  label: string;
  price: number;
}

interface ServiceWithTiers {
  id: string;
  name: string;
  category: string;
  icon: string;
  basePrice: number;
  pricingTiers: PricingTier[];
}

const LEVELS = [1, 2, 3, 4, 5];

export default function AdminPricingPage() {
  const [services, setServices] = useState<ServiceWithTiers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiCall('/admin/pricing-tiers');
        setServices(res.data || []);
      } catch (err) {
        const message = (err as Error).message || 'Could not load pricing tiers';
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const setPrice = (serviceId: string, level: number, value: string) => {
    // Keep the raw string out of state — an empty box becomes 0, not NaN,
    // which would otherwise be rejected by the API on save.
    const parsed = value === '' ? 0 : Number(value);
    if (Number.isNaN(parsed) || parsed < 0) return;

    setServices((prev) =>
      prev.map((s) =>
        s.id !== serviceId
          ? s
          : {
              ...s,
              pricingTiers: s.pricingTiers.map((t) =>
                t.level === level ? { ...t, price: parsed } : t
              ),
            }
      )
    );
  };

  const save = async (service: ServiceWithTiers) => {
    setSavingId(service.id);
    try {
      await apiCall(`/admin/pricing-tiers/${service.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          tiers: service.pricingTiers.map((t) => ({
            level: t.level,
            price: t.price,
            label: t.label,
          })),
        }),
      });
      toast.success(`${service.name} pricing saved`);
    } catch (err) {
      toast.error((err as Error).message || 'Failed to save pricing');
    } finally {
      setSavingId(null);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-muted-foreground">Loading pricing tiers…</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-destructive font-medium">{error}</p>
        <p className="text-muted-foreground text-sm mt-2">
          Pricing tiers require an admin account.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Dirtiness Pricing</h1>
        <p className="text-muted-foreground text-sm max-w-3xl">
          The AI rates every uploaded photo from 1 to 5 stars for how dirty the job
          is. That rating picks the price below for the matching service. Distance
          charges and GST are added on top of these amounts at checkout.
        </p>
      </header>

      <div className="space-y-6">
        {services.map((service) => (
          <section
            key={service.id}
            className="rounded-xl border border-border bg-card p-5 space-y-4"
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="text-2xl" aria-hidden>{service.icon}</span>
                <div>
                  <h2 className="font-medium">{service.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {service.category} · base ₹{service.basePrice}
                  </p>
                </div>
              </div>
              <button
                onClick={() => save(service)}
                disabled={savingId === service.id}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {savingId === service.id ? 'Saving…' : 'Save'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {LEVELS.map((level) => {
                const tier =
                  service.pricingTiers.find((t) => t.level === level) ??
                  ({ level, label: `Level ${level}`, price: 0 } as PricingTier);

                return (
                  <div key={level} className="rounded-lg border border-border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{tier.label}</span>
                      <span className="text-xs text-amber-500" aria-label={`${level} stars`}>
                        {'★'.repeat(level)}
                        <span className="text-muted-foreground">{'☆'.repeat(5 - level)}</span>
                      </span>
                    </div>
                    <label className="flex items-center gap-1 rounded-md border border-input px-2 py-1.5">
                      <span className="text-muted-foreground text-sm">₹</span>
                      <input
                        type="number"
                        min={0}
                        step={10}
                        value={tier.price}
                        onChange={(e) => setPrice(service.id, level, e.target.value)}
                        className="w-full bg-transparent text-sm outline-none"
                        aria-label={`${service.name} level ${level} price`}
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
