import { supabase } from '@/integrations/supabase/client';

export interface DatabaseHealthResult {
  isConnected: boolean;
  userProfileExists: boolean;
  profileData: any;
  errors: string[];
  recommendations: string[];
}

export const checkDatabaseHealth = async (userId?: string): Promise<DatabaseHealthResult> => {
  const result: DatabaseHealthResult = {
    isConnected: false,
    userProfileExists: false,
    profileData: null,
    errors: [],
    recommendations: []
  };

  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      result.errors.push(`Database connection failed: ${error.message}`);
      result.recommendations.push('Check your internet connection and try again');
      return result;
    }

    result.isConnected = true;

    // If no userId provided, just return connection status
    if (!userId) {
      return result;
    }

    // Check user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      result.errors.push(`Profile query failed: ${profileError.message}`);
      
      if (profileError.code === 'PGRST116') {
        result.recommendations.push('User profile does not exist - may need to complete onboarding');
      } else if (profileError.message?.includes('RLS')) {
        result.recommendations.push('Permission error - user may not be properly authenticated');
      } else {
        result.recommendations.push('Database query failed - check network connection');
      }
      
      return result;
    }

    if (profile) {
      result.userProfileExists = true;
      result.profileData = profile;

      // Check for common issues
      if (!profile.onboarding_completed) {
        result.recommendations.push('Onboarding not completed - user needs to finish setup');
      }

      if (!profile.age_range || !profile.main_goal) {
        result.recommendations.push('Missing onboarding data - user may need to restart onboarding');
      }

      if (profile.subscription_status !== 'active') {
        result.recommendations.push('No active subscription - user needs to complete payment');
      }
    } else {
      result.recommendations.push('User profile not found - may need to create profile');
    }

  } catch (error) {
    result.errors.push(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    result.recommendations.push('Check console for more details');
  }

  return result;
};

export const fixUserProfile = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Try to create or update user profile
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        onboarding_completed: false,
        subscription_status: 'free',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}; 