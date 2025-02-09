import { ItineraryPOI, POI, POIType, UnusedPOIs, RawItineraryData, ItineraryDay, ItineraryTimeSlot, ItineraryPOIData } from '@/Types/InterfaceTypes';

export const processItinerary = (
  itineraryJson: string,
  foodPOIs: POI[],
  attractionPOIs: POI[]
): {
  ItineraryPOIs: ItineraryPOI[];
  unusedPOIs: POI[];
} => {
  if (!itineraryJson) {
    return {
      ItineraryPOIs: [],
      unusedPOIs: [...foodPOIs, ...attractionPOIs],
    };
  }
  
  const poiMap = new Map<string, POI>();
  foodPOIs.forEach(poi => poiMap.set(poi.place_id, poi));
  attractionPOIs.forEach(poi => poiMap.set(poi.place_id, poi));

  try {
    const itineraryData = JSON.parse(itineraryJson) as RawItineraryData;
    const itineraryPOIs: ItineraryPOI[] = [];
    const usedPOIIds = new Set<string>();

    // Process each day in the itinerary
    Object.entries(itineraryData).forEach(([dayKey, dayValue]) => {
      // Skip the "Unused" section
      if (dayKey === 'Unused') return;

      const dayData = dayValue as ItineraryDay;

      Object.entries(dayData).forEach(([timeSlot, timeSlotData]) => {
        // Type assertion for time slot data
        const slotData = timeSlotData as ItineraryTimeSlot;

        Object.entries(slotData.POI).forEach(([poiId, poiData]) => {
          // Type assertion for POI data
          const typedPoiData = poiData as ItineraryPOIData;
          
          let itineraryPOI: ItineraryPOI;
          const basePOI = poiMap.get(poiId);

          if (basePOI) {
            // Known POI with valid place_id
            usedPOIIds.add(poiId);
            itineraryPOI = {
              ...basePOI,
              day: dayKey,
              timeSlot: timeSlot,
              StartTime: typedPoiData.StartTime,
              EndTime: typedPoiData.EndTime,
              duration: typedPoiData.duration
            };
          } else {
            // This is a suggested POI by Groq, minimal info
            itineraryPOI = {
              id: poiId,
              place_id: poiId,
              name: typedPoiData.name,
              coordinates: typedPoiData.coordinates,
              address: '',
              city: '',
              country: '',
              type: typedPoiData.type as POIType,
              day: dayKey,
              timeSlot: timeSlot,
              StartTime: typedPoiData.StartTime,
              EndTime: typedPoiData.EndTime,
              duration: typedPoiData.duration
            };
          }

          itineraryPOIs.push(itineraryPOI);
        });
      });
    });

    // Process unused POIs
    const unusedPOIs: POI[] = [];

    // Add POIs marked as unused in the itinerary
    if ('Unused' in itineraryData) {
      const unusedData = itineraryData.Unused as UnusedPOIs;
      
      // Process unused attractions
      unusedData.Attractions?.forEach(attraction => {
        const poi = poiMap.get(attraction.place_id);
        if (poi) unusedPOIs.push(poi);
      });

      // Process unused restaurants
      unusedData.Restaurants?.forEach(restaurant => {
        const poi = poiMap.get(restaurant.place_id);
        if (poi) unusedPOIs.push(poi);
      });
    }

    // Add any POIs from original lists that weren't used
    [...foodPOIs, ...attractionPOIs].forEach(poi => {
      if (!usedPOIIds.has(poi.place_id) && 
          !unusedPOIs.some(p => p.place_id === poi.place_id)) {
        unusedPOIs.push(poi);
      }
    });

    return {
      ItineraryPOIs: itineraryPOIs,
      unusedPOIs: unusedPOIs,
    };
  } catch (error) {
    console.error('Error processing itinerary:', error);
    return {
      ItineraryPOIs: [],
      unusedPOIs: [...foodPOIs, ...attractionPOIs],
    };
  }
};