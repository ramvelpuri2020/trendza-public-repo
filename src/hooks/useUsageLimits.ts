import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/components/subscription/SubscriptionProvider';
import { supabase } from '@/integrations/supabase/client';

export type FeatureKey = 'outfit_tryon';

interface FeatureLimit {
  key: FeatureKey;
  label: string;
  monthlyLimit: number;
}

const FEATURE_LIMITS: Record<FeatureKey, FeatureLimit> = {
  outfit_tryon: {
    key: 'outfit_tryon',
    label: 'AI Outfit Try-Ons',
    monthlyLimit: 3,
  },
};

interface UsageState {
  outfit_tryon: {
    used: number;
    limit: number;
    resetDate: string; // ISO date of when the counter resets
  };
}

const LS_KEY = 'trendza_usage_limits';

function getMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}`;
}

function getEndOfMonth(): string {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return end.toISOString();
}

function loadUsage(): UsageState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return getDefaultUsage();
    const parsed = JSON.parse(raw) as UsageState;

    // Validate the stored month key matches current month
    const storedReset = new Date(parsed.outfit_tryon.resetDate);
    const now = new Date();
    const storedMonth = storedReset.getMonth();
    const storedYear = storedReset.getFullYear();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // If month changed, reset counter
    if (storedYear !== currentYear || storedMonth !== currentMonth) {
      return getDefaultUsage();
    }

    return parsed;
  } catch {
    return getDefaultUsage();
  }
}

function getDefaultUsage(): UsageState {
  return {
    outfit_tryon: {
      used: 0,
      limit: FEATURE_LIMITS.outfit_tryon.monthlyLimit,
      resetDate: getEndOfMonth(),
    },
  };
}

function saveUsage(state: UsageState) {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

export function useUsageLimits() {
  const { user } = useAuth();
  const { isPro } = useSubscription();
  const [usage, setUsage] = useState<UsageState>(loadUsage);

  // Re-check monthly reset on mount and when user changes
  useEffect(() => {
    const fresh = loadUsage();
    setUsage(fresh);
  }, []);

  /** Check if the user can use a specific feature */
  const canUseFeature = useCallback(
    (feature: FeatureKey): { allowed: boolean; remaining: number; limit: number; reason?: string } => {
      // Pro users have unlimited access
      if (isPro) {
        return { allowed: true, remaining: Infinity, limit: Infinity };
      }

      const featureState = usage[feature];
      if (!featureState) {
        return { allowed: false, remaining: 0, limit: 0, reason: 'Unknown feature' };
      }

      const remaining = featureState.limit - featureState.used;
      if (remaining <= 0) {
        return {
          allowed: false,
          remaining: 0,
          limit: featureState.limit,
          reason: `You've used all ${featureState.limit} free ${feature}${featureState.limit === 1 ? '' : 's'} this month. Upgrade to Pro for unlimited access.`,
        };
      }

      return { allowed: true, remaining, limit: featureState.limit };
    },
    [isPro, usage],
  );

  /** Record usage of a feature. Returns whether the usage was counted. */
  const useFeature = useCallback(
    async (feature: FeatureKey): Promise<boolean> => {
      // Pro users don't need to track usage
      if (isPro) return true;

      const check = canUseFeature(feature);
      if (!check.allowed) return false;

      const newUsage: UsageState = {
        ...usage,
        [feature]: {
          ...usage[feature],
          used: usage[feature].used + 1,
        },
      };

      setUsage(newUsage);
      saveUsage(newUsage);

      // Async sync to Supabase for analytics (best-effort, don't block)
      if (user?.id) {
        try {
          await supabase.from('user_analytics').insert({
            user_id: user.id,
            action: `usage_${feature}`,
            data: {
              feature,
              used: newUsage[feature].used,
              limit: newUsage[feature].limit,
              month: getMonthKey(),
            },
          });
        } catch (e) {
          console.warn('[useUsageLimits] Failed to sync usage:', e);
        }
      }

      return true;
    },
    [isPro, canUseFeature, usage, user?.id],
  );

  /** Get remaining usage for all features (for profile display) */
  const getAllRemaining = useCallback(() => {
    if (isPro) {
      return Object.values(FEATURE_LIMITS).map((f) => ({
        ...f,
        used: 0,
        remaining: Infinity,
        resetDate: null,
      }));
    }

    return Object.values(FEATURE_LIMITS).map((f) => {
      const featureState = usage[f.key];
      return {
        ...f,
        used: featureState?.used ?? 0,
        remaining: (featureState?.limit ?? f.monthlyLimit) - (featureState?.used ?? 0),
        resetDate: featureState?.resetDate ?? getEndOfMonth(),
      };
    });
  }, [isPro, usage]);

  /** Manually reset monthly counters */
  const resetMonthly = useCallback(() => {
    const fresh = getDefaultUsage();
    setUsage(fresh);
    saveUsage(fresh);
  }, []);

  return {
    canUseFeature,
    useFeature,
    getAllRemaining,
    resetMonthly,
    usage,
    isPro,
  };
}

export { FEATURE_LIMITS };
