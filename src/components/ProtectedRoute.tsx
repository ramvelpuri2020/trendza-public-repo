import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';

interface ProtectedRouteProps {
  children: ReactNode;
  requiresOnboarding?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  requiresOnboarding = true 
}: ProtectedRouteProps) => {
  const { isLoading: authLoading, isAuthenticated, user } = useAuth();
  const { isLoading: onboardingLoading, hasCompletedOnboarding } = useOnboardingStatus();
  const location = useLocation();

  // Show nothing while auth or onboarding status is being determined
  if (authLoading || onboardingLoading) {
    return null;
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If onboarding is required and not completed, redirect to onboarding
  if (requiresOnboarding && !hasCompletedOnboarding) {
    return <Navigate to="/auth" replace />;
  }

  // User is authenticated and (if required) has completed onboarding
  return <>{children}</>;
}; 