import { useLocation, useNavigate } from 'react-router-dom';
import { NavigationMenuBar } from "@/components/NavigationMenuBar";
import type { POI, TripData, ItineraryPOI } from '@/Types/InterfaceTypes';
import { useEffect, useState, useCallback } from 'react';
import ItineraryPoints from '@/components/EditTrippage/ItineraryPoints';
import ItineraryView from '@/components/EditTrippage/ItineraryView';
import { processItinerary } from '@/components/EditTrippage/ItineraryProcessing';
import { tripCacheService } from '@/components/hooks/tripCacheService';

interface LocationState {
  foodPOIs: POI[];
  attractionPOIs: POI[];
  tripData: TripData;
  generatedItinerary: string;
  isNewTrip?: boolean;
}

interface ItineraryState {
  itineraryPOIs: ItineraryPOI[];
  unusedPOIs: ItineraryPOI[];
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

  const [itineraryState, setItineraryState] = useState<ItineraryState>(() => {
    // Always try to fetch from cache first
    const cached = tripCacheService.get(tripData.city);
    if (cached) {
      // console.log('Initializing from cache:', cached);
      return {
        itineraryPOIs: cached.itineraryPOIs,
        unusedPOIs: cached.unusedPOIs
      };
    }

    // Process new itinerary if no cache is found
    // console.log('Initializing from new itinerary');
    const processed = processItinerary(generatedItinerary, foodPOIs, attractionPOIs);
    return {
      itineraryPOIs: processed.ItineraryPOIs,
      unusedPOIs: processed.unusedPOIs
    };
  });

  // Update cache whenever itineraryState changes
  useEffect(() => {
    tripCacheService.set(tripData.city, {
      itineraryPOIs: itineraryState.itineraryPOIs,
      unusedPOIs: itineraryState.unusedPOIs,
      tripData
    });
  }, [itineraryState, tripData]);

  // Update itinerary POIs (for drag and drop updates)
  const updateItineraryPOIs = useCallback((updatedPOIs: ItineraryPOI[]) => {
    setItineraryState(prevState => ({
      ...prevState,
      itineraryPOIs: updatedPOIs
    }));
  }, []);

  // Handle POI deletion with atomic update
  const deleteItineraryPOI = useCallback((deletedPOI: ItineraryPOI) => {
    setItineraryState(prevState => ({
      itineraryPOIs: prevState.itineraryPOIs.filter(poi => poi.id !== deletedPOI.id),
      unusedPOIs: [...prevState.unusedPOIs, {
        ...deletedPOI,
        day: -1,
        timeSlot: "unused",
        StartTime: -1,
        EndTime: -1,
        duration: -1
      }]
    }));
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-blue-100">
      <NavigationMenuBar />

      <main className="flex-grow p-4">
        <div className="flex h-full gap-4">
          <ItineraryPoints
            tripData={tripData}
            itineraryPOIs={itineraryState.itineraryPOIs}
            unusedPOIs={itineraryState.unusedPOIs}
          />
          <ItineraryView
            itineraryPOIs={itineraryState.itineraryPOIs}
            tripData={tripData}
            updateItineraryPOIs={updateItineraryPOIs}
            deleteItineraryPOI={deleteItineraryPOI}
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