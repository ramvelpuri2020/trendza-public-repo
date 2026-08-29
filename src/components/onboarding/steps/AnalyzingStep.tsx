import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, Eye, Brain, TrendingUp, Award } from "lucide-react";

interface AnalyzingStepProps {
  onComplete: () => void;
}

const analyzingMessages = [
  {
    text: "Scanning your outfit details...",
    icon: Eye,
    duration: 1200
  },
  {
    text: "Analyzing color combinations...",
    icon: Brain,
    duration: 1500
  },
  {
    text: "Evaluating fit & proportions...",
    icon: TrendingUp,
    duration: 1400
  },
  {
    text: "Cross-referencing style trends...",
    icon: Zap,
    duration: 1600
  },
  {
    text: "Calculating your drip score...",
    icon: Award,
    duration: 1300
  },
  {
    text: "Finalizing your grade...",
    icon: Sparkles,
    duration: 1000
  }
];

export const AnalyzingStep = ({ onComplete }: AnalyzingStepProps) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);

  useEffect(() => {
    let currentDuration = 0;
    
    // Rotate messages with varying durations
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => {
        const nextIndex = (prev + 1) % analyzingMessages.length;
        currentDuration = analyzingMessages[nextIndex].duration;
        return nextIndex;
      });
    }, analyzingMessages[0].duration);

    // Progress bar simulation with realistic timing
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 98) {
          return prev + (Math.random() * 2 + 0.5); // Variable progress
        }
        return prev;
      });
    }, 150);

    // Complete after total duration
    const totalDuration = analyzingMessages.reduce((sum, msg) => sum + msg.duration, 0);
    const completeTimer = setTimeout(() => {
      setProgress(100);
      setShowCompletion(true);
      
      // Complete after showing 100%
      setTimeout(() => {
        onComplete();
      }, 1000);
    }, totalDuration);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const currentMessage = analyzingMessages[currentMessageIndex];
  const CurrentIcon = currentMessage.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 flex flex-col justify-center items-center px-6"
    >
      {/* Central Animation */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <motion.div
          animate={{ 
            rotate: [0, 5, -5, 0],
            scale: [1, 1.05, 1],
            y: [0, -5, 0]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="w-32 h-32 bg-gradient-to-r from-gray-800 via-gray-900 to-black rounded-full flex items-center justify-center mb-8 mx-auto shadow-2xl border border-white/10"
        >
          <motion.div
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: "linear" 
            }}
          >
            <CurrentIcon className="w-16 h-16 text-white" />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Dynamic Text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold text-white mb-6">
          {showCompletion ? "Analysis Complete!" : "Analyzing Your Style..."}
        </h2>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMessageIndex}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 1.05 }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-center space-x-3"
          >
            <CurrentIcon className="w-6 h-6 text-red-500" />
            <p className="text-gray-300 text-xl font-medium">
              {currentMessage.text}
            </p>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="w-full max-w-md mb-8"
      >
        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden border border-white/20">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.2 }}
            className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full relative overflow-hidden"
          >
            <motion.div
              animate={{ 
                x: [-100, 100],
                opacity: [0, 1, 0]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            />
          </motion.div>
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="text-center mt-3"
        >
          <span className="text-white font-bold text-lg">
            {Math.round(progress)}%
          </span>
          <span className="text-gray-400 text-sm ml-2">
            complete
          </span>
        </motion.div>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="text-center"
      >
        <p className="text-gray-400 text-sm">
          {showCompletion 
            ? "Preparing your personalized results..." 
            : "Our AI is analyzing every detail of your outfit..."
          }
        </p>
      </motion.div>

      {/* Completion Animation */}
      {showCompletion && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ duration: 0.8 }}
            className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center"
          >
            <motion.div
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}; 