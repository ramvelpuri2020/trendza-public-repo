import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Wand2, 
  CloudSun, 
  Palette, 
  Sparkles,
  Loader2
} from "lucide-react";
import { 
  OutfitGenerationRequest, 
  OccasionType,
  WeatherOption,
  StyleOption,
  WeatherType,
  StylePreference
} from "@/types/outfitTypes";

interface GenerationSettingsProps {
  occasion: OccasionType;
  onGenerate: (request: OutfitGenerationRequest) => void;
  onBack: () => void;
  generating: boolean;
}

const weatherOptions: WeatherOption[] = [
  { id: 'hot', label: 'Hot', emoji: '☀️', temp_range: '80°F+' },
  { id: 'warm', label: 'Warm', emoji: '🌤️', temp_range: '70-80°F' },
  { id: 'mild', label: 'Mild', emoji: '⛅', temp_range: '60-70°F' },
  { id: 'cool', label: 'Cool', emoji: '🌥️', temp_range: '50-60°F' },
  { id: 'cold', label: 'Cold', emoji: '🧥', temp_range: '40-50°F' },
  { id: 'rainy', label: 'Rainy', emoji: '🌧️', temp_range: 'Any temp' },
];

const styleOptions: StyleOption[] = [
  { id: 'classic', label: 'Classic', emoji: '👔', description: 'Timeless and elegant' },
  { id: 'trendy', label: 'Trendy', emoji: '✨', description: 'Fashion-forward and current' },
  { id: 'edgy', label: 'Edgy', emoji: '🖤', description: 'Bold and unconventional' },
  { id: 'bohemian', label: 'Bohemian', emoji: '🌸', description: 'Free-spirited and artistic' },
  { id: 'minimalist', label: 'Minimalist', emoji: '⚪', description: 'Clean and simple' },
  { id: 'romantic', label: 'Romantic', emoji: '💕', description: 'Soft and feminine' },
];

export const GenerationSettings = ({ occasion, onGenerate, onBack, generating }: GenerationSettingsProps) => {
  const [selectedWeather, setSelectedWeather] = useState<WeatherType>('mild');
  const [selectedStyle, setSelectedStyle] = useState<StylePreference>('classic');
  const [colorPreference, setColorPreference] = useState('');
  const [specificRequirements, setSpecificRequirements] = useState('');

  const handleGenerate = () => {
    const request: OutfitGenerationRequest = {
      occasion,
      weather: selectedWeather,
      style_preference: selectedStyle,
      color_preference: colorPreference.trim() || undefined,
      specific_requirements: specificRequirements.trim() || undefined,
    };

    onGenerate(request);
  };

  const occasionEmojis = {
    work: '💼',
    date_night: '💕',
    casual: '👕',
    party: '🎉',
    gym: '💪',
    formal: '🤵',
    brunch: '🥂',
    travel: '✈️',
    wedding: '💒',
    interview: '📋',
    night_out: '🌃',
    weekend: '🏖️'
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="text-5xl mb-4">
          {occasionEmojis[occasion] || '✨'}
        </div>
        <h2 className="text-2xl font-bold text-white">Perfect! Let's customize your {occasion.replace('_', ' ')} outfit</h2>
        <p className="text-white/70">
          Give me a few more details to create the most suitable outfits for you
        </p>
      </motion.div>

      <div className="space-y-6">
        {/* Weather Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-[#1A1F2C]/80 backdrop-blur-lg border-[#403E43]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CloudSun className="w-5 h-5 text-[#9b87f5]" />
                What's the weather like?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {weatherOptions.map(weather => (
                  <Button
                    key={weather.id}
                    variant={selectedWeather === weather.id ? "default" : "outline"}
                    onClick={() => setSelectedWeather(weather.id)}
                    className={`
                      h-auto p-4 flex flex-col items-center gap-2
                      ${selectedWeather === weather.id 
                        ? 'bg-gradient-to-r from-[#9b87f5] to-[#b192ef] text-white border-none' 
                        : 'bg-[#2A2F3C] border-[#403E43] text-white hover:bg-[#403E43] hover:border-[#9b87f5]/50'
                      }
                    `}
                  >
                    <span className="text-2xl">{weather.emoji}</span>
                    <div className="text-center">
                      <div className="font-medium">{weather.label}</div>
                      <div className="text-xs opacity-70">{weather.temp_range}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Style Preference */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-[#1A1F2C]/80 backdrop-blur-lg border-[#403E43]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#9b87f5]" />
                What's your style vibe?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {styleOptions.map(style => (
                  <Button
                    key={style.id}
                    variant={selectedStyle === style.id ? "default" : "outline"}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`
                      h-auto p-4 flex items-center gap-3 text-left
                      ${selectedStyle === style.id 
                        ? 'bg-gradient-to-r from-[#9b87f5] to-[#b192ef] text-white border-none' 
                        : 'bg-[#2A2F3C] border-[#403E43] text-white hover:bg-[#403E43] hover:border-[#9b87f5]/50'
                      }
                    `}
                  >
                    <span className="text-xl">{style.emoji}</span>
                    <div>
                      <div className="font-medium">{style.label}</div>
                      <div className="text-xs opacity-70">{style.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Color Preference */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-[#1A1F2C]/80 backdrop-blur-lg border-[#403E43]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#9b87f5]" />
                Any color preferences?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Label className="text-white/80 text-sm">
                Optional: Tell me if you want to feature specific colors
              </Label>
              <input
                type="text"
                value={colorPreference}
                onChange={(e) => setColorPreference(e.target.value)}
                placeholder="e.g., blue, earth tones, bright colors, monochrome..."
                className="w-full p-3 bg-[#2A2F3C] border border-[#403E43] rounded-lg text-white placeholder-white/40 focus:border-[#9b87f5] focus:outline-none"
              />
              <div className="flex flex-wrap gap-2">
                {['Monochrome', 'Earth tones', 'Bright colors', 'Pastels', 'Black & white'].map(color => (
                  <Badge
                    key={color}
                    variant="outline"
                    className="border-[#403E43] text-white/60 hover:bg-[#9b87f5]/20 hover:border-[#9b87f5] hover:text-[#9b87f5] cursor-pointer transition-colors"
                    onClick={() => setColorPreference(color.toLowerCase())}
                  >
                    {color}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Specific Requirements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-[#1A1F2C]/80 backdrop-blur-lg border-[#403E43]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-[#9b87f5]" />
                Any special requests?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Label className="text-white/80 text-sm">
                Optional: Any specific requirements or items you want to include/avoid?
              </Label>
              <Textarea
                value={specificRequirements}
                onChange={(e) => setSpecificRequirements(e.target.value)}
                placeholder="e.g., must include my red dress, avoid heels, need pockets, comfortable for walking..."
                className="bg-[#2A2F3C] border-[#403E43] text-white placeholder-white/40 focus:border-[#9b87f5] resize-none"
                rows={3}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex gap-3 pt-4"
        >
          <Button
            variant="outline"
            onClick={onBack}
            disabled={generating}
            className="flex-1 border-[#403E43] text-white hover:bg-[#403E43]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="flex-2 bg-gradient-to-r from-[#9b87f5] to-[#b192ef] hover:from-[#8a77e0] hover:to-[#9e82da] text-white border-none"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Outfits...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Outfits
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};
