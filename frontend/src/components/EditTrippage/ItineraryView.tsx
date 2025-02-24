import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import ItineraryDayContainer from './ItineraryDayContainer';
import type { ItineraryPOI, TripData } from '@/Types/InterfaceTypes';

interface ItineraryViewProps {
  itineraryPOIs: ItineraryPOI[];
  tripData: TripData;
  updateItineraryPOIs?: (updatedPOIs: ItineraryPOI[]) => void;
  deleteItineraryPOI?: (deletedPOI: ItineraryPOI) => void;
  saveItinerary?: () => void;
  isSaving?: boolean;
}

const ItineraryView = ({ 
  itineraryPOIs, 
  tripData, 
  updateItineraryPOIs, 
  deleteItineraryPOI,
  saveItinerary,
  isSaving
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
    <Card className="w-full h-[calc(100vh-7rem)] overflow-hidden bg-white p-6 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold">Trip Itinerary</h2>
          <p className="text-sm text-gray-600">
            {tripData.city}, {tripData.country}
          </p>
        </div>
      </div>

      <div 
        className="h-[calc(100vh-11rem)] overflow-x-scroll overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100" 
        style={{ 
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'auto',
          msOverflowStyle: 'auto'
        }}
      >
        <div className="min-w-max pb-8">
          <ItineraryDayContainer
            pois={pois}
            tripData={tripData}
            onUpdatePOI={handlePOIUpdate}
            onDeletePOI={handleDeletePOI}
          />
          <div className="sticky bottom-4 right-0 w-full flex justify-left mt-4">
            <button 
              className={`px-6 py-3 rounded-lg shadow-lg transition-colors duration-200 flex items-center gap-2
                ${isSaving 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'} 
                text-white`}
              onClick={saveItinerary}
              disabled={isSaving}
            >
              <span>{isSaving ? 'Saving...' : 'Save Itinerary'}</span>
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ItineraryView;