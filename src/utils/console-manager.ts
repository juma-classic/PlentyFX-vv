/**
 * Console Manager Utility
 * Manages console output and suppresses non-critical warnings in production
 */

interface ConsoleConfig {
    suppressWarnings: boolean;
    suppressInfo: boolean;
    allowedPatterns: string[];
    blockedPatterns: string[];
}

class ConsoleManager {
    private static instance: ConsoleManager;
    private config: ConsoleConfig;
    private originalConsole: {
        log: typeof console.log;
        warn: typeof console.warn;
        error: typeof console.error;
        info: typeof console.info;
    };

    private constructor() {
        this.config = {
            suppressWarnings: process.env.NODE_ENV === 'production',
            suppressInfo: process.env.NODE_ENV === 'production',
            allowedPatterns: [
                '✅',
                '🚀',
                '📊',
                '🎯', // Success and progress indicators
                'API available',
                'initialized',
                'connected', // Important status messages
            ],
            blockedPatterns: [
                'TrackJS: missing token',
                'Cannot initialize Google Drive client',
                'GTM blocked by client',
                'Google Tag Manager',
                'Failed to load resource: net::ERR_BLOCKED_BY_CLIENT',
            ],
        };

        // Store original console methods
        this.originalConsole = {
            log: console.log.bind(console),
            warn: console.warn.bind(console),
            error: console.error.bind(console),
            info: console.info.bind(console),
        };

        this.initializeConsoleOverrides();
    }

    public static getInstance(): ConsoleManager {
        if (!ConsoleManager.instance) {
            ConsoleManager.instance = new ConsoleManager();
        }
        return ConsoleManager.instance;
    }

    /**
     * Initialize console method overrides
     */
    private initializeConsoleOverrides(): void {
        // Override console.warn
        console.warn = (...args: any[]) => {
            if (this.shouldSuppressMessage('warn', args)) {
                return;
            }
            this.originalConsole.warn(...args);
        };

        // Override console.info
        console.info = (...args: any[]) => {
            if (this.shouldSuppressMessage('info', args)) {
                return;
            }
            this.originalConsole.info(...args);
        };

        // Keep error and log methods mostly unchanged but filter blocked patterns
        console.error = (...args: any[]) => {
            if (this.shouldSuppressMessage('error', args)) {
                return;
            }
            this.originalConsole.error(...args);
        };

        console.log = (...args: any[]) => {
            if (this.shouldSuppressMessage('log', args)) {
                return;
            }
            this.originalConsole.log(...args);
        };
    }

    /**
     * Check if message should be suppressed
     */
    private shouldSuppressMessage(level: string, args: any[]): boolean {
        const message = args.join(' ');

        // Always allow messages with allowed patterns
        if (this.config.allowedPatterns.some(pattern => message.includes(pattern))) {
            return false;
        }

        // Block messages with blocked patterns
        if (this.config.blockedPatterns.some(pattern => message.includes(pattern))) {
            return true;
        }

        // Block module loading errors that are not critical
        if (message.includes('Failed to load module script') && message.includes('MIME type')) {
            return true;
        }

        // Block iframe sandbox warnings
        if (message.includes('iframe which has both allow-scripts and allow-same-origin')) {
            return true;
        }

        // Block forced reflow warnings in production
        if (message.includes('Forced reflow while executing JavaScript') && this.config.suppressWarnings) {
            return true;
        }

        // Apply level-based suppression
        if (level === 'warn' && this.config.suppressWarnings) {
            return true;
        }

        if (level === 'info' && this.config.suppressInfo) {
            return true;
        }

        return false;
    }

    /**
     * Temporarily allow all console output
     */
    public enableDebugMode(): void {
        this.config.suppressWarnings = false;
        this.config.suppressInfo = false;
    }

    /**
     * Restore production console settings
     */
    public enableProductionMode(): void {
        this.config.suppressWarnings = true;
        this.config.suppressInfo = true;
    }

    /**
     * Add pattern to blocked list
     */
    public blockPattern(pattern: string): void {
        if (!this.config.blockedPatterns.includes(pattern)) {
            this.config.blockedPatterns.push(pattern);
        }
    }

    /**
     * Add pattern to allowed list
     */
    public allowPattern(pattern: string): void {
        if (!this.config.allowedPatterns.includes(pattern)) {
            this.config.allowedPatterns.push(pattern);
        }
    }

    /**
     * Get current configuration
     */
    public getConfig(): ConsoleConfig {
        return { ...this.config };
    }

    /**
     * Reset console to original methods
     */
    public reset(): void {
        console.log = this.originalConsole.log;
        console.warn = this.originalConsole.warn;
        console.error = this.originalConsole.error;
        console.info = this.originalConsole.info;
    }
}

// Initialize console manager
export const consoleManager = ConsoleManager.getInstance();

// Export for external configuration
export type { ConsoleConfig };
