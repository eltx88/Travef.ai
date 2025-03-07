import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import ItineraryDayContainer from './ItineraryDayContainer';
import type { ItineraryPOI, TripData } from '@/Types/InterfaceTypes';
import { Info, Download } from 'lucide-react';
import { generateItineraryPDF } from '@/utils/pdfGenerator';
import { toast } from 'react-hot-toast';

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
  const [isExporting, setIsExporting] = useState(false);

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

  // Function to handle PDF export
  const handleExport = useCallback(() => {
    try {
      setIsExporting(true);
      generateItineraryPDF(pois, tripData);
      toast.success('Itinerary exported successfully!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export itinerary. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [pois, tripData]);

  return (
    <Card className="w-full h-[calc(100vh-7rem)] overflow-hidden bg-white p-6 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Trip Itinerary</h2>
            <div className="relative group">
              <button 
                className="w-5 h-5 rounded-full text-font-bold bg-blue-200 text-gray-600 flex items-center justify-center hover:bg-gray-300 focus:outline-none"
                aria-label="Itinerary information"
              >
                <Info className="h-3 w-3 text-black" />
              </button>
              <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-white shadow-lg rounded-md border border-gray-200 text-sm text-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                Drag and resize places to adjust timetable. 
                Click and hold to move items, or resize the edges to adjust the duration.
                Refresh the page to reset the itinerary.
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            {tripData.city.charAt(0).toUpperCase() + tripData.city.slice(1)}, {tripData.country.charAt(0).toUpperCase() + tripData.country.slice(1)}
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
          <div className="sticky bottom-4 right-0 w-full flex justify-left mt-4 gap-4">
            <button 
              className={`px-6 py-3 rounded-lg shadow-lg transition-colors duration-200 flex items-center gap-2
                ${isSaving 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'} 
                text-white`}
              onClick={saveItinerary}
              disabled={isSaving}
            >
              <span>{isSaving ? 'Saving...' : 'Save and Exit'}</span>
            </button>
            
            {/* Export Button */}
            <button 
              className={`px-6 py-3 rounded-lg shadow-lg transition-colors duration-200 flex items-center gap-2
                ${isExporting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'} 
                text-white`}
              onClick={handleExport}
              disabled={isExporting}
            >
              <Download className="h-4 w-4" />
              <span>{isExporting ? 'Exporting...' : 'Export PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ItineraryView;