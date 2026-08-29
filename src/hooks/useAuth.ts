import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface AuthActions {
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearAllStorage: () => Promise<void>;
}

export function useAuth(): AuthState & AuthActions {
  const [authState, setAuthState] = useState<AuthState>({
    session: null,
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null
  });

  // Use ref to track if we've initialized to prevent duplicate updates
  const initializedRef = useRef(false);
  const lastSessionIdRef = useRef<string | null>(null);

  // Consolidated auth initialization - only use onAuthStateChange to prevent duplicate updates
  useEffect(() => {
    let mounted = true;

    // Get initial session
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          setAuthState({
            session: null,
            user: null,
            isLoading: false,
            isAuthenticated: false,
            error: error.message
          });
          return;
        }

        if (session?.user) {
          lastSessionIdRef.current = session.user.id;
          setAuthState({
            session,
            user: session.user,
            isLoading: false,
            isAuthenticated: true,
            error: null
          });
        } else {
          setAuthState({
            session: null,
            user: null,
            isLoading: false,
            isAuthenticated: false,
            error: null
          });
        }
        initializedRef.current = true;
      } catch (error) {
        if (!mounted) return;
        setAuthState({
          session: null,
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: 'Failed to check session'
        });
        initializedRef.current = true;
      }
    };

    // Listen for auth changes - but only update if session actually changed
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;

        // Skip INITIAL_SESSION event if we already initialized
        if (_event === 'INITIAL_SESSION' && initializedRef.current) {
          return;
        }

        // Only update if session actually changed
        const currentSessionId = session?.user?.id || null;
        if (currentSessionId === lastSessionIdRef.current && session?.user) {
          return; // Session hasn't changed, skip update
        }

        lastSessionIdRef.current = currentSessionId;

        if (session?.user) {
          setAuthState(prev => {
            // Only update if state actually changed
            if (prev.user?.id === session.user.id && prev.isAuthenticated) {
              return prev;
            }
            return {
              session,
              user: session.user,
              isLoading: false,
              isAuthenticated: true,
              error: null
            };
          });
        } else {
          setAuthState(prev => {
            // Only update if we were authenticated before
            if (!prev.isAuthenticated) {
              return prev;
            }
            return {
              session: null,
              user: null,
              isLoading: false,
              isAuthenticated: false,
              error: null
            };
          });
        }
      }
    );

    // Initialize auth
    initAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const clearAllStorage = useCallback(async () => {
    console.log('🧹 Clearing ALL storage types...');
    
    try {
      // Clear browser storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear Capacitor native storage on iOS
      if (Capacitor.isNativePlatform()) {
        try {
          const { Preferences } = await import('@capacitor/preferences');
          await Preferences.clear();
          console.log('✅ Capacitor native storage cleared');
        } catch (error) {
          console.log('⚠️ Capacitor Preferences not available, skipping native storage clear');
        }
      }
      
      // Clear any cached data
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // Clear IndexedDB
      if (window.indexedDB) {
        try {
          const databases = await window.indexedDB.databases();
          await Promise.all(
            databases
              .filter(db => db.name)
              .map(db => {
                return new Promise<void>((resolve, reject) => {
                  const deleteReq = window.indexedDB.deleteDatabase(db.name!);
                  deleteReq.onsuccess = () => resolve();
                  deleteReq.onerror = () => reject(deleteReq.error);
                });
              })
          );
        } catch (error) {
          console.warn('Could not clear IndexedDB:', error);
        }
      }
      
      console.log('✅ All storage cleared');
    } catch (error) {
      console.error('❌ Error clearing storage:', error);
    }
  }, []);

  const signOut = useCallback(async () => {
    console.log('🚪 Starting complete sign out...');
    
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Supabase sign out error:', error);
      }
      
      // Clear all storage first
      await clearAllStorage();
      
      // Clear auth state immediately
      setAuthState({
        session: null,
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null
      });
      
      console.log('✅ Complete sign out successful');
      
      // Redirect to welcome screen immediately
      window.location.href = '/auth';
      
    } catch (error) {
      console.error('❌ Sign out error:', error);
      window.location.reload();
    }
  }, [clearAllStorage]);

  const refreshSession = useCallback(async () => {
    try {
      console.log('🔄 Refreshing session...');
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ Error refreshing session:', error);
        setAuthState(prev => ({ ...prev, error: error.message }));
      } else if (session?.user) {
        console.log('✅ Session refreshed for user:', session.user.id);
        setAuthState({
          session,
          user: session.user,
          isLoading: false,
          isAuthenticated: true,
          error: null
        });
      }
    } catch (error) {
      console.error('❌ Error refreshing session:', error);
      setAuthState(prev => ({ ...prev, error: 'Failed to refresh session' }));
    }
  }, []);

  return {
    ...authState,
    signOut,
    refreshSession,
    clearAllStorage
  };
} 