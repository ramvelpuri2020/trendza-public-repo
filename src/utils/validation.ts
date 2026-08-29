
import DOMPurify from 'dompurify';

export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span'],
    ALLOWED_ATTR: []
  });
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

export const validateImageFile = (file: File): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (file.size > maxSize) {
    errors.push('Image must be smaller than 10MB');
  }
  
  if (!allowedTypes.includes(file.type)) {
    errors.push('Only JPEG, PNG, and WebP images are allowed');
  }
  
  return { isValid: errors.length === 0, errors };
};

// Rate limiter for analysis requests
const analysisRequestStore = new Map<string, { count: number; resetTime: number }>();

export const analysisRateLimiter = (userId: string): { allowed: boolean; retryAfter?: number } => {
  const now = Date.now();
  const key = `analysis_${userId}`;
  const maxRequests = 5;
  const windowMs = 60000; // 1 minute
  
  const entry = analysisRequestStore.get(key);
  
  // Reset window if expired
  if (!entry || now > entry.resetTime) {
    analysisRequestStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    return { allowed: true };
  }
  
  // Check limit
  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000)
    };
  }
  
  // Increment count
  entry.count++;
  return { allowed: true };
};
