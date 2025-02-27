import type { ItineraryPOI, TripData } from '@/Types/InterfaceTypes';
import { useAuthStore } from '@/firebase/firebase';

const CACHE_PREFIX = 'trip_data';
const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

interface TripCacheData {
  itineraryPOIs: ItineraryPOI[];
  unusedPOIs: ItineraryPOI[];
  lastModified: number;
  cachedAt: number;
  tripData: TripData;
}

// Get current user ID consistently
const getCurrentUserId = () => {
  const user = useAuthStore.getState().user;
  return user ? user.uid : 'guest';
};

// Generate cache key from trip data
const generateCacheKey = (tripData: TripData) => {
  const userId = getCurrentUserId();
  return `${CACHE_PREFIX}_${userId}_${tripData.city}_${tripData.country}_${tripData.createdDT.toISOString()}`;
};

// Generate cache key from trip parameters
const generateCacheKeyFromParams = (city: string, country: string, createdDT: Date) => {
  const userId = getCurrentUserId();
  return `${CACHE_PREFIX}_${userId}_${city}_${country}_${createdDT.toISOString()}`;
};

export const tripCacheService = {
  // Set new cache data
  set(tripData: TripData, data: { 
    itineraryPOIs: ItineraryPOI[], 
    unusedPOIs: ItineraryPOI[],
    lastModified?: number 
  }): void {
    try {
      const cacheData: TripCacheData = {
        itineraryPOIs: data.itineraryPOIs,
        unusedPOIs: data.unusedPOIs,
        lastModified: data.lastModified || Date.now(),
        cachedAt: Date.now(),
        tripData: tripData
      };
      
      localStorage.setItem(generateCacheKey(tripData), JSON.stringify(cacheData));
    } catch (error) {
      console.error('Cache storage error:', error);
    }
  },

  // Get cache by trip data
  get: (tripData: TripData): TripCacheData | null => {
    try {
      const cacheKey = generateCacheKey(tripData);
      return tripCacheService.getByKey(cacheKey);
    } catch (error) {
      console.error('Trip cache retrieval error:', error);
      return null;
    }
  },

  // Get cache by parameters (for URL params/page refresh)
  getByTripParams: (city: string, country: string, createdDT: Date): TripCacheData | null => {
    try {
      const cacheKey = generateCacheKeyFromParams(city, country, createdDT);
      return tripCacheService.getByKey(cacheKey);
    } catch (error) {
      console.error('Error getting cache by params:', error);
      return null;
    }
  },

  // Get cache by key (internal helper)
  getByKey: (cacheKey: string): TripCacheData | null => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const parsedCache = JSON.parse(cached) as TripCacheData;
      
      // Check for expiration
      if (Date.now() - parsedCache.cachedAt > CACHE_EXPIRY_MS) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return parsedCache;
    } catch (error) {
      console.error('Error retrieving cache:', error);
      return null;
    }
  },

  // Update cache with partial data
  update: (tripData: TripData, updates: Partial<Omit<TripCacheData, 'cachedAt' | 'tripData'>>) => {
    try {
      const cacheKey = generateCacheKey(tripData);
      const cachedItem = localStorage.getItem(cacheKey);
      
      if (!cachedItem) return null;

      const currentCache = JSON.parse(cachedItem) as TripCacheData;
      
      // Create updated cache with timestamp
      const updatedCache = {
        ...currentCache,
        ...updates,
        lastModified: Date.now()
      };

      localStorage.setItem(cacheKey, JSON.stringify(updatedCache));
      return updatedCache;
    } catch (error) {
      console.error('Trip cache update error:', error);
      return null;
    }
  },

  // Remove specific cache
  clear: (tripData: TripData) => {
    try {
      localStorage.removeItem(generateCacheKey(tripData));
    } catch (error) {
      console.error('Cache clearing error:', error);
    }
  },

  // Remove all caches for current user
  clearAll: () => {
    try {
      const userId = getCurrentUserId();
      const userPrefix = `${CACHE_PREFIX}_${userId}`;
      
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(userPrefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing all caches:', error);
    }
  },

  // Check if cache is fresher than timestamp
  isCacheFresher: (tripData: TripData, timestamp: number): boolean => {
    try {
      const cache = tripCacheService.get(tripData);
      return cache ? cache.lastModified > timestamp : false;
    } catch (error) {
      console.error('Error checking cache freshness:', error);
      return false;
    }
  }
};