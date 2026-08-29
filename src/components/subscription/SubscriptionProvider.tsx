import { createContext, useContext, ReactNode, useRef, useCallback, useMemo } from 'react';
import { useRevenueCatManager, SubscriptionStatus } from '@/hooks/useRevenueCatManager';
import { PurchasesPackage } from '@revenuecat/purchases-capacitor';

interface SubscriptionContextType {
  isPro: boolean;
  isLoading: boolean;
  expirationDate: Date | null;
  checkSubscription: () => Promise<boolean>;
  refreshSubscription: () => Promise<void>;
  purchaseProduct: (product: PurchasesPackage['product']) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  offerings: any[];
  subscription: SubscriptionStatus;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  isPro: false,
  isLoading: true,
  expirationDate: null,
  checkSubscription: async () => false,
  refreshSubscription: async () => {},
  purchaseProduct: async () => false,
  restorePurchases: async () => false,
  offerings: [],
  subscription: {
    isActive: false,
    expirationDate: null,
    productId: null,
    offeringId: null
  }
});

export const useSubscription = () => useContext(SubscriptionContext);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider = ({ children }: SubscriptionProviderProps) => {
  // Always declare all hooks at the top level
  const lastRefreshRef = useRef<Date | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isLoading,
    subscription,
    offerings,
    purchaseProduct,
    restorePurchases,
    refreshSubscription: refreshRevenueCat
  } = useRevenueCatManager();

  const checkSubscription = useCallback(async (): Promise<boolean> => {
    await refreshRevenueCat();
    return subscription.isActive;
  }, [refreshRevenueCat, subscription.isActive]);

  const refreshSubscriptionStatus = useCallback(async (): Promise<void> => {
    // Debounce refresh calls
    const now = new Date();
    if (lastRefreshRef.current && now.getTime() - lastRefreshRef.current.getTime() < 1000) {
      return;
    }
    
    lastRefreshRef.current = now;
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    refreshTimeoutRef.current = setTimeout(async () => {
      await refreshRevenueCat();
      lastRefreshRef.current = null;
      refreshTimeoutRef.current = null;
    }, 1000);
  }, [refreshRevenueCat]);

  const value = useMemo(() => ({
    isPro: subscription.isActive,
    isLoading,
    expirationDate: subscription.expirationDate,
    checkSubscription,
    refreshSubscription: refreshSubscriptionStatus,
    purchaseProduct,
    restorePurchases,
    offerings,
    subscription
  }), [
    subscription.isActive,
    subscription.expirationDate,
    isLoading,
    checkSubscription,
    refreshSubscriptionStatus,
    purchaseProduct,
    restorePurchases,
    offerings,
    subscription
  ]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
