import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, Plus } from "lucide-react";
import { OnboardingLayout } from "../OnboardingLayout";
import { Capacitor } from '@capacitor/core';
import { Logger } from "@/utils/logger";

interface ClosetSetupStepProps {
  onNext: (uploadedItems: File[]) => void;
  onBack: () => void;
}

interface UploadedItem {
  id: string;
  file: File;
  preview: string;
}

export const ClosetSetupStep = ({ onNext, onBack }: ClosetSetupStepProps) => {
  const [uploadedItems, setUploadedItems] = useState<UploadedItem[]>([]);
  const [showOutfitPreview, setShowOutfitPreview] = useState(false);

  const handleQuickUpload = async () => {
    try {
      const isCapacitor = Capacitor?.isNativePlatform?.() || false;
      
      if (!isCapacitor) {
        // Web platform
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;
        input.onchange = (e) => {
          const files = Array.from((e.target as HTMLInputElement).files || []);
          files.forEach(handleImageSelected);
        };
        input.click();
        return;
      }

      // Native platform - use Capacitor Camera
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
        const file = new File([blob], `item-${Date.now()}.jpg`, { type: blob.type });
        handleImageSelected(file);
      }
    } catch (error) {
      Logger.error('ClosetSetup', 'Upload error:', error);
    }
  };

  const handleSlotClick = () => {
    handleQuickUpload();
  };

  const handleImageSelected = (file: File) => {
    const id = `item-${Date.now()}-${Math.random()}`;
    const preview = URL.createObjectURL(file);
    
    setUploadedItems(prev => [...prev, { id, file, preview }]);

    // Show outfit preview after 2+ items
    if (uploadedItems.length >= 1) {
      setTimeout(() => {
        setShowOutfitPreview(true);
      }, 500);
    }
  };

  const handleRemoveItem = (id: string) => {
    setUploadedItems(prev => {
      const updated = prev.filter(item => item.id !== id);
      // Revoke object URL to prevent memory leaks
      const itemToRemove = prev.find(item => item.id === id);
      if (itemToRemove) {
        URL.revokeObjectURL(itemToRemove.preview);
      }
      return updated;
    });
  };

  const handleContinue = () => {
    const files = uploadedItems.map(item => item.file);
    onNext(files);
  };

  const handleSkip = () => {
    onNext([]);
  };

  // Create empty slots to fill the grid
  const totalSlots = 15;
  const emptySlots = Math.max(0, totalSlots - uploadedItems.length);

  return (
    <>
      <OnboardingLayout
        currentStep={9}
        totalSteps={10}
        showBackButton={true}
        onBack={onBack}
      >
        <div className="flex-1 flex flex-col">
          <div className="text-center mb-8">
            <h1 className="text-title mb-4">
              Want outfit ideas from clothes you already own?
            </h1>
            <p className="text-body">
              Upload 5-10 key pieces and we'll generate combinations
            </p>
          </div>

          {/* Item count */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-body">Items added</span>
            <span className="text-subheading text-purple-400">
              {uploadedItems.length}/10
            </span>
          </div>

          {/* Grid of items */}
          <div className="grid grid-cols-3 gap-2 mb-8 flex-1">
            {/* Uploaded items */}
            {uploadedItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="relative aspect-square rounded-lg overflow-hidden"
              >
                <img
                  src={item.preview}
                  alt={`Closet item ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white text-xs"
                >
                  <X size={12} />
                </button>
              </motion.div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: emptySlots }).map((_, index) => (
              <motion.button
                key={`empty-${index}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: (uploadedItems.length + index) * 0.05 }}
                onClick={handleSlotClick}
                className="aspect-square border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
              >
                <Plus size={24} className="text-gray-500" />
              </motion.button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="space-y-4">
            <button
              onClick={handleQuickUpload}
              className="btn-primary w-full"
            >
              <Camera size={20} className="mr-2" />
              Quick Upload
            </button>

            {uploadedItems.length > 0 && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleContinue}
                className="btn-secondary w-full"
              >
                Continue with {uploadedItems.length} items
              </motion.button>
            )}

            <button
              onClick={handleSkip}
              className="btn-ghost w-full"
            >
              Skip for now
            </button>
          </div>
        </div>
      </OnboardingLayout>

      {/* Outfit Preview Modal */}
      <AnimatePresence>
        {showOutfitPreview && uploadedItems.length >= 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowOutfitPreview(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="card max-w-sm w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-2xl mb-4">🎉</div>
              <h3 className="text-subheading mb-4">
                We can create outfits like this from your closet!
              </h3>
              
              {/* Show first 2 items as example outfit */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="w-16 h-20 rounded-lg overflow-hidden">
                  <img
                    src={uploadedItems[0]?.preview}
                    alt="Item 1"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-2xl text-purple-400">+</div>
                <div className="w-16 h-20 rounded-lg overflow-hidden">
                  <img
                    src={uploadedItems[1]?.preview}
                    alt="Item 2"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <p className="text-body mb-6">
                Continue to unlock more combinations →
              </p>

              <button
                onClick={() => setShowOutfitPreview(false)}
                className="btn-primary w-full"
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
