import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { Logger } from "@/utils/logger";
import { handleError } from "@/utils/errorHandler";
import { supabase } from "@/integrations/supabase/client";

// Import onboarding step components
import { WelcomeHeroStep } from "../components/onboarding/steps/WelcomeHeroStep";
import { GenderSelectionStep } from "../components/onboarding/steps/GenderSelectionStep";
import { StyleArchetypeStep } from "../components/onboarding/steps/StyleArchetypeStep";
import { BodyBasicsStep } from "../components/onboarding/steps/BodyBasicsStep";
import { FashionRelationshipStep } from "../components/onboarding/steps/FashionRelationshipStep";
import { SelfieCaptureStep } from "../components/onboarding/steps/SelfieCaptureStep";
import { WardrobeSeedStep } from "../components/onboarding/steps/WardrobeSeedStep";
import { PersonalizingStep } from "../components/onboarding/steps/PersonalizingStep";
import { PaywallVideoStep } from "../components/onboarding/steps/PaywallVideoStep";
import { ProOfferCard } from "../components/onboarding/ProOfferCard";
import { seedDemoWardrobe } from "@/lib/wardrobe-seed";


export const AuthOnboardingWizard = () => {
  // Simple step management for anonymous users
  const stepKey = 'onboarding_step';
  const [step, setStepState] = useState<number>(() => {
    const saved = localStorage.getItem(stepKey);
    return saved ? parseInt(saved, 10) : 1;
  });  const setStep = (n: number) => {
    setStepState(n);
    localStorage.setItem(stepKey, String(n));
  };

  // React Router navigation. We deliberately avoid `window.location.href`
  // here — a full document reload wipes React state and was the root
  // cause of the "free-tier user bounces back into the first paywall"
  // loop. `navigate('/scan')` keeps the React tree alive so the new
  // App.tsx route gate can re-evaluate hasCompletedOnboarding without
  // losing the current component state.
  const navigate = useNavigate();

  // State for onboarding data
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [onboardingData, setOnboardingData] = useState<any>({});


  // Get current user ID (no creation - let NewWelcomeStep handle that)
  const getCurrentUserId = async () => {
    try {
      // If we already have a userId, return it immediately
      if (userId) {
        return userId;
      }

      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.id) {
        // User exists, update state and return
        setUserId(session.user.id);
        return session.user.id;
      }
      
      return null;
    } catch (error) {
      Logger.error('Auth', 'Error getting current user:', error);
      return null;
    }
  };

  // Save onboarding step to modified onboarding_v2 table (single row per user)
  const saveOnboardingStep = async (stepName: string, stepData?: any) => {
    if (!userId) {
      Logger.warn('Auth', `saveOnboardingStep called but userId is null for step: ${stepName}`);
      return false;
    }
    
    Logger.info('Auth', `💾 Saving onboarding step: ${stepName} for user: ${userId}`);
    
    try {
      // Get current data first (handle case where no data exists yet)
      const { data: existingData, error: fetchError } = await supabase
        .from('onboarding_v2')
        .select('step_data')
        .eq('user_id', userId)
        .maybeSingle();

      // Ignore error if no data exists yet (it's fine, we'll create it)
      if (fetchError && fetchError.code !== 'PGRST116') {
        Logger.warn('Auth', 'Error fetching existing data:', fetchError);
      }

      // Merge new step data with existing data (use step_data for now)
      const currentAllData = existingData?.step_data || {};
      const updatedAllData = {
        ...(currentAllData as Record<string, any>),
        [stepName]: stepData || {}
      };

      const { error } = await supabase
        .from('onboarding_v2')
        .upsert({
          user_id: userId,
          step: 'consolidated',
          step_data: updatedAllData,
          current_step: stepName,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (error) throw error;
      
      Logger.info('Auth', `✅ Successfully saved onboarding step: ${stepName}`);
      return true;
    } catch (error) {
      Logger.error('Auth', 'Error saving onboarding step:', error);
      return false;
    }
  };

  // Track user actions in user_analytics table - TRACK EVERY SINGLE STEP
  const trackUserAction = async (action: string, data?: any) => {
    if (!userId) return false;
    
    try {
      const { error } = await supabase
        .from('user_analytics')
        .insert({
          user_id: userId,
          action,
          data: data || {},
          timestamp: new Date().toISOString()
        });

      if (error) throw error;
      
      return true;
    } catch (error) {
      Logger.error('Auth', 'Error tracking user action:', error);
      return false;
    }
  };

  // Initialize user tracking on component mount
  useEffect(() => {
    getCurrentUserId();
  }, []);

  // Track when user reaches paywall step
  useEffect(() => {
    if (step === 9 && userId) {
      trackUserAction('paywall_reached', { step: 9 }).catch(console.error);
    }
  }, [step, userId]);

  // Onboarding handlers
  const handleGender = async (gender: string) => {
    const normalized = gender.toLowerCase();
    setOnboardingData(prev => ({ ...prev, gender: normalized }));
    if (userId) {
      saveOnboardingStep('gender', { gender: normalized }).catch(console.error);
      trackUserAction('gender_selected', { gender: normalized, step: 2 }).catch(console.error);
    }
    setStep(3);
  };

  const handleStyleArchetypes = async (archetypes: string[]) => {
    setOnboardingData(prev => ({ ...prev, style_archetypes: archetypes }));
    if (userId) {
      saveOnboardingStep('style_archetypes', { archetypes }).catch(console.error);
      trackUserAction('style_archetypes_selected', { archetypes, step: 3 }).catch(console.error);
    }
    setStep(4);
  };

  const handleBodyBasics = async (data: { age_range: string; height: string; size: string }) => {
    setOnboardingData(prev => ({ ...prev, ...data }));
    if (userId) {
      saveOnboardingStep('body_basics', data).catch(console.error);
      trackUserAction('body_basics_completed', { ...data, step: 4 }).catch(console.error);
    }
    setStep(5);
  };

  const handleFashionRelationship = async (slug: string) => {
    setOnboardingData(prev => ({ ...prev, fashion_relationship: slug }));
    if (userId) {
      saveOnboardingStep('fashion_relationship', { slug }).catch(console.error);
      trackUserAction('fashion_relationship_selected', { slug, step: 5 }).catch(console.error);
    }
    setStep(6);
  };

  const handlePhotoCapture = async (photoUrl?: string) => {
    if (photoUrl) {
      setOnboardingData(prev => ({ ...prev, selfie_url: photoUrl }));
      if (userId) {
        saveOnboardingStep('selfie_captured', { hasPhoto: true, photo_url: photoUrl }).catch(console.error);
        trackUserAction('selfie_captured', { hasPhoto: true, step: 6 }).catch(console.error);
      }
    } else {
      // Skipped
      if (userId) {
        saveOnboardingStep('selfie_captured', { hasPhoto: false }).catch(console.error);
        trackUserAction('selfie_skipped', { step: 6 }).catch(console.error);
      }
    }
    
    setStep(7); // Go to wardrobe seeding step
  };

  const handleWardrobeSeeding = async (seededItems: string[]) => {
    setOnboardingData(prev => ({ ...prev, wardrobe_seeded_items: seededItems }));
    if (userId) {
      saveOnboardingStep('wardrobe_seeding_completed', { items: seededItems, count: seededItems.length }).catch(console.error);
      trackUserAction('wardrobe_seeding_completed', { count: seededItems.length, step: 7 }).catch(console.error);
    }
    setStep(8);
  };

  const handlePersonalizingComplete = async () => {
    if (userId) {
      saveOnboardingStep('personalization_completed', { completedAt: new Date().toISOString() }).catch(console.error);
      trackUserAction('personalization_completed', { step: 8 }).catch(console.error);
    }
    
    setStep(9); // Go to free trial paywall step
  };

  const handlePaywallVideoNext = async () => {
    if (userId) {
      saveOnboardingStep('paywall_video_viewed', { viewedAt: new Date().toISOString() }).catch(console.error);
      trackUserAction('paywall_video_viewed', { step: 9 }).catch(console.error);
    }
    
    setStep(10); // Go to ProOfferCard
  };

  const handlePaywallComplete = async (tier: string, paywallSource: 'paywall_1' | 'paywall_2' | 'free' = 'paywall_1') => {
    try {
      if (userId) {
        // Save comprehensive paywall completion data
        saveOnboardingStep('paywall_completed', { 
          subscriptionTier: tier,
          paywallSource,
          completedAt: new Date().toISOString(),
          finalDecision: tier === 'free' ? 'skipped_both_paywalls' : `purchased_${paywallSource}`
        }).catch(console.error);
        
        trackUserAction('paywall_completed', { 
          tier, 
          step: 9,
          paywallSource,
          decision: tier
        }).catch(console.error);
      }
      
      // Mark onboarding as completed
      localStorage.setItem('onboarding_completed', 'true');
      // For free tier, still mark as "active" so they can access the app
      localStorage.setItem('subscription_active', 'true');
      localStorage.setItem('subscription_tier', tier);
        
      // Mark as completed in database with tier tracking
      if (userId) {
          try {
          // First, try to get current step_data
          const { data: currentData, error: fetchError } = await supabase
            .from('onboarding_v2')
            .select('step_data')
            .eq('user_id', userId)
            .maybeSingle();
          
          // fetchError is fine — we'll create the row if it doesn't exist
          
          const stepData = (currentData?.step_data as any) || {};
          
          // Add final paywall state
          const updatedStepData = {
            ...stepData,
            paywall_final_state: {
              tier,
              paywallSource,
              timestamp: new Date().toISOString(),
              userJourney: paywallSource === 'paywall_2' ? 'dismissed_paywall_1_then_purchased' : 
                           paywallSource === 'free' ? 'dismissed_both_paywalls' : 'purchased_paywall_1'
            }
          };
          
          // Update with upsert to handle missing row
          const { error } = await supabase
              .from('onboarding_v2')
              .upsert({
                user_id: userId,
                completed: true,
                completed_at: new Date().toISOString(),
                current_step: 'completed',
                step_data: updatedStepData
              }, {
                onConflict: 'user_id'
              });
          
          if (error) {
            // Don't throw - continue anyway
          } else {
            // Seed 45-50 base wardrobe items per gender (these are the
            // cornerstone items every user gets). The WardrobeSeedStep
            // (Step 7) added extra curated items on top of these.
            await seedDemoWardrobe(userId, onboardingData?.gender ?? null).catch(
              (e) => console.error('[seedDemoWardrobe] Background seed failed:', e)
            );
          }
        } catch {
          // Don't throw - let user continue even if DB save fails
        }
      }
      
      toast({
        title: tier === 'free' ? "Welcome to trendza!" : "Welcome to Premium!",
        description: tier === 'free' 
          ? "You have 3 free outfit ratings per month." 
          : "Your subscription is now active.",
      });
      
      // The model is preloading from Step 11 or Step 14 (see the
      // useEffects above). By the time the user lands in the dashboard
      // it will be ready for instant uploads.

      // Hand off to React Router instead of `window.location.href`.
      // A full-document reload would wipe this component's state and
      // was the root cause of the free-tier paywall loop; SPA
      // navigation keeps the React tree alive and lets App.tsx's
      // route gate re-evaluate against the freshly-set
      // localStorage `onboarding_completed=true` flag without a
      // state regression.
      // SPA navigation keeps the React tree alive so the route gate in
      // App.tsx re-evaluates hasCompletedOnboarding without a full page
      // reload. localStorage is set above, so the gate will see it.
      setTimeout(() => {
        navigate('/dress-me', { replace: true });
      }, 1000);

    } catch (error) {
      handleError(error, 'Auth:handlePaywallComplete');
    }
  };

  // Back navigation handlers
  const handleBackToStep = (targetStep: number) => {
    setStep(targetStep);
  };

  return (
    <div
      className="h-full app-shell-scroll"
      style={{ background: 'var(--bg-primary)' }}
    >
        <AnimatePresence mode="wait">
          {step === 1 && (
          <WelcomeHeroStep 
            key="welcome-hero"
            onNext={() => {
                 setStep(2);
                 if (userId) {
                   saveOnboardingStep('welcome_completed', { startedAt: new Date().toISOString() }).catch(console.error);
                   trackUserAction('welcome_completed', { step: 1 }).catch(console.error);
                 }
               }}
               onUserCreated={(userId) => {
                 setUserId(userId);
              Logger.info('Auth', 'User created:', userId);
               }}
             />
          )}
          
          {step === 2 && (
          <GenderSelectionStep 
            key="gender-selection"
            onNext={handleGender}
            onBack={() => handleBackToStep(1)}
            />
          )}
          
          {step === 3 && (
          <StyleArchetypeStep 
            key="style-archetype"
            gender={onboardingData?.gender ?? null}
            onNext={handleStyleArchetypes}
            onBack={() => handleBackToStep(2)}
            />
          )}
          
          {step === 4 && (
          <BodyBasicsStep 
            key="body-basics"
            onNext={handleBodyBasics}
            onBack={() => handleBackToStep(3)}
            />
          )}
          
          {step === 5 && (
          <FashionRelationshipStep 
            key="fashion-relationship"
            onNext={handleFashionRelationship}
            onBack={() => handleBackToStep(4)}
            />
          )}
          
          {step === 6 && (
          <SelfieCaptureStep 
            key="selfie-capture"
            onNext={handlePhotoCapture}
            onBack={() => handleBackToStep(5)}
          />
        )}
        
        {step === 7 && (
          <WardrobeSeedStep 
            key="wardrobe-seed"
            gender={onboardingData?.gender ?? null}
            archetypes={onboardingData?.style_archetypes ?? []}
            userId={userId ?? ''}
            onNext={handleWardrobeSeeding}
            onBack={() => handleBackToStep(6)}
          />
        )}
        
        {step === 8 && (
          <PersonalizingStep 
            key="personalizing"
            userImage={selectedImage ? URL.createObjectURL(selectedImage) : undefined}
            onComplete={handlePersonalizingComplete}
          />
        )}          {step === 9 && (
          <PaywallVideoStep 
            key="paywall-video"
            onNext={handlePaywallVideoNext}
          />
        )}
        
        {step === 10 && (
          <ProOfferCard
            key="pro-offer-card"
            onContinue={() => {
              // User purchased from the paywall
              handlePaywallComplete('pro', 'paywall_1');
            }}
            onSkipToFreeTier={() => {
              // User opted into the limited free tier from the
              // bottom of the paywall. No second paywall — the X
              // button path has been removed per product decision,
              // and free-tier users now go straight through.
              handlePaywallComplete('free', 'free');
            }}
          />
        )}
        </AnimatePresence>
    </div>
  );
};

export const Auth = AuthOnboardingWizard;
export default Auth;
