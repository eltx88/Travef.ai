import { useState, useRef, useEffect, useCallback } from 'react';
import type { ItineraryPOI, TripData } from '@/Types/InterfaceTypes';
import ItineraryDynamicPOI from './ItineraryDynamicPOI';
import GridLayout, { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

interface ItineraryDayContainerProps {
  pois: ItineraryPOI[];
  tripData: TripData;
  onUpdatePOI: (updatedPOI: ItineraryPOI) => void;
  onDeletePOI: (deletedPOI: ItineraryPOI) => void;
}

const ItineraryDayContainer = ({ 
  pois,
  tripData,
  onUpdatePOI,
  onDeletePOI
}: ItineraryDayContainerProps) => {
  const START_HOUR = 8;
  const END_HOUR = 23;
  const CELL_SIZE = 80;
  const CELLS_PER_HOUR = 2;
  const TOTAL_CELLS = (END_HOUR - START_HOUR) * CELLS_PER_HOUR;
  const DAY_HEIGHT = 100;
  const DAY_SPACING = 4; 
  const DAY_LABEL_WIDTH = 120;
  
  const gridRef = useRef<GridLayout>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isInitialRender, setIsInitialRender] = useState(true);
  const userInteractedRef = useRef(false);

  // Initialize first render flag
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialRender(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  // Convert time to grid position
  const timeToGridPosition = useCallback((time: number): number => {
    if (time === -1) return 0;
    const hoursFromStart = Math.floor(time / 60) - START_HOUR;
    const cellsFromMinutes = Math.floor((time % 60) / 30);
    return Math.max(0, (hoursFromStart * CELLS_PER_HOUR) + cellsFromMinutes);
  }, [START_HOUR, CELLS_PER_HOUR]);

  // Convert grid position to time
  const gridPositionToTime = useCallback((position: number): number => {
    if (position < 0) return -1;
    const totalMinutes = (position * 30) + (START_HOUR * 60);
    return totalMinutes;
  }, [START_HOUR]);

  // Calculate duration in cells
  const getDurationInCells = useCallback((startTime: number, endTime: number): number => {
    if (startTime === -1 || endTime === -1) return 1; // Default to 1 cell
    const startPosition = timeToGridPosition(startTime);
    const endPosition = timeToGridPosition(endTime);
    return Math.max(1, endPosition - startPosition); // Ensure at least 1 cell
  }, [timeToGridPosition]);

  // Get time slot (Morning, Afternoon, Evening)
  const getTimeSlot = useCallback((startTime: number): string => {
    const hoursFromStart = Math.floor(startTime / 60);
    if (hoursFromStart >= 8 && hoursFromStart < 12) return "Morning";
    if (hoursFromStart >= 12 && hoursFromStart < 18) return "Afternoon";
    return "Evening";
  }, []);

  // Prepare layout with one POI at a time
  const layout: Layout[] = pois.map(poi => ({
    i: poi.id,
    x: timeToGridPosition(poi.StartTime),
    y: poi.day - 1,
    w: getDurationInCells(poi.StartTime, poi.EndTime),
    h: 1,
    minW: 1,
    maxW: TOTAL_CELLS
  }));

  // Handle drag start
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    userInteractedRef.current = true;
  }, []);

  const handleDragStop = useCallback((layout: Layout[], oldItem: Layout, newItem: Layout) => {
    setIsDragging(false);
    
    // Skip processing during initialization
    if (isInitialRender || !userInteractedRef.current) return;
    
    // Find the POI that was moved
    const poi = pois.find(p => p.id === newItem.i);
    if (!poi) return;
    
    // Get new position data
    const newStartTime = gridPositionToTime(newItem.x);
    const newEndTime = gridPositionToTime(newItem.x + newItem.w);
    const newDay = newItem.y + 1;
    
    // Ensure day is within valid range
    if (newDay > 0 && newDay <= tripData.monthlyDays) {
      const newDuration = newEndTime - newStartTime;
      const newTimeSlot = getTimeSlot(newStartTime);
      
      // Only update if something changed
      if (newStartTime !== poi.StartTime || 
          newEndTime !== poi.EndTime || 
          newDay !== poi.day) {
        
        // Create updated POI
        const updatedPoi = {
          ...poi,
          StartTime: newStartTime,
          EndTime: newEndTime,
          day: newDay,
          duration: newDuration,
          timeSlot: newTimeSlot
        };
        
        // Send update to parent
        onUpdatePOI(updatedPoi);
      }
    }
  }, [isInitialRender, pois, tripData.monthlyDays, onUpdatePOI, gridPositionToTime, getTimeSlot]);

  const handleResizeStop = useCallback((layout: Layout[], oldItem: Layout, newItem: Layout) => {
    if (isInitialRender || !userInteractedRef.current) return;
    
    // Find the POI that was resized
    const poi = pois.find(p => p.id === newItem.i);
    if (!poi) return;
    
    // Get new position data
    const newStartTime = gridPositionToTime(newItem.x);
    const newEndTime = gridPositionToTime(newItem.x + newItem.w);
    const newDay = newItem.y + 1;
    
    // Ensure day is within valid range
    if (newDay > 0 && newDay <= tripData.monthlyDays) {
      const newDuration = newEndTime - newStartTime;
      const newTimeSlot = getTimeSlot(newStartTime);
      
      // Only update if something changed
      if (newStartTime !== poi.StartTime || 
          newEndTime !== poi.EndTime) {
        
        // Create updated POI
        const updatedPoi = {
          ...poi,
          StartTime: newStartTime,
          EndTime: newEndTime,
          day: newDay,
          duration: newDuration,
          timeSlot: newTimeSlot
        };
        
        // Send update to parent
        onUpdatePOI(updatedPoi);
      }
    }
  }, [isInitialRender, pois, tripData.monthlyDays, onUpdatePOI, gridPositionToTime, getTimeSlot]);
  
  return (
    <div 
      className="relative mb-8 bg-white rounded-lg shadow-md p-6 border border-gray-300" 
      style={{ 
        width: `${DAY_LABEL_WIDTH + (TOTAL_CELLS * CELL_SIZE) + 100}px`,
        minWidth: `${DAY_LABEL_WIDTH + (TOTAL_CELLS * CELL_SIZE) + 100}px`
      }}>
      <div className="flex">
        {/* Day Labels Column */}
        <div className="flex-none bg-white" style={{ width: `${DAY_LABEL_WIDTH}px`, zIndex: 10 }}>
          <div className="h-8" /> 
          <div className="flex flex-col">
            {Array.from({ length: tripData.monthlyDays }).map((_, i) => {
              const startDate = new Date(tripData.fromDT || new Date());
              const currentDate = new Date(startDate);
              currentDate.setDate(startDate.getDate() + i);
              
              return (
                <div
                  key={i}
                  className="flex flex-col justify-center px-4"
                  style={{ height: `${DAY_HEIGHT + (i < tripData.monthlyDays - 1 ? DAY_SPACING : 0)}px` }}
                >
                  <div className="font-semibold">Day {i + 1}</div>
                  <div className="text-sm text-gray-500">
                    {currentDate.toLocaleDateString('en-UK', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Grid Container */}
        <div className="flex-1">
          {/* Timeline Header */}
          <div className="flex mb-2 bg-white" style={{ zIndex: 5 }}>
            {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => (
              <div
                key={i}
                className="flex-none text-xs text-gray-500 border-l border-gray-200"
                style={{ width: `${CELL_SIZE * 2}px` }}
              >
                <span className="ml-2">{String(START_HOUR + i).padStart(2, '0')}:00</span>
              </div>
            ))}
          </div>

          {/* Grid Layout */}
          <div className="relative">
            {/* Day Background Panels */}
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
              {Array.from({ length: tripData.monthlyDays }).map((_, i) => (
                <div
                  key={i}
                  className="absolute bg-gray-50 rounded-lg border border-gray-200"
                  style={{
                    height: `${DAY_HEIGHT - 2}px`,
                    width: `${TOTAL_CELLS * CELL_SIZE}px`,
                    top: `${i * (DAY_HEIGHT + DAY_SPACING)}px`,
                    left: 0,
                  }}
                />
              ))}
            </div>

            <div
              style={{
                height: `${(tripData.monthlyDays * DAY_HEIGHT) + ((tripData.monthlyDays - 1) * DAY_SPACING)}px`,
                position: 'relative',
                zIndex: 2
              }}
            >
              <GridLayout
                className="layout"
                layout={layout}
                cols={TOTAL_CELLS}
                rowHeight={DAY_HEIGHT}
                width={TOTAL_CELLS * CELL_SIZE}
                margin={[5, DAY_SPACING / 2]}
                containerPadding={[0, DAY_SPACING / 2]}
                onDragStart={handleDragStart}
                onDragStop={handleDragStop}
                onResizeStop={handleResizeStop}
                isDraggable
                isResizable
                resizeHandles={['e', 'w']}
                preventCollision
                compactType={null}
                maxRows={tripData.monthlyDays}
                ref={gridRef}
                draggableHandle=".drag-handle"
                isBounded={false}
              >
                {pois.map(poi => {
                  // Skip POIs with invalid days
                  if (poi.day <= 0 || poi.day > tripData.monthlyDays) return null;
                  
                  return (
                    <div key={poi.id}>
                      <ItineraryDynamicPOI
                        poi={poi}
                        timeMap={{
                          gridPosition: timeToGridPosition(poi.StartTime),
                          width: getDurationInCells(poi.StartTime, poi.EndTime),
                          startTime: poi.StartTime,
                          endTime: poi.EndTime,
                          day: poi.day
                        }}
                        onDelete={onDeletePOI}
                        isDragging={isDragging}
                      />
                    </div>
                  );
                })}
              </GridLayout>

              {/* Grid Lines */}
              <div
                className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none"
                style={{
                  backgroundImage: `
                    repeating-linear-gradient(90deg, 
                      transparent,
                      transparent ${CELL_SIZE * 2 - 1}px,
                      #e5e7eb ${CELL_SIZE * 2}px
                    )
                  `,
                  backgroundSize: `${CELL_SIZE * 2}px 100%`,
                  zIndex: 1,
                  marginLeft: '-1px'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItineraryDayContainer;