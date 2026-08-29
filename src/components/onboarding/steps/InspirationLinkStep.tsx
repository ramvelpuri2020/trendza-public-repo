import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface InspirationLinkStepProps {
  onNext: (inspiration: string) => void;
}

export const InspirationLinkStep = ({ onNext }: InspirationLinkStepProps) => {
  const [inspiration, setInspiration] = useState<string>("");
  const handleNext = () => {
    onNext(inspiration);
  };
  return (
    <motion.div key="inspiration-link" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.6, ease: "easeOut" }} className="h-full flex flex-col">
      <div className="flex-1 flex flex-col justify-center items-center px-8 py-12">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="text-7xl mb-8">💡</motion.div>
        <div className="space-y-4 text-center mb-8">
          <h2 className="text-4xl font-bold text-white">Show us your style inspo</h2>
          <p className="text-white/70 text-xl">Share a link or describe your inspiration</p>
        </div>
        <div className="w-full max-w-md mb-8">
          <Input type="text" placeholder="Instagram profile, Pinterest board, or describe..." value={inspiration} onChange={(e) => setInspiration(e.target.value)} className="w-full h-16 text-lg bg-white/10 border-2 border-white/20 text-white placeholder:text-white/50 rounded-2xl backdrop-blur-sm px-6" />
        </div>
        <div className="text-center">
          <p className="text-white/50 text-sm">Optional - you can skip this step</p>
        </div>
      </div>
      <div className="px-8 pb-8">
        <Button onClick={handleNext} className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 h-16 text-lg font-bold rounded-2xl transition-all duration-300 hover:scale-105 shadow-2xl">{inspiration.trim() ? 'Next' : 'Skip'}</Button>
      </div>
    </motion.div>
  );
}; 