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

interface POIContainerProps {
    onPOIsUpdate: (pois: POI[]) => void;
    onAllPOIsUpdate: (pois: POI[]) => void;
    onTabChange: (tab: TabType) => void;
    searchTerm?: string;
}

type TabType = 'saved' | 'explore';
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
    const [ratingFilter, setRatingFilter] = useState<number | null>(null); // New rating filter state
    const [activeTab, setActiveTab] = useState<TabType>('saved');
    const [isNewCity, setIsNewCity] = useState(false);
    const [savedCategoryFilter, setSavedCategoryFilter] = useState<CategoryType>('all');
    const [exploreCategoryFilter, setExploreCategoryFilter] = useState<POIType>('attraction');
    const categoryFilter = activeTab === 'saved' ? savedCategoryFilter : exploreCategoryFilter;
    const {
        loading,
        error,
        fetchSavedPOIs,
        fetchExplorePOIs,
        setLoading,
        savePOI,
        unsavePOI,
        isPoiSaved,
        refreshSaved,
        setRefreshSaved,
        savedPois,
        explorePois
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

    // Get all POIs regardless of pagination or filtering
    const allPOIs = useMemo(() => {
        return activeTab === 'saved' ? savedPois : explorePois;
    }, [activeTab, savedPois, explorePois]);

    // Update displayed (filtered) POIs
    const filteredPOIs = useMemo(() => {
        // Apply filters to the POIs
        let filtered = activeTab === 'saved' ? savedPois : explorePois;
        
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
        onPOIsUpdate(filteredPOIs);
    }, [filteredPOIs, onPOIsUpdate]);

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
                    nameFilter={nameFilter}
                    categoryFilter={categoryFilter}
                    ratingFilter={ratingFilter}
                    onNameFilterChange={setNameFilter}
                    onCategoryFilterChange={handleCategoryChange}
                    onRatingFilterChange={handleRatingFilterChange}
                    loading={loading}
                    error={error}
                    pois={filteredPOIs}
                    isNewCity={isNewCity}
                    onLoadResults={handleLoadResults}
                    onSavePOI={savePOI}
                    onUnsavePOI={unsavePOI}
                    isPoiSaved={isPoiSaved}
                />
            </div>
        </div>
    );
};

export default POIContainer;