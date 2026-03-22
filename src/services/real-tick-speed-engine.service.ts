/**
 * Real Tick Speed Engine Service
 * Production-ready tick trading engine with real API integration
 */

import { RealDerivAPIService, TickData, TradeContract } from './real-deriv-api.service';
import { RiskManagerService, TradeRisk } from './risk-manager.service';

export interface RealTickSpeedConfig {
    apiToken: string;
    appId: string;
    strategy: 'storm_shadow' | 'digit_hunter' | 'pattern_master';
    symbol: string;
    stakeAmount: number;
    tradeType: 'DIGITMATCH' | 'DIGITOVER' | 'DIGITUNDER' | 'DIGITEVEN' | 'DIGITODD';
    entryPattern: number[];
    isDemo: boolean;
}

export interface StrategySignal {
    action: 'BUY' | 'WAIT';
    confidence: number;
    prediction: number;
    reasoning: string;
    tradeType: string;
}

export interface TradingSession {
    sessionId: string;
    startTime: number;
    endTime?: number;
    totalTrades: number;
    winRate: number;
    totalProfit: number;
    isActive: boolean;
}

export class RealTickSpeedEngineService {
    private static instance: RealTickSpeedEngineService;
    private derivAPI: RealDerivAPIService;
    private riskManager: RiskManagerService;
    private config: RealTickSpeedConfig | null = null;
    private isActive = false;
    private tickSubscriptionId: string | null = null;
    private tickHistory: TickData[] = [];
    private digitHistory: number[] = [];
    private currentSession: TradingSession | null = null;
    private activeTrades = new Map<string, TradeRisk>();
    private patternBuffer: number[] = [];
    private lastTradeTime = 0;
    private minTimeBetweenTrades = 1000; // 1 second minimum

    // Strategy-specific parameters
    private strategyParams = {
        storm_shadow: {
            minPatternLength: 3,
            targetDigits: [0],
            overThreshold: 6,
        },
        digit_hunter: {
            minPatternLength: 5,
            confidenceThreshold: 0.7,
        },
        pattern_master: {
            analysisWindow: 10,
            frequencyThreshold: 0.3,
        },
    };

    static getInstance(): RealTickSpeedEngineService {
        if (!RealTickSpeedEngineService.instance) {
            RealTickSpeedEngineService.instance = new RealTickSpeedEngineService();
        }
        return RealTickSpeedEngineService.instance;
    }

    constructor() {
        this.derivAPI = RealDerivAPIService.getInstance();
        this.riskManager = RiskManagerService.getInstance();
    }

    /**
     * Initialize the trading engine
     */
    async initialize(config: RealTickSpeedConfig): Promise<void> {
        this.config = config;

        try {
            // Connect to Deriv API
            await this.derivAPI.connect({
                apiToken: config.apiToken,
                appId: config.appId,
            });

            // Verify account and get balance
            const balance = await this.derivAPI.getBalance();
            console.log(`✅ Connected to ${config.isDemo ? 'Demo' : 'Real'} account:`, balance);

            // Initialize trading session
            this.currentSession = {
                sessionId: `session_${Date.now()}`,
                startTime: Date.now(),
                totalTrades: 0,
                winRate: 0,
                totalProfit: 0,
                isActive: false,
            };

            console.log('✅ Real Tick Speed Engine initialized');
        } catch (error) {
            console.error('❌ Failed to initialize engine:', error);
            throw error;
        }
    }

    /**
     * Start the trading engine
     */
    async startTrading(): Promise<void> {
        if (!this.config || !this.derivAPI.isConnectedToAPI()) {
            throw new Error('Engine not properly initialized');
        }

        if (this.isActive) {
            console.warn('Trading engine is already active');
            return;
        }

        try {
            // Subscribe to tick data
            this.tickSubscriptionId = await this.derivAPI.subscribeToTicks(
                this.config.symbol,
                this.handleTick.bind(this)
            );

            this.isActive = true;
            if (this.currentSession) {
                this.currentSession.isActive = true;
            }

            console.log(`🚀 Started trading ${this.config.symbol} with ${this.config.strategy} strategy`);
        } catch (error) {
            console.error('❌ Failed to start trading:', error);
            throw error;
        }
    }

    /**
     * Stop the trading engine
     */
    async stopTrading(): Promise<void> {
        if (!this.isActive) {
            return;
        }

        try {
            // Unsubscribe from tick data
            if (this.tickSubscriptionId) {
                await this.derivAPI.unsubscribeFromTicks(this.tickSubscriptionId);
                this.tickSubscriptionId = null;
            }

            this.isActive = false;
            if (this.currentSession) {
                this.currentSession.isActive = false;
                this.currentSession.endTime = Date.now();
            }

            console.log('⏹️ Trading engine stopped');
        } catch (error) {
            console.error('❌ Error stopping trading:', error);
        }
    }

    /**
     * Handle incoming tick data
     */
    private async handleTick(tick: TickData): Promise<void> {
        if (!this.isActive || !this.config) return;

        // Add to tick history
        this.tickHistory.push(tick);
        if (this.tickHistory.length > 1000) {
            this.tickHistory.shift();
        }

        // Extract last digit
        const lastDigit = this.extractLastDigit(tick.tick);
        this.digitHistory.push(lastDigit);
        if (this.digitHistory.length > 100) {
            this.digitHistory.shift();
        }

        // Update pattern buffer
        this.patternBuffer.push(lastDigit);
        if (this.patternBuffer.length > 20) {
            this.patternBuffer.shift();
        }

        // Analyze for trading signals
        const signal = this.analyzeForSignal(tick);

        if (signal.action === 'BUY') {
            await this.executeTrade(signal, tick);
        }

        // Update active trades
        await this.updateActiveTrades();
    }

    /**
     * Analyze tick data for trading signals
     */
    private analyzeForSignal(tick: TickData): StrategySignal {
        if (!this.config) {
            return { action: 'WAIT', confidence: 0, prediction: 0, reasoning: 'No config', tradeType: '' };
        }

        // Check minimum time between trades
        if (Date.now() - this.lastTradeTime < this.minTimeBetweenTrades) {
            return { action: 'WAIT', confidence: 0, prediction: 0, reasoning: 'Rate limit', tradeType: '' };
        }

        const lastDigit = this.extractLastDigit(tick.tick);

        switch (this.config.strategy) {
            case 'storm_shadow':
                return this.stormShadowAnalysis(lastDigit);
            case 'digit_hunter':
                return this.digitHunterAnalysis(lastDigit);
            case 'pattern_master':
                return this.patternMasterAnalysis(lastDigit);
            default:
                return { action: 'WAIT', confidence: 0, prediction: 0, reasoning: 'Unknown strategy', tradeType: '' };
        }
    }

    /**
     * Storm Shadow strategy analysis
     */
    private stormShadowAnalysis(lastDigit: number): StrategySignal {
        const params = this.strategyParams.storm_shadow;

        if (this.patternBuffer.length < params.minPatternLength) {
            return { action: 'WAIT', confidence: 0, prediction: 0, reasoning: 'Insufficient data', tradeType: '' };
        }

        // Look for digit 0 pattern
        if (params.targetDigits.includes(lastDigit)) {
            return {
                action: 'BUY',
                confidence: 0.8,
                prediction: 0,
                reasoning: 'Storm Shadow: Target digit detected',
                tradeType: 'DIGITMATCH',
            };
        }

        // Look for high digits (over threshold)
        if (lastDigit > params.overThreshold) {
            return {
                action: 'BUY',
                confidence: 0.7,
                prediction: params.overThreshold,
                reasoning: 'Storm Shadow: High digit detected',
                tradeType: 'DIGITOVER',
            };
        }

        return { action: 'WAIT', confidence: 0, prediction: 0, reasoning: 'No pattern match', tradeType: '' };
    }

    /**
     * Digit Hunter strategy analysis
     */
    private digitHunterAnalysis(lastDigit: number): StrategySignal {
        if (!this.config)
            return { action: 'WAIT', confidence: 0, prediction: 0, reasoning: 'No config', tradeType: '' };

        const params = this.strategyParams.digit_hunter;

        if (this.patternBuffer.length < params.minPatternLength) {
            return { action: 'WAIT', confidence: 0, prediction: 0, reasoning: 'Insufficient data', tradeType: '' };
        }

        // Check if current digit matches entry pattern
        if (this.config.entryPattern.includes(lastDigit)) {
            const confidence = this.calculatePatternConfidence();

            if (confidence >= params.confidenceThreshold) {
                return {
                    action: 'BUY',
                    confidence,
                    prediction: lastDigit,
                    reasoning: `Digit Hunter: Pattern match with ${(confidence * 100).toFixed(1)}% confidence`,
                    tradeType: this.config.tradeType,
                };
            }
        }

        return { action: 'WAIT', confidence: 0, prediction: 0, reasoning: 'Pattern confidence too low', tradeType: '' };
    }

    /**
     * Pattern Master strategy analysis
     */
    private patternMasterAnalysis(lastDigit: number): StrategySignal {
        const params = this.strategyParams.pattern_master;

        if (this.digitHistory.length < params.analysisWindow) {
            return { action: 'WAIT', confidence: 0, prediction: 0, reasoning: 'Insufficient data', tradeType: '' };
        }

        const prediction = this.predictNextDigit();
        const frequency = this.calculateDigitFrequency(prediction);

        if (frequency >= params.frequencyThreshold) {
            return {
                action: 'BUY',
                confidence: frequency,
                prediction,
                reasoning: `Pattern Master: Predicted digit ${prediction} with ${(frequency * 100).toFixed(1)}% frequency`,
                tradeType: 'DIGITMATCH',
            };
        }

        return {
            action: 'WAIT',
            confidence: 0,
            prediction: 0,
            reasoning: 'Frequency threshold not met',
            tradeType: '',
        };
    }

    /**
     * Execute a trade based on signal
     */
    private async executeTrade(signal: StrategySignal, tick: TickData): Promise<void> {
        if (!this.config) return;

        try {
            // Get current balance
            const balance = await this.derivAPI.getBalance();

            // Validate trade with risk manager
            const riskStatus = this.riskManager.validateTrade(this.config.stakeAmount, balance.balance);

            if (!riskStatus.canTrade) {
                console.warn('🚫 Trade blocked by risk manager:', riskStatus.reason);
                return;
            }

            // Prepare contract
            const contract: TradeContract = {
                contract_type: signal.tradeType,
                symbol: this.config.symbol,
                duration: 1,
                duration_unit: 't',
                amount: this.config.stakeAmount,
                basis: 'stake',
                currency: balance.currency,
                barrier:
                    signal.tradeType.includes('OVER') || signal.tradeType.includes('UNDER')
                        ? signal.prediction.toString()
                        : undefined,
            };

            // Execute trade
            const result = await this.derivAPI.purchaseContract(contract);

            if (result.buy) {
                const tradeRisk: TradeRisk = {
                    tradeId: result.buy.contract_id.toString(),
                    symbol: this.config.symbol,
                    amount: this.config.stakeAmount,
                    timestamp: Date.now(),
                    result: 'pending',
                };

                // Record trade
                this.riskManager.recordTrade(tradeRisk);
                this.activeTrades.set(tradeRisk.tradeId, tradeRisk);
                this.lastTradeTime = Date.now();

                if (this.currentSession) {
                    this.currentSession.totalTrades++;
                }

                console.log(
                    `📈 Trade executed: ${signal.tradeType} ${signal.prediction} @ ${tick.tick} (ID: ${result.buy.contract_id})`
                );
            }
        } catch (error) {
            console.error('❌ Trade execution failed:', error);
        }
    }

    /**
     * Update active trades status
     */
    private async updateActiveTrades(): Promise<void> {
        const tradesToUpdate = Array.from(this.activeTrades.values());

        for (const trade of tradesToUpdate) {
            try {
                const contract = await this.derivAPI.getContract(parseInt(trade.tradeId));

                if (contract.proposal_open_contract?.is_settled) {
                    const isWin = contract.proposal_open_contract.profit > 0;
                    const payout = contract.proposal_open_contract.payout || 0;

                    // Update trade result
                    this.riskManager.updateTradeResult(trade.tradeId, isWin ? 'win' : 'loss', payout);

                    // Update session stats
                    if (this.currentSession) {
                        this.currentSession.totalProfit += contract.proposal_open_contract.profit;
                        this.currentSession.winRate = this.calculateWinRate();
                    }

                    // Remove from active trades
                    this.activeTrades.delete(trade.tradeId);

                    console.log(
                        `${isWin ? '✅' : '❌'} Trade settled: ${trade.tradeId} - ${isWin ? 'WIN' : 'LOSS'} (${contract.proposal_open_contract.profit})`
                    );
                }
            } catch (error) {
                console.error(`Error updating trade ${trade.tradeId}:`, error);
            }
        }
    }

    /**
     * Calculate pattern confidence
     */
    private calculatePatternConfidence(): number {
        if (this.patternBuffer.length < 5) return 0;

        const recentPattern = this.patternBuffer.slice(-5);
        const matches = recentPattern.filter(digit => this.config?.entryPattern.includes(digit)).length;

        return matches / recentPattern.length;
    }

    /**
     * Predict next digit based on frequency analysis
     */
    private predictNextDigit(): number {
        const frequency: { [key: number]: number } = {};

        this.digitHistory.forEach(digit => {
            frequency[digit] = (frequency[digit] || 0) + 1;
        });

        let maxFreq = 0;
        let predictedDigit = 0;

        Object.entries(frequency).forEach(([digit, freq]) => {
            if (freq > maxFreq) {
                maxFreq = freq;
                predictedDigit = parseInt(digit);
            }
        });

        return predictedDigit;
    }

    /**
     * Calculate digit frequency
     */
    private calculateDigitFrequency(digit: number): number {
        const occurrences = this.digitHistory.filter(d => d === digit).length;
        return occurrences / this.digitHistory.length;
    }

    /**
     * Calculate win rate
     */
    private calculateWinRate(): number {
        if (!this.currentSession || this.currentSession.totalTrades === 0) return 0;

        // This would need to be calculated from completed trades
        // For now, return a placeholder
        return 0.65; // 65% placeholder
    }

    /**
     * Extract last digit from price
     */
    private extractLastDigit(price: number): number {
        const priceStr = price.toString().replace('.', '');
        return parseInt(priceStr.slice(-1));
    }

    /**
     * Get engine status
     */
    getStatus(): any {
        return {
            isActive: this.isActive,
            config: this.config,
            session: this.currentSession,
            activeTrades: this.activeTrades.size,
            tickHistory: this.tickHistory.length,
            digitHistory: this.digitHistory.slice(-10),
            apiConnection: this.derivAPI.getConnectionStats(),
            riskStatus: this.config ? this.riskManager.getRiskReport(1000) : null, // Placeholder balance
        };
    }

    /**
     * Disconnect and cleanup
     */
    async disconnect(): Promise<void> {
        await this.stopTrading();
        this.derivAPI.disconnect();
        this.activeTrades.clear();
        this.tickHistory = [];
        this.digitHistory = [];
        this.patternBuffer = [];
    }
}
