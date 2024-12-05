//Used by usePOIData.tsx
import type { POI, POIType } from '@/Types/InterfaceTypes';

const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes
const CACHE_PREFIX = 'poi_cache';

interface CacheData {
  data: POI[];
  timestamp: number;
  city: string;
}

export const poiCacheService = {
  set: (key: string, data: POI[], city: string) => {
    try {
      const cacheData: CacheData = {
        data,
        timestamp: Date.now(),
        city
      };
      localStorage.setItem(`${CACHE_PREFIX}_${key}`, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Cache storage error:', error);
    }
  },

  clearCity: (city: string) => {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(`${CACHE_PREFIX}_`) && key.includes(city)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Cache clearing error:', error);
    }
  },

  isValid: (cache: CacheData | null, currentCity: string): boolean => {
    if (!cache) return false;
    if (cache.city !== currentCity) return false;
    return Date.now() - cache.timestamp < CACHE_EXPIRY;
  },

  getValid: (key: string, currentCity: string): POI[] | null => {
    try {
        const cached = localStorage.getItem(`${CACHE_PREFIX}_${key}`);
        if (!cached) return null;

        const cacheData: CacheData = JSON.parse(cached);
        
        if (Date.now() - cacheData.timestamp > CACHE_EXPIRY || 
            cacheData.city !== currentCity) {
            localStorage.removeItem(`${CACHE_PREFIX}_${key}`);
            return null;
        }
        
        return cacheData.data;
    } catch (error) {
        console.error('Cache retrieval error:', error);
        return null;
    }
},

  generateKey: {
    saved: (city: string) => `saved_${city}`,
    explore: (category: POIType, city: string) => `explore_${category}_${city}`
  }
};