import React from 'react';
import { motion } from 'framer-motion';

const AnimatedMountains: React.FC = () => {
  const mountainVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: custom * 0.1, duration: 5, ease: "easeOut" }
    })
  };

  return (
    <svg
      viewBox="0 0 1000 400"
      className="absolute bottom-0 left-0 w-full h-90"
      preserveAspectRatio="none"
    >
      {/* Back row */}
      <motion.path d="M0 400 L50 300 L100 350 L150 250 L200 300 L250 200 L300 350 L350 250 L400 300 L450 200 L500 250 L550 300 L600 200 L650 300 L700 250 L750 350 L800 200 L850 300 L900 250 L950 300 L1000 350 L1000 400 Z" fill="#B3D9FF" variants={mountainVariants} initial="hidden" animate="visible" custom={0} />
      
      {/* Middle row */}
      <motion.path d="M0 400 L0 350 L50 250 L100 300 L150 200 L200 350 L250 250 L300 300 L350 150 L400 250 L450 300 L500 200 L550 350 L600 250 L650 300 L700 200 L750 300 L800 250 L850 350 L900 200 L950 300 L1000 250 L1000 400 Z" fill="#80BFFF" variants={mountainVariants} initial="hidden" animate="visible" custom={1} />
      
      {/* Front row */}
      <motion.path d="M0 400 L0 300 L50 350 L100 250 L150 300 L200 200 L250 350 L300 250 L350 300 L400 150 L450 300 L500 250 L550 350 L600 200 L650 300 L700 250 L750 350 L800 200 L850 300 L900 250 L950 350 L1000 300 L1000 400 Z" fill="#4DA6FF" variants={mountainVariants} initial="hidden" animate="visible" custom={2} />
      
      {/* Highlights */}
      <motion.path d="M100 250 L120 220 L140 240 M300 250 L320 220 L340 240 M500 250 L520 220 L540 240 M700 250 L720 220 L740 240 M900 250 L920 220 L940 240" stroke="#E6F3FF" strokeWidth="2" fill="none" variants={mountainVariants} initial="hidden" animate="visible" custom={3} />
      
      {/* Shadows */}
      <motion.path d="M50 300 L70 320 L90 310 M250 300 L270 320 L290 310 M450 300 L470 320 L490 310 M650 300 L670 320 L690 310 M850 300 L870 320 L890 310" stroke="#3385FF" strokeWidth="2" fill="none" variants={mountainVariants} initial="hidden" animate="visible" custom={4} />
    </svg>
  );
};

export default AnimatedMountains;