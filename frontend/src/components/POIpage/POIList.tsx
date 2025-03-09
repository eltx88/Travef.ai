//Called by POI Tabs component
import { Button } from "@/components/ui/button";
import type { POI } from '../../Types/InterfaceTypes';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import POICard from './POICard';
import { useState, useEffect } from "react";

interface POIListProps {
    loading: boolean;
    error: string | null;
    pois: POI[];
    isNewCity?: boolean;
    onSavePOI: (poi: POI) => Promise<void>;
    onUnsavePOI: (poiId: string) => Promise<void>;
    onLoadResults?: () => void;
    isPoiSaved: (poiId: string) => boolean;
    tabType: 'saved' | 'explore' | 'search';
    onTabChange?: (tab: 'saved' | 'explore' | 'search') => void;
}
const POIList = ({ 
    loading, 
    error, 
    pois, 
    isNewCity,
    onSavePOI,
    onUnsavePOI, 
    onLoadResults,
    isPoiSaved,
    tabType,
    onTabChange
}: POIListProps) => {
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedPOI, setSelectedPOI] = useState<string | null>(null);
    const poisPerPage = 9; // Show 9 POIs per page
    
    // Reset to first page when POIs list changes (e.g., due to filtering)
    useEffect(() => {
        setCurrentPage(1);
    }, [pois.length]);

    if (isNewCity) {
        return (
            <div className="flex flex-col items-center justify-center h-48 space-y-4">
                <p className="text-gray-500">Change detected to a new city</p>
                <Button 
                    className="flex items-center gap-2" 
                    onClick={onLoadResults}
                    disabled={loading}
                >
                    <Search className="h-4 w-4" />
                    {loading ? 'Loading...' : 'Load Results'}
                </Button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-500 p-4">
                Error: {error}
            </div>
        );
    }

    if (pois.length === 0) {
        if(tabType === 'saved') {
        return (
            <div className="flex flex-col items-center justify-center h-48 space-y-4">
                <div className="text-gray-500 text-center p-4">
                    No saved places found.
                </div>
                <Button 
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 rounded-lg transition-colors" 
                    onClick={() => onTabChange && onTabChange('explore')}
                >
                    <Search className="h-4 w-4" />
                    Explore Places
                </Button>
            </div>
            );
        }
        if(tabType === 'search') {
            return (
                <div className="text-gray-500 text-center p-4">
                    {loading ? 'Searching...' : 'No search results found. Try adjusting your search terms.'}
                </div>
            );
        }
        if(tabType === 'explore') {
            return (
                <div className="text-gray-500 text-center p-4">
                    No results found.
                </div>
            );
        }
    }

    // Calculate pagination values
    const totalPages = Math.ceil(pois.length / poisPerPage);
    const indexOfLastPOI = currentPage * poisPerPage;
    const indexOfFirstPOI = indexOfLastPOI - poisPerPage;
    const currentPOIs = pois.slice(indexOfFirstPOI, indexOfLastPOI);

    // Handle pagination
    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
            window.scrollTo(0, 0);
        }
    };

    const goToPreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
            window.scrollTo(0, 0);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {currentPOIs.map((poi) => (
                    <POICard
                        key={poi.id}
                        {...poi}
                        isSelected={selectedPOI === poi.id}
                        onSave={() => onSavePOI(poi)}
                        onUnsave={() => onUnsavePOI(poi.id)}
                        onCardClick={(poi) => setSelectedPOI(poi.id)}
                        isSaved={isPoiSaved(poi.id)}
                    />
                ))}
            </div>
            
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                        Showing {indexOfFirstPOI + 1}-{Math.min(indexOfLastPOI, pois.length)} of {pois.length} results
                    </div>
                    <div className="flex space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={goToPreviousPage}
                            disabled={currentPage === 1}
                            className="flex items-center"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                        </Button>
                        <div className="flex items-center space-x-1 px-2">
                            {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
                                // Show limited page numbers with current page in the middle if possible
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
                                    <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? "default" : "outline"}
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => setCurrentPage(pageNum)}
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages}
                            className="flex items-center"
                        >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default POIList;