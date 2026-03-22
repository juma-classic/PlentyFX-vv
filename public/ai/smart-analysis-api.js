/**
 * Smart Analysis API - Enhanced with Robust WebSocket Connection
 * Uses App ID 82255 for Smart Analysis with robust connection management
 */

class SmartAnalysisAPI {
    constructor() {
        this.appId = '82255'; // Your dedicated App ID for Smart Analysis
        this.wsManager = null;
        this.isInitialized = false;
        this.callbacks = {};
        this.subscriptions = new Map();
        this.requestId = 1;
        this.pendingRequests = new Map();
        this.currentSymbol = 'R_100';
        this.tickHistory = [];
        this.maxHistorySize = 1000;
        
        console.log(`🧠 Smart Analysis API initialized with App ID: ${this.appId}`);
    }

    /**
     * Set callbacks for API events
     */
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    /**
     * Initialize connection using robust WebSocket manager
     */
    async initialize() {
        console.log('🚀 Initializing Smart Analysis API with robust connection...');
        
        if (this.isInitialized) {
            console.log('⚠️ Already initialized');
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            try {
                // Create robust WebSocket manager with Smart Analysis App ID
                this.wsManager = new RobustWebSocketManager();
                
                // Override the app IDs to use Smart Analysis App ID
                this.wsManager.appIds = [this.appId];
                this.wsManager.wsUrls = [`wss://ws.binaryws.com/websockets/v3?app_id=${this.appId}`];
                
                // Set up callbacks
                this.wsManager.setCallbacks({
                    onConnected: () => {
                        console.log('✅ Smart Analysis API connected successfully');
                        this.isInitialized = true;
                        
                        // Start tick subscription
                        this.subscribeToTicks(this.currentSymbol);
                        
                        // Load initial historical data
                        this.loadHistoricalData();
                        
                        if (this.callbacks.onConnectionChange) {
                            this.callbacks.onConnectionChange(true);
                        }
                        
                        resolve();
                    },
                    
                    onDisconnected: (event) => {
                        console.warn('🔌 Smart Analysis API disconnected');
                        this.isInitialized = false;
                        
                        if (this.callbacks.onConnectionChange) {
                            this.callbacks.onConnectionChange(false);
                        }
                    },
                    
                    onMessage: (data) => {
                        this.handleMessage(data);
                    },
                    
                    onError: (error) => {
                        console.error('❌ Smart Analysis API Error:', error);
                        if (this.callbacks.onError) {
                            this.callbacks.onError(error);
                        }
                        
                        if (!this.isInitialized) {
                            reject(error);
                        }
                    }
                });
                
                // Start connection
                this.wsManager.connect();
                
                // Timeout after 15 seconds
                setTimeout(() => {
                    if (!this.isInitialized) {
                        reject(new Error('Connection timeout - Smart Analysis API failed to initialize'));
                    }
                }, 15000);
                
            } catch (error) {
                console.error('❌ Failed to initialize Smart Analysis API:', error);
                reject(error);
            }
        });
    }

    /**
     * Handle incoming WebSocket messages
     */
    handleMessage(data) {
        try {
            // Handle tick data
            if (data.tick) {
                const tickData = {
                    symbol: data.tick.symbol,
                    quote: data.tick.quote,
                    epoch: data.tick.epoch,
                    timestamp: new Date(data.tick.epoch * 1000)
                };
                
                // Add to history
                this.addToHistory(tickData.quote);
                
                // Notify callback
                if (this.callbacks.onTick) {
                    this.callbacks.onTick(tickData);
                }
                
                console.log(`📊 Smart Analysis Tick: ${tickData.quote.toFixed(5)} (${tickData.symbol})`);
                return;
            }

            // Handle historical data
            if (data.history) {
                const requestId = data.req_id;
                if (this.pendingRequests.has(requestId)) {
                    const { resolve } = this.pendingRequests.get(requestId);
                    const prices = data.history.prices || [];
                    
                    // Add historical data to history
                    prices.forEach(price => this.addToHistory(price));
                    
                    resolve(prices);
                    this.pendingRequests.delete(requestId);
                    
                    console.log(`📈 Loaded ${prices.length} historical ticks for Smart Analysis`);
                }
                return;
            }

            // Handle subscription confirmations
            if (data.msg_type === 'ticks') {
                console.log(`📡 Smart Analysis subscribed to ${data.echo_req?.ticks} successfully`);
                return;
            }

            // Handle ping responses
            if (data.ping === 'pong') {
                console.log('💓 Smart Analysis ping successful');
                return;
            }

            // Handle errors
            if (data.error) {
                console.error('❌ Smart Analysis API Error:', data.error);
                
                if (this.callbacks.onError) {
                    this.callbacks.onError(data.error.message || 'Unknown API error');
                }
                
                // Handle pending request errors
                const requestId = data.req_id;
                if (requestId && this.pendingRequests.has(requestId)) {
                    const { reject } = this.pendingRequests.get(requestId);
                    reject(new Error(data.error.message || 'API request failed'));
                    this.pendingRequests.delete(requestId);
                }
                return;
            }

            // Log other messages for debugging
            console.log('📨 Smart Analysis received:', data);
            
        } catch (error) {
            console.error('❌ Error handling Smart Analysis message:', error);
        }
    }

    /**
     * Add tick to history with size management
     */
    addToHistory(price) {
        this.tickHistory.push(parseFloat(price));
        
        // Maintain maximum history size
        if (this.tickHistory.length > this.maxHistorySize) {
            this.tickHistory.shift();
        }
    }

    /**
     * Get current tick history
     */
    getTickHistory() {
        return [...this.tickHistory];
    }

    /**
     * Send request to API through robust WebSocket manager
     */
    sendRequest(request) {
        if (!this.wsManager || !this.wsManager.isConnected) {
            throw new Error('Smart Analysis API not connected');
        }

        const requestWithId = {
            ...request,
            req_id: this.requestId++
        };

        const success = this.wsManager.send(requestWithId);
        if (!success) {
            throw new Error('Failed to send Smart Analysis API request');
        }

        return requestWithId.req_id;
    }

    /**
     * Subscribe to tick data for a symbol
     */
    async subscribeToTicks(symbol = 'R_100') {
        if (!this.wsManager || !this.wsManager.isConnected) {
            throw new Error('Smart Analysis API not connected');
        }

        console.log(`📡 Smart Analysis subscribing to ${symbol} ticks...`);
        
        try {
            const requestId = this.sendRequest({
                ticks: symbol,
                subscribe: 1
            });

            this.subscriptions.set(symbol, requestId);
            this.currentSymbol = symbol;
            
            return requestId;
        } catch (error) {
            console.error('❌ Failed to subscribe to ticks:', error);
            throw error;
        }
    }

    /**
     * Load historical data on initialization
     */
    async loadHistoricalData() {
        try {
            console.log('📈 Loading initial historical data for Smart Analysis...');
            const historicalData = await this.getHistoricalTicks(this.currentSymbol, 500);
            
            if (historicalData && historicalData.length > 0) {
                console.log(`✅ Loaded ${historicalData.length} historical ticks for Smart Analysis`);
                
                // Notify callback with historical data loaded
                if (this.callbacks.onHistoricalDataLoaded) {
                    this.callbacks.onHistoricalDataLoaded(historicalData);
                }
            }
        } catch (error) {
            console.warn('⚠️ Failed to load historical data:', error);
            // Continue without historical data
        }
    }

    /**
     * Get historical tick data
     */
    async getHistoricalTicks(symbol = 'R_100', count = 500) {
        if (!this.wsManager || !this.wsManager.isConnected) {
            throw new Error('Smart Analysis API not connected');
        }

        console.log(`📈 Smart Analysis requesting ${count} historical ticks for ${symbol}...`);

        return new Promise((resolve, reject) => {
            try {
                const requestId = this.sendRequest({
                    ticks_history: symbol,
                    count: count,
                    end: 'latest',
                    style: 'ticks'
                });

                this.pendingRequests.set(requestId, { resolve, reject });

                // Timeout after 15 seconds
                setTimeout(() => {
                    if (this.pendingRequests.has(requestId)) {
                        this.pendingRequests.delete(requestId);
                        reject(new Error('Historical data request timeout'));
                    }
                }, 15000);
                
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Change symbol subscription
     */
    async changeSymbol(newSymbol) {
        console.log(`🔄 Smart Analysis changing symbol to ${newSymbol}...`);
        
        try {
            // Unsubscribe from current symbol
            if (this.currentSymbol && this.subscriptions.has(this.currentSymbol)) {
                await this.unsubscribeFromTicks(this.currentSymbol);
            }
            
            // Clear history for new symbol
            this.tickHistory = [];
            
            // Subscribe to new symbol
            await this.subscribeToTicks(newSymbol);
            
            // Load historical data for new symbol
            await this.loadHistoricalData();
            
            console.log(`✅ Smart Analysis switched to ${newSymbol}`);
            
        } catch (error) {
            console.error('❌ Failed to change symbol:', error);
            throw error;
        }
    }

    /**
     * Unsubscribe from tick data
     */
    async unsubscribeFromTicks(symbol) {
        const subscriptionId = this.subscriptions.get(symbol);
        if (subscriptionId && this.wsManager && this.wsManager.isConnected) {
            try {
                this.sendRequest({
                    forget: subscriptionId
                });
                this.subscriptions.delete(symbol);
                console.log(`🔇 Smart Analysis unsubscribed from ${symbol} ticks`);
            } catch (error) {
                console.error('❌ Failed to unsubscribe:', error);
            }
        }
    }

    /**
     * Get connection status
     */
    getConnectionStatus() {
        const wsStatus = this.wsManager ? this.wsManager.getStatus() : null;
        
        return {
            isInitialized: this.isInitialized,
            isConnected: this.wsManager ? this.wsManager.isConnected : false,
            isConnecting: this.wsManager ? this.wsManager.isConnecting : false,
            appId: this.appId,
            currentSymbol: this.currentSymbol,
            subscriptions: Array.from(this.subscriptions.keys()),
            tickHistorySize: this.tickHistory.length,
            wsStatus: wsStatus
        };
    }

    /**
     * Force reconnection
     */
    forceReconnect() {
        console.log('🔄 Smart Analysis forcing reconnection...');
        if (this.wsManager) {
            this.wsManager.forceReconnect();
        }
    }

    /**
     * Disconnect and cleanup
     */
    disconnect() {
        console.log('🔌 Disconnecting Smart Analysis API...');
        
        if (this.wsManager) {
            this.wsManager.disconnect();
            this.wsManager = null;
        }
        
        this.isInitialized = false;
        this.subscriptions.clear();
        this.pendingRequests.clear();
        this.tickHistory = [];
        
        if (this.callbacks.onConnectionChange) {
            this.callbacks.onConnectionChange(false);
        }
    }
}

// Make available globally
window.SmartAnalysisAPI = SmartAnalysisAPI;

console.log('✅ Smart Analysis API loaded with App ID 82255');