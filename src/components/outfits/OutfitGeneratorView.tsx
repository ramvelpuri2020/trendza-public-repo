import { motion } from "framer-motion";
import { useState } from "react";
import { Wand2, Sparkles, Calendar, CloudSun, Palette, ArrowRight, RefreshCw, Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";

interface OutfitOption {
  id: string;
  title: string;
  description: string;
  items: string[];
  occasion: string;
  weather: string;
  style: string;
  score: number;
  image_url?: string;
}

const occasions = [
  { id: 'casual', label: 'Casual', description: 'Everyday comfort' },
  { id: 'work', label: 'Work', description: 'Professional office' },
  { id: 'date', label: 'Date Night', description: 'Romantic evening' },
  { id: 'party', label: 'Party', description: 'Fun celebration' },
  { id: 'formal', label: 'Formal', description: 'Elegant events' },
  { id: 'gym', label: 'Gym', description: 'Workout ready' },
];

const weatherOptions = [
  { id: 'sunny', label: 'Sunny', temp: '20-30°C' },
  { id: 'cloudy', label: 'Cloudy', temp: '15-25°C' },
  { id: 'rainy', label: 'Rainy', temp: '10-20°C' },
  { id: 'cold', label: 'Cold', temp: '0-10°C' },
];

const stylePreferences = [
  { id: 'classic', label: 'Classic', description: 'Timeless elegance' },
  { id: 'trendy', label: 'Trendy', description: 'Current fashion' },
  { id: 'minimalist', label: 'Minimalist', description: 'Clean simplicity' },
  { id: 'bohemian', label: 'Bohemian', description: 'Free-spirited' },
];

export const OutfitGeneratorView = () => {
  const [step, setStep] = useState<'select' | 'generating' | 'results'>('select');
  const [selectedOccasion, setSelectedOccasion] = useState('');
  const [selectedWeather, setSelectedWeather] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [generatedOutfits, setGeneratedOutfits] = useState<OutfitOption[]>([]);
  const { toast } = useToast();

  const handleOccasionSelect = (occasion: string) => {
    setSelectedOccasion(occasion);
    setStep('select');
  };

  const handleWeatherSelect = (weather: string) => {
    setSelectedWeather(weather);
  };

  const handleStyleSelect = (style: string) => {
    setSelectedStyle(style);
  };

  const generateOutfits = async () => {
    if (!selectedOccasion || !selectedWeather || !selectedStyle) {
      toast({
        title: "Missing Information",
        description: "Please select all options before generating outfits",
        variant: "destructive"
      });
      return;
    }

    setStep('generating');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockOutfits: OutfitOption[] = [
        {
          id: '1',
          title: 'Casual Comfort',
          description: 'Perfect for a relaxed day out with friends',
          items: ['White T-shirt', 'Blue Jeans', 'Sneakers'],
          occasion: selectedOccasion,
          weather: selectedWeather,
          style: selectedStyle,
          score: 95,
        },
        {
          id: '2',
          title: 'Smart Casual',
          description: 'Elevated everyday look that works anywhere',
          items: ['Polo Shirt', 'Chinos', 'Loafers'],
          occasion: selectedOccasion,
          weather: selectedWeather,
          style: selectedStyle,
          score: 88,
        },
        {
          id: '3',
          title: 'Trendy Street',
          description: 'Modern streetwear with a fashion-forward edge',
          items: ['Oversized Hoodie', 'Cargo Pants', 'Dad Sneakers'],
          occasion: selectedOccasion,
          weather: selectedWeather,
          style: selectedStyle,
          score: 92,
        },
      ];

      setGeneratedOutfits(mockOutfits);
      setStep('results');
      
      toast({
        title: "Outfits Generated!",
        description: `Created ${mockOutfits.length} perfect outfits for you`,
      });
      
    } catch (error) {
      console.error('Error generating outfits:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate outfits. Please try again.",
        variant: "destructive"
      });
      setStep('select');
    }
  };

  const handleRegenerate = () => {
    setStep('select');
    setGeneratedOutfits([]);
  };

  const handleSaveOutfit = (outfitId: string) => {
    toast({
      title: "Outfit Saved!",
      description: "Added to your saved outfits",
    });
  };

  const handleShareOutfit = (outfitId: string) => {
    toast({
      title: "Outfit Shared!",
      description: "Your outfit has been shared",
    });
  };

  if (step === 'generating') {
    return (
      <div className="screen-safe app-content bg-white p-4">
        <div className="max-w-sm mx-auto space-y-6">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-8 h-8 text-gray-900 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Generating Outfits</h2>
              <p className="text-gray-600">AI is creating perfect looks for you...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'results') {
    return (
      <div className="screen-safe app-content bg-white p-4">
        <div className="max-w-sm mx-auto space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-gray-900" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">AI Outfits</h1>
                <p className="text-gray-600">Your personalized style recommendations</p>
              </div>
            </div>
          </motion.div>

          {/* Generated Outfits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {generatedOutfits.map((outfit, index) => (
              <motion.div
                key={outfit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{outfit.title}</h3>
                          <p className="text-gray-600 text-sm mb-3">{outfit.description}</p>
                          <div className="flex items-center gap-2 mb-3">
                            <Badge className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                              {outfit.occasion}
                            </Badge>
                            <Badge className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                              {outfit.weather}
                            </Badge>
                            <Badge className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                              {outfit.style}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">{outfit.score}</div>
                          <div className="text-xs text-gray-600">Score</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-900 text-sm">Items:</h4>
                        <div className="space-y-1">
                          {outfit.items.map((item, itemIndex) => (
                            <div key={itemIndex} className="flex items-center gap-2 text-sm text-gray-600">
                              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => handleSaveOutfit(outfit.id)}
                          className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl px-4 py-2 transition-all duration-300 shadow-sm hover:shadow-md"
                        >
                          <Heart className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        <Button
                          onClick={() => handleShareOutfit(outfit.id)}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-xl px-4 py-2 transition-all duration-300"
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-3"
          >
            <Button
              onClick={handleRegenerate}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl px-6 py-3 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Generate New Outfits
            </Button>
            <Button
              onClick={() => window.history.back()}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-xl px-6 py-3 transition-all duration-300"
            >
              Back to Dashboard
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-safe app-content bg-white p-4">
      <div className="max-w-sm mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <Wand2 className="w-6 h-6 text-gray-900" />
            </div>
            <div>
              <h1 className="text-headline-md font-headline-bold text-gray-900">AI Outfits</h1>
              <p className="text-gray-600 font-interface">Generate personalized outfit recommendations</p>
            </div>
          </div>
        </motion.div>

        {/* Occasion Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
            <CardContent>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">What's the occasion?</h2>
              <div className="grid grid-cols-2 gap-3">
                {occasions.map((occasion) => (
                  <button
                    key={occasion.id}
                    onClick={() => handleOccasionSelect(occasion.id)}
                    className={`p-4 rounded-xl border transition-all duration-200 text-left ${
                      selectedOccasion === occasion.id
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
                    }`}
                  >
                    <h3 className="font-semibold text-sm mb-1">{occasion.label}</h3>
                    <p className={`text-xs ${
                      selectedOccasion === occasion.id ? 'text-gray-200' : 'text-gray-600'
                    }`}>
                      {occasion.description}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Weather Selection */}
        {selectedOccasion && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
              <CardContent>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Weather conditions?</h2>
                <div className="grid grid-cols-2 gap-3">
                  {weatherOptions.map((weather) => (
                    <button
                      key={weather.id}
                      onClick={() => handleWeatherSelect(weather.id)}
                      className={`p-4 rounded-xl border transition-all duration-200 text-left ${
                        selectedWeather === weather.id
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <CloudSun className="w-4 h-4" />
                        <h3 className="font-semibold text-sm">{weather.label}</h3>
                      </div>
                      <p className={`text-xs ${
                        selectedWeather === weather.id ? 'text-gray-200' : 'text-gray-600'
                      }`}>
                        {weather.temp}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Style Preference */}
        {selectedWeather && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
              <CardContent>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Style preference?</h2>
                <div className="grid grid-cols-2 gap-3">
                  {stylePreferences.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => handleStyleSelect(style.id)}
                      className={`p-4 rounded-xl border transition-all duration-200 text-left ${
                        selectedStyle === style.id
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Palette className="w-4 h-4" />
                        <h3 className="font-semibold text-sm">{style.label}</h3>
                      </div>
                      <p className={`text-xs ${
                        selectedStyle === style.id ? 'text-gray-200' : 'text-gray-600'
                      }`}>
                        {style.description}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Generate Button */}
        {selectedStyle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              onClick={generateOutfits}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold text-lg py-4 rounded-xl shadow-sm transition-all duration-300"
            >
              <Wand2 className="w-6 h-6 mr-2" />
              Generate Outfits
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};
