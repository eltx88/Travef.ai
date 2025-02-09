import { useLocation, useNavigate } from 'react-router-dom';
import { NavigationMenuBar } from "@/components/NavigationMenuBar";
import type { POI, TripData, ItineraryPOI } from '@/Types/InterfaceTypes';
import { useEffect, useState, useCallback } from 'react';
import ItineraryPoints from '@/components/EditTrippage/ItineraryPoints';
import ItineraryView from '@/components/EditTrippage/ItineraryView';
import { processItinerary } from '@/components/EditTrippage/ItineraryProcessing';

interface LocationState {
  foodPOIs: POI[];
  attractionPOIs: POI[];
  tripData: TripData;
  generatedItinerary: string;
  isNewTrip?: boolean;
}

function EditTripPage() {
  const location = useLocation();
  const navigate = useNavigate();

  if (!location.state) {
    useEffect(() => {
      navigate('/home');
    }, [navigate]);
    return null;
  }
  
  const { foodPOIs, attractionPOIs, generatedItinerary, tripData } = location.state as LocationState;
  const [itineraryPOIs, setItineraryPOIs] = useState<ItineraryPOI[]>([]);
  const [unusedPOIs, setUnusedPOIs] = useState<POI[]>([]);

  // Initialize Itinerary POIs and Unused POIs
  useEffect(() => {
    if (generatedItinerary) {
      const { ItineraryPOIs, unusedPOIs } = processItinerary(
        generatedItinerary,
        foodPOIs,
        attractionPOIs
      );
      setItineraryPOIs(ItineraryPOIs);
      setUnusedPOIs(unusedPOIs);
    }
  }, [generatedItinerary, foodPOIs, attractionPOIs]);

  // Centralized function to update itinerary POIs
  const updateItineraryPOIs = useCallback((updatedPOIs: ItineraryPOI[]) => {
    setItineraryPOIs(updatedPOIs);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-blue-100">
      <NavigationMenuBar />
      
      <main className="flex-grow p-4">
        <div className="flex h-full gap-4">
          <ItineraryPoints
            tripData={tripData}
            itineraryPOIs={itineraryPOIs}
            unusedPOIs={unusedPOIs}
            updateItineraryPOIs={updateItineraryPOIs}
          />
          <ItineraryView 
            itineraryPOIs={itineraryPOIs}
            tripData={tripData}
            updateItineraryPOIs={updateItineraryPOIs}
          />
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
  );
}

export default EditTripPage;