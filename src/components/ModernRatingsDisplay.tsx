
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Save, Share2 } from "lucide-react";
import { ScoreBreakdown } from "@/types/styleTypes";
import { CachedImage } from "./ui/CachedImage";

interface ModernRatingsDisplayProps {
  overallScore: number;
  profileImage?: string;
  breakdown: ScoreBreakdown[];
  onSave?: () => void;
  onShare?: () => void;
  isOnboarding?: boolean;
}

// Map AI categories to our 6 display categories with proper score handling
const mapAIDataToCategories = (overallScore: number, breakdown: ScoreBreakdown[]) => {
  // Create a map of AI categories for easy lookup
  const categoryMap = breakdown.reduce((acc, item) => {
    // Ensure scores are normalized to 0-100 range
    let normalizedScore = item.score;
    if (normalizedScore <= 10) {
      normalizedScore = normalizedScore * 10; // Convert 0-10 to 0-100
    }
    acc[item.category.toLowerCase()] = Math.min(100, Math.max(1, normalizedScore));
    return acc;
  }, {} as Record<string, number>);

  // Normalize overall score to 0-100 range
  let normalizedOverall = overallScore;
  if (normalizedOverall <= 10) {
    normalizedOverall = normalizedOverall * 10;
  }
  normalizedOverall = Math.min(100, Math.max(1, normalizedOverall));

  const getScore = (keys: string[], fallback: number) => {
    for (const key of keys) {
      if (categoryMap[key]) {
        return categoryMap[key];
      }
    }
    return Math.min(100, Math.max(1, fallback));
  };

  return [
    {
      label: "Overall",
      value: normalizedOverall,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-500"
    },
    {
      label: "Potential", 
      value: Math.min(100, normalizedOverall + Math.floor(Math.random() * 10) + 5),
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-500"
    },
    {
      label: "Aura",
      value: getScore(['style coherence', 'style cohesion', 'trend awareness'], normalizedOverall + Math.floor(Math.random() * 8) - 4),
      color: "from-blue-500 to-blue-600", 
      bgColor: "bg-blue-500"
    },
    {
      label: "Drip Quality",
      value: getScore(['color coordination', 'fit & proportion', 'fit & silhouette'], normalizedOverall + Math.floor(Math.random() * 10) + 2),
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-500"
    },
    {
      label: "Color Coordination",
      value: getScore(['color coordination'], normalizedOverall + Math.floor(Math.random() * 6) + 1),
      color: "from-pink-500 to-pink-600",
      bgColor: "bg-pink-500"
    },
    {
      label: "Attractiveness",
      value: getScore(['accessories', 'outfit creativity', 'occasion appropriateness'], normalizedOverall + Math.floor(Math.random() * 8) - 2),
      color: "from-cyan-500 to-cyan-600",
      bgColor: "bg-cyan-500"
    }
  ];
};

export const ModernRatingsDisplay = ({ 
  overallScore, 
  profileImage, 
  breakdown = [], 
  onSave, 
  onShare,
  isOnboarding = false
}: ModernRatingsDisplayProps) => {
  const ratings = mapAIDataToCategories(overallScore, breakdown);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-sm mx-auto bg-black/40 backdrop-blur-xl rounded-3xl p-6 border border-white/10"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Ratings</h2>
        
        {/* Profile Picture */}
        <div className="w-48 h-64 mx-auto rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
            <CachedImage
              src={profileImage}
              blurHash={null}
              width={480}
              alt="Analyzed outfit"
              fit="contain"
              variant="hero"
              className="w-full h-full"
            />
        </div>
      </div>

      {/* Ratings Grid - 2x3 layout */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {ratings.map((rating, index) => (
          <motion.div
            key={rating.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className="text-center"
          >
            {/* Category Label */}
            <div className="text-white/70 text-sm font-medium mb-2">
              {rating.label}
            </div>
            
            {/* Large Score Number */}
            <div className="text-3xl font-bold text-white mb-3">
              {Math.round(rating.value)}
            </div>
            
            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, rating.value)}%` }}
                transition={{ delay: index * 0.1 + 0.5, duration: 1 }}
                className={`h-full bg-gradient-to-r ${rating.color} rounded-full`}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}; 
