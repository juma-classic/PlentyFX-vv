/**
 * Deriv WebSocket Tick Service
 * Handles live tick data subscription with auto-reconnect and heartbeat
 *
 * SAFETY: This service only subscribes to tick data - NO TRADING ENDPOINTS
 */

import { getWebSocketURL } from '../../config/api-config';

export interface TickData {
    price: number;
    lastDigit: number;
    timestamp: number;
    symbol: string;
}

export interface SocketConfig {
    symbol: string;
    appId: string;
    reconnectInterval: number;
    heartbeatInterval: number;
}

export class DerivSocketService {
    private ws: WebSocket | null = null;
    private config: SocketConfig;
    private isConnected = false;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private heartbeatTimer: NodeJS.Timeout | null = null;
    private subscriptionId: string | null = null;
    private listeners: Map<string, ((data: TickData) => void)[]> = new Map();

    constructor(config: SocketConfig) {
        this.config = config;
        this.listeners.set('tick', []);
        this.listeners.set('connect', []);
        this.listeners.set('disconnect', []);
        this.listeners.set('error', []);
    }

    /**
     * Connect to Deriv WebSocket
     */
    public async connect(): Promise<void> {
        if (this.isConnected) {
            console.log('🔌 Already connected to Deriv WebSocket');
            return;
        }

        try {
            const wsUrl = getWebSocketURL('frontend', { app_id: this.config.appId });
            console.log('🔌 Connecting to Deriv WebSocket:', wsUrl);

            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('✅ Connected to Deriv WebSocket');
                this.isConnected = true;
                this.startHeartbeat();
                this.subscribeToTicks();
                this.emit('connect', null);
            };

            this.ws.onmessage = event => {
                this.handleMessage(JSON.parse(event.data));
            };

            this.ws.onclose = () => {
                console.log('🔌 Deriv WebSocket disconnected');
                this.isConnected = false;
                this.stopHeartbeat();
                this.emit('disconnect', null);
                this.scheduleReconnect();
            };

            this.ws.onerror = error => {
                console.error('❌ Deriv WebSocket error:', error);
                this.emit('error', error);
            };
        } catch (error) {
            console.error('❌ Failed to connect to Deriv WebSocket:', error);
            this.scheduleReconnect();
            throw error;
        }
    }

    /**
     * Disconnect from WebSocket
     */
    public disconnect(): void {
        console.log('🔌 Disconnecting from Deriv WebSocket');

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        this.stopHeartbeat();

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        this.isConnected = false;
    }

    /**
     * Subscribe to tick data for the configured symbol
     */
    private async subscribeToTicks(): Promise<void> {
        if (!this.ws || !this.isConnected) {
            console.warn('⚠️ Cannot subscribe - not connected');
            return;
        }

        const subscribeMessage = {
            ticks: this.config.symbol,
            subscribe: 1,
        };

        console.log('📡 Subscribing to ticks:', subscribeMessage);
        this.ws.send(JSON.stringify(subscribeMessage));
    }

    /**
     * Handle incoming WebSocket messages
     */
    private handleMessage(data: any): void {
        // Handle tick data
        if (data.tick && data.tick.symbol === this.config.symbol) {
            const tickData: TickData = {
                price: data.tick.quote,
                lastDigit: Math.floor((data.tick.quote * 10000) % 10),
                timestamp: Date.now(),
                symbol: data.tick.symbol,
            };

            console.log('📊 Tick received:', {
                price: tickData.price,
                digit: tickData.lastDigit,
                symbol: tickData.symbol,
            });

            this.emit('tick', tickData);
        }

        // Handle subscription confirmation
        if (data.subscription && data.subscription.id) {
            this.subscriptionId = data.subscription.id;
            console.log('✅ Tick subscription confirmed:', this.subscriptionId);
        }

        // Handle heartbeat
        if (data.ping) {
            this.ws?.send(JSON.stringify({ pong: data.ping }));
        }
    }

    /**
     * Start heartbeat to keep connection alive
     */
    private startHeartbeat(): void {
        this.heartbeatTimer = setInterval(() => {
            if (this.ws && this.isConnected) {
                this.ws.send(JSON.stringify({ ping: 1 }));
            }
        }, this.config.heartbeatInterval);
    }

    /**
     * Stop heartbeat
     */
    private stopHeartbeat(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    /**
     * Schedule reconnection attempt
     */
    private scheduleReconnect(): void {
        if (this.reconnectTimer) {
            return; // Already scheduled
        }

        console.log(`🔄 Scheduling reconnect in ${this.config.reconnectInterval}ms`);

        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            console.log('🔄 Attempting to reconnect...');
            this.connect().catch(console.error);
        }, this.config.reconnectInterval);
    }

    /**
     * Add event listener
     */
    public on(event: string, callback: (data: any) => void): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(callback);
    }

    /**
     * Remove event listener
     */
    public off(event: string, callback: (data: any) => void): void {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            const index = eventListeners.indexOf(callback);
            if (index > -1) {
                eventListeners.splice(index, 1);
            }
        }
    }

    /**
     * Emit event to listeners
     */
    private emit(event: string, data: any): void {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ Error in ${event} listener:`, error);
                }
            });
        }
    }

    /**
     * Get connection status
     */
    public getStatus(): { connected: boolean; symbol: string } {
        return {
            connected: this.isConnected,
            symbol: this.config.symbol,
        };
    }
}
