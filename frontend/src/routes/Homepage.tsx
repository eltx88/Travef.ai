import { useState, useEffect, useRef } from 'react';
import { NavigationMenuBar } from "@/components/NavigationMenuBar";
import Searchbar from "@/components/Homepage/SearchbarHomepage";
import Itineraries from "@/components/Homepage/Trips";
import { LocationProvider } from "@/contexts/LocationContext";
import LoadingOverlay from "@/components/LoadingOverlay";
import Footer from "@/components/Footer";
import AnimatedMountains from "@/animations/mountains";

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
      <div className="flex flex-col min-h-screen bg-blue-500 overflow-x-hidden">
        {isLoading && <LoadingOverlay message={loadingMessage} />}
        <NavigationMenuBar />
        
        <main className="flex flex-grow flex-col items-center justify-start relative">
          {/* Hero section with search bar and mountains */}
          <div className="min-h-[100vh] w-full flex items-center justify-center relative">
            {/* Expand mountains to cover full width with overflow hidden on parent */}
            <div className="absolute inset-0 flex items-center justify-center z-0 w-screen">
              <div className="w-full h-full" style={{ marginTop: '20vh' }}>
                <AnimatedMountains />
              </div>
            </div>
            
            {/* Keep search bar on top of mountains */}
            <div className="relative z-10 w-full bottom-20 px-4">
              <Searchbar />
            </div>
          </div>
          
          {/* Trips section with full width background matching the mountains */}
          <div 
            className="w-screen py-16 bg-[#4DA6FF] -mt-1" 
            id="trips-section"
            ref={tripsSectionRef}
          >
            <div 
              className="transition-all duration-2000 ease-in-out transform px-4 max-w-screen-3xl mx-auto"
              style={{
                opacity: animateItineraries ? 1 : 0,
                transform: animateItineraries ? 'translateY(0)' : 'translateY(100px)',
                transition: 'opacity 2s ease-in-out, transform 2s ease-in-out',
                display: showItineraries ? 'block' : 'none'
              }}
            >
              {showItineraries && <Itineraries setGlobalLoading={handleGlobalLoading} />}
            </div>
            
            {!showItineraries && (
              <div className="h-[500px] w-full">
                {/* Empty placeholder when trips aren't shown */}
              </div>
            )}
          </div>
        </main>
        
        {/* Connect footer directly to content with no gap */}
        <Footer />
      </div>
    </LocationProvider>
  );
}

export default HomePage;