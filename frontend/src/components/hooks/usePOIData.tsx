//Used by POIContainer to return saved and explore POIs
import { useState, useEffect, useCallback, useRef } from 'react';
import type { POI, POIType, UserHistoryPoint } from '@/Types/InterfaceTypes';
import { useLocation } from '@/contexts/LocationContext';
import { useDebounce } from './debounce';
import { poiCacheService } from './poiCacheService';
import { usePagination } from './usePagination';
import ApiClient from '@/Api/apiClient';

const categoryMapping: Record<POIType, string> = {
    hotel: 'accommodation',
    restaurant: 'catering',
    attraction: 'tourism,entertainment',
};

export interface POIDataHookReturn {
  savedPois: POI[];
  explorePois: POI[];
  loading: boolean;
  currentCategory: POIType;
  error: string | null;
  fetchSavedPOIs: () => Promise<POI[]>;
  fetchExplorePOIs: (selectedCategory: POIType) => Promise<POI[]>;
  savePOI: (poi: POI) => Promise<void>;
  unsavePOI: (savedPoiId: string) => Promise<void>;
  explorePagination: ReturnType<typeof usePagination>;
  savedPagination: ReturnType<typeof usePagination>;
  setLoading: (loading: boolean) => void;
  clearCache: () => void;
  isPoiSaved: (poiId: string) => boolean;
  savedPoiIds: Set<string>;
  refreshSaved: boolean;
  setRefreshSaved: (refresh: boolean) => void;
}

export const usePOIData = (user: any, currentCity: string): POIDataHookReturn => {
    const [savedPois, setSavedPois] = useState<POI[]>([]);
    const [explorePoisMap, setExplorePoisMap] = useState<Record<POIType, POI[]>>({
      hotel: [],
      restaurant: [],
      attraction: []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const prevCityRef = useRef<string>(currentCity);
    const { coordinates } = useLocation();
    const debouncedCoordinates = useDebounce(coordinates, 500);
    const [currentCategory, setCurrentCategory] = useState<POIType>('hotel');
    const explorePagination = usePagination(explorePoisMap[currentCategory] || []);
    const savedPagination = usePagination(savedPois);
    const [savedPoiIds, setSavedPoiIds] = useState<Set<string>>(new Set());
    const [refreshSaved, setRefreshSaved] = useState(false);
    const apiClient = new ApiClient({
      getIdToken: async () => {
          if (!user) throw new Error('Not authenticated');
          return user.getIdToken();
      }
  });

    const clearCache = useCallback(() => {
      poiCacheService.clearCity(currentCity);
      setExplorePoisMap({
        hotel: [],
        restaurant: [],
        attraction: []
      });
      explorePagination.resetPagination();
      savedPagination.resetPagination();
    }, [currentCity, explorePagination, savedPagination]);

    useEffect(() => {
      if (prevCityRef.current !== currentCity) {
          poiCacheService.clearCity(prevCityRef.current);
          prevCityRef.current = currentCity;
      }
    }, [currentCity]);

    // Reset pagination when category changes
    useEffect(() => {
      explorePagination.resetPagination();
    }, [currentCategory]);

    // Effect to load cached data for all categories on mount
    useEffect(() => {
    const loadCachedCategories = async () => {
      const categories: POIType[] = ['hotel', 'restaurant', 'attraction'];
      const newPoisMap: Record<POIType, POI[]> = {
        hotel: [],
        restaurant: [],
        attraction: []
      };

      categories.forEach(category => {
        const cacheKey = poiCacheService.generateKey.explore(category, currentCity);
        const validCache = poiCacheService.getValid(cacheKey, currentCity);
        if (validCache) {
          newPoisMap[category] = validCache;
        }
      });

      setExplorePoisMap(newPoisMap);
    };

    loadCachedCategories();
  }, [currentCity]);

  const fetchExplorePOIs = useCallback(async (selectedCategory: POIType): Promise<POI[]> => {
    if (!user) {
        setError('User not authenticated');
        return [];
    }

    setCurrentCategory(selectedCategory);
    const cacheKey = poiCacheService.generateKey.explore(selectedCategory, currentCity);
    const validCachedData = poiCacheService.getValid(cacheKey, currentCity);

    if (validCachedData) {
        setExplorePoisMap(prev => ({
            ...prev,
            [selectedCategory]: validCachedData
        }));
        return validCachedData;
    }

    setLoading(true);
    setError(null);

    try {
        const pois = await apiClient.getExplorePOIs({
            city: currentCity,
            category: categoryMapping[selectedCategory],
            type: selectedCategory,
            coordinates: {
                lat: debouncedCoordinates.lat,
                lng: debouncedCoordinates.lng
            }
        });

        // Filter out any POIs without required fields
        const validPois = pois.filter((poi: POI) => 
            poi.name && 
            poi.coordinates?.lat && 
            poi.coordinates?.lng
        );

        poiCacheService.set(cacheKey, validPois, currentCity);
        setExplorePoisMap(prev => ({
            ...prev,
            [selectedCategory]: validPois
        }));
        return validPois;
    } catch (error) {
        console.error('Error fetching explore POIs:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
        setExplorePoisMap(prev => ({
            ...prev,
            [selectedCategory]: []
        }));
        return [];
    } finally {
        setLoading(false);
    }
}, [user, currentCity, debouncedCoordinates, apiClient]);

const fetchSavedPOIs = useCallback(async (): Promise<POI[]> => {
  if (!user) {
    setError('User not authenticated');
    return [];
  }

  setLoading(true);
  try {
    const savedPoiRefs = await apiClient.getSavedPOIs(currentCity);
    const poiIds = savedPoiRefs.map((poi: UserHistoryPoint) => poi.pointID);
    if (poiIds.length === 0) {
      setSavedPois([]);
      setSavedPoiIds(new Set());
      return [];
    }
    
    const poisWithDetails = await apiClient.getSavedPOIDetails(poiIds);
    setSavedPois(poisWithDetails);
    setSavedPoiIds(new Set(poiIds));
    return poisWithDetails;
  } catch (error) {
    console.error('Error fetching saved POIs:', error);
    return [];
  } finally {
    setLoading(false);
  }
}, [user, currentCity, apiClient]);

// Add method to check if POI is saved
const isPoiSaved = useCallback((poiId: string) => {
  return savedPoiIds.has(poiId);
}, [savedPoiIds]);

    const savePOI = async (poi: POI) => {
      if (!user) {
        throw new Error('Not authenticated');
      }
      try {
          const pointId = await apiClient.createOrGetPOI(poi);
          await apiClient.savePOI(user.uid, pointId, poi.city);
          setRefreshSaved(true);
      } catch (error) {
        console.error('Error saving POI:', error);
        throw error;
      }
    };

    const unsavePOI = async (savedPoiId: string): Promise<void> => {
      try {
        await apiClient.unsavePOI([savedPoiId]);
        
        setSavedPois(prevPois => prevPois.filter(poi => poi.id !== savedPoiId));
        setSavedPoiIds(prevIds => {
            const newIds = new Set(prevIds);
            newIds.delete(savedPoiId);
            return newIds;
        });
      } catch (err) {
          setError(err instanceof Error ? err.message : 'An error occurred');
      }
};

    return {
      savedPois,
      explorePois: explorePoisMap[currentCategory] || [],
      loading,
      currentCategory,
      error,
      fetchSavedPOIs,
      fetchExplorePOIs,
      savePOI,
      unsavePOI,
      explorePagination,
      savedPagination,
      setLoading,
      clearCache,
      isPoiSaved,
      savedPoiIds,
      refreshSaved,
      setRefreshSaved
    };
};

export default usePOIData;