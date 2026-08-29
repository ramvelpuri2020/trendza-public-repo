import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface WardrobeSeedStepProps {
  gender: string | null;
  archetypes: string[];
  userId: string;
  onNext: (seededItems: string[]) => void;
  onBack: () => void;
}

interface WardrobeItem {
  filename: string;
  title: string;
  category: string;
  color: string;
  imagePath: string;
}

const FEMALE_ITEMS: WardrobeItem[] = [
  { filename: "baggy-cargo-pants-olive.png", title: "Baggy Cargo Pants", category: "bottoms", color: "olive", imagePath: "/onboarding-images/wardrobe/female/baggy-cargo-pants-olive.png" },
  { filename: "black-formal-heels.png", title: "Black Formal Heels", category: "shoes", color: "black", imagePath: "/onboarding-images/wardrobe/female/black-formal-heels.png" },
  { filename: "fitted-blazer-navy.png", title: "Fitted Blazer", category: "jackets", color: "navy", imagePath: "/onboarding-images/wardrobe/female/fitted-blazer-navy.png" },
  { filename: "fitted-buttonup-white.png", title: "Fitted Button-Up", category: "tops", color: "white", imagePath: "/onboarding-images/wardrobe/female/fitted-buttonup-white.png" },
  { filename: "fitted-dress-black.png", title: "Fitted Dress", category: "dresses", color: "black", imagePath: "/onboarding-images/wardrobe/female/fitted-dress-black.png" },
  { filename: "oversized-hoodie-pink.png", title: "Oversized Hoodie", category: "outerwear", color: "pink", imagePath: "/onboarding-images/wardrobe/female/oversized-hoodie-pink.png" },
  { filename: "oversized-tshirt-cream.png", title: "Oversized T-Shirt", category: "tops", color: "cream", imagePath: "/onboarding-images/wardrobe/female/oversized-tshirt-cream.png" },
  { filename: "skinny-jeans-black.png", title: "Skinny Jeans", category: "bottoms", color: "black", imagePath: "/onboarding-images/wardrobe/female/skinny-jeans-black.png" },
  { filename: "slim-fit-jeans-blue.png", title: "Slim Fit Jeans", category: "bottoms", color: "blue", imagePath: "/onboarding-images/wardrobe/female/slim-fit-jeans-blue.png" },
  { filename: "white-sneakers.png", title: "White Sneakers", category: "shoes", color: "white", imagePath: "/onboarding-images/wardrobe/female/white-sneakers.png" },
];

const MALE_ITEMS: WardrobeItem[] = [
  { filename: "baggy-cargo-pants-khaki.png", title: "Baggy Cargo Pants", category: "bottoms", color: "khaki", imagePath: "/onboarding-images/wardrobe/male/baggy-cargo-pants-khaki.png" },
  { filename: "black-formal-shoes.png", title: "Black Formal Shoes", category: "shoes", color: "black", imagePath: "/onboarding-images/wardrobe/male/black-formal-shoes.png" },
  { filename: "fitted-bomber-jacket-black.png", title: "Fitted Bomber Jacket", category: "jackets", color: "black", imagePath: "/onboarding-images/wardrobe/male/fitted-bomber-jacket-black.png" },
  { filename: "fitted-polo-red.png", title: "Fitted Polo", category: "tops", color: "red", imagePath: "/onboarding-images/wardrobe/male/fitted-polo-red.png" },
  { filename: "oversized-hoodie-gray.png", title: "Oversized Hoodie", category: "outerwear", color: "gray", imagePath: "/onboarding-images/wardrobe/male/oversized-hoodie-gray.png" },
  { filename: "oversized-tshirt-white.png", title: "Oversized T-Shirt", category: "tops", color: "white", imagePath: "/onboarding-images/wardrobe/male/oversized-tshirt-white.png" },
  { filename: "regular-fit-buttonup-blue.png", title: "Regular Fit Button-Up", category: "tops", color: "blue", imagePath: "/onboarding-images/wardrobe/male/regular-fit-buttonup-blue.png" },
  { filename: "skinny-jeans-black.png", title: "Skinny Jeans", category: "bottoms", color: "black", imagePath: "/onboarding-images/wardrobe/male/skinny-jeans-black.png" },
  { filename: "slim-fit-jeans.png", title: "Slim Fit Jeans", category: "bottoms", color: "blue", imagePath: "/onboarding-images/wardrobe/male/slim-fit-jeans.png" },
  { filename: "white-sneakers.png", title: "White Sneakers", category: "shoes", color: "white", imagePath: "/onboarding-images/wardrobe/male/white-sneakers.png" },
];

// Archetype → keyword matching for sort prioritization
const ARCHETYPE_KEYWORDS: Record<string, string[]> = {
  streetwear: ["baggy-cargo", "oversized-hoodie", "oversized-tshirt", "sneakers"],
  oldmoney: ["fitted-blazer", "fitted-buttonup", "formal", "regular-fit-buttonup", "blazer"],
  tailored: ["fitted-blazer", "fitted-buttonup", "formal", "regular-fit-buttonup", "blazer"],
  quietluxury: ["fitted-blazer", "fitted-buttonup", "formal", "regular-fit-buttonup", "blazer"],
  classic: ["fitted-blazer", "fitted-buttonup", "formal", "regular-fit-buttonup", "blazer"],
};

function formatSlug(slug: string): string {
  return slug
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const WardrobeSeedStep = ({
  gender,
  archetypes,
  userId,
  onNext,
  onBack,
}: WardrobeSeedStepProps) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const items = useMemo(() => {
    let baseItems: WardrobeItem[];
    if (gender === "female") baseItems = [...FEMALE_ITEMS];
    else if (gender === "male") baseItems = [...MALE_ITEMS];
    else baseItems = [...FEMALE_ITEMS, ...MALE_ITEMS];

    // Sort: items matching selected archetypes come first
    const matchingKeywords = new Set<string>();
    archetypes.forEach((a) => {
      const keywords = ARCHETYPE_KEYWORDS[a];
      if (keywords) keywords.forEach((k) => matchingKeywords.add(k));
    });

    if (matchingKeywords.size > 0) {
      baseItems.sort((a, b) => {
        const aMatch = [...matchingKeywords].some((kw) =>
          a.filename.toLowerCase().includes(kw)
        );
        const bMatch = [...matchingKeywords].some((kw) =>
          b.filename.toLowerCase().includes(kw)
        );
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        return 0;
      });
    }

    return baseItems;
  }, [gender, archetypes]);

  const toggle = (filename: string) => {
    setSelected((prev) =>
      prev.includes(filename) ? prev.filter((f) => f !== filename) : [...prev, filename]
    );
  };

  const handleNext = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setError("");

    try {
      if (selected.length > 0) {
        const rows = selected.map((filename) => {
          const item = items.find((i) => i.filename === filename)!;
          return {
            user_id: userId,
            title: item.title,
            category: item.category,
            color: item.color,
            source_image_url: item.imagePath,
            tags: [],
            attributes: {},
          };
        });

        const { error: insertError } = await supabase
          .from("trendza_closet_items")
          .insert(rows);

        if (insertError) throw insertError;
      }

      onNext(selected.map((f) => f.replace(".png", "")));
    } catch (err: any) {
      setError(err.message || "Failed to save items. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    onNext([]);
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
              animate={{ width: "54%" }}
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
          Add a few pieces to start
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 0.7, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-[16px] text-black opacity-70 mt-2 leading-relaxed"
        >
          Trendza is way more fun once your closet isn't empty. Tap to add.
        </motion.p>
      </div>

      {/* Item grid */}
      <div className="flex-1 overflow-y-auto px-6 mt-6">
        <div className="grid grid-cols-2 gap-3 pb-4">
          {items.map((item, index) => {
            const isSelected = selected.includes(item.filename);
            return (
              <motion.button
                key={item.filename}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + index * 0.04, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                whileTap={{ scale: 0.97 }}
                onClick={() => toggle(item.filename)}
                className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
                  isSelected ? "border-black" : "border-gray-200"
                }`}
              >
                {/* Image */}
                <div className="aspect-square bg-gray-50">
                  <img
                    src={item.imagePath}
                    alt={item.title}
                    className="w-full h-full object-contain p-3"
                    draggable={false}
                  />
                </div>

                {/* Checkmark badge */}
                <div
                  className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isSelected ? "bg-black scale-100" : "bg-white/80 scale-90"
                  }`}
                  style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }}
                >
                  {isSelected && (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* Label */}
                <div className="px-3 py-2.5 bg-white">
                  <p className={`text-xs font-semibold truncate ${isSelected ? "text-black" : "text-gray-800"}`}>
                    {item.title}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="px-6 text-red-500 text-sm text-center pb-2">{error}</p>
      )}

      {/* Bottom: Skip or Next */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="px-6 pb-safe-button"
      >
        {selected.length > 0 ? (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleNext}
            disabled={isSaving}
            className="w-full h-[56px] rounded-2xl text-[17px] font-semibold bg-black text-white hover:bg-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              `Next (${selected.length} selected)`
            )}
          </motion.button>
        ) : (
          <button
            onClick={handleSkip}
            className="w-full text-center text-sm text-gray-400 underline hover:text-gray-600 transition-colors py-4"
          >
            Skip
          </button>
        )}
      </motion.div>
    </motion.div>
  );
};
