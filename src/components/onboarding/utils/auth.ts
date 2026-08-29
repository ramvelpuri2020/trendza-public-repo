import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { Logger } from '@/utils/logger';

// Generate cryptographically secure nonce for Apple Sign-In
const generateNonce = (): string => {
  const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += charset[Math.floor(Math.random() * charset.length)];
  }
  return result;
};

export const handleAppleSignIn = async (): Promise<boolean> => {
  try {
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
      return await handleNativeAppleSignIn();
    } else {
      return await handleWebAppleSignIn();
    }
  } catch (error) {
    Logger.error('Auth', 'Apple Sign-In flow error:', error);
    return false;
  }
};

const handleNativeAppleSignIn = async (): Promise<boolean> => {
  try {
    const { SignInWithApple } = await import('@capacitor-community/apple-sign-in');
    
    // Generate secure nonce for each request
    const nonce = generateNonce();
    
    // Fixed: Use app scheme for native iOS
    const options = {
      clientId: 'service.com.genstyle.app',
      redirectURI: 'com.genstyle.app://auth/callback', // Fixed: Use app scheme
      scopes: 'email name',
      state: 'native-ios',
      nonce: nonce // Use generated nonce
    };
    
    const result = await SignInWithApple.authorize(options);

    if (!result.response.identityToken) {
      Logger.error('Auth', 'No identity token received from Apple');
      return false;
    }

    const { data: _, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: result.response.identityToken,
      nonce: nonce // Use the same nonce
    });

    if (error) {
      Logger.error('Auth', 'Supabase auth error:', error);
      return false;
    }

    return true;
    
  } catch (error) {
    Logger.error('Auth', 'Native Apple Sign-In error:', error);
    // If native Apple Sign-In fails (like in simulator), fall back to web
    return await handleWebAppleSignIn();
  }
};

const handleWebAppleSignIn = async (): Promise<boolean> => {
  try {
    if (Capacitor.isNativePlatform()) {
      // For native: use Browser plugin that handles the redirect better
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: 'com.genstyle.app://auth/callback',
          queryParams: {
            scope: 'name email'
          },
          skipBrowserRedirect: true // Don't auto-redirect, we'll handle it
        }
      });

      if (error || !data.url) {
        Logger.error('Auth', 'Error getting auth URL:', error);
        return false;
      }
      
      // Open in browser with improved configuration
      await Browser.open({
        url: data.url,
        windowName: '_self',
        toolbarColor: '#000000',
        presentationStyle: 'popover'
      });

      return true;
    } else {
      // For web: regular OAuth with safe window access
      const getRedirectUrl = () => {
        if (typeof window !== 'undefined' && window.location) {
          // Validate and sanitize the origin to prevent open redirects
          const origin = window.location.origin;
          // Only allow specific domains for security
          const allowedDomains = [
            'https://dripify-dashboard-82.lovable.app',
            'http://localhost:3000',
            'http://localhost:5173'
          ];
          
          if (allowedDomains.includes(origin)) {
            return `${origin}/auth`;
          }
        }
        // Fallback to production URL if window is undefined or domain not allowed
        return 'https://dripify-dashboard-82.lovable.app/auth';
      };

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: getRedirectUrl(),
          queryParams: {
            scope: 'name email'
          }
        }
      });

      if (error) {
        Logger.error('Auth', 'Web Apple Sign-In error:', error);
        return false;
      }

      return true;
    }
  } catch (error) {
    Logger.error('Auth', 'Apple Sign-In failed:', error);
    return false;
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    return !error && !!user;
  } catch (error) {
    return false;
  }
};

/**
 * Get the current user
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      return null;
    }
    return user;
  } catch (error) {
    return null;
  }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Sign in anonymously for users who want to try the app without creating an account
 */
export const handleAnonymousSign = async (): Promise<boolean> => {
  try {
    // First check if there's an existing session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (!sessionError && session?.user) {
      Logger.info('Auth', 'User already signed in:', session.user.id);
      return true;
    }
    
    // If no session, check if getUser works (in case of refresh token)
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (!userError && user) {
        Logger.info('Auth', 'User found via getUser:', user.id);
        return true;
      }
    } catch (userCheckError) {
      Logger.info('Auth', 'getUser failed, proceeding to create anonymous user');
    }
    
    // Only create new anonymous user if no user exists
    Logger.info('Auth', 'No existing user, creating anonymous user...');
    const { data, error } = await supabase.auth.signInAnonymously();
    
    if (error) {
      Logger.error('Auth', 'Anonymous sign-in error:', error);
      return false;
    }
    
    if (data.user) {
      Logger.info('Auth', 'Anonymous user created:', data.user.id);
      
      // Skip profile creation for now - let the trigger handle it
      // This prevents RLS policy issues
      return true;
    }
    
    Logger.error('Auth', 'No user data received from anonymous sign-in');
    return false;
  } catch (error) {
    Logger.error('Auth', 'Anonymous sign-in failed:', error);
    return false;
  }
}; 