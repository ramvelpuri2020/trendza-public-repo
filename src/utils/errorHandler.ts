import { Logger } from './logger';
import { toast } from '@/hooks/use-toast';

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage?: string,
    public context?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string, context?: string) {
    super(message, 'NETWORK_ERROR', 'Network connection issue. Please check your internet and try again.', context);
    this.name = 'NetworkError';
  }
}

export class AuthError extends AppError {
  constructor(message: string, context?: string) {
    super(message, 'AUTH_ERROR', 'Authentication failed. Please try logging in again.', context);
    this.name = 'AuthError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string, context?: string) {
    const userMessage = field ? `Please check the ${field} field.` : 'Please check your input.';
    super(message, 'VALIDATION_ERROR', userMessage, context);
    this.name = 'ValidationError';
  }
}

export class ApiError extends AppError {
  constructor(message: string, statusCode?: number, context?: string) {
    const userMessage = statusCode === 429 
      ? 'Too many requests. Please wait a moment and try again.'
      : statusCode === 500
      ? 'Server error. Please try again later.'
      : 'Something went wrong. Please try again.';
    
    super(message, 'API_ERROR', userMessage, context);
    this.name = 'ApiError';
  }
}

export const handleError = (error: unknown, context: string, showToast = true) => {
  // Log the error
  if (error instanceof AppError) {
    Logger.error(context, error.message, { code: error.code, context: error.context });
  } else if (error instanceof Error) {
    Logger.error(context, error.message, { stack: error.stack });
  } else {
    Logger.error(context, 'Unknown error', error);
  }

  // Show user-friendly message
  if (showToast) {
    let userMessage = 'An unexpected error occurred.';
    
    if (error instanceof AppError) {
      userMessage = error.userMessage || error.message;
    } else if (error instanceof Error) {
      userMessage = error.message;
    }

    toast({
      title: "Error",
      description: userMessage,
      variant: "destructive",
    });
  }

  return error;
};

export const handleAsyncError = async <T>(
  promise: Promise<T>,
  context: string,
  fallback?: T
): Promise<T> => {
  try {
    return await promise;
  } catch (error) {
    handleError(error, context);
    if (fallback !== undefined) {
      return fallback;
    }
    throw error;
  }
};

// Error boundary helper
export const createErrorBoundary = (context: string) => {
  return (error: Error, errorInfo: any) => {
    Logger.errorWithContext(context, error, {
      componentStack: errorInfo?.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
  };
};

// Rate limiting error handler
export const handleRateLimitError = (context: string) => {
  toast({
    title: "Too Many Requests",
    description: "Please wait a moment before trying again.",
    variant: "destructive",
  });
  Logger.warn(context, 'Rate limit exceeded');
};

// Network error handler
export const handleNetworkError = (context: string) => {
  toast({
    title: "Network Error",
    description: "Please check your internet connection and try again.",
    variant: "destructive",
  });
  Logger.error(context, 'Network connection failed');
}; 