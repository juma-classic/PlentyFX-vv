/**
 * Robust Deriv Connection Service
 * Handles persistent connections with auto-reconnection and no demo fallback
 */

import { api_base } from '@/external/bot-skeleton';

interface ConnectionConfig {
    appId: string;
    maxRetries: number;
    retryDelay: number;
    heartbeatInterval: number;
    connectionTimeout: number;
}

interface TickSubscription {
    symbol: string;
    callback: (tickData: unknown) => void;
    subscriptionId?: string;
}

export class RobustDerivConnectionService {
    private config: ConnectionConfig;
    private isConnected: boolean = false;
    private isConnecting: boolean = false;
    private retryCount: number = 0;
    private heartbeatTimer?: NodeJS.Timeout;
    private reconnectTimer?: NodeJS.Timeout;
    private subscriptions: Map<string, TickSubscription> = new Map();
    private connectionPromise?: Promise<void>;
    private lastPingTime: number = 0;
    private connectionListeners: Set<(connected: boolean) => void> = new Set();

    constructor(config: Partial<ConnectionConfig> = {}) {
        this.config = {
            appId: '110800', // Your App ID
            maxRetries: Infinity, // Never give up
            retryDelay: 1000, // Start with 1 second
            heartbeatInterval: 30000, // 30 seconds
            connectionTimeout: 60000, // 60 seconds (increased for better stability)
            ...config,
        };

        // Start connection immediately
        this.connect();

        // Monitor connection health
        this.startHealthMonitoring();
    }

    /**
     * Establish connection to Deriv API
     */
    private async connect(): Promise<void> {
        if (this.isConnecting || this.isConnected) {
            return this.connectionPromise || Promise.resolve();
        }

        this.isConnecting = true;
        console.log(`🔄 Attempting to connect to Deriv API (attempt ${this.retryCount + 1})`);

        this.connectionPromise = new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
                console.warn('⚠️ Connection timeout, retrying...');
                this.handleConnectionFailure();
                reject(new Error('Connection timeout'));
            }, this.config.connectionTimeout);

            try {
                // Initialize API connection with better error handling
                if (!api_base.api) {
                    console.log('🔧 Initializing Deriv API...');
                    // Force initialization with your App ID
                    window.DerivAPI = window.DerivAPI || {};
                    window.DerivAPI.app_id = this.config.appId;
                }

                // Wait for API to be ready with timeout handling
                const checkApiReady = () => {
                    try {
                        if (api_base.api && api_base.api.connection && api_base.api.connection.readyState === 1) {
                            clearTimeout(timeout);
                            this.handleConnectionSuccess();
                            resolve();
                        } else if (
                            api_base.api &&
                            api_base.api.connection &&
                            api_base.api.connection.readyState === 3
                        ) {
                            // Connection closed
                            clearTimeout(timeout);
                            this.handleConnectionFailure();
                            reject(new Error('Connection closed'));
                        } else {
                            setTimeout(checkApiReady, 200);
                        }
                    } catch (error) {
                        clearTimeout(timeout);
                        console.error('❌ API check error:', error);
                        this.handleConnectionFailure();
                        reject(error);
                    }
                };

                checkApiReady();
            } catch (error) {
                clearTimeout(timeout);
                console.error('❌ Connection error:', error);
                this.handleConnectionFailure();
                reject(error);
            }
        });

        try {
            await this.connectionPromise;
        } catch (error) {
            // Connection failed, schedule retry
            this.scheduleReconnect();
            throw error;
        }
    }

    /**
     * Handle successful connection
     */
    private handleConnectionSuccess(): void {
        console.log('✅ Connected to Deriv API successfully');
        this.isConnected = true;
        this.isConnecting = false;
        this.retryCount = 0;
        this.connectionPromise = undefined;

        // Notify listeners
        this.notifyConnectionListeners(true);

        // Start heartbeat
        this.startHeartbeat();

        // Restore subscriptions
        this.restoreSubscriptions();
    }

    /**
     * Handle connection failure
     */
    private handleConnectionFailure(): void {
        console.warn('⚠️ Connection failed');
        this.isConnected = false;
        this.isConnecting = false;
        this.connectionPromise = undefined;

        // Notify listeners
        this.notifyConnectionListeners(false);

        // Stop heartbeat
        this.stopHeartbeat();

        // Schedule reconnect
        this.scheduleReconnect();
    }

    /**
     * Schedule reconnection attempt
     */
    private scheduleReconnect(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }

        // Exponential backoff with jitter
        const baseDelay = this.config.retryDelay;
        const exponentialDelay = Math.min(baseDelay * Math.pow(2, this.retryCount), 30000);
        const jitter = Math.random() * 1000;
        const delay = exponentialDelay + jitter;

        console.log(`⏰ Scheduling reconnect in ${Math.round(delay / 1000)}s (attempt ${this.retryCount + 1})`);

        this.reconnectTimer = setTimeout(() => {
            this.retryCount++;
            this.connect().catch(() => {
                // Error already handled in connect()
            });
        }, delay);
    }

    /**
     * Start heartbeat to monitor connection health
     */
    private startHeartbeat(): void {
        this.stopHeartbeat();

        this.heartbeatTimer = setInterval(() => {
            this.sendPing();
        }, this.config.heartbeatInterval);
    }

    /**
     * Stop heartbeat
     */
    private stopHeartbeat(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = undefined;
        }
    }

    /**
     * Send ping to check connection health
     */
    private async sendPing(): Promise<void> {
        if (!this.isConnected || !api_base.api) {
            return;
        }

        try {
            this.lastPingTime = Date.now();

            // Send a lightweight request to check connection
            await api_base.api.ping();

            console.log('💓 Heartbeat successful');
        } catch (error) {
            console.error('💔 Heartbeat failed:', error);
            this.handleConnectionFailure();
        }
    }

    /**
     * Monitor overall connection health
     */
    private startHealthMonitoring(): void {
        setInterval(() => {
            // Check if API connection is still alive
            if (this.isConnected && api_base.api) {
                const connectionState = api_base.api.connection?.readyState;

                if (connectionState !== 1) {
                    // WebSocket.OPEN
                    console.warn('⚠️ WebSocket connection lost, reconnecting...');
                    this.handleConnectionFailure();
                }
            }

            // Check for stale connections (no ping response in 2 minutes)
            if (this.isConnected && this.lastPingTime > 0) {
                const timeSinceLastPing = Date.now() - this.lastPingTime;
                if (timeSinceLastPing > 120000) {
                    // 2 minutes
                    console.warn('⚠️ Connection appears stale, reconnecting...');
                    this.handleConnectionFailure();
                }
            }
        }, 10000); // Check every 10 seconds
    }

    /**
     * Subscribe to tick data for a symbol
     */
    public async subscribeToTicks(symbol: string, callback: (tickData: unknown) => void): Promise<() => void> {
        const subscriptionKey = `ticks_${symbol}`;

        // Store subscription for restoration after reconnect
        this.subscriptions.set(subscriptionKey, {
            symbol,
            callback,
        });

        // If not connected, wait for connection
        if (!this.isConnected) {
            console.log(`⏳ Waiting for connection to subscribe to ${symbol}...`);
            await this.waitForConnection();
        }

        try {
            console.log(`📡 Subscribing to ${symbol} ticks...`);

            const subscription = api_base.api.subscribe({
                ticks: symbol,
            });

            const subscriptionId = subscription.subscribe(
                (response: unknown) => {
                    if (response && typeof response === 'object' && 'tick' in response) {
                        callback(response);
                    }
                },
                (error: unknown) => {
                    console.error(`❌ Tick subscription error for ${symbol}:`, error);
                    // Don't reconnect on subscription errors, just log them
                }
            );

            // Store subscription ID for cleanup
            const storedSub = this.subscriptions.get(subscriptionKey);
            if (storedSub) {
                storedSub.subscriptionId = subscriptionId;
            }

            console.log(`✅ Successfully subscribed to ${symbol} ticks`);

            // Return unsubscribe function
            return () => {
                try {
                    subscription.unsubscribe();
                    this.subscriptions.delete(subscriptionKey);
                    console.log(`🔇 Unsubscribed from ${symbol} ticks`);
                } catch (error) {
                    console.error(`❌ Error unsubscribing from ${symbol}:`, error);
                }
            };
        } catch (error) {
            console.error(`❌ Failed to subscribe to ${symbol}:`, error);
            throw error;
        }
    }

    /**
     * Wait for connection to be established
     */
    private async waitForConnection(timeout: number = 30000): Promise<void> {
        const startTime = Date.now();

        while (!this.isConnected && Date.now() - startTime < timeout) {
            if (this.connectionPromise) {
                try {
                    await this.connectionPromise;
                    return;
                } catch {
                    // Continue waiting
                }
            }

            await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (!this.isConnected) {
            throw new Error('Connection timeout while waiting for Deriv API');
        }
    }

    /**
     * Restore all subscriptions after reconnection
     */
    private async restoreSubscriptions(): Promise<void> {
        console.log(`🔄 Restoring ${this.subscriptions.size} subscriptions...`);

        for (const [, subscription] of this.subscriptions.entries()) {
            try {
                // Re-subscribe
                const newSubscription = api_base.api.subscribe({
                    ticks: subscription.symbol,
                });

                const subscriptionId = newSubscription.subscribe(
                    (response: unknown) => {
                        if (response && typeof response === 'object' && 'tick' in response) {
                            subscription.callback(response);
                        }
                    },
                    (error: unknown) => {
                        console.error(`❌ Restored subscription error for ${subscription.symbol}:`, error);
                    }
                );

                subscription.subscriptionId = subscriptionId;
                console.log(`✅ Restored subscription for ${subscription.symbol}`);
            } catch (error) {
                console.error(`❌ Failed to restore subscription for ${subscription.symbol}:`, error);
            }
        }
    }

    /**
     * Add connection status listener
     */
    public onConnectionChange(callback: (connected: boolean) => void): () => void {
        this.connectionListeners.add(callback);

        // Immediately notify of current status
        callback(this.isConnected);

        // Return unsubscribe function
        return () => {
            this.connectionListeners.delete(callback);
        };
    }

    /**
     * Notify all connection listeners
     */
    private notifyConnectionListeners(connected: boolean): void {
        this.connectionListeners.forEach(callback => {
            try {
                callback(connected);
            } catch (error) {
                console.error('❌ Error in connection listener:', error);
            }
        });
    }

    /**
     * Get current connection status
     */
    public isConnectionActive(): boolean {
        return this.isConnected;
    }

    /**
     * Get connection statistics
     */
    public getConnectionStats() {
        return {
            isConnected: this.isConnected,
            isConnecting: this.isConnecting,
            retryCount: this.retryCount,
            subscriptionsCount: this.subscriptions.size,
            appId: this.config.appId,
            lastPingTime: this.lastPingTime,
        };
    }

    /**
     * Force reconnection
     */
    public async forceReconnect(): Promise<void> {
        console.log('🔄 Force reconnecting...');
        this.handleConnectionFailure();
        await this.connect();
    }

    /**
     * Cleanup resources
     */
    public destroy(): void {
        console.log('🧹 Cleaning up Deriv connection service...');

        this.stopHeartbeat();

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }

        // Clear all subscriptions
        this.subscriptions.clear();
        this.connectionListeners.clear();

        this.isConnected = false;
        this.isConnecting = false;
    }
}

// Create singleton instance
export const robustDerivConnection = new RobustDerivConnectionService();

