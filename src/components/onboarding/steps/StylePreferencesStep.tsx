import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shirt, GraduationCap, Briefcase, Sneakers, Clock, Zap } from "lucide-react";

interface StylePreferencesStepProps {
  onNext: (preferences: string[]) => void;
}

const styleOptions = [
  { id: 'casual', label: 'Casual', icon: Shirt },
  { id: 'street', label: 'Street', icon: GraduationCap },
  { id: 'formal', label: 'Formal', icon: Briefcase },
  { id: 'sporty', label: 'Sporty', icon: Sneakers },
  { id: 'vintage', label: 'Vintage', icon: Clock },
  { id: 'futuristic', label: 'Futuristic', icon: Zap }
];

export const StylePreferencesStep = ({ onNext }: StylePreferencesStepProps) => {
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const toggleStyle = (styleId: string) => {
    setSelectedStyles(prev => prev.includes(styleId) ? prev.filter(id => id !== styleId) : [...prev, styleId]);
  };
  const handleNext = () => {
    if (selectedStyles.length > 0) onNext(selectedStyles);
  };
  return (
    <motion.div key="style-preferences" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.6, ease: "easeOut" }} className="h-full flex flex-col">
      <div className="flex-1 flex flex-col justify-center items-center px-8 py-12">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-8">
          <Shirt className="w-10 h-10 text-gray-600" />
        </motion.div>
        <div className="space-y-4 text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-900">Which styles do you love?</h2>
          <p className="text-gray-600 text-xl">Select all that apply</p>
        </div>
        <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-8">
          {styleOptions.map((style, index) => (
            <motion.div key={style.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.1, duration: 0.4 }}>
              <Button onClick={() => toggleStyle(style.id)} className={`w-full h-20 text-lg font-bold border-2 transition-all duration-300 rounded-2xl flex flex-col items-center justify-center gap-2 ${selectedStyles.includes(style.id) ? 'bg-black border-black text-white scale-105' : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-gray-300 hover:scale-105'}`}>
                <style.icon className="w-6 h-6" />
                <span className="text-sm">{style.label}</span>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
      <div className="px-8 pb-8">
        <Button onClick={handleNext} disabled={selectedStyles.length === 0} className="w-full bg-black hover:bg-gray-800 h-16 text-lg font-bold rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:hover:scale-100">Next ({selectedStyles.length} selected)</Button>
      </div>
    </motion.div>
  );
}; 