import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Capacitor } from '@capacitor/core';
import { Logger } from "@/utils/logger";

interface ColorAnalysisIntroStepProps {
  onCapture: (imageFile: File) => void;
  onBack: () => void;
}

export const ColorAnalysisIntroStep = ({ onCapture, onBack }: ColorAnalysisIntroStepProps) => {
  const [isCapturing, setIsCapturing] = useState(false);

  const handleContinue = async () => {
    setIsCapturing(true);
    
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'placeholder.jpg', { type: 'image/jpeg' });
        onCapture(file);
      }
    });
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
              animate={{ width: "83%" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
              className="absolute left-0 top-0 h-full bg-black rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Content - centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12"
        >
          <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="50" r="28" fill="black"/>
            <path d="M 100 78 L 100 130" stroke="black" strokeWidth="3" strokeLinecap="round"/>
            <path d="M 100 95 L 70 110" stroke="black" strokeWidth="3" strokeLinecap="round"/>
            <path d="M 100 95 L 130 105" stroke="black" strokeWidth="3" strokeLinecap="round"/>
            <rect x="125" y="100" width="25" height="40" rx="4" fill="black"/>
            <rect x="128" y="103" width="19" height="30" rx="2" fill="white"/>
            <circle cx="155" cy="105" r="2.5" fill="black"/>
            <circle cx="160" cy="115" r="2" fill="black"/>
            <circle cx="152" cy="120" r="1.5" fill="black"/>
            <path d="M 100 130 L 85 165" stroke="black" strokeWidth="3" strokeLinecap="round"/>
            <path d="M 100 130 L 115 165" stroke="black" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        </motion.div>

        {/* Text content */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-center w-full"
        >
          <h1 className="text-[28px] font-bold text-black mb-3 leading-tight">
            Let's analyze your style profile
          </h1>
          <p className="text-[16px] text-black opacity-70 leading-relaxed">
            Take a quick selfie so we can personalize your experience
          </p>
        </motion.div>
      </div>

      {/* Continue button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="px-6 pb-safe-button"
      >
        <motion.button
          onClick={handleContinue}
          disabled={isCapturing}
          whileTap={!isCapturing ? { scale: 0.98 } : {}}
          className="w-full h-[56px] rounded-2xl text-[17px] font-semibold transition-all duration-200 bg-black text-white hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCapturing ? "Opening camera..." : "Continue"}
        </motion.button>
      </motion.div>
    </motion.div>
  );
};
