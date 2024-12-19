import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import type { POI, TripData } from '@/Types/InterfaceTypes';
import TripPOICard from './TripPOICard';

interface TripPOIContainerProps {
  tripData: TripData;
  points: POI[];
}

const ITEMS_PER_PAGE = 6;

const TripPOIContainer = ({ tripData, points }: TripPOIContainerProps) => {
  const [currentAttractionPage, setCurrentAttractionPage] = useState(0);
  const [currentFoodPage, setCurrentFoodPage] = useState(0);
  const [selectedPOIs, setSelectedPOIs] = useState<Set<string>>(new Set());

  const attractionPOIs = points.filter(poi => poi.type === 'attraction');
  const foodPOIs = points.filter(poi => poi.type === 'restaurant');

  const handlePOISelect = (poi: POI) => {
    const newSelected = new Set(selectedPOIs);
    if (newSelected.has(poi.place_id)) {
      newSelected.delete(poi.place_id);
    } else {
      newSelected.add(poi.place_id);
    }
    setSelectedPOIs(newSelected);
  };

  const handleSubmit = () => {
    const selectedPOIsList = points.filter(poi => selectedPOIs.has(poi.place_id));
    console.log('Selected POIs:', selectedPOIsList);
    // TODO: Navigate to next page with selected POIs
  };

  const POIGrid = ({ items, currentPage, category }: { 
    items: POI[], 
    currentPage: number,
    category: 'food' | 'attraction'
  }) => {
    const setPage = category === 'food' ? setCurrentFoodPage : setCurrentAttractionPage;
    const startIndex = currentPage * ITEMS_PER_PAGE;
    const pageItems = items.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);

    const hasNext = currentPage < totalPages - 1;
    const hasPrev = currentPage > 0;

    return (
      <div className="relative my-4">
        <h3 className="text-xl font-semibold mb-4">
          {category === 'food' ? 'Restaurant suggestions for you' : 'Attractions for you'}
        </h3>
        
        <div className="relative">
          <Button
            onClick={() => setPage(prev => Math.max(0, prev - 1))}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 rounded-full w-8 h-8 p-0 bg-white border shadow-lg hover:bg-gray-100"
            variant="ghost"
            disabled={!hasPrev}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 px-8">
            {pageItems.map((poi) => (
              <TripPOICard
                key={poi.place_id}
                poi={poi}
                isSelected={selectedPOIs.has(poi.place_id)}
                onSelect={handlePOISelect}
              />
            ))}
          </div>

          <Button
            onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 rounded-full w-8 h-8 p-0 bg-white border shadow-lg hover:bg-gray-100"
            variant="ghost"
            disabled={!hasNext}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {items.length > 0 && (
          <div className="text-center mt-2 text-sm text-gray-500">
            Page {currentPage + 1} of {totalPages}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full w-full bg-white p-6 rounded-lg overflow-y-auto">
      <div className="sticky top-0 bg-white pt-2 pb-4 border-b z-10">
        <h2 className="text-2xl font-semibold">{tripData.city}</h2>
        {tripData.dateRange && (
          <div className="flex items-center gap-2 text-gray-600 mt-2">
            <Calendar className="w-4 h-4" />
            <span>
              {tripData.dateRange.from?.toLocaleDateString()} - {tripData.dateRange.to?.toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4">
        <POIGrid 
          items={attractionPOIs} 
          currentPage={currentAttractionPage}
          category="attraction"
        />
        
        <POIGrid 
          items={foodPOIs} 
          currentPage={currentFoodPage}
          category="food"
        />
      </div>

      <div className="sticky bottom-0 bg-white pt-4 border-t mt-8">
        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          disabled={selectedPOIs.size === 0}
          onClick={handleSubmit}
        >
          Create Itinerary with Selected Places ({selectedPOIs.size})
        </Button>
      </div>
    </div>
  );
};

export default TripPOIContainer;