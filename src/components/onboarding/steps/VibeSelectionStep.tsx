import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Heart, Star, Crown } from "lucide-react";
import { useState, useEffect } from "react";

interface VibeSelectionStepProps {
  onSelect: (vibe: string) => void;
}

const styleOptions = [
  {
    id: "minimalist",
    name: "Minimalist",
    emoji: "",
    description: "Clean, simple, and timeless",
    icon: Sparkles
  },
  {
    id: "classic",
    name: "Classic",
    emoji: "",
    description: "Sophisticated and refined",
    icon: Crown
  },
  {
    id: "creative",
    name: "Creative",
    emoji: "",
    description: "Bold, artistic, and unique",
    icon: Star
  },
  {
    id: "sporty",
    name: "Sporty",
    emoji: "",
    description: "Active, comfortable, and dynamic",
    icon: Heart
  }
];

export const VibeSelectionStep = ({ onSelect }: VibeSelectionStepProps) => {
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);

  // Auto-proceed when style is selected
  useEffect(() => {
    if (selectedStyle) {
      // Small delay for visual feedback before proceeding
      const timer = setTimeout(() => {
        console.log(`🎯 Auto-proceeding with style: ${selectedStyle}`);
        onSelect(selectedStyle);
      }, 800); // 800ms delay for visual feedback
      
      return () => clearTimeout(timer);
    }
  }, [selectedStyle, onSelect]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 px-6 py-8 flex flex-col"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="w-28 h-28 bg-gradient-to-r from-gray-800 to-gray-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
          <Sparkles className="w-14 h-14 text-white" />
        </div>
        
        <h1 className="text-4xl font-black text-white mb-4 tracking-tight">
          What's Your Style Vibe?
        </h1>
        
        <p className="text-gray-300 text-lg max-w-md mx-auto leading-relaxed">
          Help us understand your style preferences for better analysis
        </p>
      </motion.div>

      {/* Style Options */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="flex-1 space-y-4 mb-8"
      >
        {styleOptions.map((style, index) => (
          <motion.div
            key={style.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
            className={`relative cursor-pointer transition-all duration-300 ${
              selectedStyle === style.id 
                ? 'scale-105 shadow-2xl' 
                : 'hover:scale-102'
            }`}
            onClick={() => setSelectedStyle(style.id)}
          >
            <div className={`
              p-6 rounded-2xl border-2 transition-all duration-300
              ${selectedStyle === style.id
                ? 'border-red-500 bg-gradient-to-r from-red-500/10 to-red-600/10 shadow-red-500/20'
                : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
              }
            `}>
              <div className="flex items-center space-x-4">
                <div className="text-3xl">{style.emoji}</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">
                    {style.name}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {style.description}
                  </p>
                </div>
                {selectedStyle === style.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                  >
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Auto-proceed indicator */}
      {selectedStyle && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="text-gray-400 text-sm flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2 h-2 bg-red-500 rounded-full mr-2"
            />
            Proceeding to next step...
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}; 