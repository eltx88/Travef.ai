import { useMemo, useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { TripData, ItineraryPOI } from '@/Types/InterfaceTypes';
import { cn } from "@/lib/utils";
import ItineraryPOICard from './ItineraryPOICard';
import { Calendar, Star, Landmark, UtensilsCrossed, Search, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ApiClient from '@/Api/apiClient';
import { useAuthStore } from '@/firebase/firebase';
import { toast } from 'react-hot-toast';

type TabType = 'itinerary' | 'saved' | 'search';

interface ItineraryPointsProps {
  tripData: TripData;
  itineraryPOIs: ItineraryPOI[];
  unusedPOIs: ItineraryPOI[];
  onAddToItinerary: (poi: ItineraryPOI, day: number) => void;
  onDeleteSavedPOI: (poi: ItineraryPOI) => void;
  onDeleteItineraryPOI: (poi: ItineraryPOI) => void;
  isRightExpanded?: boolean;
}

const ItineraryPoints = ({ 
  tripData,
  itineraryPOIs,
  unusedPOIs,
  onAddToItinerary,
  onDeleteSavedPOI,
  onDeleteItineraryPOI,
  isRightExpanded = false,
}: ItineraryPointsProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('itinerary');
  const [filterDay, setFilterDay] = useState<string>('all'); 
  const [filterTimeSlot, setFilterTimeSlot] = useState<string>('all');
  const [currentItineraryPage, setCurrentItineraryPage] = useState(1);
  const [currentSavedAttractionsPage, setCurrentSavedAttractionsPage] = useState(1);
  const [currentSavedRestaurantsPage, setCurrentSavedRestaurantsPage] = useState(1);
  const [searchCategory, setSearchCategory] = useState<'attraction' | 'restaurant'>('attraction');
  const [searchNameFilter, setSearchNameFilter] = useState('');
  const [searchRatingFilter, setSearchRatingFilter] = useState<number | null>(null);
  const [searchSortByRating, setSearchSortByRating] = useState(false);
  const [currentSearchPage, setCurrentSearchPage] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ItineraryPOI[]>([]);
  const { user } = useAuthStore();
  const itemsPerPage = 6;
  
  const savedAttractions = unusedPOIs.filter(poi => poi.type === 'attraction');
  const savedRestaurants = unusedPOIs.filter(poi => poi.type !== 'attraction');

  // Memoize day options to prevent unnecessary recalculations
  const dayOptions = useMemo(() => 
    Array.from({ length: tripData.monthlyDays }, (_, i) => i + 1),
    [tripData.monthlyDays]
  );

  // Create API client
  const apiClient = new ApiClient({
    getIdToken: async () => {
      if (!user) throw new Error('Not authenticated');
      return user.getIdToken();
    }
  });

  // Filter and sort itinerary POIs using memoization
  const filteredItineraryPOIs = useMemo(() => {
    let filtered = itineraryPOIs.filter(poi => {
      const matchesDay = filterDay === 'all' || poi.day === Number(filterDay);
      const matchesTimeSlot = filterTimeSlot === 'all' || 
        poi.timeSlot?.toLowerCase() === filterTimeSlot.toLowerCase();
      return matchesDay && matchesTimeSlot;
    });
    
    return filtered.sort((a, b) => {
      // When showing all days, sort by day first, then by start time
      if (filterDay === 'all') {
        // First sort by day
        if (a.day !== b.day) {
          return a.day - b.day;
        }
        
        // Then sort by start time (earlier times first)
        return (a.StartTime || '') < (b.StartTime || '') ? -1 : 1;
      } 
      // When filtering by a specific day, sort only by start time
      else {
        // Sort by start time (earlier times first)
        return (a.StartTime || '') < (b.StartTime || '') ? -1 : 1;
      }
    });
  }, [itineraryPOIs, filterDay, filterTimeSlot]);

  // Apply pagination to itinerary POIs
  const paginatedItineraryPOIs = useMemo(() => {
    const startIndex = (currentItineraryPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredItineraryPOIs.slice(startIndex, endIndex);
  }, [filteredItineraryPOIs, currentItineraryPage, itemsPerPage]);

  // Apply pagination to saved attractions
  const paginatedSavedAttractions = useMemo(() => {
    const startIndex = (currentSavedAttractionsPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return savedAttractions.slice(startIndex, endIndex);
  }, [savedAttractions, currentSavedAttractionsPage, itemsPerPage]);

  // Apply pagination to saved restaurants
  const paginatedSavedRestaurants = useMemo(() => {
    const startIndex = (currentSavedRestaurantsPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return savedRestaurants.slice(startIndex, endIndex);
  }, [savedRestaurants, currentSavedRestaurantsPage, itemsPerPage]);

  // Handle search submission
  const handleSearch = useCallback(async () => {
    if (!searchText.trim()) {
      toast.error("Please enter a search term");
      return;
    }
    
    if (!tripData.coordinates) {
      toast.error("Location coordinates are missing");
      return;
    }
    
    try {
      setIsSearching(true);
      
      // Get the coordinates from trip data
      const { lat, lng } = tripData.coordinates;
      
      // Make the API call without type filtering - we'll filter results client-side
      const results = await apiClient.getTextSearchPlaces(
        searchText,
        lat,
        lng,
        2000,
        tripData.city,
        tripData.country,
        undefined,
        20,
        false
      );
      
      // Create a Set of existing place_ids for efficient lookup
      const existingPlaceIds = new Set([
        ...itineraryPOIs.map(poi => poi.place_id),
        ...unusedPOIs.map(poi => poi.place_id)
      ].filter(id => id));
      
      // Only filter out duplicates, don't filter by category here
      const filteredResults = results.filter(poi => 
        !existingPlaceIds.has(poi.place_id)
      );
      
      // Convert POI results to ItineraryPOI format
      const formattedResults: ItineraryPOI[] = filteredResults.map(poi => {
        return {
          ...poi,
          id: poi.place_id,
          place_id: poi.place_id,
          StartTime: -1,
          EndTime: -1,
          day: -1,
          duration: -1,
          timeSlot: '',
          type: poi.type,
          city: tripData.city,
          country: tripData.country
        };
      });
      
      // Store raw results without filtering or sorting
      setSearchResults(formattedResults);
      setCurrentSearchPage(1);
      
      if (formattedResults.length === 0) {
        toast.error("No results found. Try adjusting your search terms.");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search places. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }, [
    searchText, 
    tripData.coordinates,
    tripData.city,
    tripData.country, 
    apiClient,
    itineraryPOIs,
    unusedPOIs
  ]);

  // Apply name filter, rating filter, and sorting to search results
  const filteredSearchResults = useMemo(() => {
    // First apply all filters to search results
    let filtered = searchResults;
    
    // Apply category filter - this ensures consistent filtering with other filters
    if (searchCategory === 'attraction') {
      filtered = filtered.filter(poi => poi.type === 'attraction');
    } else if (searchCategory === 'restaurant') {
      filtered = filtered.filter(poi => poi.type === 'restaurant' || poi.type === 'cafe');
    }
    
    // Apply name filter if provided
    if (searchNameFilter) {
      const lowerCaseFilter = searchNameFilter.toLowerCase();
      filtered = filtered.filter(
        poi => poi.name.toLowerCase().includes(lowerCaseFilter)
      );
    }
    
    // Apply rating filter if set
    if (searchRatingFilter) {
      filtered = filtered.filter(poi => (poi.rating || 0) >= searchRatingFilter);
    }
    
    // Filter out POIs that are already in the itinerary OR in the unusedPOIs (saved) list
    const existingPlaceIds = new Set([
      ...itineraryPOIs.map(poi => poi.place_id),
      ...unusedPOIs.map(poi => poi.place_id)
    ].filter(id => id));
    
    filtered = filtered.filter(poi => !existingPlaceIds.has(poi.place_id));
    
    // Apply sorting by rating if enabled
    let sortedResults = [...filtered];
    if (searchSortByRating) {
      sortedResults.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    
    return sortedResults;
  }, [
    searchResults, 
    searchCategory, 
    searchNameFilter, 
    searchRatingFilter, 
    searchSortByRating,
    itineraryPOIs,
    unusedPOIs
  ]);

  // Then apply pagination to filtered results
  const paginatedSearchResults = useMemo(() => {
    const startIndex = (currentSearchPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredSearchResults.slice(startIndex, endIndex);
  }, [filteredSearchResults, currentSearchPage, itemsPerPage]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentItineraryPage(1);
  }, [filterDay, filterTimeSlot]);
  
  // Reset pagination when tab changes
  useEffect(() => {
    setCurrentItineraryPage(1);
    setCurrentSavedAttractionsPage(1);
    setCurrentSavedRestaurantsPage(1);
    setCurrentSearchPage(1);
  }, [activeTab]);

  // Reset pagination when search filters change
  useEffect(() => {
    setCurrentSearchPage(1);
  }, [searchNameFilter, searchRatingFilter, searchSortByRating]);

  // Handle Enter key press in search box
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Add pagination component
  const PaginationControls = ({ 
    currentPage, 
    setCurrentPage, 
    totalItems 
  }: { 
    currentPage: number, 
    setCurrentPage: (page: number) => void, 
    totalItems: number 
  }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex justify-between items-center mt-4 pt-2 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}-
          {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
        </div>
        <div className="flex space-x-2">
          <button
            className="px-2 py-1 text-sm rounded border border-gray-300 disabled:opacity-50"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
              // Show limited page numbers
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = idx + 1;
              } else if (currentPage <= 3) {
                pageNum = idx + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + idx;
              } else {
                pageNum = currentPage - 2 + idx;
              }
              
              return (
                <button
                  key={pageNum}
                  className={`w-8 h-8 rounded-md flex items-center justify-center text-sm
                    ${currentPage === pageNum 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'border border-gray-300'
                    }`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          <button
            className="px-2 py-1 text-sm rounded border border-gray-300 disabled:opacity-50"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  // Add these new states for the animation
  const [showAddedAnimation, setShowAddedAnimation] = useState(false);
  
  // Simplified handler that doesn't increment a counter
  const handleAddToItinerary = useCallback((poi: ItineraryPOI, day: number) => {
    // Show animation when adding from either search tab OR saved tab
    if (activeTab === 'search' || activeTab === 'saved') {
      // Show the animation
      setShowAddedAnimation(true);
      
      // Hide animation after 2 seconds
      setTimeout(() => {
        setShowAddedAnimation(false);
      }, 2000);
    }
    
    // Call the original handler
    onAddToItinerary(poi, day);
  }, [activeTab, onAddToItinerary]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'itinerary':
        return (
          <div className="space-y-4">
            <div className="flex gap-4 bg-white z-50">
              <Select 
                value={filterDay}
                onValueChange={setFilterDay}
              >
                <SelectTrigger className="w-40 bg-white">
                  <SelectValue placeholder="Filter by Day" />
                </SelectTrigger>
                <SelectContent className="z-[100] bg-white">
                  <SelectItem value="all">All Days</SelectItem>
                  {dayOptions.map((day) => (
                    <SelectItem key={day} value={day.toString()}>{`Day ${day}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={filterTimeSlot}
                onValueChange={setFilterTimeSlot}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by Time" />
                </SelectTrigger>
                <SelectContent className="z-[100] bg-white">
                  <SelectItem value="all">All Times</SelectItem>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                </SelectContent>
              </Select>
            </div>
                
            <div className={`grid ${isRightExpanded ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} gap-4`}>
              {paginatedItineraryPOIs.map((poi) => (
                <ItineraryPOICard
                  key={poi.id}
                  poi={poi}
                  onDeleteItineraryPOI={onDeleteItineraryPOI}
                />
              ))}
            </div>
            
            <PaginationControls 
              currentPage={currentItineraryPage} 
              setCurrentPage={setCurrentItineraryPage} 
              totalItems={filteredItineraryPOIs.length} 
            />
          </div>
        );
      case 'saved':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium sticky top-0 bg-white z-10 pb-2">
              Saved Attractions
            </h3>
            <div className={`grid ${isRightExpanded ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} gap-4`}>
              {paginatedSavedAttractions.map((poi) => (
                <ItineraryPOICard
                  key={poi.id}
                  poi={poi}
                  dayOptions={dayOptions}
                  onAddToItinerary={handleAddToItinerary}
                  onDeleteSavedPOI={onDeleteSavedPOI}
                />
              ))}
            </div>
            
            <PaginationControls 
              currentPage={currentSavedAttractionsPage} 
              setCurrentPage={setCurrentSavedAttractionsPage} 
              totalItems={savedAttractions.length} 
            />

            <h3 className="text-lg font-medium sticky top-0 bg-white z-10 pb-2">
              Saved Restaurants and Cafes
            </h3>
            <div className={`grid ${isRightExpanded ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} gap-4`}>
              {paginatedSavedRestaurants.map((poi) => (
                <ItineraryPOICard
                  key={poi.id}
                  poi={poi}
                  dayOptions={dayOptions}
                  onAddToItinerary={handleAddToItinerary}
                  onDeleteSavedPOI={onDeleteSavedPOI}
                />
              ))}
            </div>
            
            <PaginationControls 
              currentPage={currentSavedRestaurantsPage} 
              setCurrentPage={setCurrentSavedRestaurantsPage} 
              totalItems={savedRestaurants.length} 
            />
          </div>
        );
      case 'search':
        return (
          <div className="space-y-4">
            <div className="flex flex-col space-y-4">
              <div className="flex gap-4 items-center">
                <Select 
                  defaultValue="attraction"
                  onValueChange={(value) => setSearchCategory(value as 'attraction' | 'restaurant')}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="z-[100] bg-white">
                    <SelectItem value="attraction">
                      <div className="flex items-center">
                        <Landmark className="w-4 h-4 mr-2 text-blue-600" />
                        <span>Attractions</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="restaurant">
                      <div className="flex items-center">
                        <UtensilsCrossed className="w-4 h-4 mr-2 text-orange-600" />
                        <span>Restaurants & Cafes</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Filter by name..."
                    value={searchNameFilter}
                    onChange={(e) => setSearchNameFilter(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                  {searchNameFilter && (
                    <button 
                      onClick={() => setSearchNameFilter('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Search bar for text search */}
              <div className="flex gap-2 mt-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder={`Search for places in ${tripData.city.charAt(0).toUpperCase() + tripData.city.slice(1)}...`}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full px-3 py-2 border rounded-md"
                    disabled={isSearching}
                  />
                  {searchText && !isSearching && (
                    <button 
                      onClick={() => setSearchText('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  )}
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isSearching || !searchText.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2"
                >
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Search
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Min Rating:</span>
                  <Select 
                    value={searchRatingFilter ? searchRatingFilter.toString() : "any"}
                    onValueChange={(value) => setSearchRatingFilter(value === "any" ? null : Number(value))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Rating" />
                    </SelectTrigger>
                    <SelectContent className="z-[100] bg-white">
                      <SelectItem value="any">Any Rating</SelectItem>
                      <SelectItem value="3">
                        <div className="flex items-center">
                          <div className="flex mr-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <Star className="w-4 h-4 fill-transparent text-gray-300" />
                            <Star className="w-4 h-4 fill-transparent text-gray-300" />
                          </div>
                          <span className="text-sm">3.0+</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="3.5">
                        <div className="flex items-center">
                          <div className="flex mr-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <Star className="w-4 h-4 fill-yellow-400/50 text-yellow-400" />
                            <Star className="w-4 h-4 fill-transparent text-gray-300" />
                          </div>
                          <span className="text-sm">3.5+</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="4">
                        <div className="flex items-center">
                          <div className="flex mr-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <Star className="w-4 h-4 fill-transparent text-gray-300" />
                          </div>
                          <span className="text-sm">4.0+</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="4.5">
                        <div className="flex items-center">
                          <div className="flex mr-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <Star className="w-4 h-4 fill-yellow-400/50 text-yellow-400" />
                          </div>
                          <span className="text-sm">4.5+</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Sort by rating</span>
                  <input 
                    type="checkbox" 
                    checked={searchSortByRating}
                    onChange={(e) => setSearchSortByRating(e.target.checked)}
                    className="w-4 h-4"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              {/* Search results */}
              {isSearching ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                  <p className="text-gray-600">Searching for places...</p>
                </div>
              ) : filteredSearchResults.length > 0 ? (
                <div className={`grid ${isRightExpanded ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} gap-4`}>
                  {paginatedSearchResults.map((poi) => (
                    <ItineraryPOICard
                      key={poi.id}
                      poi={poi}
                      dayOptions={dayOptions}
                      onAddToItinerary={handleAddToItinerary}
                    />
                  ))}
                </div>
              ) : searchText && !isSearching ? (
                <div className="text-center text-gray-500 py-8">
                  No results found. Try adjusting your search terms.
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Enter a search term to find places to add to your itinerary.
                </div>
              )}
              
              {/* Pagination for search results */}
              {filteredSearchResults.length > 0 && (
                <PaginationControls 
                  currentPage={currentSearchPage} 
                  setCurrentPage={setCurrentSearchPage} 
                  totalItems={filteredSearchResults.length}
                />
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <Card className="w-full h-full overflow-hidden bg-white rounded-lg flex flex-col">
      <div className="sticky top-0 bg-white px-6 py-4 border-b z-20">
        <h2 className="text-2xl font-semibold">{tripData.city.charAt(0).toUpperCase() + tripData.city.slice(1)}</h2>
        {tripData.fromDT && tripData.toDT && (
          <div className="flex items-center gap-2 text-gray-600 mt-2">
            <Calendar className="w-4 h-4" />
            <span>
              {tripData.fromDT?.toLocaleDateString("en-UK")} - {tripData.toDT?.toLocaleDateString("en-UK")}
            </span>
          </div>
        )}
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as TabType)}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <div className="px-6 pt-6 bg-white sticky top-0 z-10">
          <TabsList 
            className={cn(
              "h-12 w-full bg-gray-100 p-1",
              "grid grid-cols-3 items-center",
              "rounded-lg"
            )}
          >
            <TabsTrigger 
              value="itinerary"
              className={cn(
                "rounded-md text-sm font-medium transition-all",
                "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700",
                "data-[state=active]:shadow-none",
                "h-10",
                "text-gray-600 hover:text-blue-700",
                "relative"
              )}
            >
              Itinerary
              {showAddedAnimation && (
                <div className="absolute -top-2 -right-2 flex items-center justify-center">
                  <div className="animate-bounce-fade bg-blue-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                    +1
                  </div>
                </div>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="saved"
              className={cn(
                "rounded-md text-sm font-medium transition-all",
                "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700",
                "data-[state=active]:shadow-none",
                "h-10",
                "text-gray-600 hover:text-blue-700"
              )}
            >
              Saved ({unusedPOIs.length})
            </TabsTrigger>
            <TabsTrigger 
              value="search"
              className={cn(
                "rounded-md text-sm font-medium transition-all",
                "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700",
                "data-[state=active]:shadow-none",
                "h-10",
                "text-gray-600 hover:text-blue-700"
              )}
            >
              Search
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <TabsContent 
              value="itinerary" 
              className="mt-0 data-[state=inactive]:hidden"
            >
              {activeTab === 'itinerary' && renderTabContent()}
            </TabsContent>

            <TabsContent 
              value="saved" 
              className="mt-0 data-[state=inactive]:hidden"
            >
              {activeTab === 'saved' && renderTabContent()}
            </TabsContent>

            <TabsContent 
              value="search" 
              className="mt-0 data-[state=inactive]:hidden"
            >
              {activeTab === 'search' && renderTabContent()}
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </Card>
  );
};

export default ItineraryPoints;