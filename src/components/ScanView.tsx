import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Sparkles, ArrowLeft, X, Plus, TrendingUp, Star, Flame, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { analyzeStyle } from "@/utils/imageAnalysis";
import { useScanStore } from "@/store/scanStore";
import { Capacitor } from '@capacitor/core';
import type { ScoreBreakdown, StyleTip } from "@/types/styleTypes";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "./ui/card";
import { CachedImage } from "@/components/ui/CachedImage";
import { encodeBlurHashFromImageSource } from "@/lib/image";
import { useClosetData } from "@/hooks/useClosetData";

interface RecentScan {
  id: string;
  imageUrl: string;
  score: number;
  timestamp: string;
}

interface DashboardStats {
  scansThisWeek: number;
  averageScore: number;
  bestScore: number;
  currentStreak: number;
}

export const ScanView = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    scansThisWeek: 0,
    averageScore: 0,
    bestScore: 0,
    currentStreak: 0
  });
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const { toast } = useToast();
  const addScan = useScanStore((state) => state.addScan);
  const { user } = useAuth();
  
  const [result, setResult] = useState<{ 
    overallScore: number; 
    rawAnalysis: string; 
    imageUrl: string; 
    breakdown?: ScoreBreakdown[];
    tips?: StyleTip[];
    summary?: string;
  } | null>(null);

  // Get current week days
  const getCurrentWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    
    const week = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push({
        date: day.getDate(),
        day: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][i],
        isToday: day.toDateString() === today.toDateString()
      });
    }
    return week;
  };

  const weekDays = getCurrentWeek();

  // Load stats and recent scans
  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('style_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Calculate stats
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const thisWeekScans = data.filter(scan => 
          new Date(scan.created_at) >= startOfWeek
        );

        const allScores = data.map(scan => scan.total_score || 0).filter(score => score > 0);
        const avgScore = allScores.length > 0 
          ? Math.round(allScores.reduce((sum, score) => sum + score, 0) / allScores.length)
          : 0;
        const bestScore = allScores.length > 0 ? Math.max(...allScores) : 0;

        setStats({
          scansThisWeek: thisWeekScans.length,
          averageScore: avgScore,
          bestScore: bestScore,
          currentStreak: 0 // TODO: Calculate actual streak
        });

        // Set recent scans
        const scans: RecentScan[] = data.slice(0, 5).map(item => ({
          id: item.id,
          imageUrl: item.image_url || '',
          score: item.total_score || 0,
          timestamp: item.created_at
        }));
        setRecentScans(scans);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const handleShowUploadOptions = () => {
    setShowUploadOptions(true);
  };

  const handleTakePhoto = async () => {
    setShowUploadOptions(false);
    
    try {
      const isCapacitor = Capacitor?.isNativePlatform?.() || false;
      
      if (!isCapacitor) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            setSelectedImage(file);
            setShowResults(false);
            setResult(null);
          }
        };
        input.click();
        return;
      }

      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
      
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });
      
      if (photo?.dataUrl) {
        const res = await fetch(photo.dataUrl);
        const blob = await res.blob();
        const file = new File([blob], 'outfit.jpg', { type: blob.type });
        setSelectedImage(file);
        setShowResults(false);
        setResult(null);
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast({
        title: "Camera Error",
        description: "Failed to access camera.",
        variant: "destructive",
      });
    }
  };

  const handleChooseFromGallery = async () => {
    setShowUploadOptions(false);
    
    try {
      const isCapacitor = Capacitor?.isNativePlatform?.() || false;
      
      if (!isCapacitor) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            setSelectedImage(file);
            setShowResults(false);
            setResult(null);
          }
        };
        input.click();
        return;
      }

      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
      
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });
      
      if (photo?.dataUrl) {
        const res = await fetch(photo.dataUrl);
        const blob = await res.blob();
        const file = new File([blob], 'outfit.jpg', { type: blob.type });
        setSelectedImage(file);
        setShowResults(false);
        setResult(null);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      toast({
        title: "Gallery Error",
        description: "Failed to access gallery.",
        variant: "destructive",
      });
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      toast({
        title: "No image selected",
        description: "Please upload an image to analyze",
        variant: "destructive",
      });
      return;
    }

    setAnalyzing(true);
    setShowResults(false);
    
    try {
      const analysisResult = await analyzeStyle(selectedImage, false);
      
      if (analysisResult && analysisResult.overallScore) {
        setResult({
          overallScore: analysisResult.overallScore,
          rawAnalysis: analysisResult.rawAnalysis || '',
          imageUrl: analysisResult.imageUrl || URL.createObjectURL(selectedImage),
          breakdown: analysisResult.breakdown || [],
          tips: analysisResult.tips || [],
          summary: analysisResult.summary || ''
        });
        
        addScan({
          overallScore: analysisResult.overallScore,
          rawAnalysis: analysisResult.rawAnalysis || '',
          imageUrl: analysisResult.imageUrl || URL.createObjectURL(selectedImage),
          breakdown: analysisResult.breakdown || [],
          tips: analysisResult.tips || [],
          summary: analysisResult.summary || ''
        });
        
        setShowResults(true);
        
        // Reload dashboard data
        await loadDashboardData();
        
        toast({
          title: "Analysis Complete!",
          description: `Your style score is ${analysisResult.overallScore}/100`,
        });
      } else {
        throw new Error("Analysis failed");
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze your photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRestart = () => {
    setSelectedImage(null);
    setResult(null);
    setShowResults(false);
    setAnalyzing(false);
  };

  const handleViewScan = async (scan: RecentScan) => {
    try {
      // Fetch full analysis data from database
      const { data, error } = await supabase
        .from('style_analyses')
        .select('*')
        .eq('id', scan.id)
        .single();

      if (error) throw error;

      if (data) {
        // Parse the breakdown and tips from JSON
        const breakdown = typeof data.breakdown === 'string' 
          ? JSON.parse(data.breakdown) 
          : data.breakdown;
        
        const tips = typeof data.tips === 'string' && data.tips
          ? JSON.parse(data.tips)
          : data.tips || [];

        setResult({
          overallScore: data.total_score || 0,
          rawAnalysis: data.raw_analysis || '',
          imageUrl: data.image_url || '',
          breakdown: breakdown || [],
          tips: tips,
          summary: data.feedback || ''
        });

        setShowResults(true);
      }
    } catch (error) {
      console.error('Error loading scan details:', error);
      toast({
        title: "Error",
        description: "Failed to load scan details.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="px-4 pt-4 pb-nav-fab min-h-full">
      <AnimatePresence mode="wait">
        {!selectedImage && !showResults && !analyzing && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1"
          >
            {/* Header — eyebrow label that pairs with the app header above */}
            <div className="mb-5">
              <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">Your Week</p>
              <h1 className="text-2xl font-bold text-black tracking-tight mt-1">Style Dashboard</h1>
            </div>

            {/* Calendar Week View */}
            <div className="mb-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
              <div className="grid grid-cols-7 gap-1">
                {weekDays.map((day, index) => (
                  <div
                    key={index}
                    className={`flex flex-col items-center py-2 rounded-xl transition-all ${
                      day.isToday 
                        ? 'bg-black text-white' 
                        : 'text-gray-600'
                    }`}
                  >
                    <span className="text-xs font-medium mb-1">{day.day}</span>
                    <span className="text-sm font-bold">{day.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Stat - Scans This Week. Hero stat makes the page
                * declarative ("here's your week") rather than a sales pitch. */}
            <div className="mb-6 flex items-end justify-between gap-3">
              <div>
                <div className="text-6xl font-bold text-black tracking-tighter leading-none">{stats.scansThisWeek}</div>
                <p className="text-sm text-gray-500 mt-1">Scans this week</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 px-2.5 py-1 rounded-full bg-gray-100">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <span className="font-medium">{Math.min(stats.currentStreak, 7)}-day streak</span>
              </div>
            </div>

            {/* Three Square Stat Cards — replacing the 3 SVG circles,
                * which had hard-coded #FF6B6B / #FFA500 / #6B9FFF that
                * bypassed the design system. Square cards with a
                * single accent color read more iOS-native and scale
                * better across screen densities. */}
            <div className="mb-6 grid grid-cols-3 gap-3">
              {[
                { label: 'Average', value: stats.averageScore, icon: TrendingUp, accent: 'text-orange-600 bg-orange-50' },
                { label: 'Best', value: stats.bestScore, icon: Star, accent: 'text-yellow-600 bg-yellow-50' },
                { label: 'Days', value: stats.currentStreak, icon: Flame, accent: 'text-orange-600 bg-orange-50' },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="bg-white border border-gray-200 rounded-2xl p-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${stat.accent}`}>
                      <Icon className="w-4 h-4" strokeWidth={2.5} />
                    </div>
                    <div className="text-2xl font-bold text-black tracking-tight leading-none">{stat.value}</div>
                    <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Recently Uploaded Section */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-black tracking-tight">Recently uploaded</h2>
                {recentScans.length > 0 && (
                  <span className="text-xs text-gray-500">{recentScans.length} {recentScans.length === 1 ? 'scan' : 'scans'}</span>
                )}
              </div>

              {recentScans.length === 0 ? (
                <button
                  type="button"
                  onClick={handleShowUploadOptions}
                  aria-label="Upload your first outfit"
                  className="w-full text-center py-10 hover:bg-gray-50 rounded-2xl transition-colors border-2 border-dashed border-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                >
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3 mx-auto">
                    <Camera size={28} className="text-gray-500" />
                  </div>
                  <p className="text-gray-700 text-sm font-medium">Upload your first outfit</p>
                  <p className="text-gray-500 text-xs mt-1">Get a personalized style score in seconds</p>
                </button>
              ) : (
                <div className="space-y-2.5">
                  {recentScans.map((scan, index) => (
                    <motion.div
                      key={scan.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06 }}
                      onClick={() => handleViewScan(scan)}
                      className="cursor-pointer"
                    >
                      <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:border-gray-300 transition-all">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <CachedImage
                              src={scan.imageUrl}
                              blurHash={null}
                              width={120}
                              alt="Outfit scan"
                              fit="cover"
                              className="w-14 h-14 rounded-xl bg-gray-100 flex-none"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {new Date(scan.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </p>
                              <p className="text-xs text-gray-500">Score</p>
                            </div>
                            <div className="flex items-baseline gap-0.5">
                              <div className="text-2xl font-bold text-black tracking-tight">{scan.score}</div>
                              <div className="text-xs text-gray-400 font-medium">/100</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Photo FAB — positioned above the bottom tab bar
                * (64px nav + safe-area-inset-bottom) with breathing room so
                * the icon is always visible above the bottom nav on every
                * iPhone (button + home indicator / Dynamic Island).
                * z-50 keeps it above page content; the Upload Photo sheet
                * lives at z-[60] so it correctly overlays the tab bar. */}
            <button
              onClick={handleShowUploadOptions}
              aria-label="Upload a photo"
              className="fixed right-5 w-14 h-14 bg-black rounded-full flex items-center justify-center shadow-lg hover:bg-gray-900 transition-all z-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              style={{ bottom: 'calc(64px + env(safe-area-inset-bottom, 0px) + 20px)' }}
            >
              <Plus size={26} className="text-white" strokeWidth={2.5} />
            </button>

            {/* Upload Options Modal */}
            <AnimatePresence>
              {showUploadOptions && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 z-[60]"
                    onClick={() => setShowUploadOptions(false)}
                  />
                  <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 30, stiffness: 320 }}
                    className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl p-6 z-[60]"
                    style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
                    role="dialog"
                    aria-label="Upload options"
                  >
                    <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-5" />
                    <h3 className="text-lg font-bold text-black mb-1">Upload Photo</h3>
                    <p className="text-sm text-gray-500 mb-5">Add a new piece to your wardrobe</p>
                    <div className="space-y-2.5">
                      <button
                        onClick={handleTakePhoto}
                        className="w-full bg-black text-white font-semibold py-4 px-6 rounded-2xl text-base transition-all hover:bg-gray-900 flex items-center justify-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                      >
                        <Camera size={20} strokeWidth={2.5} />
                        Take Photo
                      </button>
                      <button
                        onClick={handleChooseFromGallery}
                        className="w-full bg-gray-100 text-black font-semibold py-4 px-6 rounded-2xl text-base transition-all hover:bg-gray-200 flex items-center justify-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                      >
                        <ImageIcon size={20} strokeWidth={2.5} />
                        Choose from Gallery
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {selectedImage && !analyzing && !showResults && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col"
          >
            <div className="flex items-center justify-between mb-8 safe-area-top">
              <button
                onClick={() => setSelectedImage(null)}
                className="back-button"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-heading">Ready to Analyze</h1>
              <div className="w-10" />
            </div>

            <div className="flex-1 flex items-center justify-center mb-8">
              <div className="relative">
                <CachedImage
                  src={URL.createObjectURL(selectedImage)}
                  blurHash={null}
                  width={384}
                  alt="Selected outfit"
                  fit="cover"
                  variant="hero"
                  className="max-w-full max-h-96 rounded-2xl"
                />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="btn-primary w-full"
            >
              {analyzing ? (
                <div className="flex items-center gap-2">
                  <div className="spinner"></div>
                  <span>Analyzing Style...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles size={20} />
                  <span>Analyze Style ✨</span>
                </div>
              )}
            </button>
          </motion.div>
        )}

        {analyzing && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-12"
            >
              <div className="w-24 h-24 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-8" />
              
              <h2 className="text-heading mb-4">
                Analyzing Your Style
              </h2>
              <p className="text-body">
                Our AI is evaluating your outfit...
              </p>
            </motion.div>
          </motion.div>
        )}

        {showResults && result && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-8 safe-area-top">
              <button
                onClick={handleRestart}
                className="back-button"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-heading">Style Analysis</h1>
              <div className="w-10" />
            </div>

            <div className="text-center mb-8">
              <CachedImage
                src={result.imageUrl}
                blurHash={null}
                width={480}
                alt="Analyzed outfit"
                fit="cover"
                variant="hero"
                className="w-48 h-64 object-cover rounded-2xl mx-auto"
              />
            </div>

            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-black text-white mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{result.overallScore}</div>
                  <div className="text-xs opacity-80">/100</div>
                </div>
              </div>
              <h2 className="text-heading mb-2">Overall Style Score</h2>
              <p className="text-body">{result.summary || "Great style choices!"}</p>
            </div>

            {result.breakdown && result.breakdown.length > 0 && (
              <div className="mb-8">
                <h3 className="text-subheading mb-4">Breakdown</h3>
                <div className="grid grid-cols-1 gap-4">
                  {result.breakdown.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="card flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.emoji}</span>
                        <div>
                          <p className="text-subheading">{item.category}</p>
                          <p className="text-caption">{(item as any).feedback || 'Good work!'}</p>
                        </div>
                      </div>
                      <div className="text-xl font-bold text-black">
                        {item.score}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {result.tips && result.tips.length > 0 && (
              <div className="mb-8">
                <h3 className="text-subheading mb-4">Style Tips 💡</h3>
                <div className="space-y-3">
                  {result.tips.map((tip, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="card"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-white text-xs font-bold">{index + 1}</span>
                        </div>
                        <div>
                          <p className="text-subheading mb-1">{tip.category}</p>
                          <p className="text-body">{(tip as any).suggestion || (tip as any).tip || 'Keep up the great style!'}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleRestart}
              className="btn-secondary w-full mb-8"
            >
              New Scan
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
