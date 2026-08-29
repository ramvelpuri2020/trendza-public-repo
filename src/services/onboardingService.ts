import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface OnboardingData {
  style_vibe?: string;
  selected_image?: string;
  analysis_result?: any;
  user_preferences?: Record<string, any>;
  onboarding_step?: number;
  onboarding_completed?: boolean;
}

export class OnboardingService {
  private static instance: OnboardingService;
  
  private constructor() {}
  
  static getInstance(): OnboardingService {
    if (!OnboardingService.instance) {
      OnboardingService.instance = new OnboardingService();
    }
    return OnboardingService.instance;
  }

  // Save onboarding data to Supabase
  async saveOnboardingData(userId: string, data: OnboardingData): Promise<boolean> {
    try {
      console.log('🔄 Saving onboarding data for user:', userId, 'Data:', data);
      
      const { data: result, error } = await supabase
        .from('profiles')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select();

      if (error) {
        console.error('❌ Failed to save onboarding data:', error);
        toast({
          title: "Save Error",
          description: "Failed to save your progress. Please try again.",
          variant: "destructive"
        });
        return false;
      }

      console.log('✅ Onboarding data saved successfully:', result);
      return true;
    } catch (error) {
      console.error('❌ Error saving onboarding data:', error);
      toast({
        title: "Save Error",
        description: "Failed to save your progress. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  }

  // Save specific step data
  async saveStepData(userId: string, step: number, stepData: Record<string, any>): Promise<boolean> {
    const data: OnboardingData = {
      onboarding_step: step,
      onboarding_data: stepData
    };
    
    return this.saveOnboardingData(userId, data);
  }

  // Save vibe selection
  async saveVibeSelection(userId: string, vibe: string): Promise<boolean> {
    return this.saveOnboardingData(userId, { style_vibe: vibe });
  }

  // Save photo and analysis
  async savePhotoAnalysis(userId: string, imageUrl: string, analysisResult: any): Promise<boolean> {
    return this.saveOnboardingData(userId, {
      selected_image: imageUrl,
      analysis_result: analysisResult,
      last_analysis_date: new Date().toISOString()
    });
  }

  // Complete onboarding
  async completeOnboarding(userId: string, finalData?: Record<string, any>): Promise<boolean> {
    try {
      console.log('🔄 Completing onboarding for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          onboarding_step: 5,
          ...finalData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select();

      if (error) {
        console.error('❌ Failed to complete onboarding:', error);
        toast({
          title: "Completion Error",
          description: "Failed to complete onboarding. Please try again.",
          variant: "destructive"
        });
        return false;
      }

      console.log('✅ Onboarding completed successfully:', data);
      return true;
    } catch (error) {
      console.error('❌ Error completing onboarding:', error);
      toast({
        title: "Completion Error",
        description: "Failed to complete onboarding. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  }

  // Get onboarding status
  async getOnboardingStatus(userId: string): Promise<{
    completed: boolean;
    step: number;
    data: any;
  } | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed, onboarding_step, onboarding_data, style_vibe')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Failed to get onboarding status:', error);
        return null;
      }

      return {
        completed: data.onboarding_completed || false,
        step: data.onboarding_step || 1,
        data: data.onboarding_data || {}
      };
    } catch (error) {
      console.error('❌ Error getting onboarding status:', error);
      return null;
    }
  }

  // Reset onboarding progress
  async resetOnboarding(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: false,
          onboarding_step: 1,
          onboarding_data: {},
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ Failed to reset onboarding:', error);
        return false;
      }

      console.log('✅ Onboarding reset successfully');
      return true;
    } catch (error) {
      console.error('❌ Error resetting onboarding:', error);
      return false;
    }
  }
}

// Export singleton instance
export const onboardingService = OnboardingService.getInstance(); 