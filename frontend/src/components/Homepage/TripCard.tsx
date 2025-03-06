// Create new file: components/TripCards.tsx
import { FC, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Trash2, Loader2 } from "lucide-react";
import type { ItineraryPOI, UserTrip } from '@/Types/InterfaceTypes';
import ApiClient from '@/Api/apiClient';
import { useAuthStore } from '@/firebase/firebase';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TripCardsProps {
  trip: UserTrip;
  onDelete: (refresh: boolean) => void;
  setGlobalLoading: (loading: boolean, message?: string) => void;
}

const TripCard: FC<TripCardsProps> = ({ trip, onDelete, setGlobalLoading }) => {
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuthStore();
    const apiClient = new ApiClient({
        getIdToken: async () => {
            if (!user) throw new Error('Not authenticated');
            return user.getIdToken();
        }
    });
    const navigate = useNavigate();

  // Format dates in a more compact way
  const formatDate = (date: Date) => {
    return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
  };

  return (
    <Card className="w-[300px] flex-shrink-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 items-center hover:bg-gray-200 overflow-hidden">
      <CardContent className="p-4 w-full">
        <div className="space-y-4 group">
          <h2 className="font-semibold text-2xl capitalize text-center transition-transform duration-300 group-hover:scale-110">{trip.city}, {trip.country.toUpperCase()}</h2>
          <p className="text-gray-600 text-center transition-transform duration-300 group-hover:scale-110">{trip.monthlyDays} days</p>
          <div className="flex gap-2 text-gray-600">
            <div className="flex items-center px-3 text-sm w-full transition-transform duration-300 group-hover:scale-110">
              <Calendar className="h-5 w-5 mr-2 flex-shrink-0" />
              <h3 className="truncate">
                {formatDate(trip.fromDT)} to {formatDate(trip.toDT)}
              </h3>
            </div>
          </div>

          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-transform duration-300 group-hover:scale-105"
            onClick={async () => {
                try {
                    setIsLoading(true);
                    setGlobalLoading(true, "Loading trip details...");
                    
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
                          PointID: schedulingInfo.PointID,
                          day: schedulingInfo.day,
                          timeSlot: schedulingInfo.timeSlot,
                          StartTime: schedulingInfo.StartTime,
                          EndTime: schedulingInfo.EndTime,
                          duration: schedulingInfo.duration
                        } as ItineraryPOI;
                      }
                      
                      return null;
                    }).filter(Boolean) as ItineraryPOI[];
                    
                    // For unused POIs, add the necessary properties to match ItineraryPOI interface
                    const finalUnusedPOIs = enhancedUnusedPOIs.map(poi => {
                      return {
                        ...poi,
                        PointID: poi.id,
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
                        tripData: tripDetails.tripData,
                        trip_doc_id: trip.trip_doc_id
                      }
                    });
                  } catch (error) {
                    console.error('Error fetching trip details:', error);
                    toast.error(`Error fetching trip details: ${error}`);
                  } finally {
                    setIsLoading(false);
                    setGlobalLoading(false);
                    toast.dismiss("trip-loading");
                  }
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "View Trip"
            )}
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white transition-transform duration-300 group-hover:scale-105">
                <Trash2 className="h-6 w-6" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete your trip to {trip.city.charAt(0).toUpperCase() + trip.city.slice(1)}?</AlertDialogTitle>
                <AlertDialogDescription className="text-red-600">
                  This action cannot be undone
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={async () => {
                    try {
                      const loadingToast = toast.loading("Deleting trip...");
                      await apiClient.deleteTrip(trip.trip_doc_id);
                      toast.dismiss(loadingToast);
                      toast.success('Trip deleted successfully!');
                      onDelete(true);
                    } catch (error) {
                      toast.error(`Failed to delete trip: ${error}`);
                    }
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default TripCard;