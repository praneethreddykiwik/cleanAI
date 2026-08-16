import { readJson } from './read-json';

export interface GeocodedAddress {
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export const LocationService = {
  /**
   * Search address suggestions using Nominatim (OpenStreetMap)
   */
  async searchAddress(query: string): Promise<GeocodedAddress[]> {
    if (!query || query.length < 3) return [];
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&addressdetails=1&limit=5`;
      
      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'CleanAI-Platform-Booking-Agent',
        },
      });

      if (!res.ok) throw new Error('Nominatim search failed');
      const data = await readJson<any>(res);

      return data.map((item: any) => {
        const addr = item.address || {};
        const city = addr.city || addr.town || addr.village || addr.suburb || '';
        const state = addr.state || '';
        const postalCode = addr.postcode || '';
        const country = addr.country || '';

        return {
          address: item.display_name,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          city,
          state,
          postalCode,
          country,
        };
      });
    } catch (error) {
      console.error('Nominatim Geocoding Error:', error);
      return [];
    }
  },

  /**
   * Perform reverse geocoding to retrieve structured address details from lat/lng
   */
  async reverseGeocode(lat: number, lng: number): Promise<GeocodedAddress | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
      
      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'CleanAI-Platform-Booking-Agent',
        },
      });

      if (!res.ok) throw new Error('Nominatim reverse geocoding failed');
      const data = await readJson<any>(res);
      if (!data || !data.display_name) return null;

      const addr = data.address || {};
      const city = addr.city || addr.town || addr.village || addr.suburb || '';
      const state = addr.state || '';
      const postalCode = addr.postcode || '';
      const country = addr.country || '';

      return {
        address: data.display_name,
        latitude: lat,
        longitude: lng,
        city,
        state,
        postalCode,
        country,
      };
    } catch (error) {
      console.error('Nominatim Reverse Geocoding Error:', error);
      return null;
    }
  },
};
