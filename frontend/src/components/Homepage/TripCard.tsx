// Create new file: components/TripCards.tsx
import { FC } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import type { UserTrip } from '@/Types/InterfaceTypes';
import ApiClient from '@/Api/apiClient';
import { useAuthStore } from '@/firebase/firebase';
import { useNavigate } from 'react-router-dom';

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
    <Card className="w-[300px] flex-shrink-0 bg-white shadow-lg hover:shadow-lg transition-shadow items-center hover:bg-blue-100">
      <CardContent className="p-4">
        <div className="space-y-4">
          <h2 className="font-semibold text-xl capitalize text-center">{trip.city}, {trip.country}</h2>
          <p className="text-gray-600 text-center">{trip.monthlyDays} days</p>
          <div className="flex gap-2 text-gray-600">
            <div className="flex items-center space-y-1 px-10 text-sm text-center">
              <Calendar className="h-4 w-4 mr-1" />
              <p className="inline">
                {trip.fromDT.toLocaleDateString("en-UK")} - {trip.toDT.toLocaleDateString("en-UK")}
              </p>
            </div>
        </div>

          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => {
                const tripDetails = apiClient.getTripDetails(trip.trip_doc_id);
                navigate('/edit-trip', {
                    state: {
                        tripDetails: tripDetails,
                        isNewTrip: false
                    }
                });
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