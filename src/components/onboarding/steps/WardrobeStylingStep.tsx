import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

interface WardrobeStylingStepProps {
  onNext: (answer: string) => void;
  onBack: () => void;
}

const WARDROBE_ANSWERS = [
  "Yes, I need help styling them",
  "No, I style everything I own"
];

export const WardrobeStylingStep = ({ onNext, onBack }: WardrobeStylingStepProps) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

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
              animate={{ width: "75%" }}
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
          Do you have clothes in your wardrobe that you don't know how to style?
        </motion.h1>
      </div>

      {/* Options */}
      <div className="px-6 mt-12 space-y-5">
        {WARDROBE_ANSWERS.map((answer, index) => (
          <motion.button
            key={answer}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.2 + index * 0.1,
              ease: [0.16, 1, 0.3, 1]
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedAnswer(answer)}
            className={`w-full h-[58px] rounded-2xl text-[17px] font-semibold transition-all duration-200 
              ${selectedAnswer === answer ? "bg-black text-white" : "bg-[#F7F7FB] text-black hover:bg-gray-100"}`}
          >
            {answer}
          </motion.button>
        ))}
      </div>

      {/* Continue button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mt-auto px-6 pb-safe-button"
      >
        <motion.button
          disabled={!selectedAnswer}
          whileTap={selectedAnswer ? { scale: 0.98 } : {}}
          onClick={() => {
            if (selectedAnswer) {
              onNext(selectedAnswer);
            }
          }}
          className={`w-full h-[56px] rounded-2xl text-[17px] font-semibold transition-all duration-200 
            ${selectedAnswer ? "bg-black text-white hover:bg-gray-900" : "bg-gray-300 text-white cursor-not-allowed"}`}
        >
          Continue
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

