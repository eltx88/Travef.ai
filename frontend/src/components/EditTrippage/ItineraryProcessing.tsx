import { ItineraryPOI, POI, POIType, UnusedPOIs, RawItineraryData, ItineraryDay, ItineraryTimeSlot, ItineraryPOIData } from '@/Types/InterfaceTypes';

function timeStringToMinutes(timeString: string): number {
  try {
      const [hours, minutes] = timeString.split(":").map(Number);
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return -1;
      }
      return hours * 60 + minutes;
  } catch (error) {
    console.error("Error converting time string to minutes:", error);
    return -1;
  }
}

// Helper to create unused POI with numeric values
const createUnusedPOI = (poi: POI): ItineraryPOI => ({
  ...poi,
  day: -1,
  timeSlot: "unused",
  StartTime: -1,
  EndTime: -1,
  duration: -1
});

export const processItinerary = (
  itineraryJson: string,
  foodPOIs: POI[],
  attractionPOIs: POI[]
): {
  ItineraryPOIs: ItineraryPOI[];
  unusedPOIs: ItineraryPOI[];
} => {
  if (!itineraryJson) {
    return {
      ItineraryPOIs: [],
      unusedPOIs: [...foodPOIs, ...attractionPOIs].map(createUnusedPOI)
    };
  }
  
  const poiMap = new Map<string, POI>();
  foodPOIs.forEach(poi => poiMap.set(poi.place_id, poi));
  attractionPOIs.forEach(poi => poiMap.set(poi.place_id, poi));

  try {
    const itineraryData = JSON.parse(itineraryJson) as RawItineraryData;
    const itineraryPOIs: ItineraryPOI[] = [];
    const usedPOIIds = new Set<string>();
    const unusedPOIs: ItineraryPOI[] = [];

    // Process each day in the itinerary
    Object.entries(itineraryData).forEach(([dayKey, dayValue]) => {
      // Skip the "Unused" section
      if (dayKey === 'Unused') return;

      // Extract day number from "Day X" format
      const dayNumber = parseInt(dayKey.split(' ')[1]);
      const dayData = dayValue as ItineraryDay;

      Object.entries(dayData).forEach(([timeSlot, timeSlotData]) => {
        const slotData = timeSlotData as ItineraryTimeSlot;

        Object.entries(slotData.POI).forEach(([poiId, poiData]) => {
          const typedPoiData = poiData as ItineraryPOIData;
          let itineraryPOI: ItineraryPOI;
          const basePOI = poiMap.get(poiId);

          // Convert time strings to minutes
          const startTimeMinutes = timeStringToMinutes(typedPoiData.StartTime);
          const endTimeMinutes = timeStringToMinutes(typedPoiData.EndTime);
          const durationMinutes = endTimeMinutes - startTimeMinutes;

          if (basePOI) {
            usedPOIIds.add(poiId);
            itineraryPOI = {
              ...basePOI,
              day: dayNumber,
              timeSlot: timeSlot,
              StartTime: startTimeMinutes,
              EndTime: endTimeMinutes,
              duration: durationMinutes
            };
          } else {
            // Handle suggested POIs
            itineraryPOI = {
              id: poiId,
              place_id: poiId,
              name: typedPoiData.name,
              coordinates: typedPoiData.coordinates,
              address: '',
              city: '',
              country: '',
              type: typedPoiData.type as POIType,
              day: dayNumber,
              timeSlot: timeSlot,
              StartTime: startTimeMinutes,
              EndTime: endTimeMinutes,
              duration: durationMinutes
            };
          }

          itineraryPOIs.push(itineraryPOI);
        });
      });
    });

    // Process unused POIs
    if ('Unused' in itineraryData) {
      const unusedData = itineraryData.Unused as UnusedPOIs;

      // Process unused attractions
      unusedData.Attractions?.forEach(attraction => {
        const poi = poiMap.get(attraction.place_id);
        if (poi) unusedPOIs.push({
          ...poi,
          day: -1,
          timeSlot: "unused",
          StartTime: -1,
          EndTime: -1,
          duration: 0.5
        });
      });

      // Process unused restaurants
      unusedData.Restaurants?.forEach(restaurant => {
        const poi = poiMap.get(restaurant.place_id);
        if (poi) unusedPOIs.push({
          ...poi,
          day: -1,
          timeSlot: "unused",
          StartTime: -1,
          EndTime: -1,
          duration: 0.5
        });
      });
    }
    return {
      ItineraryPOIs: itineraryPOIs,
      unusedPOIs: unusedPOIs,
    };
  } catch (error) {
    console.error('Error processing itinerary:', error);
    return {
      ItineraryPOIs: [],
      unusedPOIs: []
    };
  }
};