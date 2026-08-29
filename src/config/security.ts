
// Security configuration for the application
export const SECURITY_CONFIG = {
  // File upload restrictions
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  
  // Rate limiting
  ANALYSIS_RATE_LIMIT: {
    maxRequests: 5,
    timeWindow: 60000 // 1 minute
  },
  
  UPLOAD_RATE_LIMIT: {
    maxRequests: 10,
    timeWindow: 60000 // 1 minute
  },
  
  // Session security
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  
  // Temporary account settings
  TEMP_ACCOUNT_PREFIX: 'temp_',
  TEMP_EMAIL_DOMAIN: '@temp.dripmax.app',
  
  // Content Security
  MAX_USERNAME_LENGTH: 50,
  MIN_USERNAME_LENGTH: 3,
  ALLOWED_USERNAME_PATTERN: /^[a-zA-Z0-9_-]+$/,
  
  // API Security
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  
  // Database query limits
  MAX_QUERY_LIMIT: 100,
  DEFAULT_QUERY_LIMIT: 20,
};

// Security headers for API responses
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

// Secure default values
export const SECURE_DEFAULTS = {
  userAvatar: '/placeholder.svg',
  defaultUsername: () => `User${Math.floor(Math.random() * 10000)}`,
  defaultStylePreference: 'casual',
};
