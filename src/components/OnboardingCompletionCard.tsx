import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import { onboardingService } from '@/services/onboardingService';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

export const OnboardingCompletionCard = () => {
  const [isCompleting, setIsCompleting] = useState(false);
  const { user } = useAuth();
  const { hasCompletedOnboarding, refetch } = useOnboardingStatus();
  const { toast } = useToast();

  const handleCompleteOnboarding = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "Please sign in to complete onboarding.",
        variant: "destructive"
      });
      return;
    }

    setIsCompleting(true);
    
    try {
      const success = await onboardingService.completeOnboarding(user.id);
      
      if (success) {
        toast({
          title: "Onboarding Complete!",
          description: "Welcome to your personalized style journey.",
        });
        
        // Refresh onboarding status
        await refetch();
        
        // Small delay to show the success message
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast({
          title: "Completion Failed",
          description: "Please try again or contact support.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCompleting(false);
    }
  };

  // Don't show if onboarding is already completed
  if (hasCompletedOnboarding) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 border-purple-500/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 text-purple-400" />
            Complete Your Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-gray-300 text-sm">
            <p className="mb-3">
              You're almost ready to start your style journey! Complete your onboarding to unlock all features.
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>Personalized style recommendations</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>Advanced analysis tools</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>Progress tracking</span>
              </div>
            </div>
          </div>
          
          <Button
            onClick={handleCompleteOnboarding}
            disabled={isCompleting}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          >
            {isCompleting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Completing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                Complete Setup
                <ArrowRight className="h-4 w-4" />
              </div>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}; 