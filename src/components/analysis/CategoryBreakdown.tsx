
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { ScoreBreakdown } from "@/types/styleTypes";

interface CategoryBreakdownProps {
  categories: ScoreBreakdown[];
}

export const CategoryBreakdown = ({ categories }: CategoryBreakdownProps) => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategory = (category: string) => {
    if (expandedCategories.includes(category)) {
      setExpandedCategories(expandedCategories.filter(c => c !== category));
    } else {
      setExpandedCategories([...expandedCategories, category]);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "from-green-400 to-emerald-500";
    if (score >= 6) return "from-yellow-400 to-amber-500";
    return "from-red-400 to-rose-500";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {categories.map((category, index) => (
        <motion.div
          key={category.category}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + (index * 0.1) }}
        >
          <div className="bg-black/20 border border-white/10 rounded-lg overflow-hidden">
            <div 
              className="p-4 cursor-pointer" 
              onClick={() => toggleCategory(category.category)}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {category.emoji && <span className="text-xl">{category.emoji}</span>}
                  <span className="font-medium text-white">{category.category}</span>
                </div>
                <ChevronDown 
                  className={`w-5 h-5 text-white/60 transition-transform ${
                    expandedCategories.includes(category.category) ? 'rotate-180' : ''
                  }`} 
                />
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-2xl font-bold text-white">{category.score}</span>
                  <span className="text-sm text-white/60">out of 10</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(category.score / 10) * 100}%` }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className={`h-full bg-gradient-to-r ${getScoreColor(category.score)}`}
                  />
                </div>
              </div>
            </div>
            
            {expandedCategories.includes(category.category) && category.details && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="px-4 pb-4"
              >
                <p className="text-sm text-white/70">{category.details}</p>
              </motion.div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};
