import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import type { POI, TripData } from '@/Types/InterfaceTypes';
import TripPOICard from './TripPOICard';

interface TripPOIContainerProps {
  tripData: TripData;
  pois: POI[];
  savedpois: POI[];
}

const ITEMS_PER_PAGE = 6;

const POIGrid = ({ 
  items, 
  currentPage,
  setPage,
  category,
  isSaved = false,
  selectedPOIs,
  onPOISelect,
}: { 
  items: POI[], 
  currentPage: number,
  setPage: (page: number) => void,
  category: 'food' | 'attraction',
  isSaved?: boolean,
  selectedPOIs: Set<string>,
  onPOISelect: (poi: POI) => void,
}) => {
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const pageItems = items.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);

  const hasNext = currentPage < totalPages - 1;
  const hasPrev = currentPage > 0;

  if (items.length === 0) return null;

  return (
    <div className="relative">
      <div className="relative">
        {items.length > ITEMS_PER_PAGE && (
          <Button
            onClick={() => setPage(Math.max(0, currentPage - 1))}
            className={`
              absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 
              rounded-full w-8 h-8 p-0 bg-white border shadow-lg 
              hover:bg-gray-100 transition-opacity duration-200
              ${!hasPrev && 'opacity-50 cursor-not-allowed'}
            `}
            variant="ghost"
            disabled={!hasPrev}
            aria-label="Previous page"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 px-8">
          {pageItems.map((poi) => (
            <TripPOICard
              key={poi.place_id}
              poi={poi}
              isSelected={selectedPOIs.has(poi.place_id)}
              onSelect={onPOISelect}
            />
          ))}
        </div>

        {items.length > ITEMS_PER_PAGE && (
          <Button
            onClick={() => setPage(Math.min(totalPages - 1, currentPage + 1))}
            className={`
              absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 
              rounded-full w-8 h-8 p-0 bg-white border shadow-lg 
              hover:bg-gray-100 transition-opacity duration-200
              ${!hasNext && 'opacity-50 cursor-not-allowed'}
            `}
            variant="ghost"
            disabled={!hasNext}
            aria-label="Next page"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        )}
      </div>

      {items.length > ITEMS_PER_PAGE && (
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-500">
            Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, items.length)} of {items.length}
          </span>
          <span className="text-sm text-gray-500">
            Page {currentPage + 1} of {totalPages}
          </span>
        </div>
      )}

      {pageItems.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No {isSaved ? 'saved' : ''} {category === 'food' ? 'restaurants' : 'attractions'} found.
        </div>
      )}
    </div>
  );
};

const TripPOIContainer = ({ tripData, pois, savedpois }: TripPOIContainerProps) => {
  // Separate page states for explore and saved POIs
  const [currentExploreAttractionPage, setCurrentExploreAttractionPage] = useState(0);
  const [currentExploreFoodPage, setCurrentExploreFoodPage] = useState(0);
  const [currentSavedAttractionPage, setCurrentSavedAttractionPage] = useState(0);
  const [currentSavedFoodPage, setCurrentSavedFoodPage] = useState(0);
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

  const handleSubmit = () => {
    const allPOIs = [...pois, ...savedpois];
    const selectedPOIsList = allPOIs.filter(poi => selectedPOIs.has(poi.place_id));
    console.log('Selected POIs:', selectedPOIs);
    console.log('Selected POIs:', selectedPOIsList);
  };

  return (
    <div className="h-full w-full bg-white rounded-lg overflow-y-auto">
      <div className="sticky top-0 bg-white px-6 py-4 border-b z-10">
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
        {/* Explore Attractions */}
        {attractionPOIs.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Attractions</h3>
            <POIGrid 
              items={attractionPOIs} 
              currentPage={currentExploreAttractionPage}
              setPage={setCurrentExploreAttractionPage}
              category="attraction"
              selectedPOIs={selectedPOIs}
              onPOISelect={handlePOISelect}
            />
          </div>
        )}

        {/* Saved Attractions */}
        {savedAttractPOIs.length > 0 && (
          <div className="mt-8">
            <h4 className="text-lg font-medium mb-4 text-gray-600">Saved Attractions</h4>
            <POIGrid 
              items={savedAttractPOIs} 
              currentPage={currentSavedAttractionPage}
              setPage={setCurrentSavedAttractionPage}
              category="attraction"
              isSaved={true}
              selectedPOIs={selectedPOIs}
              onPOISelect={handlePOISelect}
            />
          </div>
        )}

        {/* Explore Restaurants */}
        {foodPOIs.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Restaurants</h3>
            <POIGrid 
              items={foodPOIs} 
              currentPage={currentExploreFoodPage}
              setPage={setCurrentExploreFoodPage}
              category="food"
              selectedPOIs={selectedPOIs}
              onPOISelect={handlePOISelect}
            />
          </div>
        )}
  
        {/* Saved Restaurants */}  
        {savedFoodPOIs.length > 0 && (
          <div className="mt-8">
            <h4 className="text-lg font-medium mb-4 text-gray-600">Saved Restaurants</h4>
            <POIGrid 
              items={savedFoodPOIs} 
              currentPage={currentSavedFoodPage}
              setPage={setCurrentSavedFoodPage}
              category="food"
              isSaved={true}
              selectedPOIs={selectedPOIs}
              onPOISelect={handlePOISelect}
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