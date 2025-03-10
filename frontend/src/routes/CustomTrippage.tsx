import { useState, useEffect, useCallback, useRef } from 'react';
import { NavigationMenuBar } from "@/components/NavigationMenuBar";
import { useLocation } from 'react-router-dom';
import { useTripPreferencesPOIData } from '@/components/hooks/useTripPreferencesPOIData';
import type { TripData, POI, POIType } from '@/Types/InterfaceTypes';
import RetryButtonServerFail from "@/components/RetryButtonServerFail";
import LoadingGlobe from "@/components/LoadingGlobe";
import LoadingOverlay from "@/components/LoadingOverlay";
import { useAuthStore } from "@/firebase/firebase";
import TripPOIContainer from "@/components/TripPage/TripPOIContainer";
import MapContainer from "@/components/Containers/MapContainer";
import { LocationProvider } from '@/contexts/LocationContext';
import { useNavigate } from 'react-router-dom';
import Footer from '@/components/Footer';

function CustomTripPageContent() {
  const navigate = useNavigate();
  const location = useLocation();
  if (!location.state) {
    useEffect(() => {
      navigate('/home');
    }, [navigate]);
    return null;
  }

  const tripData = location.state?.tripData as TripData;
  const { user } = useAuthStore();
  const [containerWidth, setContainerWidth] = useState(40);
  const [isResizing, setIsResizing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [displayedPOIs, setDisplayedPOIs] = useState<POI[]>([]);
  const resizeTimeoutRef = useRef<NodeJS.Timeout>();
  const [savedPOIs, setSavedPOIs] = useState<POI[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentCategory, setCurrentCategory] = useState<POIType>("attraction");
  const [filteredPOIs, setFilteredPOIs] = useState<POI[]>([]);

  const { loading, error, retry } = useTripPreferencesPOIData(
    tripData, 
    user, 
    (pois) => {
      setDisplayedPOIs(pois);
    },
    (savedPois) => {
      setSavedPOIs(savedPois);
    }
  );

  // Initialize filteredPOIs with combined displayedPOIs and savedPOIs
  useEffect(() => {
    const combinedPOIs = [...displayedPOIs, ...savedPOIs].filter(
      poi => poi.type === currentCategory
    );
    setFilteredPOIs(combinedPOIs);
  }, [displayedPOIs, savedPOIs, currentCategory]);

  useEffect(() => {
    const handleSearchForPoi = (event: CustomEvent) => {
      if (event.detail && event.detail.name) {
        setSearchTerm(event.detail.name);
      }
    };

    document.addEventListener('searchForPoi', handleSearchForPoi as EventListener);
    
    return () => {
      document.removeEventListener('searchForPoi', handleSearchForPoi as EventListener);
    };
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

  const handleFilteredPOIsChange = useCallback((filteredPOIs: POI[]) => {
    setFilteredPOIs(filteredPOIs);
  }, []);

  if (loading) {
    return <LoadingGlobe />;
  }

  if (error) {
    return <RetryButtonServerFail isOpen={true} failedCategories={{ food: true, attraction: true }} onRetry={retry} />;
  }
  return (
    <main id="main-container" className="flex flex-grow p-4 relative">
      <div className="relative" style={{ width: `${containerWidth}%`, height: 'calc(100vh - 140px)', position: 'sticky', top: '1rem'}}>
        <TripPOIContainer 
          tripData={tripData} 
          pois={displayedPOIs} 
          savedpois={savedPOIs} 
          setIsGenerating={setIsGenerating}
          searchTerm={searchTerm}
          categoryFilter={currentCategory}
          onCategoryChange={setCurrentCategory}
          onFilteredPOIsChange={handleFilteredPOIsChange}
        />
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
        <div className={`w-1 h-16 bg-blue-300 rounded-full transition-colors ${
          isResizing ? 'bg-blue-700' : 'hover:bg-blue-500'
        }`} />
      </div>

      <div
        className="relative"
        style={{ 
          width: `${100 - containerWidth}%`,
          transition: isResizing ? 'none' : 'width 0.2s ease-out'
        }}
      >
        {displayedPOIs.length > 0 && (
          <MapContainer 
            isResizing={isResizing} 
            pois={filteredPOIs.filter(poi => !savedPOIs.some(sp => sp.place_id === poi.place_id))}
            savedPois={filteredPOIs.filter(poi => savedPOIs.some(sp => sp.place_id === poi.place_id))}
          />
        )}
      </div>
      {isGenerating && <LoadingOverlay />}
    </main>
  );
}

function CustomTripPage() {
  
  return (
    <LocationProvider>
      <div className="flex flex-col min-h-screen bg-gray-100">
        <NavigationMenuBar />
        <CustomTripPageContent />
        <Footer />
      </div>
    </LocationProvider>
  );
}

export default CustomTripPage;