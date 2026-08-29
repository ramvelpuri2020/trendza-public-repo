import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PartyPopper, Sparkles, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface CelebrationNewStepProps {
  onNext: () => void;
}

export const CelebrationNewStep = ({ onNext }: CelebrationNewStepProps) => {
  const [showConfetti, setShowConfetti] = useState(false);
  useEffect(() => {
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <motion.div key="celebration" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.6, ease: "easeOut" }} className="h-full flex flex-col relative overflow-hidden">
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div key={i} initial={{ y: -20, x: Math.random() * window.innerWidth, rotate: 0 }} animate={{ y: window.innerHeight + 20, rotate: 360, opacity: [1, 1, 0] }} transition={{ duration: 3, delay: Math.random() * 2, ease: "linear" }} className="absolute">
              <Sparkles className="w-6 h-6 text-gray-400" />
            </motion.div>
          ))}
        </div>
      )}
      <div className="flex-1 flex flex-col justify-center items-center px-8 py-12">
        <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="mb-8">
          <CheckCircle className="w-24 h-24 text-green-500 mx-auto" />
        </motion.div>
        <div className="text-center space-y-6">
          <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-5xl font-bold text-gray-900 leading-tight">You're all set!</motion.h2>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="max-w-md mx-auto text-xl text-gray-600">Ready to unlock your style potential with trendza Pro?</motion.p>
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1 }} className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
            <Sparkles className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-900 font-medium">Unlimited style analyses • Premium features • Personal recommendations</p>
          </motion.div>
        </div>
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }} className="px-8 pb-8">
        <Button onClick={onNext} className="w-full bg-black hover:bg-gray-800 h-16 text-xl font-bold rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg">Continue</Button>
      </motion.div>
    </motion.div>
  );
}; 