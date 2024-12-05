import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation as useRouterLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../firebase/firebase';
import { useLocation } from '@/contexts/LocationContext';
import type { SearchCity, POI, POIType } from '@/Types/InterfaceTypes';
import { usePOIData } from '@/components/hooks/usePOIData';
import searchCitiesData from 'cities.json';
import POITabs from '@/components/POI/POITabs';
import CitySearch from '../CitySearchBar';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Pen } from 'lucide-react';
import { poiCacheService } from '../hooks/poiCacheService';

interface POIContainerProps {
    onPOIsUpdate: (pois: POI[]) => void;
}

type TabType = 'saved' | 'explore';
type CategoryType = POIType | 'all';

const citiesData: SearchCity[] = searchCitiesData as SearchCity[];

const POIContainer = ({ onPOIsUpdate }: POIContainerProps) => {
    const navigate = useNavigate();
    const routerLocation = useRouterLocation();
    const { currentCity, updateLocation } = useLocation();
    const { user, loading: authLoading } = useAuthStore();
    const fetchInProgressRef = useRef(false);
    const [isEditing, setIsEditing] = useState(false);
    const [nameFilter, setNameFilter] = useState('');
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
    } = usePOIData(user, currentCity);

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
                    Number(cityData.lng),
                    Number(cityData.lat)
                );
                
                navigate(routerLocation.pathname, {
                    state: {
                        city: newCity,
                        lat: Number(cityData.lat),
                        lng: Number(cityData.lng),
                        initialized: true
                    },
                    replace: true
                });

                setIsEditing(false);
                setNameFilter('');
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
        setLoading
    ]);

    const filteredItems = useMemo(() => {
        return currentItems.filter(poi => {
            const matchesName = poi.name.toLowerCase().includes(nameFilter.toLowerCase());
            const matchesCategory = categoryFilter === 'all' || poi.type === categoryFilter;
            return matchesName && matchesCategory;
        });
    }, [currentItems, nameFilter, categoryFilter]);

    useEffect(() => {
        onPOIsUpdate(filteredItems);
    }, [filteredItems, onPOIsUpdate]);

    const showPagination = filteredItems.length > 0;

    return (
        <div className="h-full w-full bg-white p-6 rounded-lg overflow-y-auto">
            {isEditing ? (
                <div className="mb-6">
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
                </div>
            )}

            <POITabs
                activeTab={activeTab}
                onTabChange={handleTabChange}
                nameFilter={nameFilter}
                categoryFilter={categoryFilter}
                onNameFilterChange={setNameFilter}
                onCategoryFilterChange={handleCategoryChange}
                loading={loading}
                error={error}
                pois={filteredItems}
                isNewCity={isNewCity}
                onLoadResults={handleLoadResults}
                onSavePOI={savePOI}
                onUnsavePOI={unsavePOI}
                isPoiSaved={isPoiSaved}
            />

            {showPagination && (
                <div className="mt-6 flex items-center justify-between border-t pt-4">
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
            )}

            {/* {showLoadMore && (
                <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={handleLoadMore}
                    disabled={loading}
                >
                    {loading ? 'Loading...' : 'Load More Results'}
                </Button>
            )} */}
        </div>
    );
};

export default POIContainer;