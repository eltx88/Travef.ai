import { useState, useRef, useEffect } from 'react';
import type { ItineraryPOI, TripData } from '@/Types/InterfaceTypes';
import ItineraryDynamicPOI from './ItineraryDynamicPOI';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Add custom styles to improve drag performance
const customStyles = `
  .react-grid-item.react-draggable-dragging {
    transition: none !important;
    z-index: 100;
    will-change: transform;
    cursor: grabbing !important;
  }
  .react-grid-item > .react-resizable-handle {
    cursor: ew-resize;
  }
  .drag-handle {
    cursor: grab;
  }
  .drag-handle:active {
    cursor: grabbing;
  }
`;

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
  const DAY_SPACING = 2; 
  const DAY_LABEL_WIDTH = 120; 
  
  // Reference to the grid layout
  const gridRef = useRef<GridLayout>(null);
  
  // Track whether an item is being dragged
  const [isDragging, setIsDragging] = useState(false);

  const [gridPositions, setGridPositions] = useState<Map<string, { x: number, y: number, w: number }>>(
    new Map(pois.map(poi => [
      poi.id,
      {
        x: timeToGridPosition(poi.StartTime),
        y: poi.day - 1,
        w: getDurationInCells(poi.StartTime, poi.EndTime)
      }
    ]))
  );

  // Inject custom CSS when component mounts
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = customStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Update grid positions when POIs change
  useEffect(() => {
    setGridPositions(new Map(pois.map(poi => [
      poi.id,
      {
        x: timeToGridPosition(poi.StartTime),
        y: poi.day - 1,
        w: getDurationInCells(poi.StartTime, poi.EndTime)
      }
    ])));
  }, [pois]);

  function timeToGridPosition(time: number): number {
    if (time === -1) return 0;
    const hoursFromStart = Math.floor(time / 60) - START_HOUR;
    const cellsFromMinutes = Math.floor((time % 60) / 30);
    return (hoursFromStart * CELLS_PER_HOUR) + cellsFromMinutes;
  }

  function gridPositionToTime(position: number): number {
    if (position === -1) return -1;
    const totalMinutes = (position * 30) + (START_HOUR * 60);
    return totalMinutes;
  }

  function getDurationInCells(startTime: number, endTime: number): number {
    if (startTime === -1 || endTime === -1) return 1; // Default to 1 cell
    const startPosition = timeToGridPosition(startTime);
    const endPosition = timeToGridPosition(endTime);
    return Math.max(1, endPosition - startPosition); // Ensure at least 1 cell
  }

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

  const layout = pois.map(poi => {
    const position = gridPositions.get(poi.id) || {
      x: timeToGridPosition(poi.StartTime),
      y: poi.day - 1,
      w: getDurationInCells(poi.StartTime, poi.EndTime)
    };

    return {
      i: poi.id,
      x: position.x,
      y: position.y,
      w: position.w,
      h: 1,
      minW: 1,
      maxW: TOTAL_CELLS,
      isBounded: false // Allow items to be dragged outside the grid temporarily
    };
  });

  // Handle drag start
  const handleDragStart = () => {
    setIsDragging(true);
    document.body.style.cursor = 'grabbing';
    // Add a class to the body to disable text selection during drag
    document.body.classList.add('dragging-active');
  };

  // Handle drag stop
  const handleDragStop = () => {
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.classList.remove('dragging-active');
  };

  const handleLayoutChange = (newLayout: ReactGridLayout.Layout[]) => {
    if (hasTimeConflict(newLayout)) return;

    const updatedGridPositions = new Map<string, { x: number, y: number, w: number }>();
    const updatedPOIs: ItineraryPOI[] = [];

    newLayout.forEach(item => {
      const poi = pois.find(p => p.id === item.i);
      if (!poi) return;

      updatedGridPositions.set(item.i, { x: item.x, y: item.y, w: item.w });

      const newStartTime = gridPositionToTime(item.x);
      const newEndTime = gridPositionToTime(item.x + item.w);

      const currentPosition = gridPositions.get(item.i);
      if (!currentPosition || currentPosition.x !== item.x || currentPosition.y !== item.y || currentPosition.w !== item.w) {
        updatedPOIs.push({
          ...poi,
          StartTime: newStartTime,
          EndTime: newEndTime,
          day: item.y + 1
        });
      }
    });

    setGridPositions(updatedGridPositions);
    updatedPOIs.forEach(poi => onUpdatePOI(poi));
  };

  return (
    <div 
      className="relative mb-8 bg-white rounded-lg shadow-md p-6 border border-gray-300" 
      style={{ 
        width: `${DAY_LABEL_WIDTH + (TOTAL_CELLS * CELL_SIZE) + 100}px`,
        minWidth: `${DAY_LABEL_WIDTH + (TOTAL_CELLS * CELL_SIZE) + 100}px`
      }}>
      <div className="flex">
        {/* Day Labels Column*/}
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
                    height: `${DAY_HEIGHT -2}px`,
                    width: `${TOTAL_CELLS * CELL_SIZE}px`, // Match timeline width
                    top: `${i * (DAY_HEIGHT + DAY_SPACING)}px`,
                    left: 0,
                  }}
                />
              ))}
            </div>

            <div style={{
              height: `${(tripData.monthlyDays * DAY_HEIGHT) + ((tripData.monthlyDays - 1) * DAY_SPACING)}px`,
              position: 'relative',
              zIndex: 2
            }}>
              <GridLayout
                className="layout"
                layout={layout}
                cols={TOTAL_CELLS}
                rowHeight={DAY_HEIGHT}
                width={TOTAL_CELLS * CELL_SIZE}
                margin={[5, DAY_SPACING / 2]}
                containerPadding={[0, DAY_SPACING / 2]}
                onLayoutChange={handleLayoutChange}
                onDragStart={handleDragStart}
                onDragStop={handleDragStop}
                isDraggable
                isResizable
                resizeHandles={['e', 'w']}
                preventCollision
                compactType={null}
                maxRows={tripData.monthlyDays}
                ref={gridRef}
                draggableHandle=".drag-handle"
                useCSSTransforms={true}
                transformScale={1}
                autoSize={true}
                isBounded={false}
                allowOverlap={false}
              >
                {pois.map(poi => {
                  const position = gridPositions.get(poi.id);
                  if (poi.day > tripData.monthlyDays) return null;
                  return (
                    <div key={poi.id} data-grid={{ x: position?.x || 0, y: position?.y || 0, w: position?.w || 1, h: 1 }}>
                      <ItineraryDynamicPOI
                        poi={{
                          ...poi,
                          StartTime: poi.StartTime,
                          EndTime: poi.EndTime
                        }}
                        timeMap={{
                          gridPosition: position?.x || 0,
                          width: position?.w || 0,
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