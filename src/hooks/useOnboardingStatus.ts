import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSubscription } from '@/components/subscription/SubscriptionProvider';
import { Capacitor } from '@capacitor/core';

interface OnboardingStatus {
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  checkOnboardingStatus: () => Promise<void>;
  retryCount: number;
  /**
   * True only after the 5s safety timeout fired while the underlying
   * Supabase call was still pending. Callers should use this to tell
   * "user has not onboarded" apart from "we don't know yet" before
   * deciding to lock the user out of the protected shell.
   */
  loadHung: boolean;
}

export function useOnboardingStatus(): OnboardingStatus & { refetch: () => Promise<void> } {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  // True only when the safety timeout fired before a result arrived.
  // Callers can use this to distinguish "user has not onboarded" from
  // "we don't know yet because the server never answered" — important for
  // AppRoutes, which would otherwise lock an authenticated user out.
  const [loadHung, setLoadHung] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { isPro, subscription } = useSubscription();
  
  // Add state tracking to prevent loops
  const lastCheckRef = useRef<{
    userId: string | null;
    timestamp: number;
    result: boolean;
  }>({ userId: null, timestamp: 0, result: false });

  const checkOnboardingStatus = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setIsLoading(false);
      setHasCompletedOnboarding(false);
      return;
    }

    // Prevent rapid successive checks
    const now = Date.now();
    const lastCheck = lastCheckRef.current;
    if (lastCheck.userId === user.id && now - lastCheck.timestamp < 2000) { // Increased to 2s
      console.log('🔄 Skipping rapid onboarding check');
      setIsLoading(false); // Ensure loading stops
      return;
    }

    try {
      setIsLoading(true);
      
      // Use a single query with error handling
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single(); // Use single() instead of maybeSingle()

      if (error) {
        console.error('Onboarding check error:', error);
        // Defensive: If profile is missing (PGRST116), force logout and redirect
        if (error.code === 'PGRST116') {
          await supabase.auth.signOut();
          localStorage.clear();
          sessionStorage.clear();
          setTimeout(() => {
            window.location.href = '/auth';
          }, 300);
          return;
        }
        // Only retry on network errors, not data errors
        if (error.code !== 'PGRST116' && retryCount < 2) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            checkOnboardingStatus();
          }, 1000);
          return;
        }
        
        // Assume not completed on persistent errors
        setHasCompletedOnboarding(false);
        setIsLoading(false);
        return;
      }

      const onboardingCompleted = profile?.onboarding_completed === true;
      
      // Update tracking BEFORE state to prevent loops
      lastCheckRef.current = {
        userId: user.id,
        timestamp: now,
        result: onboardingCompleted
      };
      
      console.log('📊 Onboarding Status:', {
        userId: user.id,
        completed: onboardingCompleted,
        timestamp: new Date().toISOString().substr(11, 8) // Just time, not full timestamp
      });

      setHasCompletedOnboarding(onboardingCompleted);
      setRetryCount(0);
      
    } catch (error) {
      console.error('Error checking onboarding:', error);
      setHasCompletedOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id, retryCount]); // Removed subscription.isActive

  const refetch = useCallback(async () => {
    console.log('[useOnboardingStatus] Manual refetch called');
    await checkOnboardingStatus();
  }, [checkOnboardingStatus]);

  // REPLACE this effect:
  useEffect(() => {
    setRetryCount(0);
    checkOnboardingStatus();
  }, [isAuthenticated, user?.id]); // REMOVED extra dependencies that caused loops

  // Safety net for a hung Supabase response. We deliberately do NOT flip
  // `hasCompletedOnboarding` to false here — the previous behavior silently
  // kicked authenticated users out of the protected shell mid-session
  // (the "1-second bounce from Closet → Scan" symptom in user reports).
  // Instead, we log a warning and surface `loadHung` so AppRoutes / callers
  // can decide whether to keep showing the shell or escalate.
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('⚠️ Onboarding status check timed out after 5s — keeping last known status');
        setIsLoading(false);
        setLoadHung(true);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [isLoading]);

  return {
    isLoading,
    hasCompletedOnboarding,
    checkOnboardingStatus,
    retryCount,
    loadHung,
    refetch,
  };
}