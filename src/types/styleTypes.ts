export interface StyleAnalysisResult {
  overallScore: number;
  rawAnalysis: string;
  imageUrl: string;
  breakdown?: ScoreBreakdown[];
  tips?: StyleTip[];
  summary?: string;
  id?: string;
  scanDate?: string;
}

export interface ScoreBreakdown {
  category: string;
  score: number;
  emoji: string;
  details?: string;
}

export interface StyleTip {
  category: string;
  tip: string;
  level: "beginner" | "intermediate" | "advanced";
}

export interface StyleAnalysis {
  id: string;
  total_score: number;
  feedback: string;
  image_url: string;
  thumbnail_url?: string | null;
  created_at: string;
  scan_date?: string | null;
  streak_count?: number | null;
  last_scan_date?: string | null;
  breakdown?: ScoreBreakdown[] | string;
  raw_analysis?: string;
  tips?: StyleTip[] | string;
  user_id?: string | null;
}

export interface UserStats {
  totalScans: number;
  averageScore: number;
  topCategory: string;
  improvedCategories: string[];
  streak: number;
  lastScan: string | null;
  bestScore: number;
}

export interface AnalysisLoadingState {
  isAnalyzing: boolean;
  analysisPhase?: string;
  progress?: number;
  error?: string | null;
}
