import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { OnboardingLayout } from "../OnboardingLayout";

interface AnalysisLoadingNewStepProps {
  userImage: string;
  onComplete: (analysisResult: any) => void;
}

const LOADING_STEPS = [
  { text: "Evaluating fit & proportions...", progress: 35 },
  { text: "Analyzing style cohesion...", progress: 70 },
  { text: "Generating personalized tips...", progress: 95 }
];

export const AnalysisLoadingNewStep = ({ userImage, onComplete }: AnalysisLoadingNewStepProps) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < LOADING_STEPS.length - 1) {
          const nextStep = prev + 1;
          setProgress(LOADING_STEPS[nextStep].progress);
          return nextStep;
        }
        return prev;
      });
    }, 2000);

    // Complete analysis after all steps
    const completeTimer = setTimeout(() => {
      // Generate fake analysis result
      const fakeAnalysis = generateFakeAnalysis();
      onComplete(fakeAnalysis);
    }, 6500);

    return () => {
      clearInterval(timer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const generateFakeAnalysis = () => {
    const baseScore = Math.floor(Math.random() * 15) + 75; // 75-90 base
    const variance = 10;
    
    return {
      overall_score: Math.min(100, baseScore + Math.floor(Math.random() * variance)),
      fit_score: Math.min(100, baseScore + Math.floor(Math.random() * variance)),
      color_score: Math.min(100, baseScore + Math.floor(Math.random() * variance) - 3),
      style_score: Math.min(100, baseScore + Math.floor(Math.random() * variance) - 5),
      whats_working: [
        "Color coordination is excellent",
        "Proportions are balanced",
        "Great attention to detail"
      ],
      what_to_improve: [
        "Consider slimmer fit for jacket",
        "Swap sneakers for dress shoes",
        "Try a different belt style"
      ],
      tips: [
        "This color palette works great for your style",
        "Try tucking the shirt for a more polished look",
        "Consider adding a statement accessory"
      ]
    };
  };

  return (
    <OnboardingLayout
      currentStep={7}
      totalSteps={10}
      showProgress={false}
    >
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {/* User's image with blur effect */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="relative">
            <img
              src={userImage}
              alt="Your outfit"
              className="w-48 h-64 object-cover rounded-2xl filter blur-sm"
            />
            <div className="absolute inset-0 bg-white/10 rounded-2xl" />
          </div>
        </motion.div>

        {/* Animated spinner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <div className="w-16 h-16 border-4 border-gray-600 border-t-purple-600 rounded-full animate-spin mx-auto mb-6" />
        </motion.div>

        {/* Progress text */}
        <motion.div
          key={currentStepIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="mb-4"
        >
          <p className="text-body text-center">
            {LOADING_STEPS[currentStepIndex]?.text}
          </p>
          <p className="text-heading text-purple-400 mt-2">
            {LOADING_STEPS[currentStepIndex]?.progress}%
          </p>
        </motion.div>

        {/* Progress bar */}
        <div className="w-full max-w-xs">
          <div className="progress-bar">
            <motion.div 
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
};
