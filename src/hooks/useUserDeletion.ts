import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Logger } from '@/utils/logger';
import { handleError } from '@/utils/errorHandler';

export const useUserDeletion = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const deleteUserAccount = async () => {
    setIsDeleting(true);

    try {
      Logger.info('UserDeletion', 'Starting account deletion for anonymous user');

      // 1. Clear all localStorage data
      Logger.info('UserDeletion', 'Clearing localStorage');
      localStorage.clear();
      sessionStorage.clear();

      // 2. Clear any cached data
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
          Logger.info('UserDeletion', 'Cache cleared');
        } catch (error) {
          Logger.warn('UserDeletion', 'Could not clear cache', error);
        }
      }

      // 3. Clear IndexedDB if available
      if (window.indexedDB) {
        try {
          const databases = await window.indexedDB.databases();
          await Promise.all(
            databases.map(db => {
              if (db.name) {
                return new Promise((resolve, reject) => {
                  const deleteReq = window.indexedDB.deleteDatabase(db.name!);
                  deleteReq.onsuccess = () => resolve(void 0);
                  deleteReq.onerror = () => reject(deleteReq.error);
                });
              }
              return Promise.resolve(); // Return resolved promise for undefined db.name
            })
          );
          Logger.info('UserDeletion', 'IndexedDB cleared');
        } catch (error) {
          Logger.warn('UserDeletion', 'Could not clear IndexedDB', error);
        }
      }

      // 4. Clear Capacitor storage if on native platform
      if (typeof window !== 'undefined' && 'Capacitor' in window) {
        try {
          const { Capacitor } = await import('@capacitor/core');
          if (Capacitor.isNativePlatform()) {
            const { Preferences } = await import('@capacitor/preferences');
            await Preferences.clear();
            Logger.info('UserDeletion', 'Capacitor storage cleared');
          }
        } catch (error) {
          Logger.warn('UserDeletion', 'Could not clear Capacitor storage', error);
        }
      }

      Logger.info('UserDeletion', 'Account deletion completed successfully');

      // 5. Show success message
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });

      // 6. Redirect to auth page
      setTimeout(() => {
        window.location.href = '/auth';
      }, 1000);

      return true;
    } catch (error) {
      handleError(error, 'UserDeletion:deleteUserAccount');
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteUserAccount,
    isDeleting
  };
}; 