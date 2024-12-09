import { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import CitySearch from '../CitySearchBar';
import { useLocation } from 'react-router-dom';
import type { SearchCity, TripData } from '@/Types/InterfaceTypes';
import type { DateRange } from "react-day-picker";
import { differenceInDays, addDays } from 'date-fns';
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { X } from "lucide-react"; 
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselApi
} from "@/components/ui/carousel";

interface TripCreationCarouselProps {
  onComplete: (data: TripData) => void;
  initialData?: TripData | null;
}

export default function TripCreationCarousel({ onComplete, initialData }: TripCreationCarouselProps) {
  //Determine if we have a location set , if not then start from step 0
  const location = useLocation();
  const initialStep = location.state?.city ? 1 : 0;

  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [validCity, setValidCity] = useState(!!location.state?.city);
  const [count, setCount] = useState(0);
  const [customInterestInput, setCustomInterestInput] = useState('');
  const [tripData, setTripData] = useState<TripData>(() => {
    if (initialData) {
      return initialData;
    }
    return {
      city: location.state?.city || '',
      dateRange: null,
      monthlyDays: 0,
      interests: new Set<string>(),
      customInterests: new Set<string>()
    };
  });
  const [showInterestDialog, setShowInterestDialog] = useState(false);
  const [newInterest, setNewInterest] = useState('');
  const [dialogInput, setDialogInput] = useState('');
  const predefinedInterests = [
    'Historic Attractions', 'Great Food', 'Hidden Gems', 'Football Culture',
    'Historic Architecture', 'Live Music', 'Craft Beer and Ale', 'Art Galleries',
    'British Cuisine', 'Shopping', 'Adventure and Sports', 'Arts & Theatre'
  ];

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  useEffect(() => {
    if (api && initialStep > 0) {
      api.scrollTo(initialStep);
    }
  }, [api, initialStep]);

  const handleCitySelect = (city: SearchCity) => {
    setTripData({...tripData, city: city.name});
    setValidCity(true);
    // Auto advance to next slide after city selection
    if (api) {
      setTimeout(() => api.scrollNext(), 300);
    }
  };

  const handleDateSelect = (range: DateRange | undefined) => {
    if (!range?.from) return;

    const to = range.to || range.from;
    const daysDiff = differenceInDays(to, range.from);
    
    if (daysDiff > 6) {
      // If more than 7 days selected, limit to 7 days
      const limitedTo = addDays(range.from, 6);
      setTripData({
        ...tripData,
        dateRange: {
          from: range.from,
          to: limitedTo
        },
        monthlyDays: differenceInDays(limitedTo, range.from) + 1,
      });
    } else {
      setTripData({
        ...tripData,
        dateRange: {
          from: range.from,
          to
        },
        monthlyDays: daysDiff + 1,
      });
    }
  };

  const toggleInterest = (interest: string) => {
    const newInterests = new Set(tripData.interests);
    newInterests.has(interest) ? newInterests.delete(interest) : newInterests.add(interest);
    setTripData({...tripData, interests: newInterests});
  };

  const addCustomInterests = () => {
    if (dialogInput) {
      const interests = dialogInput
        .split(',')
        .map(interest => interest.trim())
        .filter(interest => interest.length > 0);
  
      setTripData({
        ...tripData,
        customInterests: new Set(interests)
      });
      setShowInterestDialog(false);
    }
  };

  const clearCustomInterests = (e: React.MouseEvent) => {
    console.log("clearCustomInterests")
    e.stopPropagation(); 
    setTripData({
      ...tripData,
      customInterests: new Set()
    });
    setCustomInterestInput('');
  };

  const openCustomInterestDialog = () => {
    const currentInterests = Array.from(tripData.customInterests).join(', ');
    setDialogInput(currentInterests);
    setShowInterestDialog(true);
  };
  return (
    <Card className="w-full max-w-3xl mx-auto my-64">
      <CardContent className="p-6">
        <div className="mb-6 bg-gray-200 h-2 rounded-full">
          <div 
            className="h-full bg-blue-600 rounded-full transition-all"
            style={{ width: `${((current + 1) / count) * 100}%` }}
          />
        </div>

        <Carousel
          setApi={setApi}
          className="w-full"
          opts={{
            align: "start",
            loop: false,
          }}
        >
          <CarouselContent>
            {/* City Selection */}
            <CarouselItem>
              <div className="flex flex-col items-center space-y-6">
                <div className="text-center space-y-4 max-w-xl">
                  <h2 className="text-4xl font-bold">First, where do you want to go?</h2>
                  <p className="text-xl text-gray-600">Get custom recommendations which can be turned into an itinerary.</p>
                </div>
                <div className="w-full max-w-xl">
                  <CitySearch
                    initialValue={tripData.city}
                    onSubmit={handleCitySelect}
                    className="w-full"
                    showButton={false}
                  />
                </div>
              </div>
            </CarouselItem>

            {/* Date Selection */}
            <CarouselItem>
              <div className="space-y-4">
                <h2 className="text-4xl font-bold text-center">When are you going?</h2>
                <p className="text-xl text-gray-600 text-center">Choose a date range, up to 7 days.</p>
                {tripData.dateRange?.from && (
                  <div className="text-center text-lg text-blue-600">
                    {tripData.dateRange.to ? (
                      <>{format(tripData.dateRange.from, "PPP")} to {format(tripData.dateRange.to, "PPP")}</>
                    ) : (
                      <>Selected: {format(tripData.dateRange.from, "PPP")}</>
                    )}
                  </div>
                )}
                <div className="flex justify-center flex-col items-center">
                  <div className="flex gap-4 px-4">
                    <Calendar
                      mode="range"
                      selected={tripData.dateRange || undefined}
                      onSelect={handleDateSelect}
                      disabled={(date) => 
                        tripData.dateRange?.from ? 
                        date > new Date(tripData.dateRange.from.getTime() + 6 * 24 * 60 * 60 * 1000) : 
                        false
                      }
                      numberOfMonths={2}
                      className="rounded-md border"
                      classNames={{
                        day: "hover:bg-blue-100 rounded-full w-9 h-9 p-0 font-normal aria-selected:opacity-100",
                        day_selected: "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white",
                        day_range_middle: "bg-blue-100 text-white hover:bg-blue-200 hover:text-blue-900",
                        day_range_end: "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white",
                        day_range_start: "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white",
                      }}
                    />
                  </div>
                </div>
                <p className="text-center mt-4">
                  <button 
                    onClick={() => setTripData({...tripData, dateRange: { from: undefined, to: undefined }})}
                    className="text-blue-600 underline"
                  >
                    I don't know my dates yet
                  </button>
                </p>
              </div>
            </CarouselItem>

            {/* Interests Selection */}
            <CarouselItem>
              <div className="space-y-4">
                <h2 className="text-4xl font-bold text-center">Tell us what you're interested in</h2>
                <p className="text-xl text-gray-600 text-center">Select all that apply.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {predefinedInterests.map((interest) => (
                    <Button
                      key={interest}
                      variant={tripData.interests.has(interest) ? "default" : "outline"}
                      onClick={() => toggleInterest(interest)}
                      className={cn(
                        "whitespace-nowrap transition-colors",
                        tripData.interests.has(interest) ? 
                        "bg-blue-600 text-white hover:bg-blue-700" : 
                        "bg-white text-blue-600 hover:bg-blue-50"
                      )}
                    >
                      {interest}
                    </Button>
                  ))}
                  {tripData.customInterests.size > 0 ? (
                  <Button
                    variant="outline"
                    className="flex items-center justify-between gap-2 bg-green-50 hover:bg-green-100"
                    onClick={openCustomInterestDialog}
                  >
                    <span>Custom Interests Added</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-green-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearCustomInterests(e);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={openCustomInterestDialog}
                    className="flex items-center gap-2"
                  >
                    + Add interests
                  </Button>
                )}
                </div>
                {current === count - 1 && (
                  <div className="flex justify-end mt-4">
                    <Button onClick={() => onComplete(tripData)}>
                      Create Trip
                    </Button>
                  </div>
                )}
              </div>
            </CarouselItem>
          </CarouselContent>
          {current > 0 && (
            <CarouselPrevious 
              className="left-2"
              disabled={current === 0}
            />
          )}
          {(current > 0 || validCity) && (
            <CarouselNext 
              className="right-2"
              disabled={current === count - 1}
            />
          )}
        </Carousel>

        <Dialog open={showInterestDialog} onOpenChange={setShowInterestDialog}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Add custom interests</DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                Add multiple interests separated by commas
              </DialogDescription>
            </DialogHeader>
            <Input
              value={dialogInput}
              onChange={(e) => setDialogInput(e.target.value)}
              placeholder="e.g., Local Markets, Street Art, Jazz Clubs"
              className="mb-4"
            />
            <DialogFooter>
              <Button className="hover:text-white hover:bg-blue-600" onClick={addCustomInterests}>
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}