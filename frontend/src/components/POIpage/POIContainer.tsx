import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation as useRouterLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../firebase/firebase';
import { useLocation } from '@/contexts/LocationContext';
import type { SearchCity, POI, POIType } from '@/Types/InterfaceTypes';
import { usePOIData } from '@/components/hooks/usePOIData';
import searchCitiesData from 'cities.json';
import POITabs from '@/components/POIpage/POITabs';
import CitySearch from '../CitySearchBar';
import { poiCacheService } from '../hooks/poiCacheService';
import { Pen } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface POIContainerProps {
    onPOIsUpdate: (pois: POI[]) => void;
    onAllPOIsUpdate: (pois: POI[]) => void;
    onTabChange: (tab: TabType) => void;
    searchTerm?: string;
}

type TabType = 'saved' | 'explore' | 'search';
type CategoryType = POIType | 'all';

const citiesData: SearchCity[] = searchCitiesData as SearchCity[];

const POIContainer = ({ onPOIsUpdate, onAllPOIsUpdate, onTabChange, searchTerm = ''}: POIContainerProps) => {
    const navigate = useNavigate();
    const routerLocation = useRouterLocation();
    const { currentCity, currentCountry, coordinates, updateLocation } = useLocation();
    const { user, loading: authLoading } = useAuthStore();
    const fetchInProgressRef = useRef(false);
    const [isEditing, setIsEditing] = useState(false);
    const [nameFilter, setNameFilter] = useState('');
    const [ratingFilter, setRatingFilter] = useState<number | null>(null); // Rating filter state
    const [sortByRating, setSortByRating] = useState<boolean>(false); // Sort by rating state
    const [activeTab, setActiveTab] = useState<TabType>('saved');
    const [isNewCity, setIsNewCity] = useState(false);
    const [savedCategoryFilter, setSavedCategoryFilter] = useState<CategoryType>('all');
    const [exploreCategoryFilter, setExploreCategoryFilter] = useState<POIType>('attraction');
    const [searchText, setSearchText] = useState('');
    const [searchNameFilter, setSearchNameFilter] = useState('');
    const [searchCategoryFilter, setSearchCategoryFilter] = useState<CategoryType>('all');
    const [searchRatingFilter, setSearchRatingFilter] = useState<number | null>(null);
    const [searchSortByRating, setSearchSortByRating] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const categoryFilter = 
        activeTab === 'saved' ? savedCategoryFilter : 
        activeTab === 'explore' ? exploreCategoryFilter : 
        searchCategoryFilter;
    const {
        loading,
        error,
        fetchSavedPOIs,
        fetchExplorePOIs,
        searchPOIs,
        setLoading,
        savePOI,
        unsavePOI,
        isPoiSaved,
        refreshSaved,
        setRefreshSaved,
        savedPois,
        explorePois,
        searchPois,
    } = usePOIData(user, currentCity, currentCountry);

    useEffect(() => {
        if (searchTerm) {
            setNameFilter(searchTerm);
        }
    }, [searchTerm]);
    
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
                        console.log('Using cached POI data for', currentCity);
                        // Update the saved POIs state with cached data
                        if (data && Array.isArray(data)) {
                            onPOIsUpdate(data);
                            return;
                        }
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
        const country = routerLocation.state?.country;
        if (city && !routerLocation.state?.initialized) {
            const cityData = citiesData.find(
                (searchCity: SearchCity) => searchCity.name.toLowerCase() === city.toLowerCase()
            );
            
            if (cityData) {
                updateLocation(
                    city,
                    country,
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
        onTabChange(newTab);
        
        // Reset filters when changing tabs
        if (newTab !== 'search') {
            setSearchNameFilter('');
            setSearchRatingFilter(null);
            setSearchSortByRating(false);
        }
        
        // Reset name filter for other tabs
        if (newTab !== 'saved') {
            setNameFilter('');
        }
        
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
                    setRefreshSaved(false);
                }
            } finally {
                fetchInProgressRef.current = false;
            }
        };

        fetchData();
    }, [fetchExplorePOIs, fetchSavedPOIs, isNewCity, currentCity, exploreCategoryFilter, refreshSaved, setRefreshSaved, onTabChange]);


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

    // Handle city change updated to reset sortByRating
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
                    cityData.country,
                    Number(cityData.lng),
                    Number(cityData.lat)
                );
                
                navigate(routerLocation.pathname, {
                    state: {
                        city: newCity,
                        country: cityData.country,
                        lat: Number(cityData.lat),
                        lng: Number(cityData.lng),
                        initialized: true
                    },
                    replace: true
                });

                setIsEditing(false);
                setNameFilter('');
                setRatingFilter(null);
                setSortByRating(false); // Reset sort by rating when changing city
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

    // Handler for rating filter changes
    const handleRatingFilterChange = (value: number | null) => {
        setRatingFilter(value);
    };

    // Handler for sort by rating toggle
    const handleSortByRatingChange = (value: boolean) => {
        setSortByRating(value);
    };

    // Restore the handleLoadResults function
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

    // Handle search submission
    const handleSearch = useCallback(async () => {
        if (!searchText.trim()) {
            toast.error("Please enter a search term");
            return;
        }
        
        if (!coordinates || !coordinates.lat || !coordinates.lng) {
            toast.error("Location coordinates are missing");
            return;
        }
        
        try {
            setIsSearching(true);
            
            // Call search function without filtering by category - we'll filter results later
            await searchPOIs(
                searchText,
                'all', // Always search for all types
                coordinates.lat,
                coordinates.lng,
                currentCity,
                currentCountry
            );
            
        } catch (error) {
            console.error("Search error:", error);
            toast.error("Failed to search places. Please try again.");
        } finally {
            setIsSearching(false);
        }
    }, [searchText, coordinates, currentCity, currentCountry, searchPOIs]);

    // Filter and sort POIs based on all filters
    const filteredPOIs = useMemo(() => {
        let result: POI[] = [];
        
        // Select base POIs based on active tab
        if (activeTab === 'saved') {
            // Apply category filter for saved POIs
            result = categoryFilter === 'all' 
                ? savedPois 
                : savedPois.filter(poi => poi.type === categoryFilter);
        } else if (activeTab === 'explore') {
            // For explore tab
            result = explorePois;
            
            // Filter out POIs that are already saved
            const savedPoiIds = new Set(savedPois.map(poi => poi.place_id || poi.id));
            result = result.filter(poi => !savedPoiIds.has(poi.place_id) && !savedPoiIds.has(poi.id));
        } else if (activeTab === 'search') {
            // For search tab
            result = searchPois;
            
            // No category filtering for search tab
            
            // Filter out POIs that are already saved
            const savedPoiIds = new Set(savedPois.map(poi => poi.place_id || poi.id));
            result = result.filter(poi => !savedPoiIds.has(poi.place_id) && !savedPoiIds.has(poi.id));
        }

        // Apply name filter based on active tab
        if ((activeTab === 'saved' || activeTab === 'explore') && nameFilter.trim()) {
            const lowerFilter = nameFilter.toLowerCase().trim();
            const filteredResult = result.filter((poi: POI) => 
                poi.name.toLowerCase().includes(lowerFilter)
            );
            result = filteredResult;
        } else if (activeTab === 'search' && searchNameFilter.trim()) {
            const lowerFilter = searchNameFilter.toLowerCase().trim();
            result = result.filter(poi => 
                poi.name.toLowerCase().includes(lowerFilter)
            );
        }

        // Apply rating filter based on active tab
        if ((activeTab === 'saved' || activeTab === 'explore') && ratingFilter !== null) {
            result = result.filter(poi => 
                 (poi.rating !== undefined && poi.rating !== null && poi.rating >= ratingFilter)
            );
        } else if (activeTab === 'search' && searchRatingFilter !== null) {
            result = result.filter(poi => 
                (poi.rating !== undefined && poi.rating !== null && poi.rating >= searchRatingFilter)
            );
        }

        // Apply sorting by rating if enabled
        if ((activeTab === 'saved' || activeTab === 'explore') && sortByRating) {
            result = [...result].sort((a, b) => {
                const ratingA = a.rating ?? 0;
                const ratingB = b.rating ?? 0;
                return ratingB - ratingA;
            });
        } else if (activeTab === 'search' && searchSortByRating) {
            result = [...result].sort((a, b) => {
                const ratingA = a.rating ?? 0;
                const ratingB = b.rating ?? 0;
                return ratingB - ratingA;
            });
        }
        
        return result;
    }, [
        activeTab, 
        categoryFilter, 
        savedPois, 
        explorePois, 
        searchPois, 
        nameFilter,
        searchNameFilter,
        ratingFilter, 
        searchRatingFilter,
        sortByRating,
        searchSortByRating,
        searchCategoryFilter
    ]);

    // Get all POIs regardless of pagination or filtering
    const allPOIs = useMemo(() => {
        if (activeTab === 'saved') return savedPois;
        if (activeTab === 'explore') return explorePois;
        if (activeTab === 'search') return searchPois;
        return [];
    }, [activeTab, savedPois, explorePois, searchPois]);

    // Update displayed (filtered) POIs
    const filteredPOIsForUpdate = useMemo(() => {
        // Apply filters to the POIs
        let filtered = activeTab === 'saved' ? savedPois : explorePois;
        
        // For explore tab, filter out POIs that are already saved
        if (activeTab === 'explore') {
            const savedPoiIds = new Set(savedPois.map(poi => poi.place_id || poi.id));
            filtered = filtered.filter(poi => !savedPoiIds.has(poi.place_id) && !savedPoiIds.has(poi.id));
        }
        
        // Apply name filter
        if (nameFilter) {
            filtered = filtered.filter(poi => 
                poi.name.toLowerCase().includes(nameFilter.toLowerCase())
            );
        }
        
        // Apply rating filter
        if (ratingFilter !== null) {
            filtered = filtered.filter(poi => 
                poi.rating !== undefined && poi.rating >= ratingFilter
            );
        }
        
        // Apply category filter for saved tab
        if (activeTab === 'saved' && savedCategoryFilter !== 'all') {
            filtered = filtered.filter(poi => 
                poi.type === savedCategoryFilter
            );
        }
        
        return filtered;
    }, [savedPois, explorePois, activeTab, nameFilter, ratingFilter, savedCategoryFilter]);

    // Update parent component with filtered POIs
    useEffect(() => {
        onPOIsUpdate(filteredPOIsForUpdate);
    }, [filteredPOIsForUpdate, onPOIsUpdate]);

    // Update all POIs for the map
    useEffect(() => {
        if (onAllPOIsUpdate) {
            onAllPOIsUpdate(allPOIs);
        }
    }, [allPOIs, onAllPOIsUpdate]);

    //Create trip button navigation
    const handleCreateTrip = () => {
        navigate('/createtrip', {
            state: { 
                city: currentCity,
                country: currentCountry,
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
                        <h2 className="text-2xl font-semibold">{currentCity}, {currentCountry}</h2>
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
                    nameFilter={activeTab === 'search' ? searchNameFilter : nameFilter}
                    categoryFilter={categoryFilter}
                    ratingFilter={activeTab === 'search' ? searchRatingFilter : ratingFilter}
                    onNameFilterChange={activeTab === 'search' ? setSearchNameFilter : setNameFilter}
                    onCategoryFilterChange={activeTab === 'search' ? 
                        (value) => setSearchCategoryFilter(value as CategoryType) : 
                        handleCategoryChange
                    }
                    onRatingFilterChange={activeTab === 'search' ? setSearchRatingFilter : handleRatingFilterChange}
                    sortByRating={activeTab === 'search' ? searchSortByRating : sortByRating}
                    onSortByRatingChange={activeTab === 'search' ? setSearchSortByRating : handleSortByRatingChange}
                    loading={loading}
                    error={error}
                    pois={filteredPOIs}
                    isNewCity={isNewCity}
                    onLoadResults={handleLoadResults}
                    onSavePOI={savePOI}
                    onUnsavePOI={unsavePOI}
                    isPoiSaved={isPoiSaved}
                    searchText={searchText}
                    onSearchTextChange={setSearchText}
                    onSearch={handleSearch}
                    isSearching={isSearching}
                />
            </div>
        </div>
    );
};

export default POIContainer;