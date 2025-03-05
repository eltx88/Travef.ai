import { useLocation, useNavigate } from 'react-router-dom';
import { NavigationMenuBar } from "@/components/NavigationMenuBar";
import type { TripData, ItineraryPOI } from '@/Types/InterfaceTypes';
import { useEffect, useState, useCallback } from 'react';
import ItineraryPoints from '@/components/EditTrippage/ItineraryPoints';
import ItineraryView from '@/components/EditTrippage/ItineraryView';
import { toast } from 'react-hot-toast';
import ApiClient from '@/Api/apiClient';
import { useAuthStore } from '@/firebase/firebase';
import Footer from '../components/Footer';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface LocationState {
  itineraryPOIs: ItineraryPOI[];
  unusedPOIs: ItineraryPOI[];
  tripData: TripData;
  trip_doc_id: string;
}

interface ItineraryState {
  itineraryPOIs: ItineraryPOI[];
  unusedPOIs: ItineraryPOI[];
  lastModified: number;
}

// Custom hook to warn about unsaved changes - without using useBlocker
function useUnsavedChangesWarning(hasUnsavedChanges: boolean) {
  // Only handle beforeunload event (browser close/refresh)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);
}

function EditTripPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [trip_doc_id, setTripDocId] = useState<string>("");
  const [itineraryState, setItineraryState] = useState<ItineraryState | null>(null);
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLeftExpanded, setIsLeftExpanded] = useState(false);
  const [isRightExpanded, setIsRightExpanded] = useState(false);
  
  const apiClient = new ApiClient({
    getIdToken: async () => {
      if (!user) throw new Error('Not authenticated');
      return user.getIdToken();
    }
  });

  // State to track unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Use the custom hook
  useUnsavedChangesWarning(hasUnsavedChanges);
  
  // Update the hasUnsavedChanges state whenever itinerary changes
  useEffect(() => {
    if (itineraryState && itineraryState.lastModified > 0) {
      setHasUnsavedChanges(true);
    }
  }, [itineraryState]);

  // Initialize data from location state or URL params
  useEffect(() => {
    const initializeFromState = (locationState: LocationState) => {
      if (locationState.trip_doc_id) {
        setTripDocId(locationState.trip_doc_id);
      }

      setTripData(locationState.tripData);
      setItineraryState({
        itineraryPOIs: locationState.itineraryPOIs,
        unusedPOIs: locationState.unusedPOIs,
        lastModified: Date.now()
      });
      return true;
    }

    const initialize = async () => {
      let success = false;
      
      if (location.state) {
        success = initializeFromState(location.state as LocationState);
      } 

      if (!success) {
        toast.error("Failed to load trip data");
        navigate('/home');
        return;
      }

      setIsLoading(false);
    };

    initialize();
  }, [location.state, navigate]);

  
  // Helper to update state consistently
  const updateState = useCallback((
    newItineraryPOIs: ItineraryPOI[],
    newUnusedPOIs: ItineraryPOI[]
  ) => {
    if (!tripData) return;
    
    // Update state
    setItineraryState(prev => {
      if (!prev) return prev;
      return {
        itineraryPOIs: newItineraryPOIs,
        unusedPOIs: newUnusedPOIs,
        lastModified: Date.now()
      };
    });
  }, [tripData]);

  // Update itinerary POIs (for drag and drop)
  const updateItineraryPOIs = useCallback((updatedPOIs: ItineraryPOI[]) => {
    if (!itineraryState) return;
    updateState(updatedPOIs, itineraryState.unusedPOIs);
  }, [itineraryState, updateState]);

  // Delete POI from Saved POIs
  const deleteSavedPOI = useCallback((deletedPOI: ItineraryPOI) => {
    if (!itineraryState) return;
    const newUnusedPOIs = itineraryState.unusedPOIs.filter(p => p.id !== deletedPOI.id);
    updateState(itineraryState.itineraryPOIs, newUnusedPOIs);
  }, [itineraryState, updateState]);

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
    
    updateState(newItineraryPOIs, newUnusedPOIs);
  }, [itineraryState, updateState]);

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
    updateState(newItineraryPOIs, newUnusedPOIs);
  }, [itineraryState, updateState]);

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
      
      await apiClient.createOrUpdateTrip(
        user.uid,
        trip_doc_id,
        tripData,
        itineraryState.itineraryPOIs,
        itineraryState.unusedPOIs
      );
      setHasUnsavedChanges(false);
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

  // New toggle handlers
  const toggleLeftContainer = useCallback(() => {
    setIsLeftExpanded(prev => !prev);
    setIsRightExpanded(false);
  }, []);

  const toggleRightContainer = useCallback(() => {
    setIsRightExpanded(prev => !prev);
    setIsLeftExpanded(false);
  }, []);

  // Calculate container widths based on expanded states
  const leftContainerWidth = isLeftExpanded ? 85 : isRightExpanded ? 15 : 40;
  const rightContainerWidth = isRightExpanded ? 85 : isLeftExpanded ? 15 : 60;

  // Show loading state
  if (isLoading || !itineraryState || !tripData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-xl font-semibold"><h1>Loading Trip...</h1></div>
      </div>
    );
  }
  return (
    <div className="flex flex-col min-h-screen bg-blue-100">
      <NavigationMenuBar hasUnsavedChanges={hasUnsavedChanges} clearUnsavedChanges={() => setHasUnsavedChanges(false)} />
      <main id="main-container" className="flex-grow p-4 relative">
        <div className="flex h-full w-full">
          {/* Left Container - Points of Interest */}
          <div 
            className="h-[calc(100vh-7rem)] overflow-hidden"
            style={{ 
              width: `${leftContainerWidth}%`,
              transition: 'width 0.3s ease-out',
              flexShrink: 0,
              flexGrow: 0
            }}
          >
            <div className="h-full w-full">
              <ItineraryPoints
                tripData={tripData}
                itineraryPOIs={itineraryState.itineraryPOIs}
                unusedPOIs={itineraryState.unusedPOIs}
                onAddToItinerary={handleAddToItinerary}
                onDeleteSavedPOI={deleteSavedPOI}
                isRightExpanded={isRightExpanded}
              />
            </div>
          </div>
          
          {/* Resize Controls */}
          <div className="flex items-center justify-center z-10 px-1">
            {isLeftExpanded ? (
              <button
                className="w-6 h-24 bg-white rounded-md shadow-md flex items-center justify-center hover:bg-gray-100 focus:outline-none transition-colors"
                onClick={() => {
                  setIsLeftExpanded(false);
                  setIsRightExpanded(false);
                }}
                aria-label="Reset view"
              >
                <ChevronRight className="w-5 h-5 text-blue-600" />
              </button>
            ) : isRightExpanded ? (
              <button
                className="w-6 h-24 bg-white rounded-md shadow-md flex items-center justify-center hover:bg-gray-100 focus:outline-none transition-colors"
                onClick={() => {
                  setIsLeftExpanded(false);
                  setIsRightExpanded(false);
                }}
                aria-label="Reset view"
              >
                <ChevronLeft className="w-5 h-5 text-blue-600" />
              </button>
            ) : (
              <div className="flex flex-col gap-4">
                <button
                  className="w-6 h-24 bg-white rounded-l-md shadow-md flex items-center justify-center hover:bg-gray-100 focus:outline-none transition-colors"
                  onClick={toggleLeftContainer}
                  aria-label="Expand left container"
                >
                  <ChevronRight className="w-5 h-5 text-blue-600" />
                </button>
                
                <button
                  className="w-6 h-24 bg-white rounded-r-md shadow-md flex items-center justify-center hover:bg-gray-100 focus:outline-none transition-colors"
                  onClick={toggleRightContainer}
                  aria-label="Expand right container"
                >
                  <ChevronLeft className="w-5 h-5 text-blue-600" />
                </button>
              </div>
            )}
          </div>
  
          {/* Right Container - Itinerary View */}
          <div
            className="h-[calc(100vh-7rem)] bg-white rounded-lg shadow-md overflow-hidden"
            style={{ 
              width: `${rightContainerWidth}%`,
              transition: 'width 0.3s ease-out',
              flexShrink: 0,
              flexGrow: 0
            }}
          >
            <ItineraryView
              itineraryPOIs={itineraryState.itineraryPOIs}
              tripData={tripData}
              updateItineraryPOIs={updateItineraryPOIs}
              deleteItineraryPOI={deleteItineraryPOI}
              saveItinerary={handleSaveItinerary}
              isSaving={isSaving}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}


export default EditTripPage;