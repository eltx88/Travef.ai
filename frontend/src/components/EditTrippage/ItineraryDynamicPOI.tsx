// ItineraryDynamicPOI.tsx
import { memo } from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { ItineraryPOI } from '@/Types/InterfaceTypes';

interface TimeMapInfo {
  gridPosition: number;
  width: number;
  startTime: string;
  endTime: string;
  day: string;
}

interface ItineraryDynamicPOIProps {
  poi: ItineraryPOI;
  timeMap: TimeMapInfo;
}

const ItineraryDynamicPOI = memo(({ 
  poi,
  timeMap
}: ItineraryDynamicPOIProps) => {
  return (
    <div
      className="h-full w-full bg-blue-100 border border-gray-200 rounded-md p-2 
                 shadow-sm hover:shadow-lg transition-shadow cursor-grab active:cursor-grabbing"
    >
      <div className="flex flex-col h-full justify-between">
        <div>
          <div className="text-sm font-medium truncate">{poi.name}</div>
          <div className="text-xs text-gray-500">
            {timeMap.startTime} - {timeMap.endTime} (Day {timeMap.day})
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
              <p><strong>Time:</strong> {timeMap.startTime} - {timeMap.endTime} (Day {timeMap.day})</p>
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