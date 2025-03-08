//Called by POI Container
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { POI } from '../../Types/InterfaceTypes';
import POIList from './POIList';
import POIFilters from './POIFilters';

interface POITabsProps {
    activeTab: 'saved' | 'explore';
    onTabChange: (tab: 'saved' | 'explore') => void;
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
}: POITabsProps) => {
    return (
        <Tabs
            defaultValue="saved"
            value={activeTab}
            onValueChange={(value) => {
                if (!loading) {
                    onTabChange(value as 'saved' | 'explore');
                }
            }}
            className="w-full"
        >
            <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="saved">Saved Places</TabsTrigger>
                <TabsTrigger value="explore">Explore</TabsTrigger>
            </TabsList>

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
                    tabType={activeTab}
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
                    tabType={activeTab}
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