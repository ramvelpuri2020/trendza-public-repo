import { useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Lightbulb } from "lucide-react";
import { OnboardingLayout } from "../OnboardingLayout";

interface FullResultsStepProps {
  userImage: string;
  analysisResult: any;
  onNext: () => void;
}

export const FullResultsStep = ({ userImage, analysisResult, onNext }: FullResultsStepProps) => {
  // Auto-advance after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onNext();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onNext]);

  const handleSaveGrade = () => {
    // Save the grade (could add to database here)
    onNext();
  };

  return (
    <OnboardingLayout
      currentStep={8}
      totalSteps={10}
      showProgress={false}
    >
      <div className="flex-1 overflow-y-auto">
        {/* User's image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <img
            src={userImage}
            alt="Your outfit"
            className="w-64 h-80 object-cover rounded-2xl mx-auto shadow-lg"
          />
        </motion.div>

        {/* Overall Score Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white mb-4">
            <div className="text-center">
              <div className="text-3xl font-bold">{analysisResult.overall_score}</div>
              <div className="text-sm opacity-80">/10</div>
            </div>
          </div>
          <div className="text-2xl">🔥</div>
        </motion.div>

        {/* Score Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          <div className="card text-center">
            <div className="text-2xl mb-2">💪</div>
            <div className="text-subheading mb-1">Fit</div>
            <div className="text-heading text-purple-400">{analysisResult.fit_score}</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl mb-2">🎨</div>
            <div className="text-subheading mb-1">Color</div>
            <div className="text-heading text-purple-400">{analysisResult.color_score}</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl mb-2">✨</div>
            <div className="text-subheading mb-1">Style</div>
            <div className="text-heading text-purple-400">{analysisResult.style_score}</div>
          </div>
        </motion.div>

        {/* What's Working */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={20} className="text-green-500" />
            <h3 className="text-subheading text-green-500">What's Working</h3>
          </div>
          <div className="space-y-2">
            {analysisResult.whats_working?.map((point: string, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                className="flex items-start gap-2"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                <span className="text-body">{point}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* What to Improve */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={20} className="text-yellow-500" />
            <h3 className="text-subheading text-yellow-500">What to Improve</h3>
          </div>
          <div className="space-y-2">
            {analysisResult.what_to_improve?.map((point: string, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.9 + index * 0.1 }}
                className="flex items-start gap-2"
              >
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                <span className="text-body">{point}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
          className="mb-4"
        >
          <button
            onClick={handleSaveGrade}
            className="btn-primary w-full"
          >
            Save This Grade
          </button>
        </motion.div>

        {/* Continue hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.2 }}
          className="text-caption text-center"
        >
          Continue to unlock your closet manager →
        </motion.p>
      </div>
    </OnboardingLayout>
  );
};
