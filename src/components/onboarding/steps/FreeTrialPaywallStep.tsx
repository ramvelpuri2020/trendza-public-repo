import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface FreeTrialPaywallStepProps {
  onComplete: (tier: string) => void;
}

export const FreeTrialPaywallStep = ({ onComplete }: FreeTrialPaywallStepProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

  const images = [
    {
      id: 1,
      src: "/lovable-uploads/outfitgrader-ai-1.png",
      alt: "OutfitGrader AI Fits"
    },
    {
      id: 2,
      src: "/lovable-uploads/outfitgrader-ai-2.png",
      alt: "My Closet"
    },
    {
      id: 3,
      src: "/lovable-uploads/outfitgrader-ai-3.png",
      alt: "Outfit Display"
    }
  ];

  // Auto-scroll functionality - slides every 3 seconds
  useEffect(() => {
    const startAutoScroll = () => {
      autoScrollRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
      }, 3000); // Change every 3 seconds
    };

    startAutoScroll();

    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    };
  }, [images.length]);

  // Scroll to current image
  useEffect(() => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const imageWidth = container.scrollWidth / images.length;
      container.scrollTo({
        left: currentIndex * imageWidth,
        behavior: 'smooth'
      });
    }
  }, [currentIndex, images.length]);

  const handleTryFree = () => {
    // Trigger free trial subscription
    onComplete('free_trial');
  };

  return (
    // screen-safe gives 100dvh + safe-area env variables so the
    // "Continue for FREE" button sits above the iOS home indicator.
    // Replaces `min-h-screen` which clipped the CTA on iPhone 14 Pro / 15 Pro.
    <div className="screen-safe app-content bg-white flex flex-col h-full">
      <div className="flex-1 flex flex-col px-6 pt-14 pb-safe-button">
        {/* Main Heading - Removed bell, compact spacing */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-[28px] font-bold text-black text-center mb-2 leading-tight"
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter, sans-serif' }}
        >
          We'll send you a reminder before your free trial ends.
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center text-sm text-gray-500 mb-6"
        >
          Enjoy trendza now. We&apos;ll notify you before any billing starts so you can cancel anytime.
        </motion.p>

        {/* Sliding Image Carousel - Smaller, compact */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6 mx-auto max-w-[240px]"
        >
          <div
            ref={scrollRef}
            className="flex overflow-x-hidden scroll-smooth"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {images.map((image) => (
              <div
                key={image.id}
                className="w-full flex-shrink-0"
                style={{ scrollSnapAlign: 'start' }}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-auto max-h-[400px] object-contain rounded-2xl"
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Small spacer for better spacing */}
        <div className="h-8" />

        {/* No Payment Due */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex items-center justify-center gap-2 mb-4"
        >
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <Check size={14} className="text-white" strokeWidth={3} />
          </div>
          <span className="text-black font-medium text-sm">No Payment Due Now</span>
        </motion.div>

        {/* CTA Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          onClick={handleTryFree}
          className="w-full bg-black text-white font-semibold py-4 px-8 rounded-2xl text-lg transition-all duration-200 hover:bg-gray-900 active:scale-98"
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter, sans-serif' }}
        >
          Continue for FREE
        </motion.button>
      </div>
    </div>
  );
};

