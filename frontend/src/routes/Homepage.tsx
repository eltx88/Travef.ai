import { NavigationMenuBar } from "@/components/NavigationMenuBar";
import SearchFunction from "@/components/SearchFunction";
import Itineraries from "@/components/Trips";
function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <NavigationMenuBar />
      
      <main className="top-60 flex flex-grow flex-col items-center justify-start relative p-4">
          <SearchFunction />
          <div className="w-full mt-24">
            <Itineraries />
          </div>
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

export default HomePage;
