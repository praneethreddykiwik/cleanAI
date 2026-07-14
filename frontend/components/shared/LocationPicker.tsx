'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useMap } from './MapProvider';
import { Navigation, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LocationPickerProps {
  latitude: number;
  longitude: number;
  onChangeLocation: (lat: number, lng: number) => void;
  className?: string;
}

export function LocationPicker({
  latitude,
  longitude,
  onChangeLocation,
  className,
}: LocationPickerProps) {
  const { provider, isLoaded, loadError } = useMap();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Google Maps refs
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const googleMarkerRef = useRef<google.maps.Marker | null>(null);
  
  // Leaflet refs
  const leafletMapRef = useRef<any>(null);
  const leafletMarkerRef = useRef<any>(null);

  const [isGettingCurrentLocation, setIsGettingCurrentLocation] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (typeof window === 'undefined' || !isLoaded || !mapContainerRef.current) return;

    if (provider === 'leaflet') {
      import('leaflet').then((L) => {
        if (!mapContainerRef.current) return;

        // Cleanup previous Leaflet map if exists
        if (leafletMapRef.current) {
          leafletMapRef.current.remove();
          leafletMapRef.current = null;
        }

        const map = L.map(mapContainerRef.current).setView([latitude, longitude], 15);
        leafletMapRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
        }).addTo(map);

        // Fix Leaflet marker icons not showing up due to build path issues
        const DefaultIcon = L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        });

        const marker = L.marker([latitude, longitude], {
          draggable: true,
          icon: DefaultIcon,
        }).addTo(map);
        leafletMarkerRef.current = marker;

        marker.on('dragend', () => {
          const latLng = marker.getLatLng();
          onChangeLocation(latLng.lat, latLng.lng);
        });
      });
    } else if (provider === 'google' && window.google) {
      if (googleMapRef.current) return;

      const initialPos = { lat: latitude, lng: longitude };

      googleMapRef.current = new window.google.maps.Map(mapContainerRef.current, {
        center: initialPos,
        zoom: 15,
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
        position: initialPos,
        map: googleMapRef.current,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
      });

      googleMarkerRef.current.addListener('dragend', () => {
        if (googleMarkerRef.current) {
          const position = googleMarkerRef.current.getPosition();
          if (position) {
            onChangeLocation(position.lat(), position.lng());
          }
        }
      });
    }
  }, [isLoaded, provider]);

  // Sync Map center and Marker position when coordinate props change (e.g. from Autocomplete)
  useEffect(() => {
    if (provider === 'leaflet') {
      if (!leafletMapRef.current || !leafletMarkerRef.current) return;
      leafletMarkerRef.current.setLatLng([latitude, longitude]);
      leafletMapRef.current.panTo([latitude, longitude]);
    } else if (provider === 'google') {
      if (!googleMapRef.current || !googleMarkerRef.current) return;
      const newPos = { lat: latitude, lng: longitude };
      googleMarkerRef.current.setPosition(newPos);
      googleMapRef.current.panTo(newPos);
    }
  }, [latitude, longitude, provider]);

  // Request current GPS coordinates
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsGettingCurrentLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsGettingCurrentLocation(false);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        onChangeLocation(lat, lng);
      },
      (error) => {
        setIsGettingCurrentLocation(false);
        console.error('Error getting location:', error);
        alert('Failed to retrieve location. Please check your browser permissions.');
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  if (loadError) return null;

  return (
    <div className="relative w-full h-full min-h-[220px] rounded-2xl overflow-hidden border border-border/40 shadow-xs flex flex-col justify-end">
      {!isLoaded ? (
        <div className="absolute inset-0 bg-muted/30 backdrop-blur-xs flex items-center justify-center text-xs text-muted-foreground font-medium">
          <Loader2 size={16} className="animate-spin text-primary mr-2" />
          Loading interactive map...
        </div>
      ) : (
        <>
          {/* Map Container */}
          <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

          {/* Current GPS button overlay */}
          <div className="absolute bottom-3 right-3 z-10">
            <Button
              type="button"
              variant="glass"
              size="xs"
              onClick={handleGetCurrentLocation}
              disabled={isGettingCurrentLocation}
              className="rounded-full shadow-md bg-white/80 dark:bg-zinc-950/80 border border-white/50 dark:border-white/10"
            >
              {isGettingCurrentLocation ? (
                <Loader2 size={12} className="animate-spin text-primary mr-1" />
              ) : (
                <Navigation size={12} className="text-primary mr-1" />
              )}
              GPS Locate
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
