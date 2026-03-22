/**
 * Network Timeout Handler
 * Manages network timeouts and connection issues for better user experience
 */

interface NetworkConfig {
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
    enableOfflineDetection: boolean;
}

class NetworkTimeoutHandler {
    private config: NetworkConfig;
    private isOnline: boolean = navigator.onLine;
    private retryQueue: Map<string, () => Promise<any>> = new Map();
    private timeoutIds: Map<string, NodeJS.Timeout> = new Map();

    constructor(config: Partial<NetworkConfig> = {}) {
        this.config = {
            timeout: 30000, // 30 seconds
            retryAttempts: 3,
            retryDelay: 2000, // 2 seconds
            enableOfflineDetection: true,
            ...config,
        };

        this.setupNetworkMonitoring();
        this.setupFetchInterceptor();
    }

    /**
     * Setup network monitoring
     */
    private setupNetworkMonitoring(): void {
        if (!this.config.enableOfflineDetection) return;

        window.addEventListener('online', () => {
            console.log('🌐 Network connection restored');
            this.isOnline = true;
            this.processRetryQueue();
        });

        window.addEventListener('offline', () => {
            console.warn('📡 Network connection lost');
            this.isOnline = false;
            this.showOfflineMessage();
        });

        // Periodic connectivity check
        setInterval(() => {
            this.checkConnectivity();
        }, 30000); // Check every 30 seconds
    }

    /**
     * Setup fetch interceptor for timeout handling
     */
    private setupFetchInterceptor(): void {
        const originalFetch = window.fetch;

        window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
            const url = typeof input === 'string' ? input : input.toString();
            const requestId = `${Date.now()}_${Math.random()}`;

            // Add timeout to request
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
                console.warn(`⏰ Request timeout for ${url}`);
            }, this.config.timeout);

            this.timeoutIds.set(requestId, timeoutId);

            try {
                const response = await originalFetch(input, {
                    ...init,
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);
                this.timeoutIds.delete(requestId);

                return response;
            } catch (error) {
                clearTimeout(timeoutId);
                this.timeoutIds.delete(requestId);

                if (error instanceof Error) {
                    if (error.name === 'AbortError') {
                        console.warn(`🚨 Request aborted due to timeout: ${url}`);
                        return this.handleTimeoutError(url, () => originalFetch(input, init));
                    }

                    if (this.isNetworkError(error)) {
                        console.warn(`🌐 Network error for ${url}:`, error.message);
                        return this.handleNetworkError(url, () => originalFetch(input, init));
                    }
                }

                throw error;
            }
        };
    }

    /**
     * Check if error is network-related
     */
    private isNetworkError(error: Error): boolean {
        const message = error.message.toLowerCase();
        return (
            message.includes('network') ||
            message.includes('fetch') ||
            message.includes('connection') ||
            message.includes('timeout') ||
            message.includes('cors') ||
            error.name === 'TypeError'
        );
    }

    /**
     * Handle timeout errors with retry logic
     */
    private async handleTimeoutError(url: string, retryFn: () => Promise<Response>): Promise<Response> {
        console.log(`🔄 Handling timeout error for ${url}`);

        for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
            console.log(`🔄 Retry attempt ${attempt}/${this.config.retryAttempts} for ${url}`);

            await this.delay(this.config.retryDelay * attempt);

            try {
                const response = await retryFn();
                console.log(`✅ Retry successful for ${url}`);
                return response;
            } catch (error) {
                if (attempt === this.config.retryAttempts) {
                    console.error(`❌ All retry attempts failed for ${url}`);
                    throw new Error(`Request timeout after ${this.config.retryAttempts} attempts: ${url}`);
                }
            }
        }

        throw new Error(`Request timeout: ${url}`);
    }

    /**
     * Handle network errors
     */
    private async handleNetworkError(url: string, retryFn: () => Promise<Response>): Promise<Response> {
        if (!this.isOnline) {
            console.log(`📡 Queueing request for when online: ${url}`);
            this.retryQueue.set(url, retryFn);
            throw new Error(`Network offline: ${url}`);
        }

        return this.handleTimeoutError(url, retryFn);
    }

    /**
     * Process queued requests when back online
     */
    private async processRetryQueue(): Promise<void> {
        if (this.retryQueue.size === 0) return;

        console.log(`🔄 Processing ${this.retryQueue.size} queued requests`);

        const promises = Array.from(this.retryQueue.entries()).map(async ([url, retryFn]) => {
            try {
                await retryFn();
                console.log(`✅ Queued request successful: ${url}`);
                this.retryQueue.delete(url);
            } catch (error) {
                console.error(`❌ Queued request failed: ${url}`, error);
            }
        });

        await Promise.allSettled(promises);
    }

    /**
     * Check connectivity by pinging a reliable endpoint
     */
    private async checkConnectivity(): Promise<void> {
        try {
            const response = await fetch('https://api.deriv.com/ping', {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-cache',
            });

            if (!this.isOnline) {
                console.log('🌐 Connectivity restored via ping check');
                this.isOnline = true;
                this.hideOfflineMessage();
                this.processRetryQueue();
            }
        } catch (error) {
            if (this.isOnline) {
                console.warn('📡 Connectivity lost via ping check');
                this.isOnline = false;
                this.showOfflineMessage();
            }
        }
    }

    /**
     * Show offline message to user
     */
    private showOfflineMessage(): void {
        // Remove existing message
        this.hideOfflineMessage();

        const offlineDiv = document.createElement('div');
        offlineDiv.id = 'network-offline-message';
        offlineDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: #ff6b35;
                color: white;
                text-align: center;
                padding: 10px;
                z-index: 10000;
                font-family: Arial, sans-serif;
                font-size: 14px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            ">
                📡 No internet connection. Please check your network and try again.
            </div>
        `;

        document.body.appendChild(offlineDiv);
    }

    /**
     * Hide offline message
     */
    private hideOfflineMessage(): void {
        const existingMessage = document.getElementById('network-offline-message');
        if (existingMessage) {
            existingMessage.remove();
        }
    }

    /**
     * Utility delay function
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Create a timeout wrapper for promises
     */
    public withTimeout<T>(promise: Promise<T>, timeoutMs?: number): Promise<T> {
        const timeout = timeoutMs || this.config.timeout;

        return Promise.race([
            promise,
            new Promise<never>((_, reject) => {
                setTimeout(() => {
                    reject(new Error(`Operation timed out after ${timeout}ms`));
                }, timeout);
            }),
        ]);
    }

    /**
     * Create a retry wrapper for functions
     */
    public async withRetry<T>(fn: () => Promise<T>, attempts?: number, delay?: number): Promise<T> {
        const maxAttempts = attempts || this.config.retryAttempts;
        const retryDelay = delay || this.config.retryDelay;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                if (attempt === maxAttempts) {
                    throw error;
                }

                console.warn(`🔄 Retry attempt ${attempt}/${maxAttempts} failed:`, error);
                await this.delay(retryDelay * attempt);
            }
        }

        throw new Error('All retry attempts failed');
    }

    /**
     * Get current network status
     */
    public getNetworkStatus() {
        return {
            isOnline: this.isOnline,
            queuedRequests: this.retryQueue.size,
            activeTimeouts: this.timeoutIds.size,
            config: this.config,
        };
    }

    /**
     * Clear all timeouts and queues
     */
    public cleanup(): void {
        // Clear all timeouts
        this.timeoutIds.forEach(timeoutId => clearTimeout(timeoutId));
        this.timeoutIds.clear();

        // Clear retry queue
        this.retryQueue.clear();

        // Hide offline message
        this.hideOfflineMessage();

        console.log('🧹 Network timeout handler cleaned up');
    }
}

// Create and export singleton instance
export const networkTimeoutHandler = new NetworkTimeoutHandler({
    timeout: 60000, // 60 seconds for better stability
    retryAttempts: 3,
    retryDelay: 2000,
    enableOfflineDetection: true,
});

// Initialize immediately
console.log('🌐 Network timeout handler initialized');
