import { motion } from "framer-motion";

interface LoadingOverlayProps {
  message?: string;
}

const LoadingOverlay = ({ message = "Generating Trip..." }: LoadingOverlayProps) => {
  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white/90 p-8 rounded-xl shadow-lg flex flex-col items-center">
        <motion.div
          className="w-32 h-32 rounded-full border-4 border-blue-500 border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: "linear",
          }}
        />
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
          {message}
        </motion.p>
      </div>
    </div>
  );
};

export default LoadingOverlay;