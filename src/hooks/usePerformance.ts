import { useEffect, useRef, useCallback } from 'react';
import { Logger } from '@/utils/logger';

interface PerformanceMetrics {
  componentRenderTime: number;
  apiCallTime: number;
  userInteractionTime: number;
  memoryUsage?: number;
}

export const usePerformance = (componentName: string) => {
  const renderStartTime = useRef<number>(0);
  const lastRenderTime = useRef<number>(0);
  const renderCount = useRef<number>(0);

  // Track component render performance
  useEffect(() => {
    renderStartTime.current = performance.now();
    renderCount.current += 1;

    return () => {
      const renderTime = performance.now() - renderStartTime.current;
      lastRenderTime.current = renderTime;
      
      // Log slow renders
      if (renderTime > 16) { // 60fps = 16ms per frame
        Logger.performance(componentName, 'render', renderTime);
      }
    };
  });

  // Track API call performance
  const trackApiCall = useCallback(async <T>(
    apiCall: Promise<T>,
    endpoint: string
  ): Promise<T> => {
    const startTime = performance.now();
    try {
      const result = await apiCall;
      const duration = performance.now() - startTime;
      Logger.apiCall(endpoint, 'GET', duration);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      Logger.apiCall(endpoint, 'ERROR', duration);
      throw error;
    }
  }, []);

  // Track user interaction performance
  const trackUserInteraction = useCallback((action: string, callback: () => void) => {
    const startTime = performance.now();
    callback();
    const duration = performance.now() - startTime;
    
    if (duration > 100) { // Log slow interactions
      Logger.performance(componentName, action, duration);
    }
  }, [componentName]);

  // Get memory usage (if available)
  const getMemoryUsage = useCallback((): number | undefined => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return undefined;
  }, []);

  // Get performance metrics
  const getMetrics = useCallback((): PerformanceMetrics => {
    return {
      componentRenderTime: lastRenderTime.current,
      apiCallTime: 0, // Would need to track this separately
      userInteractionTime: 0, // Would need to track this separately
      memoryUsage: getMemoryUsage(),
    };
  }, [getMemoryUsage]);

  return {
    trackApiCall,
    trackUserInteraction,
    getMetrics,
    renderCount: renderCount.current,
  };
}; 