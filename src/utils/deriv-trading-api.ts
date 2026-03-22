/**
 * Deriv Trading API Integration
 * Handles real trade execution, proposals, and account management
 */

export interface TradeConfig {
    market: string;
    tradeType: 'DIGITEVEN' | 'DIGITODD' | 'DIGITMATCH' | 'DIGITDIFF' | 'DIGITOVER' | 'DIGITUNDER' | 'CALL' | 'PUT';
    stake: number;
    duration: number;
    durationType: 't' | 'm' | 'h' | 'd';
    prediction?: number; // For digit trades (barrier for Over/Under/Match/Diff)
}

export interface TradeResult {
    success: boolean;
    contractId?: string;
    buyPrice?: number;
    payout?: number;
    profit?: number;
    error?: string;
}

export interface AccountInfo {
    loginid: string;
    balance: number;
    currency: string;
    isVirtual: boolean;
}

export class DerivTradingAPI {
    private ws: WebSocket | null = null;
    private isConnected = false;
    private authToken: string | null = null;
    private appId: string;
    private requestId = 1;
    private pendingRequests = new Map<
        number,
        { resolve: (value: unknown) => void; reject: (reason?: unknown) => void }
    >();

    constructor() {
        this.authToken = this.getStoredAuthToken();
        this.appId = this.getStoredAppId();
    }

    /**
     * Connect to Deriv WebSocket API
     */
    async connect(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                const wsUrl = `wss://ws.binaryws.com/websockets/v3?app_id=${this.appId}`;
                console.log(`🔌 Connecting to Deriv API with App ID: ${this.appId}`);
                this.ws = new WebSocket(wsUrl);

                this.ws.onopen = () => {
                    console.log('✅ Deriv Trading API connected');
                    this.isConnected = true;
                    resolve(true);
                };

                this.ws.onmessage = event => {
                    this.handleMessage(JSON.parse(event.data));
                };

                this.ws.onerror = error => {
                    console.error('❌ Deriv API connection error:', error);
                    this.isConnected = false;
                    reject(error);
                };

                this.ws.onclose = () => {
                    console.log('🔌 Deriv API connection closed');
                    this.isConnected = false;
                };

                // Send ping every 30 seconds to keep connection alive
                setInterval(() => {
                    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                        this.ws.send(JSON.stringify({ ping: 1 }));
                    }
                }, 30000);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Handle incoming WebSocket messages
     */
    private handleMessage(data: Record<string, unknown>): void {
        const reqId = data.req_id;

        if (reqId && this.pendingRequests.has(reqId)) {
            const { resolve, reject } = this.pendingRequests.get(reqId)!;
            this.pendingRequests.delete(reqId);

            if (data.error) {
                reject(new Error(data.error.message));
            } else {
                resolve(data);
            }
        }
    }

    /**
     * Send request to Deriv API
     */
    private async sendRequest(request: Record<string, unknown>): Promise<Record<string, unknown>> {
        // Auto-reconnect if disconnected
        if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.log('🔄 Reconnecting to Deriv API...');
            await this.connect();
            await this.authorize();
        }

        const reqId = this.requestId++;
        request.req_id = reqId;

        return new Promise((resolve, reject) => {
            this.pendingRequests.set(reqId, { resolve, reject });
            this.ws!.send(JSON.stringify(request));

            // Timeout after 30 seconds
            setTimeout(() => {
                if (this.pendingRequests.has(reqId)) {
                    this.pendingRequests.delete(reqId);
                    reject(new Error('Request timeout'));
                }
            }, 30000);
        });
    }

    /**
     * Authorize with stored token
     */
    async authorize(): Promise<AccountInfo> {
        if (!this.authToken) {
            throw new Error('No auth token available');
        }

        const response = await this.sendRequest({
            authorize: this.authToken,
        });

        return {
            loginid: response.authorize.loginid,
            balance: response.authorize.balance,
            currency: response.authorize.currency,
            isVirtual: response.authorize.loginid.startsWith('VRT'),
        };
    }

    /**
     * Get account balance
     */
    async getBalance(): Promise<number> {
        const response = await this.sendRequest({
            balance: 1,
        });
        return response.balance.balance;
    }

    /**
     * Get contract proposal
     */
    async getProposal(config: TradeConfig): Promise<Record<string, unknown>> {
        const proposal: Record<string, unknown> = {
            proposal: 1,
            amount: config.stake,
            basis: 'stake',
            contract_type: config.tradeType,
            currency: 'USD',
            duration: config.duration,
            duration_unit: config.durationType,
            symbol: config.market,
        };

        // Add barrier for digit trades that need it
        if (
            config.prediction !== undefined &&
            ['DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER'].includes(config.tradeType)
        ) {
            proposal.barrier = config.prediction.toString();
        }

        const response = await this.sendRequest(proposal);
        return response.proposal;
    }

    /**
     * Execute trade (buy contract)
     */
    async executeTrade(config: TradeConfig): Promise<TradeResult> {
        try {
            // First get proposal
            const proposal = await this.getProposal(config);

            if (!proposal || proposal.error) {
                return {
                    success: false,
                    error: proposal?.error?.message || 'Failed to get proposal',
                };
            }

            // Execute buy
            const buyResponse = await this.sendRequest({
                buy: proposal.id,
                price: config.stake,
            });

            if (buyResponse.error) {
                return {
                    success: false,
                    error: buyResponse.error.message,
                };
            }

            const contract = buyResponse.buy;

            // Wait for contract result
            const result = await this.waitForContractResult(contract.contract_id);

            return {
                success: true,
                contractId: contract.contract_id,
                buyPrice: contract.buy_price,
                payout: result.payout,
                profit: result.profit,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Wait for contract result
     */
    private async waitForContractResult(contractId: string): Promise<Record<string, unknown>> {
        return new Promise((resolve, reject) => {
            const checkResult = async () => {
                try {
                    const response = await this.sendRequest({
                        proposal_open_contract: 1,
                        contract_id: contractId,
                    });

                    const contract = response.proposal_open_contract;

                    if (contract.is_settled) {
                        resolve({
                            payout: contract.payout || 0,
                            profit: contract.profit || 0,
                            status: contract.status,
                        });
                    } else {
                        // Check again in 1 second
                        setTimeout(checkResult, 1000);
                    }
                } catch (error) {
                    reject(error);
                }
            };

            checkResult();
        });
    }

    /**
     * Get stored auth token
     */
    private getStoredAuthToken(): string | null {
        try {
            // Method 1: Try to get from localStorage (where Deriv stores it)
            const accounts = localStorage.getItem('client.accounts');
            const activeLoginId = localStorage.getItem('active_loginid');

            if (accounts && activeLoginId) {
                const accountsData = JSON.parse(accounts);
                const activeAccount = accountsData[activeLoginId];
                if (activeAccount?.token) {
                    console.log('✅ Token found in client.accounts');
                    return activeAccount.token;
                }
            }

            // Method 2: Try alternative localStorage keys
            const alternativeKeys = ['authToken', 'deriv_token', 'api_token', 'client.token', 'speed_mode_token'];

            for (const key of alternativeKeys) {
                const token = localStorage.getItem(key);
                if (token) {
                    console.log(`✅ Token found in ${key}`);
                    return token;
                }
            }

            // Method 3: Check if token is stored in sessionStorage
            const sessionToken = sessionStorage.getItem('deriv_token');
            if (sessionToken) {
                console.log('✅ Token found in sessionStorage');
                return sessionToken;
            }

            console.warn('⚠️ No auth token found in storage');
            return null;
        } catch (error) {
            console.error('Error getting auth token:', error);
            return null;
        }
    }

    /**
     * Get stored app ID
     */
    private getStoredAppId(): string {
        try {
            // First check if user set a custom app ID for Speed Mode
            const speedModeAppId = localStorage.getItem('speed_mode_app_id');
            if (speedModeAppId) {
                console.log(`✅ Speed Mode App ID found: ${speedModeAppId}`);
                return speedModeAppId;
            }

            // Fall back to the app's configured app ID
            const configAppId = localStorage.getItem('config.app_id');
            if (configAppId && configAppId !== '110800') {
                console.log(`✅ Using app config App ID: ${configAppId}`);
                return configAppId;
            }

            // Final fallback
            console.log('ℹ️ Using default App ID: 110800');
            return '110800';
        } catch (error) {
            console.error('Error getting app ID:', error);
            return '110800';
        }
    }

    /**
     * Set auth token manually
     */
    setAuthToken(token: string, appId?: string): void {
        this.authToken = token;
        // Store in localStorage for future use
        localStorage.setItem('speed_mode_token', token);
        console.log('✅ Auth token set manually');

        if (appId) {
            this.appId = appId;
            localStorage.setItem('speed_mode_app_id', appId);
            console.log(`✅ App ID set to: ${appId}`);
        }
    }

    /**
     * Get current auth token
     */
    getAuthToken(): string | null {
        return this.authToken;
    }

    /**
     * Get current app ID
     */
    getAppId(): string {
        return this.appId;
    }

    /**
     * Set app ID manually
     */
    setAppId(appId: string): void {
        this.appId = appId;
        localStorage.setItem('speed_mode_app_id', appId);
        console.log(`✅ App ID updated to: ${appId}`);
    }

    /**
     * Disconnect from API
     */
    disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
        this.pendingRequests.clear();
    }

    /**
     * Check if connected and authorized
     */
    isReady(): boolean {
        return this.isConnected && !!this.authToken;
    }
}

/**
 * Create singleton instance
 */
export const derivAPI = new DerivTradingAPI();

