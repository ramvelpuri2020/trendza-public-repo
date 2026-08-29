import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

interface StyleArchetypeStepProps {
  gender: string | null;
  onNext: (archetypes: string[]) => void;
  onBack: () => void;
}

interface Archetype {
  slug: string;
  label: string;
  imagePath: string;
}

const FEMALE_ARCHETYPES: Archetype[] = [
  { slug: "cleangirl", label: "Clean Girl", imagePath: "/onboarding-images/female_images/cleangirl_female_image.jpg" },
  { slug: "coquette", label: "Coquette", imagePath: "/onboarding-images/female_images/coquette_female_image.jpg" },
  { slug: "cottagecore", label: "Cottagecore", imagePath: "/onboarding-images/female_images/cottagecore_female_image.jpg" },
  { slug: "oldmoney", label: "Old Money", imagePath: "/onboarding-images/female_images/oldmoney_female_image.jpg" },
  { slug: "oversized", label: "Oversized", imagePath: "/onboarding-images/female_images/oversized_female_image.jpg" },
  { slug: "quietluxury", label: "Quiet Luxury", imagePath: "/onboarding-images/female_images/quietluxury_female_image.jpg" },
  { slug: "streetwear", label: "Streetwear", imagePath: "/onboarding-images/female_images/streetwear_female_image.jpg" },
  { slug: "y2k", label: "Y2K", imagePath: "/onboarding-images/female_images/y2k_female_image.jpg" },
];

const MALE_ARCHETYPES: Archetype[] = [
  { slug: "classic", label: "Classic", imagePath: "/onboarding-images/male_images/classic_male_image.jpg" },
  { slug: "darkacademia", label: "Dark Academia", imagePath: "/onboarding-images/male_images/darkacademia_male_image.jpg" },
  { slug: "minimal", label: "Minimal", imagePath: "/onboarding-images/male_images/minimal_male_image.jpg" },
  { slug: "oldmoney", label: "Old Money", imagePath: "/onboarding-images/male_images/oldmoney_male_image.jpg" },
  { slug: "sporty", label: "Sporty", imagePath: "/onboarding-images/male_images/sporty_male_image.jpg" },
  { slug: "streetwear", label: "Streetwear", imagePath: "/onboarding-images/male_images/streetwear_male_image.jpg" },
  { slug: "tailored", label: "Tailored", imagePath: "/onboarding-images/male_images/tailored_male_image.jpg" },
];

export const StyleArchetypeStep = ({ gender, onNext, onBack }: StyleArchetypeStepProps) => {
  const [selected, setSelected] = useState<string[]>([]);

  const archetypes = useMemo(() => {
    if (gender === "female") return FEMALE_ARCHETYPES;
    if (gender === "male") return MALE_ARCHETYPES;
    // Non-binary / prefer-not-to-say: show all
    return [...FEMALE_ARCHETYPES, ...MALE_ARCHETYPES];
  }, [gender]);

  const toggle = (slug: string) => {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
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

        <div className="flex-1 flex justify-start ml-3">
          <div className="w-full max-w-[280px] h-[3px] bg-gray-200 rounded-full relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "16%" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
              className="absolute left-0 top-0 h-full bg-black rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Title + subtitle */}
      <div className="px-6 mt-4">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-[28px] font-bold text-black"
        >
          Which styles speak to you?
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 0.7, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-[16px] text-black opacity-70 mt-2 leading-relaxed"
        >
          Pick as many as you like — this shapes everything we show you.
        </motion.p>
      </div>

      {/* Archetype grid */}
      <div className="flex-1 overflow-y-auto px-6 mt-6">
        <div className="grid grid-cols-2 gap-3 pb-4">
          {archetypes.map((arch, index) => {
            const isSelected = selected.includes(arch.slug);
            return (
              <motion.button
                key={`${arch.slug}-${arch.imagePath}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                whileTap={{ scale: 0.97 }}
                onClick={() => toggle(arch.slug)}
                className="relative rounded-2xl overflow-hidden border-2 transition-all duration-200"
                style={{ borderColor: isSelected ? "#000" : "#E5E7EB" }}
              >
                {/* Photo */}
                <div className="aspect-[3/4] bg-gray-100">
                  <img
                    src={arch.imagePath}
                    alt={arch.label}
                    className="w-full h-full object-cover"

                  />
                </div>

                {/* Checkmark badge */}
                <div
                  className={`absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isSelected ? "bg-black scale-100" : "bg-white/80 scale-90"
                  }`}
                  style={{ boxShadow: isSelected ? "0 1px 3px rgba(0,0,0,0.2)" : "0 1px 2px rgba(0,0,0,0.1)" }}
                >
                  {isSelected && (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* Label */}
                <div className="px-3 py-2.5 bg-white">
                  <p className={`text-sm font-semibold ${isSelected ? "text-black" : "text-gray-800"}`}>
                    {arch.label}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Next button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="px-6 pb-safe-button"
      >
        <motion.button
          disabled={selected.length === 0}
          whileTap={selected.length > 0 ? { scale: 0.98 } : {}}
          onClick={() => onNext(selected)}
          className={`w-full h-[56px] rounded-2xl text-[17px] font-semibold transition-all duration-200 ${
            selected.length > 0
              ? "bg-black text-white hover:bg-gray-900"
              : "bg-gray-300 text-white cursor-not-allowed"
          }`}
        >
          {selected.length > 0 ? `Next (${selected.length} selected)` : "Next"}
        </motion.button>
      </motion.div>
    </motion.div>
  );
};
