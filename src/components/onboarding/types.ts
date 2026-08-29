import type { StyleAnalysisResult } from '@/types/styleTypes';

// Re-export the type for other files to use
export type { StyleAnalysisResult } from '@/types/styleTypes';

export interface OnboardingData {
  age?: string;
  mainGoal?: string;
  analysisResult?: StyleAnalysisResult;
  requiresAuth?: boolean;
}

export type OnboardingStep = 
  | 'welcome' 
  | 'vibe-selection' 
  | 'test-photo' 
  | 'analyzing' 
  | 'teaser-results' 
  | 'paywall';
