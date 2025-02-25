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

// Helper function to generate a consistent cache key
const generateCacheKey = (city: string, createdDT: Date) => {
  const user = useAuthStore.getState().user;
  const userId = user ? user.uid : 'guest';
  return `${CACHE_PREFIX}_${userId}_${city}_${createdDT.getTime()}`;
};

export const tripCacheService = {
  set(city: string, data: { 
    itineraryPOIs: ItineraryPOI[], 
    unusedPOIs: ItineraryPOI[],
    tripData: TripData 
  }): void {
    try {
      const cacheKey = generateCacheKey(city, data.tripData.createdDT);
      
      // Create a deep copy to ensure all properties are preserved
      const cacheData = {
        ...data,
        timestamp: Date.now()
      };
      
      // Use JSON to ensure we store ALL properties
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Cache storage error:', error);
    }
  },

  get: (city: string, createdDT: Date): TripCacheData | null => {
    try {
      const cacheKey = generateCacheKey(city, createdDT);
      const cached = localStorage.getItem(cacheKey);

      if (!cached) {
        console.log(`No cache found for key: ${cacheKey}`);
        return null;
      }

      const parsedCache = JSON.parse(cached) as TripCacheData;
      return parsedCache;
    } catch (error) {
      console.error('Trip cache retrieval error:', error);
      return null;
    }
  },

  clear: (city: string, createdDT: Date) => {
    try {
      const cacheKey = generateCacheKey(city, createdDT);
      localStorage.removeItem(cacheKey);
      console.log(`Cache cleared for key: ${cacheKey}`);
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
      console.log('All trip caches cleared');
    } catch (error) {
      console.error('Trip cache clearing all error:', error);
    }
  },

  update: (city: string, createdDT: Date, updateFn: (cache: TripCacheData) => TripCacheData) => {
    try {
      const currentCache = tripCacheService.get(city, createdDT);
      if (!currentCache) {
        console.log('No cache to update');
        return;
      }

      const updatedCache = updateFn(currentCache);
      tripCacheService.set(city, updatedCache);
      console.log('Cache updated');
    } catch (error) {
      console.error('Trip cache update error:', error);
    }
  },
};