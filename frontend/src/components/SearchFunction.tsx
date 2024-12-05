import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useCarouselAnimation, cardVariants } from '@/animations/cards.tsx';
import { SearchCity } from '../Types/InterfaceTypes';
import CitySearch from './CitySearchBar';
import citiesAnimationData from "@/data/cities.json";

interface CityImage {
  city: string;
  image_link: string;
  lat: number;
  lng: number;
  country: string;
}

const SearchFunction: React.FC = () => {
  const navigate = useNavigate();
  const carousel = useRef<HTMLDivElement>(null);
  const controls = useCarouselAnimation(carousel);

  const handleCitySubmit = (city: SearchCity): void => {
      navigate(`/poi`, {
          state: {
              city: city.name,
              lat: city.lat,
              lng: city.lng,
              country: city.country
          }
      });
  };

  return (
      <div className="flex flex-col items-center w-full">
          <h1 className="text-6xl font-bold text-center mb-4 content-center">Planning a trip?</h1>
          <p className="text-center mb-5">Get inspired by searching for attractions, restaurants and hotels</p>
          
          <div className="mb-10 w-full max-w-screen-md">
                <CitySearch
                    initialValue=""
                    onSubmit={handleCitySubmit}
                    className="w-full"
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
                              className="h-[210px] w-[250px] cursor-pointer" 
                              onClick={() => handleCitySubmit({ 
                                  name: city.city,
                                  country: city.country,
                                  lat: city.lat.toString(),
                                  lng: city.lng.toString(),
                                  admin1: '',  // If you have these in your data, add them
                                  admin2: ''   // If you have these in your data, add them
                              })}
                          >
                              <CardContent className="p-0">
                                  <img src={city.image_link} alt={city.city} className="w-full h-[180px] object-cover rounded-t-lg" />
                              </CardContent>
                              <CardFooter className="flex flex-col justify-center items-center py-1">
                                  <h3 className="font-semibold">{city.city}</h3>
                              </CardFooter>
                          </Card>
                      </motion.div>
                  ))}
              </motion.div>
          </motion.div>
      </div>
  );
};

export default SearchFunction;