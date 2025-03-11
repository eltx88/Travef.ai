import AnimatedMountains from "@/animations/mountains.tsx";
import { motion } from 'framer-motion';
import LearnMore from "@/components/learnmore";
import LoginPopup from "@/components/Forms/LoginForm";
import SignupPopup from "@/components/Forms/SignupForm";
import { Outlet, useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
import { useAuthStore } from "@/firebase/firebase";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from 'react';
import { House, MapPin, Calendar, Star, Users, PlaneTakeoff, Search, Map, Bot } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function LandingPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [showLearnMore, setShowLearnMore] = useState(false);
  const learnMoreSectionRef = useRef<HTMLDivElement>(null);
  
  const handleNavigateToHome = () => {
    navigate('/home');
  };

  useEffect(() => {
    // Create an intersection observer to detect when the learn more section is visible
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setShowLearnMore(true);
          // Can optionally disconnect after first detection
          // observer.disconnect();
        } else {
          setShowLearnMore(false);
        }
      },
      {
        rootMargin: '-100px',
        threshold: 0.1
      }
    );
    
    if (learnMoreSectionRef.current) {
      observer.observe(learnMoreSectionRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  return (
    <>
    <Outlet />
    <div className="flex flex-col relative overflow-hidden">
      {/* First section with main content */}
      <div className="min-h-screen flex flex-col bg-gray-100 relative">
        <header className="relative z-10 flex items-center justify-between py-5 px-5">
          <div>
            <a href="/" className="font-outfit font-bold text-2xl text-blue-600">Travefai</a>
          </div>
          <div className="flex space-x-4 items-center ml-auto">
            {user ? (
              <Button 
                onClick={handleNavigateToHome} 
                className="bg-blue-600 text-white hover:bg-blue-700 text-lg"
              >
                <House className="w-4 h-4" />
              </Button>
            ) : (
              <>
                <SignupPopup />
                <LoginPopup />
              </>
            )}
          </div>
        </header>
        
        <main className="flex-1 flex flex-col items-center justify-center relative z-10 mb-40">
          <div className="text-center max-w-2xl">
            <motion.h1 
              className="text-6xl font-bold mb-4 text-blue-600"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              Travefai
            </motion.h1>
            <motion.p 
              className="text-xl mb-8 text-gray-600"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              Planning your dream holiday? We simplify travel by helping you create personalized itineraries tailored to your preferences.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              
            </motion.div>
          </div>
          
          {/* New Feature Cards */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-13 max-w-6xl mx-auto px-4"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            <Card className="bg-white/90 backdrop-blur border-blue-200 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-blue-500" />
                  AI-Powered Planning
                </CardTitle>
              </CardHeader>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.3 }}
              >
                <CardContent>
                  <p className="text-gray-600">Our AI engine creates custom itineraries based on your preferences, saving hours of research time.</p>
                </CardContent>
              </motion.div>
              <CardFooter>
                <Badge variant="outline" className="bg-blue-50">Smart Recommendations</Badge>
              </CardFooter>
            </Card>
            
            <Card className="bg-white/90 backdrop-blur border-blue-200 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Map className="h-5 w-5 text-blue-500" />
                  Interactive Maps
                </CardTitle>
              </CardHeader>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.5 }}
              >
                <CardContent>
                  <p className="text-gray-600">Visualize your entire journey with interactive maps showing attractions, restaurants, and transportation options.</p>
                </CardContent>
              </motion.div>
              <CardFooter>
                <Badge variant="outline" className="bg-blue-50">Distance Optimized</Badge>
              </CardFooter>
            </Card>
            
            <Card className="bg-white/90 backdrop-blur border-blue-200 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  Flexible Scheduling
                </CardTitle>
              </CardHeader>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.7 }}
              >
                <CardContent>
                  <p className="text-gray-600">Adjust your itinerary on the fly with our dynamic scheduling system that adapts to changes instantly.</p>
                </CardContent>
              </motion.div>
              <CardFooter>
                <Badge variant="outline" className="bg-blue-50">Real-time Updates</Badge>
              </CardFooter>
            </Card>
          </motion.div>
          <Button 
                onClick={() => {
                  learnMoreSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-2 mt-9"
              >
                Discover How
              </Button>
          
          {/* Destination Tabs */}
          <motion.div 
            className="mt-16 max-w-4xl mx-auto w-full px-4"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            
          </motion.div>
        </main>
        
        {/* Stats section above mountains */}
        <motion.div 
          className="relative z-10 max-w-6xl mx-auto w-full px-4 mb-16 top-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.5 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/80 backdrop-blur rounded-xl p-6 shadow-lg">
            <div className="text-center">
              <h4 className="text-3xl font-bold text-blue-600">30k+</h4>
              <p className="text-gray-600">Happy Travelers</p>
            </div>
            <div className="text-center">
              <h4 className="text-3xl font-bold text-blue-600">100+</h4>
              <p className="text-gray-600">Countries Covered</p>
            </div>
            <div className="text-center">
              <h4 className="text-3xl font-bold text-blue-600">10k+</h4>
              <p className="text-gray-600">Itineraries Created</p>
            </div>
            <div className="text-center">
              <h4 className="text-3xl font-bold text-blue-600">4.9</h4>
              <p className="text-gray-600">Average Rating</p>
            </div>
          </div>
        </motion.div>
        
        {/* Mountains positioned at the bottom of the first section */}
        <div className="absolute bottom-0 w-full z-0 h-80">
          <AnimatedMountains />
        </div>
      </div>
      
      {/* Second section with process steps directly displayed */}
      <div 
        ref={learnMoreSectionRef}
        className="min-h-screen flex flex-col items-center justify-center bg-[#4DA6FF] py-20"
      >
        <motion.h2
          className="text-4xl font-bold mb-12 text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: showLearnMore ? 1 : 0 }}
          transition={{ duration: 0.8 }}
        >
          Discover Our Process
        </motion.h2>
        
        <LearnMore isVisible={showLearnMore} />
        
        {/* Testimonials Section */}
        <motion.div
          className="max-w-6xl mx-auto mt-20 px-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ 
            opacity: showLearnMore ? 1 : 0,
            y: showLearnMore ? 0 : 30 
          }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          <h3 className="text-3xl font-bold text-white text-center mb-12">What Our Users Say</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Sarah M.",
                location: "London, UK",
                text: "Travefai made planning our honeymoon to Italy so simple. The AI suggestions were spot on!"
              },
              {
                name: "David L.",
                location: "Toronto, Canada",
                text: "I was skeptical about AI-planned trips, but this exceeded my expectations for our Asia tour."
              },
              {
                name: "Mia K.",
                location: "Sydney, Australia",
                text: "As a solo traveler, safety was important. Travefai's recommendations gave me peace of mind."
              }
            ].map((testimonial, i) => (
              <Card key={i} className="bg-white/90 backdrop-blur">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="italic text-gray-700">"{testimonial.text}"</p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.location}</p>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </motion.div>
        
        {/* Sign Up Now button - only shown to non-authenticated users */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ 
              opacity: showLearnMore ? 1 : 0,
              y: showLearnMore ? 0 : 30 
            }}
            transition={{ duration: 0.8, delay: 1.5 }}
            className="mt-16"
          >
            <SignupPopup buttonText="Sign Up Now" 
              buttonClassName="bg-white hover:bg-gray-100 text-blue-600 hover:text-blue-700 text-xl px-10 py-3 rounded-full shadow-lg transform transition-transform hover:scale-105" 
            />
          </motion.div>
        )}
      </div>
      
      <Footer />
    </div>
    </>
  );
}

export default LandingPage;
