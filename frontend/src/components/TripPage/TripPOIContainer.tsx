//Used in CustomTripPage.tsx
import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight, Star } from "lucide-react";
import type { ItineraryPOI, POI, TripData, POIType } from '@/Types/InterfaceTypes';
import TripPOICard from './TripPOICard';
import { useNavigate } from 'react-router-dom';
import { TripGenerationService } from './TripGenerationService';
import { useAuthStore } from '@/firebase/firebase';
import ApiClient from '@/Api/apiClient';
import { processItinerary } from './ItineraryProcessing';
import { toast } from 'react-hot-toast';
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { useDebounce } from "../hooks/debounce";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Landmark, UtensilsCrossed, Coffee } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface TripPOIContainerProps {
  tripData: TripData;
  pois: POI[];
  savedpois: POI[];
  setIsGenerating: (loading: boolean) => void;
  searchTerm?: string;
  categoryFilter?: POIType;
  onCategoryChange?: (category: POIType) => void;
  onFilteredPOIsChange?: (filteredPOIs: POI[]) => void;
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
  category: 'food' | 'attraction' | 'cafe',
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

const TripPOIContainer = ({ 
  tripData, 
  pois, 
  savedpois, 
  setIsGenerating,
  searchTerm = '',
  categoryFilter = 'attraction',
  onCategoryChange,
  onFilteredPOIsChange
}: TripPOIContainerProps) => {
  // Separate page states for explore and saved POIs
  const [currentExploreAttractionPage, setCurrentExploreAttractionPage] = useState(0);
  const [currentExploreFoodPage, setCurrentExploreFoodPage] = useState(0);
  const [currentSavedAttractionPage, setCurrentSavedAttractionPage] = useState(0);
  const [currentSavedFoodPage, setCurrentSavedFoodPage] = useState(0);
  const [currentSavedCafePage, setCurrentSavedCafePage] = useState(0);
  const [selectedPOIs, setSelectedPOIs] = useState<Set<string>>(new Set());
  
  // Replace separate filters with a single filter and a category selector
  const [nameFilter, setNameFilter] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<POIType>(categoryFilter);
  
  // Single debounced filter
  const debouncedNameFilter = useDebounce(nameFilter, 300);

  // Add rating filter states
  const [minRatingFilter, setMinRatingFilter] = useState<number | null>(null);
  const [sortByRating, setSortByRating] = useState<boolean>(false);
  
  // Update name filter when searchTerm changes
  useEffect(() => {
    if (searchTerm) {
      setNameFilter(searchTerm);
    }
  }, [searchTerm]);

  // Apply filters to POI lists
  const filterAndSortPOIs = (pois: POI[], nameFilter: string) => {
    // First filter by name
    let filteredPOIs = pois;
    if (nameFilter.trim()) {
      const lowerFilter = nameFilter.toLowerCase().trim();
      filteredPOIs = filteredPOIs.filter(poi => 
        poi.name.toLowerCase().includes(lowerFilter)
      );
    }
    
    // Filter by minimum rating if set
    if (minRatingFilter !== null) {
      filteredPOIs = filteredPOIs.filter(poi => 
        (poi.rating !== undefined && poi.rating !== null && poi.rating >= minRatingFilter)
      );
    }
    
    // Sort by rating if enabled
    if (sortByRating) {
      filteredPOIs = [...filteredPOIs].sort((a, b) => {
        const ratingA = a.rating ?? 0;
        const ratingB = b.rating ?? 0;
        return ratingB - ratingA; // Descending order (highest first)
      });
    }
    
    return filteredPOIs;
  };
  
  // Get POIs filtered by type and name
  const explorePOIs = useMemo(() => {
    return filterAndSortPOIs(
      pois.filter(poi => poi.type === selectedCategory),
      debouncedNameFilter
    );
  }, [pois, selectedCategory, debouncedNameFilter, minRatingFilter, sortByRating]);
  
  const savedPOIs = useMemo(() => {
    return filterAndSortPOIs(
      savedpois.filter(poi => poi.type === selectedCategory),
      debouncedNameFilter
    );
  }, [savedpois, selectedCategory, debouncedNameFilter, minRatingFilter, sortByRating]);
  
  // Reset pagination when filters or category changes
  useEffect(() => {
    setCurrentExploreAttractionPage(0);
    setCurrentSavedAttractionPage(0);
    setCurrentExploreFoodPage(0);
    setCurrentSavedFoodPage(0);
    setCurrentSavedCafePage(0);
  }, [debouncedNameFilter, selectedCategory, minRatingFilter, sortByRating]);

  // Get all POIs of the selected category for the map view
  const allVisiblePOIs = useMemo(() => {
    return [...explorePOIs, ...savedPOIs];
  }, [explorePOIs, savedPOIs]);

  const { user } = useAuthStore();

    const handlePOISelect = (poi: POI) => {
    const newSelected = new Set(selectedPOIs);
    if (newSelected.has(poi.place_id)) {
      newSelected.delete(poi.place_id);
    } else {
      newSelected.add(poi.place_id);
    }
    setSelectedPOIs(newSelected);
  };

  //Navigate to edit page after submitting
  const navigate = useNavigate();
  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please login to continue");
      return;
    }
  
    // Get all POIs (both explore and saved) of each category
    const allAttractionPOIs = [...pois.filter(poi => poi.type === 'attraction'), ...savedpois.filter(poi => poi.type === 'attraction')];
    const allFoodPOIs = [...pois.filter(poi => poi.type === 'restaurant'), ...savedpois.filter(poi => poi.type === 'restaurant')];
    const allCafePOIs = [...pois.filter(poi => poi.type === 'cafe'), ...savedpois.filter(poi => poi.type === 'cafe')];
    
    // Filter to only include selected POIs
    const selectedAttractionPOIs = allAttractionPOIs.filter(poi => selectedPOIs.has(poi.place_id));
    const selectedFoodPOIs = allFoodPOIs.filter(poi => selectedPOIs.has(poi.place_id));
    const selectedCafePOIs = allCafePOIs.filter(poi => selectedPOIs.has(poi.place_id));

    // Create shortened POIs for each category
    const shortenedSelectedAttractionPOIs = selectedAttractionPOIs.map(poi => ({
      place_id: poi.place_id,
      name: poi.name,
      type: poi.type,
      coordinates: {
        lat: poi.coordinates.lat,
        lng: poi.coordinates.lng
      }
    }));
    
    const shortenedSelectedFoodPOIs = selectedFoodPOIs.map(poi => ({
      place_id: poi.place_id,
      name: poi.name,
      type: poi.type,
      coordinates: {
        lat: poi.coordinates.lat,
        lng: poi.coordinates.lng
      }
    }));
    
    const shortenedSelectedCafePOIs = selectedCafePOIs.map(poi => ({
      place_id: poi.place_id,
      name: poi.name,
      type: poi.type,
      coordinates: {
        lat: poi.coordinates.lat,
        lng: poi.coordinates.lng
      }
    }));

    setIsGenerating(true);

    try {
      const allSelectedPOIs = [...selectedAttractionPOIs, ...selectedFoodPOIs, ...selectedCafePOIs];
      const apiClient = new ApiClient({
        getIdToken: async () => user.getIdToken()
      });
      const generationService = new TripGenerationService(apiClient);
      const generatedTrip = await generationService.generateTrip(
        tripData, 
        shortenedSelectedAttractionPOIs,
        shortenedSelectedFoodPOIs,
        shortenedSelectedCafePOIs
      );
      // Process the generated json itinerary and return itineraryPOIs and unusedPOIs
      const processedItinerary = processItinerary(
        generatedTrip.itinerary, 
        selectedFoodPOIs, 
        allVisiblePOIs
      );

      // Remove duplicates from generated itinerary
      const uniqueItineraryPOIs = Array.from(
        new Map(processedItinerary.ItineraryPOIs.map(poi => [poi.place_id, poi])).values()
      );
      const uniqueUnusedPOIs = Array.from(
        new Map(processedItinerary.unusedPOIs.map(poi => [poi.place_id, poi])).values()
      );

      // Create map for all returned POIs from trip generation service
      const returnedPOIsMap = new Map<string, ItineraryPOI>();
      uniqueItineraryPOIs.forEach(poi => returnedPOIsMap.set(poi.place_id, poi));
      uniqueUnusedPOIs.forEach(poi => returnedPOIsMap.set(poi.place_id, poi));

      // Find selected POIs that were not returned in either list
      const missingPOIs = allSelectedPOIs.filter(poi => !returnedPOIsMap.has(poi.place_id));

      // Convert missing POIs to ItineraryPOI format with default values
      const missingItineraryPOIs = missingPOIs.map((poi: POI) => ({
        ...poi,
        day: -1,
        timeSlot: "unused",
        StartTime: -1,
        EndTime: -1,
        duration: -1
      } as ItineraryPOI));

      // Add missing POIs to uniqueUnusedPOIs
      if (missingItineraryPOIs.length > 0) {
        uniqueUnusedPOIs.push(...missingItineraryPOIs);
      }

      // Create a comprehensive map of all POIs we already have details for
      // const knownPOIsMap = new Map<string, POI | ItineraryPOI>();

      // Add selected POIs to the known POIs map
      // allSelectedPOIs.forEach(poi => knownPOIsMap.set(poi.place_id, poi));

      // // Filter newly suggested POIs from the Trip Generation Service(ones we don't already have details for)
      // const itineraryPOIsToFetch = uniqueItineraryPOIs.filter(poi => !knownPOIsMap.has(poi.place_id));
      // const unusedPOIsToFetch = uniqueUnusedPOIs.filter(poi => !knownPOIsMap.has(poi.place_id));

      // // Get enhanced details only for POIs we don't already have
      // let enhancedItineraryPOIs = uniqueItineraryPOIs.map(poi => 
      //   knownPOIsMap.has(poi.place_id) ? { ...knownPOIsMap.get(poi.place_id), ...poi } : poi
      // );
      // let enhancedUnusedPOIs = uniqueUnusedPOIs.map(poi => 
      //   knownPOIsMap.has(poi.place_id) ? { ...knownPOIsMap.get(poi.place_id), ...poi } : poi
      // );

      // Only fetch if there are new POIs to get details for
      // if (itineraryPOIsToFetch.length > 0 || unusedPOIsToFetch.length > 0) {
      //   const [fetchedItineraryPOIs, fetchedUnusedPOIs] = await Promise.all([
      //     itineraryPOIsToFetch.length > 0 
      //       ? apiClient.getBatchPlaceDetails(itineraryPOIsToFetch, tripData.city, tripData.country) 
      //       : [],
      //     unusedPOIsToFetch.length > 0
      //       ? apiClient.getBatchPlaceDetails(unusedPOIsToFetch, tripData.city, tripData.country)
      //       : []
      //   ]);

        const [fetchedItineraryPOIs, fetchedUnusedPOIs] = await Promise.all([
          uniqueItineraryPOIs.length > 0 
            ? apiClient.getBatchPlaceDetails(uniqueItineraryPOIs, tripData.city, tripData.country) 
            : [],
          uniqueUnusedPOIs.length > 0
            ? apiClient.getBatchPlaceDetails(uniqueUnusedPOIs, tripData.city, tripData.country)
            : []
        ]);
        // Create a mapping of fetched POIs by place_id
        // const fetchedItineraryMap = new Map(fetchedItineraryPOIs.map(poi => [poi.place_id, poi]));
        // const fetchedUnusedMap = new Map(fetchedUnusedPOIs.map(poi => [poi.place_id, poi]));
        
        // Update final POI lists with fetched data when available
        // enhancedItineraryPOIs = enhancedItineraryPOIs.map(poi => 
        //   fetchedItineraryMap.has(poi.place_id && poi.address) ? { ...poi, ...fetchedItineraryMap.get(poi.place_id) } : poi
        // );
        
        // enhancedUnusedPOIs = enhancedUnusedPOIs.map(poi => 
        //   fetchedUnusedMap.has(poi.place_id && poi.address) ? { ...poi, ...fetchedUnusedMap.get(poi.place_id) } : poi
        // );
      // }

      navigate('/edit-trip', {
        state: {
          itineraryPOIs: fetchedItineraryPOIs,
          unusedPOIs: fetchedUnusedPOIs,
          tripData: tripData,
          trip_doc_id: ""
        }
      });
    } catch (error) {
      console.error('Failed to generate trip:', error);
      toast.error("Failed to generate trip. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  //Select All Saved POI button logic
  const getSavedPOIIds = (pois: POI[]): Set<string> => {
    return new Set(pois.map(poi => poi.place_id));
  };
  
  const handleSelectAllSavedCategory = (categoryPOIs: POI[]) => {
  const categoryIds = getSavedPOIIds(categoryPOIs);
  const areAllSelected = [...categoryIds].every(id => selectedPOIs.has(id));
    
  const newSelected = new Set(selectedPOIs);
    if (areAllSelected) {
      categoryIds.forEach(id => newSelected.delete(id));
    } else {
      categoryIds.forEach(id => newSelected.add(id));
    }
    setSelectedPOIs(newSelected);
  };

  // Render the name filter input
  const renderNameFilter = () => (
    <div className="relative mb-4 flex gap-3">
      <Input
        placeholder="Search locations..."
        value={nameFilter}
        onChange={(e) => setNameFilter(e.target.value)}
        className="w-full bg-white border-gray-200 focus-visible:ring-blue-500 pr-8"
      />
      {nameFilter && (
        <button
          type="button"
          onClick={() => setNameFilter('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
  // Category dropdown options
  const categoryOptions = [
    { value: 'attraction' as POIType, label: 'Attractions', icon: Landmark },
    { value: 'restaurant' as POIType, label: 'Restaurants', icon: UtensilsCrossed },
    { value: 'cafe' as POIType, label: 'Cafes', icon: Coffee },
  ];

  // Render category selection dropdown
  const renderCategorySelector = () => (
    <div className="mb-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-gray-700">Category:</h2>
        <Select
          value={selectedCategory}
          onValueChange={(value: POIType) => handleCategoryChange(value)}
        >
          <SelectTrigger className="w-[160px] bg-white border-gray-200">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {categoryOptions.map(({ value, label, icon: Icon }) => (
              <SelectItem 
                key={value} 
                value={value}
                className="cursor-pointer"
              >
                <span className="flex items-center">
                  {Icon && <Icon className="mr-2 h-4 w-4" />}
                  {label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // Render the rating filter UI
  const renderRatingFilter = () => (
    <div className="mb-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between bg-white border-gray-200 text-gray-800 hover:bg-gray-50"
          >
            <span>
              {minRatingFilter ? `${minRatingFilter}+ Stars` : "Rating"} 
              {sortByRating && " (Sorted)"}
            </span>
            <div className="flex items-center">
              {minRatingFilter && (
                <div className="flex mr-2">
                  {[...Array(Math.floor(minRatingFilter))].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                  ))}
                  {minRatingFilter % 1 > 0 && (
                    <div className="relative">
                      <Star className="h-3.5 w-3.5 text-yellow-500" />
                      <Star 
                        className="absolute top-0 left-0 h-3.5 w-3.5 text-yellow-500 fill-yellow-500 overflow-hidden" 
                        style={{ 
                          clipPath: `polygon(0 0, ${(minRatingFilter % 1) * 100}% 0, ${(minRatingFilter % 1) * 100}% 100%, 0 100%)` 
                        }} 
                      />
                    </div>
                  )}
                </div>
              )}
              <ChevronRight className="h-4 w-4" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Filter by Minimum Rating</h4>
            <div className="space-y-2">
              <RadioGroup 
                value={minRatingFilter === null ? "none" : minRatingFilter.toString()} 
                onValueChange={(value) => {
                  if (value === "none") {
                    setMinRatingFilter(null);
                  } else {
                    setMinRatingFilter(parseFloat(value));
                  }
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="r-none" />
                  <Label htmlFor="r-none">No minimum</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="4.7" id="r-4.7" />
                  <Label htmlFor="r-4.7" className="flex items-center">
                    <span className="flex">
                      {[...Array(4)].map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                      ))}
                      <div className="relative">
                        <Star className="h-3.5 w-3.5 text-yellow-500" />
                        <Star 
                          className="absolute top-0 left-0 h-3.5 w-3.5 text-yellow-500 fill-yellow-500 overflow-hidden" 
                          style={{ clipPath: 'polygon(0 0, 70% 0, 70% 100%, 0 100%)' }} 
                        />
                      </div>
                    </span>
                    <span className="ml-2">4.7+ stars</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="4.5" id="r-4.5" />
                  <Label htmlFor="r-4.5" className="flex items-center">
                    <span className="flex">
                      {[...Array(4)].map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                      ))}
                      <div className="relative">
                        <Star className="h-3.5 w-3.5 text-yellow-500" />
                        <Star 
                          className="absolute top-0 left-0 h-3.5 w-3.5 text-yellow-500 fill-yellow-500 overflow-hidden" 
                          style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }} 
                        />
                      </div>
                    </span>
                    <span className="ml-2">4.5+ stars</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="4" id="r-4" />
                  <Label htmlFor="r-4" className="flex items-center">
                    <span className="flex">
                      {[...Array(4)].map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                      ))}
                      <Star className="h-3.5 w-3.5 text-gray-300" />
                    </span>
                    <span className="ml-2">4.0+ stars</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="3.5" id="r-3.5" />
                  <Label htmlFor="r-3.5" className="flex items-center">
                    <span className="flex">
                      {[...Array(3)].map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                      ))}
                      <div className="relative">
                        <Star className="h-3.5 w-3.5 text-yellow-500" />
                        <Star 
                          className="absolute top-0 left-0 h-3.5 w-3.5 text-yellow-500 fill-yellow-500 overflow-hidden" 
                          style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }} 
                        />
                      </div>
                      <Star className="h-3.5 w-3.5 text-gray-300" />
                    </span>
                    <span className="ml-2">3.5+ stars</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="sort-rating">Sort by highest rating</Label>
                <input 
                  type="checkbox" 
                  id="sort-rating"
                  checked={sortByRating}
                  onChange={(e) => setSortByRating(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="pt-2 flex justify-end">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setMinRatingFilter(null);
                  setSortByRating(false);
                }}
                className="text-red-600 hover:text-red-800 hover:bg-red-50"
              >
                Reset filters
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );

  // Keep local state in sync with prop
  useEffect(() => {
    setSelectedCategory(categoryFilter);
  }, [categoryFilter]);
  
  // When selecting a category, notify parent component
  const handleCategoryChange = (category: POIType) => {
    setSelectedCategory(category);
    if (onCategoryChange) {
      onCategoryChange(category);
    }
  };

  // Notify parent when filtered POIs change
  useEffect(() => {
    if (onFilteredPOIsChange) {
      onFilteredPOIsChange(allVisiblePOIs);
    }
  }, [allVisiblePOIs, onFilteredPOIsChange]);

  return (
    <div className="h-full w-full bg-white rounded-lg overflow-y-auto">
      <div className="sticky top-0 bg-white px-6 py-4 border-b z-10">
        <h2 className="text-2xl font-semibold">{tripData.city}</h2>
        {tripData.fromDT && tripData.toDT && (
          <div className="flex items-center gap-2 text-gray-600 mt-2">
            <Calendar className="w-4 h-4" />
            <span>
              {tripData.fromDT?.toLocaleDateString("en-GB")} - {tripData.toDT?.toLocaleDateString("en-GB")}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 px-6">
        {/* Filters - add rating filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div>
            {renderCategorySelector()}
          </div>
          <div>
            {renderRatingFilter()}
          </div>
        </div>
        {renderNameFilter()}

        {/* Explore POIs of Selected Category */}
        {explorePOIs.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">
              {selectedCategory === 'attraction' ? 'Suggested Attractions for you' : 
               selectedCategory === 'restaurant' ? 'Suggested Restaurants for you' : 'Suggested Cafes for you'}
            </h3>
            <POIGrid 
              items={explorePOIs} 
              currentPage={
                selectedCategory === 'attraction' ? currentExploreAttractionPage : 
                selectedCategory === 'restaurant' ? currentExploreFoodPage : 
                currentSavedCafePage
              }
              setPage={
                selectedCategory === 'attraction' ? setCurrentExploreAttractionPage : 
                selectedCategory === 'restaurant' ? setCurrentExploreFoodPage :
                setCurrentSavedCafePage
              }
              category={selectedCategory as 'food' | 'attraction' | 'cafe'}
              selectedPOIs={selectedPOIs}
              onPOISelect={handlePOISelect}
            />
          </div>
        )}

        {/* Saved POIs of Selected Category */}
        {savedPOIs.length > 0 && (
          <div className="mt-8">
            <div className="inline-flex items-center gap-3 mb-6">
              <h4 className="text-lg font-medium text-gray-600">
                Saved {selectedCategory === 'attraction' ? 'Attractions' : 
                       selectedCategory === 'restaurant' ? 'Restaurants' : 'Cafes'}
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectAllSavedCategory(savedPOIs)}
                className={`
                  transition-colors duration-200 h-8
                  ${[...getSavedPOIIds(savedPOIs)].every(id => selectedPOIs.has(id))
                    ? 'border-red-500 text-red-600 hover:bg-red-50'
                    : 'border-blue-500 text-blue-600 hover:bg-blue-50'
                  }
                `}
              >
                {[...getSavedPOIIds(savedPOIs)].every(id => selectedPOIs.has(id))
                  ? "Unselect All"
                  : "Select All"}
              </Button>
            </div>
            <POIGrid 
              items={savedPOIs} 
              currentPage={
                selectedCategory === 'attraction' ? currentSavedAttractionPage : 
                selectedCategory === 'restaurant' ? currentSavedFoodPage :
                currentSavedCafePage
              }
              setPage={
                selectedCategory === 'attraction' ? setCurrentSavedAttractionPage : 
                selectedCategory === 'restaurant' ? setCurrentSavedFoodPage :
                setCurrentSavedCafePage
              }
              category={selectedCategory as 'food' | 'attraction' | 'cafe'}
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
          onClick={handleSubmit}
        >
          Create Itinerary with Selected Places ({selectedPOIs.size})
        </Button>
      </div>
    </div>
  );
};

export default TripPOIContainer;