import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { handleAnonymousSign } from "../utils/auth";
import { Capacitor } from '@capacitor/core';
import { Logger } from "@/utils/logger";
import { requestInAppReview } from "@/utils/inAppReview";
import { supabase } from "@/integrations/supabase/client";

interface NewWelcomeStepProps {
  onNext: () => void;
  onUserCreated?: (userId: string) => void;
}

export const NewWelcomeStep = ({ onNext, onUserCreated }: NewWelcomeStepProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleGetStarted = async () => {
    if (isProcessing) {
      Logger.info('WelcomeStep', 'Already processing, ignoring duplicate click');
      return;
    }
    
    setIsProcessing(true);
    try {
      // First check if we already have a session to avoid multiple user creation
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        Logger.info('WelcomeStep', 'User already exists, proceeding:', session.user.id);
        if (onUserCreated) {
          onUserCreated(session.user.id);
        }
        onNext();
        return;
      }

      const success = await handleAnonymousSign();
      
      if (success) {
        // Get the created user ID and notify parent FIRST
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id && onUserCreated) {
          onUserCreated(session.user.id);
          // Small delay to ensure parent state is updated
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        // Trigger in-app review before proceeding
        try {
          const isCapacitor = Capacitor?.isNativePlatform?.() || false;
          if (isCapacitor) {
            Logger.info('WelcomeStep', 'Requesting in-app review...');
            await requestInAppReview();
            Logger.info('WelcomeStep', 'In-app review request completed');
          } else {
            Logger.info('WelcomeStep', 'Web platform - skipping in-app review');
          }
        } catch (reviewError) {
          Logger.warn('WelcomeStep', 'In-app review not available:', reviewError);
          // Continue anyway - review is optional
        }
        
        // Proceed to next onboarding step
        onNext();
      } else {
        Logger.error('WelcomeStep', 'Anonymous authentication failed');
        toast({
          title: "Authentication Error",
          description: "Unable to start the app. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      Logger.error('WelcomeStep', 'Error in handleGetStarted:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 px-6 py-8 flex flex-col"
    >
      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="flex-1 flex flex-col justify-center"
      >
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-r from-gray-800 to-gray-900 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <Camera className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-headline-lg font-headline-bold text-white mb-2">
            Get your outfit checked with
          </h1>
          <h2 className="text-headline-lg font-headline-bold text-red-500 mb-6">
            trendza
          </h2>
          <p className="text-gray-300 text-body-lg font-interface max-w-sm mx-auto">
            Take a selfie and get personalized advice on how to improve your style
          </p>
        </div>
      </motion.div>

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mb-8"
      >
        <Button
          onClick={handleGetStarted}
          disabled={isProcessing}
          className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white h-16 text-xl font-semibold rounded-xl transition-all duration-300"
        >
          {isProcessing ? "Starting..." : "Get Started"}
        </Button>
      </motion.div>
    </motion.div>
  );
}; 