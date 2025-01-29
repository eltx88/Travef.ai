import { motion } from "framer-motion";

const LoadingGlobe = () => {
  return (
    <div className="h-screen flex flex-col justify-center items-center bg-gray-100">
      {/* Spinning Globe */}
      <motion.div
        className="w-32 h-32 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"
        style={{ borderTopColor: "transparent" }} // For the spinning effect
        animate={{ rotate: 360 }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: "linear",
        }}
      />
      {/* Loading Text */}
      <motion.p
        className="mt-6 text-xl font-semibold text-blue-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        Loading...
      </motion.p>
    </div>
  );
};

export default LoadingGlobe;