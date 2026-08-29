import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { CalendarClock, Calendar, CalendarDays, X } from "lucide-react";

interface ShoppingFrequencyNewStepProps {
  onNext: (frequency: string) => void;
  onBack: () => void;
}

const SHOPPING_FREQUENCIES = [
  {
    id: "monthly",
    text: "Monthly or more",
    icon: CalendarClock
  },
  {
    id: "few-months",
    text: "Every few months",
    icon: Calendar
  },
  {
    id: "rarely",
    text: "Rarely, only when needed",
    icon: CalendarDays
  },
  {
    id: "trying-to-stop",
    text: "Trying to stop buying",
    icon: X
  }
];

export const ShoppingFrequencyNewStep = ({ onNext, onBack }: ShoppingFrequencyNewStepProps) => {
  const [selectedFrequency, setSelectedFrequency] = useState<string | null>(null);

  const handleContinue = () => {
    if (selectedFrequency) {
      const selectedFrequencyData = SHOPPING_FREQUENCIES.find(f => f.id === selectedFrequency);
      onNext(selectedFrequencyData?.text || selectedFrequency);
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
              animate={{ width: "60%" }}
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
          How often do you buy clothes?
        </motion.h1>
      </div>

      {/* Options - moved way down with more spacing between each */}
      <div className="px-6 mt-12 space-y-5">
        {SHOPPING_FREQUENCIES.map((frequency, index) => {
          const IconComponent = frequency.icon;
          return (
            <motion.button
              key={frequency.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.2 + index * 0.1,
                ease: [0.16, 1, 0.3, 1]
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedFrequency(frequency.id)}
              className={`w-full h-[58px] rounded-2xl text-[17px] font-semibold transition-all duration-200 flex items-center gap-4 px-4
                ${selectedFrequency === frequency.id ? "bg-black text-white" : "bg-[#F7F7FB] text-black hover:bg-gray-100"}`}
            >
              <IconComponent size={20} strokeWidth={2} />
              <span className="flex-1 text-left">{frequency.text}</span>
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
          disabled={!selectedFrequency}
          whileTap={selectedFrequency ? { scale: 0.98 } : {}}
          onClick={handleContinue}
          className={`w-full h-[56px] rounded-2xl text-[17px] font-semibold transition-all duration-200 
            ${selectedFrequency ? "bg-black text-white hover:bg-gray-900" : "bg-gray-300 text-white cursor-not-allowed"}`}
        >
          Continue
        </motion.button>
      </motion.div>
    </motion.div>
  );
};
