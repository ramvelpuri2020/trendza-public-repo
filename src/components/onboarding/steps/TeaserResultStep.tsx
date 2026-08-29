import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

interface TeaserResultStepProps {
  onUnlock: () => void;
  result: {
    overallScore: number;
    breakdown: any[];
    grade?: string;
    summary?: string;
  };
  userImage?: string | undefined;
}

export const TeaserResultStep = ({ onUnlock, userImage }: TeaserResultStepProps) => {
  const features = [
    { label: "Overall", icon: "🎯" },
    { label: "Potential", icon: "👁️" },
    { label: "Drip", icon: "👱" },
    { label: "Aura", icon: "🧴" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="min-h-screen bg-black flex flex-col px-5 pt-6 pb-5"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="w-3 h-3" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-center mb-6"
      >
        <h1 className="text-white text-2xl font-semibold">Your Outfit Score</h1>
        <p className="text-gray-400 text-sm mt-1">Unlock to find ur score</p>
      </motion.div>

      {/* Image */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="flex justify-center mb-6"
      >
        <div className="w-56 h-56 rounded-2xl overflow-hidden bg-gray-100">
          {userImage?.trim() ? (
            <img src={userImage} alt="Your photo" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-200" />
          )}
        </div>
      </motion.div>

      {/* Feature grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {features.map(({ label, icon }, index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
            className="relative rounded-2xl p-4 bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700"
          >
            <div className="absolute right-3 top-3 text-gray-400">
              <Lock className="w-4 h-4" />
            </div>
            <div className="flex flex-col items-start space-y-2">
              <div className="text-2xl" aria-hidden>
                {icon}
              </div>
              <div>
                <p className="text-white text-sm font-medium">{label}</p>
                <div className="mt-1 h-1.5 w-14 rounded-full bg-gray-600" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Primary CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.5 }}
        className="mt-8 space-y-3"
      >
        <Button
          onClick={onUnlock}
          className="w-full h-14 rounded-full bg-red-500 hover:bg-red-600 text-white text-base font-semibold transition-all duration-300 hover:scale-105"
        >
          Unlock ur style analysis →
        </Button>
      </motion.div>
    </motion.div>
  );
};
