import { NavigationMenuBar } from "@/components/NavigationMenuBar";
import POIContainer from "@/components/POIpage/POIContainer";
import MapContainer from "@/components/Containers/MapContainer";
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { LocationProvider } from '@/contexts/LocationContext';
import type { POI } from '@/Types/InterfaceTypes';

// Define interface for map functions
interface MapFunctions {
  showPopupForPOI: (poiId: string) => void;
}

function PointOfInterest() {
    const [containerWidth, setContainerWidth] = useState<number>(40);
    const [isResizing, setIsResizing] = useState(false);
    const resizeTimeoutRef = useRef<NodeJS.Timeout>();
    const [displayedPOIs, setDisplayedPOIs] = useState<POI[]>([]);
    const previousPOIsRef = useRef<string>('');

    // Refs for map instance and functions
    const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
    const mapFunctionsRef = useRef<MapFunctions | null>(null);
  
    // Memoize the POIs update handler
    const handlePOIsUpdate = useCallback((pois: POI[]) => {
        const poisString = JSON.stringify(pois);
        if (previousPOIsRef.current !== poisString) {
            console.log('PointOfInterestPage received POIs update:', pois);
            setDisplayedPOIs(pois);
            previousPOIsRef.current = poisString;
        }
    }, []); 

    const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
        mouseDownEvent.preventDefault();
        setIsResizing(true);
    }, []);
  
    const resize = useCallback((mouseMoveEvent: MouseEvent) => {
        if (isResizing) {
            const mainContainer = document.getElementById('main-container');
            if (!mainContainer) return;
    
            const { left, width } = mainContainer.getBoundingClientRect();
            const newWidth = ((mouseMoveEvent.clientX - left) / width) * 100;
    
            if (newWidth >= 20 && newWidth <= 80) {
                setContainerWidth(newWidth);
                
                if (resizeTimeoutRef.current) {
                    clearTimeout(resizeTimeoutRef.current);
                }
                
                resizeTimeoutRef.current = setTimeout(() => {
                    setIsResizing(false);
                }, 150);
            }
        }
    }, [isResizing]);
  
    const stopResizing = useCallback(() => {
        if (resizeTimeoutRef.current) {
            clearTimeout(resizeTimeoutRef.current);
        }
        setIsResizing(false);
    }, []);

    // Handler for map creation
    const handleMapCreate = useCallback((map: mapboxgl.Map, functions: MapFunctions) => {
        mapInstanceRef.current = map;
        mapFunctionsRef.current = functions;
    }, []);
  
    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
        }
  
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }
        };
    }, [isResizing, resize, stopResizing]);

    // Memoize the POIContainer and MapContainer
    const memoizedPOIContainer = useMemo(() => (
        <POIContainer 
            onPOIsUpdate={handlePOIsUpdate}
        />
    ), [handlePOIsUpdate]);

    const memoizedMapContainer = useMemo(() => (
        <MapContainer 
            isResizing={isResizing} 
            pois={displayedPOIs}
            savedPois={[]}
        />
    ), [isResizing, displayedPOIs, handleMapCreate]);

    return (
        <LocationProvider>
            <div className="flex flex-col min-h-screen bg-gray-100">
                <NavigationMenuBar />
                
                <main 
                    id="main-container" 
                    className="flex flex-grow p-4 relative"
                    style={{ userSelect: isResizing ? 'none' : 'auto' }}
                >
                    <div
                        className="relative"
                        style={{ width: `${containerWidth}%` }}
                    >
                        {memoizedPOIContainer}
                    </div>
    
                    <div
                        className="absolute h-full w-4 cursor-col-resize flex items-center justify-center"
                        style={{
                            left: `calc(${containerWidth}% - 8px)`,
                            top: '16px',
                            bottom: '16px',
                            cursor: 'col-resize'
                        }}
                        onMouseDown={startResizing}
                    >
                        <div 
                            className={`w-3 h-1/5 bg-blue-300 transition-colors rounded-md ${
                                isResizing ? 'bg-blue-700' : 'hover:bg-blue-500'
                            }`}
                        />
                    </div>
    
                    <div
                        className="relative"
                        style={{ 
                            width: `${100 - containerWidth}%`,
                            transition: isResizing ? 'none' : 'width 0.2s ease-out'
                        }}
                    >
                        {memoizedMapContainer}
                    </div>
                </main>
    
                <footer className="bg-blue-600 text-white py-1">
                    <div className="container mx-auto px-4">
                        <p className="text-sm text-center">© 2024 Travefai. All rights reserved.</p>
                        <div className="flex justify-center space-x-4 mt-2">
                            <a href="/privacy-policy" className="text-sm hover:underline">Privacy Policy</a>
                            <a href="/terms-of-service" className="text-sm hover:underline">Terms of Service</a>
                            <a href="/contact" className="text-sm hover:underline">Contact Us</a>
                        </div>
                    </div>
                </footer>
            </div>
        </LocationProvider>
    );
}
  
export default PointOfInterest;