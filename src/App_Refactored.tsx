import React, { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Providers
import { AuthProvider } from "./providers/AuthProvider";
import { ProfileProvider } from "./providers/ProfileProvider";
import { OnboardingProvider } from "./providers/OnboardingProvider";
import { SubscriptionProvider } from "./components/subscription/SubscriptionProvider";

// Guards
import { 
  ProtectedRoute, 
  OnboardingRoute, 
  PublicRoute 
} from "./components/guards/RoutingGuards";

// Error Boundary
import { AuthErrorBoundary } from "./components/auth/AuthErrorBoundary";

// Loading Components
import { LoadingScreen } from "./components/LoadingScreen";

// Lazy loaded components for better performance
const Auth = lazy(() => {
  console.log('🎯 Loading Auth component...');
  return import("./pages/Auth").then(module => {
    console.log('🎯 Auth component loaded successfully');
    return module;
  }).catch(error => {
    console.error('🎯 Error loading Auth component:', error);
    throw error;
  });
});

const Index = lazy(() => {
  console.log('🎯 Loading Index component...');
  return import("./pages/Index").then(module => {
    console.log('🎯 Index component loaded successfully');
    return module;
  }).catch(error => {
    console.error('🎯 Error loading Index component:', error);
    throw error;
  });
});

const Profile = lazy(() => {
  console.log('🎯 Loading Profile component...');
  return import("./pages/Profile").then(module => {
    console.log('🎯 Profile component loaded successfully');
    return module;
  }).catch(error => {
    console.error('🎯 Error loading Profile component:', error);
    throw error;
  });
});

// ============================================================================
// Query Client Configuration
// ============================================================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

// ============================================================================
// Routes Component
// ============================================================================

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/auth" 
        element={
          <PublicRoute>
            <Suspense fallback={<LoadingScreen message="Loading authentication..." />}>
              <Auth />
            </Suspense>
          </PublicRoute>
        } 
      />
      
      {/* Legacy redirects */}
      <Route path="/sign-in" element={<Navigate to="/auth" replace />} />
      <Route path="/sign-out" element={<Navigate to="/auth" replace />} />
      
      {/* Onboarding Routes */}
      <Route 
        path="/onboarding" 
        element={
          <OnboardingRoute>
            <Suspense fallback={<LoadingScreen message="Loading onboarding..." />}>
              <Auth />
            </Suspense>
          </OnboardingRoute>
        } 
      />
      
      {/* Protected Dashboard Routes */}

      
      <Route 
        path="/scan" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingScreen message="Loading scanner..." />}>
              <Index />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      

      
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingScreen message="Loading profile..." />}>
              <Profile />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      
      {/* Root Route */}
      <Route 
        path="/" 
        element={
          <PublicRoute>
            <Navigate to="/scan" replace />
          </PublicRoute>
        } 
      />
      
      {/* Catch-all Route */}
      <Route 
        path="*" 
        element={
          <PublicRoute>
            <Navigate to="/scan" replace />
          </PublicRoute>
        } 
      />
    </Routes>
  );
};

// ============================================================================
// Main App Component
// ============================================================================

const RefactoredApp: React.FC = () => {
  // Add debug functions in development
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Debug function for auth state
      (window as any).debugAuth = () => {
        console.group('🔍 DEBUG: Authentication State');
        console.log('Current URL:', window.location.href);
        console.log('Path:', window.location.pathname);
        console.groupEnd();
      };
      
      // Debug function for profile state
      (window as any).debugProfile = () => {
        console.group('🔍 DEBUG: Profile State');
        console.log('Current URL:', window.location.href);
        console.groupEnd();
      };
      
      // Debug function for onboarding state
      (window as any).debugOnboarding = () => {
        console.group('🔍 DEBUG: Onboarding State');
        console.log('Current URL:', window.location.href);
        console.groupEnd();
      };
      
             // Force navigation functions
       (window as any).forceNavigate = {
         toScan: () => window.location.href = '/scan',
         toAuth: () => window.location.href = '/auth',
         toOnboarding: () => window.location.href = '/onboarding',
         toProfile: () => window.location.href = '/profile',
       };
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthErrorBoundary>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
            <AuthProvider>
              <ProfileProvider>
                <OnboardingProvider>
                  <SubscriptionProvider>
                    <AppRoutes />
                  </SubscriptionProvider>
                </OnboardingProvider>
              </ProfileProvider>
            </AuthProvider>
          </BrowserRouter>
        </AuthErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default RefactoredApp; 