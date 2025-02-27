import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { TripData, ItineraryPOI } from '@/Types/InterfaceTypes';
import { cn } from "@/lib/utils";
import ItineraryPOICard from './ItineraryPOICard';
import { Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type TabType = 'itinerary' | 'saved' | 'search';

interface ItineraryPointsProps {
  tripData: TripData;
  itineraryPOIs: ItineraryPOI[];
  unusedPOIs: ItineraryPOI[];
  onAddToItinerary: (poi: ItineraryPOI, day: number) => void; // Pass onAddToItinerary as a prop
  onDeleteSavedPOI: (poi: ItineraryPOI) => void; // Pass onDeleteSavedPOI as a prop
}

const ItineraryPoints = ({ 
  tripData,
  itineraryPOIs,
  unusedPOIs,
  onAddToItinerary,
  onDeleteSavedPOI,
}: ItineraryPointsProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('itinerary');
  const [filterDay, setFilterDay] = useState<string>('all'); 
  const [filterTimeSlot, setFilterTimeSlot] = useState<string>('all');
  const savedAttractions = unusedPOIs.filter(poi => poi.type === 'attraction');
  const savedRestaurants = unusedPOIs.filter(poi => poi.type !== 'attraction');

  // Memoize day options to prevent unnecessary recalculations
  const dayOptions = useMemo(() => 
    Array.from({ length: tripData.monthlyDays }, (_, i) => i + 1),
    [tripData.monthlyDays]
  );

  // Filter itinerary POIs using memoization
  const filteredItineraryPOIs = useMemo(() => {
    return itineraryPOIs.filter(poi => {
      const matchesDay = filterDay === 'all' || poi.day === Number(filterDay);
      const matchesTimeSlot = filterTimeSlot === 'all' || 
        poi.timeSlot?.toLowerCase() === filterTimeSlot.toLowerCase();
      return matchesDay && matchesTimeSlot;
    });
  }, [itineraryPOIs, filterDay, filterTimeSlot]);

  const renderItineraryContent = () => (
    <div className="space-y-4">
      <div className="flex gap-4 bg-white z-50">
        <Select 
          value={filterDay}
          onValueChange={setFilterDay}
        >
          <SelectTrigger className="w-40 bg-white">
            <SelectValue placeholder="Filter by Day" />
          </SelectTrigger>
          <SelectContent className="z-[100] bg-white">
            <SelectItem value="all">All Days</SelectItem>
            {dayOptions.map((day) => (
              <SelectItem key={day} value={day.toString()}>{`Day ${day}`}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={filterTimeSlot}
          onValueChange={setFilterTimeSlot}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by Time" />
          </SelectTrigger>
          <SelectContent className="z-[100] bg-white">
            <SelectItem value="all">All Times</SelectItem>
            <SelectItem value="morning">Morning</SelectItem>
            <SelectItem value="afternoon">Afternoon</SelectItem>
            <SelectItem value="evening">Evening</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItineraryPOIs.map((poi) => (
          <ItineraryPOICard
            key={poi.id}
            poi={poi}
          />
        ))}
      </div>
    </div>
  );

  const renderSavedContent = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium sticky top-0 bg-white z-10 pb-2">
        Saved Attractions
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {savedAttractions.map((poi) => (
          <ItineraryPOICard
            key={poi.id}
            poi={poi}
            dayOptions={dayOptions}
            onAddToItinerary={onAddToItinerary}
            onDeleteSavedPOI={onDeleteSavedPOI}
          />
        ))}
      </div>

      <h3 className="text-lg font-medium sticky top-0 bg-white z-10 pb-2">
        Saved Restaurants
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {savedRestaurants.map((poi) => (
          <ItineraryPOICard
            key={poi.id}
            poi={poi}
            dayOptions={dayOptions}
            onAddToItinerary={onAddToItinerary}
            onDeleteSavedPOI={onDeleteSavedPOI}
          />
        ))}
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'itinerary':
        return renderItineraryContent();
      case 'saved':
        return renderSavedContent();
      case 'search':
        return (
          <div className="space-y-4">
            {/* Implement search functionality here */}
          </div>
        );
    }
  };
  return (
    <Card className="w-1/3 h-[calc(100vh-7rem)] overflow-hidden bg-white rounded-lg flex flex-col">
      <div className="sticky top-0 bg-white px-6 py-4 border-b z-20">
        <h2 className="text-2xl font-semibold">{tripData.city.charAt(0).toUpperCase() + tripData.city.slice(1)}</h2>
        {tripData.fromDT && tripData.toDT && (
          <div className="flex items-center gap-2 text-gray-600 mt-2">
            <Calendar className="w-4 h-4" />
            <span>
              {tripData.fromDT?.toLocaleDateString("en-UK")} - {tripData.toDT?.toLocaleDateString("en-UK")}
            </span>
          </div>
        )}
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as TabType)}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <div className="px-6 pt-6 bg-white sticky top-0 z-10">
          <TabsList 
            className={cn(
              "h-12 w-full bg-gray-100 p-1",
              "grid grid-cols-3 items-center",
              "rounded-lg"
            )}
          >
            <TabsTrigger 
              value="itinerary"
              className={cn(
                "rounded-md text-sm font-medium transition-all",
                "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700",
                "data-[state=active]:shadow-none",
                "h-10",
                "text-gray-600 hover:text-blue-700"
              )}
            >
              Itinerary
            </TabsTrigger>
            <TabsTrigger 
              value="saved"
              className={cn(
                "rounded-md text-sm font-medium transition-all",
                "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700",
                "data-[state=active]:shadow-none",
                "h-10",
                "text-gray-600 hover:text-blue-700"
              )}
            >
              Saved ({unusedPOIs.length})
            </TabsTrigger>
            <TabsTrigger 
              value="search"
              className={cn(
                "rounded-md text-sm font-medium transition-all",
                "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700",
                "data-[state=active]:shadow-none",
                "h-10",
                "text-gray-600 hover:text-blue-700"
              )}
            >
              Search
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <TabsContent 
              value="itinerary" 
              className="mt-0 data-[state=inactive]:hidden"
            >
              {renderTabContent()}
            </TabsContent>
            <TabsContent 
              value="saved" 
              className="mt-0 data-[state=inactive]:hidden"
            >
              {renderTabContent()}
            </TabsContent>
            <TabsContent 
              value="search" 
              className="mt-0 data-[state=inactive]:hidden"
            >
              {renderTabContent()}
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </Card>
  );
};

export default ItineraryPoints;