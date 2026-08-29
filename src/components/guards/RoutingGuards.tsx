import React, { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface GuardProps {
  children: ReactNode;
}

interface AuthGuardProps extends GuardProps {
  fallback?: ReactNode;
  redirectTo?: string;
}

// ============================================================================
// Loading Component
// ============================================================================

const GuardLoadingScreen: React.FC<{ message?: string }> = ({ message = "Loading..." }) => (
  <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-white animate-spin mx-auto mb-4" />
      <p className="text-white/80 text-lg">{message}</p>
    </div>
  </div>
);

// ============================================================================
// Error Component
// ============================================================================

const GuardErrorScreen: React.FC<{ 
  title: string; 
  message: string; 
  onRetry?: () => void;
  onFallback?: () => void;
  fallbackLabel?: string;
}> = ({ title, message, onRetry, onFallback, fallbackLabel = "Go to Auth" }) => (
  <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-blue-900 flex items-center justify-center p-4">
    <Card className="bg-black/50 backdrop-blur-xl border-red-500/30 max-w-md w-full">
      <CardContent className="p-8 text-center">
        <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-gray-300 mb-6">{message}</p>
        
        <div className="space-y-3">
          {onRetry && (
            <Button 
              onClick={onRetry}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
          
          {onFallback && (
            <Button 
              onClick={onFallback}
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              {fallbackLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  </div>
);

// ============================================================================
// Simplified Authentication Guard
// ============================================================================

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallback,
  redirectTo = '/auth' 
}) => {
  const { isAuthenticated, isLoading, user, error } = useAuth();
  const location = useLocation();
  const [retryCount, setRetryCount] = useState(0);

  // Handle loading states
  if (isLoading) {
    return null;
  }

  // Handle authentication errors
  if (error && retryCount < 3) {
    return (
      <GuardErrorScreen
        title="Authentication Error"
        message={error.toString()}
        onRetry={() => {
          setRetryCount(prev => prev + 1);
          window.location.reload();
        }}
        onFallback={() => window.location.href = redirectTo}
      />
    );
  }

  // Handle authentication failure
  if (!isAuthenticated || !user) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // User is authenticated
  return <>{children}</>;
};

// ============================================================================
// Simple Protected Route (just checks auth)
// ============================================================================

export const ProtectedRoute: React.FC<GuardProps> = ({ children }) => {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
};

// ============================================================================
// Simple Public Route (redirects if authenticated)
// ============================================================================

export const PublicRoute: React.FC<GuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading while checking auth status
  if (isLoading) {
    return null;
  }

  // Redirect authenticated users to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// ============================================================================
// Export simplified guards
// ============================================================================

export const RequireAuth: React.FC<GuardProps> = ({ children }) => {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
};

export default {
  AuthGuard,
  ProtectedRoute,
  PublicRoute,
  RequireAuth,
}; 