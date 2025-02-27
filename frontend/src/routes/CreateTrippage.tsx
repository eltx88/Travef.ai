//Navigated from the POI Container Create Trip Button(location provided) or the Trip.tsx + button in the homepage (location not provided)
import { NavigationMenuBar } from "@/components/NavigationMenuBar";
import { useState } from 'react';
import TripCreationCarousel from '@/components/TripPage/TripCreationCarousel';
import { TripDetails } from '@/components/TripPage/TripDetails';
import type { TripData } from '@/Types/InterfaceTypes';
import { LocationProvider } from '@/contexts/LocationContext';
import Footer from '../components/Footer';

function CreateTripPage() {
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const handleTripCreationComplete = (data: TripData) => {
    setTripData(data);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  return (
    <LocationProvider>
    <div className="flex flex-col min-h-screen bg-gray-100">
      <NavigationMenuBar />
      
      <main className="flex-grow p-4">
        {!tripData || isEditing ? (
          <TripCreationCarousel 
            onComplete={handleTripCreationComplete} 
            initialData={tripData}
          />
        ) : (
          <TripDetails 
            tripData={tripData}
            onEdit={handleEdit}
          />
        )}
      </main>
      
      <Footer />
    </div>
    </LocationProvider>
  );
}

export default CreateTripPage;
