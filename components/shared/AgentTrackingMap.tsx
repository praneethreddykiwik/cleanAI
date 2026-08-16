'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useMap } from './MapProvider';
import { getSocket } from '@/lib/socket';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

interface AgentTrackingMapProps {
  customerLat: number;
  customerLng: number;
  bookingId: string;
  className?: string;
}

export function AgentTrackingMap({
  customerLat,
  customerLng,
  bookingId,
  className,
}: AgentTrackingMapProps) {
  const { provider, isLoaded } = useMap();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [agentCoords, setAgentCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Leaflet references
  const mapRef = useRef<any>(null);
  const customerMarkerRef = useRef<any>(null);
  const agentMarkerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);

  // Hook up Socket.IO listener for live agent coordinates updates
  useEffect(() => {
    const socket = getSocket();
    socket.connect();
    socket.emit('join.booking', bookingId);

    const handleLocationUpdate = (data: { latitude: number; longitude: number }) => {
      console.log('Received live GPS packet:', data);
      setAgentCoords({ lat: data.latitude, lng: data.longitude });
    };

    socket.on('location.updated', handleLocationUpdate);

    return () => {
      socket.off('location.updated', handleLocationUpdate);
    };
  }, [bookingId]);

  // Leaflet rendering and map coordination
  useEffect(() => {
    if (typeof window === 'undefined' || !isLoaded || !mapContainerRef.current) return;

    if (provider === 'leaflet') {
      import('leaflet').then((L) => {
        if (!mapContainerRef.current) return;

        // 1. Initialize map if not loaded
        if (!mapRef.current) {
          const map = L.map(mapContainerRef.current, {
            zoomControl: true,
          }).setView([customerLat, customerLng], 14);
          mapRef.current = map;

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
          }).addTo(map);

          const CustomerIcon = L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
          });

          customerMarkerRef.current = L.marker([customerLat, customerLng], {
            icon: CustomerIcon,
          })
            .addTo(map)
            .bindPopup('Your Residence')
            .openPopup();
        }

        // 2. Map route and en-route technician marker
        if (agentCoords) {
          const AgentIcon = L.divIcon({
            html: `<div style="background-color: #4f46e5; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-center; box-shadow: 0 4px 6px rgba(0,0,0,0.15);"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-navigation" style="margin: auto; transform: rotate(45deg);"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg></div>`,
            className: '',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });

          if (agentMarkerRef.current) {
            agentMarkerRef.current.setLatLng([agentCoords.lat, agentCoords.lng]);
          } else {
            agentMarkerRef.current = L.marker([agentCoords.lat, agentCoords.lng], {
              icon: AgentIcon,
            })
              .addTo(mapRef.current)
              .bindPopup('Technician En-route')
              .openPopup();
          }

          // Redraw line route connecting markers
          if (routeLineRef.current) {
            routeLineRef.current.setLatLngs([
              [customerLat, customerLng],
              [agentCoords.lat, agentCoords.lng],
            ]);
          } else {
            routeLineRef.current = L.polyline(
              [
                [customerLat, customerLng],
                [agentCoords.lat, agentCoords.lng],
              ],
              {
                color: '#4f46e5',
                weight: 4,
                dashArray: '8, 8',
                opacity: 0.8,
              }
            ).addTo(mapRef.current);
          }

          // Auto center views to fit both points
          const bounds = L.latLngBounds([
            [customerLat, customerLng],
            [agentCoords.lat, agentCoords.lng],
          ]);
          mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        }
      });
    }
  }, [isLoaded, customerLat, customerLng, agentCoords, provider]);

  return (
    <div className={className}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted/30 backdrop-blur-xs flex items-center justify-center text-[10px] text-muted-foreground font-semibold">
          <Loader2 size={12} className="animate-spin text-primary mr-1.5" />
          Loading GPS tracking map...
        </div>
      )}
      <div ref={mapContainerRef} className="w-full h-full absolute inset-0" />
    </div>
  );
}
export default AgentTrackingMap;
