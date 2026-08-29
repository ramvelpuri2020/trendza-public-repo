import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, Upload } from "lucide-react";
import { OnboardingLayout } from "../OnboardingLayout";
import { Capacitor } from '@capacitor/core';
import { Logger } from "@/utils/logger";

interface GradeFirstOutfitStepProps {
  onNext: (imageFile: File) => void;
  onBack: () => void;
}

export const GradeFirstOutfitStep = ({ onNext, onBack }: GradeFirstOutfitStepProps) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleTakePhoto = async () => {
    try {
      const isCapacitor = Capacitor?.isNativePlatform?.() || false;
      
      if (!isCapacitor) {
        // Web platform - use file upload with camera preference
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment'; // Prefer rear camera on mobile web
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            handleImageSelected(file);
          }
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
        promptLabelHeader: 'Take your outfit photo',
        promptLabelCancel: 'Cancel',
        promptLabelPhoto: 'Photo',
      });
      
      if (photo?.dataUrl) {
        const res = await fetch(photo.dataUrl);
        const blob = await res.blob();
        const file = new File([blob], 'outfit.jpg', { type: blob.type });
        handleImageSelected(file);
      }
    } catch (error) {
      Logger.error('GradeFirstOutfit', 'Camera error:', error);
    }
  };

  const handleUploadPhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleImageSelected(file);
      }
    };
    input.click();
  };

  const handleImageSelected = (file: File) => {
    setSelectedImage(file);
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
  };

  const handleContinue = () => {
    if (selectedImage) {
      onNext(selectedImage);
    }
  };

  return (
    <OnboardingLayout
      currentStep={6}
      totalSteps={10}
      showBackButton={true}
      onBack={onBack}
    >
      <div className="flex-1 flex flex-col">
        <div className="text-center mb-12">
          <h1 className="text-title mb-4">
            Let's see how your style scores
          </h1>
          <p className="text-body">
            Upload an outfit you wore recently and get instant AI feedback
          </p>
        </div>

        {!selectedImage ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-12"
            >
              <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center mb-8 mx-auto border-2 border-gray-200">
                <Camera size={48} className="text-black" strokeWidth={1.5} />
              </div>
            </motion.div>

            <div className="w-full space-y-4">
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                onClick={handleTakePhoto}
                className="btn-primary w-full"
              >
                <Camera size={20} className="mr-2" />
                Take Photo
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                onClick={handleUploadPhoto}
                className="btn-secondary w-full"
              >
                <Upload size={20} className="mr-2" />
                Upload from Photos
              </motion.button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex items-center justify-center mb-8"
            >
              <div className="relative">
                <img
                  src={imagePreview!}
                  alt="Selected outfit"
                  className="max-w-full max-h-96 rounded-2xl object-cover"
                />
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white text-sm"
                >
                  ×
                </button>
              </div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              onClick={handleContinue}
              className="btn-primary w-full"
            >
              Continue
            </motion.button>
          </div>
        )}
      </div>
    </OnboardingLayout>
  );
};
