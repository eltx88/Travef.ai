import {useState, FC, useEffect} from "react";
import { Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
 } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Itinerary {
    id: number;
    image: string;
    country: string;
    days: number;
    date: string;
}

type FilterOption = 'alphabetical' | 'date' | 'days';

export const Itineraries: FC = () => {
    const [itineraries, setItineraries] = useState<Itinerary[]>([]);
    const [filterOption, setFilterOption] = useState<FilterOption>('date');
    const [scrollPosition, setScrollPosition] = useState(0);

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

    // useEffect(() => {
    //     fetch('/api/itineraries')
    //         .then((response) => response.json())
    //         .then((data) => setItineraries(data));
    // }, []);

    const addItinerary = (): void => {
        const newItinerary: Itinerary = {
            id: Date.now(),
            image: '',
            country: 'America',
            days: 5,
            date: new Date().toISOString().split('T')[0],
        };
        setItineraries([...itineraries, newItinerary]);
    };

    const sortItineraries = (itineraries: Itinerary[]): Itinerary[] => {
        switch (filterOption) {
            case 'alphabetical':
                return [...itineraries].sort((a, b) => a.country.localeCompare(b.country));
            case 'date':
                return [...itineraries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            case 'days':
                return [...itineraries].sort((a, b) => b.days - a.days);
            default:
                return itineraries;
        }
    };

    return (
        <div className="w-full py-16 bg-blue-50">
            <div className="flex justify-between items-center mb-6 px-4 max-w-7xl mx-auto">
                <div className="flex items-center gap-4">
                    <h2 className="text-4xl font-semibold">Trips</h2>
                    <Button
                        className=" text-xl py-4 px-3 rounded-full transition-all duration-300 ease-in-out hover:rounded-full bg-slate-300 hover:bg-blue-300"
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

            <div className="relative max-w-7xl mx-auto">
                {itineraries.length > 0 ? (
                <>

                <Button 
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 rounded-full w-8 h-8 p-0 bg-white border shadow-lg hover:bg-gray-100"
                    variant="ghost">
                <ChevronLeft className="w-5 h-5" />
                </Button>

                <div id="trips-container" className="flex gap-4 overflow-hidden px-8 scroll-smooth">
                    {sortItineraries(itineraries).map((itinerary: Itinerary) => (
                    <Card key={itinerary.id} className="w-[300px] flex-shrink-0 bg-white shadow-md hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                        <img src={itinerary.image} alt={itinerary.country} className="w-full h-[200px] object-cover rounded-md mb-4" />
                        <h3 className="font-semibold text-lg">{itinerary.country}</h3>
                        <p>Days: {itinerary.days}</p>
                        <p>Date: {itinerary.date}</p>
                        </CardContent>
                    </Card>
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
                    <Button onClick={addItinerary} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 rounded-lg transition-colors">
                        Create Trip
                    </Button>
                </div>
                )};
            </div>
        </div>);
};

export default Itineraries;