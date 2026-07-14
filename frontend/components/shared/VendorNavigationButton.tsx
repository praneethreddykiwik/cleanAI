'use client';

import React from 'react';
import { Compass, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VendorNavigationButtonProps {
  latitude?: number | null;
  longitude?: number | null;
  className?: string;
}

export function VendorNavigationButton({
  latitude,
  longitude,
  className,
}: VendorNavigationButtonProps) {
  const handleNavigate = () => {
    if (!latitude || !longitude) return;

    // By not specifying the 'origin' parameter, Google Maps automatically
    // resolves and uses the user's current GPS location as the starting point.
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const isDisabled = !latitude || !longitude;

  return (
    <Button
      type="button"
      variant="default"
      size="sm"
      disabled={isDisabled}
      onClick={handleNavigate}
      className="w-full gap-2 rounded-xl text-xs font-semibold shadow-xs"
    >
      <Compass size={14} className="animate-spin-slow" />
      <span>Navigate</span>
      <ExternalLink size={12} className="opacity-60 ml-0.5" />
    </Button>
  );
}
