import type { ItineraryPOI, TripData } from '@/Types/InterfaceTypes';
import { useAuthStore } from '@/firebase/firebase';

const CACHE_PREFIX = 'trip_data';

interface TripCacheData {
  itineraryPOIs: ItineraryPOI[];
  unusedPOIs: ItineraryPOI[];
  timestamp: number;
  city: string;
  tripData: TripData;
}

// Helper function to generate cache key
const generateCacheKey = (city: string, createdDT: Date, userId: string) => {
  const key = `${CACHE_PREFIX}_${userId}_${city}_${createdDT.toISOString()}`;
  return key;
};

export const tripCacheService = {
  set: (city: string, data: Omit<TripCacheData, 'timestamp' | 'city'>) => {
    try {
      const user = useAuthStore.getState().user;
      if (!user) {
        return;
      }

      const cacheKey = generateCacheKey(city, data.tripData.createdDT, user.uid);
      const cacheData: TripCacheData = {
        ...data,
        timestamp: Date.now(),
        city,
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Trip cache storage error:', error);
    }
  },

  get: (city: string, createdDT: Date): TripCacheData | null => {
    try {
      const user = useAuthStore.getState().user;
      if (!user) {
        return null;
      }

      const cacheKey = generateCacheKey(city, createdDT, user.uid);
      const cached = localStorage.getItem(cacheKey);

      if (!cached) {
        return null;
      }

      return JSON.parse(cached) as TripCacheData;
    } catch (error) {
      console.error('Trip cache retrieval error:', error);
      return null;
    }
  },

  clear: (city: string, createdDT: Date) => {
    try {
      const user = useAuthStore.getState().user;
      if (!user) {
        return;
      }

      const cacheKey = generateCacheKey(city, createdDT, user.uid);
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.error('Trip cache clearing error:', error);
    }
  },

  clearAll: () => {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Trip cache clearing all error:', error);
    }
  },

  update: (city: string, createdDT: Date, updateFn: (cache: TripCacheData) => TripCacheData) => {
    try {
      const currentCache = tripCacheService.get(city, createdDT);
      if (!currentCache) {
        return;
      }

      const updatedCache = updateFn(currentCache);
      tripCacheService.set(city, updatedCache);
    } catch (error) {
      console.error('Trip cache update error:', error);
    }
  },
};