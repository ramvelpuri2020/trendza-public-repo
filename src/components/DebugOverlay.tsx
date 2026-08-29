import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import { useSubscription } from './subscription/SubscriptionProvider';
import { useNavigate } from 'react-router-dom';

export const DebugOverlay = () => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { hasCompletedOnboarding, isLoading: onboardingLoading, retryCount } = useOnboardingStatus();
  const { isPro, isLoading: subscriptionLoading } = useSubscription();

  useEffect(() => {
    // Show debug overlay if there are issues
    const timeout = setTimeout(() => {
      if (authLoading || onboardingLoading || subscriptionLoading) {
        setIsVisible(true);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [authLoading, onboardingLoading, subscriptionLoading]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded text-xs max-w-xs z-50">
      <div className="font-bold mb-2">🔍 Debug Info</div>
      
      <div className="space-y-1 mb-3">
        <div>Auth: {authLoading ? '🔄 Loading' : isAuthenticated ? '✅ Yes' : '❌ No'}</div>
        <div>User: {user ? `✅ ${user.email}` : '❌ None'}</div>
        <div>Onboarding: {onboardingLoading ? '🔄 Loading' : hasCompletedOnboarding ? '✅ Complete' : '❌ Incomplete'}</div>
        <div>Subscription: {subscriptionLoading ? '🔄 Loading' : isPro ? '✅ Pro' : '❌ Free'}</div>
        <div>Retry Count: {retryCount}</div>
        <div>Path: {window.location.pathname}</div>
      </div>

      <div className="space-y-1">
        <button 
          onClick={() => navigate('/dashboard')}
          className="block w-full text-left hover:bg-white/10 p-1 rounded text-xs"
        >
          → Dashboard
        </button>
        <button 
          onClick={() => navigate('/auth')}
          className="block w-full text-left hover:bg-white/10 p-1 rounded text-xs"
        >
          → Auth
        </button>
      </div>
    </div>
  );
}; 