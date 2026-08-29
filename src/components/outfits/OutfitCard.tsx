import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Heart, 
  Save, 
  Star, 
  ShoppingBag, 
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Shirt
} from "lucide-react";
import { GeneratedOutfitOption } from "@/types/outfitTypes";

interface OutfitCardProps {
  outfit: GeneratedOutfitOption;
  onSave: () => void;
  index: number;
}

const categoryIcons = {
  tops: Shirt,
  bottoms: Shirt,
  dresses: Shirt,
  outerwear: Shirt,
  shoes: Shirt,
  accessories: Shirt,
  bags: Shirt,
  jewelry: Shirt,
};

export const OutfitCard = ({ outfit, onSave, index }: OutfitCardProps) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    onSave();
    setIsSaved(true);
  };

  const handleToggleFavorite = () => {
    setIsFavorited(!isFavorited);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-gray-900 text-white';
    if (score >= 80) return 'bg-gray-800 text-white';
    if (score >= 70) return 'bg-gray-700 text-white';
    return 'bg-gray-600 text-white';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Great';
    if (score >= 70) return 'Good';
    return 'Okay';
  };

  return (
    <Card className="bg-white border border-gray-200 hover:border-gray-300 transition-all duration-300 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <span className="text-lg">Outfit {index + 1}</span>
            <Badge className={`${getScoreColor(outfit.score)} border-gray-200`}>
              <Star className="w-3 h-3 mr-1" />
              {outfit.score}/100 {getScoreLabel(outfit.score)}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleToggleFavorite}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isFavorited 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
            </motion.button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Outfit Items */}
        <div className="space-y-3">
          <h4 className="text-gray-900 font-medium flex items-center gap-2">
            <span>Items ({outfit.items.length})</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {outfit.items.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.02 }}
                className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="w-10 h-10 rounded-lg">
                    <AvatarImage 
                      src={item.source_image_url || '/placeholder.svg'} 
                      alt={item.title || 'Closet item'}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gray-100 text-gray-900 rounded-lg text-xs">
                      <Shirt className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 text-sm font-medium truncate">
                      {item.title || 'Untitled'}
                    </p>
                    <p className="text-gray-600 text-xs capitalize">
                      {item.category}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Rationale */}
        <div className="space-y-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 text-gray-900 font-medium hover:text-gray-700 transition-colors w-full text-left"
          >
            <Lightbulb className="w-4 h-4" />
            <span>Why this outfit works</span>
            {showDetails ? (
              <ChevronUp className="w-4 h-4 ml-auto" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-auto" />
            )}
          </button>
          
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
            >
              <p className="text-gray-700 text-sm leading-relaxed">
                {outfit.rationale}
              </p>
              
              {outfit.style_notes && outfit.style_notes.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-gray-600 text-xs font-medium uppercase tracking-wide">
                    Style Notes:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {outfit.style_notes.map((note, i) => (
                      <Badge 
                        key={i}
                        variant="outline" 
                        className="border-gray-200 text-gray-700 text-xs"
                      >
                        {note}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Missing Items */}
        {outfit.missing_items && outfit.missing_items.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-gray-600" />
              <span className="text-gray-900 font-medium">Suggested additions</span>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="space-y-2">
                {outfit.missing_items.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Badge 
                      variant="outline" 
                      className="border-gray-300 text-gray-700 text-xs mt-0.5"
                    >
                      {item.priority}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-gray-900 text-sm font-medium">{item.description}</p>
                      <p className="text-gray-600 text-xs">{item.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleSave}
            disabled={isSaved}
            className={`flex-1 ${
              isSaved 
                ? 'bg-gray-100 text-gray-600 cursor-not-allowed' 
                : 'bg-gray-900 hover:bg-gray-800 text-white'
            } transition-all duration-300`}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaved ? 'Saved' : 'Save Outfit'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
