import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface PersonalizingStepProps {
  userImage?: string;
  onComplete: () => void;
}

export const PersonalizingStep = ({ userImage, onComplete }: PersonalizingStepProps) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Analyzing your photo...");
  
  useEffect(() => {
    // Simulate AI analysis with smooth progress
    const duration = 4000; // 4 seconds total
    const startTime = Date.now();
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(100, (elapsed / duration) * 100);
      setProgress(newProgress);
      
      // Update status text based on progress
      if (newProgress < 40) {
        setStatusText("Analyzing your style...");
      } else if (newProgress < 70) {
        setStatusText("Building your profile...");
      } else if (newProgress < 100) {
        setStatusText("Almost done...");
      }
      
      if (newProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          onComplete();
        }, 500);
      }
    }, 50);
    
    return () => clearInterval(interval);
  }, [onComplete]);

  return (      <div className="screen-safe app-content bg-white flex flex-col items-center justify-center px-8 py-16 h-full">
      <div className="w-full max-w-md mx-auto flex flex-col items-center">
        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-black text-center mb-4"
          style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', fontWeight: 700 }}
        >
          Creating your style profile
        </motion.h1>

        {/* Status text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-gray-600 text-center mb-20"
          style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}
        >
          {statusText}
        </motion.p>

        {/* Circular progress indicator */}
        <div className="relative w-48 h-48 mb-20">
          {/* Background circle */}
          <svg className="transform -rotate-90 w-48 h-48">
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="#E5E5E5"
              strokeWidth="12"
              fill="none"
            />
            {/* Progress circle */}
            <motion.circle
              cx="96"
              cy="96"
              r="88"
              stroke="#000000"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              initial={{ strokeDasharray: "0 552" }}
              animate={{ strokeDasharray: `${(progress / 100) * 552} 552` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </svg>
          
          {/* Progress percentage in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              key={Math.floor(progress)}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-5xl font-bold text-black"
              style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', fontWeight: 700 }}
            >
              {Math.round(progress)}%
            </motion.span>
          </div>
        </div>

        {/* Bottom text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-base text-gray-500 text-center"
          style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}
        >
          This will only take a moment
        </motion.p>
      </div>
    </div>
  );
};

