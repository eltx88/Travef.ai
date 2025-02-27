import {useState, FC, useEffect} from "react";
import { Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
 } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import TripCard from './TripCard';
import type { UserTrip } from '@/Types/InterfaceTypes';
import { useAuthStore } from "@/firebase/firebase";
import ApiClient from "@/Api/apiClient";

type FilterOption = 'alphabetical' | 'date' | 'days';

export const Itineraries: FC = () => {
    const [trips, setTrips] = useState<UserTrip[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuthStore();
    const [filterOption, setFilterOption] = useState<FilterOption>('date');
    const [scrollPosition, setScrollPosition] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTrips = async () => {
          if (!user) return;
          
          try {
            setLoading(true);
            const apiClient = new ApiClient({
              getIdToken: async () => user.getIdToken()
            });
            
            const userTrips = await apiClient.getUserTrips();
            setTrips(userTrips);
          } catch (error) {
            console.error('Error fetching trips:', error);
          } finally {
            setLoading(false);
          }
        };
        fetchTrips();
    }, [user]);

    // Function to handle scrolling
    const scroll = (direction: 'left' | 'right') => {
        const container = document.getElementById('trips-container');
        if (container) {
            const scrollAmount = 300; // Width of one card
            const newPosition = direction === 'left' 
                ? scrollPosition - scrollAmount 
                : scrollPosition + scrollAmount;
            
            container.scrollTo({
                left: newPosition,
                behavior: 'smooth'
            });
            setScrollPosition(newPosition);
        }
    };

    const addItinerary = (): void => {
        navigate('/createtrip');
    };

    const sortTrips = (trips: UserTrip[]): UserTrip[] => {
        switch (filterOption) {
          case 'alphabetical':
            return [...trips].sort((a, b) => 
              a.city.localeCompare(b.city));
          case 'date':
            return [...trips].sort((a, b) => 
              (b.fromDT?.getTime() || 0) - (a.fromDT?.getTime() || 0));
          case 'days':
            return [...trips].sort((a, b) => 
              b.monthlyDays - a.monthlyDays);
          default:
            return trips;
        }
      };

    return (
        <div className="w-max-9xl py-12 bg-white rounded-3xl">
            <div className="mb-6 px-8">
                <div className="flex items-center gap-4">
                    <h2 className="text-4xl font-semibold">Trips</h2>       
                    <Button
                        className="text-xl py-4 px-3 rounded-full transition-all duration-300 ease-in-out hover:rounded-full bg-blue-300 hover:bg-blue-300"
                        onClick={addItinerary}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-6 h-6"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 4.5v15m7.5-7.5h-15"
                            />
                        </svg>
                    </Button>

                    <Select value={filterOption} onValueChange={(value: FilterOption) => setFilterOption(value)}>
                        <SelectTrigger className="w-[180px] z-8 bg-blue-200">
                            <SelectValue placeholder="Filter by" />
                        </SelectTrigger>
                        <SelectContent className=" bg-blue-300">
                            <SelectItem className="hover:bg-blue-400" value="alphabetical">Alphabetical</SelectItem>
                            <SelectItem className="hover:bg-blue-400" value="date">Date</SelectItem>
                            <SelectItem className="hover:bg-blue-400" value="days">Days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="relative max-w-8xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <p>Loading trips...</p>
          </div>
        ) : trips.length > 0 ? (
          <>
            <Button 
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 rounded-full w-8 h-8 p-0 bg-white border shadow-lg hover:bg-gray-100"
              variant="ghost">
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div id="trips-container" className="flex gap-4 overflow-hidden px-8 scroll-smooth">
              {sortTrips(trips).map((trip) => (
                <TripCard key={trip.trip_doc_id} trip={trip} />
              ))}
            </div>

            <Button 
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 rounded-full w-8 h-8 p-0 bg-white border shadow-lg hover:bg-gray-100"
              variant="ghost">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-sm">
            <p className="text-lg text-gray-600 mb-4 py-16">No trips yet!</p>
            <Button 
              onClick={addItinerary} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 rounded-lg transition-colors"
            >
              Create Trip
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Itineraries;