import { useState, useEffect, useRef } from 'react';
import { NavigationMenuBar } from "@/components/NavigationMenuBar";
import Searchbar from "@/components/Homepage/SearchbarHomepage";
import Itineraries from "@/components/Homepage/Trips";
import { LocationProvider } from "@/contexts/LocationContext";
import LoadingOverlay from "@/components/LoadingOverlay";
import Footer from "@/components/Footer";
function HomePage() {
  const [showItineraries, setShowItineraries] = useState(false);
  const [animateItineraries, setAnimateItineraries] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const tripsSectionRef = useRef<HTMLDivElement>(null);
  
  // Handle global loading state
  const handleGlobalLoading = (loading: boolean, message?: string) => {
    setIsLoading(loading);
    if (message) {
      setLoadingMessage(message);
    }
  };
  
  useEffect(() => {
    // Create an intersection observer with stricter settings
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          // First render the component without animation
          setShowItineraries(true);
          
          // Then trigger the animation after a short delay
          setTimeout(() => {
            setAnimateItineraries(true);
          }, 100);
          
          observer.disconnect();
        }
      },
      {
        rootMargin: '-50px',
        threshold: 0.1
      }
    );
    
    if (tripsSectionRef.current) {
      observer.observe(tripsSectionRef.current);
    }
    
    // Handle direct navigation to trips section
    if (sessionStorage.getItem('scrollToTrips') === 'true') {
      sessionStorage.removeItem('scrollToTrips');
      
      setShowItineraries(true);
      
      requestAnimationFrame(() => {
        tripsSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        // Delay animation start for direct navigation
        setTimeout(() => {
          setAnimateItineraries(true);
        }, 800);
      });
    }
    
    return () => observer.disconnect();
  }, []);

  return (
    <LocationProvider>
      <div className="flex flex-col min-h-screen bg-blue-500">
        {isLoading && <LoadingOverlay message={loadingMessage} />}
        <NavigationMenuBar />
        
        <main className="flex flex-grow flex-col items-center justify-start relative p-4">
          {/* Increased height to push trips section below fold */}
          <div className="min-h-[100vh] w-full flex items-center justify-center">
            <Searchbar />
          </div>
          
          {/* Trips section with improved positioning */}
          <div 
            className="w-full py-16" 
            id="trips-section"
            ref={tripsSectionRef}
          >
            <div 
              className="transition-all duration-2000 ease-in-out transform"
              style={{
                opacity: animateItineraries ? 1 : 0,
                transform: animateItineraries ? 'translateY(0)' : 'translateY(100px)',
                transition: 'opacity 2s ease-in-out, transform 2s ease-in-out',
                display: showItineraries ? 'block' : 'none'
              }}
            >
              {showItineraries && <Itineraries setGlobalLoading={handleGlobalLoading} />}
            </div>
            
            {!showItineraries && <div className="h-[500px] w-full"></div>}
          </div>
        </main>
        <Footer />
      </div>
    </LocationProvider>
  );
}

export default HomePage;