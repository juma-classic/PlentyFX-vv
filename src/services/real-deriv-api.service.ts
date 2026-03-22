/**
 * Real Deriv API Service
 * Handles live connection to Deriv's WebSocket API for real trading
 */

export interface DerivAPIConfig {
    apiToken: string;
    appId: string;
    endpoint?: string;
    language?: string;
}

export interface TickData {
    epoch: number;
    tick: number;
    symbol: string;
    id: string;
    pip_size: number;
    quote: number;
}

export interface TradeContract {
    contract_type: string;
    symbol: string;
    duration: number;
    duration_unit: string;
    amount: number;
    basis: string;
    barrier?: string;
    currency: string;
}

export interface ContractPurchase {
    buy: {
        contract_id: number;
        longcode: string;
        start_time: number;
        transaction_id: number;
        payout: number;
        cost: number;
    };
}

export interface AccountBalance {
    balance: number;
    currency: string;
    loginid: string;
}

export class RealDerivAPIService {
    private static instance: RealDerivAPIService;
    private websocket: WebSocket | null = null;
    private config: DerivAPIConfig | null = null;
    private isConnected = false;
    private messageId = 1;
    private pendingRequests = new Map<number, { resolve: Function; reject: Function }>();
    private subscriptions = new Map<string, Function[]>();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;

    static getInstance(): RealDerivAPIService {
        if (!RealDerivAPIService.instance) {
            RealDerivAPIService.instance = new RealDerivAPIService();
        }
        return RealDerivAPIService.instance;
    }

    /**
     * Initialize connection to Deriv API
     */
    async connect(config: DerivAPIConfig): Promise<void> {
        this.config = config;
        const endpoint = config.endpoint || 'wss://ws.derivws.com/websockets/v3';

        return new Promise((resolve, reject) => {
            try {
                this.websocket = new WebSocket(`${endpoint}?app_id=${config.appId}&l=${config.language || 'EN'}`);

                this.websocket.onopen = () => {
                    console.log('✅ Connected to Deriv API');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    this.authorize(config.apiToken).then(resolve).catch(reject);
                };

                this.websocket.onmessage = event => {
                    this.handleMessage(JSON.parse(event.data));
                };

                this.websocket.onclose = event => {
                    console.log('❌ Deriv API connection closed:', event.code, event.reason);
                    this.isConnected = false;
                    this.handleReconnection();
                };

                this.websocket.onerror = error => {
                    console.error('🚨 Deriv API error:', error);
                    reject(new Error('Failed to connect to Deriv API'));
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Authorize with API token
     */
    private async authorize(token: string): Promise<any> {
        return this.sendRequest({
            authorize: token,
        });
    }

    /**
     * Subscribe to real-time tick data
     */
    async subscribeToTicks(symbol: string, callback: (tick: TickData) => void): Promise<string> {
        const response = await this.sendRequest({
            ticks: symbol,
            subscribe: 1,
        });

        const subscriptionId = response.subscription?.id;
        if (subscriptionId) {
            if (!this.subscriptions.has(subscriptionId)) {
                this.subscriptions.set(subscriptionId, []);
            }
            this.subscriptions.get(subscriptionId)!.push(callback);
        }

        return subscriptionId;
    }

    /**
     * Unsubscribe from tick data
     */
    async unsubscribeFromTicks(subscriptionId: string): Promise<void> {
        await this.sendRequest({
            forget: subscriptionId,
        });
        this.subscriptions.delete(subscriptionId);
    }

    /**
     * Get account balance
     */
    async getBalance(): Promise<AccountBalance> {
        const response = await this.sendRequest({
            balance: 1,
            subscribe: 1,
        });
        return response.balance;
    }

    /**
     * Purchase a contract
     */
    async purchaseContract(contract: TradeContract): Promise<ContractPurchase> {
        const response = await this.sendRequest({
            buy: 1,
            price: contract.amount,
            parameters: {
                contract_type: contract.contract_type,
                symbol: contract.symbol,
                duration: contract.duration,
                duration_unit: contract.duration_unit,
                basis: contract.basis,
                amount: contract.amount,
                barrier: contract.barrier,
                currency: contract.currency,
            },
        });

        if (response.error) {
            throw new Error(`Trade execution failed: ${response.error.message}`);
        }

        return response;
    }

    /**
     * Get contract details
     */
    async getContract(contractId: number): Promise<any> {
        return this.sendRequest({
            proposal_open_contract: 1,
            contract_id: contractId,
        });
    }

    /**
     * Get trading times for symbols
     */
    async getTradingTimes(): Promise<any> {
        return this.sendRequest({
            trading_times: new Date().toISOString().split('T')[0],
        });
    }

    /**
     * Get available symbols
     */
    async getActiveSymbols(): Promise<any> {
        return this.sendRequest({
            active_symbols: 'brief',
            product_type: 'basic',
        });
    }

    /**
     * Send request to API
     */
    private sendRequest(request: any): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.websocket || !this.isConnected) {
                reject(new Error('Not connected to Deriv API'));
                return;
            }

            const id = this.messageId++;
            const message = { ...request, req_id: id };

            this.pendingRequests.set(id, { resolve, reject });
            this.websocket.send(JSON.stringify(message));

            // Set timeout for request
            setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject(new Error('Request timeout'));
                }
            }, 30000);
        });
    }

    /**
     * Handle incoming messages
     */
    private handleMessage(message: any): void {
        // Handle request responses
        if (message.req_id && this.pendingRequests.has(message.req_id)) {
            const { resolve, reject } = this.pendingRequests.get(message.req_id)!;
            this.pendingRequests.delete(message.req_id);

            if (message.error) {
                reject(new Error(message.error.message));
            } else {
                resolve(message);
            }
            return;
        }

        // Handle subscriptions
        if (message.subscription?.id) {
            const callbacks = this.subscriptions.get(message.subscription.id);
            if (callbacks) {
                callbacks.forEach(callback => {
                    try {
                        if (message.tick) {
                            callback(message.tick);
                        } else if (message.balance) {
                            callback(message.balance);
                        }
                    } catch (error) {
                        console.error('Subscription callback error:', error);
                    }
                });
            }
        }
    }

    /**
     * Handle reconnection logic
     */
    private handleReconnection(): void {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

            console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

            setTimeout(() => {
                if (this.config) {
                    this.connect(this.config).catch(console.error);
                }
            }, delay);
        } else {
            console.error('🚨 Max reconnection attempts reached');
        }
    }

    /**
     * Disconnect from API
     */
    disconnect(): void {
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
        this.isConnected = false;
        this.pendingRequests.clear();
        this.subscriptions.clear();
    }

    /**
     * Check connection status
     */
    isConnectedToAPI(): boolean {
        return this.isConnected && this.websocket?.readyState === WebSocket.OPEN;
    }

    /**
     * Get connection statistics
     */
    getConnectionStats(): any {
        return {
            isConnected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            pendingRequests: this.pendingRequests.size,
            activeSubscriptions: this.subscriptions.size,
            websocketState: this.websocket?.readyState,
        };
    }
}
