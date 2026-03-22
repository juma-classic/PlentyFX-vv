/**
 * Real-World Tick Speed Integration Service
 * Bridges the widget with production-ready trading services
 */

import { RealTickSpeedEngineService } from './real-tick-speed-engine.service';
import { RiskManagerService } from './risk-manager.service';

export interface RealWorldTickSpeedConfig {
    strategy: 'storm_shadow' | 'digit_hunter' | 'pattern_master' | 'risk_managed';
    entryPattern: string;
    stakeAmount: number;
    tradeType: 'DIGITMATCH' | 'DIGITOVER' | 'DIGITUNDER' | 'DIGITEVEN' | 'DIGITODD';
    apiToken?: string;
    appId?: string;
    symbol?: string;
    mode: 'demo' | 'real';
    riskManagement: {
        maxStake: number;
        maxDailyLoss: number;
        maxConsecutiveLosses: number;
        stopLossPercentage: number;
    };
}

export interface RealWorldTickSpeedTrade {
    id: string;
    type: string;
    prediction: number;
    stake: number;
    entryPrice: number;
    entryDigit: number;
    timestamp: Date;
    status: 'pending' | 'won' | 'lost' | 'failed';
    payout?: number;
    profit?: number;
    contractId?: number;
    mode: 'demo' | 'real';
}

export interface TradingStatus {
    isActive: boolean;
    isConnected: boolean;
    mode: 'demo' | 'real';
    balance: number;
    dailyPnL: number;
    totalPnL: number;
    activeTrades: number;
    winRate: number;
    riskStatus: string;
    tradesExecuted: number;
    consecutiveLosses: number;
}

export class RealWorldTickSpeedIntegrationService {
    private static instance: RealWorldTickSpeedIntegrationService;
    private widgetWindow: Window | null = null;
    private messageHandlers: Map<string, Function[]> = new Map();
    private engine: RealTickSpeedEngineService;
    private riskManager: RiskManagerService;
    private config: RealWorldTickSpeedConfig | null = null;
    private isInitialized = false;

    static getInstance(): RealWorldTickSpeedIntegrationService {
        if (!RealWorldTickSpeedIntegrationService.instance) {
            RealWorldTickSpeedIntegrationService.instance = new RealWorldTickSpeedIntegrationService();
        }
        return RealWorldTickSpeedIntegrationService.instance;
    }

    constructor() {
        this.engine = RealTickSpeedEngineService.getInstance();
        this.riskManager = RiskManagerService.getInstance();
    }

    /**
     * Initialize communication with the widget and real-world services
     */
    async initialize(widgetWindow: Window, config: RealWorldTickSpeedConfig) {
        this.widgetWindow = widgetWindow;
        this.config = config;
        this.setupMessageListener();

        try {
            // Initialize risk manager
            this.riskManager.configure({
                maxDailyLoss: config.riskManagement.maxDailyLoss,
                maxStakeAmount: config.riskManagement.maxStake,
                maxConsecutiveLosses: config.riskManagement.maxConsecutiveLosses,
                stopLossPercentage: config.riskManagement.stopLossPercentage,
            });

            // Initialize trading engine if real mode
            if (config.mode === 'real' && config.apiToken) {
                await this.engine.initialize({
                    apiToken: config.apiToken,
                    appId: config.appId || '110800',
                    strategy: config.strategy,
                    symbol: config.symbol || 'R_100',
                    stakeAmount: config.stakeAmount,
                    tradeType: config.tradeType as any,
                    entryPattern: this.parseEntryPattern(config.entryPattern),
                    isDemo: false,
                });
            }

            this.isInitialized = true;
            console.log('✅ Real-world tick speed integration initialized');
        } catch (error) {
            console.error('❌ Failed to initialize real-world integration:', error);
            throw error;
        }
    }

    /**
     * Configure the widget with real-world trading parameters
     */
    configureWidget(config: RealWorldTickSpeedConfig) {
        this.config = config;

        // Send enhanced configuration to widget
        this.sendMessage('CONFIGURE_REAL_BOT', {
            ...config,
            isRealMode: config.mode === 'real',
            riskManagement: config.riskManagement,
        });
    }

    /**
     * Start real-world trading
     */
    async startTrading() {
        if (!this.config) {
            throw new Error('Configuration required');
        }

        // Perform safety checks
        const riskCheck = this.performSafetyChecks();
        if (!riskCheck.canTrade) {
            throw new Error(`Cannot start trading: ${riskCheck.reason}`);
        }

        // Start engine if real mode
        if (this.config.mode === 'real' && this.isInitialized) {
            await this.engine.startTrading();
        }

        this.sendMessage('START_REAL_BOT');
        console.log(`🚀 Started ${this.config.mode} trading`);
    }

    /**
     * Stop trading
     */
    async stopTrading() {
        if (this.config?.mode === 'real' && this.isInitialized) {
            await this.engine.stopTrading();
        }

        this.sendMessage('STOP_BOT');
        console.log('⏹️ Trading stopped');
    }

    /**
     * Emergency stop - immediately halt all trading
     */
    async emergencyStop() {
        console.warn('🚨 EMERGENCY STOP ACTIVATED');

        try {
            await this.stopTrading();

            if (this.config?.mode === 'real' && this.isInitialized) {
                await this.engine.disconnect();
            }

            this.sendMessage('EMERGENCY_STOP');
            console.log('✅ Emergency stop completed');
        } catch (error) {
            console.error('❌ Error during emergency stop:', error);
        }
    }

    /**
     * Reset the widget state
     */
    resetWidget() {
        this.sendMessage('RESET_BOT');
    }

    /**
     * Connect to real Deriv API
     */
    async connectToRealAPI(apiToken: string, symbol: string = 'R_100') {
        this.sendMessage('CONNECT_REAL_API', {
            apiToken,
            symbol,
            mode: 'real',
        });
    }

    /**
     * Get current trading status
     */
    async getStatus(): Promise<TradingStatus> {
        if (this.config?.mode === 'real' && this.isInitialized) {
            const engineStatus = this.engine.getStatus();
            const riskReport = this.riskManager.getRiskReport(1000); // Placeholder balance

            return {
                isActive: engineStatus.isActive,
                isConnected: engineStatus.apiConnection?.isConnected || false,
                mode: 'real',
                balance: 1000, // Would come from API
                dailyPnL: engineStatus.session?.totalProfit || 0,
                totalPnL: engineStatus.session?.totalProfit || 0,
                activeTrades: engineStatus.activeTrades,
                winRate: engineStatus.session?.winRate || 0,
                riskStatus: riskReport.canTrade ? 'Safe' : riskReport.reason,
                tradesExecuted: engineStatus.session?.totalTrades || 0,
                consecutiveLosses: 0, // Would come from risk manager
            };
        }

        // Demo mode status
        return new Promise(resolve => {
            const handler = (data: TradingStatus) => {
                resolve(data);
                this.off('STATUS_RESPONSE', handler);
            };

            this.on('STATUS_RESPONSE', handler);
            this.sendMessage('GET_STATUS');
        });
    }

    /**
     * Subscribe to widget events
     */
    on(eventType: string, handler: Function) {
        if (!this.messageHandlers.has(eventType)) {
            this.messageHandlers.set(eventType, []);
        }
        this.messageHandlers.get(eventType)!.push(handler);
    }

    /**
     * Unsubscribe from widget events
     */
    off(eventType: string, handler: Function) {
        const handlers = this.messageHandlers.get(eventType);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    /**
     * Get trading history
     */
    getTradingHistory(): Promise<RealWorldTickSpeedTrade[]> {
        if (this.config?.mode === 'real' && this.isInitialized) {
            return Promise.resolve(this.riskManager.getTradeHistory());
        }

        return new Promise(resolve => {
            const handler = (data: RealWorldTickSpeedTrade[]) => {
                resolve(data);
                this.off('TRADE_HISTORY_RESPONSE', handler);
            };

            this.on('TRADE_HISTORY_RESPONSE', handler);
            this.sendMessage('EXPORT_TRADE_HISTORY');
        });
    }

    /**
     * Get risk report
     */
    getRiskReport(): any {
        return this.riskManager.getRiskReport(1000); // Placeholder balance
    }

    /**
     * Perform safety checks before trading
     */
    private performSafetyChecks(): { canTrade: boolean; reason: string } {
        if (!this.config) {
            return { canTrade: false, reason: 'No configuration' };
        }

        // Check API token for real mode
        if (this.config.mode === 'real' && !this.config.apiToken) {
            return { canTrade: false, reason: 'API token required for real trading' };
        }

        // Check stake amount
        if (this.config.stakeAmount > this.config.riskManagement.maxStake) {
            return { canTrade: false, reason: 'Stake exceeds maximum limit' };
        }

        // Check risk manager
        const riskReport = this.riskManager.getRiskReport(1000); // Placeholder
        if (!riskReport.canTrade) {
            return { canTrade: false, reason: riskReport.reason };
        }

        return { canTrade: true, reason: 'All checks passed' };
    }

    /**
     * Parse entry pattern string to numbers
     */
    private parseEntryPattern(patternStr: string): number[] {
        const patterns = patternStr.split(',').map(p => p.trim());
        const result: number[] = [];

        for (const pattern of patterns) {
            if (pattern === 'EVEN') {
                result.push(...[0, 2, 4, 6, 8]);
            } else if (pattern === 'ODD') {
                result.push(...[1, 3, 5, 7, 9]);
            } else if (!isNaN(Number(pattern))) {
                result.push(parseInt(pattern));
            }
        }

        return [...new Set(result)];
    }

    /**
     * Send message to widget
     */
    private sendMessage(type: string, data?: any) {
        if (this.widgetWindow) {
            this.widgetWindow.postMessage({ type, data }, window.location.origin);
        }
    }

    /**
     * Setup message listener for widget communication
     */
    private setupMessageListener() {
        window.addEventListener('message', event => {
            if (event.origin !== window.location.origin) return;

            const { type, data } = event.data;

            // Handle real-world specific events
            if (type === 'REAL_TRADE_EXECUTED') {
                this.handleRealTrade(data);
            } else if (type === 'RISK_LIMIT_REACHED') {
                this.handleRiskLimit(data);
            }

            const handlers = this.messageHandlers.get(type);
            if (handlers) {
                handlers.forEach(handler => handler(data));
            }
        });
    }

    /**
     * Handle real trade execution
     */
    private handleRealTrade(trade: RealWorldTickSpeedTrade) {
        console.log(`💰 Real trade executed: ${trade.id}`);

        // Record trade in risk manager
        this.riskManager.recordTrade({
            tradeId: trade.id,
            symbol: this.config?.symbol || 'R_100',
            amount: trade.stake,
            timestamp: Date.now(),
            result: 'pending',
        });
    }

    /**
     * Handle risk limit reached
     */
    private handleRiskLimit(data: any) {
        console.warn('🚫 Risk limit reached:', data.reason);
        this.emergencyStop();
    }

    /**
     * Cleanup and disconnect
     */
    async disconnect() {
        if (this.config?.mode === 'real' && this.isInitialized) {
            await this.engine.disconnect();
        }

        this.messageHandlers.clear();
        this.config = null;
        this.isInitialized = false;

        console.log('✅ Real-world integration disconnected');
    }
}

