import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

interface HeightStepProps {
  onNext: (height: string) => void;
  onBack: () => void;
}

export const HeightStep = ({ onNext, onBack }: HeightStepProps) => {
  const [height, setHeight] = useState<string>("");
  const [unit, setUnit] = useState<"cm" | "ft">("cm");

  const handleContinue = () => {
    if (height.trim()) {
      onNext(`${height} ${unit}`);
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
              animate={{ width: "25%" }}
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
          Your height
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 0.7, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-[16px] text-black opacity-70 mt-2 leading-relaxed"
        >
          This helps us recommend outfits that fit your proportions.
        </motion.p>
      </div>

      {/* Input field - Moved higher for better even spacing */}
      <div className="px-6 mt-12">
        <div className="flex items-center gap-3">
          <input
            type="text"
            inputMode="decimal"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder={unit === "cm" ? "170" : "5'8\""}
            // Reinforced the input border (border-2 + border-gray-400) so it
            // reads as an actual input on grayish backgrounds. Was border
            // border-gray-200 which blended into the bg-[#F7F7FB] surface.
            className="flex-1 h-[58px] bg-white border-2 border-gray-400 rounded-2xl px-6 text-[17px] font-semibold text-black placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setUnit("cm")}
              className={`h-[58px] px-4 rounded-2xl text-[17px] font-semibold transition-all duration-200
                ${unit === "cm" ? "bg-black text-white" : "bg-[#F7F7FB] text-black hover:bg-gray-100"}`}
            >
              cm
            </button>
            <button
              onClick={() => setUnit("ft")}
              className={`h-[58px] px-4 rounded-2xl text-[17px] font-semibold transition-all duration-200
                ${unit === "ft" ? "bg-black text-white" : "bg-[#F7F7FB] text-black hover:bg-gray-100"}`}
            >
              ft
            </button>
          </div>
        </div>
      </div>

      {/* Continue button — uses pb-safe-button so the input/Keyboard open
          path doesn't shove the button under the iOS home indicator. */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mt-auto px-6 pb-safe-button"
      >
        <motion.button
          disabled={!height.trim()}
          whileTap={height.trim() ? { scale: 0.98 } : {}}
          onClick={handleContinue}
          className={`w-full h-[56px] rounded-2xl text-[17px] font-semibold transition-all duration-200 
            ${height.trim() ? "bg-black text-white hover:bg-gray-900" : "bg-gray-300 text-white cursor-not-allowed"}`}
        >
          Continue
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

