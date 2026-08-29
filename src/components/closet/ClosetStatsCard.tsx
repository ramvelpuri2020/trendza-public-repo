import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Shirt, 
  TrendingUp, 
  Calendar, 
  Palette, 
  Building2,
  Sparkles
} from "lucide-react";
import { ClosetStats } from "@/types/closetTypes";

interface ClosetStatsCardProps {
  stats: ClosetStats;
}

const categoryEmojis = {
  tops: 'T',
  bottoms: 'B',
  dresses: 'D',
  outerwear: 'O',
  shoes: 'S',
  accessories: 'A',
  bags: 'B',
  jewelry: 'J',
};

export const ClosetStatsCard = ({ stats }: ClosetStatsCardProps) => {
  const topCategories = Object.entries(stats.itemsByCategory)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  const totalItems = stats.totalItems;
  const maxCategoryCount = Math.max(...Object.values(stats.itemsByCategory));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Items */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-gradient-to-br from-[#9b87f5]/20 to-[#b192ef]/20 backdrop-blur-lg border-[#9b87f5]/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm font-medium">Total Items</p>
                <p className="text-3xl font-bold text-white">{totalItems}</p>
                <p className="text-[#9b87f5] text-xs mt-1">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  Your wardrobe
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-[#9b87f5] to-[#b192ef] rounded-xl flex items-center justify-center">
                <Shirt className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recently Added */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 backdrop-blur-lg border-emerald-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm font-medium">This Week</p>
                <p className="text-3xl font-bold text-white">{stats.recentlyAdded}</p>
                <p className="text-emerald-400 text-xs mt-1">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Recently added
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Top Categories */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-[#1A1F2C]/80 backdrop-blur-lg border-[#403E43]">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              Top Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topCategories.map(([category, count]) => (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {categoryEmojis[category as keyof typeof categoryEmojis]}
                    </span>
                    <span className="text-white/80 text-sm capitalize">{category}</span>
                  </div>
                  <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 text-xs">
                    {count}
                  </Badge>
                </div>
                <Progress 
                  value={(count / maxCategoryCount) * 100} 
                  className="h-1 bg-white/10"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Colors & Brands */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-[#1A1F2C]/80 backdrop-blur-lg border-[#403E43]">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Palette className="w-4 h-4 text-white" />
              </div>
              Style Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Favorite Colors */}
            {stats.favoriteColors.length > 0 && (
              <div>
                <p className="text-white/60 text-xs mb-2 flex items-center gap-1">
                  <Palette className="w-3 h-3" />
                  Favorite Colors
                </p>
                <div className="flex flex-wrap gap-1">
                  {stats.favoriteColors.slice(0, 3).map(color => (
                    <Badge 
                      key={color} 
                      variant="outline" 
                      className="border-purple-500/30 text-purple-400 text-xs px-2 py-0"
                    >
                      {color}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Top Brands */}
            {stats.topBrands.length > 0 && (
              <div>
                <p className="text-white/60 text-xs mb-2 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  Top Brands
                </p>
                <div className="flex flex-wrap gap-1">
                  {stats.topBrands.slice(0, 2).map(brand => (
                    <Badge 
                      key={brand} 
                      variant="outline" 
                      className="border-pink-500/30 text-pink-400 text-xs px-2 py-0"
                    >
                      {brand}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
