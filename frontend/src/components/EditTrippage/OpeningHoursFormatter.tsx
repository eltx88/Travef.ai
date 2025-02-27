import { Clock } from 'lucide-react';

const OpeningHoursFormatter = ({ openingHours }: { openingHours: string }) => {
  // Parse the opening hours string into a structured format
  const formatOpeningHours = (hoursString: string) => {
    if (!hoursString) return [];
    
    // Split the string by day
    const daysRegex = /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday):/g;
    const days = hoursString.split(daysRegex).filter(Boolean);
    const dayNames = hoursString.match(daysRegex)?.map(day => day.replace(':', '')) || [];
    
    // Create an array of day-hours pairs
    const formattedHours: { day: string; hours: string }[] = [];
    dayNames.forEach((day, index) => {
      formattedHours.push({
        day: day,
        hours: days[index].trim()
      });
    });
    
    return formattedHours;
  };

  const formattedHours = formatOpeningHours(openingHours);

  return (
    <div className="flex items-start gap-2">
      <Clock className="h-5 w-5 text-gray-500 mt-0.5" />
      <div>
        <h4 className="font-medium mb-1">Opening Hours</h4>
        <div className="text-sm text-gray-600">
          {formattedHours.length > 0 ? (
            <div className="space-y-0.5">
              {formattedHours.map((item, index) => (
                <div key={index}>
                  <span className="font-medium mr-1">{item.day}:</span>
                  <span>{item.hours}</span>
                </div>
              ))}
            </div>
          ) : (
            <p>{openingHours}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OpeningHoursFormatter;