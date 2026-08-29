import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Logger } from "@/utils/logger";
import { useToast } from "@/hooks/use-toast";

interface WelcomeHeroStepProps {
  onNext: () => void;
  onUserCreated?: (userId: string) => void;
}

const SCREENS = [
  {
    title: "Keep every piece you own in one place",
    image: "/onboarding-images/welcome/screenshot-wardrobe.png",
  },
  {
    title: "Get a new outfit generated for you, instantly",
    image: "/onboarding-images/welcome/screenshot-shuffle.png",
  },
  {
    title: "See it on you before you wear it",
    image: "/onboarding-images/welcome/screenshot-tryon.png",
  },
];

export const WelcomeHeroStep = ({ onNext, onUserCreated }: WelcomeHeroStepProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [[currentScreen, direction], setPage] = useState([0, 0]);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  // ── Auto-scroll ──────────────────────────────────────────────
  const resetAutoScroll = useCallback(() => {
    if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    autoScrollRef.current = setInterval(() => {
      setPage(([prev]) => [(prev + 1) % SCREENS.length, 1]);
    }, 3000);
  }, []);

  useEffect(() => {
    resetAutoScroll();
    return () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    };
  }, [resetAutoScroll]);

  // ── Navigation ───────────────────────────────────────────────
  const goToSlide = (index: number) => {
    const dir = index > currentScreen ? 1 : -1;
    setPage([index, dir]);
    resetAutoScroll();
  };

  const paginate = (newDirection: number) => {
    const next = (currentScreen + newDirection + SCREENS.length) % SCREENS.length;
    setPage([next, newDirection]);
    resetAutoScroll();
  };

  // ── Drag handler ─────────────────────────────────────────────
  const handleDragEnd = (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    const threshold = 60;
    if (info.offset.x < -threshold || (info.offset.x < 0 && info.velocity.x < -200)) {
      paginate(1); // swipe left → next
    } else if (info.offset.x > threshold || (info.offset.x > 0 && info.velocity.x > 200)) {
      paginate(-1); // swipe right → previous
    }
  };

  // ── Auth handler ─────────────────────────────────────────────
  const handleGetStarted = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        Logger.info('WelcomeHero', 'User already exists:', session.user.id);
        onUserCreated?.(session.user.id);
        onNext();
        return;
      }

      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;

      if (data.user) {
        Logger.info('WelcomeHero', 'Anonymous user created:', data.user.id);
        onUserCreated?.(data.user.id);
        await new Promise(resolve => setTimeout(resolve, 100));
        onNext();
      }
    } catch (error) {
      Logger.error('WelcomeHero', 'Error creating user:', error);
      toast({
        title: "Error",
        description: "Failed to get started. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Variants for slide animation ─────────────────────────────
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0.9,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0.9,
    }),
  };

  return (
    <div className="screen-safe app-content bg-white flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center px-6 pt-8 pb-safe-button select-none"
      >
        {/* App Title */}
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold text-black mb-6 text-center"
        >
          trendza
        </motion.h1>

        {/* Phone Frame with Carousel */}
        {/*
          Image dimensions: 852 x 1844 → aspect ratio ~0.462
          Max phone frame width is ~250px → height = 250 / 0.462 ≈ 541px
          We use aspect-ratio CSS to auto-size the frame perfectly.
        */}
        <div className="relative w-full max-w-[260px] mb-4" style={{ aspectRatio: '852 / 1844' }}>
          {/* Phone Bezel */}
          <div className="absolute inset-0 rounded-[44px] bg-black p-[4px] shadow-2xl">
            <div className="w-full h-full rounded-[40px] overflow-hidden bg-white relative">
              {/* Carousel Track */}
              <div className="w-full h-full overflow-hidden relative">
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                  <motion.div
                    key={currentScreen}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.3}
                    onDragEnd={handleDragEnd}
                    className="absolute inset-0 cursor-grab active:cursor-grabbing"
                    style={{
                      WebkitTransform: 'translateZ(0)',
                      transform: 'translateZ(0)',
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                    }}
                  >
                    <img
                      src={SCREENS[currentScreen].image}
                      alt={SCREENS[currentScreen].title}
                      className="w-full h-full object-cover pointer-events-none"
                      draggable={false}
                      loading="eager"
                      fetchpriority="high"
                      style={{
                        imageRendering: '-webkit-optimize-contrast',
                        WebkitTransform: 'translate3d(0, 0, 0)',
                        transform: 'translate3d(0, 0, 0)',
                      }}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Caption */}
        <AnimatePresence mode="wait">
          <motion.p
            key={currentScreen}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-black text-center text-base font-medium mb-3 px-4"
          >
            {SCREENS[currentScreen].title}
          </motion.p>
        </AnimatePresence>

        {/* Pagination Dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {SCREENS.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentScreen === index ? "bg-black w-6" : "bg-gray-300 w-2"
              }`}
              aria-label={`Go to screen ${index + 1}`}
            />
          ))}
        </div>

        {/* Join for Free */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          onClick={handleGetStarted}
          disabled={isProcessing}
          className="w-full max-w-sm bg-black text-white font-semibold py-4 px-8 rounded-2xl text-lg transition-all duration-200 hover:bg-gray-900 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span>Joining...</span>
            </div>
          ) : (
            "Join for free"
          )}
        </motion.button>
      </div>
    </div>
  );
};
