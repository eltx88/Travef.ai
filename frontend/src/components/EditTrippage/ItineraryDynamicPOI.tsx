import { memo } from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { ItineraryPOI } from '@/Types/InterfaceTypes';

interface TimeMapInfo {
  gridPosition: number;
  width: number;
  startTime: number; // Minutes from midnight
  endTime: number;   // Minutes from midnight
  day: number;
}

interface ItineraryDynamicPOIProps {
  poi: ItineraryPOI;
  timeMap: TimeMapInfo;
}

// Helper function to convert minutes to HH:MM
function minutesToHHMM(minutes: number): string {
  if (minutes === -1) return "-1"; // Handle -1 case
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

const ItineraryDynamicPOI = memo(({ poi, timeMap }: ItineraryDynamicPOIProps) => {
  const displayStartTime = minutesToHHMM(timeMap.startTime); 
  const displayEndTime = minutesToHHMM(timeMap.endTime);   
  return (
    <div
      className="h-full w-full bg-blue-100 border border-gray-200 rounded-md p-2 
                 shadow-sm hover:shadow-lg transition-shadow cursor-grab active:cursor-grabbing"
    >
      <div className="flex flex-col h-full justify-between">
        <div>
          <div className="text-sm font-medium truncate">{poi.name}</div>
          <div className="text-xs text-gray-500">
            {displayStartTime} - {displayEndTime} (Day {timeMap.day}) {/* Display converted times */}
          </div>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-8 h-8 border-none hover:bg-blue-600 hover:text-white bg-blue-200"
            >
              <Info className="h-3 w-3" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>{poi.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 mt-4">
              <p>
                <strong>Time:</strong> {displayStartTime} - {displayEndTime} (Day {timeMap.day}) {/* Display converted times */}
              </p>
              {poi.address && <p><strong>Address:</strong> {poi.address}</p>}
              {poi.description && <p><strong>Description:</strong> {poi.description}</p>}
              {poi.opening_hours && <p><strong>Hours:</strong> {poi.opening_hours}</p>}
              {poi.website && (
                <p>
                  <strong>Website:</strong>{' '}
                  <a
                    href={poi.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {poi.website}
                  </a>
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
});

ItineraryDynamicPOI.displayName = 'ItineraryDynamicPOI';

export default ItineraryDynamicPOI;