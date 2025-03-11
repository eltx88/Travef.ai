import {useState, FC, useEffect, useRef} from "react";
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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

type FilterOption = 'alphabetical' | 'date-latest' | 'date-earliest' | 'days-desc' | 'days-asc';

interface ItinerariesProps {
  setGlobalLoading: (loading: boolean, message?: string) => void;
}

export const Itineraries: FC<ItinerariesProps> = ({ setGlobalLoading }) => {
    const [trips, setTrips] = useState<UserTrip[]>([]);
    const [loading, setLoading] = useState(true);
    const [shouldRefresh, setShouldRefresh] = useState<boolean>(false);
    const { user } = useAuthStore();
    const [filterOption, setFilterOption] = useState<FilterOption>('date-latest');
    const [cityFilter, setCityFilter] = useState<string>('');
    const [hidePassedTrips, setHidePassedTrips] = useState<boolean>(true);
    const [scrollPosition, setScrollPosition] = useState(0);
    const navigate = useNavigate();
    const triggerRefresh = (refresh: boolean) => {
        setShouldRefresh(refresh);
    };

    // Use a ref to prevent duplicate API calls
    const fetchInProgress = useRef(false);

    useEffect(() => {
        const fetchTrips = async () => {
          if (!user || fetchInProgress.current) return;
          
          try {
            fetchInProgress.current = true;
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
            if (shouldRefresh) {
                setShouldRefresh(false);
            }
            fetchInProgress.current = false;
          }
        };
        
        fetchTrips();
    }, [user, shouldRefresh]);

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
        // Get current date for filtering past trips
        const currentDate = new Date();
        
        // Apply all filters
        let filteredTrips = trips;
        
        // Filter by city name if filter text exists
        if (cityFilter) {
            filteredTrips = filteredTrips.filter(trip => 
                trip.city.toLowerCase().includes(cityFilter.toLowerCase()));
        }
        
        // Filter out passed trips if checkbox is checked
        if (hidePassedTrips) {
            filteredTrips = filteredTrips.filter(trip => 
                trip.toDT >= currentDate);
        }
            
        // Then apply the sorting
        switch (filterOption) {
          case 'alphabetical':
            return [...filteredTrips].sort((a, b) => 
              a.city.localeCompare(b.city));
          case 'date-latest':
            return [...filteredTrips].sort((a, b) => 
              (b.fromDT?.getTime() || 0) - (a.fromDT?.getTime() || 0));
          case 'date-earliest':
            return [...filteredTrips].sort((a, b) => 
              (a.fromDT?.getTime() || 0) - (b.fromDT?.getTime() || 0));
          case 'days-desc':
            return [...filteredTrips].sort((a, b) => 
              b.monthlyDays - a.monthlyDays);
          case 'days-asc':
            return [...filteredTrips].sort((a, b) => 
              a.monthlyDays - b.monthlyDays);
          default:
            return filteredTrips;
        }
    };

    return (
        <div className="w-max-9xl py-12 bg-white rounded-3xl">
            <div className="mb-6 px-8">
                <div className="flex items-center gap-4 flex-wrap">
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
                        <SelectTrigger className="w-[180px] z-8 bg-blue-100">
                            <SelectValue placeholder="Filter by" />
                        </SelectTrigger>
                        <SelectContent className="bg-blue-100">
                            <SelectItem className="hover:bg-blue-400" value="alphabetical">Alphabetical</SelectItem>
                            <SelectItem className="hover:bg-blue-400" value="date-latest">Date (Latest)</SelectItem>
                            <SelectItem className="hover:bg-blue-400" value="date-earliest">Date (Earliest)</SelectItem>
                            <SelectItem className="hover:bg-blue-400" value="days-desc">Days (Most)</SelectItem>
                            <SelectItem className="hover:bg-blue-400" value="days-asc">Days (Least)</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* City filter input */}
                    <div className="relative">
                        <Input
                            type="text"
                            placeholder="Filter by city..."
                            className="w-[200px] bg-blue-100 focus:bg-blue-50"
                            value={cityFilter}
                            onChange={(e) => setCityFilter(e.target.value)}
                        />
                        {cityFilter && (
                            <button 
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                onClick={() => setCityFilter('')}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    
                    {/* Hide passed trips checkbox */}
                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="hide-passed-trips" 
                            checked={hidePassedTrips} 
                            onCheckedChange={(checked) => setHidePassedTrips(checked === true)}
                            className="bg-blue-100 data-[state=checked]:bg-blue-600"
                        />
                        <label
                            htmlFor="hide-passed-trips"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Hide past trips
                        </label>
                    </div>
                </div>
            </div>

            <div className="relative max-w-8xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <p>Loading trips...</p>
          </div>
        ) : sortTrips(trips).length > 0 ? (
          <>
            <Button 
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 rounded-full w-8 h-8 p-0 bg-white border shadow-lg hover:bg-gray-100"
              variant="ghost">
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="flex gap-4 overflow-hidden px-8 scroll-smooth" id="trips-container">
              {sortTrips(trips).map((trip) => (
                <div key={trip.trip_doc_id}>
                    <TripCard 
                      trip={trip} 
                      onDelete={triggerRefresh} 
                      setGlobalLoading={setGlobalLoading}
                    />
                </div>
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
            {cityFilter || hidePassedTrips ? (
                <p className="text-lg text-gray-600 mb-4 py-16">
                    {hidePassedTrips && cityFilter 
                        ? `No upcoming trips found matching "${cityFilter}"`
                        : hidePassedTrips 
                            ? "No upcoming trips found" 
                            : `No trips found matching "${cityFilter}"`}
                </p>
            ) : (
                <p className="text-lg text-gray-600 mb-4 py-16">No trips yet!</p>
            )}
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