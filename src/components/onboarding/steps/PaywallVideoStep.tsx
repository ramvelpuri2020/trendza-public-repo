import { motion } from "framer-motion";

interface PaywallVideoStepProps {
  onNext: () => void;
}

export const PaywallVideoStep = ({ onNext }: PaywallVideoStepProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "-100%" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="screen-safe app-content bg-white flex flex-col h-full"
    >
      <div className="flex-1 flex flex-col items-center px-6 pt-12">
        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-[26px] font-bold text-black text-center leading-tight"
        >
          We want you to try{" "}
          <span className="text-black">Trendza Pro</span> for free
        </motion.h1>

        {/* Phone frame with video — slides in from right with spring */}
        <motion.div
          initial={{ x: "100%", opacity: 0.8 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "-100%", opacity: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.15 }}
          className="relative w-full max-w-[260px] mt-8 mb-6 select-none"
        >
          <div className="relative overflow-hidden rounded-[40px] bg-black p-2.5 shadow-2xl">
            <div className="bg-black rounded-[32px] overflow-hidden relative" style={{ aspectRatio: "852 / 1844" }}>
              <video
                id="paywall-video"
                src="/onboarding-images/paywall/paywall-video.mp4"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                disablePictureInPicture
                className="w-full h-full object-cover"
                draggable={false}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              />
              {/* Hide any native play button overlay that iOS may show */}
              <style>{`
                video#paywall-video::-webkit-media-controls-start-playback-button {
                  display: none !important;
                  -webkit-appearance: none;
                }
                video#paywall-video::-webkit-media-controls {
                  display: none !important;
                }
              `}</style>
            </div>
          </div>
        </motion.div>

        {/* Checkmark row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex items-center gap-2 mb-6"
        >
          <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-[15px] text-black font-medium">No Payment Due Now</span>
        </motion.div>
      </div>

      {/* Bottom section — CTA + fine print */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="px-6 pb-safe-button"
      >
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onNext}
          className="w-full h-[56px] rounded-2xl text-[17px] font-semibold bg-black text-white hover:bg-gray-900 transition-all duration-200"
        >
          Next
        </motion.button>

        <p className="text-center text-sm text-gray-400 mt-3">Your first week is on us.</p>

        <div className="flex items-center justify-center gap-4 mt-4">
          <button className="text-xs text-gray-400 underline hover:text-gray-600 transition-colors">
            Restore purchase
          </button>
          <button className="text-xs text-gray-400 underline hover:text-gray-600 transition-colors">
            Terms of service
          </button>
          <button className="text-xs text-gray-400 underline hover:text-gray-600 transition-colors">
            Privacy policy
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
