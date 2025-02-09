import type { ItineraryPOI, TripData } from '@/Types/InterfaceTypes';
import ItineraryDynamicPOI from './ItineraryDynamicPOI';

interface ItineraryDayContainerProps {
  dayNumber: number;
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
  // Time constants
  const START_HOUR = 8;
  const END_HOUR = 23;
  const HOUR_WIDTH = 100; // pixels per hour
  const HOURS_RANGE = END_HOUR - START_HOUR;
  const TIMELINE_WIDTH = HOURS_RANGE * HOUR_WIDTH;
  
  // Calculate date for this day
  const dayDate = new Date(tripData.dateRange.from);
  dayDate.setDate(dayDate.getDate() + (dayNumber - 1));
  
  const formattedDate = dayDate.toLocaleDateString('en-UK', {
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });

  // Handle POI time updates
  const handleTimeChange = (poiId: string, newStartTime: string, newEndTime: string) => {
    const updatedPOI = pois.find(p => p.id === poiId);
    if (updatedPOI) {
      onUpdatePOI({
        ...updatedPOI,
        StartTime: newStartTime,
        EndTime: newEndTime
      });
    }
  };

  // Generate time markers
  const timeMarkers = Array.from({ length: HOURS_RANGE + 1 }, (_, i) => {
    const hour = START_HOUR + i;
    return (
      <div
        key={hour}
        className="absolute top-0 bottom-4 h-full border-l border-gray-200 text-xs text-gray-500"
        style={{ left: `${i * HOUR_WIDTH}px` }}
      >
        {`${hour}:00`}
      </div>
    );
  });

  const dayKey = `Day ${dayNumber}`;

  return (
    <div 
      className="relative mb-8 bg-white rounded-lg shadow-md p-6 border border-gray-300 overflow-hidden"
      style={{ width: `${TIMELINE_WIDTH}px`, minHeight: '200px' }}
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex flex-col">
          <span className="font-semibold text-lg">{dayKey}</span>
          <span className="text-sm text-gray-600">{formattedDate}</span>
        </div>
      </div>
      <div className="relative h-32 pl-4 pr-4 pt-2 timeline-container">
        {timeMarkers}
        {pois.map((poi) => (
          <ItineraryDynamicPOI
            key={poi.id}
            poi={poi}         
            startHour={START_HOUR}
            hourWidth={HOUR_WIDTH}
            dayPOIs={pois}
            onTimeChange={handleTimeChange}
          />
        ))}
      </div>
    </div>
  );
};

export default ItineraryDayContainer;