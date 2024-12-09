import { useState } from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarClock, PenLine } from "lucide-react";
import type { TripData } from '@/Types/InterfaceTypes';

interface TripDetailsProps {
  tripData: TripData;
  onEdit?: () => void;
}

export function TripDetails({ tripData, onEdit }: TripDetailsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      console.log('Saving trip:', tripData);
      // MAKE API CALLS with data obtained from tripData;
    } catch (error) {
      console.error('Error saving trip:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Trip Summary</h2>
          <Button 
            variant="outline"
            className="flex items-center gap-2 hover:bg-blue-600 hover:text-white" 
            onClick={onEdit}
          >
            <PenLine className="h-4 w-4" />
            Edit Details
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Destination */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Destination</h3>
          <p className="text-xl text-blue-600">{tripData.city}</p>
        </div>

        {/* Dates */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">When</h3>
          <div className="flex items-center gap-2">
            {tripData.dateRange ? (
              <>
                <Calendar className="h-5 w-5 text-blue-500" />
                <p>
                  {tripData.dateRange.from?.toLocaleDateString("en-GB")} - {" "}
                  {tripData.dateRange.to?.toLocaleDateString("en-GB")}
                </p>
              </>
            ) : (
              <>
                <CalendarClock className="h-5 w-5 text-blue-500" />
                <p>Flexible dates ({tripData.monthlyDays} days)</p>
              </>
            )}
          </div>
        </div>

        {/* Interests */}
        <div className="space-y-2">
      <h3 className="font-semibold">Interests</h3>
      <div className="flex flex-wrap gap-2">
        {Array.from(tripData.interests).map((interest) => (
          <span key={interest} className="px-3 py-1 bg-blue-100 rounded-full text-sm">
            {interest}
          </span>
        ))}
      </div>
      {tripData.customInterests.size > 0 && (
        <div className="mt-2">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Custom Interests</h4>
          <div className="flex flex-wrap gap-2">
            {Array.from(tripData.customInterests).map((interest) => (
              <span key={interest} className="px-3 py-1 bg-green-100 rounded-full text-sm">
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="hover:bg-red-700 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? 'Saving...' : 'Create Trip'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}