import { memo, useState } from 'react';
import { Info, Trash } from 'lucide-react'; // Import Trash icon for the delete option
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
  onDelete: (deletedPOI: ItineraryPOI) => void;
}

// Helper function to convert minutes to HH:MM
function minutesToHHMM(minutes: number): string {
  if (minutes === -1) return "-1"; // Handle -1 case
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

const ItineraryDynamicPOI = memo(({ poi, timeMap, onDelete }: ItineraryDynamicPOIProps) => {
  const displayStartTime = minutesToHHMM(timeMap.startTime);
  const displayEndTime = minutesToHHMM(timeMap.endTime);

  // State to control the dialog visibility
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Function to handle the delete action
  const handleDelete = () => {
    onDelete(poi);
  };

  return (
    <div
      className="h-full w-full bg-blue-100 border border-gray-200 rounded-md p-2 
                 shadow-sm hover:shadow-lg transition-shadow cursor-grab active:cursor-grabbing relative"
    >
      <div className="flex flex-col h-full justify-between">
        <div>
          <div className="text-sm font-medium truncate">{poi.name}</div>
          <div className="text-xs text-gray-500">
            {displayStartTime} - {displayEndTime} (Day {timeMap.day}) {/* Display converted times */}
          </div>
        </div>

        {/* Dropdown Menu Triggered by Hover */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div
              className="absolute bottom-2 right-2 w-8 h-8 flex items-center justify-center 
                         bg-blue-200 rounded-full hover:bg-blue-300 transition-colors cursor-pointer"
            >
              <Info className="h-3 w-3" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="bg-white z-50" // Set background to white and ensure high z-index
            onMouseEnter={(e) => e.stopPropagation()} // Prevent hover from closing the menu
          >
            {/* Information Option */}
            <DropdownMenuItem
              className="cursor-pointer p-0" // Remove default padding to fit the button
              onSelect={(e) => e.preventDefault()} // Prevent default behavior
            >
              <Button
                variant="outline"
                size="sm"
                className="w-full flex items-center justify-start bg-white hover:bg-blue-200 text-black"
                onClick={() => setIsDialogOpen(true)} // Open the dialog
              >
                <Info className="h-4 w-4 mr-2" />
                Information
              </Button>
            </DropdownMenuItem>

            {/* Delete Option */}
            <DropdownMenuItem
              className="cursor-pointer p-0" // Remove default padding to fit the button
              onSelect={(e) => e.preventDefault()} // Prevent default behavior
            >
              <Button
                variant="destructive"
                size="sm"
                className="w-full flex items-center justify-start bg-red-500 hover:bg-red-600 text-white"
                onClick={handleDelete}
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dialog for displaying POI information */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
  );
});

ItineraryDynamicPOI.displayName = 'ItineraryDynamicPOI';

export default ItineraryDynamicPOI;