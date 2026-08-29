import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Camera, ImageIcon, X, Sparkles, Check } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from "@capacitor/camera";
import { saveUserBasePhoto } from "@/services/plannerService";

interface SelfieCaptureStepProps {
  onNext: (photoUrl?: string) => void;
  onBack: () => void;
}

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const TIPS = [
  { icon: "🧍", label: "Full body", desc: "Standing full-length, facing forward" },
  { icon: "☀️", label: "Good lighting", desc: "Natural light works best" },
  { icon: "👕", label: "Fitted clothes", desc: "Wear something you'd normally wear" },
];

export const SelfieCaptureStep = ({ onNext, onBack }: SelfieCaptureStepProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const previewUrlRef = useRef<string | null>(null);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const validateFile = (file: File): boolean => {
    setError("");
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only PNG, JPG, JPEG, or WEBP files are allowed.");
      return false;
    }
    if (file.size > MAX_SIZE) {
      setError("File size should be less than 10MB.");
      return false;
    }
    return true;
  };

  const handleFile = (file: File) => {
    if (isProcessing) return;
    if (!validateFile(file)) return;

    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const url = URL.createObjectURL(file);
    previewUrlRef.current = url;
    setPreview(url);
    setSelectedFile(file);
  };

  const base64ToFile = (base64: string, filename: string): File => {
    const base64Data = base64.includes(",") ? base64.split(",")[1] : base64;
    const mimeMatch = base64.match(/data:([^;]+);base64,/);
    const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new File([bytes], filename, { type: mime });
  };

  const takePhoto = useCallback(async () => {
    if (isProcessing) return;
    setError("");
    setIsProcessing(true);

    try {
      if (Capacitor.isNativePlatform()) {
        const permissions = await CapacitorCamera.checkPermissions();
        if (permissions.camera !== "granted") {
          const requested = await CapacitorCamera.requestPermissions({ permissions: ["camera"] });
          if (requested.camera !== "granted") {
            setError("Camera permission required. Please enable in Settings.");
            setIsProcessing(false);
            return;
          }
        }
        const photo = await CapacitorCamera.getPhoto({
          quality: 85,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
          correctOrientation: true,
          width: 1024,
          height: 1024,
        });
        if (photo.dataUrl) {
          handleFile(base64ToFile(photo.dataUrl, `selfie-${Date.now()}.jpg`));
        }
      } else {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.capture = "environment";
        input.onchange = (e) => {
          const target = e.target as HTMLInputElement;
          if (target.files?.[0]) handleFile(target.files[0]);
        };
        input.click();
      }
    } catch (err: any) {
      if (!err.message?.includes("cancelled")) {
        setError(`Camera error: ${err.message || "Please try the photo library instead."}`);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  const selectFromLibrary = useCallback(async () => {
    if (isProcessing) return;
    setError("");
    setIsProcessing(true);

    try {
      if (Capacitor.isNativePlatform()) {
        const permissions = await CapacitorCamera.checkPermissions();
        if (permissions.photos !== "granted") {
          const requested = await CapacitorCamera.requestPermissions({ permissions: ["photos"] });
          if (requested.photos !== "granted") {
            setError("Photo library permission required. Please enable in Settings.");
            setIsProcessing(false);
            return;
          }
        }
        const photo = await CapacitorCamera.getPhoto({
          quality: 85,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Photos,
          correctOrientation: true,
          width: 1024,
          height: 1024,
        });
        if (photo.dataUrl) {
          handleFile(base64ToFile(photo.dataUrl, `selfie-${Date.now()}.jpg`));
        }
      } else {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (e) => {
          const target = e.target as HTMLInputElement;
          if (target.files?.[0]) handleFile(target.files[0]);
        };
        input.click();
      }
    } catch (err: any) {
      if (!err.message?.includes("cancelled")) {
        setError(`Error selecting photo: ${err.message || "Please try again."}`);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  const clearImage = () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setPreview(null);
    setSelectedFile(null);
    setError("");
  };

  const handleConfirm = async () => {
    if (isUploading || !selectedFile) return;
    setIsUploading(true);

    try {
      const photoUrl = await saveUserBasePhoto(selectedFile);
      onNext(photoUrl);
    } catch (err: any) {
      setError(`Upload failed: ${err.message || "Please try again."}`);
      setIsUploading(false);
    }
  };

  const handleSkip = () => {
    onNext(); // no photo — Try-On handles "no base photo" gracefully
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "-100%" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="screen-safe app-content bg-white flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center px-6 pt-14 pb-2">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft size={18} strokeWidth={2.4} />
        </motion.button>

        <div className="flex-1 flex justify-start ml-3">
          <div className="w-full max-w-[280px] h-[3px] bg-gray-200 rounded-full relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "45%" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
              className="absolute left-0 top-0 h-full bg-black rounded-full"
            />
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {preview ? (
          /* ═══════════════════════════════════════════════════
             PREVIEW MODE — photo selected, confirm or retake
             ═══════════════════════════════════════════════════ */
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col px-6 mt-4"
          >
            <div className="flex-1 rounded-2xl overflow-hidden bg-gray-100 relative">
              <img src={preview} alt="Selfie preview" className="w-full h-full object-cover" />
              <button
                onClick={clearImage}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleConfirm}
              disabled={isUploading}
              className="w-full h-14 rounded-2xl text-[17px] font-semibold bg-black text-white hover:bg-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Uploading...
                </span>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Use this photo
                </>
              )}
            </motion.button>

            <button
              onClick={clearImage}
              className="text-center text-sm text-gray-500 mt-3 mb-4 hover:text-gray-700 transition-colors"
            >
              Tap to retake
            </button>
          </motion.div>
        ) : (
          /* ═══════════════════════════════════════════════════
             UPLOAD MODE — show illustration + buttons
             ═══════════════════════════════════════════════════ */
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="flex-1 flex flex-col"
          >
            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto px-6">
              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="text-[32px] font-bold text-black leading-tight mt-6"
              >
                Add your full portrait
                <br />
                for AI Try-On
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="text-[15px] text-gray-500 mt-2 leading-relaxed"
              >
                Get personalized outfit previews that
                <br />
                match your full body and style.
              </motion.p>

              {/* ── ILLUSTRATION ── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center justify-center my-8"
              >
                <div className="relative w-full max-w-[320px]">
                  <img
                    src="/onboarding-images/selfie/selfie-illustration.png"
                    alt="Full body portrait for AI outfit try-on illustration"
                    className="w-full h-auto object-contain"
                    draggable={false}
                    loading="eager"
                  />
                </div>
              </motion.div>

              {/* ── TIPS SECTION ── */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
                className="mb-6"
              >
                <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                  {TIPS.map((tip, i) => (
                    <motion.div
                      key={tip.label}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.28 + i * 0.06 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-base shadow-sm">
                        {tip.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{tip.label}</p>
                        <p className="text-xs text-gray-500">{tip.desc}</p>
                      </div>
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" strokeWidth={2.5} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* ── BUTTONS (pinned at bottom, not scrollable) ── */}
            <div className="px-6 pb-safe-button pt-2">
              {/* Take a selfie */}
              <motion.button
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                whileTap={{ scale: 0.97 }}
                onClick={takePhoto}
                disabled={isProcessing}
                className="w-full h-14 rounded-2xl text-[17px] font-semibold bg-black text-white hover:bg-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Opening camera...
                  </div>
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    Take a Photo
                  </>
                )}
              </motion.button>

              {/* Choose from library */}
              <motion.button
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.42 }}
                whileTap={{ scale: 0.97 }}
                onClick={selectFromLibrary}
                disabled={isProcessing}
                className="w-full h-14 rounded-2xl text-[17px] font-semibold bg-gray-100 text-black hover:bg-gray-200 transition-all duration-200 mt-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ImageIcon className="w-5 h-5" />
                Choose from Photos
              </motion.button>

              {/* Skip */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={handleSkip}
                className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors py-4 mt-1"
              >
                Skip for now
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 pb-2"
        >
          <p className="text-red-500 text-sm text-center">{error}</p>
        </motion.div>
      )}
    </motion.div>
  );
};
