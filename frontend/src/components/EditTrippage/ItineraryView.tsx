import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import ItineraryDayContainer from './ItineraryDayContainer';
import type { ItineraryPOI, TripData } from '@/Types/InterfaceTypes';

interface ItineraryViewProps {
  itineraryPOIs: ItineraryPOI[];
  tripData: TripData;
  updateItineraryPOIs?: (updatedPOIs: ItineraryPOI[]) => void;
}

const ItineraryView = ({ 
  itineraryPOIs, 
  tripData,
  updateItineraryPOIs 
}: ItineraryViewProps) => {
  const [pois, setPois] = useState<ItineraryPOI[]>([]);

  useEffect(() => {
    setPois(itineraryPOIs);
  }, [itineraryPOIs]);

  // Handle POI updates
  const handlePOIUpdate = useCallback((updatedPOI: ItineraryPOI) => {
    const newPOIs = itineraryPOIs.map(poi => 
      poi.id === updatedPOI.id ? updatedPOI : poi
    );
    
    // Only update through parent to maintain single source of truth
    if (updateItineraryPOIs) {
      updateItineraryPOIs(newPOIs);
    }
  }, [itineraryPOIs, updateItineraryPOIs]);

  // Generate dynamic itinerary day containers
  const dayContainers = Array.from({ length: tripData.monthlyDays }, (_, i) => {
    const dayNumber = i + 1;
    const dayKey = `Day ${dayNumber}`;
    const dayPOIs = pois.filter((poi) => poi.day === dayKey);

    return (
      <ItineraryDayContainer
        key={dayKey}
        dayNumber={dayNumber}
        pois={dayPOIs}
        tripData={tripData}
        onUpdatePOI={handlePOIUpdate}
      />
    );
  });

  return (
    <Card className="w-2/3 h-[calc(100vh-7rem)] overflow-hidden bg-white p-6 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold">Trip Itinerary</h2>
          <p className="text-sm text-gray-600">
            {tripData.city}, {tripData.country}
          </p>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-11rem)] rounded-md border">
        <div className="overflow-auto">
          {dayContainers}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default ItineraryView;