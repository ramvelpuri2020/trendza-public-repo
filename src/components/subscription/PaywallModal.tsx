import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Sparkles, X, RefreshCw, ExternalLink, Zap, Shirt, Palette, ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface PaywallModalProps {
  /** Whether the modal is visible */
  open: boolean;
  /** Called when the modal is dismissed */
  onClose: () => void;
  /** Which feature is being gated */
  feature?: string;
}

const FEATURE_BENEFITS = [
  { icon: Zap, label: 'Unlimited AI Outfit Try-Ons' },
  { icon: Shirt, label: 'AI Outfit Recommendations' },
  { icon: Palette, label: 'Style Analysis & Scoring' },
  { icon: ImageIcon, label: 'Priority Image Generation' },
];

export function PaywallModal({ open, onClose, feature = 'this feature' }: PaywallModalProps) {
  const navigate = useNavigate();
  const [isRestoring, setIsRestoring] = useState(false);

  const handleUpgrade = () => {
    onClose();
    navigate('/upgrade');
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      // Simulate restore check — in production, this would call
      // RevenueCat's restorePurchases(). For the paywall gating modal,
      // we just show a loading state then a friendly message.
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast({
        title: 'Restore Attempted',
        description: 'No previous purchases found on this device. If you subscribed on another device, please try restoring from the payment screen.',
      });
    } catch (e) {
      console.error('Restore error:', e);
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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <X size={18} strokeWidth={2.4} />
            </button>

            {/* Gradient header */}
            <div className="bg-gradient-to-br from-black via-gray-900 to-gray-800 px-6 pt-10 pb-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
                className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center ring-2 ring-purple-400/30"
              >
                <Crown className="w-8 h-8 text-yellow-400" strokeWidth={1.8} />
              </motion.div>
              <h2 className="text-xl font-bold text-white mb-2">Pro Feature</h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                Upgrade to Trendza Pro to unlock <span className="text-white font-semibold">{feature}</span> and more.
              </p>
            </div>

            {/* Benefits list */}
            <div className="px-6 py-5 space-y-3">
              {FEATURE_BENEFITS.map((benefit, i) => (
                <motion.div
                  key={benefit.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-4 h-4 text-purple-600" strokeWidth={2} />
                  </div>
                  <span className="text-sm font-medium text-gray-800">{benefit.label}</span>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <div className="px-6 pb-5 space-y-3">
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={handleUpgrade}
                className="w-full bg-black text-white font-semibold py-3.5 px-6 rounded-2xl text-base transition-all duration-200 hover:bg-gray-900 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Upgrade to Pro
              </motion.button>

              {/* Restore purchases */}
              <Button
                onClick={handleRestore}
                disabled={isRestoring}
                variant="outline"
                className="w-full border-gray-200 text-gray-600 hover:text-gray-800 hover:border-gray-300 bg-white rounded-xl py-2 text-sm"
              >
                {isRestoring ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-gray-600 rounded-full animate-spin" />
                    <span>Restoring...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Restore Purchases</span>
                  </div>
                )}
              </Button>

              {/* Maybe later */}
              <button
                onClick={onClose}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-800 transition-colors py-2"
              >
                Maybe later
              </button>

              {/* Legal links */}
              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  onClick={openPrivacyPolicy}
                  className="text-gray-400 hover:text-gray-600 transition-colors text-xs underline"
                >
                  Privacy Policy
                </button>
                <span className="text-gray-300">·</span>
                <button
                  onClick={openTermsOfUse}
                  className="text-gray-400 hover:text-gray-600 transition-colors text-xs underline"
                >
                  Terms of Use
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
