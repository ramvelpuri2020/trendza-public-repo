import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CategoryFilter, ClothingCategory } from "@/types/closetTypes";

interface CategoryFiltersProps {
  categories: CategoryFilter[];
  selectedCategory: ClothingCategory | 'all';
  onCategoryChange: (category: ClothingCategory | 'all') => void;
  itemCounts?: Record<ClothingCategory, number>;
}

export const CategoryFilters = ({ 
  categories, 
  selectedCategory, 
  onCategoryChange,
  itemCounts = {}
}: CategoryFiltersProps) => {
  return (
    <ScrollArea className="w-full">
      <div className="flex gap-2 pb-2">
        {categories.map((category, index) => {
          const isSelected = selectedCategory === category.category;
          const count = category.category === 'all' 
            ? Object.values(itemCounts).reduce((sum, count) => sum + count, 0)
            : itemCounts[category.category as ClothingCategory] || 0;

          return (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Button
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => onCategoryChange(category.category)}
                className={`
                  flex items-center gap-2 whitespace-nowrap transition-all duration-300
                  ${isSelected 
                    ? 'bg-gradient-to-r from-[#9b87f5] to-[#b192ef] hover:from-[#8a77e0] hover:to-[#9e82da] text-white border-none shadow-lg' 
                    : 'bg-[#1A1F2C]/80 border-[#403E43] text-white/70 hover:text-white hover:border-[#9b87f5]/50 hover:bg-[#9b87f5]/10'
                  }
                `}
              >
                <span className="text-base">{category.emoji}</span>
                <span className="font-medium">{category.label}</span>
                {count > 0 && (
                  <Badge 
                    variant="secondary" 
                    className={`
                      ml-1 px-1.5 py-0 text-xs font-semibold
                      ${isSelected 
                        ? 'bg-white/20 text-white' 
                        : 'bg-[#9b87f5]/20 text-[#9b87f5]'
                      }
                    `}
                  >
                    {count}
                  </Badge>
                )}
              </Button>
            </motion.div>
          );
        })}
      </div>
    </ScrollArea>
  );
};
