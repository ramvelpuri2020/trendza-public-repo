import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Camera, TrendingUp, Crown, ArrowLeft } from "lucide-react";

interface HowItWorksStepProps {
  onNext: () => void;
  onBack: () => void;
}

const steps = [
  {
    title: "Scan your outfit",
    description: "Snap a quick photo and I'll analyze your style.",
    icon: Camera,
    color: "from-gray-700 to-gray-800"
  },
  {
    title: "Generate your style report",
    description: "After the analysis, I'll generate a custom style report for you.",
    icon: TrendingUp,
    color: "from-gray-600 to-gray-700"
  },
  {
    title: "Get your style plan",
    description: "I'll find the style tips and recommendations that suit you best.",
    icon: Crown,
    color: "from-gray-800 to-gray-900"
  }
];

export const HowItWorksStep = ({ onNext, onBack }: HowItWorksStepProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 px-6 py-8"
    >
      {/* Header */}
      <div className="flex items-center mb-8">
        <button
          onClick={onBack}
          className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mr-4"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-2xl font-bold text-white">How it works?</h1>
      </div>

      {/* Steps */}
      <div className="space-y-6 mb-8">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.2, duration: 0.5 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                <step.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold text-lg mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="mt-auto"
      >
        <Button
          onClick={onNext}
          className="w-full bg-red-500 hover:bg-red-600 text-white h-14 text-lg font-semibold rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg"
        >
          Next →
        </Button>
      </motion.div>
    </motion.div>
  );
}; 