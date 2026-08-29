import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { User } from "lucide-react";
import { CachedImage } from "@/components/ui/CachedImage";

interface DripScoreProps {
  score: number;
  profileImage?: string;
}

export const DripScore = ({ score, profileImage }: DripScoreProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return {
      gradient: "from-green-400 to-green-500",
      text: "text-green-400",
      bg: "bg-green-500",
      strokeColor: "#4ade80"
    };
    if (score >= 70) return {
      gradient: "from-emerald-400 to-emerald-500", 
      text: "text-emerald-400",
      bg: "bg-emerald-500",
      strokeColor: "#34d399"
    };
    if (score >= 60) return {
      gradient: "from-yellow-400 to-yellow-500", 
      text: "text-yellow-400",
      bg: "bg-yellow-500",
      strokeColor: "#fbbf24"
    };
    if (score >= 50) return {
      gradient: "from-orange-400 to-orange-500", 
      text: "text-orange-400",
      bg: "bg-orange-500",
      strokeColor: "#fb923c"
    };
    return {
      gradient: "from-red-400 to-red-500",
      text: "text-red-400", 
      bg: "bg-red-500",
      strokeColor: "#f87171"
    };
  };

  const colors = getScoreColor(score);
  const circumference = 2 * Math.PI * 60; // radius of 60
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center space-y-6 animate-fade-in">
      {/* Profile Avatar */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
        className="relative"
      >
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-white/20 bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center overflow-hidden">
          {profileImage ? (
            <CachedImage
              src={profileImage}
              blurHash={null}
              width={160}
              alt="Profile"
              fit="cover"
              variant="hero"
              className="w-full h-full"
            />
          ) : (
            <User className="w-8 h-8 sm:w-10 sm:h-10 text-white/60" />
          )}
        </div>
      </motion.div>

      {/* Circular Progress Score */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative flex items-center justify-center"
      >
        <svg className="w-32 h-32 sm:w-40 sm:h-40 transform -rotate-90" viewBox="0 0 144 144">
          {/* Background circle */}
          <circle
            cx="72"
            cy="72"
            r="60"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="8"
            fill="none"
            className="drop-shadow-sm"
          />
          
          {/* Progress circle */}
          <motion.circle
            cx="72"
            cy="72"
            r="60"
            stroke={colors.strokeColor}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
            className="drop-shadow-lg"
          />
        </svg>
        
        {/* Score number in center */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="text-center">
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.5, delay: 1.2 }}
              className={cn("text-4xl sm:text-5xl font-bold", colors.text)}
            >
              {score}
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.4 }}
              className="text-white/60 text-sm font-medium"
            >
              Overall
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      {/* Score Description */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.6 }}
        className="text-center space-y-2"
      >
        <div className="flex items-center justify-center space-x-2">
          <div className={cn("w-2 h-2 rounded-full", colors.bg)}></div>
          <span className="text-white font-medium text-sm">
            {score >= 80 ? "Exceptional Style" : 
             score >= 70 ? "Great Style" : 
             score >= 60 ? "Good Style" : 
             score >= 50 ? "Decent Style" : "Needs Work"}
          </span>
          <div className={cn("w-2 h-2 rounded-full", colors.bg)}></div>
        </div>
        
        {/* Rating bars for visual appeal */}
        <div className="flex justify-center space-x-1">
          {[1, 2, 3, 4, 5].map((bar) => (
            <motion.div
              key={bar}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: bar <= Math.ceil(score / 20) ? 1 : 0.3 }}
              transition={{ duration: 0.3, delay: 1.8 + bar * 0.1 }}
              className={cn(
                "w-1.5 h-4 rounded-full",
                bar <= Math.ceil(score / 20) 
                  ? `bg-gradient-to-t ${colors.gradient}` 
                  : "bg-white/20"
              )}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};