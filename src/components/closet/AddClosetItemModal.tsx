import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  Camera,
  Image as ImageIcon,
  X,
  Sparkles,
  Tag,
  Loader2,
  CheckCircle,
  AlertCircle,
  Plus
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { downscaleImageFile } from "@/utils/imageResize";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ClosetItem, ClothingCategory, Season, AddItemFormData } from "@/types/closetTypes";
import { Capacitor } from '@capacitor/core';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { CachedImage } from "@/components/ui/CachedImage";
import { encodeBlurHashFromImageSource } from "@/lib/image";

interface AddClosetItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemAdded: (item: ClosetItem) => void;
}

// CATEGORY_OPTIONS drives the manual picker. The explicit category the
// user picks from this list is what the row goes in with — there's no
// auto-classify here, so no "pending" placeholder is needed in the UI.
// Pending state only applies to the auto-classify flows (clipper /
// UploadItemFlow / ClosetView's auto upload).
const categories: { value: ClothingCategory; label: string }[] = [
  { value: 'tops', label: 'Tops' },
  { value: 'bottoms', label: 'Bottoms' },
  { value: 'dresses', label: 'Dresses' },
  { value: 'outerwear', label: 'Outerwear' },
  { value: 'shoes', label: 'Shoes' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'bags', label: 'Bags' },
  { value: 'jewelry', label: 'Jewelry' },
];

const seasons: { value: Season; label: string }[] = [
  { value: 'spring', label: 'Spring' },
  { value: 'summer', label: 'Summer' },
  { value: 'fall', label: 'Fall' },
  { value: 'winter', label: 'Winter' },
  { value: 'all-season', label: 'All Season' },
];

const popularTags = [
  'casual', 'formal', 'work', 'party', 'weekend', 'date night',
  'comfortable', 'trendy', 'classic', 'vintage', 'designer',
  'athletic', 'elegant', 'edgy', 'boho', 'minimalist'
];

export const AddClosetItemModal = ({ open, onOpenChange, onItemAdded }: AddClosetItemModalProps) => {
  const [formData, setFormData] = useState<AddItemFormData>({
    category: 'tops',
    tags: [],
    attributes: {}
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewBlurHash, setPreviewBlurHash] = useState<string | null>(null);
  const [currentTag, setCurrentTag] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [step, setStep] = useState<'upload' | 'details' | 'review'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const resetForm = () => {
    setFormData({
      category: 'tops',
      tags: [],
      attributes: {}
    });
    setSelectedFile(null);
    setPreview(null);
    setPreviewBlurHash(null);
    setCurrentTag('');
    setAnalysisResult(null);
    setStep('upload');
  };

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    // Build the dataURL preview AND compute BlurHash in parallel.
    // BlurHash on the local preview matters for a different reason:
    // the ambient skeleton above this preview would otherwise flicker
    // white for ~80ms while the user is staring at the cropped image.
    // `Promise.all` keeps the perceived latency at max(reader, hash).
    const reader = new FileReader();
    const readerPromise = new Promise<string>((resolve) => {
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
    // Catch — BlurHash is optional; UI shouldn't block if encode fails.
    const hashPromise = encodeBlurHashFromImageSource(file).catch(() => null);
    const [dataUrl, hash] = await Promise.all([readerPromise, hashPromise]);
    setPreview(dataUrl);
    setPreviewBlurHash(hash);
  };

  const openCamera = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const photo = await CapacitorCamera.getPhoto({
          quality: 90,
          allowEditing: true,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
          correctOrientation: true,
          width: 1024,
          height: 1024,
        });

        if (photo.dataUrl) {
          const response = await fetch(photo.dataUrl);
          const blob = await response.blob();
          const file = new File([blob], `camera-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
          handleFileSelect(file);
        }
      } else {
        // Web fallback - trigger file input
        fileInputRef.current?.click();
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast({
        title: "Camera Error",
        description: "Failed to open camera. Please try uploading an image instead.",
        variant: "destructive"
      });
    }
  };

  const openGallery = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const photo = await CapacitorCamera.getPhoto({
          quality: 90,
          allowEditing: true,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Photos,
          correctOrientation: true,
          width: 1024,
          height: 1024,
        });

        if (photo.dataUrl) {
          const response = await fetch(photo.dataUrl);
          const blob = await response.blob();
          const file = new File([blob], `gallery-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
          handleFileSelect(file);
        }
      } else {
        fileInputRef.current?.click();
      }
    } catch (error) {
      console.error('Gallery error:', error);
      toast({
        title: "Gallery Error",
        description: "Failed to open gallery. Please try uploading an image instead.",
        variant: "destructive"
      });
    }
  };

  const analyzeImage = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Image = e.target?.result as string;
        
        // Call the analyze-style edge function for clothing categorization
        const { data, error } = await supabase.functions.invoke('analyze-closet-item', {
          body: { image: base64Image }
        });

        if (error) {
          console.error('Analysis error:', error);
          // Continue without AI analysis
          setStep('details');
          return;
        }

        if (data) {
          setAnalysisResult(data);
          // Auto-fill form with AI suggestions
          setFormData(prev => ({
            ...prev,
            category: data.category || prev.category,
            color: data.color || prev.color,
            title: data.title || prev.title,
            brand: data.brand || prev.brand,
            tags: [...(prev.tags || []), ...(data.suggestedTags || [])].slice(0, 10),
            attributes: { ...prev.attributes, ...data.attributes }
          }));
        }
        
        setStep('details');
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error('Analysis failed:', error);
      setStep('details'); // Continue without analysis
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTagAdd = (tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }));
    }
    setCurrentTag('');
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const uploadImage = async (): Promise<string> => {
    if (!selectedFile) throw new Error('No file selected');

    // Downscale before upload — keeps DashScope downloads + encode fast.
    // PNG stays PNG (garment transparency preserved), JPEG flattened to white.
    const uploadFile = await downscaleImageFile(selectedFile, 1280);

    const timestamp = new Date().getTime();
    const filePath = `closet_items/${user?.id}/${timestamp}_${uploadFile.name.replace(/\s+/g, '_')}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('style_images')
      .upload(filePath, uploadFile, {
        cacheControl: '31536000', // timestamped URL → immutable → browser-cache forever
        upsert: false
      });
      
    if (uploadError) {
      throw new Error('Failed to upload image: ' + uploadError.message);
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('style_images')
      .getPublicUrl(filePath);
      
    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!user || !selectedFile) return;

    setIsUploading(true);
    try {
      // Upload image first
      const imageUrl = await uploadImage();

      // Persist BlurHash alongside the new row's `attributes` JSON
      // column. The normalizer in `useClosetData` lifts it into a
      // top-level ClosetItem field so CachedImage can paint it as an
      // instant placeholder on the next render.
      const attributes: Record<string, unknown> = {
        ...(formData.attributes ?? {}),
        blur_hash: previewBlurHash,
      };

      // Save to database
      const { data, error } = await supabase
        .from('trendza_closet_items')
        .insert({
          user_id: user.id,
          source_image_url: imageUrl,
          title: formData.title,
          brand: formData.brand,
          category: formData.category,
          color: formData.color,
          season: formData.season,
          tags: formData.tags,
          attributes,
        })
        .select()
        .single();

      if (error) throw error;

      onItemAdded(data as ClosetItem);
      onOpenChange(false);
      resetForm();

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to add item to your closet. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="bg-[#1A1F2C] border-[#403E43] max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-white text-xl flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-[#9b87f5] to-[#b192ef] rounded-lg flex items-center justify-center">
              <Plus className="w-4 h-4 text-white" />
            </div>
            Add Item to Closet
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {step === 'upload' && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {!preview ? (
                    <div className="space-y-4">
                      <p className="text-white/70 text-center">
                        Take a photo or upload an image of your clothing item
                      </p>
                      
                      {/* Upload Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Button
                          onClick={openCamera}
                          className="h-32 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-2 border-dashed border-blue-500/30 hover:border-blue-500/50 text-white flex flex-col gap-2"
                          variant="outline"
                        >
                          <Camera className="w-8 h-8" />
                          <span>Take Photo</span>
                        </Button>

                        <Button
                          onClick={openGallery}
                          className="h-32 bg-gradient-to-br from-gray-800/20 to-gray-900/20 border-2 border-dashed border-gray-500/30 hover:border-gray-500/50 text-white flex flex-col gap-2"
                          variant="outline"
                        >
                          <ImageIcon className="w-8 h-8" />
                          <span>Choose from Gallery</span>
                        </Button>
                      </div>

                      {/* Hidden file input for web */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(file);
                        }}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Image Preview */}
                      <Card className="bg-[#2A2F3C] border-[#403E43] overflow-hidden">
                          <CardContent className="p-0">
                          <div className="relative">
                            <CachedImage
                              src={preview}
                              blurHash={previewBlurHash}
                              width={512}
                              alt="Preview"
                              fit="cover"
                              variant="hero"
                              className="w-full h-64"
                            />
                            <Button
                              size="sm"
                              variant="destructive"
                              className="absolute top-2 right-2"
                              onClick={() => {
                                setPreview(null);
                                setPreviewBlurHash(null);
                                setSelectedFile(null);
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* AI Analysis Button */}
                      <Button
                        onClick={analyzeImage}
                        disabled={isAnalyzing}
                        className="w-full bg-gradient-to-r from-[#9b87f5] to-[#b192ef] hover:from-[#8a77e0] hover:to-[#9e82da] text-white"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Analyzing with AI...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Analyze & Continue
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => setStep('details')}
                        className="w-full border-[#403E43] text-white hover:bg-[#403E43]"
                      >
                        Skip Analysis
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}

              {step === 'details' && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* AI Analysis Results */}
                  {analysisResult && (
                    <Card className="bg-gradient-to-r from-[#9b87f5]/10 to-[#b192ef]/10 border-[#9b87f5]/30">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-white font-medium">AI Analysis Complete</span>
                        </div>
                        <p className="text-white/70 text-sm">
                          I've automatically filled in some details based on your image. Feel free to adjust them below.
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Item Name</Label>
                      <Input
                        value={formData.title || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Navy Blue Blazer"
                        className="bg-[#2A2F3C] border-[#403E43] text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Brand</Label>
                      <Input
                        value={formData.brand || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                        placeholder="e.g., Zara, H&M"
                        className="bg-[#2A2F3C] border-[#403E43] text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Category *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as ClothingCategory }))}
                      >
                        <SelectTrigger className="bg-[#2A2F3C] border-[#403E43] text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#2A2F3C] border-[#403E43]">
                          {categories.map(cat => (
                            <SelectItem key={cat.value} value={cat.value} className="text-white hover:bg-[#403E43]">
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Color</Label>
                      <Input
                        value={formData.color || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                        placeholder="e.g., Navy Blue"
                        className="bg-[#2A2F3C] border-[#403E43] text-white"
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label className="text-white">Season</Label>
                      <Select
                        value={formData.season}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, season: value as Season }))}
                      >
                        <SelectTrigger className="bg-[#2A2F3C] border-[#403E43] text-white">
                          <SelectValue placeholder="Select season" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#2A2F3C] border-[#403E43]">
                          {seasons.map(season => (
                            <SelectItem key={season.value} value={season.value} className="text-white hover:bg-[#403E43]">
                              {season.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-3">
                    <Label className="text-white">Tags</Label>
                    
                    {/* Add custom tag */}
                    <div className="flex gap-2">
                      <Input
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        placeholder="Add a tag..."
                        className="bg-[#2A2F3C] border-[#403E43] text-white"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleTagAdd(currentTag);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => handleTagAdd(currentTag)}
                        size="sm"
                        className="bg-[#9b87f5] hover:bg-[#8a77e0]"
                      >
                        <Tag className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Popular tags */}
                    <div className="space-y-2">
                      <p className="text-white/60 text-sm">Popular tags:</p>
                      <div className="flex flex-wrap gap-2">
                        {popularTags.filter(tag => !formData.tags.includes(tag)).slice(0, 8).map(tag => (
                          <Button
                            key={tag}
                            variant="outline"
                            size="sm"
                            onClick={() => handleTagAdd(tag)}
                            className="border-[#403E43] text-white/70 hover:bg-[#9b87f5]/20 hover:border-[#9b87f5] hover:text-[#9b87f5]"
                          >
                            {tag}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Current tags */}
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map(tag => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="bg-[#9b87f5]/20 text-[#9b87f5] border-[#9b87f5]/30 flex items-center gap-1"
                          >
                            {tag}
                            <button
                              onClick={() => handleTagRemove(tag)}
                              className="ml-1 hover:text-red-400"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setStep('upload')}
                      className="flex-1 border-[#403E43] text-white hover:bg-[#403E43]"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isUploading || !formData.category}
                      className="flex-1 bg-gradient-to-r from-[#9b87f5] to-[#b192ef] hover:from-[#8a77e0] hover:to-[#9e82da] text-white"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        'Add to Closet'
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
