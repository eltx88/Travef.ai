//Called by POI Container
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { POI } from '../../Types/InterfaceTypes';
import POIList from './POIList';
import POIFilters from './POIFilters';
import { useLocation } from '@/contexts/LocationContext';
import { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface POITabsProps {
    activeTab: 'saved' | 'explore' | 'search';
    onTabChange: (tab: 'saved' | 'explore' | 'search') => void;
    nameFilter: string;
    categoryFilter: any;
    ratingFilter: number | null;
    onNameFilterChange: (value: string) => void;
    onCategoryFilterChange: (value: any) => void;
    onRatingFilterChange: (value: number | null) => void;
    sortByRating?: boolean;
    onSortByRatingChange?: (value: boolean) => void;
    loading: boolean;
    error: string | null;
    pois: POI[];
    isNewCity?: boolean;
    onLoadResults?: () => void;
    onSavePOI: (poi: POI) => Promise<void>;
    onUnsavePOI: (poiId: string) => Promise<void>;
    isPoiSaved: (poiId: string) => boolean;
    searchText?: string;
    onSearchTextChange?: (text: string) => void;
    onSearch?: () => void;
    isSearching?: boolean;
}

const POITabs = ({
    activeTab,
    onTabChange,
    nameFilter,
    categoryFilter,
    ratingFilter,
    onNameFilterChange,
    onCategoryFilterChange,
    onRatingFilterChange,
    sortByRating = false,
    onSortByRatingChange,
    loading,
    error,
    pois,
    isNewCity,
    onLoadResults,
    onSavePOI,
    onUnsavePOI,
    isPoiSaved,
    searchText = '',
    onSearchTextChange,
    onSearch,
    isSearching = false,
}: POITabsProps) => {
    const { currentCity } = useLocation();
    const [localSearchText, setLocalSearchText] = useState(searchText);
    
    const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setLocalSearchText(value);
        if (onSearchTextChange) {
            onSearchTextChange(value);
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && onSearch) {
            onSearch();
        }
    };

    useEffect(() => {
        if (activeTab === 'search' && onCategoryFilterChange) {
            onCategoryFilterChange('all');
        }
    }, [activeTab, onCategoryFilterChange]);
    return (
        <Tabs
            defaultValue="saved"
            value={activeTab}
            onValueChange={(value) => {
                if (!loading) {
                    onTabChange(value as 'saved' | 'explore' | 'search');
                }
            }}
            className="w-full"
        >
            <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="saved">Saved Places</TabsTrigger>
                <TabsTrigger value="explore">Explore</TabsTrigger>
                <TabsTrigger value="search">Search</TabsTrigger>
            </TabsList>

            {activeTab === 'search' && (
                <div className="flex gap-2 mb-4">
                    <div className="relative flex-grow">
                        <Input
                            placeholder={`Search for places in ${currentCity}...`}
                            value={localSearchText}
                            onChange={handleSearchInputChange}
                            onKeyDown={handleKeyDown}
                            className="w-full"
                            disabled={isSearching}
                        />
                        {localSearchText && !isSearching && (
                            <button 
                                onClick={() => {
                                    setLocalSearchText('');
                                    if (onSearchTextChange) onSearchTextChange('');
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                ×
                            </button>
                        )}
                    </div>
                    <Button
                        onClick={onSearch}
                        disabled={isSearching || !localSearchText.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2"
                    >
                        {isSearching ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Search className="w-4 h-4" />
                        )}
                        Search
                    </Button>
                </div>
            )}

            <POIFilters
                nameFilter={nameFilter}
                categoryFilter={categoryFilter}
                ratingFilter={ratingFilter}
                onNameFilterChange={onNameFilterChange}
                onCategoryFilterChange={onCategoryFilterChange}
                onRatingFilterChange={onRatingFilterChange}
                sortByRating={sortByRating}
                onSortByRatingChange={onSortByRatingChange}
                tabType={activeTab}
                loading={loading}
            />
            
            <TabsContent value="saved">
                <POIList
                    loading={loading}
                    error={error}
                    pois={pois}
                    tabType="saved"
                    isNewCity={isNewCity}
                    onSavePOI={onSavePOI}
                    onUnsavePOI={onUnsavePOI}
                    onLoadResults={onLoadResults}
                    isPoiSaved={isPoiSaved}
                    onTabChange={onTabChange}
                />
            </TabsContent>

            <TabsContent value="explore">
                <POIList
                    loading={loading}
                    error={error}
                    pois={pois}
                    tabType="explore"
                    isNewCity={isNewCity}
                    onSavePOI={onSavePOI}
                    onUnsavePOI={onUnsavePOI}
                    onLoadResults={onLoadResults}
                    isPoiSaved={isPoiSaved}
                    onTabChange={onTabChange}
                />
            </TabsContent>
            
            <TabsContent value="search">
                <POIList
                    loading={loading}
                    error={error}
                    pois={pois}
                    tabType="search"
                    isNewCity={isNewCity}
                    onSavePOI={onSavePOI}
                    onUnsavePOI={onUnsavePOI}
                    onLoadResults={onLoadResults}
                    isPoiSaved={isPoiSaved}
                    onTabChange={onTabChange}
                />
            </TabsContent>
        </Tabs>
    );
};

export default POITabs;