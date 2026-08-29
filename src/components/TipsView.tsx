import React, { useState, useCallback, useEffect } from 'react';
import { motion } from "framer-motion";
import { Camera, Search, BookOpen, Lightbulb } from "lucide-react";
import { useScanStore } from "@/store/scanStore";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { StyleTip } from "@/types/styleTypes";

interface LocalStyleTip {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  created_at: string;
  source: 'scan' | 'closet' | 'system';
}

const tipCategories = [
  { id: 'all', label: 'All Tips', count: 0 },
  { id: 'color', label: 'Color Theory', count: 0 },
  { id: 'fit', label: 'Fit & Silhouette', count: 0 },
  { id: 'accessories', label: 'Accessories', count: 0 },
  { id: 'seasonal', label: 'Seasonal', count: 0 },
  { id: 'trends', label: 'Trends', count: 0 },
];

const difficultyColors = {
  beginner: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700',
  intermediate: 'bg-gradient-to-r from-blue-200 to-blue-300 text-blue-700',
  advanced: 'bg-gradient-to-r from-blue-300 to-blue-400 text-blue-700',
};

export const TipsView = () => {
  const scans = useScanStore((state) => state.scans);
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTips, setFilteredTips] = useState<LocalStyleTip[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Convert scan tips to LocalStyleTip format
  const scanTips: LocalStyleTip[] = React.useMemo(() => 
    scans.flatMap((scan, scanIndex) => 
      (scan.tips || []).map((tip: StyleTip, tipIndex: number) => ({
        id: `scan-${scanIndex}-tip-${tipIndex}`,
        title: tip.tip,
        description: `Personalized tip based on your style analysis for ${tip.category}`,
        category: tip.category,
        difficulty: tip.level,
        tags: [tip.category, 'personalized', 'analysis'],
        created_at: new Date().toISOString(),
        source: 'scan' as const,
      }))
    ), [scans]
  );

  // Generate tips from closet items
  const generateClosetTips = useCallback(async (): Promise<LocalStyleTip[]> => {
    if (!user) return [];

    try {
      const { data: closetItems, error } = await supabase
        .from('trendza_closet_items')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const tips: LocalStyleTip[] = [];
      
      if (closetItems && closetItems.length > 0) {
        // Color coordination tips
        const colors = closetItems.map(item => item.color).filter(Boolean);
        if (colors.length > 3) {
          tips.push({
            id: 'closet-color-1',
            title: 'Color Coordination Opportunity',
            description: `You have ${colors.length} different colored items. Try mixing complementary colors for more dynamic outfits.`,
            category: 'color',
            difficulty: 'intermediate',
            tags: ['color coordination', 'closet analysis', 'styling'],
            created_at: new Date().toISOString(),
            source: 'closet',
          });
        }

        // Category balance tips
        const categories = closetItems.map(item => item.category).filter(Boolean);
        const categoryCounts = categories.reduce((acc, cat) => {
          if (cat) {
            acc[cat] = (acc[cat] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);

        const topCategory = Object.entries(categoryCounts).sort(([,a], [,b]) => b - a)[0];
        if (topCategory && topCategory[1] > 5) {
          tips.push({
            id: 'closet-category-1',
            title: 'Category Balance',
            description: `You have ${topCategory[1]} ${topCategory[0]} items. Consider adding more variety to your wardrobe.`,
            category: 'fit',
            difficulty: 'beginner',
            tags: ['wardrobe balance', 'category analysis', 'diversity'],
            created_at: new Date().toISOString(),
            source: 'closet',
          });
        }

        // Seasonal tips
        const seasons = closetItems.map(item => item.season).filter(Boolean);
        const currentSeason = getCurrentSeason();
        const seasonalItems = seasons.filter(season => season === currentSeason);
        
        if (seasonalItems.length < 3) {
          tips.push({
            id: 'closet-seasonal-1',
            title: 'Seasonal Preparation',
            description: `Consider adding more ${currentSeason} items to your wardrobe for better seasonal styling.`,
            category: 'seasonal',
            difficulty: 'beginner',
            tags: ['seasonal', 'wardrobe planning', currentSeason],
            created_at: new Date().toISOString(),
            source: 'closet',
          });
        }
      }

      return tips;
    } catch (error) {
      console.error('Error generating closet tips:', error);
      return [];
    }
  }, [user]);

  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  };

  // System tips based on user behavior
  const systemTips: LocalStyleTip[] = React.useMemo(() => {
    const tips: LocalStyleTip[] = [];
    
    if (scans.length === 0) {
      tips.push({
        id: 'system-first-scan',
        title: 'Start Your Style Journey',
        description: 'Take your first style scan to get personalized tips and insights based on your unique style.',
        category: 'trends',
        difficulty: 'beginner',
        tags: ['getting started', 'first scan', 'personalization'],
        created_at: new Date().toISOString(),
        source: 'system',
      });
    }

    if (scans.length > 0) {
      tips.push({
        id: 'system-regular-scans',
        title: 'Keep Your Style Fresh',
        description: 'Regular style scans help track your style evolution and provide updated recommendations.',
        category: 'trends',
        difficulty: 'beginner',
        tags: ['regular scans', 'style evolution', 'consistency'],
        created_at: new Date().toISOString(),
        source: 'system',
      });
    }

    return tips;
  }, [scans]);

  const [closetTips, setClosetTips] = useState<LocalStyleTip[]>([]);

  useEffect(() => {
    const loadClosetTips = async () => {
      const tips = await generateClosetTips();
      setClosetTips(tips);
    };
    
    loadClosetTips();
  }, [generateClosetTips]);

  const allTips = React.useMemo(() => [...scanTips, ...closetTips, ...systemTips], [scanTips, closetTips, systemTips]);

  useEffect(() => {
    let filtered = allTips;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(tip => tip.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tip =>
        tip.title.toLowerCase().includes(query) ||
        tip.description.toLowerCase().includes(query) ||
        (tip.tags && tip.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    setFilteredTips(filtered);
    setLoading(false);
  }, [allTips, selectedCategory, searchQuery]);

  const handleTipClick = () => {
    toast({
      title: "Tip Saved!",
      description: "Added to your saved tips",
    });
  };

  const handleScanClick = () => {
    navigate('/scan');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
        <div className="max-w-sm mx-auto space-y-6">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-blue-700 font-['Inter']">Loading style tips...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="max-w-sm mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent font-['Playfair_Display'] tracking-tight">Style Tips</h1>
              <p className="text-blue-700 font-['Inter']">Learn and improve your fashion sense</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-400" />
            <Input
              placeholder="Search tips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-blue-200 rounded-xl px-4 py-3 pl-10 text-blue-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200 font-['Inter']"
            />
          </div>
        </motion.div>

        {/* Category Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <h2 className="text-xl font-semibold text-blue-900 font-['Playfair_Display'] tracking-tight">Categories</h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tipCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl whitespace-nowrap transition-all duration-200 font-['Inter'] ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm'
                    : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200'
                }`}
              >
                <span className="text-sm font-medium">{category.label}</span>
                <Badge className={`text-xs font-['Inter'] ${
                  selectedCategory === category.id
                    ? 'bg-white/20 text-white'
                    : 'bg-blue-100 text-blue-600'
                }`}>
                  {category.id === 'all' ? allTips.length : allTips.filter(tip => tip.category === category.id).length}
                </Badge>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tips Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {filteredTips.length === 0 ? (
            <Card className="bg-white border border-blue-200 rounded-2xl shadow-sm p-6">
              <CardContent className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Lightbulb className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-blue-900 mb-2 font-['Playfair_Display'] tracking-tight">
                  {allTips.length === 0 ? "No style tips yet" : "No tips found"}
                </h3>
                <p className="text-blue-700 mb-6 font-['Inter']">
                  {allTips.length === 0 
                    ? "Take your first style scan to get personalized tips and insights"
                    : "Try adjusting your search or filters"
                  }
                </p>
                {allTips.length === 0 && (
                  <Button
                    onClick={handleScanClick}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl px-6 py-3 transition-all duration-300 shadow-sm hover:shadow-md font-['Inter']"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Take a Style Scan
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredTips.map((tip, index) => (
                <motion.div
                  key={tip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <Card className="bg-white border border-blue-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-blue-900 font-['Inter']">{tip.title}</h3>
                            <Badge className={`font-['Inter'] ${difficultyColors[tip.difficulty]}`}>
                              {tip.difficulty}
                            </Badge>
                            <Badge className={`text-xs font-['Inter'] ${
                              tip.source === 'scan' ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700' :
                              tip.source === 'closet' ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700' :
                              'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700'
                            }`}>
                              {tip.source}
                            </Badge>
                          </div>
                          <p className="text-blue-700 mb-3 font-['Inter']">{tip.description}</p>
                          {tip.tags && tip.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {tip.tags.map((tag, tagIndex) => (
                                <Badge key={tagIndex} className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 px-2 py-1 rounded-full text-xs font-medium font-['Inter']">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={handleTipClick}
                          className="p-2 rounded-full hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-colors duration-200"
                        >
                          <BookOpen className="w-5 h-5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <h2 className="text-xl font-semibold text-blue-900 font-['Playfair_Display'] tracking-tight">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-3">
            <Button
              onClick={handleScanClick}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl px-4 py-3 transition-all duration-300 shadow-sm hover:shadow-md font-['Inter']"
            >
              <Camera className="w-5 h-5 mr-2" />
              New Scan
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TipsView;
