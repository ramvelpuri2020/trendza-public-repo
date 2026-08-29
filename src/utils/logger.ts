
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isProduction = import.meta.env.PROD;
const isDevelopment = import.meta.env.DEV;

class Logger {
  private static log(level: LogLevel, context: string, ...args: any[]) {
    if (isProduction) {
      // In production, only log errors and warnings
      if (level === 'error' || level === 'warn') {
        console[level](`[${context}]`, ...args);
      }
      return;
    }

    // In development, log everything with better formatting
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const emoji = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌'
    }[level];

    console[level](`${emoji} [${timestamp}] [${context}]`, ...args);
  }

  static debug(context: string, ...args: any[]) {
    this.log('debug', context, ...args);
  }

  static info(context: string, ...args: any[]) {
    this.log('info', context, ...args);
  }

  static warn(context: string, ...args: any[]) {
    this.log('warn', context, ...args);
  }

  static error(context: string, ...args: any[]) {
    this.log('error', context, ...args);
  }

  // Performance logging
  static performance(context: string, operation: string, duration: number) {
    if (isDevelopment) {
      const emoji = duration < 100 ? '⚡' : duration < 500 ? '🐌' : '🐌🐌';
      console.log(`${emoji} [PERF] [${context}] ${operation}: ${duration}ms`);
    }
  }

  // User action logging
  static userAction(action: string, details?: any) {
    if (isDevelopment) {
      console.log(`👤 [USER] ${action}`, details || '');
    }
  }

  // API call logging
  static apiCall(endpoint: string, method: string, duration?: number) {
    if (isDevelopment) {
      const emoji = duration && duration < 1000 ? '⚡' : '🌐';
      const durationText = duration ? ` (${duration}ms)` : '';
      console.log(`${emoji} [API] ${method} ${endpoint}${durationText}`);
    }
  }

  // Error with context
  static errorWithContext(context: string, error: Error, additionalInfo?: any) {
    this.error(context, {
      message: error.message,
      stack: error.stack,
      ...additionalInfo
    });
  }
}

export { Logger };
