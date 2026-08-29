
import { ReactNode } from 'react';
import { useSubscription } from './SubscriptionProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface ProGateProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ProGate = ({ children, fallback }: ProGateProps) => {
  const { isPro, isLoading, restorePurchases } = useSubscription();
  const navigate = useNavigate();
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestorePurchases = async () => {
    if (isRestoring) return;
    
    setIsRestoring(true);
    
    try {
      await restorePurchases();
    } catch (error) {
      console.error('Restore error:', error);
    } finally {
      setIsRestoring(false);
    }
  };

  const openPrivacyPolicy = () => {
    window.open('https://dripcheck.framer.website/privacy-policy', '_blank', 'noopener,noreferrer');
  };

  const openTermsOfUse = () => {
    window.open('https://dripcheck.framer.website/terms-of-services', '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="w-6 h-6 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isPro) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-black/20 backdrop-blur-lg border-white/10">
        <CardContent className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-purple-500/20 p-3">
              <Sparkles className="h-8 w-8 text-purple-400" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Pro Feature</h3>
          <p className="text-white/70 mb-4">
            This feature is only available to Pro subscribers.
            Upgrade to unlock all premium features.
          </p>
          
          {/* Restore Purchases Button - Apple Guideline 3.1.1 */}
          <Button 
            onClick={handleRestorePurchases}
            disabled={isRestoring}
            variant="outline"
            className="w-full border-white/30 text-white hover:text-white hover:border-white/50 bg-white/5 backdrop-blur-sm font-medium mb-4"
          >
            {isRestoring ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                Restoring Previous Purchases...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Restore Previous Purchases
              </div>
            )}
          </Button>

          <Button 
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
            onClick={() => navigate('/profile')}
          >
            Upgrade to Pro
          </Button>

          {/* Legal Links - Apple Guideline 3.1.2 */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-center gap-4 text-xs">
              <button
                onClick={openPrivacyPolicy}
                className="text-white/60 hover:text-white/80 transition-colors flex items-center gap-1"
              >
                Privacy Policy
                <ExternalLink className="w-3 h-3" />
              </button>
              <span className="text-white/40">|</span>
              <button
                onClick={openTermsOfUse}
                className="text-white/60 hover:text-white/80 transition-colors flex items-center gap-1"
              >
                Terms of Use
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
