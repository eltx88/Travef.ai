import AnimatedMountains from "@/animations/mountains.tsx";
import { motion } from 'framer-motion';
import LearnMore from "@/components/LearnMore";
import LoginPopup from "@/components/Forms/LoginForm";
import SignupPopup from "@/components/Forms/SignupForm";
import { Outlet } from "react-router-dom";
import Footer from "@/components/Footer";
function LandingPage() {
  return (
    <>
    <Outlet />
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-gray-100">
      <header className="relative z-10 flex items-center justify-between py-5 px-5">
        <div>
          <a href="/" className="font-outfit font-bold text-2xl text-blue-600">Travefai</a>
        </div>
        <div className="flex space-x-4 items-center ml-auto">
          {/* <Button  variant="ghost" className="text-blue-600 hover:bg-blue-100 text-lg">Sign Up</Button>
          <Button variant="ghost" className="text-blue-600 hover:bg-blue-100 text-lg">Log In</Button> */}
        <SignupPopup />
        <LoginPopup />
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center relative z-10">
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
            className="text-xl mb-4 text-gray-600"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            Planning your dream holiday? At Travef.ai, we simplify travel by helping you create personalized itineraries tailored to your preferences.
          </motion.p>
          <LearnMore />
        </div>
      </main>
      <div className="absolute inset-0 z-0">
        <AnimatedMountains />
      </div>
      <Footer />
    </div>
    </>
  );
}

export default LandingPage;