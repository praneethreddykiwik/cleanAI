'use client';

import React, { useEffect, useRef } from 'react';
import { useMap } from './MapProvider';
import { MapPin, Loader2 } from 'lucide-react';

interface BookingMapPreviewProps {
  latitude?: number | null;
  longitude?: number | null;
  className?: string;
}

export function BookingMapPreview({
  latitude,
  longitude,
  className,
}: BookingMapPreviewProps) {
  const { provider, isLoaded, loadError } = useMap();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Google maps ref
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const googleMarkerRef = useRef<google.maps.Marker | null>(null);

  // Leaflet maps ref
  const leafletMapRef = useRef<any>(null);
  const leafletMarkerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !isLoaded || !mapContainerRef.current || !latitude || !longitude) return;

    const lat = latitude;
    const lng = longitude;

    if (provider === 'leaflet') {
      import('leaflet').then((L) => {
        if (!mapContainerRef.current) return;

        // Cleanup
        if (leafletMapRef.current) {
          leafletMapRef.current.remove();
          leafletMapRef.current = null;
        }

        const map = L.map(mapContainerRef.current, {
          zoomControl: false,
          dragging: false,
          touchZoom: false,
          doubleClickZoom: false,
          scrollWheelZoom: false,
          boxZoom: false,
          keyboard: false,
        }).setView([lat, lng], 14);
        leafletMapRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
        }).addTo(map);

        const DefaultIcon = L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        });

        const marker = L.marker([lat, lng], {
          icon: DefaultIcon,
          interactive: false,
        }).addTo(map);
        leafletMarkerRef.current = marker;
      });
    } else if (provider === 'google' && window.google) {
      const position = { lat, lng };

      googleMapRef.current = new window.google.maps.Map(mapContainerRef.current, {
        center: position,
        zoom: 14,
        disableDefaultUI: true,
        gestureHandling: 'none',
        zoomControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
        ],
      });

      googleMarkerRef.current = new window.google.maps.Marker({
        position,
        map: googleMapRef.current,
        draggable: false,
      });
    }
  }, [isLoaded, latitude, longitude, provider]);

  if (!latitude || !longitude) {
    return (
      <div className="w-full h-full min-h-[140px] rounded-xl bg-muted/40 dark:bg-white/3 flex flex-col items-center justify-center text-center p-4 border border-border/30">
        <MapPin size={16} className="text-muted-foreground/40 mb-1" />
        <span className="text-[10px] font-semibold text-muted-foreground/60">No coordinates recorded</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full h-full min-h-[140px] rounded-xl bg-red-500/5 flex items-center justify-center text-center p-4 border border-red-500/10">
        <span className="text-[10px] font-semibold text-red-500">Maps error</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[140px] rounded-xl overflow-hidden border border-border/30 shadow-3xs">
      {!isLoaded ? (
        <div className="absolute inset-0 bg-muted/30 backdrop-blur-xs flex items-center justify-center text-[10px] text-muted-foreground font-medium">
          <Loader2 size={12} className="animate-spin text-primary mr-1.5" />
          Loading preview...
        </div>
      ) : (
        <div ref={mapContainerRef} className="w-full h-full absolute inset-0" />
      )}
    </div>
  );
}
