import { useLocation, useNavigate } from 'react-router-dom';
import { NavigationMenuBar } from "@/components/NavigationMenuBar";
import type { TripData, ItineraryPOI } from '@/Types/InterfaceTypes';
import { useEffect, useState, useCallback } from 'react';
import ItineraryPoints from '@/components/EditTrippage/ItineraryPoints';
import ItineraryView from '@/components/EditTrippage/ItineraryView';
import { tripCacheService } from '@/components/hooks/tripCacheService';
import { toast } from 'react-hot-toast';
import ApiClient from '@/Api/apiClient';
import { useAuthStore } from '@/firebase/firebase';

interface LocationState {
  itineraryPOIs: ItineraryPOI[];
  unusedPOIs: ItineraryPOI[];
  tripData: TripData;
}

interface ItineraryState {
  itineraryPOIs: ItineraryPOI[];
  unusedPOIs: ItineraryPOI[];
}

function EditTripPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [itineraryState, setItineraryState] = useState<ItineraryState | null>(null);
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const apiClient = new ApiClient({
    getIdToken: async () => {
      if (!user) throw new Error('Not authenticated');
      return user.getIdToken();
    }
  });

  //Validaate incoming data
  useEffect(() => {
    if (!location.state || 
        !location.state.itineraryPOIs || 
        !location.state.unusedPOIs || 
        !location.state.tripData) {
      console.error("Missing required trip data");
      toast.error("Missing trip data");
      navigate('/home');
      return;
    }
    
    const locationState = location.state as LocationState;
    setTripData(locationState.tripData);
    
    // Validate and fix itinerary data if needed
    const validatedItineraryPOIs = locationState.itineraryPOIs.map(poi => {
      const hasValidScheduling = 
        typeof poi.day === 'number' &&
        typeof poi.timeSlot === 'string' &&
        typeof poi.StartTime === 'number' &&
        typeof poi.EndTime === 'number' &&
        typeof poi.duration === 'number';
      
      if (!hasValidScheduling) {
        console.warn("Found POI with missing scheduling data:", poi);
        return {
          ...poi,
          day: poi.day ?? -1,
          timeSlot: poi.timeSlot ?? "unused",
          StartTime: poi.StartTime ?? -1,
          EndTime: poi.EndTime ?? -1,
          duration: poi.duration ?? -1
        };
      }
      return poi;
    });

    // Validate unused POIs
    const validatedUnusedPOIs = locationState.unusedPOIs.map(poi => ({
      ...poi,
      day: -1,
      timeSlot: "unused",
      StartTime: -1,
      EndTime: -1,
      duration: -1
    }));

    // Cache after validating the data
    let finalState: ItineraryState;
    const cached = tripCacheService.get(locationState.tripData.city, locationState.tripData.createdDT);
    
    if (cached && cached.itineraryPOIs.length > 0) {
      console.log("Using cached itinerary data");
      finalState = {
        itineraryPOIs: cached.itineraryPOIs,
        unusedPOIs: cached.unusedPOIs
      };
    } else {
      console.log("Using data from location state");
      finalState = {
        itineraryPOIs: validatedItineraryPOIs,
        unusedPOIs: validatedUnusedPOIs
      };
      
      // Create cache entry with validated data
      tripCacheService.set(locationState.tripData.city, {
        itineraryPOIs: validatedItineraryPOIs,
        unusedPOIs: validatedUnusedPOIs,
        tripData: locationState.tripData
      });
    }
    
    setItineraryState(finalState);
    setIsLoading(false);
  }, [location.state, navigate]);

  // Update cache whenever itineraryState changes
  useEffect(() => {
    if (!itineraryState || !tripData) return;
    
    tripCacheService.set(tripData.city, {
      itineraryPOIs: itineraryState.itineraryPOIs,
      unusedPOIs: itineraryState.unusedPOIs,
      tripData,
    });
  }, [itineraryState, tripData]);

  // Update itinerary POIs (for drag and drop updates)
  const updateItineraryPOIs = useCallback((updatedPOIs: ItineraryPOI[]) => {
    setItineraryState(prevState => {
      if (!prevState) return prevState;
      return {
        ...prevState,
        itineraryPOIs: updatedPOIs,
      };
    });
  }, []);

  const deleteItineraryPOI = useCallback((deletedPOI: ItineraryPOI) => {
    setItineraryState(prevState => {
      if (!prevState) return prevState;
      return {
        itineraryPOIs: prevState.itineraryPOIs.filter(poi => poi.id !== deletedPOI.id),
        unusedPOIs: [...prevState.unusedPOIs, {
          ...deletedPOI,
          day: -1,
          timeSlot: "unused",
          StartTime: -1,
          EndTime: -1,
          duration: -1,
        }],
      };
    });
  }, []);

  const handleAddToItinerary = useCallback((poi: ItineraryPOI, day: number) => {
    if (!itineraryState) return;
    
    const freeTimeSlot = findFreeTimeSlot(day, itineraryState.itineraryPOIs);

    if (freeTimeSlot) {
      const updatedPOI = {
        ...poi,
        day,
        timeSlot: freeTimeSlot.timeSlot,
        StartTime: freeTimeSlot.startTime,
        EndTime: freeTimeSlot.endTime,
      };

      setItineraryState((prevState) => {
        if (!prevState) return prevState;
        return {
          itineraryPOIs: [...prevState.itineraryPOIs, updatedPOI],
          unusedPOIs: prevState.unusedPOIs.filter((p) => p.id !== poi.id),
        };
      });
    } else {
      toast.error('No free time slot available on this day.');
    }
  }, [itineraryState]);

  // Helper function to find a free time slot in the itinerary
  const findFreeTimeSlot = (day: number, itineraryPOIs: ItineraryPOI[]) => {
    const dayPOIs = itineraryPOIs.filter((poi) => poi.day === day);
    const timeSlots = dayPOIs.map((poi) => ({
      start: poi.StartTime,
      end: poi.EndTime,
    }));

    // Sort time slots by start time
    timeSlots.sort((a, b) => a.start - b.start);

    // Define the working hours (08:00 to 23:00 in minutes)
    const startOfDay = 8 * 60; // 08:00 in minutes
    const endOfDay = 23 * 60; // 23:00 in minutes

    // Define time slot ranges
    const morningEnd = 12 * 60; // 12:00 in minutes
    const afternoonEnd = 17 * 60; // 17:00 in minutes

    // Duration of the POI (0.5 hours = 30 minutes)
    const duration = 30;

    // Find gaps between time slots
    let previousEnd = startOfDay;
    for (const slot of timeSlots) {
      if (slot.start > previousEnd) {
        // Check if the gap is large enough for the duration
        const gapDuration = slot.start - previousEnd;
        if (gapDuration >= duration) {
          // Determine the time slot (Morning/Afternoon/Evening)
          let timeSlot = "Morning";
          if (previousEnd >= morningEnd && previousEnd < afternoonEnd) {
            timeSlot = "Afternoon";
          } else if (previousEnd >= afternoonEnd) {
            timeSlot = "Evening";
          }

          return {
            startTime: previousEnd,
            endTime: previousEnd + duration,
            timeSlot,
          };
        }
      }
      previousEnd = Math.max(previousEnd, slot.end);
    }

    // Check if there's a gap after the last POI
    if (previousEnd < endOfDay) {
      // Check if the remaining time is enough for the duration
      const remainingTime = endOfDay - previousEnd;
      if (remainingTime >= duration) {
        // Determine the time slot (Morning/Afternoon/Evening)
        let timeSlot = "Morning";
        if (previousEnd >= morningEnd && previousEnd < afternoonEnd) {
          timeSlot = "Afternoon";
        } else if (previousEnd >= afternoonEnd) {
          timeSlot = "Evening";
        }

        return {
          startTime: previousEnd,
          endTime: previousEnd + duration,
          timeSlot,
        };
      }
    }

    return null;
  };

  // Logic for saving the itinerary
  const handleSaveItinerary = async () => {
    if (!itineraryState || !tripData) {
      toast.error("Missing itinerary data");
      return;
    }
    
    try {
      if (!user) {
        toast.error("Please login to save your itinerary");
        return;
      }

      setIsSaving(true);
      const savingToast = toast.loading("Saving your itinerary...");
      await apiClient.createOrGetTrip(
        user.uid,
        tripData,
        itineraryState.itineraryPOIs,
        itineraryState.unusedPOIs
      );

      toast.dismiss(savingToast);
      toast.success("Itinerary saved successfully!", {
        duration: 3000,
        position: 'bottom-right'
      });
    } catch (error) {
      console.error("Error saving itinerary:", error);
      if (error instanceof Error) {
        if (error.message.includes('version')) {
          toast.error(
            "Someone else has updated this itinerary. Please refresh and try again.",
            { duration: 5000 }
          );
        } else if (error.message.includes('network')) {
          toast.error(
            "Network error. Please check your connection and try again.",
            { duration: 5000 }
          );
        } else {
          toast.error("Failed to save itinerary. Please try again.");
        }
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state while initializing
  if (isLoading || !itineraryState || !tripData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-blue-100">
        <div className="text-xl font-semibold">Loading trip data...</div>
      </div>
    );
  }
  return (
    <div className="flex flex-col min-h-screen bg-blue-100">
      <NavigationMenuBar />
      <main className="flex-grow p-4">
        <div className="flex h-full gap-4">          
          <ItineraryPoints
            tripData={tripData}
            itineraryPOIs={itineraryState.itineraryPOIs}
            unusedPOIs={itineraryState.unusedPOIs}
            onAddToItinerary={handleAddToItinerary}
          />
          <ItineraryView
            itineraryPOIs={itineraryState.itineraryPOIs}
            tripData={tripData}
            updateItineraryPOIs={updateItineraryPOIs}
            deleteItineraryPOI={deleteItineraryPOI}
            saveItinerary={handleSaveItinerary}
            isSaving={isSaving}
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