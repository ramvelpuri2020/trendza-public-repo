import { useState, useEffect, useCallback, useRef } from 'react';
import { Purchases, PurchasesOffering, PurchasesPackage, CustomerInfo } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { REVENUECAT_CONFIG } from '@/config/revenueCat';

export type SubscriptionStatus = {
  isActive: boolean;
  expirationDate: Date | null;
  productId: string | null;
  offeringId: string | null;
};

export const useRevenueCatManager = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [offerings, setOfferings] = useState<PurchasesOffering[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    isActive: false,
    expirationDate: null,
    productId: null,
    offeringId: null,
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const hasInitialized = useRef(false);
  const lastPurchaseAttempt = useRef<Date | null>(null);

  const fetchSubscriptionStatus = useCallback(async () => {
    if (!user) {
      return { isActive: false, expirationDate: null, productId: null, offeringId: null };
    }

    try {
      if (Capacitor.isNativePlatform()) {
        if (!hasInitialized.current) {
          return subscription;
        }
        const { customerInfo } = await Purchases.getCustomerInfo();
        const isPro = Boolean(customerInfo.entitlements.active?.[REVENUECAT_CONFIG.ENTITLEMENT_IDENTIFIER]?.isActive);
        
        const newStatus = {
          isActive: isPro,
          expirationDate: subscription.expirationDate,
          productId: subscription.productId,
          offeringId: subscription.offeringId
        };
        
        setSubscription(newStatus);
        return newStatus;
      } else {
        // Web platform - check Supabase for subscription status
        // Add retry mechanism for newly created users
        let profile = null;
        let error = null;
        
        // Try up to 3 times with a small delay for newly created users
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const result = await supabase
              .from('profiles')
              .select('subscription_status, subscription_expires_at')
              .eq('id', user.id)
              .limit(1);
            
            profile = result.data?.[0] || null;
            error = result.error;
            
            if (!error && profile) {
              break; // Success, exit retry loop
            }
            
            if (attempt < 3) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          } catch (e) {
            error = e;
            if (attempt < 3) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        }

        if (error) {
          console.warn('Profile query failed after retries, user might not have profile yet:', error);
          // Return default inactive status if profile doesn't exist yet
          const newStatus = {
            isActive: false,
            expirationDate: null,
            productId: subscription.productId,
            offeringId: 'web'
          };
          setSubscription(newStatus);
          return newStatus;
        }

        const newStatus = {
          isActive: profile?.subscription_status === 'active',
          expirationDate: profile?.subscription_expires_at ? new Date(profile.subscription_expires_at) : null,
          productId: subscription.productId,
          offeringId: 'web'
        };

        setSubscription(newStatus);
        return newStatus;
      }
    } catch (error) {
      console.error('fetchSubscriptionStatus failed:', error);
      return subscription;
    }
  }, [user?.id]); // FIXED: Only depend on user.id, not the entire subscription object

  const refreshSubscription = useCallback(async () => {
    await fetchSubscriptionStatus();
  }, [fetchSubscriptionStatus]);

  const purchaseProduct = useCallback(async (productOrPackage: PurchasesPackage | PurchasesPackage['product']) => {
    if (!user) return false;

    // Prevent rapid purchase attempts
    if (lastPurchaseAttempt.current) {
      const timeSinceLastAttempt = Date.now() - lastPurchaseAttempt.current.getTime();
      if (timeSinceLastAttempt < 2000) { // 2 seconds
        toast({ 
          title: "Please Wait", 
          description: "Please wait a moment before trying again." 
        });
        return false;
      }
    }
    lastPurchaseAttempt.current = new Date();

    if (!Capacitor.isNativePlatform()) {
      try {
        setIsLoading(true);
        
        // Show payment confirmation dialog
        const confirmed = window.confirm(
          'This is a web demo. In production, this would open a payment flow. Would you like to simulate a successful payment?'
        );
        
        if (!confirmed) {
          toast({ 
            title: "Payment Cancelled", 
            description: "You can try again anytime." 
          });
          return false;
        }
        
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7); // 7 days trial

        const newSubscription = {
          isActive: true,
          expirationDate: expiryDate,
          // Web simulation may be called without a real RevenueCat
          // product object (the ProOfferCard CTA fires the simulation
          // path with no argument). Fall back to a stable identifier
          // so the rest of the flow can run end-to-end in the dev demo.
          productId: product?.identifier ?? 'web-simulation-product',
          offeringId: 'web-simulation'
        };
        
        // Update Supabase profile
        const { error: profileError } = await supabase.from('profiles').update({
          onboarding_completed: true,
          subscription_status: 'active',
          subscription_expires_at: expiryDate.toISOString()
        }).eq('id', user.id);

        if (profileError) {
          console.error('Supabase profile update failed:', profileError);
          throw profileError;
        }
        
        setSubscription(newSubscription);
        toast({ 
          title: "Welcome to Pro! 🎉", 
          description: "Your subscription is now active." 
        });
        return true;
      } catch (error: any) {
        console.error('Web purchase simulation failed:', error);
        
        // Handle specific error types
        if (error.message?.includes('network') || error.message?.includes('timeout')) {
          toast({ 
            variant: "destructive", 
            title: "Network Error", 
            description: "Please check your internet connection and try again." 
          });
        } else if (error.message?.includes('profile') || error.message?.includes('database') || error.message?.includes('auth')) {
          toast({ 
            variant: "destructive", 
            title: "Save Error", 
            description: "Payment succeeded but failed to save. Please contact support." 
          });
        } else {
          toast({ 
            variant: "destructive", 
            title: "Payment Failed", 
            description: "Please try again or contact support if the issue persists." 
          });
        }
        return false;
      } finally {
        setIsLoading(false);
      }
    }

    // Native iOS RevenueCat flow
    if (!hasInitialized.current) {
      // RevenueCat not initialized
      toast({ 
        variant: "destructive", 
        title: "Payment System Not Ready", 
        description: "Please wait a moment and try again." 
      });
      return false;
    }

    try {
      setIsLoading(true);

      // The paywall passes a full `PurchasesPackage` (from getOfferings),
      // while other callers may pass a bare store product. Route to the
      // matching RevenueCat API — `purchasePackage` for packages,
      // `purchaseStoreProduct` for products. Passing the wrong shape to
      // either call makes the native SDK fail to resolve a purchasable
      // item, which surfaces as a dead/"slow" payment.
      const isPackage =
        !!productOrPackage &&
        typeof productOrPackage === 'object' &&
        'product' in productOrPackage &&
        !!(productOrPackage as PurchasesPackage).product;

      const result = isPackage
        ? await Purchases.purchasePackage({ aPackage: productOrPackage as PurchasesPackage })
        : await Purchases.purchaseStoreProduct({ product: productOrPackage as PurchasesPackage['product'] });

      
      // Validate the purchase was actually completed. The entitlement on
      // the purchase result is *usually* fresh, but the store can lag a
      // beat behind the SDK's snapshot — so if it doesn't show up yet,
      // re-check with a fresh `getCustomerInfo()` before ever telling the
      // user their (successful) payment failed.
      const isEntitlementActive = (ci: CustomerInfo) =>
        Boolean(ci.entitlements.active?.[REVENUECAT_CONFIG.ENTITLEMENT_IDENTIFIER]?.isActive);

      let isPro = isEntitlementActive(result.customerInfo);
      if (!isPro) {
        try {
          const { customerInfo } = await Purchases.getCustomerInfo();
          isPro = isEntitlementActive(customerInfo);
        } catch {
          // Post-purchase refresh failed — proceed with what we have
        }
      }
      
      if (isPro) {
        await finalizeProPurchase(
          result.customerInfo,
          (productOrPackage as any)?.identifier ?? null
        );
        return true;
      } else {
        toast({ 
          variant: "destructive", 
          title: "Purchase Validation Failed", 
          description: "Please try again or contact support." 
        });
        return false;
      }
      
    } catch (error: any) {
      // Native purchase failed. RevenueCat sometimes rejects AFTER the store has completed the
      // transaction (e.g. it failed to sync the receipt to its backend,
      // or the purchase promise rejected on a transient error). Before
      // showing a failure toast, check whether the user now actually
      // holds the entitlement — if they do, treat it as a success so we
      // never report a charged purchase as failed.
      try {
        const { customerInfo } = await Purchases.getCustomerInfo();
        const isEntitlementActive = (ci: CustomerInfo) =>
          Boolean(ci.entitlements.active?.[REVENUECAT_CONFIG.ENTITLEMENT_IDENTIFIER]?.isActive);
        if (isEntitlementActive(customerInfo)) {
          await finalizeProPurchase(customerInfo, (productOrPackage as any)?.identifier ?? null);
          return true;
        }        } catch {
          // Recovery check failed — fall through to error toasts
        }
      
      // Handle specific RevenueCat error types
      if (error.message?.includes('cancelled') || error.code === 'PURCHASES_ERROR_PURCHASE_CANCELLED') {
        toast({ 
          title: "Payment Cancelled", 
          description: "You can try again anytime." 
        });
      } else if (error.message?.includes('already active') || error.message?.includes('already subscribed')) {
        toast({ 
          title: "Subscription Already Active", 
          description: "You already have an active subscription!" 
        });
        await fetchSubscriptionStatus();
        return true;
      } else if (error.message?.includes('429') || error.message?.includes('rate limit')) {
        toast({ 
          variant: "destructive", 
          title: "Too Many Requests", 
          description: "Please wait a moment and try again." 
        });
      } else if (error.message?.includes('network') || error.message?.includes('timeout') || error.message?.includes('connection')) {
        toast({ 
          variant: "destructive", 
          title: "Network Error", 
          description: "Please check your internet connection and try again." 
        });
      } else if (error.message?.includes('payment') || error.message?.includes('billing')) {
        toast({ 
          variant: "destructive", 
          title: "Payment Issue", 
          description: "There was an issue with your payment method. Please try again." 
        });
      } else {
        toast({ 
          variant: "destructive", 
          title: "Purchase Failed", 
          description: "Please try again or contact support if the issue persists." 
        });
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast, fetchSubscriptionStatus, user]);

  /**
   * Shared success path for a confirmed Pro purchase: mirror the
   * entitlement into the Supabase profile, update local subscription
   * state, and celebrate. Called both from the normal purchase flow and
   * from the error-recovery path (purchase completed but the SDK threw).
   */
  const finalizeProPurchase = async (
    customerInfo: CustomerInfo,
    productId: string | null
  ): Promise<void> => {
    // Update Supabase profile
    const { error: profileError } = await supabase.from('profiles').update({
      onboarding_completed: true,
      subscription_status: 'active',
      subscription_expires_at: customerInfo.latestExpirationDate
        ? new Date(customerInfo.latestExpirationDate).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days fallback
    }).eq('id', user.id);

    if (profileError) {
      console.error('Failed to update profile after purchase:', profileError);
    }

    setSubscription({
      isActive: true,
      expirationDate: customerInfo.latestExpirationDate
        ? new Date(customerInfo.latestExpirationDate)
        : null,
      productId,
      offeringId: null,
    });

    toast({ 
      title: "Welcome to Pro! 🎉", 
      description: "Your subscription is now active!" 
    });
  };

  const restorePurchases = useCallback(async () => {
    if (!user) return false;

    if (!Capacitor.isNativePlatform()) {
      try {
        setIsLoading(true);
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_status, subscription_expires_at')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.subscription_status === 'active') {
          toast({ 
            title: "Subscription Active", 
            description: "Your Pro subscription is already active." 
          });
          return true;
        }

        toast({ 
          title: "No Active Subscription", 
          description: "We couldn't find any active subscriptions." 
        });
        return false;
      } catch (error: any) {
  
        
        if (error.message?.includes('network') || error.message?.includes('timeout')) {
          toast({ 
            variant: "destructive", 
            title: "Network Error", 
            description: "Please check your internet connection and try again." 
          });
        } else {
          toast({ 
            variant: "destructive", 
            title: "Restore Failed", 
            description: "Please try again or contact support." 
          });
        }
        return false;
      } finally {
        setIsLoading(false);
      }
    }

    if (!hasInitialized.current) {
      toast({ 
        variant: "destructive", 
        title: "System Not Ready", 
        description: "Please wait a moment and try again." 
      });
      return false;
    }

    try {
      setIsLoading(true);
      const { customerInfo } = await Purchases.restorePurchases();
      const isPro = Boolean(customerInfo.entitlements.active?.[REVENUECAT_CONFIG.ENTITLEMENT_IDENTIFIER]?.isActive);

      if (isPro) {
        toast({ 
          title: "Purchases Restored!", 
          description: "Your Pro subscription has been restored." 
        });
        await fetchSubscriptionStatus();
        return true;
      } else {
        toast({ 
          title: "No Purchases Found", 
          description: "We couldn't find any previous subscriptions to restore." 
        });
        return false;
      }
    } catch (error: any) {
      
      // Handle specific error types
      if (error.message?.includes('429') || error.message?.includes('rate limit')) {
        toast({ 
          variant: "destructive", 
          title: "Too Many Requests", 
          description: "Please wait a moment and try again." 
        });
      } else if (error.message?.includes('network') || error.message?.includes('timeout') || error.message?.includes('connection')) {
        toast({ 
          variant: "destructive", 
          title: "Network Error", 
          description: "Please check your internet connection and try again." 
        });
      } else {
        toast({ 
          variant: "destructive", 
          title: "Restore Failed", 
          description: "Unable to restore purchases. Please try again or contact support." 
        });
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast, fetchSubscriptionStatus, user]);

  useEffect(() => {
    if (!user) {
      setSubscription({
        isActive: false,
        expirationDate: null,
        productId: null,
        offeringId: null
      });
      return;
    }

    if (hasInitialized.current) {
      return;
    }
    
    const init = async () => {
      setIsLoading(true);
      try {
        if (!Capacitor.isNativePlatform()) {
          // Web platform initialization
          const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_status, subscription_expires_at')
            .eq('id', user.id)
            .maybeSingle();

          setSubscription({
            isActive: profile?.subscription_status === 'active',
            expirationDate: profile?.subscription_expires_at ? new Date(profile.subscription_expires_at) : null,
            productId: null,
            offeringId: 'web'
          });
          
          hasInitialized.current = true;
          return;
        }

        // Fetch the SDK public key. It's cached in Preferences after the
        // first successful fetch so later launches skip the Supabase
        // edge-function round trip (and its cold-start latency) entirely.
        // The key is RevenueCat's PUBLIC SDK key, so caching it on device
        // is safe — it's the same value shipped inside a native app binary.
        const KEY_CACHE = 'revenuecat_public_key';
        let publicKey: string | null = null;
        try {
          publicKey = (await Preferences.get({ key: KEY_CACHE })).value ?? null;
        } catch {
          publicKey = null;
        }
        if (!publicKey) {
          const { data, error } = await supabase.functions.invoke('revenuecat-config');
          if (error || !data?.publicKey) {
            throw new Error('No API key');
          }
          publicKey = data.publicKey as string;
          Preferences.set({ key: KEY_CACHE, value: publicKey }).catch(() => {});
        }

        // First configure RevenueCat
        await Purchases.configure({
          apiKey: publicKey,
          appUserID: null // Required by type definition
        });

        // Then explicitly log in the user to switch to their account.
        // `logIn` already returns the user's customerInfo, so the separate
        // `getCustomerInfo()` round trip is dropped, and offerings are
        // fetched in PARALLEL with the login — both only depend on
        // `configure`, so waiting on them sequentially just burns time.
        // This turns the old 5-hop serial init chain into ~3 hops with the
        // two slowest calls running at once.
        const [loginResult, offeringsResult] = await Promise.all([
          Purchases.logIn({ appUserID: user.id }).then(
            (r) => r,
            (err) => {
              return null; // Login failed — continue without user identity
            }
          ),
          Purchases.getOfferings().then(
            (r) => r,
            (err) => {
              return null; // Offerings fetch failed — continue with empty offerings
            }
          ),
        ]);

        const customerInfo = loginResult?.customerInfo ?? null;
        const isPro = Boolean(
          customerInfo?.entitlements.active?.[REVENUECAT_CONFIG.ENTITLEMENT_IDENTIFIER]?.isActive
        );

        setSubscription({
          isActive: isPro,
          expirationDate: null,
          productId: null,
          offeringId: null
        });

        hasInitialized.current = true;

        if (offeringsResult) {
          setOfferings(Object.values(offeringsResult.all || {}));
        }
      } catch (error) {
        setSubscription({
          isActive: false,
          expirationDate: null,
          productId: null,
          offeringId: null
        });
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [user]);

  return {
    subscription,
    isLoading,
    offerings,
    purchaseProduct,
    restorePurchases,
    refreshSubscription
  };
};