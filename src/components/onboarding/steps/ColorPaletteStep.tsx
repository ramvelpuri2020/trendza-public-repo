import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface ColorPaletteStepProps {
  onNext: (colors: string[]) => void;
}

const colorPalettes = [
  { id: 'earth', label: 'Earth Tones', colors: ['#8B4513', '#D2691E', '#A0522D'] },
  { id: 'monochrome', label: 'Monochrome', colors: ['#000000', '#808080', '#FFFFFF'] },
  { id: 'pastels', label: 'Pastels', colors: ['#FFB6C1', '#AFEEEE', '#DDA0DD'] },
  { id: 'jewel', label: 'Jewel Tones', colors: ['#800080', '#008080', '#FFD700'] },
  { id: 'neon', label: 'Neon Brights', colors: ['#FF1493', '#00FF00', '#00BFFF'] },
  { id: 'autumn', label: 'Autumn', colors: ['#FF8C00', '#DC143C', '#B22222'] },
  { id: 'ocean', label: 'Ocean Blues', colors: ['#000080', '#4169E1', '#87CEEB'] },
  { id: 'forest', label: 'Forest Greens', colors: ['#006400', '#228B22', '#90EE90'] }
];

export const ColorPaletteStep = ({ onNext }: ColorPaletteStepProps) => {
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const toggleColor = (colorId: string) => {
    setSelectedColors(prev => prev.includes(colorId) ? prev.filter(id => id !== colorId) : prev.length < 3 ? [...prev, colorId] : prev);
  };
  const handleNext = () => {
    if (selectedColors.length > 0) onNext(selectedColors);
  };
  return (
    <motion.div key="color-palette" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.6, ease: "easeOut" }} className="h-full flex flex-col">
      <div className="flex-1 flex flex-col justify-center items-center px-8 py-12">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-8">
          <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-blue-500 rounded-lg"></div>
        </motion.div>
        <div className="space-y-4 text-center mb-8">
          <h2 className="text-4xl font-bold text-white">Pick your top 3 color palettes</h2>
          <p className="text-white/70 text-xl">Choose up to 3 that speak to you</p>
        </div>
        <div className="grid grid-cols-2 gap-4 w-full max-w-lg mb-8">
          {colorPalettes.map((palette, index) => (
            <motion.div key={palette.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.1, duration: 0.4 }}>
              <Button onClick={() => toggleColor(palette.id)} disabled={!selectedColors.includes(palette.id) && selectedColors.length >= 3} className={`w-full h-24 p-3 border-2 transition-all duration-300 rounded-2xl backdrop-blur-sm flex flex-col items-center justify-center gap-2 ${selectedColors.includes(palette.id) ? 'border-orange-500 scale-105 bg-orange-500/20' : 'border-white/20 hover:border-white/40 hover:scale-105 bg-white/10'} ${!selectedColors.includes(palette.id) && selectedColors.length >= 3 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <div className="flex gap-1">{palette.colors.map((color, i) => (<div key={i} className="w-4 h-4 rounded-full border border-white/30" style={{ backgroundColor: color }} />))}</div>
                <span className="text-sm font-medium text-white">{palette.label}</span>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
      <div className="px-8 pb-8">
        <Button onClick={handleNext} disabled={selectedColors.length === 0} className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 h-16 text-lg font-bold rounded-2xl transition-all duration-300 hover:scale-105 shadow-2xl disabled:opacity-50 disabled:hover:scale-100">Next ({selectedColors.length}/3 selected)</Button>
      </div>
    </motion.div>
  );
}; 