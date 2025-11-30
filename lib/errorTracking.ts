/**
 * Error Tracking Utility
 * 
 * Centralized error logging and tracking system.
 * Integrated with CodeRabbit for error debugging and analysis.
 * 
 * @module lib/errorTracking
 */

/**
 * Context information for error logging
 * 
 * Provides additional metadata to help debug errors
 */
export interface ErrorContext {
  userId?: string;
  path?: string;
  userAgent?: string;
  componentStack?: string | null;
  errorBoundary?: boolean;
  endpoint?: string;
  method?: string;
  errorMessage?: string;
  [key: string]: unknown;
}

/**
 * ErrorTracker class
 * 
 * Provides centralized error, warning, info, and debug logging
 * with structured context for better debugging and analysis.
 */
class ErrorTracker {
  private isProduction = process.env.NODE_ENV === 'production';
  private errorTrackingEnabled = process.env.NEXT_PUBLIC_ERROR_TRACKING_ENABLED === 'true';

  /**
   * Log an error with context
   * 
   * Enhanced for CodeRabbit debugging with structured error data.
   * Automatically captures error name, message, stack trace, and context.
   * 
   * @param error - The error object or unknown error value
   * @param context - Optional context information for debugging
   * 
   * @example
   * ```typescript
   * errorTracker.logError(error, {
   *   endpoint: '/api/users',
   *   method: 'POST',
   *   userId: '123'
   * });
   * ```
   */
  logError(error: Error | unknown, context?: ErrorContext): void {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorName = error instanceof Error ? error.name : 'UnknownError';

    // Enhanced error object for debugging
    const errorData = {
      name: errorName,
      message: errorMessage,
      stack: errorStack,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
        environment: this.isProduction ? 'production' : 'development',
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      },
    };

    // In production, send to error tracking service
    if (this.isProduction && this.errorTrackingEnabled) {
      // TODO: Integrate with error tracking service (Sentry, LogRocket, etc.)
      // Example: Sentry.captureException(error, { extra: context });
      
      // Structured error logging for CodeRabbit analysis
      console.error('[ERROR]', JSON.stringify(errorData, null, 2));
    } else {
      // In development, use detailed console.error for debugging
      console.error('🔴 [ERROR TRACKER]', {
        name: errorName,
        message: errorMessage,
        stack: errorStack,
        ...errorData.context,
      });
      
      // Also log stack trace separately for better readability
      if (errorStack) {
        console.error('📍 Stack Trace:', errorStack);
      }
    }
  }

  /**
   * Log a warning message
   * 
   * Use for non-critical issues that should be monitored
   * but don't require immediate attention.
   * 
   * @param message - Warning message to log
   * @param context - Optional context information
   * 
   * @example
   * ```typescript
   * errorTracker.logWarning('Session expired', {
   *   userId: '123',
   *   path: '/checkout'
   * });
   * ```
   */
  logWarning(message: string, context?: ErrorContext): void {
    if (this.isProduction && this.errorTrackingEnabled) {
      // TODO: Send to error tracking service
      console.warn('[WARNING]', { message, context, timestamp: new Date().toISOString() });
    } else {
      console.warn('Warning:', message, context);
    }
  }

  /**
   * Log info (for debugging)
   */
  logInfo(message: string, context?: ErrorContext): void {
    if (!this.isProduction) {
      console.log('ℹ️ [INFO]', message, context);
    }
  }

  /**
   * Log debug information (only in development)
   * Useful for CodeRabbit debugging
   */
  logDebug(message: string, context?: ErrorContext): void {
    if (!this.isProduction && process.env.NEXT_PUBLIC_DEBUG === 'true') {
      console.debug('🐛 [DEBUG]', message, context);
    }
  }

  /**
   * Track performance metrics
   */
  logPerformance(metric: string, duration: number, context?: ErrorContext): void {
    if (this.isProduction && this.errorTrackingEnabled) {
      console.log('[PERFORMANCE]', {
        metric,
        duration,
        context,
        timestamp: new Date().toISOString(),
      });
    } else if (!this.isProduction) {
      console.log('⚡ [PERFORMANCE]', metric, `${duration}ms`, context);
    }
  }
}

// Export singleton instance
export const errorTracker = new ErrorTracker();

/**
 * Convenience function for logging errors
 */
export function logError(error: Error | unknown, context?: ErrorContext): void {
  errorTracker.logError(error, context);
}

/**
 * Convenience function for logging warnings
 */
export function logWarning(message: string, context?: ErrorContext): void {
  errorTracker.logWarning(message, context);
}

/**
 * Convenience function for logging info
 */
export function logInfo(message: string, context?: ErrorContext): void {
  errorTracker.logInfo(message, context);
}

/**
 * Convenience function for logging debug information
 */
export function logDebug(message: string, context?: ErrorContext): void {
  errorTracker.logDebug(message, context);
}

/**
 * Convenience function for logging performance metrics
 */
export function logPerformance(metric: string, duration: number, context?: ErrorContext): void {
  errorTracker.logPerformance(metric, duration, context);
}

