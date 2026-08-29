import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { Logger } from '@/utils/logger';

interface UserStats {
  averageScore: number;
  streak: number;
  totalScans: number;
  bestScore: number;
  bestCategory: string;
  lastScan: string;
  improvedCategories: number;
}

type StatsState = {
  stats: UserStats;
  isLoading: boolean;
  error: string | null;
  fetchUserStats: (userId?: string) => Promise<void>;
};

export const useStatsStore = create<StatsState>((set) => ({
  stats: {
    averageScore: 0,
    streak: 0,
    totalScans: 0,
    bestScore: 0,
    bestCategory: 'N/A',
    lastScan: 'No scans yet',
    improvedCategories: 0
  },
  isLoading: false,
  error: null,
  fetchUserStats: async (userId?: string) => {
    try {
      set({ isLoading: true, error: null });
      
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          Logger.warn('No user found while fetching stats');
          set({ isLoading: false });
          return;
        }
        userId = user.id;
      }

      const { data: analyses, error } = await supabase
        .from('style_analyses')
        .select('total_score, breakdown, created_at, streak_count, scan_date')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        Logger.error('Error fetching analyses:', error);
        set({ 
          isLoading: false, 
          error: 'Failed to fetch analyses' 
        });
        return;
      }

      if (!analyses || analyses.length === 0) {
        set({
          stats: {
            averageScore: 0,
            streak: 0,
            totalScans: 0,
            bestScore: 0,
            bestCategory: 'N/A',
            lastScan: 'No scans yet',
            improvedCategories: 0
          },
          isLoading: false
        });
        return;
      }

      const totalScore = analyses.reduce((sum, analysis) => sum + analysis.total_score, 0);
      const averageScore = Math.round((totalScore / analyses.length) * 10) / 10;

      const bestScore = Math.max(...analyses.map(a => a.total_score));

      const currentStreak = analyses[0]?.streak_count || 0;

      const categoryScores: Record<string, { total: number; count: number }> = {};
      
      analyses.forEach(analysis => {
        if (analysis.breakdown) {
          try {
            const breakdownArray = typeof analysis.breakdown === 'string' 
              ? JSON.parse(analysis.breakdown)
              : Array.isArray(analysis.breakdown)
                ? analysis.breakdown
                : Object.entries(analysis.breakdown).map(([category, score]) => ({
                    category,
                    score: typeof score === 'number' ? score : 0
                  }));

            breakdownArray.forEach((item: { category: string; score: number }) => {
              if (!categoryScores[item.category]) {
                categoryScores[item.category] = { total: 0, count: 0 };
              }
              categoryScores[item.category].total += item.score;
              categoryScores[item.category].count += 1;
            });
          } catch (e) {
            Logger.error('Error parsing breakdown:', e);
          }
        }
      });

      let bestCategory = 'N/A';
      let highestAverage = 0;
      
      Object.entries(categoryScores).forEach(([category, data]) => {
        const average = data.total / data.count;
        if (average > highestAverage) {
          highestAverage = average;
          bestCategory = category;
        }
      });

      let improvedCategories = 0;
      if (analyses.length >= 2) {
        try {
          const oldestAnalysis = analyses[analyses.length - 1];
          const newestAnalysis = analyses[0];
          
          if (oldestAnalysis.breakdown && newestAnalysis.breakdown) {
            const oldBreakdown = typeof oldestAnalysis.breakdown === 'string'
              ? JSON.parse(oldestAnalysis.breakdown)
              : oldestAnalysis.breakdown;
              
            const newBreakdown = typeof newestAnalysis.breakdown === 'string'
              ? JSON.parse(newestAnalysis.breakdown)
              : newestAnalysis.breakdown;
            
            const oldScores: Record<string, number> = {};
            if (Array.isArray(oldBreakdown)) {
              oldBreakdown.forEach((item: { category: string; score: number }) => {
                oldScores[item.category] = item.score;
              });
            }
            
            if (Array.isArray(newBreakdown)) {
              newBreakdown.forEach((item: { category: string; score: number }) => {
                if (oldScores[item.category] !== undefined && item.score > oldScores[item.category]) {
                  improvedCategories++;
                }
              });
            }
          }
        } catch (e) {
          Logger.error('Error calculating improved categories:', e);
        }
      }

      const lastScanTime = analyses[0]?.scan_date || analyses[0]?.created_at;
      const lastScan = lastScanTime 
        ? formatDistanceToNow(new Date(lastScanTime), { addSuffix: true })
        : 'No scans yet';

      Logger.info('Stats fetched successfully for user:', userId);
      
      set({
        stats: {
          averageScore,
          streak: currentStreak,
          totalScans: analyses.length,
          bestScore,
          bestCategory,
          lastScan,
          improvedCategories
        },
        isLoading: false
      });
    } catch (error) {
      Logger.error('Error in fetchUserStats:', error);
      set({
        isLoading: false,
        error: 'Error loading stats',
        stats: {
          averageScore: 0,
          streak: 0,
          totalScans: 0,
          bestScore: 0,
          bestCategory: 'N/A',
          lastScan: 'Error loading stats',
          improvedCategories: 0
        }
      });
    }
  }
}));
