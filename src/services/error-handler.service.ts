/**
 * Centralized Error Handler Service
 * Manages console errors, warnings, and provides graceful fallbacks
 */

interface ErrorConfig {
    suppressWarnings: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    enableRetry: boolean;
    maxRetries: number;
}

interface ErrorContext {
    service: string;
    operation: string;
    timestamp: number;
    userAgent?: string;
}

class ErrorHandlerService {
    private static instance: ErrorHandlerService;
    private config: ErrorConfig;
    private errorCounts: Map<string, number> = new Map();
    private suppressedErrors: Set<string> = new Set();

    private constructor() {
        this.config = {
            suppressWarnings: process.env.NODE_ENV === 'production',
            logLevel: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
            enableRetry: true,
            maxRetries: 3
        };

        this.initializeErrorSuppression();
    }

    public static getInstance(): ErrorHandlerService {
        if (!ErrorHandlerService.instance) {
            ErrorHandlerService.instance = new ErrorHandlerService();
        }
        return ErrorHandlerService.instance;
    }

    /**
     * Initialize suppression for known non-critical errors
     */
    private initializeErrorSuppression(): void {
        // Suppress known non-critical warnings
        this.suppressedErrors.add('TrackJS: missing token');
        this.suppressedErrors.add('Cannot initialize Google Drive client');
        this.suppressedErrors.add('GTM blocked by client');
        this.suppressedErrors.add('Google Tag Manager');
    }

    /**
     * Handle API timeout errors with retry logic
     */
    public async handleApiTimeout<T>(
        operation: () => Promise<T>,
        context: ErrorContext,
        customTimeout: number = 10000
    ): Promise<T> {
        const key = `${context.service}-${context.operation}`;
        const retryCount = this.errorCounts.get(key) || 0;

        try {
            // Create timeout promise
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Operation timeout')), customTimeout);
            });

            // Race between operation and timeout
            const result = await Promise.race([operation(), timeoutPromise]);
            
            // Reset retry count on success
            this.errorCounts.delete(key);
            return result;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            
            if (retryCount < this.config.maxRetries && this.config.enableRetry) {
                this.errorCounts.set(key, retryCount + 1);
                
                // Exponential backoff
                const delay = Math.pow(2, retryCount) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
                
                this.logError(`Retrying ${context.service}.${context.operation} (attempt ${retryCount + 1})`, context);
                return this.handleApiTimeout(operation, context, customTimeout);
            }

            // Max retries reached or retry disabled
            this.logError(`Failed after ${retryCount + 1} attempts: ${errorMessage}`, context);
            throw error;
        }
    }

    /**
     * Handle service initialization errors
     */
    public handleServiceInitError(
        serviceName: string,
        error: Error,
        fallbackAction?: () => void
    ): void {
        const errorMessage = error.message;
        
        // Check if this is a suppressed error
        if (this.isSuppressedError(errorMessage)) {
            this.logDebug(`Suppressed ${serviceName} initialization warning: ${errorMessage}`);
            if (fallbackAction) fallbackAction();
            return;
        }

        // Log the error appropriately
        this.logError(`${serviceName} initialization failed: ${errorMessage}`, {
            service: serviceName,
            operation: 'initialize',
            timestamp: Date.now()
        });

        // Execute fallback if provided
        if (fallbackAction) {
            try {
                fallbackAction();
                this.logInfo(`${serviceName} fallback executed successfully`);
            } catch (fallbackError) {
                this.logError(`${serviceName} fallback failed: ${fallbackError}`, {
                    service: serviceName,
                    operation: 'fallback',
                    timestamp: Date.now()
                });
            }
        }
    }

    /**
     * Check if error should be suppressed
     */
    private isSuppressedError(errorMessage: string): boolean {
        return Array.from(this.suppressedErrors).some(pattern => 
            errorMessage.includes(pattern)
        );
    }

    /**
     * Safe console logging with level control
     */
    private logError(message: string, context?: ErrorContext): void {
        if (this.shouldLog('error')) {
            console.error(`🚨 [${context?.service || 'System'}] ${message}`, context);
        }
    }

    private logWarn(message: string, context?: ErrorContext): void {
        if (this.shouldLog('warn') && !this.config.suppressWarnings) {
            console.warn(`⚠️ [${context?.service || 'System'}] ${message}`, context);
        }
    }

    private logInfo(message: string, context?: ErrorContext): void {
        if (this.shouldLog('info')) {
            console.info(`ℹ️ [${context?.service || 'System'}] ${message}`, context);
        }
    }

    private logDebug(message: string, context?: ErrorContext): void {
        if (this.shouldLog('debug')) {
            console.debug(`🔍 [${context?.service || 'System'}] ${message}`, context);
        }
    }

    /**
     * Check if message should be logged based on level
     */
    private shouldLog(level: string): boolean {
        const levels = ['error', 'warn', 'info', 'debug'];
        const currentLevelIndex = levels.indexOf(this.config.logLevel);
        const messageLevelIndex = levels.indexOf(level);
        return messageLevelIndex <= currentLevelIndex;
    }

    /**
     * Create safe wrapper for async operations
     */
    public createSafeWrapper<T>(
        operation: () => Promise<T>,
        serviceName: string,
        operationName: string,
        fallbackValue?: T
    ): () => Promise<T> {
        return async () => {
            try {
                return await this.handleApiTimeout(
                    operation,
                    {
                        service: serviceName,
                        operation: operationName,
                        timestamp: Date.now()
                    }
                );
            } catch (error) {
                this.handleServiceInitError(
                    serviceName,
                    error instanceof Error ? error : new Error('Unknown error'),
                    fallbackValue !== undefined ? () => fallbackValue : undefined
                );
                
                if (fallbackValue !== undefined) {
                    return fallbackValue;
                }
                throw error;
            }
        };
    }

    /**
     * Get error statistics
     */
    public getErrorStats() {
        return {
            totalErrors: Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0),
            errorsByService: Object.fromEntries(this.errorCounts),
            suppressedErrorTypes: Array.from(this.suppressedErrors),
            config: this.config
        };
    }

    /**
     * Update configuration
     */
    public updateConfig(newConfig: Partial<ErrorConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }
}

// Export singleton instance
export const errorHandler = ErrorHandlerService.getInstance();

// Export types for external use
export type { ErrorConfig, ErrorContext };