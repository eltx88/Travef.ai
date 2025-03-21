import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { useCarouselAnimation, cardVariants } from '@/animations/cards';
import { SearchCity } from '../../Types/InterfaceTypes';
import CitySearch from '../CitySearchBar';
import citiesAnimationData from '@/data/cities.json';

interface CityImage {
  city: string;
  image_link: string;
  lat: number;
  lng: number;
  country: string;
}

const Searchbar: React.FC = () => {
  const navigate = useNavigate();
  const carousel = useRef<HTMLDivElement>(null);
  const controls = useCarouselAnimation(carousel);
  const handleCitySubmit = (city: SearchCity): void => {
    navigate(`/poi`, {
          state: {
              city: city.name,
              country: city.country,
              lat: city.lat,
              lng: city.lng
          }
      });
  };

  return (
      <div className="flex flex-col items-center w-full">
          <h1 className="text-6xl font-bold text-center mb-4 content-center animate-scale-in text-white">Planning a trip?</h1>
          <p className="text-center mb-5 animate-fade-in-left opacity-0 text-white">Get inspired by searching for attractions, restaurants and hotels</p>
          
          <div className="mb-10 w-full max-w-screen-md">
                <CitySearch
                    initialValue=""
                    onSubmit={handleCitySubmit}
                    className="w-full border-t-neutral-950"
                    inputClassName="h-12 text-black hover:cursor-text focus:cursor-text"
                    showButton={true}
                />
            </div>

          <motion.div ref={carousel} className="w-full overflow-hidden">
              <motion.div 
                  className="flex space-x-4 flex-nowrap"
                  animate={controls}
                  transition={{ 
                      x: { 
                          duration: 10,
                          repeat: Infinity,
                          ease: "linear"
                      }
                  }}
              >
                  {[...citiesAnimationData.cities, ...citiesAnimationData.cities].map((city: CityImage, index: number) => (
                      <motion.div 
                          key={`${city.city}-${index}`} 
                          className="min-w-[250px]"
                          variants={cardVariants}
                          initial="hidden"
                          animate="visible"
                          whileHover="hover"
                      >
                          <Card 
                              className="h-[210px] w-[250px] cursor-pointer bg-white overflow-hidden rounded-xl shadow-md group" 
                              onClick={() => handleCitySubmit({ 
                                  name: city.city,
                                  country: city.country,
                                  lat: city.lat.toString(),
                                  lng: city.lng.toString()
                              })}
                          >
                              <div className="relative h-full w-full">
                                  <div className="absolute inset-0 p-[3px] rounded-xl overflow-hidden group-hover:p-0 transition-all duration-300">
                                      <img 
                                          src={city.image_link} 
                                          alt={city.city} 
                                          className="w-full h-[210px] object-cover rounded-t-lg group-hover:h-full group-hover:rounded-xl transition-all duration-300 p-0" 
                                      />
                                  </div>
                                  <div 
                                      className="absolute bottom-0 w-full bg-white py-1 flex justify-center items-center group-hover:opacity-0 transition-opacity duration-300"
                                  >
                                      <h3 className="font-semibold">{city.city}</h3>
                                  </div>
                              </div>
                          </Card>
                      </motion.div>
                  ))}
              </motion.div>
          </motion.div>
      </div>
  );
};

export default Searchbar;