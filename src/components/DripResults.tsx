import { Share2, Save, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { motion } from "framer-motion";
import { ScrollArea } from "./ui/scroll-area";
import { useState } from "react";
import { ScoreBreakdown } from "@/types/styleTypes";
import { CachedImage } from "./ui/CachedImage";

interface StyleTip {
  category: string;
  tips: string[];
}

interface DripResultsProps {
  totalScore: number;
  breakdown: ScoreBreakdown[];
  feedback: string;
  onShare: () => void;
  onSave?: () => void;
  profileImage?: string;
  styleTips?: StyleTip[];
  nextLevelTips?: string[];
}

export const DripResults = ({
  totalScore,
  breakdown = [],
  feedback = "",
  onShare,
  onSave,
  profileImage,
  styleTips = [],
  nextLevelTips = []
}: DripResultsProps) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  
  // Ensure totalScore is a number and round it
  const displayScore = typeof totalScore === 'number' ? Math.round(totalScore) : 7;

  // Ensure breakdown items have valid scores
  const validBreakdown = breakdown.map(item => ({
    ...item,
    score: typeof item.score === 'number' ? Math.round(item.score) : 7,
    emoji: item.emoji || "⭐",
    details: item.details || `Score: ${item.score}/10`
  }));
  
  const toggleCategory = (category: string) => {
    if (expandedCategory === category) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(category);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-purple-500/30 bg-gradient-to-br from-purple-700 to-pink-500">
          <CachedImage
            src={profileImage}
            blurHash={null}
            width={192}
            alt="Profile"
            fit="cover"
            variant="hero"
            className="w-full h-full"
          />
        </div>
        <div className="space-y-2">
          <h2 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">{displayScore}/100</h2>
          <p className="text-xl text-green-400 font-semibold">Style Score</p>
          <div className="h-1.5 w-32 mx-auto bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(displayScore / 100) * 100}%` }}
              transition={{ delay: 0.5, duration: 1.2 }}
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-black/30 backdrop-blur-lg border-white/10 rounded-lg p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-3">Overall Feedback</h3>
        <p className="text-white/80 text-sm leading-relaxed">{feedback}</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        {validBreakdown.map((item, index) => (
          <motion.div
            key={`${item.category}-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-black/30 backdrop-blur-lg border-white/10 p-4 h-full">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{item.emoji}</span>
                    <span className="text-sm text-white/80 font-medium">{item.category}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
                    onClick={() => toggleCategory(item.category)}
                  >
                    {expandedCategory === item.category ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.score / 100) * 100}%` }}
                    className={`absolute top-0 left-0 h-full rounded-full ${
                      item.score >= 80 ? 'bg-gradient-to-r from-green-500 to-green-400' : 
                      item.score >= 70 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 
                      item.score >= 60 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' : 
                      item.score >= 50 ? 'bg-gradient-to-r from-orange-500 to-orange-400' : 
                      'bg-gradient-to-r from-red-500 to-red-400'
                    }`}
                    transition={{ duration: 1 }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-white">{item.score}</span>
                  <span className="text-xs text-white/60">out of 100</span>
                </div>
                {item.details && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ 
                      height: expandedCategory === item.category ? 'auto' : '0px',
                      opacity: expandedCategory === item.category ? 1 : 0
                    }}
                    className="overflow-hidden"
                  >
                    <p className="text-xs text-white/70 mt-2 leading-relaxed">
                      {item.details}
                    </p>
                  </motion.div>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-black/30 backdrop-blur-lg border-white/10 rounded-lg p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Style Tips</h3>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {styleTips && styleTips.length > 0 ? (
              styleTips.map((categoryTips, categoryIndex) => (
                <div key={`category-${categoryIndex}`} className="space-y-2">
                  <h4 className="text-md font-medium text-white/90 flex items-center gap-2">
                    {categoryTips.category}
                    <div className={`h-1.5 w-1.5 rounded-full ${
                      validBreakdown.find(b => b.category === categoryTips.category)?.score >= 80 ? 'bg-green-400' : 
                      validBreakdown.find(b => b.category === categoryTips.category)?.score >= 60 ? 'bg-yellow-400' : 
                      'bg-red-400'
                    }`} />
                  </h4>
                  {Array.isArray(categoryTips.tips) && categoryTips.tips.length > 0 ? (
                    categoryTips.tips.map((tip, tipIndex) => {
                      if (!tip) return null;
                      
                      return (
                        <motion.div
                          key={`tip-${categoryIndex}-${tipIndex}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: tipIndex * 0.1 }}
                        >
                          <Card className="bg-black/20 border-white/5 p-3">
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-full bg-purple-500/20 flex-shrink-0">
                                <ChevronRight className="w-3 h-3 text-purple-500" />
                              </div>
                              <p className="text-sm text-white/80 leading-relaxed">{tip}</p>
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })
                  ) : (
                    <Card className="bg-black/20 border-white/5 p-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-purple-500/20 flex-shrink-0">
                          <ChevronRight className="w-3 h-3 text-purple-500" />
                        </div>
                        <p className="text-sm text-white/80">Consider exploring different styles and combinations to enhance your look.</p>
                      </div>
                    </Card>
                  )}
                </div>
              ))
            ) : (
              <Card className="bg-black/20 border-white/5 p-3">
                <p className="text-sm text-white/80">
                  Explore different styles and color combinations to enhance your look.
                </p>
              </Card>
            )}
            
            {nextLevelTips && nextLevelTips.length > 0 && (
              <div className="mt-6 pt-4 border-t border-white/10">
                <h4 className="text-md font-medium text-white/90 mb-3 flex items-center gap-2">
                  Next Level Tips
                  <div className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded-full">Advanced</div>
                </h4>
                {nextLevelTips.map((tip, index) => (
                  <motion.div
                    key={`next-level-tip-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-purple-500/10 p-3 mb-2">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-pink-500/20 flex-shrink-0">
                          <ChevronRight className="w-3 h-3 text-pink-500" />
                        </div>
                        <p className="text-sm text-white/80 leading-relaxed">{tip}</p>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </motion.div>
    </div>
  );
};
