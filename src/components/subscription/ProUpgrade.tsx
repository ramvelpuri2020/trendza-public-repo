import { useSubscription } from "@/components/subscription/SubscriptionProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, RefreshCw, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

export const ProUpgrade = () => {
  const { isPro, subscription, restorePurchases } = useSubscription();
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestorePurchases = async () => {
    if (isRestoring) return;
    
    setIsRestoring(true);
    
    try {
      await restorePurchases();
    } catch (error) {
      console.error("Restore error:", error);
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

  if (!isPro) {
    return null; // Don't show anything if user is not pro
  }

  return (
    <Card className="bg-black/20 backdrop-blur-lg border-white/10">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          {/* Pro Status */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <Crown className="h-6 w-6 text-yellow-400" />
            <h3 className="text-xl font-semibold text-white">Pro Member</h3>
          </div>

          {/* Subscription Info */}
          {subscription.expirationDate && (
            <div className="bg-white/10 rounded-lg p-4 mb-4">
              <p className="text-white/80 text-sm mb-1">Subscription Active Until</p>
              <p className="text-white font-semibold">
                {format(new Date(subscription.expirationDate), 'MMMM d, yyyy')}
              </p>
            </div>
          )}

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

          {/* Legal Links */}
          <div className="flex flex-col items-center gap-2 pt-4 border-t border-white/10">
            <div className="flex items-center gap-4 text-xs">
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
        </div>
      </CardContent>
    </Card>
  );
};
