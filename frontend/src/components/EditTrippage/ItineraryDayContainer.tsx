import { useState } from 'react';
import type { ItineraryPOI, TripData } from '@/Types/InterfaceTypes';
import ItineraryDynamicPOI from './ItineraryDynamicPOI';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

interface ItineraryDayContainerProps {
  dayNumber: string;
  pois: ItineraryPOI[];
  tripData: TripData;
  onUpdatePOI: (updatedPOI: ItineraryPOI) => void;
}

const ItineraryDayContainer = ({ 
  dayNumber, 
  pois,
  tripData,
  onUpdatePOI
}: ItineraryDayContainerProps) => {
  const START_HOUR = 8;
  const END_HOUR = 23;
  const CELL_SIZE = 80;
  const CELLS_PER_HOUR = 2; // 2 cells per hour (30-min increments)
  const TOTAL_CELLS = (END_HOUR - START_HOUR) * CELLS_PER_HOUR;
  
  // Track changes in grid positions
  const [gridPositions, setGridPositions] = useState<Map<string, { x: number, w: number }>>(
    new Map(pois.map(poi => [
      poi.id,
      { 
        x: timeToGridPosition(poi.StartTime),
        w: getDurationInCells(poi.StartTime, poi.EndTime)
      }
    ]))
  );

  // Convert time to grid position
  function timeToGridPosition(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    const hoursFromStart = hours - START_HOUR;
    const cellsFromMinutes = Math.floor(minutes / 30);
    return (hoursFromStart * CELLS_PER_HOUR) + cellsFromMinutes;
  }

  // Convert grid position to time
  function gridPositionToTime(position: number): string {
    const totalMinutes = (position * 30) + (START_HOUR * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  // Calculate duration in grid cells
  function getDurationInCells(startTime: string, endTime: string): number {
    const startPosition = timeToGridPosition(startTime);
    const endPosition = timeToGridPosition(endTime);
    return endPosition - startPosition;
  }

  // Check for time conflicts
  function hasTimeConflict(layout: ReactGridLayout.Layout[]): boolean {
    for (let i = 0; i < layout.length; i++) {
      for (let j = i + 1; j < layout.length; j++) {
        if (layout[i].y === layout[j].y) {
          const iStart = layout[i].x;
          const iEnd = layout[i].x + layout[i].w;
          const jStart = layout[j].x;
          const jEnd = layout[j].x + layout[j].w;
          
          if (iStart < jEnd && iEnd > jStart) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // Generate initial layout
  const layout = pois.map(poi => {
    const position = gridPositions.get(poi.id) || {
      x: timeToGridPosition(poi.StartTime),
      w: getDurationInCells(poi.StartTime, poi.EndTime)
    };
    
    return {
      i: poi.id,
      x: position.x,
      y: 0,
      w: position.w,
      h: 1,
      minW: 1, // Minimum 30 minutes
      maxW: TOTAL_CELLS // Maximum whole day
    };
  });

  const handleLayoutChange = (newLayout: ReactGridLayout.Layout[]) => {
    if (hasTimeConflict(newLayout)) return;

    const updatedGridPositions = new Map<string, { x: number, w: number }>();
    const updatedPOIs: ItineraryPOI[] = [];

    newLayout.forEach(item => {
      const poi = pois.find(p => p.id === item.i);
      if (!poi) return;

      // Update grid positions
      updatedGridPositions.set(item.i, { x: item.x, w: item.w });

      // Calculate new times based on grid position
      const newStartTime = gridPositionToTime(item.x);
      const newEndTime = gridPositionToTime(item.x + item.w);

      // Only update if position has changed
      const currentPosition = gridPositions.get(item.i);
      if (!currentPosition || 
          currentPosition.x !== item.x || 
          currentPosition.w !== item.w) {
        updatedPOIs.push({
          ...poi,
          StartTime: newStartTime,
          EndTime: newEndTime,
          day: `Day ${dayNumber}` 
        });
      }
    });

    // Update state and trigger updates
    setGridPositions(updatedGridPositions);
    updatedPOIs.forEach(poi => onUpdatePOI(poi));
  };

  const dayDate = new Date(tripData.dateRange.from);
  dayDate.setDate(dayDate.getDate() + (Number(dayNumber) - 1));
  
  const formattedDate = dayDate.toLocaleDateString('en-UK', {
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });

  return (
    <div className="relative mb-8 bg-white rounded-lg shadow-md p-6 border border-gray-300">
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col">
          <span className="font-semibold text-lg">Day {dayNumber}</span>
          <span className="text-sm text-gray-600">{formattedDate}</span>
        </div>
      </div>

      {/* Timeline Header */}
      <div className="flex mb-2 pl-6">
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
      <div className="relative" style={{ height: '200px' }}>
        <GridLayout
          className="layout"
          layout={layout}
          cols={TOTAL_CELLS}
          rowHeight={80}
          width={TOTAL_CELLS * CELL_SIZE}
          margin={[5, 5]}
          containerPadding={[20, 0]}
          onLayoutChange={handleLayoutChange}
          isDraggable
          isResizable
          resizeHandles={['e', 'w']}
          preventCollision
          compactType={null}
        >
          {pois.map(poi => {
            const position = gridPositions.get(poi.id);
            const displayStartTime = position ? gridPositionToTime(position.x) : poi.StartTime;
            const displayEndTime = position ? gridPositionToTime(position.x + position.w) : poi.EndTime;
                
            return (
              <div key={poi.id}>
                <ItineraryDynamicPOI
                  poi={{
                    ...poi,
                    StartTime: displayStartTime,
                    EndTime: displayEndTime
                  }}
                  timeMap={{
                    gridPosition: position?.x || 0,
                    width: position?.w || 0,
                    startTime: displayStartTime,
                    endTime: displayEndTime,
                    day: dayNumber
                  }}
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
                transparent ${CELL_SIZE - 1}px, 
                #e5e7eb ${CELL_SIZE}px
              )
            `,
            backgroundSize: `${CELL_SIZE}px 100%`,
            marginLeft: '20px'
          }}
        />
      </div>
    </div>
  );
};

export default ItineraryDayContainer;