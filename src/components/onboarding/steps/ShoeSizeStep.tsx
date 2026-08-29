import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ShoeSizeStepProps {
  onNext: (size: string) => void;
}

const shoeSizes = Array.from({ length: 21 }, (_, i) => {
  const size = 5 + i * 0.5;
  return size.toString();
});

export const ShoeSizeStep = ({ onNext }: ShoeSizeStepProps) => {
  const [selectedSize, setSelectedSize] = useState<string>("");
  const handleNext = () => {
    if (selectedSize) onNext(selectedSize);
  };
  return (
    <motion.div key="shoe-size" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.6, ease: "easeOut" }} className="h-full flex flex-col">
      <div className="flex-1 flex flex-col justify-center items-center px-8 py-12">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-8">
          <div className="w-10 h-10 bg-gray-600 rounded-lg"></div>
        </motion.div>
        <div className="space-y-4 text-center mb-8">
          <h2 className="text-4xl font-bold text-white">What's your shoe size?</h2>
          <p className="text-white/70 text-xl">US sizing</p>
        </div>
        <div className="w-full max-w-sm mb-8">
          <Select value={selectedSize} onValueChange={setSelectedSize}>
            <SelectTrigger className="w-full h-16 text-lg bg-white/10 border-2 border-white/20 text-white rounded-2xl backdrop-blur-sm">
              <SelectValue placeholder="Select your size" />
            </SelectTrigger>
            <SelectContent className="bg-black/90 border-white/20 text-white">
              {shoeSizes.map((size) => (
                <SelectItem key={size} value={size} className="text-white hover:bg-white/10">
                  US {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="px-8 pb-8">
        <Button onClick={handleNext} disabled={!selectedSize} className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 h-16 text-lg font-bold rounded-2xl transition-all duration-300 hover:scale-105 shadow-2xl disabled:opacity-50 disabled:hover:scale-100">Next</Button>
      </div>
    </motion.div>
  );
}; 