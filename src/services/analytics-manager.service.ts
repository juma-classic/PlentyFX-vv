/**
 * Analytics Manager Service
 * 
 * Provides safe analytics initialization with proper error handling.
 * Prevents analytics-related errors from blocking the application.
 */

import { Analytics } from '@deriv-com/analytics';
import { AnalyticsInitializer } from '@/utils/analytics';
import { errorHandler } from './error-handler.service';

export interface AnalyticsConfig {
  enabled: boolean;
  environment: 'development' | 'production' | 'staging';
  suppressWarnings: boolean;
  retryAttempts: number;
  retryDelay: number;
}

export class AnalyticsManagerService {
  private static instance: AnalyticsManagerService;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private config: AnalyticsConfig;

  private constructor() {
    this.config = {
      enabled: process.env.NODE_ENV === 'production',
      environment: (process.env.NODE_ENV as any) || 'development',
      suppressWarnings: process.env.NODE_ENV === 'production',
      retryAttempts: 3,
      retryDelay: 1000,
    };
  }

  public static getInstance(): AnalyticsManagerService {
    if (!AnalyticsManagerService.instance) {
      AnalyticsManagerService.instance = new AnalyticsManagerService();
    }
    return AnalyticsManagerService.instance;
  }

  /**
   * Initialize analytics with safe error handling
   */
  public async initialize(customConfig?: Partial<AnalyticsConfig>): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.config = { ...this.config, ...customConfig };

    this.initializationPromise = this.safeInitialize();
    return this.initializationPromise;
  }

  private async safeInitialize(): Promise<void> {
    if (!this.config.enabled) {
      this.logInfo('Analytics disabled by configuration');
      this.isInitialized = true;
      return;
    }

    let attempts = 0;
    const maxAttempts = this.config.retryAttempts;

    while (attempts < maxAttempts) {
      try {
        await this.attemptInitialization();
        this.isInitialized = true;
        this.logInfo('Analytics initialized successfully');
        return;
      } catch (error) {
        attempts++;
        const isLastAttempt = attempts >= maxAttempts;
        
        if (isLastAttempt) {
          this.handleInitializationError(error);
          this.isInitialized = true; // Mark as initialized to prevent further attempts
          return;
        }

        this.logWarning(`Analytics initialization attempt ${attempts} failed, retrying...`);
        await this.delay(this.config.retryDelay * attempts);
      }
    }
  }

  private async attemptInitialization(): Promise<void> {
    // Check for required environment variables
    if (!process.env.RUDDERSTACK_KEY && this.config.environment === 'production') {
      throw new Error('RUDDERSTACK_KEY is required for production analytics');
    }

    // Initialize analytics with timeout
    const initPromise = AnalyticsInitializer();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Analytics initialization timeout')), 10000);
    });

    await Promise.race([initPromise, timeoutPromise]);
  }

  private handleInitializationError(error: any): void {
    const errorMessage = error instanceof Error ? error.message : 'Unknown analytics error';
    
    errorHandler.handleServiceInitError(
      'AnalyticsManager',
      error instanceof Error ? error : new Error(errorMessage),
      () => this.setupFallbackAnalytics()
    );
  }

  private setupFallbackAnalytics(): void {
    try {
      // Create safe fallback methods to prevent undefined errors
      if (typeof window !== 'undefined' && !window.Analytics) {
        (window as any).Analytics = {
          trackEvent: () => {},
          getFeatureValue: (flag: string, defaultValue: any) => defaultValue,
          getInstances: () => ({}),
          initialise: () => Promise.resolve(),
        };
      }
    } catch (error) {
      // Silently handle any fallback setup errors
    }
  }

  /**
   * Track an event safely
   */
  public trackEvent(eventName: string, properties?: Record<string, any>): void {
    if (!this.isInitialized) {
      this.logWarning('Analytics not initialized, event tracking skipped');
      return;
    }

    try {
      // Use type assertion to handle the Analytics typing issue
      (Analytics as any)?.trackEvent?.(eventName, properties);
    } catch (error) {
      errorHandler.handleServiceInitError(
        'AnalyticsManager',
        error instanceof Error ? error : new Error('Event tracking failed')
      );
    }
  }

  /**
   * Get feature flag value safely
   */
  public getFeatureValue<T>(flag: string, defaultValue: T): T {
    if (!this.isInitialized) {
      return defaultValue;
    }

    try {
      // Use type assertion to handle the Analytics typing issue
      const value = (Analytics as any)?.getFeatureValue?.(flag, defaultValue);
      return value !== undefined ? value : defaultValue;
    } catch (error) {
      errorHandler.handleServiceInitError(
        'AnalyticsManager',
        error instanceof Error ? error : new Error('Feature flag retrieval failed')
      );
      return defaultValue;
    }
  }

  /**
   * Check if analytics is properly initialized
   */
  public isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get analytics instances safely
   */
  public getInstances(): any {
    try {
      return Analytics?.getInstances?.() ?? {};
    } catch (error) {
      errorHandler.handleServiceInitError(
        'AnalyticsManager',
        error instanceof Error ? error : new Error('Get instances failed')
      );
      return {};
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private logInfo(message: string): void {
    if (!this.config.suppressWarnings) {
      console.info(`[AnalyticsManager] ${message}`);
    }
  }

  private logWarning(message: string): void {
    if (!this.config.suppressWarnings) {
      console.warn(`[AnalyticsManager] ${message}`);
    }
  }


}

// Export singleton instance
export const analyticsManager = AnalyticsManagerService.getInstance();