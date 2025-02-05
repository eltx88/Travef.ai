import { useLocation, useNavigate } from 'react-router-dom';
import { NavigationMenuBar } from "@/components/NavigationMenuBar";
import type { POI, TripData } from '@/Types/InterfaceTypes';
import { useEffect } from 'react';
import { Card } from '@/components/ui/card';

interface LocationState {
  foodPOIs: POI[];
  attractionPOIs: POI[];
  tripData: TripData;
  generatedItinerary?: string;
  isNewTrip?: boolean;
}

function EditTripPage() {
  const location = useLocation();
  const navigate = useNavigate();

  if (!location.state) {
    useEffect(() => {
      navigate('/home');
    }, [navigate]);
    return null;
  }

  const { foodPOIs, attractionPOIs, generatedItinerary, tripData } = location.state as LocationState;

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <NavigationMenuBar />
      
      <main className="flex-grow p-4">
        <div className="flex h-full gap-4">
          {/* Left Container */}
          <Card className="w-1/3 h-[calc(100vh-7rem)] overflow-y-auto bg-white p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Selected Places</h2>
            {/* Add your left container content here */}
          </Card>

          {/* Right Container */}
          <Card className="w-2/3 h-[calc(100vh-7rem)] overflow-y-auto bg-white p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Trip Itinerary</h2>
            {/* <pre className="whitespace-pre-wrap">{generatedItinerary}</pre> */}
          </Card>
        </div>
      </main>

      <footer className="bg-blue-600 text-white py-1">
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

export default EditTripPage;