import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { ItineraryPOI } from '@/Types/InterfaceTypes';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';

interface CustomHandleProps {
  handleAxis: string;
  ref?: React.Ref<any>;
  onClick?: (e: React.MouseEvent) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onMouseUp?: (e: React.MouseEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
}

const CustomHandle = React.forwardRef<HTMLDivElement, CustomHandleProps>(
  ({ handleAxis, onMouseDown, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`react-resizable-handle react-resizable-handle-${handleAxis} 
                   absolute w-2 hover:bg-blue-300 active:bg-blue-400 cursor-ew-resize`}
        style={{
          top: 0,
          bottom: 0,
          [handleAxis === 'w' ? 'left' : 'right']: -4,
          cursor: 'ew-resize'
        }}
        onMouseDown={(e) => {
          // Only trigger on left mouse button
          if (e.button === 0 && onMouseDown) {
            onMouseDown(e);
          }
        }}
        {...props}
      />
    );
  }
);

CustomHandle.displayName = 'CustomHandle';

interface ItineraryDynamicPOIProps {
  poi: ItineraryPOI;
  startHour: number;
  hourWidth: number;
  dayPOIs: ItineraryPOI[];
  onTimeChange: (poiId: string, newStartTime: string, newEndTime: string) => void;
}

const ItineraryDynamicPOI = ({ 
  poi, 
  startHour, 
  hourWidth,
  dayPOIs,
  onTimeChange 
}: ItineraryDynamicPOIProps) => {
  const [isResizing, setIsResizing] = useState(false);

  // Helper to convert time string to position and width
  const calculatePosition = (startStr: string, endStr: string) => {
    const [startHours, startMinutes] = startStr.split(':').map(Number);
    const [endHours, endMinutes] = endStr.split(':').map(Number);
    
    // Calculate positions relative to startHour
    const startPosition = ((startHours - startHour) * hourWidth) + ((startMinutes / 60) * hourWidth);
    const endPosition = ((endHours - startHour) * hourWidth) + ((endMinutes / 60) * hourWidth);
    const width = endPosition - startPosition;
    
    return { left: startPosition, width };
  };

  // Check for time slot conflicts
  const hasTimeConflict = (startTime: string, endTime: string) => {
    return dayPOIs.some(otherPoi => {
      if (otherPoi.id === poi.id) return false;
      
      const start = calculatePosition(startTime, startTime).left;
      const end = calculatePosition(endTime, endTime).left;
      const otherStart = calculatePosition(otherPoi.StartTime, otherPoi.StartTime).left;
      const otherEnd = calculatePosition(otherPoi.EndTime, otherPoi.EndTime).left;

      return (start < otherEnd && end > otherStart);
    });
  };

  const { left, width } = calculatePosition(poi.StartTime, poi.EndTime);

  const handleResizeStart = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleResizeStop = () => {
    setIsResizing(false);
  };

  const handleResize = (_: React.SyntheticEvent, { size, handle }: { size: { width: number }, handle: string }) => {
    let newStartTime = poi.StartTime;
    let newEndTime = poi.EndTime;

    if (handle === 'w') {
        const newStartPosition = left + (width - size.width);
        const startHours = Math.floor(newStartPosition / hourWidth) + startHour;
        const startMinutes = Math.round((newStartPosition % hourWidth) / hourWidth * 60 / 30) * 30;

        const formattedStartTime = `${String(startHours).padStart(2, '0')}:${String(startMinutes).padStart(2, '0')}`;

        // Ensure the start time is not before 08:00
        if (startHours >= 8) {
            newStartTime = formattedStartTime;
        }
    } else {
        const endPosition = left + size.width;
        const endHours = Math.floor(endPosition / hourWidth) + startHour;
        const endMinutes = Math.round((endPosition % hourWidth) / hourWidth * 60 / 30) * 30;

        let finalEndHours = endHours;
        let finalEndMinutes = endMinutes;
        if (finalEndMinutes === 60) {
            finalEndHours += 1;
            finalEndMinutes = 0;
        }

        const formattedEndTime = `${String(finalEndHours).padStart(2, '0')}:${String(finalEndMinutes).padStart(2, '0')}`;

        // Ensure the end time does not go beyond 23:00
        if (finalEndHours < 22 || (finalEndHours === 22 && finalEndMinutes === 0)) {
            newEndTime = formattedEndTime;
        }
    }

    // Validate and apply the new times
    const proposedNewWidth = calculatePosition(newStartTime, newEndTime).width;
    if (proposedNewWidth > 0 && !hasTimeConflict(newStartTime, newEndTime)) {
        onTimeChange(poi.id, newStartTime, newEndTime);
    }
};


  return (
    <div style={{ position: 'absolute', left: `${left}px`, top: '32px', width: `${width}px` }}>
      <Resizable
        width={width}
        height={80}
        axis="x"
        resizeHandles={['w', 'e']}
        minConstraints={[hourWidth/2, 80]}
        maxConstraints={[13 * hourWidth, 80]}
        onResizeStart={handleResizeStart}
        onResizeStop={handleResizeStop}
        onResize={handleResize}
        handle={(h, ref) => (
          <CustomHandle
            handleAxis={h}
            ref={ref}
          />
        )}
        draggableOpts={{ 
          grid: [hourWidth/2, 0]
        }}
      >
      
        <div 
          className={`bg-blue-100 border border-gray-200 rounded-md p-2 shadow-sm 
                     hover:shadow-lg transition-shadow relative
                     ${isResizing ? 'select-none' : ''}`}
          style={{ width: '100%', height: '100%' }}
        >
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="text-sm font-medium truncate">{poi.name}</div>
              <div className="text-xs text-gray-500">
                {poi.StartTime} - {poi.EndTime}
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
                  <p><strong>Time:</strong> {poi.StartTime} - {poi.EndTime}</p>
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
      </Resizable>
    </div>
  );
};

export default ItineraryDynamicPOI;