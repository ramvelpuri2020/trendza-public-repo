import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface BrandAffinityStepProps {
  onNext: (brands: string[]) => void;
}

const brandOptions = [
  { id: 'nike', label: 'Nike', emoji: '✅' },
  { id: 'adidas', label: 'Adidas', emoji: '⚡' },
  { id: 'supreme', label: 'Supreme', emoji: '🔥' },
  { id: 'gucci', label: 'Gucci', emoji: '👑' },
  { id: 'zara', label: 'Zara', emoji: '🏷️' },
  { id: 'uniqlo', label: 'Uniqlo', emoji: '📦' },
  { id: 'hm', label: 'H&M', emoji: '💫' },
  { id: 'levis', label: "Levi's", emoji: '👖' }
];

export const BrandAffinityStep = ({ onNext }: BrandAffinityStepProps) => {
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const toggleBrand = (brandId: string) => {
    setSelectedBrands(prev => prev.includes(brandId) ? prev.filter(id => id !== brandId) : [...prev, brandId]);
  };
  const handleNext = () => {
    onNext(selectedBrands);
  };
  return (
    <motion.div key="brand-affinity" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.6, ease: "easeOut" }} className="h-full flex flex-col">
      <div className="flex-1 flex flex-col justify-center items-center px-8 py-12">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="text-7xl mb-8">🏪</motion.div>
        <div className="space-y-4 text-center mb-8">
          <h2 className="text-4xl font-bold text-white">Which brands do you like?</h2>
          <p className="text-white/70 text-xl">Select all that apply (or skip)</p>
        </div>
        <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-8">
          {brandOptions.map((brand, index) => (
            <motion.div key={brand.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.1, duration: 0.4 }}>
              <Button onClick={() => toggleBrand(brand.id)} className={`w-full h-16 text-lg font-bold border-2 transition-all duration-300 rounded-2xl backdrop-blur-sm flex items-center justify-center gap-3 ${selectedBrands.includes(brand.id) ? 'bg-gradient-to-r from-orange-500/50 to-orange-400/50 border-orange-500 text-white scale-105' : 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40 hover:scale-105'}`}>
                <span className="text-xl">{brand.emoji}</span>
                {brand.label}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
      <div className="px-8 pb-8">
        <Button onClick={handleNext} className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 h-16 text-lg font-bold rounded-2xl transition-all duration-300 hover:scale-105 shadow-2xl">{selectedBrands.length > 0 ? `Next (${selectedBrands.length} selected)` : 'Skip'}</Button>
      </div>
    </motion.div>
  );
}; 