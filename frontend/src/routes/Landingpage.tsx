import AnimatedMountains from "@/animations/mountains.tsx";
import { motion } from 'framer-motion';
import LearnMore from "@/components/LearnMore";
import LoginPopup from "@/components/Forms/LoginForm";
import SignupPopup from "@/components/Forms/SignupForm";
import { Outlet, useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
import { useAuthStore } from "@/firebase/firebase";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from 'react';
import { House } from "lucide-react";

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
              Planning your dream holiday? At Travef.ai, we simplify travel by helping you create personalized itineraries tailored to your preferences.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Button 
                onClick={() => {
                  learnMoreSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-2 mt-4"
              >
                Discover How
              </Button>
            </motion.div>
          </div>
        </main>
        
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