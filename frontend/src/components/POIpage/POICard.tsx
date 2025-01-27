import POISaveButton from "./POISaveButton";
import { POI } from "@/Types/InterfaceTypes";
import { useLocation } from '@/contexts/LocationContext';
import { MapPin } from 'lucide-react';

interface POICardProps extends POI {
  onSave: (id: string, saved: boolean) => Promise<void>;
  onUnsave: (id: string, saved: boolean) => Promise<void>;
  isSelected?: boolean;
  isSaved: boolean;
  onCardClick?: (poi: POI) => void;
}

const POICard = ({ 
  id, 
  name, 
  address, 
  city,
  type,
  coordinates,
  onSave,
  onUnsave,
  onCardClick,
  isSelected = false,
  isSaved,
}: POICardProps) => {
  const { updateCoordinates } = useLocation();
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
        coordinates,
        type,
      });         
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      className={`
        p-4 border rounded-lg transition-all duration-200 cursor-pointer
        ${isSelected 
          ? 'ring-2 ring-blue-500 bg-blue-50' 
          : 'hover:bg-gray-50 hover:shadow-md'
        }
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-grow">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold">{name}</h3>
          </div>
          <div className="flex items-center gap-1 text-gray-600 text-sm mt-1">
            <MapPin className="h-4 w-4" />
            <p>{address}</p>
          </div>
          {type && (
            <p className="text-gray-500 text-sm mt-1 capitalize">
              {type}
            </p>
          )}
        </div>
        <POISaveButton
          isSaved={isSaved}
          onSave={() => onSave(id, !isSaved)}
          onUnsave={() => onUnsave(id, !isSaved)}
          name={name}
        />
      </div>
    </div>
  );
};

export default POICard;