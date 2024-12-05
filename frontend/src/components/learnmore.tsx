import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { X } from 'lucide-react';

const DiagramPopup = () => (
  <Dialog>
    <DialogTrigger asChild>
      <Button className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-2 mt-1 mb-40">
        Learn More
      </Button>
    </DialogTrigger>
    <DialogContent className="sm:max-w-[900px] bg-white p-8 border-none shadow-lg">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h4 className="font-bold text-2xl">How Travefai Works</h4>
          <p className="text-sm text-gray-500 mt-1">Follow these simple steps to plan your dream holiday:</p>
        </div>
        <DialogTrigger asChild>
          <button className="text-gray-400 hover:text-gray-600">
            <X size={28} />
          </button>
        </DialogTrigger>
      </div>
      <div className="flex space-x-6">
        <div className="bg-[#B3D9FF] p-6 rounded-lg flex flex-col items-center text-center flex-1">
          <img src="/illustrations/preference.svg" alt="Select preferences" className="w-32 h-32 mb-4" />
          <h5 className="font-semibold text-blue-800 text-xl mb-2">1. Select preferences and date</h5>
          <p className="text-sm text-blue-600">Tell us what you like and when you want to travel</p>
        </div>
        <div className="bg-[#80BFFF] p-6 rounded-lg flex flex-col items-center text-center flex-1">
          <img src="/illustrations/points.svg" alt="Choose points of interest" className="w-32 h-32 mb-4" />
          <h5 className="font-semibold text-blue-800 text-xl mb-2">2. Choose points of interest</h5>
          <p className="text-sm text-blue-600">Pick the attractions and activities you want to experience</p>
        </div>
        <div className="bg-[#4DA6FF] p-6 rounded-lg flex flex-col items-center text-center flex-1">
          <img src="/illustrations/generate.svg" alt="Generate itinerary" className="w-32 h-32 mb-4" />
          <h5 className="font-semibold text-blue-800 text-xl mb-2">3. Generate itinerary</h5>
          <p className="text-sm text-blue-600">We'll create a personalized travel plan just for you</p>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

export default DiagramPopup;