import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { OccasionOption, OccasionType } from "@/types/outfitTypes";

interface OccasionSelectorProps {
  occasions: OccasionOption[];
  onSelect: (occasion: OccasionType) => void;
  closetItemCount: number;
}

export const OccasionSelector = ({ occasions, onSelect, closetItemCount }: OccasionSelectorProps) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="text-6xl mb-4"
        >
          ✨
        </motion.div>
        <h2 className="text-headline-sm font-headline-bold text-white">What's the occasion?</h2>
        <p className="text-white/70 font-interface max-w-md mx-auto">
          Tell me where you're going, and I'll create the perfect outfit from your {closetItemCount} closet items
        </p>
      </motion.div>

      {/* Occasion Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {occasions.map((occasion, index) => (
          <motion.div
            key={occasion.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className="bg-[#1A1F2C]/80 backdrop-blur-lg border-[#403E43] hover:border-[#9b87f5]/50 transition-all duration-300 cursor-pointer group overflow-hidden"
              onClick={() => onSelect(occasion.id)}
            >
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Icon */}
                  <div className="text-center">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.2 }}
                      className="text-4xl mb-2"
                    >
                      {occasion.emoji}
                    </motion.div>
                    <h3 className="text-white font-semibold text-lg group-hover:text-[#9b87f5] transition-colors">
                      {occasion.label}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-white/60 text-sm text-center leading-relaxed">
                    {occasion.description}
                  </p>

                  {/* Examples */}
                  <div className="space-y-2">
                    <p className="text-white/40 text-xs text-center font-medium">Perfect for:</p>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {occasion.examples.slice(0, 2).map(example => (
                        <Badge 
                          key={example}
                          variant="secondary" 
                          className="bg-[#9b87f5]/10 text-[#9b87f5] border-[#9b87f5]/20 text-xs px-2 py-0"
                        >
                          {example}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Hover Effect */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button
                      size="sm"
                      className="w-full bg-gradient-to-r from-[#9b87f5] to-[#b192ef] hover:from-[#8a77e0] hover:to-[#9e82da] text-white border-none"
                    >
                      Generate Outfits
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex justify-center"
      >
        <Card className="bg-gradient-to-r from-[#9b87f5]/10 to-[#b192ef]/10 border-[#9b87f5]/30 backdrop-blur-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-center">
              <Sparkles className="w-5 h-5 text-[#9b87f5]" />
              <div className="text-sm">
                <span className="text-white font-medium">Ready to create outfits from </span>
                <span className="text-[#9b87f5] font-bold">{closetItemCount} items</span>
                <span className="text-white font-medium"> in your closet</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
