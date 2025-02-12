import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Phone, Mail, Clock, Info } from "lucide-react";
import type { ItineraryPOI } from "@/Types/InterfaceTypes";
import { FC, useMemo } from "react";

// TEMPORARY PLACEHOLDER IMAGES
const DEFAULT_ATTRACTION_IMAGE = "https://fastly.picsum.photos/id/57/2448/3264/4336.jpg?hmac=iS-l9m6Vq7wE-m9x6n9_d72mN2_l72j-c99y9v9j9cI";
const DEFAULT_RESTAURANT_IMAGE = "https://fastly.picsum.photos/id/431/5000/3334.jpg?hmac=T2rL_gBDyJYpcr1Xm8Kv7L6bhwvmZS8nKT5w3ok58kA";

interface ItineraryPOICardProps {
  poi: ItineraryPOI;
  onUpdate?: (updatedPOI: ItineraryPOI) => void;
}

// Helper function to convert minutes to HH:MM
function minutesToHHMM(minutes: number): string {
  if (minutes === -1) return "-1"; // Handle -1 case
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

const getDefaultImage = (type: string) => {
  return type === 'restaurant' ? DEFAULT_RESTAURANT_IMAGE : DEFAULT_ATTRACTION_IMAGE;
};

const ItineraryPOICard: FC<ItineraryPOICardProps> = ({ poi }) => {
  const openWebsite = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    window.open(url, "_blank");
  }

  const displayStartTime = useMemo(() => minutesToHHMM(poi.StartTime), [poi.StartTime]);
  const displayEndTime = useMemo(() => minutesToHHMM(poi.EndTime), [poi.EndTime]);

  return (
    <Card className="h-full bg-white shadow-md hover:shadow-lg transition-shadow cursor-pointer">
      <CardContent className="p-4 flex flex-col h-full">
        {/* Image Section */}
        <div className="relative rounded-md overflow-hidden aspect-[4/3] mb-4">
          <img
            src={poi.image_url || getDefaultImage(poi.type)}
            alt={poi.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              // img.src = getDefaultImage(poi.type);
            }}
          />
        </div>

        {/* Content Section */}
        <div className="flex flex-col flex-grow">
          {/* Day and Time Slot Tags */}
          <div className="flex gap-2 mb-2">
            {poi.day !== -1 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                Day {poi.day}
              </span>
            )}
            {poi.timeSlot && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                {poi.timeSlot}
              </span>
            )}
          </div>

          {/* Time Slot Information */}
          {poi.StartTime !== -1 && poi.EndTime !== -1 && (
            <div className="text-sm text-gray-600 mb-2">
              {displayStartTime} - {displayEndTime}
            </div>
          )}

          {/* POI Name */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0 flex-grow">
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
          </div>

          {/* More Details Dialog */}
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
                  {poi.address && <h4>{poi.address}</h4>}

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

export default ItineraryPOICard;