import POISaveButton from "./POISaveButton";
import { POI } from "@/Types/InterfaceTypes";
import { useLocation } from '@/contexts/LocationContext';
import { MapPin, Coffee, Utensils, Info, Star } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface POICardProps extends POI {
  onSave: (id: string, saved: boolean) => Promise<void>;
  onUnsave: (id: string, saved: boolean) => Promise<void>;
  isSelected?: boolean;
  isSaved: boolean;
  onCardClick?: (poi: POI) => void;
}

// TEMPORARY PLACEHOLDER IMAGES
const DEFAULT_ATTRACTION_IMAGE = "https://fastly.picsum.photos/id/57/2448/3264/4336.jpg?hmac=iS-l9m6Vq7wE-m9x6n9_d72mN2_l72j-c99y9v9j9cI";
const DEFAULT_RESTAURANT_IMAGE = "https://fastly.picsum.photos/id/431/5000/3334.jpg?hmac=T2rL_gBDyJYpcr1Xm8Kv7L6bhwvmZS8nKT5w3ok58kA";

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

const POICard = ({ 
  id, 
  name, 
  address, 
  city,
  country,
  type,
  coordinates,
  image_url,
  description,
  opening_hours,
  website,
  phone,
  rating,
  user_ratings_total,
  onSave,
  onUnsave,
  onCardClick,
  isSelected = false,
  isSaved,
}: POICardProps) => {
  const { updateCoordinates } = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  const handleCardClick = () => {
    if (coordinates?.lat && coordinates?.lng) {
      updateCoordinates({
        lng: coordinates.lng,
        lat: coordinates.lat,
        zoom: 15
      });
      onCardClick?.({
        id,
        place_id: id,
        name,
        address,
        city,
        country,
        coordinates,
        type,
      });         
    }
  };

  // Function to generate Google Maps URL
  const getGoogleMapsUrl = () => {
    return `https://www.google.com/maps/place/?q=place_id:${id}`;
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
          {rating.toFixed(1)} ({user_ratings_total})
        </span>
      </div>
    );
  }

  // Add this function to your component
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = getDefaultImage(type || 'attraction');
  };

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
              src={image_url ? image_url.startsWith('http') ? image_url : `https:${image_url}` : getDefaultImage(type || 'attraction')}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-300"
              style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
              onError={(e) => handleImageError(e)}
            />
            <div className="absolute top-2 left-2 flex items-center bg-white bg-opacity-90 rounded-full px-2 py-0.5 text-xs">
              {getTypeIcon(type || 'attraction')}
              <span className="capitalize">{type || 'attraction'}</span>
            </div>
          </div>
          
          {/* Content Section */}
          <div className="flex flex-col flex-grow p-3">
            {/* POI Name with Google Maps Icon */}
            <div className="min-w-0 mb-1 flex items-center">
              {website ? (
                <a 
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-sm truncate hover:text-blue-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {name}
                </a>
              ) : (
                <h4 className="font-semibold text-sm truncate">{name}</h4>
              )}
              
              {/* Google Maps Icon */}
              <a 
                href={getGoogleMapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1.5 text-gray-500 hover:text-blue-600"
                onClick={(e) => e.stopPropagation()}
                title="View on Google Maps"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </a>
            </div>
            {renderRatingStars(rating, user_ratings_total)}

            {/* Address */}
            <div className="flex items-center gap-1 text-gray-600 text-xs mt-1">
              <MapPin className="h-3 w-3" />
              <p className="truncate">{address}</p>
            </div>
            
            {/* Action Buttons */}
            <div className="mt-auto pt-2 flex justify-between items-center">
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
                More details
              </Button>
              
              <POISaveButton
                isSaved={isSaved}
                onSave={() => onSave(id, !isSaved)}
                onUnsave={() => onUnsave(id, !isSaved)}
                name={name}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center">
              {name}
              {/* Google Maps Icon in Dialog */}
              <a 
                href={getGoogleMapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-gray-500 hover:text-blue-600"
                onClick={(e) => e.stopPropagation()}
                title="View on Google Maps"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </a>
            </DialogTitle>
            <DialogDescription className="flex items-center text-sm text-gray-600">
              {getTypeIcon(type || 'attraction')}
              <span className="capitalize ml-1">{type || 'attraction'}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Image */}
            <div className="overflow-hidden rounded-md">
              <img
                src={image_url ? image_url.startsWith('http') ? image_url : `https:${image_url}` : getDefaultImage(type || 'attraction')}
                alt={name}
                className="w-full h-48 object-cover"
                onError={(e) => handleImageError(e)}
              />
            </div>
            
            {/* Address */}
            <div className="space-y-1">
              <h4 className="font-medium text-sm">Address</h4>
              <p className="text-sm text-gray-600">{address}</p>
              {city && country && (
                <p className="text-sm text-gray-600">{city}, {country}</p>
              )}
            </div>
            
            {/* Description */}
            {description && (
              <div className="space-y-1">
                <h4 className="font-medium text-sm">Description</h4>
                <p className="text-sm text-gray-600">{description}</p>
              </div>
            )}
            
            {/* Opening Hours */}
            {opening_hours && (
              <div className="space-y-1">
                <h4 className="font-medium text-sm">Opening Hours</h4>
                <p className="text-sm text-gray-600 whitespace-pre-line">{opening_hours}</p>
              </div>
            )}
            
            {/* Contact Info */}
            {(website || phone) && (
              <div className="space-y-1">
                <h4 className="font-medium text-sm">Contact</h4>
                {website && (
                  <a 
                    href={website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block text-sm text-blue-600 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Website
                  </a>
                )}
                {phone && (
                  <p className="text-sm text-gray-600">{phone}</p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default POICard;