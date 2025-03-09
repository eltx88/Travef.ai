//Called by the CustomTripPages.tsx using a callback function which then passes the data to TripPOIContainer.tsx for it to display
import { useEffect, useState, useRef, useCallback } from 'react';
import type { TripData, POI, UserHistoryPoint } from '@/Types/InterfaceTypes';
import { CategoryMapper } from '@/components/TripPage/CategoryMapper';
import { poiCacheService } from './poiCacheService';
import ApiClient from '@/Api/apiClient';

// Helper function to generate a unique cache key for trip preferences
const generateTripPreferenceCacheKey = (tripData: TripData, type: 'food' | 'attraction') => {
  const preferences = type === 'food' 
    ? Array.from(tripData.foodPreferences).concat(Array.from(tripData.customFoodPreferences))
    : Array.from(tripData.interests).concat(Array.from(tripData.customInterests));
  
  return `trip_${type}_${tripData.city}_${preferences.sort().join('_')}`;
};

export const useTripPreferencesPOIData = (
  tripData: TripData, 
  user: any,
  onPOIsUpdate: (pois: POI[]) => void,
  onSavedPOIsUpdate: (savedPois: POI[]) => void
) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCounter, setRetryCounter] = useState(0);
  const previousSavedPOIsRef = useRef<string>('');
  const fetchInProgressRef = useRef(false);
  const previousPOIsRef = useRef<string>('');
  const categoryMapperRef = useRef<CategoryMapper | null>(null);

  // Filter function to remove duplicates
  const filterUniquePOIs = (explorePOIs: POI[], savedPOIs: POI[]): POI[] => {
  const savedPlaceIds = new Set(savedPOIs.map(poi => poi.place_id));
    
    // Filter out any explorePOIs that are already in savedPOIs
    return explorePOIs.filter(poi => !savedPlaceIds.has(poi.place_id));
  };

  // Check cache and fetch POIs if needed
  const fetchCategoryPOIs = async (
    apiClient: ApiClient,
    category: string,
    type: 'food' | 'attraction',
    savedPoisData: POI[]
  ): Promise<POI[]> => {
    const cacheKey = generateTripPreferenceCacheKey(tripData, type);
    const validCache = poiCacheService.getValid(cacheKey, tripData.city);

    if (validCache) {
      return filterUniquePOIs(validCache, savedPoisData);
    }
    const fetchedPOIs = await apiClient.getGoogleExplorePOIs({
      type: [category],
      coordinates: tripData.coordinates,
      poitype: type === 'food' ? 'restaurant' : 'attraction',
      city: tripData.city,
      country: tripData.country,      
    });

    if (fetchedPOIs.length < 24) {
      const additionalPOIs = await apiClient.getGoogleExplorePOIs({
        type: [category],
        coordinates: tripData.coordinates,
        poitype: type === 'food' ? 'restaurant' : 'attraction',
        city: tripData.city,
        country: tripData.country,
        radius: '5000',
      });
      const existingPlaceIds = new Set(fetchedPOIs.map(poi => poi.place_id));
      const uniqueAdditionalPOIs = additionalPOIs.filter(poi => !existingPlaceIds.has(poi.place_id));
      fetchedPOIs.push(...uniqueAdditionalPOIs);
    }

    poiCacheService.set(cacheKey, fetchedPOIs, tripData.city, tripData.country);
    return filterUniquePOIs(fetchedPOIs, savedPoisData);
  };

  useEffect(() => {
    const fetchPOIs = async () => {
      if (!user || !tripData || fetchInProgressRef.current) return;

      try {
        fetchInProgressRef.current = true;
        setLoading(true);
        setError(false);

        const apiClient = new ApiClient({
          getIdToken: async () => user.getIdToken()
        });
        
        // First fetch saved POIs
        let savedPoisData: POI[] = [];
        try {
          const savedPoiRefs = await apiClient.getSavedPOIs(tripData.city);          
          const poiIds = savedPoiRefs.map((poi: UserHistoryPoint) => poi.pointID);
          
          if (poiIds.length > 0) {
            const poisWithDetails = await apiClient.getSavedPOIDetails(poiIds);
            const savedPoisString = JSON.stringify(poisWithDetails);

            if (previousSavedPOIsRef.current !== savedPoisString) {
              onSavedPOIsUpdate(poisWithDetails);
              previousSavedPOIsRef.current = savedPoisString;
              savedPoisData = poisWithDetails;
            }
          } else {
            onSavedPOIsUpdate([]);
          }
        } catch (error) {
          console.error('Error fetching saved POIs:', error);
          onSavedPOIsUpdate([]);
        }

        // Initialize CategoryMapper if not already done
        if (!categoryMapperRef.current) {
          categoryMapperRef.current= new CategoryMapper();
        }

        // Get category mappings
        const { foodCategories, attractionCategories } = 
          await categoryMapperRef.current.getCategoryMappings(tripData);
        let foodPOIs: POI[] = [];
        let attractionPOIs: POI[] = [];
        let hasFetchError = false;

        // Fetch food POIs with caching
        if (foodCategories) {
          try {
            // First get saved POIs for filtering
            const savedFoodPOIs = savedPoisData.filter(poi => poi.type === 'restaurant');
            
            // Then fetch and filter explore POIs
            foodPOIs = await fetchCategoryPOIs(
              apiClient,
              foodCategories,
              'food',
              savedFoodPOIs  // Pass only saved restaurants for filtering
            );
          } catch (error) {
            console.error('Error fetching food POIs:', error);
            hasFetchError = true;
          }
        }

        // Fetch attraction POIs with caching
        if (attractionCategories) {
          try {
            // First get saved POIs for filtering
            const savedAttractionPOIs = savedPoisData.filter(poi => poi.type === 'attraction');
            
            // Then fetch and filter explore POIs
            attractionPOIs = await fetchCategoryPOIs(
              apiClient,
              attractionCategories,
              'attraction',
              savedAttractionPOIs  // Pass only saved attractions for filtering
            );
          } catch (error) {
            console.error('Error fetching attraction POIs:', error);
            hasFetchError = true;
          }
        }

        if (hasFetchError) {
          throw new Error('Failed to fetch POIs');
        }

        const allPOIs = [...foodPOIs, ...attractionPOIs];
        const poisString = JSON.stringify(allPOIs);
        
        if (previousPOIsRef.current !== poisString) {
          onPOIsUpdate(allPOIs);
          previousPOIsRef.current = poisString;
        }
        setError(false);
      } catch (error) {
        console.error('Error fetching POIs:', error);
        setError(true);
        onPOIsUpdate([]);
      } finally {
        setLoading(false);
        fetchInProgressRef.current = false;
      }
    };

    fetchPOIs();
  }, [tripData?.city, user?.uid, retryCounter]);

  const retry = useCallback(() => {
    if (tripData) {
      // Clear all trip-related caches for the city
      poiCacheService.clearCity(tripData.city);
      fetchInProgressRef.current = false;
      previousPOIsRef.current = '';
      categoryMapperRef.current = null; // Reset CategoryMapper instance
      setRetryCounter(prev => prev + 1);
      setLoading(true);
      setError(false);
    }
  }, [tripData?.city]);

  return { loading, error, retry };
};