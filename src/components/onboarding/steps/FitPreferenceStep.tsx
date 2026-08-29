import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Ruler, Shirt, Zap } from "lucide-react";

interface FitPreferenceStepProps {
  onSelect: (fit: string) => void;
}

const fitOptions = [
  { id: 'loose', label: 'Loose', icon: Shirt, description: 'Relaxed and comfortable' },
  { id: 'regular', label: 'Regular', icon: Ruler, description: 'Classic standard fit' },
  { id: 'tight', label: 'Tight', icon: Zap, description: 'Form-hugging and snug' }
];

export const FitPreferenceStep = ({ onSelect }: FitPreferenceStepProps) => (
  <motion.div key="fit-preference" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.6, ease: "easeOut" }} className="h-full flex flex-col">
    <div className="flex-1 flex flex-col justify-center items-center px-8 py-12">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-8">
        <Ruler className="w-10 h-10 text-gray-600" />
      </motion.div>
      <div className="space-y-4 text-center">
        <h2 className="text-4xl font-bold text-gray-900">Loose, regular, or tight?</h2>
        <p className="text-gray-600 text-xl">What's your preferred fit?</p>
      </div>
    </div>
    <div className="space-y-4 px-8 pb-8">
      {fitOptions.map((option, index) => (
        <motion.div key={option.id} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.15, duration: 0.5 }}>
          <Button onClick={() => onSelect(option.id)} className="w-full h-20 bg-white border-2 border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-gray-300 hover:scale-105 transition-all duration-300 rounded-2xl flex items-center justify-start p-6 text-left">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mr-4">
              <option.icon className="w-6 h-6 text-gray-600" />
            </div>
            <div className="text-left">
              <div className="font-bold text-xl">{option.label}</div>
              <div className="text-gray-600 text-base">{option.description}</div>
            </div>
          </Button>
        </motion.div>
      ))}
    </div>
  </motion.div>
); 