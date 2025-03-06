import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Phone, Mail, Clock, Info, Star, MapPin, Tag, Coffee, Utensils } from "lucide-react";
import type { ItineraryPOI } from "@/Types/InterfaceTypes";
import { FC, useMemo, useState, useEffect, useRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@radix-ui/react-hover-card';
import { DialogDescription } from "@radix-ui/react-dialog";
import OpeningHoursFormatter from "./OpeningHoursFormatter";

// TEMPORARY PLACEHOLDER IMAGES
const DEFAULT_ATTRACTION_IMAGE = "https://fastly.picsum.photos/id/57/2448/3264/4336.jpg?hmac=iS-l9m6Vq7wE-m9x6n9_d72mN2_l72j-c99y9v9j9cI";
const DEFAULT_RESTAURANT_IMAGE = "https://fastly.picsum.photos/id/431/5000/3334.jpg?hmac=T2rL_gBDyJYpcr1Xm8Kv7L6bhwvmZS8nKT5w3ok58kA";

interface ItineraryPOICardProps {
  poi: ItineraryPOI;
  dayOptions?: number[];
  onAddToItinerary?: (poi: ItineraryPOI, day: number) => void;
  onDeleteSavedPOI?: (poi: ItineraryPOI) => void;
}

// Helper function to convert minutes to HH:MM
function minutesToHHMM(minutes: number): string {
  if (minutes === -1) return "-1";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function renderRatingStars(rating: number | undefined | null, user_ratings_total: number | undefined | null) {
  if (!rating) return null;
  
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  
  return (
    <div className="flex items-center mt-1">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className="w-3 h-3 text-yellow-500 fill-yellow-500" />
      ))}
      {halfStar && (
        <span className="relative">
          <Star className="w-3 h-3 text-yellow-500" />
          <Star className="absolute top-0 left-0 w-3 h-3 text-yellow-500 fill-yellow-500 overflow-hidden" style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }} />
        </span>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className="w-3 h-3 text-yellow-500" />
      ))}
      <span className="ml-1 text-xs text-gray-600">
        {rating.toFixed(1)} ({user_ratings_total})
      </span>
    </div>
  );
}

// Add this helper function to format the POI types
const formatPoiType = (type: string): string => {
  if (!type) return '';
  // Split by underscore, capitalize each word, and join with space
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const getDefaultImage = (type: string) => {
  switch (type) {
    case 'restaurant':
      return DEFAULT_RESTAURANT_IMAGE;
    case 'cafe':
      return DEFAULT_RESTAURANT_IMAGE;
    default:
      return DEFAULT_ATTRACTION_IMAGE;
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'restaurant':
      return <Utensils className="h-3.5 w-3.5 mr-1 text-blue-600" />;
    case 'cafe':
      return <Coffee className="h-3.5 w-3.5 mr-1 text-green-600" />;
    default:
      return <MapPin className="h-3.5 w-3.5 mr-1 text-red-600" />;
  }
};

const ItineraryPOICard: FC<ItineraryPOICardProps> = ({ poi, dayOptions, onAddToItinerary, onDeleteSavedPOI }) => {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [shouldLoadImage, setShouldLoadImage] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  const openWebsite = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    window.open(url, "_blank");
  };

  const displayStartTime = useMemo(() => minutesToHHMM(poi.StartTime), [poi.StartTime]);
  const displayEndTime = useMemo(() => minutesToHHMM(poi.EndTime), [poi.EndTime]);

  const handleAddToItinerary = () => {
    if (selectedDay !== null && onAddToItinerary) {
      onAddToItinerary(poi, selectedDay);
    }
  };
  
  const handleDeleteSavedPOI = () => {
    if (onDeleteSavedPOI) {
      onDeleteSavedPOI(poi);
    }
    setIsDeleteDialogOpen(false);
  };

  // More aggressive loading strategy with larger root margin
  useEffect(() => {
    if (!imageRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShouldLoadImage(true);
          observer.disconnect();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '200px' // Load images when they're within 200px of viewport
      }
    );
    
    observer.observe(imageRef.current);
    
    return () => {
      observer.disconnect();
    };
  }, []);
  
  // Handle image loading errors
  const handleImageError = () => {
    setImageLoaded(true); // Important: still mark as loaded to remove spinner
  };

  // Decide what image to show
  const imageSource = useMemo(() => {
    if (!shouldLoadImage) return null;
    
    // Try original image first
    if (poi.image_url) return poi.image_url;
    
    // Fall back to default image
    return getDefaultImage(poi.type || 'attraction');
  }, [shouldLoadImage, poi.image_url, poi.type]);

  return (
    <TooltipProvider delayDuration={300}>
      <Card 
        className="h-full bg-white shadow-md hover:shadow-lg transition-shadow flex flex-col overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-0 flex flex-col h-full">
          {/* Image Section with Type Indicator */}
          <div className="relative overflow-hidden aspect-[4/3] bg-gray-100">
            {/* Loading spinner */}
            {shouldLoadImage && !imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            
            {/* Image element - always present for the observer */}
            <img
              ref={imageRef}
              src={imageSource || getDefaultImage(poi.type)}
              alt={poi.name}
              className={`w-full h-full object-cover transition-all duration-300 ${
                !imageLoaded ? 'opacity-0' : 'opacity-100'
              } ${isHovered ? 'scale-105' : 'scale-100'}`}
              onError={handleImageError}
              onLoad={() => setImageLoaded(true)}
            />
            
            <div className="absolute top-2 left-2 flex items-center bg-white bg-opacity-90 rounded-full px-2 py-0.5 text-xs">
              {getTypeIcon(poi.type)}
              <span>{formatPoiType(poi.type)}</span>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex flex-col flex-grow p-3">
            {/* Day and Time Slot Tags */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {poi.day !== -1 && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full whitespace-nowrap">
                  Day {poi.day}
                </span>
              )}
              {poi.timeSlot && (
                <span className={`px-2 py-0.5 text-xs rounded-full whitespace-nowrap
                  ${poi.timeSlot === 'Morning' ? 'bg-green-100 text-green-800' : 
                    poi.timeSlot === 'Afternoon' ? 'bg-amber-100 text-amber-800' : 
                    'bg-indigo-100 text-indigo-800'}`}
                >
                  {poi.timeSlot}
                </span>
              )}
              
              {/* Google Maps Icon */}
              {poi.place_id && (
                <a 
                  href={`https://www.google.com/maps/place/?q=place_id:${poi.place_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 text-gray-500 hover:text-blue-600"
                  onClick={(e) => e.stopPropagation()}
                  title="View on Google Maps"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                </a>
              )}
            </div>

            {/* Time Slot Information */}
            {poi.StartTime !== -1 && poi.EndTime !== -1 && (
              <div className="text-xs text-gray-600 mb-1.5 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {displayStartTime} - {displayEndTime}
              </div>
            )}

            {/* POI Name with Tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="min-w-0 mb-1">
                  {poi.website ? (
                    <a
                      href={poi.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => openWebsite(e, poi.website!)}
                      className="font-semibold text-sm text-blue-600 hover:text-blue-800 truncate block"
                    >
                      {poi.name}
                    </a>
                  ) : (
                    <h4 className="font-semibold text-sm truncate">{poi.name}</h4>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs bg-black text-white p-2 rounded text-xs">
                {poi.name}
              </TooltipContent>
            </Tooltip>
            
            {/* Rating Stars */}
            {renderRatingStars(poi.rating, poi.user_ratings_total)}
            
            {/* Cuisine Tags if available */}
            {poi.cuisine && poi.cuisine.length > 0 && (
              <div className="flex items-start gap-1 flex-wrap mt-1 mb-2">
                <Tag className="h-3 w-3 text-gray-500 mt-0.5" />
                <div className="flex flex-wrap gap-1 flex-1">
                  {poi.cuisine.slice(0, 2).map((cuisine, index) => (
                    <span
                      key={index}
                      className="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
                    >
                      {cuisine}
                    </span>
                  ))}
                  {poi.cuisine.length > 2 && (
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                      +{poi.cuisine.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* Phone number if available */}
            {poi.phone && (
              <div className="flex items-center text-xs text-gray-600 mt-1">
                <Phone className="h-3 w-3 mr-1" />
                <span className="truncate">{poi.phone}</span>
              </div>
            )}
          
            {/* More Details Dialog */}
            <div className="mt-auto pt-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full hover:bg-blue-200 text-xs h-8 truncate flex items-center justify-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Info className="h-3 w-3 mr-1.5 flex-shrink-0" />
                    <span className="truncate">More Details</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md bg-white p-4 rounded-md">
                  <DialogHeader>
                    <DialogTitle>{poi.name}</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4 mt-4">
                    {poi.image_url && (
                      <div className="relative overflow-hidden aspect-[4/3]">
                        <img
                          src={poi.image_url}
                          alt={poi.name}
                          className="w-full h-full object-cover transition-transform duration-300"
                        />
                      </div>
                    )}

                    {renderRatingStars(poi.rating, poi.user_ratings_total)}
                    
                    {poi.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                        <p className="text-sm">{poi.address}</p>
                      </div>
                    )}

                    {(poi.StartTime !== -1 && poi.EndTime !== -1) && (
                      <div className="flex items-start gap-2">
                        <Clock className="h-5 w-5 text-gray-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium mb-1">Schedule</h4>
                          <p className="text-sm text-gray-600">
                            {displayStartTime} - {displayEndTime}
                          </p>
                        </div>
                      </div>
                    )}

                    {poi.website && (
                      <div>
                        <h4 className="font-medium mb-1">Website</h4>
                        <a
                          href={poi.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline break-all"
                        >
                          {poi.website}
                        </a>
                      </div>
                    )}

                    {poi.description && (
                      <div>
                        <h4 className="font-medium mb-1">About</h4>
                        <p className="text-sm text-gray-600">{poi.description}</p>
                      </div>
                    )}

                    {poi.opening_hours && (
                      <OpeningHoursFormatter openingHours={poi.opening_hours} />
                    )}
                    {poi.cuisine && poi.cuisine.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-1">Cuisine</h4>
                        <div className="flex flex-wrap gap-2">
                          {poi.cuisine.map((cuisine, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                            >
                              {cuisine}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {(poi.phone || poi.email) && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Contact</h4>
                        {poi.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <a
                              href={`tel:${poi.phone}`}
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              {poi.phone}
                            </a>
                          </div>
                        )}
                        {poi.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <a
                              href={`mailto:${poi.email}`}
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              {poi.email}
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

             {/* Add to Itinerary Button (only shown in Saved tab) */}
             {poi.day === -1 && dayOptions && onAddToItinerary && (
              <div className="mt-2 space-y-2">
                <HoverCard openDelay={0} closeDelay={200}>
                  <HoverCardTrigger asChild>
                    <Button className="w-full h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs">
                      Add to Itinerary
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent 
                    className="w-64 p-4 bg-white border border-gray-200 shadow-lg rounded-md z-[100]" 
                    sideOffset={5}
                  >
                    <div className="space-y-3">
                      <Select 
                        value={selectedDay?.toString() || ''} 
                        onValueChange={(value) => setSelectedDay(Number(value))}
                      >
                        <SelectTrigger className="w-full bg-white border border-gray-200 cursor-pointer [&>*]:cursor-pointer">
                          <SelectValue placeholder="Select a day" className="cursor-pointer [&>*]:cursor-pointer" />
                        </SelectTrigger>
                        <SelectContent 
                          position="popper" 
                          className="z-[101] bg-white border border-gray-200 cursor-pointer [&>*]:cursor-pointer"
                        >
                          {dayOptions.map((day) => (
                            <SelectItem 
                              key={day} 
                              value={day.toString()} 
                              className="cursor-pointer hover:bg-blue-50 [&>*]:cursor-pointer"
                            >
                              Day {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                        <Button 
                          onClick={handleAddToItinerary}
                          disabled={!selectedDay}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-300"
                        >
                          Submit
                        </Button>
                      </div>
                    </HoverCardContent>
                </HoverCard>
                
                {/* Only show delete button if onDeleteSavedPOI is provided */}
                {onDeleteSavedPOI && (
                  <Button 
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="w-full h-7 bg-red-600 hover:bg-red-700 text-white"
                  >
                    Delete
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-white p-6 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Confirm Deletion</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            <div className="py-4">
                Are you sure you want to delete <span className="font-semibold">{poi.name}</span>?
            </div>
            <div className="flex justify-end gap-3 mt-2">
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(false)}
                className="bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleDeleteSavedPOI}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            </div>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default ItineraryPOICard;