
import { SECURITY_CONFIG } from '@/config/security';

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  blockDurationMs?: number;
}

interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
}

const rateLimitStore = new Map<string, { count: number; resetTime: number; blockedUntil?: number }>();

export const checkRateLimit = (key: string, options: RateLimitOptions): RateLimitResult => {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  
  // Check if blocked
  if (entry?.blockedUntil && now < entry.blockedUntil) {
    return {
      allowed: false,
      retryAfter: Math.ceil((entry.blockedUntil - now) / 1000)
    };
  }
  
  // Reset window if expired
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + options.windowMs
    });
    return { allowed: true };
  }
  
  // Check limit
  if (entry.count >= options.maxRequests) {
    if (options.blockDurationMs) {
      rateLimitStore.set(key, {
        ...entry,
        blockedUntil: now + options.blockDurationMs
      });
      return {
        allowed: false,
        retryAfter: Math.ceil(options.blockDurationMs / 1000)
      };
    }
    return {
      allowed: false,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000)
    };
  }
  
  // Increment count
  entry.count++;
  return { allowed: true };
};

export const sanitizeTextInput = (input: string): string => {
  if (!input) return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML chars
    .substring(0, SECURITY_CONFIG.MAX_USERNAME_LENGTH);
};

export const validateEmail = (email: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!email) {
    errors.push('Email is required');
    return { isValid: false, errors };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('Please enter a valid email address');
  }
  
  if (email.length > 320) {
    errors.push('Email address is too long');
  }
  
  return { isValid: errors.length === 0, errors };
};

export const validateFileUpload = (file: File): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (file.size > SECURITY_CONFIG.MAX_FILE_SIZE) {
    errors.push(`File must be smaller than ${SECURITY_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }
  
  if (!SECURITY_CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)) {
    errors.push('Only JPEG, PNG, and WebP images are allowed');
  }
  
  return { isValid: errors.length === 0, errors };
};

export const sanitizeUserMetadata = (metadata: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {};
  
  Object.entries(metadata).forEach(([key, value]) => {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeTextInput(value);
    } else if (typeof value === 'boolean' || typeof value === 'number') {
      sanitized[key] = value;
    }
  });
  
  return sanitized;
};
