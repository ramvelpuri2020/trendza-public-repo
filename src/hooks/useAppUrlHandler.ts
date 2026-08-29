import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { supabase } from '@/integrations/supabase/client';

export const useAppUrlHandler = () => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleAppUrlOpen = async (data: { url: string }) => {
      console.log('Deep link received:', data.url);
      
      // Check if this is an auth callback
      if (data.url.includes('auth/callback')) {
        try {
          console.log('Processing auth callback...');
          
          // Extract URL fragment (everything after #)
          const url = new URL(data.url);
          const fragment = url.hash.substring(1); // Remove the #
          const params = new URLSearchParams(fragment);
          
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          
          if (accessToken && refreshToken) {
            console.log('Setting Supabase session...');
            
            const { data: sessionData, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (error) {
              console.error('Error setting session:', error);
            } else {
              console.log('Authentication successful!');
              
              // CRITICAL FIX: Don't close browser immediately
              // Instead, add a delay and let the auth state propagate first
              setTimeout(async () => {
                try {
                  await Browser.close();
                  console.log('Browser closed after delay');
                } catch (closeError) {
                  console.log('Browser close failed (might already be closed):', closeError);
                }
              }, 1500); // Give time for auth state to propagate
            }
          } else {
            console.error('Missing tokens in callback');
            // Don't close browser on error - let user see what happened
          }
        } catch (error) {
          console.error('Error handling auth deep link:', error);
          // Don't close browser on error
        }
      }
    };

    // Listen for app URL opens (deep links)
    console.log('Setting up deep link listener...');
    App.addListener('appUrlOpen', handleAppUrlOpen);

    return () => {
      console.log('Cleaning up deep link listener...');
      App.removeAllListeners();
    };
  }, []);
}; 