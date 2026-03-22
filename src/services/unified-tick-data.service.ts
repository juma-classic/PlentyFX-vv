/**
 * Unified Tick Data Service
 * Handles both historical and live tick data using the same Deriv connection
 */

import { ConnectionType, derivConnectionPool } from './deriv-connection-pool.service';
import { derivAPIInitializer } from './deriv-api-initializer.service';

interface TickData {
    quote: number;
    epoch: number;
    lastDigit: number;
    symbol: string;
}

interface UnifiedTickResult {
    success: boolean;
    historicalTicks: TickData[];
    liveSubscription?: () => void;
    error?: string;
}

export class UnifiedTickDataService {
    private static instance: UnifiedTickDataService;
    private activeSubscriptions: Map<string, () => void> = new Map();

    public static getInstance(): UnifiedTickDataService {
        if (!UnifiedTickDataService.instance) {
            UnifiedTickDataService.instance = new UnifiedTickDataService();
        }
        return UnifiedTickDataService.instance;
    }

    /**
     * Initialize complete tick data stream (historical + live) with enhanced error handling
     */
    public async initializeTickStream(
        symbol: string,
        historicalCount: number = 1000,
        onLiveTick: (tickData: TickData) => void,
        connectionType: ConnectionType = ConnectionType.SIGNALS
    ): Promise<UnifiedTickResult> {
        console.log(`🚀 Initializing unified tick stream for ${symbol}...`);

        // Enhanced retry logic for initialization
        let retryCount = 0;
        const maxRetries = 3;

        try {
            while (retryCount < maxRetries) {
                try {
                    // Step 1: Ensure API is initialized
                    await this.ensureAPIInitialized();

                    // Step 2: Load historical data first with timeout
                    const historicalTicks = await Promise.race([
                        this.loadHistoricalTicks(symbol, historicalCount, connectionType),
                        new Promise<never>((_, reject) =>
                            setTimeout(() => reject(new Error('Historical data timeout')), 20000)
                        ),
                    ]);

                    // Step 3: Set up live subscription using the same connection
                    const liveUnsubscribe = await this.subscribeLiveTicks(symbol, onLiveTick, connectionType);

                    // Store subscription for cleanup
                    this.activeSubscriptions.set(symbol, liveUnsubscribe);

                    console.log(
                        `✅ Unified tick stream initialized for ${symbol}: ${historicalTicks.length} historical + live`
                    );

                    return {
                        success: true,
                        historicalTicks,
                        liveSubscription: liveUnsubscribe,
                    };
                } catch (retryError) {
                    retryCount++;
                    const errorMessage = retryError instanceof Error ? retryError.message : 'Unknown error';

                    if (retryCount < maxRetries) {
                        console.warn(`⚠️ Retry ${retryCount}/${maxRetries} for ${symbol}: ${errorMessage}`);
                        // Exponential backoff
                        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));

                        // Reset API connection on retry
                        if (errorMessage.includes('API') || errorMessage.includes('timeout')) {
                            console.log('🔄 Resetting API connection for retry...');
                            derivAPIInitializer.reset();
                        }
                    } else {
                        throw retryError;
                    }
                }
            }

            // This should never be reached, but TypeScript requires it
            throw new Error('Maximum retries exceeded');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(
                `❌ Failed to initialize tick stream for ${symbol} after ${maxRetries} attempts:`,
                errorMessage
            );

            // Return partial success if we have some data
            return {
                success: false,
                historicalTicks: [],
                error: errorMessage,
            };
        }
    }

    /**
     * Ensure API is properly initialized before making requests
     */
    private async ensureAPIInitialized(): Promise<void> {
        try {
            if (!derivAPIInitializer.isReady()) {
                console.log('🔧 API not ready, initializing...');
                await derivAPIInitializer.initialize();
            }

            // Double-check API availability
            const api = await derivAPIInitializer.getAPI();
            if (!api || typeof api.send !== 'function') {
                throw new Error('API not properly initialized after initialization attempt');
            }

            console.log('✅ API is ready for use');
        } catch (error) {
            console.error('❌ Failed to ensure API initialization:', error);
            throw new Error(`API initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Load historical ticks using the initialized API
     */
    private async loadHistoricalTicks(
        symbol: string,
        count: number,
        connectionType: ConnectionType
    ): Promise<TickData[]> {
        console.log(`📊 Loading ${count} historical ticks for ${symbol}...`);

        try {
            // Ensure API is initialized and ready
            await derivAPIInitializer.waitForReady(15000);

            // Get the API instance (this will initialize if needed)
            const api = derivAPIInitializer.getAPI();

            if (!api || typeof api.send !== 'function') {
                throw new Error('Deriv API not properly initialized - send method not available');
            }

            const request = {
                ticks_history: symbol,
                adjust_start_time: 1,
                count: Math.min(count, 5000), // API limit
                end: 'latest',
                style: 'ticks',
            };

            console.log('📡 Requesting historical data via unified API:', request);

            const response = await Promise.race([
                api.send(request),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Historical data request timeout')), 15000)
                ),
            ]);

            if (response.error) {
                const errorCode = response.error.code;
                const errorMessage = response.error.message;

                // Handle specific API errors
                if (errorCode === 'InvalidToken') {
                    throw new Error('Invalid API token. Please check your Deriv API token and try again.');
                } else if (errorCode === 'PermissionDenied') {
                    throw new Error('Permission denied. Please check your API token permissions.');
                }

                throw new Error(errorMessage || 'API error');
            }

            if (!response.ticks_history || !response.ticks_history.prices) {
                throw new Error('Invalid historical data response');
            }

            // Process historical data using same method as live data
            const ticks: TickData[] = response.ticks_history.prices.map((price: number, index: number) => {
                const quote = parseFloat(price.toString());
                const epoch = response.ticks_history.times[index];
                const lastDigit = this.extractLastDigit(quote);

                return {
                    quote,
                    epoch,
                    lastDigit,
                    symbol,
                };
            });

            console.log(`✅ Loaded ${ticks.length} historical ticks for ${symbol}`);
            return ticks;
        } catch (error) {
            console.error('❌ Failed to load historical ticks:', error);
            throw error;
        }
    }

    /**
     * Subscribe to live ticks using the connection pool
     */
    private async subscribeLiveTicks(
        symbol: string,
        onTick: (tickData: TickData) => void,
        connectionType: ConnectionType
    ): Promise<() => void> {
        console.log(`🎯 Subscribing to live ticks for ${symbol}...`);

        const unsubscribe = await derivConnectionPool.subscribeToTicks(
            symbol,
            (rawTickData: any) => {
                try {
                    // Extract quote using same method as historical data
                    let quote: number;
                    if (rawTickData.tick && typeof rawTickData.tick.quote !== 'undefined') {
                        quote = parseFloat(rawTickData.tick.quote);
                    } else if (typeof rawTickData.quote !== 'undefined') {
                        quote = parseFloat(rawTickData.quote);
                    } else {
                        console.error('❌ No quote found in live tick data:', rawTickData);
                        return;
                    }

                    // Validate quote
                    if (isNaN(quote) || quote <= 0) {
                        console.error('❌ Invalid quote value:', quote);
                        return;
                    }

                    // Extract epoch
                    const epoch = rawTickData.tick?.epoch || rawTickData.epoch || Math.floor(Date.now() / 1000);

                    // Extract last digit using same method as historical data
                    const lastDigit = this.extractLastDigit(quote);

                    // Create unified tick data structure
                    const tickData: TickData = {
                        quote,
                        epoch,
                        lastDigit,
                        symbol,
                    };

                    // Call the callback with processed data
                    onTick(tickData);
                } catch (error) {
                    console.error('❌ Error processing live tick:', error);
                }
            },
            connectionType
        );

        return unsubscribe;
    }

    /**
     * Extract last digit using consistent method for both historical and live data
     */
    private extractLastDigit(quote: number): number {
        // Use string-based method for accuracy (same as validation)
        const quoteStr = quote.toFixed(5);
        const digitsOnly = quoteStr.replace('.', '');
        return parseInt(digitsOnly.slice(-1));
    }

    /**
     * Cleanup subscription for a symbol
     */
    public cleanupSubscription(symbol: string): void {
        const unsubscribe = this.activeSubscriptions.get(symbol);
        if (unsubscribe) {
            unsubscribe();
            this.activeSubscriptions.delete(symbol);
            console.log(`🧹 Cleaned up subscription for ${symbol}`);
        }
    }

    /**
     * Cleanup all subscriptions
     */
    public cleanupAll(): void {
        this.activeSubscriptions.forEach((unsubscribe, symbol) => {
            unsubscribe();
            console.log(`🧹 Cleaned up subscription for ${symbol}`);
        });
        this.activeSubscriptions.clear();
    }

    /**
     * Get connection statistics
     */
    public getConnectionStats() {
        return {
            activeSubscriptions: this.activeSubscriptions.size,
            symbols: Array.from(this.activeSubscriptions.keys()),
            connectionPool: derivConnectionPool.getConnectionStats(),
            apiState: derivAPIInitializer.getConnectionState(),
        };
    }
}

// Create singleton instance
export const unifiedTickData = UnifiedTickDataService.getInstance();
