/**
 * Error Logger Utility
 * Provides centralized error logging for debugging and monitoring
 */

export interface ErrorLogEntry {
    timestamp: number;
    component: string;
    error: Error | string;
    context?: Record<string, any>;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

class ErrorLogger {
    private logs: ErrorLogEntry[] = [];
    private maxLogs: number = 100;
    private isEnabled: boolean = true;

    /**
     * Log an error with context
     */
    logError(
        component: string,
        error: Error | string,
        severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
        context?: Record<string, any>
    ): void {
        if (!this.isEnabled) return;

        const entry: ErrorLogEntry = {
            timestamp: Date.now(),
            component,
            error,
            context,
            severity
        };

        this.logs.push(entry);

        // Keep only the most recent logs
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // Console logging based on severity
        const errorMessage = error instanceof Error ? error.message : error;
        const logMessage = `[${component}] ${errorMessage}`;

        switch (severity) {
            case 'critical':
                console.error('🔴 CRITICAL:', logMessage, context);
                break;
            case 'high':
                console.error('🟠 HIGH:', logMessage, context);
                break;
            case 'medium':
                console.warn('🟡 MEDIUM:', logMessage, context);
                break;
            case 'low':
                console.log('🟢 LOW:', logMessage, context);
                break;
        }

        // Send to external error tracking if available
        if (window.TrackJS && severity !== 'low') {
            if (error instanceof Error) {
                window.TrackJS.track(error);
            } else {
                window.TrackJS.console.error(logMessage);
            }
        }
    }

    /**
     * Get all logged errors
     */
    getLogs(): ErrorLogEntry[] {
        return [...this.logs];
    }

    /**
     * Get logs filtered by component
     */
    getLogsByComponent(component: string): ErrorLogEntry[] {
        return this.logs.filter(log => log.component === component);
    }

    /**
     * Get logs filtered by severity
     */
    getLogsBySeverity(severity: 'low' | 'medium' | 'high' | 'critical'): ErrorLogEntry[] {
        return this.logs.filter(log => log.severity === severity);
    }

    /**
     * Get logs within a time range
     */
    getLogsByTimeRange(startTime: number, endTime: number): ErrorLogEntry[] {
        return this.logs.filter(log => log.timestamp >= startTime && log.timestamp <= endTime);
    }

    /**
     * Clear all logs
     */
    clearLogs(): void {
        this.logs = [];
    }

    /**
     * Enable or disable logging
     */
    setEnabled(enabled: boolean): void {
        this.isEnabled = enabled;
    }

    /**
     * Set maximum number of logs to keep
     */
    setMaxLogs(max: number): void {
        this.maxLogs = max;
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }
    }

    /**
     * Export logs as JSON
     */
    exportLogs(): string {
        return JSON.stringify(this.logs, null, 2);
    }

    /**
     * Get error statistics
     */
    getStatistics(): {
        total: number;
        bySeverity: Record<string, number>;
        byComponent: Record<string, number>;
    } {
        const stats = {
            total: this.logs.length,
            bySeverity: {
                low: 0,
                medium: 0,
                high: 0,
                critical: 0
            },
            byComponent: {} as Record<string, number>
        };

        this.logs.forEach(log => {
            stats.bySeverity[log.severity]++;
            stats.byComponent[log.component] = (stats.byComponent[log.component] || 0) + 1;
        });

        return stats;
    }
}

// Export singleton instance
export const errorLogger = new ErrorLogger();

// Export convenience functions
export const logError = (
    component: string,
    error: Error | string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    context?: Record<string, any>
): void => {
    errorLogger.logError(component, error, severity, context);
};

export const getErrorLogs = (): ErrorLogEntry[] => {
    return errorLogger.getLogs();
};

export const clearErrorLogs = (): void => {
    errorLogger.clearLogs();
};
