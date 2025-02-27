import { memo, useState, useEffect } from 'react';
import { Info, Trash, GripVertical } from 'lucide-react';
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
  isDragging?: boolean;
}

// Helper function to convert minutes to HH:MM
function minutesToHHMM(minutes: number): string {
  if (minutes === -1) return "-1"; // Handle -1 case
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

const ItineraryDynamicPOI = memo(({ poi, timeMap, onDelete, isDragging = false }: ItineraryDynamicPOIProps) => {
  const displayStartTime = minutesToHHMM(timeMap.startTime);
  const displayEndTime = minutesToHHMM(timeMap.endTime);

  // State to control the dialog visibility
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [localIsDragging, setLocalIsDragging] = useState(false);

  // Listen for mouse events globally to better track dragging state
  useEffect(() => {
    const handleMouseDown = () => {
      const activeElement = document.activeElement;
      if (activeElement && activeElement.closest('.drag-handle')) {
        setLocalIsDragging(true);
      }
    };

    const handleMouseUp = () => {
      setLocalIsDragging(false);
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Sync with parent dragging state
  useEffect(() => {
    if (isDragging !== localIsDragging) {
      setLocalIsDragging(isDragging);
    }
  }, [isDragging]);

  // Function to handle the delete action
  const handleDelete = () => {
    onDelete(poi);
  };

  // Apply different styles based on drag state
  const dragStyles = localIsDragging ? {
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
    transform: 'scale(1.02)',
    opacity: 0.9,
    zIndex: 1000
  } : {};

  return (
    <div
      className={`h-full w-full bg-blue-600 border text-white border-gray-200 rounded-md p-2 
                 shadow-sm select-none relative transition-none`}
      style={{ 
        touchAction: 'none',
        willChange: 'transform',
        ...dragStyles
      }}
    >
      {/* Main drag handle area - covers the entire component */}
      <div 
        className="drag-handle absolute inset-0 cursor-grab active:cursor-grabbing z-10" 
        style={{ 
          touchAction: 'none'
        }}
        onMouseDown={(e) => {
          // Prevent text selection during dragging
          e.preventDefault();
          // Apply grabbing cursor to body
          document.body.style.cursor = 'grabbing';
        }}
      />
      
      {/* Content container that's positioned above the drag handle */}
      <div className="flex flex-col h-full justify-between relative z-20 pointer-events-none">
        <div className="pointer-events-auto">
          {/* Show grip icon to indicate draggable */}
          <div className="absolute top-1 left-1 opacity-60">
            <GripVertical size={12} className="drag-indicator" />
          </div>
          
          <div className="text-sm font-medium truncate pl-5">{poi.name}</div>
          <div className="text-xs text-white mt-1">
            {displayStartTime} - {displayEndTime} (Day {timeMap.day})
          </div>
        </div>

        {/* Dropdown Menu Triggered by Icon */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div
              className="absolute bottom-2 right-2 w-8 h-8 flex items-center justify-center 
                         bg-blue-200 rounded-full hover:bg-blue-300 transition-colors cursor-pointer
                         pointer-events-auto z-30"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <Info className="h-3 w-3 text-black" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="bg-white z-50"
            onMouseEnter={(e) => e.stopPropagation()}
          >
            {/* Information Option */}
            <DropdownMenuItem
              className="cursor-pointer p-0"
              onSelect={(e) => e.preventDefault()}
            >
              <Button
                variant="outline"
                size="sm"
                className="w-full flex items-center justify-start bg-white hover:bg-blue-200 text-black"
                onClick={() => setIsDialogOpen(true)}
              >
                <Info className="h-4 w-4 mr-2" />
                Information
              </Button>
            </DropdownMenuItem>

            {/* Delete Option */}
            <DropdownMenuItem
              className="cursor-pointer p-0"
              onSelect={(e) => e.preventDefault()}
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
              <strong>Time:</strong> {displayStartTime} - {displayEndTime} (Day {timeMap.day})
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