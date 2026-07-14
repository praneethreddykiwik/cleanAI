'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type MapProviderType = 'leaflet' | 'google';

interface MapContextType {
  provider: MapProviderType;
  isLoaded: boolean;
  loadError: string | null;
}

const MapContext = createContext<MapContextType>({
  provider: 'leaflet',
  isLoaded: false,
  loadError: null,
});

export function MapProvider({
  children,
  defaultProvider = 'leaflet',
}: {
  children: React.ReactNode;
  defaultProvider?: MapProviderType;
}) {
  const [provider] = useState<MapProviderType>(defaultProvider);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (provider === 'leaflet') {
      // Check if Leaflet CSS link is already present
      const existingLink = document.querySelector('link[href*="leaflet.css"]');
      if (!existingLink) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.crossOrigin = '';
        document.head.appendChild(link);
      }
      setTimeout(() => setIsLoaded(true), 0);
    } else if (provider === 'google') {
      if (window.google?.maps) {
        setTimeout(() => setIsLoaded(true), 0);
        return;
      }

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
      if (!apiKey) {
        setTimeout(() => setLoadError('Google Maps API key is missing.'), 0);
        return;
      }

      const existingScript = document.getElementById('google-maps-script');
      if (existingScript) {
        const handleLoad = () => setTimeout(() => setIsLoaded(true), 0);
        const handleError = () => setTimeout(() => setLoadError('Failed to load Google Maps.'), 0);
        existingScript.addEventListener('load', handleLoad);
        existingScript.addEventListener('error', handleError);
        return () => {
          existingScript.removeEventListener('load', handleLoad);
          existingScript.removeEventListener('error', handleError);
        };
      }

      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;

      const handleLoad = () => setTimeout(() => setIsLoaded(true), 0);
      const handleError = () => setTimeout(() => setLoadError('Google Maps API failed to load.'), 0);

      script.addEventListener('load', handleLoad);
      script.addEventListener('error', handleError);
      document.head.appendChild(script);

      return () => {
        script.removeEventListener('load', handleLoad);
        script.removeEventListener('error', handleError);
      };
    }
  }, [provider]);

  return (
    <MapContext.Provider value={{ provider, isLoaded, loadError }}>
      {children}
    </MapContext.Provider>
  );
}

export function useMap() {
  return useContext(MapContext);
}

// Retain compatibility alias
export const GoogleMapProvider = MapProvider;
export const useGoogleMap = useMap;
