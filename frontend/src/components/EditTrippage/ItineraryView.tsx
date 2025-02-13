import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import ItineraryDayContainer from './ItineraryDayContainer';
import type { ItineraryPOI, TripData } from '@/Types/InterfaceTypes';

interface ItineraryViewProps {
  itineraryPOIs: ItineraryPOI[];
  tripData: TripData;
  updateItineraryPOIs?: (updatedPOIs: ItineraryPOI[]) => void;
  deleteItineraryPOI?: (deletedPOI: ItineraryPOI) => void;
}

const ItineraryView = ({ 
  itineraryPOIs, 
  tripData, 
  updateItineraryPOIs, 
  deleteItineraryPOI 
}: ItineraryViewProps) => {
  const [pois, setPois] = useState<ItineraryPOI[]>([]);

  useEffect(() => {
    setPois(itineraryPOIs);
  }, [itineraryPOIs]);

  const handlePOIUpdate = useCallback((updatedPOI: ItineraryPOI) => {
    const newPOIs = pois.map(poi => 
      poi.id === updatedPOI.id ? updatedPOI : poi
    );
    
    if (updateItineraryPOIs) {
      updateItineraryPOIs(newPOIs);
    }
  }, [pois, updateItineraryPOIs]);

  const handleDeletePOI = useCallback((deletedPOI: ItineraryPOI) => {
    if (deleteItineraryPOI) {
      deleteItineraryPOI(deletedPOI);
    }
  }, [deleteItineraryPOI]);

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

      <div className="h-[calc(100vh-11rem)] overflow-x-auto overflow-y-auto">
        <div className="min-w-[1200px]">
          <ItineraryDayContainer
            pois={pois}
            tripData={tripData}
            onUpdatePOI={handlePOIUpdate}
            onDeletePOI={handleDeletePOI}
          />
        </div>
      </div>
    </Card>
  );
};

export default ItineraryView;