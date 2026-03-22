/**
 * Fast Lane API - Enhanced Deriv WebSocket API with Rate Limiting
 * Handles connection management, auto-reconnection, and event emission
 */

import { RateLimiter } from '../rate-limiter';

export interface TickData {
    epoch: number;
    quote: number;
    symbol: string;
}

export interface TradeParams {
    contractType: string;
    symbol: string;
    stake: number;
    duration: number;
    durationType: 't' | 's' | 'm' | 'h' | 'd';
    barrier?: string;
    prediction?: number;
}

export interface BuyResponse {
    buy: {
        contract_id: string;
        buy_price: number;
        payout: number;
        longcode: string;
    };
}

export interface AuthResponse {
    authorize: {
        loginid: string;
        balance: number;
        currency: string;
        email: string;
    };
}

type EventCallback = (...args: any[]) => void;

export class FastLaneAPI {
    private ws: WebSocket | null = null;
    private authToken: string = '';
    private appId: string = '1089';
    private requestId: number = 1;
    private callbacks: Map<number, { resolve: (value: any) => void; reject: (reason?: any) => void }> = new Map();
    private subscriptions: Map<string, (data: any) => void> = new Map();
    private eventListeners: Map<string, Set<EventCallback>> = new Map();
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectDelay: number = 1000;
    private isReconnecting: boolean = false;
    private rateLimiter: RateLimiter;
    private keepAliveInterval: NodeJS.Timeout | null = null;

    constructor(rateLimiter?: RateLimiter) {
        this.rateLimiter =
            rateLimiter ||
            new RateLimiter({
                maxRequestsPerSecond: 5,
                maxRequestsPerMinute: 100,
                burstLimit: 10,
            });
    }

    /**
     * Connect to Deriv WebSocket API
     */
    async connect(): Promise<void> {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            return;
        }

        return new Promise((resolve, reject) => {
            try {
                const wsUrl = `wss://ws.derivws.com/websockets/v3?app_id=${this.appId}`;
                console.log(`🔌 [FastLane] Connecting to ${wsUrl}`);

                this.ws = new WebSocket(wsUrl);

                this.ws.onopen = () => {
                    console.log('✅ [FastLane] WebSocket connected');
                    this.reconnectAttempts = 0;
                    this.isReconnecting = false;
                    this.startKeepAlive();
                    this.emit('connected');
                    resolve();
                };

                this.ws.onmessage = event => {
                    this.handleMessage(JSON.parse(event.data));
                };

                this.ws.onerror = error => {
                    console.error('❌ [FastLane] WebSocket error:', error);
                    this.emit('error', error);
                    reject(error);
                };

                this.ws.onclose = () => {
                    console.log('🔌 [FastLane] WebSocket closed');
                    this.stopKeepAlive();
                    this.emit('disconnected');

                    if (!this.isReconnecting && this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.attemptReconnect();
                    }
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Disconnect from WebSocket
     */
    disconnect(): void {
        this.stopKeepAlive();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }

    /**
     * Set authentication token
     */
    setAuthToken(token: string, appId?: string): void {
        this.authToken = token;
        if (appId) {
            this.appId = appId;
        }
    }

    /**
     * Authorize with API token
     */
    async authorize(): Promise<AuthResponse> {
        if (!this.authToken) {
            throw new Error('Auth token not set');
        }

        return this.sendRequest({
            authorize: this.authToken,
        }) as Promise<AuthResponse>;
    }

    /**
     * Subscribe to tick stream
     */
    async subscribeTicks(symbol: string, callback: (tick: TickData) => void): Promise<string> {
        const response = (await this.sendRequest({
            ticks: symbol,
            subscribe: 1,
        })) as any;

        const subscriptionId = response.subscription?.id;
        if (subscriptionId) {
            this.subscriptions.set(subscriptionId, callback);
        }

        return subscriptionId;
    }

    /**
     * Unsubscribe from tick stream
     */
    async unsubscribeTicks(subscriptionId: string): Promise<void> {
        await this.sendRequest({
            forget: subscriptionId,
        });
        this.subscriptions.delete(subscriptionId);
    }

    /**
     * Buy a contract
     */
    async buyContract(params: TradeParams): Promise<BuyResponse> {
        const buyParams: any = {
            buy: 1,
            price: params.stake,
            parameters: {
                contract_type: params.contractType,
                symbol: params.symbol,
                duration: params.duration,
                duration_unit: params.durationType,
                basis: 'stake',
                amount: params.stake,
            },
        };

        // Add barrier for Over/Under
        if (params.barrier !== undefined) {
            buyParams.parameters.barrier = params.barrier;
        }

        // Add prediction for Match/Differ
        if (params.prediction !== undefined) {
            buyParams.parameters.barrier = params.prediction.toString();
        }

        return this.sendRequest(buyParams) as Promise<BuyResponse>;
    }

    /**
     * Get account balance
     */
    async getBalance(): Promise<number> {
        const response = (await this.sendRequest({
            balance: 1,
            subscribe: 1,
        })) as any;

        return response.balance?.balance || 0;
    }

    /**
     * Send a request through rate limiter
     */
    private async sendRequest(payload: any): Promise<any> {
        // Wait for rate limiter to allow request
        while (!this.rateLimiter.canMakeRequest()) {
            const waitTime = this.rateLimiter.getTimeUntilNextRequest();
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        // Record the request
        this.rateLimiter.recordRequest();

        if (!this.isConnected()) {
            throw new Error('WebSocket not connected');
        }

        return new Promise((resolve, reject) => {
            const reqId = this.requestId++;
            payload.req_id = reqId;

            this.callbacks.set(reqId, { resolve, reject });

            this.ws!.send(JSON.stringify(payload));

            // Timeout after 30 seconds
            setTimeout(() => {
                if (this.callbacks.has(reqId)) {
                    this.callbacks.delete(reqId);
                    reject(new Error('Request timeout'));
                }
            }, 30000);
        });
    }

    /**
     * Handle incoming WebSocket messages
     */
    private handleMessage(data: any): void {
        // Handle subscription updates (ticks, balance)
        if (data.subscription) {
            const subscriptionId = data.subscription.id;
            const callback = this.subscriptions.get(subscriptionId);

            if (callback) {
                if (data.tick) {
                    callback({
                        epoch: data.tick.epoch,
                        quote: data.tick.quote,
                        symbol: data.tick.symbol,
                    });
                    this.emit('tick', data.tick);
                }

                if (data.balance) {
                    this.emit('balance_update', data.balance.balance);
                }
            }
            return;
        }

        // Handle request responses
        const reqId = data.req_id;
        if (reqId && this.callbacks.has(reqId)) {
            const { resolve, reject } = this.callbacks.get(reqId)!;
            this.callbacks.delete(reqId);

            if (data.error) {
                reject(new Error(data.error.message));
            } else {
                resolve(data);
            }
        }
    }

    /**
     * Attempt to reconnect with exponential backoff
     */
    private async attemptReconnect(): Promise<void> {
        if (this.isReconnecting || this.reconnectAttempts >= this.maxReconnectAttempts) {
            return;
        }

        this.isReconnecting = true;
        this.reconnectAttempts++;

        const delay = Math.min(
            this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
            30000 // Max 30 seconds
        );

        console.log(
            `🔄 [FastLane] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
        );
        this.emit('reconnecting', { attempt: this.reconnectAttempts, delay });

        setTimeout(async () => {
            try {
                await this.connect();

                // Re-authorize if we have a token
                if (this.authToken) {
                    await this.authorize();
                }
            } catch (error) {
                console.error('❌ [FastLane] Reconnection failed:', error);
                this.isReconnecting = false;

                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.attemptReconnect();
                }
            }
        }, delay);
    }

    /**
     * Start keep-alive ping
     */
    private startKeepAlive(): void {
        this.stopKeepAlive();
        this.keepAliveInterval = setInterval(() => {
            if (this.isConnected()) {
                this.ws!.send(JSON.stringify({ ping: 1 }));
            }
        }, 30000);
    }

    /**
     * Stop keep-alive ping
     */
    private stopKeepAlive(): void {
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
            this.keepAliveInterval = null;
        }
    }

    /**
     * Add event listener
     */
    on(event: string, callback: EventCallback): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set());
        }
        this.eventListeners.get(event)!.add(callback);
    }

    /**
     * Remove event listener
     */
    off(event: string, callback: EventCallback): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.delete(callback);
        }
    }

    /**
     * Emit event
     */
    private emit(event: string, ...args: any[]): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.forEach(callback => callback(...args));
        }
    }

    /**
     * Get connection metrics
     */
    getMetrics() {
        return {
            isConnected: this.isConnected(),
            reconnectAttempts: this.reconnectAttempts,
            isReconnecting: this.isReconnecting,
            rateLimiterStatus: this.rateLimiter.getStats(),
        };
    }
}

// Export singleton instance
export const fastLaneAPI = new FastLaneAPI();
