/**
 * Chunk Error Handler
 * Handles chunk loading failures with automatic retry and fallback mechanisms
 */

interface ChunkErrorConfig {
    maxRetries: number;
    retryDelay: number;
    enableFallback: boolean;
}

class ChunkErrorHandler {
    private config: ChunkErrorConfig;
    private retryCount: Map<string, number> = new Map();
    private isHandling: boolean = false;

    constructor(config: Partial<ChunkErrorConfig> = {}) {
        this.config = {
            maxRetries: 3,
            retryDelay: 1000,
            enableFallback: true,
            ...config,
        };

        this.setupErrorHandlers();
    }

    /**
     * Setup global error handlers for chunk loading failures
     */
    private setupErrorHandlers(): void {
        // Handle chunk loading errors
        window.addEventListener('error', event => {
            if (this.isChunkLoadError(event)) {
                this.handleChunkError(event);
            }
        });

        // Handle unhandled promise rejections (often chunk loading failures)
        window.addEventListener('unhandledrejection', event => {
            if (this.isChunkLoadRejection(event)) {
                this.handleChunkRejection(event);
            }
        });

        // Override dynamic import to add retry logic
        this.setupDynamicImportRetry();
    }

    /**
     * Check if error is related to chunk loading
     */
    private isChunkLoadError(event: ErrorEvent): boolean {
        const message = event.message?.toLowerCase() || '';
        const filename = event.filename || '';

        return (
            message.includes('loading chunk') ||
            message.includes('loading css chunk') ||
            message.includes('chunk load failed') ||
            filename.includes('.chunk.') ||
            filename.includes('/static/js/') ||
            filename.includes('/static/css/')
        );
    }

    /**
     * Check if promise rejection is related to chunk loading
     */
    private isChunkLoadRejection(event: PromiseRejectionEvent): boolean {
        const reason = event.reason?.message?.toLowerCase() || '';

        return (
            reason.includes('loading chunk') ||
            reason.includes('loading css chunk') ||
            reason.includes('chunk load failed') ||
            reason.includes('network error') ||
            reason.includes('fetch')
        );
    }

    /**
     * Handle chunk loading errors
     */
    private async handleChunkError(event: ErrorEvent): Promise<void> {
        if (this.isHandling) return;

        console.warn('🚨 Chunk loading error detected:', event.message);

        const chunkId = this.extractChunkId(event.filename || '');
        const currentRetries = this.retryCount.get(chunkId) || 0;

        if (currentRetries < this.config.maxRetries) {
            event.preventDefault();
            this.isHandling = true;

            try {
                await this.retryChunkLoad(chunkId, currentRetries);
            } catch (error) {
                console.error('❌ Chunk retry failed:', error);
                this.handleFallback();
            } finally {
                this.isHandling = false;
            }
        } else {
            console.error('❌ Max chunk retries exceeded, falling back');
            this.handleFallback();
        }
    }

    /**
     * Handle chunk loading promise rejections
     */
    private async handleChunkRejection(event: PromiseRejectionEvent): Promise<void> {
        if (this.isHandling) return;

        console.warn('🚨 Chunk loading rejection detected:', event.reason);

        event.preventDefault();
        this.isHandling = true;

        try {
            // Wait a bit and reload the page as fallback
            await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));

            if (this.config.enableFallback) {
                console.log('🔄 Reloading page due to chunk loading failure...');
                window.location.reload();
            }
        } finally {
            this.isHandling = false;
        }
    }

    /**
     * Extract chunk ID from filename
     */
    private extractChunkId(filename: string): string {
        const match = filename.match(/\/([^\/]+)\.chunk\./);
        return match ? match[1] : filename;
    }

    /**
     * Retry chunk loading
     */
    private async retryChunkLoad(chunkId: string, currentRetries: number): Promise<void> {
        const newRetryCount = currentRetries + 1;
        this.retryCount.set(chunkId, newRetryCount);

        console.log(`🔄 Retrying chunk load for ${chunkId} (attempt ${newRetryCount}/${this.config.maxRetries})`);

        // Wait before retry with exponential backoff
        const delay = this.config.retryDelay * Math.pow(2, currentRetries);
        await new Promise(resolve => setTimeout(resolve, delay));

        // Clear browser cache for this chunk
        if ('caches' in window) {
            try {
                const cacheNames = await caches.keys();
                for (const cacheName of cacheNames) {
                    const cache = await caches.open(cacheName);
                    const requests = await cache.keys();

                    for (const request of requests) {
                        if (request.url.includes(chunkId)) {
                            await cache.delete(request);
                            console.log(`🗑️ Cleared cache for ${request.url}`);
                        }
                    }
                }
            } catch (error) {
                console.warn('⚠️ Failed to clear cache:', error);
            }
        }

        // Reload the page to retry chunk loading
        window.location.reload();
    }

    /**
     * Handle fallback when all retries fail
     */
    private handleFallback(): void {
        if (!this.config.enableFallback) return;

        console.log('🆘 Activating chunk loading fallback...');

        // Show user-friendly error message
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #fff;
                border: 2px solid #ff4444;
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 10000;
                text-align: center;
                font-family: Arial, sans-serif;
            ">
                <h3 style="color: #ff4444; margin: 0 0 10px 0;">Loading Error</h3>
                <p style="margin: 0 0 15px 0;">Failed to load application resources.</p>
                <button onclick="window.location.reload()" style="
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                ">Reload Page</button>
            </div>
        `;

        document.body.appendChild(errorDiv);

        // Auto-reload after 5 seconds
        setTimeout(() => {
            window.location.reload();
        }, 5000);
    }

    /**
     * Setup dynamic import retry mechanism
     */
    private setupDynamicImportRetry(): void {
        const originalImport = window.__webpack_require__;

        if (originalImport) {
            // Override webpack's chunk loading
            const originalEnsure = originalImport.e;

            if (originalEnsure) {
                originalImport.e = (chunkId: string) => {
                    return originalEnsure(chunkId).catch((error: Error) => {
                        console.warn(`🚨 Dynamic import failed for chunk ${chunkId}:`, error);

                        // Retry with exponential backoff
                        return this.retryDynamicImport(chunkId, originalEnsure, 0);
                    });
                };
            }
        }
    }

    /**
     * Retry dynamic import with backoff
     */
    private async retryDynamicImport(
        chunkId: string,
        originalEnsure: (chunkId: string) => Promise<any>,
        attempt: number
    ): Promise<any> {
        if (attempt >= this.config.maxRetries) {
            throw new Error(`Failed to load chunk ${chunkId} after ${this.config.maxRetries} attempts`);
        }

        const delay = this.config.retryDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));

        console.log(`🔄 Retrying dynamic import for chunk ${chunkId} (attempt ${attempt + 1})`);

        try {
            return await originalEnsure(chunkId);
        } catch (error) {
            return this.retryDynamicImport(chunkId, originalEnsure, attempt + 1);
        }
    }

    /**
     * Reset retry counts
     */
    public reset(): void {
        this.retryCount.clear();
        this.isHandling = false;
    }

    /**
     * Get current retry statistics
     */
    public getStats() {
        return {
            retryCount: Object.fromEntries(this.retryCount),
            isHandling: this.isHandling,
            config: this.config,
        };
    }
}

// Create and export singleton instance
export const chunkErrorHandler = new ChunkErrorHandler({
    maxRetries: 3,
    retryDelay: 2000,
    enableFallback: true,
});

// Initialize immediately
console.log('🛡️ Chunk error handler initialized');
