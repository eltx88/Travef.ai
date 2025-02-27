// Create new file: components/TripCards.tsx
import { FC } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import type { ItineraryPOI, UserTrip } from '@/Types/InterfaceTypes';
import ApiClient from '@/Api/apiClient';
import { useAuthStore } from '@/firebase/firebase';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface TripCardsProps {
  trip: UserTrip;
}

const TripCard: FC<TripCardsProps> = ({ trip }) => {
    const { user } = useAuthStore();
    const apiClient = new ApiClient({
        getIdToken: async () => {
            if (!user) throw new Error('Not authenticated');
            return user.getIdToken();
        }
      });
    const navigate = useNavigate();

  return (
    <Card className="w-[300px] flex-shrink-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 items-center hover:bg-gray-200 overflow-hidden">
      <CardContent className="p-4 w-full">
        <div className="space-y-4 group">
          <h2 className="font-semibold text-xl capitalize text-center transition-transform duration-300 group-hover:scale-110">{trip.city}, {trip.country}</h2>
          <p className="text-gray-600 text-center transition-transform duration-300 group-hover:scale-110">{trip.monthlyDays} days</p>
          <div className="flex gap-2 text-gray-600">
            <div className="flex items-center space-y-1 px-10 text-sm text-center w-full transition-transform duration-300 group-hover:scale-110">
              <Calendar className="h-4 w-4 mr-1" />
              <p className="inline">
                {trip.fromDT.toLocaleDateString("en-UK")} - {trip.toDT.toLocaleDateString("en-UK")}
              </p>
            </div>
        </div>

          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-transform duration-300 group-hover:scale-105"
            onClick={async () => {
                try {
                    // Fetch trip details
                    const tripDetails = await apiClient.getTripDetails(trip.trip_doc_id);
                
                    // Fetch saved POI details
                    const [savedItineraryPOIs, savedUnusedPOIs] = await Promise.all([
                      apiClient.getSavedPOIDetails(tripDetails.itineraryPOIs.map(poi => poi.PointID)),
                      apiClient.getSavedPOIDetails(tripDetails.unusedPOIs.map(poi => poi.PointID))
                    ]);
                    
                    // Fetch Google details
                    const [enhancedItineraryPOIs, enhancedUnusedPOIs] = await Promise.all([
                      apiClient.getBatchPlaceDetails(savedItineraryPOIs, trip.city, trip.country),
                      apiClient.getBatchPlaceDetails(savedUnusedPOIs, trip.city, trip.country)
                    ]);
                
                    // Merge scheduling information from original itineraryPOIs with enhanced POI content
                    const finalItineraryPOIs = tripDetails.itineraryPOIs.map(schedulingInfo => {
                      // Find the matching enhanced POI
                      const matchingPOI = enhancedItineraryPOIs.find(poi => poi.id === schedulingInfo.PointID);
                      
                      if (matchingPOI) {
                        return {
                          ...matchingPOI,
                          day: schedulingInfo.day,
                          timeSlot: schedulingInfo.timeSlot,
                          StartTime: schedulingInfo.StartTime,
                          EndTime: schedulingInfo.EndTime,
                          duration: schedulingInfo.duration,
                          PointID: schedulingInfo.PointID
                        } as ItineraryPOI;
                      }
                      
                      return null;
                    }).filter(Boolean) as ItineraryPOI[];
                    
                    // For unused POIs, add the necessary properties to match ItineraryPOI interface
                    const finalUnusedPOIs = enhancedUnusedPOIs.map(poi => {
                      return {
                        ...poi,
                        day: -1,
                        timeSlot: "unused",
                        StartTime: -1,
                        EndTime: -1,
                        duration: -1
                      } as ItineraryPOI;
                    });

                    // Navigate to edit page with the enhanced data
                    navigate('/edit-trip', {
                      state: {
                        itineraryPOIs: finalItineraryPOIs,
                        unusedPOIs: finalUnusedPOIs,
                        tripData: tripDetails.tripData
                      }
                    });
                  } catch (error) {
                    console.error('Error fetching trip details:', error);
                    toast.error(`Error fetching trip details: ${error}`);
                  }
            }}
          >
            View Trip
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TripCard;