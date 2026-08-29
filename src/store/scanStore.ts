import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ScoreBreakdown, StyleTip } from '@/types/styleTypes';

interface ScanResult {
  overallScore: number;
  rawAnalysis: string;
  imageUrl: string;
  breakdown?: ScoreBreakdown[];
  tips?: StyleTip[];
  summary?: string;
}

interface ScanState {
  scans: ScanResult[];
  latestScan: ScanResult | null;
  addScan: (scan: ScanResult) => void;
  setLatestScan: (scan: ScanResult | null) => void;
}

export const useScanStore = create<ScanState>()(
  persist(
    (set) => ({
      scans: [],
      latestScan: null,
      addScan: (scan) => set((state) => ({ 
        scans: [scan, ...state.scans].slice(0, 50), // Keep last 50 scans
        latestScan: scan 
      })),
      setLatestScan: (scan) => set({ latestScan: scan }),
    }),
    {
      name: 'scan-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
