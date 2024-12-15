//Navigated from the POI Container Create Trip Button(location provided) or the Trip.tsx + button in the homepage (location not provided)
import { NavigationMenuBar } from "@/components/NavigationMenuBar";
import { useState } from 'react';
import TripCreationCarousel from '@/components/TripPage/TripCreationCarousel';
import { TripDetails } from '@/components/TripPage/TripDetails';
import type { TripData } from '@/Types/InterfaceTypes';

function CreateTripPage() {
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const handleTripCreationComplete = (data: TripData) => {
    setTripData(data);
    setIsEditing(false);
    // Here you can also make API calls to save the trip
  };

  const handleEdit = () => {
    setIsEditing(true);; // This will return to the carousel with existing data
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <NavigationMenuBar />
      
      <main className="flex-grow p-4">
        {!tripData || isEditing ? (
          <TripCreationCarousel 
            onComplete={handleTripCreationComplete} 
            initialData={tripData} // Pass existing data
          />
        ) : (
          <TripDetails 
            tripData={tripData}
            onEdit={handleEdit}
          />
        )}
      </main>
      
      <footer className="bg-blue-600 text-white py-1 mt-80">
        <div className="container mx-auto px-4">
          <p className="text-sm text-center">© 2024 Travefai. All rights reserved.</p>
          <div className="flex justify-center space-x-4 mt-2">
            <a href="/privacy-policy" className="text-sm hover:underline">Privacy Policy</a>
            <a href="/terms-of-service" className="text-sm hover:underline">Terms of Service</a>
            <a href="/contact" className="text-sm hover:underline">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default CreateTripPage;
