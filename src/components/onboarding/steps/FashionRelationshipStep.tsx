import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

interface FashionRelationshipStepProps {
  onNext: (slug: string) => void;
  onBack: () => void;
}

const OPTIONS = [
  { label: "I love it — I know exactly what I like", slug: "expert" },
  { label: "I'm decent — I shop regularly and have a sense of my style", slug: "intermediate" },
  { label: "It's okay — I shop when I need to, not my favorite thing", slug: "casual" },
  { label: "I need real help — I struggle putting outfits together", slug: "struggling" },
];

export const FashionRelationshipStep = ({ onNext, onBack }: FashionRelationshipStepProps) => {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const tappedRef = useRef(false);

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

        <div className="flex-1 flex justify-start ml-3">
          <div className="w-full max-w-[280px] h-[3px] bg-gray-200 rounded-full relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "36%" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
              className="absolute left-0 top-0 h-full bg-black rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Title — no subhead needed per spec */}
      <div className="px-6 mt-4">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-[28px] font-bold text-black"
        >
          How would you describe your relationship with fashion?
        </motion.h1>
      </div>

      {/* Options — auto-advance on tap */}
      <div className="px-6 mt-10 space-y-3 flex-1">
        {OPTIONS.map((opt, index) => {
          const isActive = selectedSlug === opt.slug;
          return (
            <motion.button
              key={opt.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.15 + index * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (tappedRef.current) return;
                tappedRef.current = true;
                setSelectedSlug(opt.slug);
                setTimeout(() => onNext(opt.slug), 180);
              }}
              className={`w-full min-h-[58px] rounded-2xl text-[16px] font-medium leading-snug text-left px-5 transition-all duration-200 ${
                isActive
                  ? "bg-black text-white"
                  : "bg-[#F7F7FB] text-black hover:bg-gray-100"
              }`}
            >
              {opt.label}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};
