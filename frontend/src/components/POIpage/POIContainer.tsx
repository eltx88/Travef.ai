import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation as useRouterLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../firebase/firebase';
import { useLocation } from '@/contexts/LocationContext';
import type { SearchCity, POI, POIType } from '@/Types/InterfaceTypes';
import { usePOIData } from '@/components/hooks/usePOIData';
import searchCitiesData from 'cities.json';
import POITabs from '@/components/POIpage/POITabs';
import CitySearch from '../CitySearchBar';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Pen } from 'lucide-react';
import { poiCacheService } from '../hooks/poiCacheService';

interface POIContainerProps {
    onPOIsUpdate: (pois: POI[]) => void;
    onAllPOIsUpdate?: (pois: POI[]) => void;
}

type TabType = 'saved' | 'explore';
type CategoryType = POIType | 'all';

const citiesData: SearchCity[] = searchCitiesData as SearchCity[];

const POIContainer = ({ onPOIsUpdate, onAllPOIsUpdate }: POIContainerProps) => {
    const navigate = useNavigate();
    const routerLocation = useRouterLocation();
    const { currentCity, coordinates, currentCountry, updateLocation } = useLocation();
    const { user, loading: authLoading } = useAuthStore();
    const fetchInProgressRef = useRef(false);
    const [isEditing, setIsEditing] = useState(false);
    const [nameFilter, setNameFilter] = useState('');
    const [ratingFilter, setRatingFilter] = useState<number | null>(null); // New rating filter state
    const [activeTab, setActiveTab] = useState<TabType>('saved');
    const [isNewCity, setIsNewCity] = useState(false);
    const [savedCategoryFilter, setSavedCategoryFilter] = useState<CategoryType>('all');
    const [exploreCategoryFilter, setExploreCategoryFilter] = useState<POIType>('hotel');
    const categoryFilter = activeTab === 'saved' ? savedCategoryFilter : exploreCategoryFilter;
    const {
        loading,
        error,
        fetchSavedPOIs,
        fetchExplorePOIs,
        explorePagination,
        savedPagination,
        setLoading,
        savePOI,
        unsavePOI,
        isPoiSaved,
        refreshSaved,
        setRefreshSaved,
        savedPois,
        explorePois
    } = usePOIData(user, currentCity, currentCountry);

    const currentPagination = activeTab === 'saved' ? savedPagination : explorePagination;
    const { nextPage, prevPage, totalPages, currentPage, currentItems } = currentPagination;

    // Effect for initial data load and auth
    useEffect(() => {
        if (!user || !currentCity || authLoading || fetchInProgressRef.current) return;
        
        const loadData = async () => {
            try {
                fetchInProgressRef.current = true;
                const cacheKey = `poi_cache_saved_${currentCity}`;
                const cachedData = localStorage.getItem(cacheKey);
                
                if (cachedData) {
                    const { data, timestamp } = JSON.parse(cachedData);
                    // Check if cache is still valid (10 minutes)
                    if (Date.now() - timestamp < 10 * 60 * 1000) {
                        // Use cached data instead of making API call
                        return;
                    }
                }
                
                // Only fetch if no valid cache exists
                if (activeTab === 'saved') {
                    await fetchSavedPOIs();
                }
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                fetchInProgressRef.current = false;
            }
        };

        loadData();
    }, [user, currentCity, authLoading]);

    useEffect(() => {
        const city = routerLocation.state?.city;
        if (city && !routerLocation.state?.initialized) {
            const cityData = citiesData.find(
                (searchCity: SearchCity) => searchCity.name.toLowerCase() === city.toLowerCase()
            );
            
            if (cityData) {
                updateLocation(
                    city,
                    currentCountry,
                    Number(cityData.lng),
                    Number(cityData.lat)
                );
                navigate(routerLocation.pathname, {
                    state: { ...routerLocation.state, initialized: true },
                    replace: true
                });
            }
        }
    }, [routerLocation, updateLocation, navigate]);

    const handleTabChange = useCallback((newTab: TabType) => {
        if (fetchInProgressRef.current) return;
        
        setActiveTab(newTab);
        setNameFilter('');
        setRatingFilter(null);
        
        const fetchData = async () => {
            try {
                fetchInProgressRef.current = true;
                if (newTab === 'explore' && !isNewCity) {
                    const validCache = poiCacheService.getValid(
                        poiCacheService.generateKey.explore(exploreCategoryFilter, currentCity),
                        currentCity
                    );
                    
                    if (!validCache) {
                        await fetchExplorePOIs(exploreCategoryFilter);
                    }
                } else if (newTab === 'saved' && refreshSaved) {
                    const validCache = poiCacheService.getValid(
                        poiCacheService.generateKey.saved(currentCity),
                        currentCity
                    );
                    
                    if (!validCache) {
                        await fetchSavedPOIs();
                    }
                    setRefreshSaved(false); // Reset the flag after fetching
                }
            } finally {
                fetchInProgressRef.current = false;
            }
        };

        fetchData();
    }, [fetchExplorePOIs, fetchSavedPOIs, isNewCity, currentCity, exploreCategoryFilter, refreshSaved, setRefreshSaved]);


    const handleCategoryChange = useCallback((newCategory: CategoryType) => {
        if (fetchInProgressRef.current) return;
        
        if (activeTab === 'explore' && newCategory !== 'all') {
            setExploreCategoryFilter(newCategory as POIType);
            
            if (!isNewCity) {
                const fetchData = async () => {
                    try {
                        fetchInProgressRef.current = true;
                        await fetchExplorePOIs(newCategory as POIType);
                    } finally {
                        fetchInProgressRef.current = false;
                    }
                };
                fetchData();
            }
        } else if (activeTab === 'saved') {
            setSavedCategoryFilter(newCategory);
        }
    }, [activeTab, fetchExplorePOIs, isNewCity]);

    // Handler for rating filter changes
    const handleRatingFilterChange = useCallback((rating: number | null) => {
        setRatingFilter(rating);
    }, []);

    const handleLoadResults = useCallback(async () => {
        if (fetchInProgressRef.current) return;
    
        try {
            fetchInProgressRef.current = true;
            if (activeTab === 'explore') {
                const cacheKey = poiCacheService.generateKey.explore(categoryFilter as POIType, currentCity);
                const validCache = poiCacheService.getValid(cacheKey, currentCity);
                
                if (!validCache) {
                    await fetchExplorePOIs(categoryFilter as POIType);
                }
            } else {
                const cacheKey = poiCacheService.generateKey.saved(currentCity);
                const validCache = poiCacheService.getValid(cacheKey, currentCity);
                
                if (!validCache) {
                    await fetchSavedPOIs();
                }
            }
            setIsNewCity(false);
        } finally {
            fetchInProgressRef.current = false;
        }
    }, [activeTab, categoryFilter, fetchExplorePOIs, fetchSavedPOIs, currentCity]);

    const handleCityChange = useCallback(async (newCity: string) => {
        if (fetchInProgressRef.current) return;

        const cityData = citiesData.find(
            (searchCity: SearchCity) => searchCity.name.toLowerCase() === newCity.toLowerCase()
        );
        
        if (cityData) {
            setLoading(true);
            try {
                fetchInProgressRef.current = true;
                setIsNewCity(true);
                
                await updateLocation(
                    newCity,
                    currentCountry,
                    Number(cityData.lng),
                    Number(cityData.lat)
                );
                
                navigate(routerLocation.pathname, {
                    state: {
                        city: newCity,
                        country: currentCountry,
                        lat: Number(cityData.lat),
                        lng: Number(cityData.lng),
                        initialized: true
                    },
                    replace: true
                });

                setIsEditing(false);
                setNameFilter('');
                setRatingFilter(null); // Reset rating filter when changing city
            } finally {
                fetchInProgressRef.current = false;
                setLoading(false);
            }
        }
    }, [
        updateLocation,
        navigate,
        routerLocation.pathname,
        activeTab,
        fetchSavedPOIs,
        setLoading,
        currentCountry
    ]);

    //Filtering logic
    const filteredItems = useMemo(() => {
        return currentItems.filter(poi => {
            const matchesName = poi.name.toLowerCase().includes(nameFilter.toLowerCase());
            const matchesCategory = categoryFilter === 'all' || poi.type === categoryFilter;
            
            // Apply rating filter if set
            const matchesRating = ratingFilter === null || 
                                 (poi.rating !== undefined && poi.rating >= ratingFilter);
                                 
            return matchesName && matchesCategory && matchesRating;
        });
    }, [currentItems, nameFilter, categoryFilter, ratingFilter]);

    // Get all POIs regardless of pagination or filtering
    const allPOIs = useMemo(() => {
        return activeTab === 'saved' ? savedPois : explorePois;
    }, [activeTab, savedPois, explorePois]);

    // Update displayed (filtered) POIs
    useEffect(() => {
        onPOIsUpdate(filteredItems);
    }, [filteredItems, onPOIsUpdate]);

    // Update all POIs for the map
    useEffect(() => {
        if (onAllPOIsUpdate) {
            onAllPOIsUpdate(allPOIs);
        }
    }, [allPOIs, onAllPOIsUpdate]);

    const showPagination = filteredItems.length > 0;
    
    //Create trip button navigation
    const handleCreateTrip = () => {
        navigate('/createtrip', {
          state: { 
            city: currentCity,
            lat: coordinates.lat,
            lng: coordinates.lng
          }
        });
      };
    return (
        <div className="h-full w-full bg-white rounded-lg flex flex-col overflow-hidden">
            <div className="sticky top-0 bg-white z-10 p-6 pb-2">
                {isEditing ? (
                    <div className="mb-4">
                        <CitySearch
                            initialValue={currentCity}
                            onSubmit={(city) => handleCityChange(city.name)}
                            className="max-w-md"
                            inputClassName="text-2xl font-semibold h-12 bg-transparent"
                            showButton={true}
                            autoFocus={true}
                        />
                    </div>
                ) : (
                    <div className="flex items-center gap-2 mb-4">
                        <h2 className="text-2xl font-semibold">{currentCity}</h2>
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <Pen className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                        </button>
                        <button 
                            onClick={handleCreateTrip}
                            className="bg-blue-600 ml-auto hover:bg-blue-700 text-white font-medium px-3 rounded-lg transition-colors"
                        >
                            Create trip
                        </button>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto px-6">
                <POITabs
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    nameFilter={nameFilter}
                    categoryFilter={categoryFilter}
                    ratingFilter={ratingFilter}
                    onNameFilterChange={setNameFilter}
                    onCategoryFilterChange={handleCategoryChange}
                    onRatingFilterChange={handleRatingFilterChange}
                    loading={loading}
                    error={error}
                    pois={filteredItems}
                    isNewCity={isNewCity}
                    onLoadResults={handleLoadResults}
                    onSavePOI={savePOI}
                    onUnsavePOI={unsavePOI}
                    isPoiSaved={isPoiSaved}
                />
            </div>

            {showPagination && (
                <div className="sticky bottom-0 bg-white z-10 px-6 py-4 border-t">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={prevPage}
                                disabled={currentPage === 1 || loading}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={nextPage}
                                disabled={currentPage === totalPages || loading}
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                        <span className="text-sm text-gray-500">
                            Page {currentPage} of {totalPages}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default POIContainer;