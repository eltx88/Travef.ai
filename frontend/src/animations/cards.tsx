import { useEffect, RefObject } from 'react';
import { useAnimation, AnimationControls } from 'framer-motion';

export const useCarouselAnimation = (
  carouselRef: RefObject<HTMLDivElement>,
  duration: number = 30,
  interval: number = 0
): AnimationControls => {
  const controls = useAnimation();

  useEffect(() => {
    const animate = async () => {
      if (carouselRef.current) {
        const width = carouselRef.current.scrollWidth / 2;
        
        await controls.start({ 
          x: -width,
          transition: {
            duration: duration,
            ease: "linear",
            repeat: Infinity
          }
        });
      }
    };

    animate();

    return () => controls.stop();
  }, [controls, carouselRef, duration]);

  return controls;
};

  
  // Separate export for cardVariants
  export const cardVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.5 }
    },
    hover: { 
      scale: 1.05,
      transition: { duration: 0.3 }
    }
  };