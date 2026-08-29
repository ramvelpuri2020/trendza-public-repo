import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

interface GenderSelectionStepProps {
  onNext: (gender: string) => void;
  onBack: () => void;
}

export const GenderSelectionStep = ({ onNext, onBack }: GenderSelectionStepProps) => {
  const [selectedGender, setSelectedGender] = useState<string | null>(null);

  const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "-100%" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="screen-safe app-content bg-white flex flex-col h-full"
    >
      {/* Header (MUCH LOWER like screenshot) */}
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

        {/* Progress bar - fully extended (but not hitting border) */}
        <div className="flex-1 flex justify-start ml-3">
          <div className="w-full max-w-[280px] h-[3px] bg-gray-200 rounded-full relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "8%" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
              className="absolute left-0 top-0 h-full bg-black rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Title + subtitle */}
      <div className="px-6 mt-4">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-[28px] font-bold text-black"
        >
          Choose your Gender
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 0.7, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-[16px] text-black opacity-70 mt-2 leading-relaxed"
        >
          This will be used to calibrate your custom plan.
        </motion.p>
      </div>

      {/* Gender buttons - tap-to-advance, no separate Next button */}
      <div className="px-6 mt-12 space-y-5 flex-1">
        {GENDERS.map((g, index) => (
          <motion.button
            key={g}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.2 + index * 0.1,
              ease: [0.16, 1, 0.3, 1]
            }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setSelectedGender(g);
              // Auto-advance on selection — single unambiguous choice
              setTimeout(() => onNext(g), 150);
            }}
            className={`w-full h-[58px] rounded-2xl text-[17px] font-semibold transition-all duration-200 
              ${selectedGender === g ? "bg-black text-white" : "bg-[#F7F7FB] text-black hover:bg-gray-100"}`}
          >
            {g}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};
