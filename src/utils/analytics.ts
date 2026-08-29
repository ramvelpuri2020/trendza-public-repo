import { supabase } from '@/integrations/supabase/client';

export interface UserAction {
  userId: string;
  action: string;
  data?: any;
  timestamp: string;
}

export interface OnboardingProgress {
  userId: string;
  step: string;
  completed: boolean;
  data?: any;
  timestamp: string;
}

export class AnalyticsTracker {
  private static instance: AnalyticsTracker;
  
  private constructor() {}
  
  static getInstance(): AnalyticsTracker {
    if (!AnalyticsTracker.instance) {
      AnalyticsTracker.instance = new AnalyticsTracker();
    }
    return AnalyticsTracker.instance;
  }

  // Track user actions (onboarding steps, dashboard usage, etc.)
  async trackUserAction(userId: string, action: string, data?: any): Promise<boolean> {
    try {
      const userAction: UserAction = {
        userId,
        action,
        data,
        timestamp: new Date().toISOString()
      };

      // Save to user_analytics table
      const { error } = await supabase
        .from('user_analytics')
        .insert({
          user_id: userId,
          action,
          data: data || {},
          timestamp: userAction.timestamp
        });

      if (error) throw error;
      
      console.log('📊 Tracked user action:', { userId, action, data });
      return true;
    } catch (error) {
      console.error('❌ Failed to track user action:', error);
      return false;
    }
  }

  // Track onboarding progress
  async trackOnboardingProgress(userId: string, step: string, completed: boolean, data?: any): Promise<boolean> {
    try {
      const progress: OnboardingProgress = {
        userId,
        step,
        completed,
        data,
        timestamp: new Date().toISOString()
      };

      // Update onboarding_v2 table
      const { error } = await supabase
        .from('onboarding_v2')
        .upsert({
          user_id: userId,
          step: step,
          completed: completed,
          step_data: data || {},
          updated_at: progress.timestamp
        });

      if (error) throw error;
      
      console.log('📊 Tracked onboarding progress:', { userId, step, completed });
      return true;
    } catch (error) {
      console.error('❌ Failed to track onboarding progress:', error);
      return false;
    }
  }

  // Track dashboard usage
  async trackDashboardUsage(userId: string, section: string, action?: string): Promise<boolean> {
    return this.trackUserAction(userId, 'dashboard_usage', { section, action });
  }

  // Track analysis completion
  async trackAnalysisCompletion(userId: string, score: number, breakdown: any): Promise<boolean> {
    return this.trackUserAction(userId, 'analysis_completed', { score, breakdown });
  }

  // Track subscription events
  async trackSubscriptionEvent(userId: string, event: string, data?: any): Promise<boolean> {
    return this.trackUserAction(userId, 'subscription_event', { event, ...data });
  }

  // Get user analytics summary
  async getUserAnalytics(userId: string): Promise<any> {
    try {
      // Get onboarding data
      const { data: onboardingData, error: onboardingError } = await supabase
        .from('onboarding_v2')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      // Get latest analysis
      const { data: analysisData, error: analysisError } = await supabase
        .from('analysis_results')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Get recent actions
      const { data: actionsData, error: actionsError } = await supabase
        .from('user_analytics')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(10);

      if (onboardingError && onboardingError.code !== 'PGRST116') {
        throw onboardingError;
      }

      return {
        userId,
        onboardingCompleted: onboardingData?.completed || false,
        currentStep: onboardingData?.step || 'welcome',
        lastAnalysisScore: analysisData?.score || null,
        lastAnalysisDate: analysisData?.created_at || null,
        recentActions: actionsData || [],
        createdAt: onboardingData?.started_at || null,
        lastUpdated: onboardingData?.updated_at || null
      };
    } catch (error) {
      console.error('❌ Failed to get user analytics:', error);
      return null;
    }
  }

  // Get all users analytics (for admin dashboard)
  async getAllUsersAnalytics(): Promise<any[]> {
    try {
      // Get all onboarding data
      const { data: onboardingData, error: onboardingError } = await supabase
        .from('onboarding_v2')
        .select('*')
        .order('started_at', { ascending: false });

      if (onboardingError) throw onboardingError;

      // Get analysis data
      const { data: analysisData, error: analysisError } = await supabase
        .from('analysis_results')
        .select('*')
        .order('created_at', { ascending: false });

      if (analysisError) throw analysisError;

      // Get user actions
      const { data: actionsData, error: actionsError } = await supabase
        .from('user_analytics')
        .select('*')
        .order('timestamp', { ascending: false });

      if (actionsError) throw actionsError;

      // Combine data by user
      const userMap = new Map();

      onboardingData.forEach(onboarding => {
        const userId = onboarding.user_id;
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            userId,
            username: `user_${userId.slice(0, 8)}`,
            onboardingCompleted: onboarding.completed,
            currentStep: onboarding.step,
            createdAt: onboarding.started_at,
            lastUpdated: onboarding.updated_at,
            actions: [],
            analyses: []
          });
        }
        const user = userMap.get(userId);
        user.onboardingCompleted = onboarding.completed;
        user.currentStep = onboarding.step;
        user.lastUpdated = onboarding.updated_at;
      });

      analysisData.forEach(analysis => {
        const userId = analysis.user_id;
        if (userMap.has(userId)) {
          userMap.get(userId).analyses.push(analysis);
        }
      });

      actionsData.forEach(action => {
        const userId = action.user_id;
        if (userMap.has(userId)) {
          userMap.get(userId).actions.push(action);
        }
      });

      return Array.from(userMap.values());
    } catch (error) {
      console.error('❌ Failed to get all users analytics:', error);
      return [];
    }
  }

  // Get onboarding completion rate
  async getOnboardingCompletionRate(): Promise<{ completed: number; total: number; rate: number }> {
    try {
      const { data, error } = await supabase
        .from('onboarding_v2')
        .select('completed');

      if (error) throw error;

      const total = data.length;
      const completed = data.filter(user => user.completed).length;
      const rate = total > 0 ? (completed / total) * 100 : 0;

      return { completed, total, rate };
    } catch (error) {
      console.error('❌ Failed to get onboarding completion rate:', error);
      return { completed: 0, total: 0, rate: 0 };
    }
  }

  // Get conversion funnel
  async getConversionFunnel(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('onboarding_v2')
        .select('step, completed');

      if (error) throw error;

      const stepCounts = new Map();
      data.forEach(record => {
        const step = record.step;
        if (!stepCounts.has(step)) {
          stepCounts.set(step, { count: 0, completed: 0 });
        }
        stepCounts.get(step).count++;
        if (record.completed) {
          stepCounts.get(step).completed++;
        }
      });

      return Array.from(stepCounts.entries()).map(([step, data]) => ({
        step,
        usersAtStep: data.count,
        completed: data.completed,
        completionRate: data.count > 0 ? (data.completed / data.count) * 100 : 0
      }));
    } catch (error) {
      console.error('❌ Failed to get conversion funnel:', error);
      return [];
    }
  }

  // Get recent activity
  async getRecentActivity(days: number = 7): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('onboarding_v2')
        .select('*')
        .gte('started_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('started_at', { ascending: false });

      if (error) throw error;

      return data.map(record => ({
        userId: record.user_id,
        step: record.step,
        completed: record.completed,
        startedAt: record.started_at,
        completedAt: record.completed_at
      }));
    } catch (error) {
      console.error('❌ Failed to get recent activity:', error);
      return [];
    }
  }
}

// Export singleton instance
export const analyticsTracker = AnalyticsTracker.getInstance(); 