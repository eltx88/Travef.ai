//Called by POI Tabs component
import { Button } from "@/components/ui/button";
import type { POI } from '../../Types/InterfaceTypes';
import { Search } from 'lucide-react';
import POICard from './POICard';
import { useState } from "react";

interface POIListProps {
    loading: boolean;
    error: string | null;
    pois: POI[];
    isNewCity?: boolean;
    onSavePOI: (poi: POI) => Promise<void>;
    onUnsavePOI: (poiId: string) => Promise<void>;
    onLoadResults?: () => void;
    isPoiSaved: (poiId: string) => boolean;
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
}: POIListProps) => {
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
        return (
            <div className="text-gray-500 text-center p-4">
                No points of interest found.
            </div>
        );
    }

    const [selectedPOI, setSelectedPOI] = useState<string | null>(null);
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {pois.map((poi) => (
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
    );
};

export default POIList;