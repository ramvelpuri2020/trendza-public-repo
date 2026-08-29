import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Sparkles, Briefcase, Star, ShoppingBag } from "lucide-react";

interface StyleGoalStepProps {
  onNext: (goal: string) => void;
  onBack: () => void;
}

const STYLE_GOALS = [
  {
    id: "complement-beauty",
    text: "To learn how to complement my natural beauty",
    icon: Sparkles
  },
  {
    id: "dress-success",
    text: "To dress for success",
    icon: Briefcase
  },
  {
    id: "stand-out",
    text: "To stand out from the crowd",
    icon: Star
  },
  {
    id: "shop-smart",
    text: "To shop smart and buy less",
    icon: ShoppingBag
  }
];

export const StyleGoalStep = ({ onNext, onBack }: StyleGoalStepProps) => {
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  const handleContinue = () => {
    if (selectedGoal) {
      const selectedGoalData = STYLE_GOALS.find(g => g.id === selectedGoal);
      onNext(selectedGoalData?.text || selectedGoal);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "-100%" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="screen-safe app-content bg-white flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center px-6 pt-14 pb-2">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft size={18} strokeWidth={2.4} />
        </motion.button>

        {/* Progress bar */}
        <div className="flex-1 flex justify-start ml-3">
          <div className="w-full max-w-[280px] h-[3px] bg-gray-200 rounded-full relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "36%" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
              className="absolute left-0 top-0 h-full bg-black rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="px-6 mt-4">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-[28px] font-bold text-black"
        >
          What's your main style goal?
        </motion.h1>
      </div>

      {/* Goal options - tightened from mt-12 to mt-12 so the 4 rows don't
          push the title far away and the Continue button stays anchored
          above the home indicator. */}
      <div className="px-6 mt-12 space-y-5">
        {STYLE_GOALS.map((goal, index) => {
          const IconComponent = goal.icon;
          return (
            <motion.button
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.2 + index * 0.1,
                ease: [0.16, 1, 0.3, 1]
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedGoal(goal.id)}
              className={`w-full h-[58px] rounded-2xl text-[17px] font-semibold transition-all duration-200 flex items-center gap-4 px-4
                ${selectedGoal === goal.id ? "bg-black text-white" : "bg-[#F7F7FB] text-black hover:bg-gray-100"}`}
            >
              <IconComponent size={20} strokeWidth={2} />
              <span className="flex-1 text-left">{goal.text}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Continue button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mt-auto px-6 pb-safe-button"
      >
        <motion.button
          disabled={!selectedGoal}
          whileTap={selectedGoal ? { scale: 0.98 } : {}}
          onClick={handleContinue}
          className={`w-full h-[56px] rounded-2xl text-[17px] font-semibold transition-all duration-200 
            ${selectedGoal ? "bg-black text-white hover:bg-gray-900" : "bg-gray-300 text-white cursor-not-allowed"}`}
        >
          Continue
        </motion.button>
      </motion.div>
    </motion.div>
  );
};
