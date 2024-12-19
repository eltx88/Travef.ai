import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Check, Phone, Mail, Clock, Info } from "lucide-react";
import { useLocation } from '@/contexts/LocationContext';
import type { POI } from '@/Types/InterfaceTypes';

interface TripPOICardProps {
  poi: POI;
  isSelected?: boolean;
  onSelect?: (poi: POI) => void;
  showAddButton?: boolean;
}

const TripPOICard = ({ 
  poi, 
  isSelected = false, 
  onSelect, 
  showAddButton = true 
}: TripPOICardProps) => {
  const { updateCoordinates } = useLocation();

  const handleCardClick = () => {
    updateCoordinates({
      lat: poi.coordinates.lat,
      lng: poi.coordinates.lng,
      zoom: 16
    });
  };

  const openWebsite = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    window.open(url, '_blank');
  };

  return (
    <Card 
      className="h-full bg-white shadow-md hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      <CardContent className="p-4 flex flex-col h-full">
        <div className="bg-gray-200 rounded-md aspect-[4/3] mb-4">
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            Image Coming Soon
          </div>
        </div>
        
        <div className="flex flex-col flex-grow">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0 flex-grow">
              {poi.website ? (
                <a 
                  href={poi.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => openWebsite(e, poi.website!)}
                  className="font-semibold text-lg text-blue-600 hover:text-blue-800 truncate block"
                >
                  {poi.name}
                </a>
              ) : (
                <h4 className="font-semibold text-lg truncate">{poi.name}</h4>
              )}
            </div>
            {showAddButton && onSelect && (
              <Button
                variant="ghost"
                size="sm"
                className={`rounded-full h-8 w-8 flex-shrink-0 ${
                  isSelected ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'hover:bg-gray-100'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(poi);
                }}
              >
                {isSelected ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </Button>
            )}
          </div>

          <p className="text-gray-600 text-sm truncate mb-4">{poi.address}</p>

          {/* Dialog remains the same */}
          <div className="mt-auto">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Info className="h-4 w-4 mr-2" />
                  More Details
                </Button>
                </DialogTrigger>
            <DialogContent className="max-w-md bg-white p-4 rounded-md">
              <DialogHeader>
                <DialogTitle>{poi.name}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
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
                  <div className="flex items-start gap-2">
                    <Clock className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium mb-1">Opening Hours</h4>
                      <p className="text-sm text-gray-600">{poi.opening_hours}</p>
                    </div>
                  </div>
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
        </div>
      </CardContent>
    </Card>
  );
};

export default TripPOICard;