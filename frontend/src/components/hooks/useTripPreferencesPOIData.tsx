//Called by the CustomTripPages.tsx
import { useEffect, useState, useRef, useCallback } from 'react';
import type { TripData, POI } from '@/Types/InterfaceTypes';
import { CategoryMapper } from '@/components/TripPage/CategoryMapper';
import { poiCacheService } from './poiCacheService';
import ApiClient from '@/Api/apiClient';

export const useTripPreferencesPOIData = (
  tripData: TripData, 
  user: any,
  onPOIsUpdate: (pois: POI[]) => void
) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCounter, setRetryCounter] = useState(0);  // Add this
  const fetchInProgressRef = useRef(false);
  const previousPOIsRef = useRef<string>('');

  useEffect(() => {
    const fetchPOIs = async () => {
      if (!user || !tripData || fetchInProgressRef.current) return;

      try {
        fetchInProgressRef.current = true;
        setLoading(true);
        setError(false);

        const categoryMapper = new CategoryMapper();
        const { foodCategories, attractionCategories } = 
          await categoryMapper.getCategoryMappings(tripData);

        let foodPOIs: POI[] = [];
        let attractionPOIs: POI[] = [];
        let hasFetchError = false;

        const apiClient = new ApiClient({
          getIdToken: async () => user.getIdToken()
        });

        // Food POIs
        if (foodCategories) {
          try {
            foodPOIs = await apiClient.getExplorePOIs({
              city: tripData.city,
              coordinates: tripData.coordinates,
              category: foodCategories,
              type: 'restaurant',
              limit: 30
            });
          } catch (error) {
            console.error('Error fetching food POIs:', error);
            hasFetchError = true;
          }
        }

        // Attraction POIs
        if (attractionCategories) {
          try {
            attractionPOIs = await apiClient.getExplorePOIs({
              city: tripData.city,
              coordinates: tripData.coordinates,
              category: attractionCategories,
              type: 'attraction',
              limit: 30
            });
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
  }, [tripData?.city, user?.uid, retryCounter]); // Add retryCounter as dependency

  const retry = useCallback(() => {
    if (tripData) {
      poiCacheService.clearCity(tripData.city);
      fetchInProgressRef.current = false;
      previousPOIsRef.current = '';
      setRetryCounter(prev => prev + 1); // Increment retry counter to trigger re-fetch
      setLoading(true);
      setError(false);
    }
  }, [tripData?.city]);

  return { loading, error, retry };
};