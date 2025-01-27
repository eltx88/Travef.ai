import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import type { POI, TripData } from '@/Types/InterfaceTypes';
import TripPOICard from './TripPOICard';

interface TripPOIContainerProps {
  tripData: TripData;
  pois: POI[]; //passed from customtrippage.tsx
  savedpois: POI[];
}

const ITEMS_PER_PAGE = 6;

const TripPOIContainer = ({ tripData, pois, savedpois }: TripPOIContainerProps) => {
  const [currentAttractionPage, setCurrentAttractionPage] = useState(0);
  const [currentFoodPage, setCurrentFoodPage] = useState(0);
  const [selectedPOIs, setSelectedPOIs] = useState<Set<string>>(new Set());

  const attractionPOIs = pois.filter(poi => poi.type === 'attraction');
  const foodPOIs = pois.filter(poi => poi.type === 'restaurant');
  const savedAttractPOIs = savedpois.filter(poi => poi.type === 'attraction');
  const savedFoodPOIs = savedpois.filter(poi => poi.type === 'restaurant');

  const handlePOISelect = (poi: POI) => {
    const newSelected = new Set(selectedPOIs);
    if (newSelected.has(poi.place_id)) {
      newSelected.delete(poi.place_id);
    } else {
      newSelected.add(poi.place_id);
    }
    setSelectedPOIs(newSelected);
  };

  //TO DO :: work on this function
  const handleSubmit = () => {
    const selectedPOIsList = pois.filter(poi => selectedPOIs.has(poi.place_id));
    console.log('Selected POIs:', selectedPOIsList);
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

    if (items.length === 0) return null;

    return (
      <div className="relative">
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
    <div className="h-full w-full bg-white rounded-lg overflow-y-auto"> {/* Removed p-6 from here */}
      <div className="sticky top-0 bg-white px-6 py-4 border-b z-10"> {/* Added px-6 here */}
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

      <div className="mt-4 px-6">
        {attractionPOIs.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Attractions</h3>
            <POIGrid 
              items={attractionPOIs} 
              currentPage={currentAttractionPage}
              category="attraction"
            />
            {/* Add saved attractions display */}
            {savedAttractPOIs.length > 0 && (
              <div className="mt-8">
                <h4 className="text-lg font-medium mb-4 text-gray-600">Saved Attractions</h4>
                <POIGrid 
                  items={savedAttractPOIs} 
                  currentPage={currentAttractionPage}
                  category="attraction"
                />
              </div>
            )}
          </div>
        )}
        
        {foodPOIs.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Restaurants</h3>
            <POIGrid 
              items={foodPOIs} 
              currentPage={currentFoodPage}
              category="food"
            />
          </div>
        )}

        {savedFoodPOIs.length > 0 && (
          <div className="mt-8">
            <h4 className="text-lg font-medium mb-4 text-gray-600">Saved Restaurants</h4>
            <POIGrid 
              items={savedFoodPOIs} 
              currentPage={currentFoodPage}
              category="food"
            />
          </div>
        )}
      </div>

      <div className="sticky bottom-0 pt-2 mt-8 z-50">
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