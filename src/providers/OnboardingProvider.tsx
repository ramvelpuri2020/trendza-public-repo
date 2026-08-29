import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthProvider';
import { useProfile } from './ProfileProvider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { seedDemoWardrobe } from '@/lib/wardrobe-seed';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type OnboardingStep = 
  | 'welcome'
  | 'vibe-selection'
  | 'test-photo'
  | 'analyzing'
  | 'teaser-results'
  | 'paywall'
  | 'completed';

export interface OnboardingData {
  // Step 1: Welcome (no data)
  
  // Step 2: Vibe Selection
  styleVibe?: string;
  
  // Step 3: Test Photo
  testPhotoUrl?: string;
  
  // Step 4: Analyzing (no data)
  
  // Step 5: Teaser Results (no data)
  
  // Step 6: Paywall (no data)
}

interface OnboardingState {
  // Flow Control
  currentStep: OnboardingStep;
  totalSteps: number;
  
  // Data
  data: OnboardingData;
  
  // Status
  isCompleted: boolean;
  isLoading: boolean;
  isSaving: boolean;
  
  // Progress
  completedSteps: OnboardingStep[];
  progress: number; // 0-100
  
  // Error Handling
  error: string | null;
  validationErrors: Record<string, string>;
}

interface OnboardingActions {
  // Flow Control
  goToStep: (step: OnboardingStep) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  skipToStep: (step: OnboardingStep) => Promise<boolean>;
  
  // Data Management
  setStepData: <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => void;
  saveStepData: (stepData: Partial<OnboardingData>) => Promise<boolean>;
  saveAndAdvance: (stepData: Partial<OnboardingData>) => Promise<boolean>;
  
  // Completion
  completeOnboarding: () => Promise<boolean>;
  resetOnboarding: () => Promise<boolean>;
  
  // Validation
  validateCurrentStep: () => boolean;
  getStepErrors: (step?: OnboardingStep) => string[];
  
  // Utility
  isStepCompleted: (step: OnboardingStep) => boolean;
  canAdvanceToStep: (step: OnboardingStep) => boolean;
  clearError: () => void;
}

type OnboardingContextType = OnboardingState & OnboardingActions;

// ============================================================================
// Constants
// ============================================================================

const ONBOARDING_STEPS: OnboardingStep[] = [
  'welcome',
  'vibe-selection',
  'test-photo',
  'analyzing',
  'teaser-results',
  'paywall',
  'completed',
];

const STEP_VALIDATION_RULES: Record<OnboardingStep, (data: OnboardingData) => string[]> = {
  'welcome': () => [],
  'vibe-selection': (data) => data.styleVibe ? [] : ['Please select a style vibe'],
  'test-photo': (data) => data.testPhotoUrl ? [] : ['Please upload a photo'],
  'analyzing': () => [],
  'teaser-results': () => [],
  'paywall': () => [],
  'completed': () => [],
};

// ============================================================================
// Context Setup
// ============================================================================

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

// ============================================================================
// OnboardingProvider Component
// ============================================================================

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  // ============================================================================
  // Dependencies & State
  // ============================================================================
  
  const { user, isAuthenticated } = useAuth();
  const { profile, updateProfile, getField } = useProfile();
  const { toast } = useToast();
  
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    currentStep: 'welcome',
    totalSteps: ONBOARDING_STEPS.length - 1, // Exclude 'completed'
    data: {},
    isCompleted: false,
    isLoading: false,
    isSaving: false,
    completedSteps: [],
    progress: 0,
    error: null,
    validationErrors: {},
  });

  // ============================================================================
  // Refs for State Tracking
  // ============================================================================
  
  const mountedRef = useRef(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================================================
  // Utility Functions
  // ============================================================================
  
  const updateOnboardingState = useCallback((updates: Partial<OnboardingState>) => {
    if (!mountedRef.current) return;
    
    setOnboardingState(prev => ({
      ...prev,
      ...updates,
    }));
  }, []);

  const calculateProgress = useCallback((step: OnboardingStep, completedSteps: OnboardingStep[]): number => {
    const stepIndex = ONBOARDING_STEPS.indexOf(step);
    const totalSteps = ONBOARDING_STEPS.length - 1; // Exclude 'completed'
    return Math.min((stepIndex / totalSteps) * 100, 100);
  }, []);

  // ============================================================================
  // Data Management
  // ============================================================================
  
  const setStepData = useCallback(<K extends keyof OnboardingData>(
    field: K, 
    value: OnboardingData[K]
  ) => {
    updateOnboardingState({
      data: { ...onboardingState.data, [field]: value },
      validationErrors: { ...onboardingState.validationErrors, [field]: undefined },
    });
  }, [onboardingState.data, onboardingState.validationErrors, updateOnboardingState]);

  const saveStepData = useCallback(async (stepData: Partial<OnboardingData>): Promise<boolean> => {
    if (!user?.id || !mountedRef.current) {
      return false;
    }

    updateOnboardingState({ isSaving: true });

    try {
      // Save to onboarding_v2 table
      const { error: onboardingError } = await supabase
        .from('onboarding_v2')
        .upsert({
          user_id: user.id,
          step: onboardingState.currentStep,
          step_data: stepData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,step',
          ignoreDuplicates: false
        });

      if (onboardingError) throw onboardingError;

      // Track user action
      const { error: analyticsError } = await supabase
        .from('user_analytics')
        .insert({
          user_id: user.id,
          action: `step_${onboardingState.currentStep}`,
          data: stepData,
          timestamp: new Date().toISOString()
        });

      if (analyticsError) {
        console.warn('Analytics tracking failed:', analyticsError);
      }
      
      updateOnboardingState({
        data: { ...onboardingState.data, ...stepData },
        isSaving: false,
        error: null,
      });

      return true;
    } catch (error: any) {
      console.error('Save step data error:', error);
      updateOnboardingState({
        isSaving: false,
        error: error.message || 'Failed to save step data',
      });
      return false;
    }
  }, [user?.id, onboardingState.currentStep, onboardingState.data, updateOnboardingState]);

  const saveAndAdvance = useCallback(async (stepData: Partial<OnboardingData>): Promise<boolean> => {
    const saved = await saveStepData(stepData);
    if (saved) {
      goToNextStep();
    }
    return saved;
  }, [saveStepData]);

  // ============================================================================
  // Flow Control
  // ============================================================================
  
  const goToStep = useCallback((step: OnboardingStep) => {
    const stepIndex = ONBOARDING_STEPS.indexOf(step);
    const completedSteps = ONBOARDING_STEPS.slice(0, stepIndex);
    const progress = calculateProgress(step, completedSteps);

    updateOnboardingState({
      currentStep: step,
      completedSteps,
      progress,
      error: null,
    });
  }, [calculateProgress, updateOnboardingState]);

  const goToNextStep = useCallback(() => {
    const currentIndex = ONBOARDING_STEPS.indexOf(onboardingState.currentStep);
    const nextIndex = Math.min(currentIndex + 1, ONBOARDING_STEPS.length - 1);
    const nextStep = ONBOARDING_STEPS[nextIndex];
    goToStep(nextStep);
  }, [onboardingState.currentStep, goToStep]);

  const goToPreviousStep = useCallback(() => {
    const currentIndex = ONBOARDING_STEPS.indexOf(onboardingState.currentStep);
    const prevIndex = Math.max(currentIndex - 1, 0);
    const prevStep = ONBOARDING_STEPS[prevIndex];
    goToStep(prevStep);
  }, [onboardingState.currentStep, goToStep]);

  const skipToStep = useCallback(async (step: OnboardingStep): Promise<boolean> => {
    if (!canAdvanceToStep(step)) {
      return false;
    }

    goToStep(step);
    return true;
  }, [goToStep]);

  // ============================================================================
  // Validation
  // ============================================================================
  
  const validateCurrentStep = useCallback((): boolean => {
    const errors = STEP_VALIDATION_RULES[onboardingState.currentStep](onboardingState.data);
    
    if (errors.length > 0) {
      updateOnboardingState({
        validationErrors: { [onboardingState.currentStep]: errors[0] },
      });
      return false;
    }

    return true;
  }, [onboardingState.currentStep, onboardingState.data, updateOnboardingState]);

  const getStepErrors = useCallback((step?: OnboardingStep): string[] => {
    const targetStep = step || onboardingState.currentStep;
    return STEP_VALIDATION_RULES[targetStep](onboardingState.data);
  }, [onboardingState.currentStep, onboardingState.data]);

  const isStepCompleted = useCallback((step: OnboardingStep): boolean => {
    return onboardingState.completedSteps.includes(step);
  }, [onboardingState.completedSteps]);

  const canAdvanceToStep = useCallback((step: OnboardingStep): boolean => {
    const stepIndex = ONBOARDING_STEPS.indexOf(step);
    const currentIndex = ONBOARDING_STEPS.indexOf(onboardingState.currentStep);
    
    // Can always go backwards
    if (stepIndex <= currentIndex) return true;
    
    // Can only advance one step at a time
    return stepIndex <= currentIndex + 1;
  }, [onboardingState.currentStep]);

  // ============================================================================
  // Completion & Reset
  // ============================================================================
  
  const completeOnboarding = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;

    updateOnboardingState({ isSaving: true });

    try {
      // Save completion to onboarding_v2
      const { error: onboardingError } = await supabase
        .from('onboarding_v2')
        .upsert({
          user_id: user.id,
          step: 'completed',
          completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,step',
          ignoreDuplicates: false
        });

      if (onboardingError) throw onboardingError;

      // Track completion action
      const { error: analyticsError } = await supabase
        .from('user_analytics')
        .insert({
          user_id: user.id,
          action: 'onboarding_completed',
          data: { completedAt: new Date().toISOString() },
          timestamp: new Date().toISOString()
        });

      if (analyticsError) {
        console.warn('Analytics tracking failed:', analyticsError);
      }

      updateOnboardingState({
        currentStep: 'completed',
        isCompleted: true,
        isSaving: false,
        progress: 100,
        error: null,
      });

      // Seed demo wardrobe items as real rows so they persist alongside
      // user-uploaded items instead of vanishing on first clip.
      //
      // Note: we used to log this as `console.warn('non-fatal')` — that
      // hide-the-error approach was the reason the cross-user UUID
      // collision went unnoticed across many signups. wardrobe-seed.ts
      // now prefixes demo ids with the first 8 chars of the user UUID,
      // so collisions are impossible; if anything still fails, we log
      // loudly via console.error AND return `false` from this function
      // (above toast) ONLY after letting the user through — the
      // dashboard effects can retry if items.length === 0.
      void (async () => {
        try {
          console.log('[seedDemoWardrobe] Fetching gender from onboarding_v2...')
          const { data: onboardingRow } = await supabase
            .from('onboarding_v2')
            .select('step_data')
            .eq('user_id', user.id)
            .maybeSingle()
          const stepData = (onboardingRow?.step_data as Record<string, any>) ?? {}
          const gender = stepData?.gender?.gender ?? null
          console.log('[seedDemoWardrobe] Resolved gender:', JSON.stringify(gender), '| typeof:', typeof gender)
          console.log('[seedDemoWardrobe] Calling seedDemoWardrobe with userId:', user.id)
          await seedDemoWardrobe(user.id, typeof gender === 'string' ? gender : null)
          console.log('[seedDemoWardrobe] ✅ Seed completed successfully')
        } catch (e) {
          console.error(
            '[seedDemoWardrobe] ❌ SEED FAILED — every new user must be seeded; dashboard will retry if items.length === 0:',
            e,
          )
        }
      })()

      toast({
        title: "Onboarding Complete!",
        description: "Welcome to your personalized style journey.",
      });

      return true;
    } catch (error: any) {
      console.error('Complete onboarding error:', error);
      updateOnboardingState({
        isSaving: false,
        error: error.message || 'Failed to complete onboarding',
      });
      return false;
    }
  }, [user?.id, updateOnboardingState, toast]);

  const resetOnboarding = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      // Reset in onboarding_v2
      const { error } = await supabase
        .from('onboarding_v2')
        .upsert({
          user_id: user.id,
          step: 'welcome',
          completed: false,
          completed_at: null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,step',
          ignoreDuplicates: false
        });

      if (error) throw error;

      updateOnboardingState({
        currentStep: 'welcome',
        data: {},
        isCompleted: false,
        completedSteps: [],
        progress: 0,
        error: null,
        validationErrors: {},
      });

      return true;
    } catch (error: any) {
      console.error('Reset onboarding error:', error);
      return false;
    }
  }, [user?.id, updateOnboardingState]);

  const clearError = useCallback(() => {
    updateOnboardingState({ error: null, validationErrors: {} });
  }, [updateOnboardingState]);

  // ============================================================================
  // Auto-sync with Profile
  // ============================================================================
  
  useEffect(() => {
    if (!profile || !isAuthenticated) {
      return;
    }

    // Load existing onboarding data from profile
    const existingData: OnboardingData = {
      shoppingFrequency: profile.current_onboarding_step === 'shopping-frequency' ? 'weekly' : undefined,
      budgetRange: profile.current_onboarding_step === 'budget-range' ? '$100-$250' : undefined,
      stylePreferences: profile.current_onboarding_step === 'style-preferences' ? ['casual'] : undefined,
      bodyType: profile.current_onboarding_step === 'body-type' ? 'athletic' : undefined,
      fitPreference: profile.current_onboarding_step === 'fit-preference' ? 'tight' : undefined,
      colorPalette: profile.current_onboarding_step === 'color-palette' ? ['blue'] : undefined,
      shoeSize: profile.current_onboarding_step === 'shoe-size' ? '10' : undefined,
      brandAffinity: profile.current_onboarding_step === 'brand-affinity' ? ['nike'] : undefined,
      inspirationLink: profile.current_onboarding_step === 'inspiration-link' ? 'instagram' : undefined,
      mainGoal: profile.current_onboarding_step === 'main-goal' ? 'look_better' : undefined,
      testPhotoUrl: profile.current_onboarding_step === 'test-photo' ? 'uploaded' : undefined,
    };

    // Determine current step based on completed data
    let currentStep: OnboardingStep = 'welcome';
    const completedSteps: OnboardingStep[] = [];

    for (const step of ONBOARDING_STEPS) {
      const errors = STEP_VALIDATION_RULES[step](existingData);
      if (errors.length === 0) {
        completedSteps.push(step);
        if (step !== 'completed') {
          currentStep = ONBOARDING_STEPS[ONBOARDING_STEPS.indexOf(step) + 1] || 'completed';
        }
      } else {
        break;
      }
    }

    // Check if onboarding is already completed
    const isCompleted = profile.onboarding_completed === true;
    if (isCompleted) {
      currentStep = 'completed';
    }

    const progress = calculateProgress(currentStep, completedSteps);

    updateOnboardingState({
      data: existingData,
      currentStep,
      completedSteps,
      isCompleted,
      progress,
    });

  }, [profile, isAuthenticated, calculateProgress, updateOnboardingState]);

  // ============================================================================
  // Cleanup
  // ============================================================================
  
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // ============================================================================
  // Context Value
  // ============================================================================
  
  const contextValue: OnboardingContextType = {
    // State
    ...onboardingState,
    
    // Actions
    goToStep,
    goToNextStep,
    goToPreviousStep,
    skipToStep,
    setStepData,
    saveStepData,
    saveAndAdvance,
    completeOnboarding,
    resetOnboarding,
    validateCurrentStep,
    getStepErrors,
    isStepCompleted,
    canAdvanceToStep,
    clearError,
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
};

export default OnboardingProvider; 