import { motion } from 'framer-motion';

const LearnMore = ({ isVisible }: { isVisible: boolean }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ 
      opacity: isVisible ? 1 : 0,
      y: isVisible ? 0 : 50 
    }}
    transition={{ duration: 0.8 }}
    className="w-full max-w-7xl px-4 my-16"
  >
    <div className="bg-white lg:p-6 rounded-xl shadow-xl">
      <div className="mb-5">
        <p className="text-2xl text-gray-600 mt-2">Follow these simple steps to plan your dream holiday:</p>
      </div>

      <div className="flex flex-col md:flex-row space-y-8 md:space-y-0 md:space-x-8">
        <motion.div 
          className="bg-[#B3D9FF] p-8 lg:p-10 rounded-lg flex flex-col items-center text-center flex-1"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -50 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <img src="/illustrations/preference.svg" alt="Select preferences" className="w-40 h-40 mb-6" />
          <h5 className="font-semibold text-blue-800 text-2xl mb-3">1. Select preferences and date</h5>
          <p className="text-base text-blue-600">Tell us what you like and when you want to travel</p>
        </motion.div>
        
        <motion.div 
          className="bg-[#3b9dff9a] p-8 lg:p-10 rounded-lg flex flex-col items-center text-center flex-1"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -50 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <img src="/illustrations/points.svg" alt="Choose points of interest" className="w-40 h-40 mb-6" />
          <h5 className="font-semibold text-blue-800 text-2xl mb-3">2. Choose points of interest</h5>
          <p className="text-base text-blue-600">Pick the attractions and activities you want to experience</p>
        </motion.div>
        
        <motion.div 
          className="bg-[#4da6ffd6] p-8 lg:p-10 rounded-lg flex flex-col items-center text-center flex-1"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -50 }}
          transition={{ duration: 0.5, delay: 1.2 }}
        >
          <img src="/illustrations/generate.svg" alt="Generate itinerary" className="w-40 h-40 mb-6" />
          <h5 className="font-semibold text-blue-800 text-2xl mb-3">3. Generate itinerary</h5>
          <p className="text-base text-blue-800">We'll create a personalized travel plan just for you</p>
        </motion.div>
      </div>
    </div>
  </motion.div>
);

export default LearnMore;