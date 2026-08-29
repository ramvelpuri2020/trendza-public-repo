// Performance Monitor for tracking loading metrics
export class PerformanceMonitor {
  private metrics: Record<string, { start: number; duration?: number }> = {};
  private static instance: PerformanceMonitor;

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTiming(label: string): void {
    this.metrics[label] = { start: performance.now() };
  }

  endTiming(label: string): number {
    if (this.metrics[label]) {
      const duration = performance.now() - this.metrics[label].start;
      this.metrics[label].duration = duration;
      console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
      return duration;
    }
    return 0;
  }

  mark(label: string): void {
    const timestamp = performance.now();
    performance.mark(label);
    console.log(`📍 ${label}: ${timestamp.toFixed(2)}ms`);
  }

  getReport(): PerformanceReport {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    return {
      // Core Web Vitals
      coreWebVitals: {
        domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
        loadComplete: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
        timeToFirstByte: navigation ? navigation.responseStart - navigation.requestStart : 0,
        firstContentfulPaint: this.getFirstContentfulPaint(),
      },
      
      // Custom metrics
      customMetrics: this.metrics,
      
      // Recommendations
      recommendations: this.generateRecommendations(),
      
      // Overall score
      performanceScore: this.calculatePerformanceScore()
    };
  }

  private getFirstContentfulPaint(): number {
    const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
    return fcpEntry ? fcpEntry.startTime : 0;
  }

  private generateRecommendations(): string[] {
    const recs: string[] = [];
    
    if (this.metrics['app-init']?.duration && this.metrics['app-init'].duration > 1000) {
      recs.push('Consider lazy loading non-critical components');
    }
    
    if (this.metrics['splash-display']?.duration && this.metrics['splash-display'].duration < 800) {
      recs.push('Splash screen duration too short - users may perceive as glitchy');
    }
    
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation && (navigation.loadEventEnd - navigation.loadEventStart) > 2000) {
      recs.push('Load time exceeds 2s - consider optimizing bundle size');
    }
    
    return recs;
  }

  private calculatePerformanceScore(): number {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigation) return 50;

    const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
    const domTime = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
    
    // Simple scoring algorithm (higher is better)
    let score = 100;
    
    if (loadTime > 3000) score -= 30;
    else if (loadTime > 2000) score -= 20;
    else if (loadTime > 1000) score -= 10;
    
    if (domTime > 1000) score -= 20;
    else if (domTime > 500) score -= 10;
    
    return Math.max(score, 0);
  }

  // Log final performance report
  logFinalReport(): void {
    const report = this.getReport();
    
    console.group('🚀 App Performance Report');
    console.log('Core Web Vitals:', report.coreWebVitals);
    console.log('Custom Metrics:', report.customMetrics);
    console.log('Performance Score:', report.performanceScore);
    
    if (report.recommendations.length > 0) {
      console.warn('Recommendations:', report.recommendations);
    }
    
    console.groupEnd();
  }
}

// Performance Report Interface
export interface PerformanceReport {
  coreWebVitals: {
    domContentLoaded: number;
    loadComplete: number;
    timeToFirstByte: number;
    firstContentfulPaint: number;
  };
  customMetrics: Record<string, { start: number; duration?: number }>;
  recommendations: string[];
  performanceScore: number;
}

// Global performance tracker instance
export const performanceMonitor = PerformanceMonitor.getInstance(); 