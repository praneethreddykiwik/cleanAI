'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Compass, CheckCircle2, AlertCircle, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { apiCall } from '@/lib/api';
import { toast } from 'sonner';

interface LocationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationResolved: (location: {
    latitude: number;
    longitude: number;
    city: string;
    state: string;
    line1: string;
    pincode: string;
  }) => void;
}

export function LocationPermissionModal({
  isOpen,
  onClose,
  onLocationResolved,
}: LocationPermissionModalProps) {
  const [mode, setMode] = useState<'prompt' | 'manual'>('prompt');
  const [isLocating, setIsLocating] = useState(false);

  // Manual form inputs
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  const [pincode, setPincode] = useState('560001');

  const requestBrowserLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      setMode('manual');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        try {
          // Reverse geocode via OpenStreetMap Nominatim or backend endpoint
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const data = await res.json();

          const resolvedCity =
            data?.address?.city ||
            data?.address?.town ||
            data?.address?.suburb ||
            'Bengaluru';
          const resolvedState = data?.address?.state || 'Karnataka';
          const resolvedPincode = data?.address?.postcode || '560001';
          const resolvedLine1 =
            data?.display_name?.split(',')?.slice(0, 2)?.join(',') ||
            'Current Geolocation Pin';

          // Save address to backend customer profile
          await apiCall('/users/me/addresses', {
            method: 'POST',
            body: JSON.stringify({
              label: 'Current Location (GPS)',
              line1: resolvedLine1,
              city: resolvedCity,
              state: resolvedState,
              pincode: resolvedPincode,
              latitude: lat,
              longitude: lng,
              isDefault: true,
            }),
          }).catch(() => {
            // Non-blocking save fallback
          });

          // Save to localStorage for quick persistence
          localStorage.setItem(
            'criska_saved_location',
            JSON.stringify({
              latitude: lat,
              longitude: lng,
              city: resolvedCity,
              state: resolvedState,
              line1: resolvedLine1,
              pincode: resolvedPincode,
            })
          );

          onLocationResolved({
            latitude: lat,
            longitude: lng,
            city: resolvedCity,
            state: resolvedState,
            line1: resolvedLine1,
            pincode: resolvedPincode,
          });

          toast.success(`Location set to ${resolvedCity} (${resolvedPincode})`);
          setIsLocating(false);
          onClose();
        } catch (err) {
          // Fallback location resolution
          onLocationResolved({
            latitude: lat,
            longitude: lng,
            city: 'Bengaluru',
            state: 'Karnataka',
            line1: 'GPS Location Pin',
            pincode: '560001',
          });
          setIsLocating(false);
          onClose();
        }
      },
      (error) => {
        setIsLocating(false);
        console.warn('Geolocation permission denied or timed out:', error);
        toast.info('Location access denied. Please enter your address manually.');
        setMode('manual');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!line1 || !pincode) {
      toast.error('Please fill in street address and pincode.');
      return;
    }

    // Default center coordinates for manual address fallback (e.g. Bengaluru)
    const lat = 12.9716;
    const lng = 77.5946;

    try {
      await apiCall('/users/me/addresses', {
        method: 'POST',
        body: JSON.stringify({
          label: 'Home',
          line1,
          city,
          state,
          pincode,
          latitude: lat,
          longitude: lng,
          isDefault: true,
        }),
      });

      localStorage.setItem(
        'criska_saved_location',
        JSON.stringify({
          latitude: lat,
          longitude: lng,
          city,
          state,
          line1,
          pincode,
        })
      );

      onLocationResolved({
        latitude: lat,
        longitude: lng,
        city,
        state,
        line1,
        pincode,
      });

      toast.success(`Address saved: ${city}`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save address.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl text-white overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {mode === 'prompt' ? (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Navigation className="w-8 h-8 animate-pulse" />
            </div>

            <h3 className="text-xl font-bold">Enable Location Access</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Criska AI needs your location to match nearby verified technicians, calculate road distance ETA, and check free delivery thresholds (0–5 km).
            </p>

            <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-3 text-xs text-zinc-300 text-left space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero travel charge within 5 km radius</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Real-time technician ETA calculation</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Instant dispatch of nearest top-rated vendors</span>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <Button
                onClick={requestBrowserLocation}
                disabled={isLocating}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium py-3 rounded-xl shadow-lg shadow-emerald-500/20"
              >
                {isLocating ? (
                  <span className="flex items-center justify-center gap-2">
                    <Compass className="w-4 h-4 animate-spin" /> Detecting Location...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Navigation className="w-4 h-4" /> Allow Location Permission
                  </span>
                )}
              </Button>

              <button
                onClick={() => setMode('manual')}
                className="w-full text-xs text-zinc-400 hover:text-zinc-200 py-2 transition"
              >
                Enter address manually instead
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold">Manual Address Entry</h3>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Street Address / House No.</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. #42, 5th Cross, Indiranagar"
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Pincode</label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMode('prompt')}
                className="w-1/2 border-zinc-700 text-zinc-300"
              >
                Back
              </Button>
              <Button
                type="submit"
                className="w-1/2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium"
              >
                Save & Continue
              </Button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
