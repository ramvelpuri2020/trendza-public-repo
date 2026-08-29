import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { ProgressIndicator } from "./ProgressIndicator";

interface OnboardingLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  showProgress?: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
  className?: string;
}

export const OnboardingLayout = ({
  children,
  currentStep,
  totalSteps,
  showProgress = true,
  showBackButton = false,
  onBack,
  className = ""
}: OnboardingLayoutProps) => {
  return (
    // `screen-safe` is defined in index.css and applies min-height:100dvh + env(safe-area-inset-top/bottom/left/right).
    // `h-full` constrains the container to the parent height so the
    // Continue button (mt-auto) stays within the viewport on simulators.
    // The legacy `container-mobile` was `min-height: 100vh` (overshoots the
    // dynamic-island/home-indicator regions) and lacked safe-area padding,
    // which is exactly why the Continue button was getting clipped on
    // iPhone 14 Pro / 15 Pro. `flex flex-col` is preserved so future step
    // children can still flex-push their footer above the safe area.
    <div className={`screen-safe app-content flex flex-col h-full ${className}`}>
      {/* Header with back button only - no progress indicator */}
      {/* IMPORTANT: do NOT also apply pt-status-safe here. `.screen-safe`
          already sets `padding-top: env(safe-area-inset-top)` on the
          wrapper; adding a second safe-area-padding class on the inner
          header doubled the inset to ~94px on Dynamic Island iPhones. */}
      <div className="flex items-center justify-between mb-8">
        {showBackButton ? (
          <button 
            onClick={onBack}
            className="back-button"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
        ) : (
          <div className="w-10" /> // Spacer
        )}
        
        <div className="flex-1" />
      </div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex-1 flex flex-col"
      >
        {children}
      </motion.div>
    </div>
  );
};
