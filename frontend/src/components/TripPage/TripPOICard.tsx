import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Check, Info, MapPin, Coffee, Utensils, Star, ExternalLink } from "lucide-react";
import { useLocation } from '@/contexts/LocationContext';
import type { POI } from '@/Types/InterfaceTypes';

interface TripPOICardProps {
  poi: POI;
  isSelected?: boolean;
  onSelect?: (poi: POI) => void;
  showAddButton?: boolean;
}

// TEMPORARY PLACEHOLDER IMAGES
const DEFAULT_ATTRACTION_IMAGE = "https://images.unsplash.com/photo-1607434472257-d9f8e57a643d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bG9hZGluZ3xlbnwwfHwwfHx8MA%3D%3D";
const DEFAULT_RESTAURANT_IMAGE = "https://images.unsplash.com/photo-1607434472257-d9f8e57a643d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bG9hZGluZ3xlbnwwfHwwfHx8MA%3D%3D";

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

// Helper for proxying image URLs
const getProxiedImageUrl = (url: string | undefined, type: string) => {
  if (!url) return getDefaultImage(type || 'attraction');
  
  // If URL is already a proxied URL or blob URL, return it
  if (url.startsWith('https://images.weserv.nl') || url.startsWith('blob:')) {
    return url;
  }

  // Fix the URL protocol if missing
  const fixedUrl = url.startsWith('http') ? url : `https:${url}`;
  
  // Use images.weserv.nl as a proxy with caching
  return `https://images.weserv.nl/?url=${encodeURIComponent(fixedUrl)}&default=${encodeURIComponent(getDefaultImage(type || 'attraction'))}&n=-1`;
};

const TripPOICard = ({ 
  poi, 
  isSelected = false, 
  onSelect, 
  showAddButton = true 
}: TripPOICardProps) => {
  const { updateCoordinates } = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [shouldLoadImage, setShouldLoadImage] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  // Set up IntersectionObserver to detect when card is in viewport
  useEffect(() => {
    if (!imageRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShouldLoadImage(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    observer.observe(imageRef.current);
    
    return () => {
      observer.disconnect();
    };
  }, []);

  const handleCardClick = () => {
    if (poi.coordinates?.lat && poi.coordinates?.lng) {
      updateCoordinates({
        lat: poi.coordinates.lat,
        lng: poi.coordinates.lng,
        zoom: 16
      });
    }
  };

  // Function to generate Google Maps URL
  const getGoogleMapsUrl = (id: string) => {
    return `https://www.google.com/maps/place/?q=place_id:${id}`;
  };

  // Handle image loading errors
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = getDefaultImage(poi.type || 'attraction');
  };

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
          {rating.toFixed(1)} ({user_ratings_total || 0})
        </span>
      </div>
    );
  }

  return (
    <>
      <Card 
        className={`
          h-full bg-white shadow-md hover:shadow-lg transition-shadow flex flex-col overflow-hidden
          ${isSelected ? 'ring-2 ring-blue-500' : ''}
        `}
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-0 flex flex-col h-full">
          {/* Image Section with Type Indicator */}
          <div className="relative overflow-hidden aspect-[4/3]">
            <img
              ref={imageRef}
              src={shouldLoadImage 
                ? getProxiedImageUrl(poi.image_url, poi.type || 'attraction')
                : getDefaultImage(poi.type || 'attraction')
              }
              alt={poi.name}
              className="w-full h-full object-cover transition-transform duration-300"
              style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
              onError={handleImageError}
              onLoad={() => setImageLoaded(true)}
            />
            <div className="absolute top-2 left-2 flex items-center bg-white bg-opacity-90 rounded-full px-2 py-0.5 text-xs">
              {getTypeIcon(poi.type || 'attraction')}
              <span className="capitalize">{poi.type || 'attraction'}</span>
            </div>
            
            {/* Add the select button on the image for minimized view */}
            {showAddButton && onSelect && (
              <Button
                variant="ghost"
                size="sm"
                className={`absolute bottom-2 right-2 rounded-full h-8 w-8 p-0
                  ${isSelected 
                    ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                    : 'bg-white bg-opacity-90 hover:bg-opacity-100'
                  }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(poi);
                }}
                title={isSelected ? "Remove from itinerary" : "Add to itinerary"}
              >
                {isSelected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </Button>
            )}
          </div>
          
          {/* Content Section */}
          <div className="flex flex-col flex-grow p-3">
            {/* POI Name - now with website icon instead of clickable name */}
            <div className="flex items-center gap-1 mb-1">
              <h4 className="font-semibold text-sm truncate flex-1">{poi.name}</h4>
              {poi.website && (
                <a 
                  href={poi.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                  title="Visit website"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
            
            {renderRatingStars(poi.rating, poi.user_ratings_total)}

            {/* Address */}
            <div className="flex items-center gap-1 text-gray-600 text-xs mt-1">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <p className="truncate">{poi.address}</p>
            </div>
            
            {/* Action Buttons */}
            <div className="mt-auto pt-2 flex justify-between items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-blue-600 hover:text-blue-800 p-1 h-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(true);
                }}
              >
                <Info className="h-3.5 w-3.5 mr-1" />
              </Button>
              
              <div className="flex items-center gap-2 ml-auto">
                {/* Google Maps Link */}
                {poi.place_id && (
                  <a 
                    href={getGoogleMapsUrl(poi.place_id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-blue-600"
                    onClick={(e) => e.stopPropagation()}
                    title="View on Google Maps"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center">
              {poi.name}
              {/* Google Maps Icon in Dialog */}
              {poi.place_id && (
                <a 
                  href={getGoogleMapsUrl(poi.place_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1.5 text-gray-500 hover:text-blue-600"
                  title="View on Google Maps"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                </a>
              )}
            </DialogTitle>
            <DialogDescription className="flex items-center text-sm text-gray-600">
              {getTypeIcon(poi.type || 'attraction')}
              <span className="capitalize ml-1">{poi.type || 'attraction'}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Image */}
            <div className="overflow-hidden rounded-md">
              <img
                src={getProxiedImageUrl(poi.image_url, poi.type || 'attraction')}
                alt={poi.name}
                className="w-full aspect-[4/3] object-cover"
                onError={handleImageError}
              />
            </div>
            
            {/* Address */}
            <div className="space-y-1">
              <h4 className="font-medium text-sm">Address</h4>
              <p className="text-sm text-gray-600">{poi.address}</p>
              {poi.city && poi.country && (
                <p className="text-sm text-gray-600">{poi.city}, {poi.country}</p>
              )}
            </div>
            
            {/* Description */}
            {poi.description && (
              <div className="space-y-1">
                <h4 className="font-medium text-sm">Description</h4>
                <p className="text-sm text-gray-600">{poi.description}</p>
              </div>
            )}
            
            {/* Opening Hours */}
            {poi.opening_hours && (
              <div className="space-y-1">
                <h4 className="font-medium text-sm">Opening Hours</h4>
                <p className="text-sm text-gray-600 whitespace-pre-line">{poi.opening_hours}</p>
              </div>
            )}
            
            {/* Contact Info */}
            {(poi.website || poi.phone) && (
              <div className="space-y-1">
                <h4 className="font-medium text-sm">Contact</h4>
                {poi.website && (
                  <a 
                    href={poi.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block text-sm text-blue-600 hover:underline"
                  >
                    Website
                  </a>
                )}
                {poi.phone && (
                  <p className="text-sm text-gray-600">{poi.phone}</p>
                )}
              </div>
            )}
            
            {/* Cuisine tags for restaurants */}
            {poi.cuisine && poi.cuisine.length > 0 && (
              <div className="space-y-1">
                <h4 className="font-medium text-sm">Cuisine</h4>
                <div className="flex flex-wrap gap-2">
                  {poi.cuisine.map((cuisine, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {cuisine}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TripPOICard;