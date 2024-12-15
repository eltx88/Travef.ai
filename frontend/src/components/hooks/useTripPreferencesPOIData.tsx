import { useEffect, useRef, useState, useCallback } from 'react';
import type { TripData, POI } from '@/Types/InterfaceTypes';
import { CategoryMapper } from '@/components/TripPage/CategoryMapper';
import { poiCacheService } from '@/components/hooks/poiCacheService';
import ApiClient from '@/Api/apiClient';

export const useTripPreferencesPOIData = (tripData: TripData, user: any) => {
  const [points, setPoints] = useState<POI[]>([]);
  const [loading, setLoading] = useState(true);
  const [failedCategories, setFailedCategories] = useState<{
    food: boolean;
    attraction: boolean;
  }>({ food: false, attraction: false });

  const fetchingRef = useRef<{
    inProgress: boolean;
    food: boolean;
    attraction: boolean;
  }>({
    inProgress: false,
    food: false,
    attraction: false
  });
  
  const retryCount = useRef<{ food: number; attraction: number }>({ food: 0, attraction: 0 });
  const successfulResults = useRef<{
    food: POI[];
    attraction: POI[];
  }>({ food: [], attraction: [] });
  const MAX_RETRIES = 3;
  
  const apiClient = new ApiClient({
    getIdToken: async () => {
      if (!user) throw new Error('Not authenticated');
      return user.getIdToken();
    }
  });

  const fetchCategory = useCallback(async (
    type: 'food' | 'attraction',
    categories: string
  ) => {
    // Skip if already fetching this category
    if (fetchingRef.current[type]) return successfulResults.current[type];
    
    const cacheKey = `explore_${type}_${tripData.city}_${categories}`;
    const cachedData = poiCacheService.getValid(cacheKey, tripData.city);
    
    if (cachedData) {
      successfulResults.current[type] = cachedData;
      return cachedData;
    }

    try {
      fetchingRef.current[type] = true;
      const pois = await apiClient.getExplorePOIs({
        city: tripData.city,
        coordinates: tripData.coordinates,
        category: categories,
        limit: 30
      });

      const validPois = pois
        .filter((poi: POI) => poi.name && poi.coordinates?.lat && poi.coordinates?.lng)
        .map((poi: POI) => ({
          ...poi,
          type: type === 'food' ? 'restaurant' : 'attraction'
        }));

      poiCacheService.set(cacheKey, validPois, tripData.city);
      successfulResults.current[type] = validPois;
      setFailedCategories(prev => ({ ...prev, [type]: false }));
      retryCount.current[type] = 0;
      return validPois;
    } catch (error) {
      retryCount.current[type]++;
      if (retryCount.current[type] >= MAX_RETRIES) {
        setFailedCategories(prev => ({ ...prev, [type]: true }));
      }
      return [];
    } finally {
      fetchingRef.current[type] = false;
    }
  }, [tripData.city, tripData.coordinates, apiClient]);

  const fetchPOIs = useCallback(async () => {
    if (fetchingRef.current.inProgress) return;
    
    try {
      fetchingRef.current.inProgress = true;
      setLoading(true);

      const categoryMapper = new CategoryMapper();
      const { foodCategories, attractionCategories } = 
        await categoryMapper.getCategoryMappings(tripData);

      const results = await Promise.all([
        foodCategories ? fetchCategory('food', foodCategories) : Promise.resolve([]),
        attractionCategories ? fetchCategory('attraction', attractionCategories) : Promise.resolve([])
      ]);

      const uniquePOIs = Array.from(
        new Map(results.flat().map(poi => [poi.place_id, poi])).values()
      );
      setPoints(uniquePOIs);
    } finally {
      fetchingRef.current.inProgress = false;
      setLoading(false);
    }
  }, [tripData, fetchCategory]);

  const retryFailed = useCallback(() => {
    // Only reset retry counts for failed categories
    Object.entries(failedCategories).forEach(([category, failed]) => {
      if (failed) {
        retryCount.current[category as 'food' | 'attraction'] = 0;
        successfulResults.current[category as 'food' | 'attraction'] = [];
      }
    });
    fetchPOIs();
  }, [fetchPOIs, failedCategories]);

  useEffect(() => {
    // Reset everything when tripData changes
    retryCount.current = { food: 0, attraction: 0 };
    successfulResults.current = { food: [], attraction: [] };
    fetchingRef.current = { inProgress: false, food: false, attraction: false };
    fetchPOIs();
  }, [tripData, user]);

  return { 
    points,
    loading,
    failedCategories,
    retryFailed
  };
};