'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMap } from './MapProvider';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { LocationService, GeocodedAddress } from '@/lib/locationService';

interface AddressDetails {
  address: string;
  latitude: number;
  longitude: number;
  placeId: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

interface AddressAutocompleteProps {
  onSelectAddress: (details: AddressDetails) => void;
  placeholder?: string;
  className?: string;
}

export function AddressAutocomplete({
  onSelectAddress,
  placeholder = 'Search for your street address, building, or area...',
  className,
}: AddressAutocompleteProps) {
  const { provider, isLoaded, loadError } = useMap();
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Google Maps specific refs
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const geocoder = useRef<google.maps.Geocoder | null>(null);

  useEffect(() => {
    if (provider === 'google' && isLoaded && window.google) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      geocoder.current = new window.google.maps.Geocoder();
    }
  }, [provider, isLoaded]);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchPredictions = async (input: string) => {
    if (!input) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    if (provider === 'leaflet') {
      try {
        const results = await LocationService.searchAddress(input);
        setSuggestions(results);
        setIsOpen(results.length > 0);
      } catch (err) {
        console.error(err);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    } else if (provider === 'google') {
      if (!autocompleteService.current) {
        setIsLoading(false);
        return;
      }
      autocompleteService.current.getPlacePredictions(
        {
          input,
          componentRestrictions: { country: 'IN' },
        },
        (predictions, status) => {
          setIsLoading(false);
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions);
            setIsOpen(true);
          } else {
            setSuggestions([]);
          }
        }
      );
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (value.trim() === '') {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      fetchPredictions(value);
    }, 300);
  };

  const handleSelectSuggestion = (suggestion: any) => {
    if (provider === 'leaflet') {
      const item = suggestion as GeocodedAddress;
      setInputValue(item.address);
      setIsOpen(false);
      setSuggestions([]);
      onSelectAddress({
        address: item.address,
        latitude: item.latitude,
        longitude: item.longitude,
        placeId: `osm-${item.latitude}-${item.longitude}`,
        city: item.city,
        state: item.state,
        postalCode: item.postalCode,
        country: item.country,
      });
    } else if (provider === 'google') {
      const prediction = suggestion as google.maps.places.AutocompletePrediction;
      setInputValue(prediction.description);
      setIsOpen(false);
      setSuggestions([]);

      if (!geocoder.current) return;

      setIsLoading(true);
      geocoder.current.geocode({ placeId: prediction.place_id }, (results, status) => {
        setIsLoading(false);
        if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
          const result = results[0];
          const lat = result.geometry.location.lat();
          const lng = result.geometry.location.lng();

          let city = '';
          let state = '';
          let postalCode = '';
          let country = '';

          result.address_components.forEach((component) => {
            const types = component.types;
            if (types.includes('locality')) {
              city = component.long_name;
            } else if (types.includes('administrative_area_level_1')) {
              state = component.long_name;
            } else if (types.includes('postal_code')) {
              postalCode = component.long_name;
            } else if (types.includes('country')) {
              country = component.long_name;
            }
          });

          onSelectAddress({
            address: result.formatted_address,
            latitude: lat,
            longitude: lng,
            placeId: prediction.place_id,
            city,
            state,
            postalCode,
            country,
          });
        }
      });
    }
  };

  if (loadError) {
    return (
      <div className="text-xs text-red-500 font-semibold p-3 border border-red-500/10 bg-red-500/5 rounded-xl">
        Map utilities could not be initialized: {loadError}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn('relative w-full z-30', className)}>
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder={isLoaded ? placeholder : 'Initializing search services...'}
          disabled={!isLoaded}
          className={cn(
            'w-full h-11 pl-10 pr-10 rounded-full border border-border bg-background text-xs outline-none transition-all',
            'focus:border-primary focus:ring-3 focus:ring-primary/10 font-medium text-foreground placeholder:text-muted-foreground/60 shadow-3xs'
          )}
        />
        <div className="absolute left-3.5 top-3.5 text-muted-foreground/60">
          <Search size={14} />
        </div>
        {isLoading && (
          <div className="absolute right-3.5 top-3.5 text-primary">
            <Loader2 size={14} className="animate-spin" />
          </div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: 8, scale: 0.99 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            className="absolute left-0 right-0 max-h-60 overflow-y-auto glass-3 border border-white/50 dark:border-white/10 rounded-2xl p-1.5 shadow-lg space-y-0.5"
          >
            {suggestions.map((suggestion, idx) => {
              const placeId = provider === 'google' ? suggestion.place_id : `osm-${idx}-${suggestion.latitude}`;
              const mainText = provider === 'google' ? suggestion.structured_formatting.main_text : suggestion.address.split(',')[0];
              const secondaryText = provider === 'google' ? suggestion.structured_formatting.secondary_text : suggestion.address.split(',').slice(1).join(',').trim();

              return (
                <li key={placeId}>
                  <button
                    type="button"
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="w-full flex items-start gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-foreground/5 dark:hover:bg-white/5 transition-colors duration-150"
                  >
                    <MapPin size={13} className="text-muted-foreground/60 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {mainText}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                        {secondaryText}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
