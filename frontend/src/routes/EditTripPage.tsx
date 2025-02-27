import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { NavigationMenuBar } from "@/components/NavigationMenuBar";
import type { TripData, ItineraryPOI } from '@/Types/InterfaceTypes';
import { useEffect, useState, useCallback } from 'react';
import ItineraryPoints from '@/components/EditTrippage/ItineraryPoints';
import ItineraryView from '@/components/EditTrippage/ItineraryView';
import { tripCacheService } from '@/components/hooks/tripCacheService';
import { toast } from 'react-hot-toast';
import ApiClient from '@/Api/apiClient';
import { useAuthStore } from '@/firebase/firebase';
import Footer from '../components/Footer';

interface LocationState {
  itineraryPOIs: ItineraryPOI[];
  unusedPOIs: ItineraryPOI[];
  tripData: TripData;
  timeStamp: number;
}

interface ItineraryState {
  itineraryPOIs: ItineraryPOI[];
  unusedPOIs: ItineraryPOI[];
  lastModified: number;
}

function EditTripPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ city?: string; country?: string; createdTimestamp?: string }>();
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

  // Initialize data from location state or URL params
  useEffect(() => {
    const initializeFromState = (locationState: LocationState) => {
      setTripData(locationState.tripData);
      
      // Check for fresher cache
      const hasFresherCache = tripCacheService.isCacheFresher(
        locationState.tripData, 
        locationState.timeStamp
      );
      
      if (hasFresherCache) {
        // Use cache (it's fresher than navigation state)
        const cachedData = tripCacheService.get(locationState.tripData);
        if (cachedData) {
          setItineraryState({
            itineraryPOIs: cachedData.itineraryPOIs,
            unusedPOIs: cachedData.unusedPOIs,
            lastModified: cachedData.lastModified
          });
          toast.success("Loaded your latest changes");
          return true;
        }
      }
      
      // Use incoming state 
      setItineraryState({
        itineraryPOIs: locationState.itineraryPOIs,
        unusedPOIs: locationState.unusedPOIs,
        lastModified: locationState.timeStamp
      });
      
      // Initialize cache
      tripCacheService.set(locationState.tripData, {
        itineraryPOIs: locationState.itineraryPOIs,
        unusedPOIs: locationState.unusedPOIs,
        lastModified: locationState.timeStamp
      });
      return true;
    };
    
    const initializeFromParams = () => {
      if (!params.city || !params.country || !params.createdTimestamp) return false;
      
      try {
        const city = decodeURIComponent(params.city);
        const country = decodeURIComponent(params.country);
        const createdDT = new Date(parseInt(params.createdTimestamp));
        
        // Try to recover from cache
        const cachedData = tripCacheService.getByTripParams(city, country, createdDT);
        
        if (cachedData) {
          setTripData(cachedData.tripData);
          setItineraryState({
            itineraryPOIs: cachedData.itineraryPOIs,
            unusedPOIs: cachedData.unusedPOIs,
            lastModified: cachedData.lastModified
          });
          toast.success("Recovered your trip data");
          return true;
        }
      } catch (error) {
        console.error("Error parsing URL parameters:", error);
      }
      return false;
    };

    const initialize = async () => {
      let success = false;
      
      // Try to initialize from location state (normal navigation)
      if (location.state?.tripData) {
        success = initializeFromState(location.state as LocationState);
      }
      
      // If that fails, try to initialize from URL params (page refresh)
      if (!success) {
        success = initializeFromParams();
      }
      
      // If all initialization methods fail, redirect home
      if (!success) {
        toast.error("Could not load trip data");
        navigate('/home');
        return;
      }
      
      setIsLoading(false);
    };
    
    initialize();
  }, [location.state, params, navigate]);

  // ===== State Modification Functions =====
  
  // Helper to update state and cache consistently
  const updateStateAndCache = useCallback((
    newItineraryPOIs: ItineraryPOI[],
    newUnusedPOIs: ItineraryPOI[]
  ) => {
    if (!tripData) return;
    
    const now = Date.now();
    
    // Update state
    setItineraryState(prev => {
      if (!prev) return prev;
      return {
        itineraryPOIs: newItineraryPOIs,
        unusedPOIs: newUnusedPOIs,
        lastModified: now
      };
    });
    
    // Update cache
    tripCacheService.update(tripData, {
      itineraryPOIs: newItineraryPOIs,
      unusedPOIs: newUnusedPOIs,
      lastModified: now
    });
  }, [tripData]);

  // Update itinerary POIs (for drag and drop)
  const updateItineraryPOIs = useCallback((updatedPOIs: ItineraryPOI[]) => {
    if (!itineraryState) return;
    updateStateAndCache(updatedPOIs, itineraryState.unusedPOIs);
  }, [itineraryState, updateStateAndCache]);

  // Delete POI from Saved POIs
  const deleteSavedPOI = useCallback((deletedPOI: ItineraryPOI) => {
    if (!itineraryState) return;
    const newUnusedPOIs = itineraryState.unusedPOIs.filter(p => p.id !== deletedPOI.id);
    updateStateAndCache(itineraryState.itineraryPOIs, newUnusedPOIs);
  }, [itineraryState, updateStateAndCache]);

  // Delete POI from itinerary
  const deleteItineraryPOI = useCallback((deletedPOI: ItineraryPOI) => {
    if (!itineraryState) return;
    
    const modifiedPOI = {
      ...deletedPOI,
      day: -1,
      timeSlot: "unused",
      StartTime: -1,
      EndTime: -1,
      duration: -1,
    };
    
    const newItineraryPOIs = itineraryState.itineraryPOIs.filter(poi => poi.id !== deletedPOI.id);
    const newUnusedPOIs = [...itineraryState.unusedPOIs, modifiedPOI];
    
    updateStateAndCache(newItineraryPOIs, newUnusedPOIs);
  }, [itineraryState, updateStateAndCache]);

  // Add POI to itinerary
  const handleAddToItinerary = useCallback((poi: ItineraryPOI, day: number) => {
    if (!itineraryState) return;
    
    const freeTimeSlot = findFreeTimeSlot(day, itineraryState.itineraryPOIs);
    if (!freeTimeSlot) {
      toast.error('No free time slot available on this day.');
      return;
    }
    
    const updatedPOI = {
      ...poi,
      day,
      timeSlot: freeTimeSlot.timeSlot,
      StartTime: freeTimeSlot.startTime,
      EndTime: freeTimeSlot.endTime,
    };
    
    const newItineraryPOIs = [...itineraryState.itineraryPOIs, updatedPOI];
    const newUnusedPOIs = itineraryState.unusedPOIs.filter(p => p.id !== poi.id);
    updateStateAndCache(newItineraryPOIs, newUnusedPOIs);
  }, [itineraryState, updateStateAndCache]);

  // Find free time slot helper
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

  // Save itinerary to server
  const handleSaveItinerary = async () => {
    if (!itineraryState || !tripData || !user) {
      toast.error("Missing data or not logged in");
      return;
    }
    
    try {
      setIsSaving(true);
      const savingToast = toast.loading("Saving your itinerary...");
      
      await apiClient.createOrGetTrip(
        user.uid,
        tripData,
        itineraryState.itineraryPOIs,
        itineraryState.unusedPOIs
      );

      // Clear cache after successful save
      tripCacheService.clear(tripData);    
      toast.dismiss(savingToast);
      toast.success("Itinerary saved successfully!");
      navigate('/home');
    } catch (error) {
      console.error("Error saving itinerary:", error);
      let errorMessage = "Failed to save itinerary";
      
      if (error instanceof Error) {
        if (error.message.includes('version')) {
          errorMessage = "Someone else has updated this itinerary. Please refresh and try again.";
        } else if (error.message.includes('network')) {
          errorMessage = "Network error. Please check your connection and try again.";
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state
  if (isLoading || !itineraryState || !tripData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-xl font-semibold"><h1>Loading Trip...</h1></div>
      </div>
    );
  }
  
  // Render page
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
            onDeleteSavedPOI={deleteSavedPOI}
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
      <Footer />
    </div>
  );
}

export default EditTripPage;