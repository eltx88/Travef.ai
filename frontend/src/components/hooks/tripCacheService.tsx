import type { ItineraryPOI, TripData } from '@/Types/InterfaceTypes';

const CACHE_PREFIX = 'trip_data';

interface TripCacheData {
  itineraryPOIs: ItineraryPOI[];
  unusedPOIs: ItineraryPOI[];
  timestamp: number;
  city: string;
  tripData: TripData;
}

export const tripCacheService = {
  set: (city: string, data: Omit<TripCacheData, 'timestamp' | 'city'>) => {
    try {
      const cacheData: TripCacheData = {
        ...data,
        timestamp: Date.now(),
        city
      };
      localStorage.setItem(
        `${CACHE_PREFIX}_${city}`, 
        JSON.stringify(cacheData)
      );
    } catch (error) {
      console.error('Trip cache storage error:', error);
    }
  },

  get: (city: string): TripCacheData | null => {
    try {
      const cached = localStorage.getItem(`${CACHE_PREFIX}_${city}`);
      if (!cached) return null;
      
      return JSON.parse(cached) as TripCacheData;
    } catch (error) {
      console.error('Trip cache retrieval error:', error);
      return null;
    }
  },

  clear: (city: string) => {
    try {
      localStorage.removeItem(`${CACHE_PREFIX}_${city}`);
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

  update: (city: string, updateFn: (cache: TripCacheData) => TripCacheData) => {
    try {
      const currentCache = tripCacheService.get(city);
      if (!currentCache) return;

      const updatedCache = updateFn(currentCache);
      tripCacheService.set(city, updatedCache);
    } catch (error) {
      console.error('Trip cache update error:', error);
    }
  },

  // Utility function to move POI between itinerary and unused
  movePOI: (city: string, poiId: string, moveToUnused: boolean) => {
    tripCacheService.update(city, (cache) => {
      if (moveToUnused) {
        // Find POI in itinerary and move to unused
        const poiToMove = cache.itineraryPOIs.find(poi => poi.id === poiId);
        if (!poiToMove) return cache;

        return {
          ...cache,
          itineraryPOIs: cache.itineraryPOIs.filter(poi => poi.id !== poiId),
          unusedPOIs: [...cache.unusedPOIs, {
            ...poiToMove,
            day: -1,
            timeSlot: "unused",
            StartTime: -1,
            EndTime: -1,
            duration: -1
          }]
        };
      } else {
        // Find POI in unused and move to itinerary
        const poiToMove = cache.unusedPOIs.find(poi => poi.id === poiId);
        if (!poiToMove) return cache;

        return {
          ...cache,
          unusedPOIs: cache.unusedPOIs.filter(poi => poi.id !== poiId),
          itineraryPOIs: [...cache.itineraryPOIs, poiToMove]
        };
      }
    });
  }
};