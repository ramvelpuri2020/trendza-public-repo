import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Lock, Bell, Crown } from "lucide-react";

interface TrialTimelineStepProps {
  onComplete: () => void;
}

export const TrialTimelineStep = ({ onComplete }: TrialTimelineStepProps) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  // Calculate billing date (3 days from now)
  const getBillingDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleStartTrial = () => {
    onComplete();
  };

  return (
    <div className="screen-safe app-content bg-white flex flex-col h-full">
      <div className="flex-1 flex flex-col px-6 pt-12 pb-8">
        {/* Back Button */}
        <button
          onClick={() => window.history.back()}
          className="self-start mb-4"
        >
          <span className="text-black text-lg">←</span>
        </button>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-[28px] font-bold text-black text-center mb-8 leading-tight"
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter, sans-serif' }}
        >
          Start your 3-day FREE trial to continue.
        </motion.h1>

        {/* Timeline Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 space-y-6"
        >
          {/* Today */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mt-1">
              <Lock className="w-5 h-5 text-orange-500" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <p className="text-black font-semibold text-base mb-1">Today</p>
              <p className="text-gray-600 text-sm leading-relaxed">
                Unlock all trendza features like style analysis, outfit matching, and more.
              </p>
            </div>
          </div>

          {/* In 2 Days - Reminder */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mt-1">
              <Bell className="w-5 h-5 text-orange-500" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <p className="text-black font-semibold text-base mb-1">In 2 Days - Reminder</p>
              <p className="text-gray-600 text-sm leading-relaxed">
                We&apos;ll send you a reminder that your trial is ending soon.
              </p>
            </div>
          </div>

          {/* In 3 Days - Billing Starts */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mt-1">
              <Crown className="w-5 h-5 text-black" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <p className="text-black font-semibold text-base mb-1">In 3 Days - Billing Starts</p>
              <p className="text-gray-600 text-sm leading-relaxed">
                You&apos;ll be charged on {getBillingDate()} unless you cancel anytime before.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Subscription Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex gap-3">
            {/* Yearly Option (with 3-day free trial) */}
            <button
              onClick={() => setSelectedPlan('yearly')}
              className={`flex-1 rounded-xl border-2 p-4 transition-all relative ${
                selectedPlan === 'yearly'
                  ? 'border-black bg-black text-white'
                  : 'border-gray-200 bg-white text-black hover:border-gray-300'
              }`}
            >
              {/* 3 DAYS FREE Badge */}
              <div className="absolute -top-2 -right-2 bg-black text-white text-xs font-bold px-2 py-1 rounded">
                3 DAYS FREE
              </div>
              <div className="text-left">
                <p className="font-semibold text-base mb-1">Yearly</p>
                <p className="text-sm">$2.49 /mo</p>
              </div>
              <div className="flex justify-end mt-2">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedPlan === 'yearly'
                      ? 'border-white bg-white'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {selectedPlan === 'yearly' && (
                    <Check className="w-3 h-3 text-black" strokeWidth={3} />
                  )}
                </div>
              </div>
            </button>

            {/* Monthly Option */}
            <button
              onClick={() => setSelectedPlan('monthly')}
              className={`flex-1 rounded-xl border-2 p-4 transition-all ${
                selectedPlan === 'monthly'
                  ? 'border-black bg-black text-white'
                  : 'border-gray-200 bg-white text-black hover:border-gray-300'
              }`}
            >
              <div className="text-left">
                <p className="font-semibold text-base mb-1">Monthly</p>
                <p className="text-sm">$9.99 /mo</p>
              </div>
              <div className="flex justify-end mt-2">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedPlan === 'monthly'
                      ? 'border-white bg-white'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {selectedPlan === 'monthly' && (
                    <Check className="w-3 h-3 text-black" strokeWidth={3} />
                  )}
                </div>
              </div>
            </button>
          </div>
        </motion.div>

        {/* No Payment Due */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex items-center justify-center gap-2 mb-6"
        >
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <Check size={14} className="text-white" strokeWidth={3} />
          </div>
          <span className="text-black font-medium text-sm">No Payment Due Now</span>
        </motion.div>

        {/* CTA Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          onClick={handleStartTrial}
          className="w-full bg-black text-white font-semibold py-4 px-8 rounded-2xl text-lg transition-all duration-200 hover:bg-gray-900 active:scale-98 mb-3"
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter, sans-serif' }}
        >
          Start My 3-Day Free Trial
        </motion.button>

        {/* Fine Print */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center text-sm text-gray-500"
        >
          {selectedPlan === 'yearly' 
            ? '3 days free, then $29.99 per year'
            : 'Just $9.99 per month'
          }
        </motion.p>
      </div>
    </div>
  );
};

