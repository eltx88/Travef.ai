//Called by the CustomTripPages.tsx using a callback function which then passes the data to TripPOIContainer.tsx for it to display
import { useEffect, useState, useRef, useCallback } from 'react';
import type { TripData, POI, UserHistoryPoint  } from '@/Types/InterfaceTypes';
import { CategoryMapper } from '@/components/TripPage/CategoryMapper';
import { poiCacheService } from './poiCacheService';
import ApiClient from '@/Api/apiClient';

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

  //Filter function to remove duplicates
  const filterUniquePOIs = (explorePOIs: POI[], savedPOIs: POI[]): POI[] => {
    const savedPlaceIds = new Set(savedPOIs.map(poi => poi.place_id));
    
    // Filter out any POIs that exist in saved POIs
    return explorePOIs.filter(poi => !savedPlaceIds.has(poi.place_id));
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

        // Then Fetch Explore POIs(suggestions) based on trip preferences
        const categoryMapper = new CategoryMapper();
        const { foodCategories, attractionCategories } = 
          await categoryMapper.getCategoryMappings(tripData);

        let foodPOIs: POI[] = [];
        let attractionPOIs: POI[] = [];
        let hasFetchError = false;

        // Food POIs
        if (foodCategories) {
          try {
            const fetchedFoodPOIs = await apiClient.getExplorePOIs({
              city: tripData.city,
              coordinates: tripData.coordinates,
              category: foodCategories,
              type: 'restaurant',
              limit: 30
            });
            
            foodPOIs = filterUniquePOIs(fetchedFoodPOIs, savedPoisData);
            
          } catch (error) {
            console.error('Error fetching food POIs:', error);
            hasFetchError = true;
          }
        }

        if (attractionCategories) {
          try {
            const fetchedAttractionPOIs = await apiClient.getExplorePOIs({
              city: tripData.city,
              coordinates: tripData.coordinates,
              category: attractionCategories,
              type: 'attraction',
              limit: 30
            });

            attractionPOIs = filterUniquePOIs(fetchedAttractionPOIs, savedPoisData);
            
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