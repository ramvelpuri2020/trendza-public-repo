import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Heart, Zap, Briefcase, User } from "lucide-react";

interface MainGoalStepProps {
  onSelect: (goal: string) => void;
}

const goalOptions = [
  { id: 'comfort', label: 'Comfort', icon: Heart, description: 'Prioritize comfort and ease' },
  { id: 'trend-setting', label: 'Trend-setting', icon: Zap, description: 'Stay ahead of fashion trends' },
  { id: 'professional', label: 'Professional', icon: Briefcase, description: 'Look polished for work' },
  { id: 'athletic', label: 'Athletic', icon: User, description: 'Focus on active lifestyle' }
];

export const MainGoalStep = ({ onSelect }: MainGoalStepProps) => (
  <motion.div key="main-goal" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.6, ease: "easeOut" }} className="h-full flex flex-col">
    <div className="flex-1 flex flex-col justify-center items-center px-8 py-12">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-8">
        <div className="w-10 h-10 bg-gray-600 rounded-lg"></div>
      </motion.div>
      <div className="space-y-4 text-center">
        <h2 className="text-headline-lg font-headline-bold text-gray-900">What is your style goal?</h2>
        <p className="text-gray-600 text-body-lg font-interface">Choose your primary focus</p>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4 px-8 pb-8">
      {goalOptions.map((option, index) => (
        <motion.div key={option.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1, duration: 0.4 }}>
          <Button onClick={() => onSelect(option.id)} className="w-full h-20 bg-white border-2 border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-gray-300 hover:scale-105 transition-all duration-300 rounded-2xl flex flex-col items-center justify-center gap-2 p-4">
            <option.icon className="w-6 h-6" />
            <div className="text-center">
              <div className="font-bold text-lg">{option.label}</div>
              <div className="text-gray-600 text-sm">{option.description}</div>
            </div>
          </Button>
        </motion.div>
      ))}
    </div>
  </motion.div>
); 