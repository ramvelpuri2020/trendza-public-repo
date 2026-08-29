import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Camera, ArrowLeft, Upload } from "lucide-react";
import { Capacitor } from '@capacitor/core';
import { useToast } from "@/hooks/use-toast";

interface GetGradeStepProps {
  onPhotoCapture: (file: File) => void;
  onBack: () => void;
}

export const GetGradeStep = ({ onPhotoCapture, onBack }: GetGradeStepProps) => {
  const isCapacitor = Capacitor?.isNativePlatform?.() || false;
  const { toast } = useToast();

  const handleTakePhoto = async () => {
    if (!isCapacitor) {
      // Web platform - use file upload
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment'; // Prefer rear camera on mobile web
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          console.log('📸 Web photo selected:', file.name, file.size);
          onPhotoCapture(file);
        }
      };
      input.click();
      return;
    }

    // Native platform - use Capacitor Camera
    try {
      console.log('📸 Opening native camera...');
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
      
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        promptLabelHeader: 'Take your picture',
        promptLabelCancel: 'Cancel',
        promptLabelPhoto: 'Photo',
      });
      
      if (photo?.dataUrl) {
        console.log('📸 Native photo captured, converting to file...');
        const res = await fetch(photo.dataUrl);
        const blob = await res.blob();
        const file = new File([blob], 'photo.jpg', { type: blob.type });
        console.log('✅ Photo converted to file:', file.name, file.size);
        onPhotoCapture(file);
      } else {
        console.log('❌ No photo data received from camera');
        toast({
          title: "No Photo Captured",
          description: "Please try taking a photo again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('📸 Camera error:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePhotoLibrary = async () => {
    if (!isCapacitor) {
      // Web platform - use file upload without camera
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          console.log('📸 Web photo from library selected:', file.name, file.size);
          onPhotoCapture(file);
        }
      };
      input.click();
      return;
    }

    // Native platform - use Capacitor Camera with Photo Library
    try {
      console.log('📸 Opening photo library...');
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
      
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos, // Use photo library instead of camera
        promptLabelHeader: 'Select your picture',
        promptLabelCancel: 'Cancel',
        promptLabelPhoto: 'Photo',
      });
      
      if (photo?.dataUrl) {
        console.log('📸 Photo from library selected, converting to file...');
        const res = await fetch(photo.dataUrl);
        const blob = await res.blob();
        const file = new File([blob], 'photo.jpg', { type: blob.type });
        console.log('✅ Photo converted to file:', file.name, file.size);
        onPhotoCapture(file);
      } else {
        console.log('❌ No photo data received from library');
        toast({
          title: "No Photo Selected",
          description: "Please try selecting a photo again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('📸 Photo library error:', error);
      toast({
        title: "Photo Library Error",
        description: "Unable to access photo library. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 px-6 py-8"
    >
      {/* Header */}
      <div className="flex items-center mb-8">
        <button
          onClick={onBack}
          className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mr-4"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-2xl font-bold text-white">Scan your drip</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center items-center text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8"
        >
          <div className="w-32 h-32 bg-gradient-to-r from-gray-800 to-gray-900 rounded-full flex items-center justify-center mb-6 mx-auto">
            <Camera className="w-16 h-16 text-white" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            Scan Your Drip
          </h2>
          <p className="text-gray-300 text-lg leading-relaxed max-w-sm mx-auto">
            {isCapacitor 
              ? "Use your camera to take a photo of your outfit"
              : "Upload a photo of your outfit for AI analysis"
            }
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="w-full max-w-sm space-y-3"
        >
          <Button
            onClick={handleTakePhoto}
            className="w-full bg-red-500 hover:bg-red-600 text-white h-16 text-lg font-semibold rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg"
          >
            {isCapacitor ? (
              <>
                <Camera className="w-5 h-5 mr-3" />
                Scan your drip
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-3" />
                Scan your drip
              </>
            )}
          </Button>

          {/* Photo Library Button for Testing */}
          <Button
            onClick={handlePhotoLibrary}
            variant="outline"
            className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 h-12 text-base font-medium rounded-xl transition-all duration-300 backdrop-blur-sm"
          >
            <Upload className="w-4 h-4 mr-2" />
            Choose from Library
          </Button>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="text-center mt-8"
      >
        <p className="text-gray-400 text-sm">
          Your photo will be analyzed by our advanced AI
        </p>
      </motion.div>
    </motion.div>
  );
}; 