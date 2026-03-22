/**
 * Strategy Orchestrator Service
 *
 * Coordinates multiple trading strategies, signals, and execution across the platform.
 * Acts as the central intelligence hub for smart trading decisions.
 *
 * Includes integrated market analyzer for real-time signal generation.
 * Uses Deriv API: active_symbols, proposal, buy, proposal_open_contract.
 */

import { marketAnalyzer, AnalysisResult } from './market-analyzer.service';
import { api_base } from '@/external/bot-skeleton/services/api/api-base';
import { smartTradingExecutor } from './smart-trading-executor.service';

export interface Signal {
    id: string;
    source:
        | 'zeus-analysis'
        | 'advanced-algo'
        | 'patel-signals'
        | 'signal-savvy'
        | 'digit-hacker'
        | 'track-signals'
        | 'market-analyzer';
    symbol: string;
    prediction: 'RISE' | 'FALL' | 'EVEN' | 'ODD' | 'OVER' | 'UNDER' | 'MATCHES' | 'DIFFERS';
    confidence: number;
    timestamp: number;
    metadata?: Record<string, any>;
}

export interface Strategy {
    id: string;
    name: string;
    botFile: string;
    type: 'rise-fall' | 'even-odd' | 'over-under' | 'matches-differs' | 'accumulator' | 'martingale';
    isActive: boolean;
    isRunning: boolean;
    performance: StrategyPerformance;
    settings: StrategySettings;
}

export interface StrategyPerformance {
    totalTrades: number;
    wins: number;
    losses: number;
    winRate: number;
    profit: number;
    lastUpdated: number;
}

export interface StrategySettings {
    initialStake: number;
    martingaleMultiplier: number;
    maxLossStreak: number;
    minConfidence: number;
    autoStart: boolean;
    riskLevel: 'low' | 'medium' | 'high';
}

export interface OrchestratorState {
    isActive: boolean;
    activeStrategies: string[];
    totalProfit: number;
    totalTrades: number;
    signalQueue: Signal[];
    lastUpdate: number;
}

export interface ActiveSymbol {
    symbol: string;
    display_name: string;
    market: string;
    market_display_name: string;
    submarket_display_name: string;
    is_trading_suspended: boolean;
}

class StrategyOrchestratorService {
    private strategies: Map<string, Strategy> = new Map();
    private signals: Signal[] = [];
    private activeSymbolsCache: ActiveSymbol[] = [];
    private state: OrchestratorState = {
        isActive: false,
        activeStrategies: [],
        totalProfit: 0,
        totalTrades: 0,
        signalQueue: [],
        lastUpdate: Date.now(),
    };
    private listeners: Map<string, Set<Function>> = new Map();
    private signalAggregationInterval: number | null = null;

    constructor() {
        this.initializeDefaultStrategies();
        this.loadStateFromStorage();
        this.initializeMarketAnalyzer();
    }

    /**
     * Initialize market analyzer integration
     */
    private initializeMarketAnalyzer(): void {
        // Listen to market analyzer signals
        marketAnalyzer.on('analysis', (result: AnalysisResult) => {
            if (result.recommendation) {
                const signal: Signal = {
                    id: `ma-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    source: 'market-analyzer',
                    symbol: marketAnalyzer.getStatus().symbol,
                    prediction: result.recommendation as any,
                    confidence: result.confidence,
                    timestamp: result.timestamp,
                    metadata: result.data,
                };
                this.addSignal(signal);
            }
        });

        // Listen to connection status
        marketAnalyzer.on('connection-status', (status: any) => {
            console.log('📡 Market Analyzer:', status.status);
            this.emit('analyzer:status', status);
        });

        // Listen to price updates
        marketAnalyzer.on('price-update', (data: any) => {
            this.emit('analyzer:price', data);
        });

        console.log('✅ Market Analyzer integrated with Strategy Orchestrator');
    }

    /**
     * Initialize default strategies from available bots
     */
    private initializeDefaultStrategies(): void {
        const defaultStrategies: Omit<Strategy, 'performance'>[] = [
            {
                id: 'patel-entry',
                name: 'PATEL Entry Point',
                botFile: 'PATEL (with Entry).xml',
                type: 'rise-fall',
                isActive: false,
                isRunning: false,
                settings: {
                    initialStake: 1.0,
                    martingaleMultiplier: 2.0,
                    maxLossStreak: 5,
                    minConfidence: 60,
                    autoStart: false,
                    riskLevel: 'medium',
                },
            },
            {
                id: 'auto-differ',
                name: 'Auto Differ Recovery',
                botFile: 'Auto differ recovery over under.xml',
                type: 'over-under',
                isActive: false,
                isRunning: false,
                settings: {
                    initialStake: 0.5,
                    martingaleMultiplier: 2.2,
                    maxLossStreak: 7,
                    minConfidence: 55,
                    autoStart: false,
                    riskLevel: 'medium',
                },
            },
            {
                id: 'zeus-ai-pro',
                name: 'Zeus AI Pro',
                botFile: 'ZEUS AI PRO v1.xml',
                type: 'rise-fall',
                isActive: false,
                isRunning: false,
                settings: {
                    initialStake: 1.5,
                    martingaleMultiplier: 1.8,
                    maxLossStreak: 4,
                    minConfidence: 65,
                    autoStart: false,
                    riskLevel: 'low',
                },
            },
            {
                id: 'dollar-flipper',
                name: 'Dollar Flipper',
                botFile: 'dollar_flipper.xml',
                type: 'even-odd',
                isActive: false,
                isRunning: false,
                settings: {
                    initialStake: 1.0,
                    martingaleMultiplier: 2.5,
                    maxLossStreak: 6,
                    minConfidence: 58,
                    autoStart: false,
                    riskLevel: 'high',
                },
            },
        ];

        defaultStrategies.forEach(strategy => {
            this.strategies.set(strategy.id, {
                ...strategy,
                performance: {
                    totalTrades: 0,
                    wins: 0,
                    losses: 0,
                    winRate: 0,
                    profit: 0,
                    lastUpdated: Date.now(),
                },
            });
        });

        console.log('✅ Strategy Orchestrator: Initialized with', this.strategies.size, 'strategies');
    }

    /**
     * Load orchestrator state from localStorage
     */
    private loadStateFromStorage(): void {
        try {
            const savedState = localStorage.getItem('strategy_orchestrator_state');
            if (savedState) {
                const parsed = JSON.parse(savedState);
                this.state = { ...this.state, ...parsed };
                console.log('✅ Loaded orchestrator state from storage');
            }

            // Load individual strategy performance
            this.strategies.forEach((strategy, id) => {
                const savedPerf = localStorage.getItem(`strategy_performance_${id}`);
                if (savedPerf) {
                    strategy.performance = JSON.parse(savedPerf);
                }
            });
        } catch (error) {
            console.error('Error loading orchestrator state:', error);
        }
    }

    /**
     * Save orchestrator state to localStorage
     */
    private saveStateToStorage(): void {
        try {
            localStorage.setItem('strategy_orchestrator_state', JSON.stringify(this.state));

            // Save individual strategy performance
            this.strategies.forEach((strategy, id) => {
                localStorage.setItem(`strategy_performance_${id}`, JSON.stringify(strategy.performance));
            });
        } catch (error) {
            console.error('Error saving orchestrator state:', error);
        }
    }

    /**
     * Add a signal to the orchestrator
     */
    public addSignal(signal: Signal): void {
        this.signals.push(signal);
        this.state.signalQueue.push(signal);

        // Keep only last 100 signals
        if (this.signals.length > 100) {
            this.signals.shift();
        }
        if (this.state.signalQueue.length > 100) {
            this.state.signalQueue.shift();
        }

        console.log(`📊 Signal added from ${signal.source}: ${signal.prediction} (${signal.confidence}%)`);

        // Process signal for strategy matching
        this.processSignal(signal);

        this.emit('signal:added', signal);
    }

    /**
     * Process a signal and match it to appropriate strategies
     */
    private processSignal(signal: Signal): void {
        // Find strategies that match this signal type
        const matchingStrategies = Array.from(this.strategies.values()).filter(strategy => {
            if (!strategy.isActive) return false;
            if (signal.confidence < strategy.settings.minConfidence) return false;

            // Match signal type to strategy type
            if (signal.prediction === 'RISE' || signal.prediction === 'FALL') {
                return strategy.type === 'rise-fall';
            }
            if (signal.prediction === 'EVEN' || signal.prediction === 'ODD') {
                return strategy.type === 'even-odd';
            }
            if (signal.prediction === 'OVER' || signal.prediction === 'UNDER') {
                return strategy.type === 'over-under';
            }
            if (signal.prediction === 'MATCHES' || signal.prediction === 'DIFFERS') {
                return strategy.type === 'matches-differs';
            }

            return false;
        });

        if (matchingStrategies.length > 0) {
            console.log(`🎯 Found ${matchingStrategies.length} matching strategies for signal`);

            // Select best strategy based on performance
            const bestStrategy = this.selectBestStrategy(matchingStrategies);

            if (bestStrategy && bestStrategy.settings.autoStart && !bestStrategy.isRunning) {
                console.log(`🚀 Auto-starting strategy: ${bestStrategy.name}`);
                this.emit('strategy:auto-start', { strategy: bestStrategy, signal });
            }
        }
    }

    /**
     * Select the best strategy from a list based on performance
     */
    private selectBestStrategy(strategies: Strategy[]): Strategy | null {
        if (strategies.length === 0) return null;

        // Sort by win rate, then by profit
        const sorted = strategies.sort((a, b) => {
            if (a.performance.winRate !== b.performance.winRate) {
                return b.performance.winRate - a.performance.winRate;
            }
            return b.performance.profit - a.performance.profit;
        });

        return sorted[0];
    }

    /**
     * Get aggregated signals from multiple sources
     */
    public getAggregatedSignals(symbol: string, timeWindow: number = 60000): Signal[] {
        const now = Date.now();
        return this.signals.filter(signal => signal.symbol === symbol && now - signal.timestamp < timeWindow);
    }

    /**
     * Get consensus signal from multiple sources
     */
    public getConsensusSignal(symbol: string): Signal | null {
        const recentSignals = this.getAggregatedSignals(symbol, 30000); // Last 30 seconds

        if (recentSignals.length === 0) return null;

        // Count predictions
        const predictionCounts = new Map<string, number>();
        const predictionConfidences = new Map<string, number[]>();

        recentSignals.forEach(signal => {
            const count = predictionCounts.get(signal.prediction) || 0;
            predictionCounts.set(signal.prediction, count + 1);

            const confidences = predictionConfidences.get(signal.prediction) || [];
            confidences.push(signal.confidence);
            predictionConfidences.set(signal.prediction, confidences);
        });

        // Find most common prediction
        let maxCount = 0;
        let consensusPrediction = '';

        predictionCounts.forEach((count, prediction) => {
            if (count > maxCount) {
                maxCount = count;
                consensusPrediction = prediction;
            }
        });

        if (maxCount < 2) return null; // Need at least 2 sources to agree

        // Calculate average confidence
        const confidences = predictionConfidences.get(consensusPrediction) || [];
        const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;

        return {
            id: `consensus-${Date.now()}`,
            source: 'advanced-algo',
            symbol,
            prediction: consensusPrediction as any,
            confidence: avgConfidence,
            timestamp: Date.now(),
            metadata: {
                sourceCount: maxCount,
                sources: recentSignals.filter(s => s.prediction === consensusPrediction).map(s => s.source),
            },
        };
    }

    /**
     * Start the orchestrator
     */
    public start(): void {
        if (this.state.isActive) {
            console.warn('⚠️ Orchestrator is already running');
            return;
        }

        this.state.isActive = true;
        this.state.lastUpdate = Date.now();

        // Start market analyzer
        marketAnalyzer.start();

        // Start signal aggregation
        this.signalAggregationInterval = window.setInterval(() => {
            this.aggregateAndProcessSignals();
        }, 5000); // Every 5 seconds

        console.log('✅ Strategy Orchestrator started');
        this.emit('orchestrator:started');
        this.saveStateToStorage();
    }

    /**
     * Stop the orchestrator
     */
    public stop(): void {
        if (!this.state.isActive) {
            console.warn('⚠️ Orchestrator is not running');
            return;
        }

        this.state.isActive = false;
        this.state.lastUpdate = Date.now();

        // Stop market analyzer
        marketAnalyzer.stop();

        if (this.signalAggregationInterval) {
            clearInterval(this.signalAggregationInterval);
            this.signalAggregationInterval = null;
        }

        // Stop all running strategies
        this.strategies.forEach(strategy => {
            if (strategy.isRunning) {
                this.stopStrategy(strategy.id);
            }
        });

        console.log('🛑 Strategy Orchestrator stopped');
        this.emit('orchestrator:stopped');
        this.saveStateToStorage();
    }

    /**
     * Aggregate and process signals periodically
     */
    private aggregateAndProcessSignals(): void {
        // This would integrate with your existing signal sources
        console.log('🔄 Aggregating signals...');
        this.emit('signals:aggregated', this.signals);
    }

    /**
     * Activate a strategy
     */
    public activateStrategy(strategyId: string): void {
        const strategy = this.strategies.get(strategyId);
        if (!strategy) {
            console.error(`Strategy ${strategyId} not found`);
            return;
        }

        strategy.isActive = true;
        console.log(`✅ Strategy activated: ${strategy.name}`);
        this.emit('strategy:activated', strategy);
        this.saveStateToStorage();
    }

    /**
     * Deactivate a strategy
     */
    public deactivateStrategy(strategyId: string): void {
        const strategy = this.strategies.get(strategyId);
        if (!strategy) {
            console.error(`Strategy ${strategyId} not found`);
            return;
        }

        if (strategy.isRunning) {
            this.stopStrategy(strategyId);
        }

        strategy.isActive = false;
        console.log(`🔴 Strategy deactivated: ${strategy.name}`);
        this.emit('strategy:deactivated', strategy);
        this.saveStateToStorage();
    }

    /**
     * Start a strategy
     */
    public startStrategy(strategyId: string, signal?: Signal): void {
        const strategy = this.strategies.get(strategyId);
        if (!strategy) {
            console.error(`Strategy ${strategyId} not found`);
            return;
        }

        if (!strategy.isActive) {
            console.error(`Strategy ${strategy.name} is not activated`);
            return;
        }

        strategy.isRunning = true;
        this.state.activeStrategies.push(strategyId);

        console.log(`🚀 Strategy started: ${strategy.name}`);
        this.emit('strategy:started', { strategy, signal });
        this.saveStateToStorage();
    }

    /**
     * Stop a strategy
     */
    public stopStrategy(strategyId: string): void {
        const strategy = this.strategies.get(strategyId);
        if (!strategy) {
            console.error(`Strategy ${strategyId} not found`);
            return;
        }

        strategy.isRunning = false;
        this.state.activeStrategies = this.state.activeStrategies.filter(id => id !== strategyId);

        console.log(`🛑 Strategy stopped: ${strategy.name}`);
        this.emit('strategy:stopped', strategy);
        this.saveStateToStorage();
    }

    /**
     * Update strategy performance
     */
    public updateStrategyPerformance(strategyId: string, trade: { won: boolean; profit: number }): void {
        const strategy = this.strategies.get(strategyId);
        if (!strategy) return;

        strategy.performance.totalTrades++;
        if (trade.won) {
            strategy.performance.wins++;
        } else {
            strategy.performance.losses++;
        }
        strategy.performance.profit += trade.profit;
        strategy.performance.winRate = (strategy.performance.wins / strategy.performance.totalTrades) * 100;
        strategy.performance.lastUpdated = Date.now();

        this.state.totalTrades++;
        this.state.totalProfit += trade.profit;

        console.log(
            `📊 Updated performance for ${strategy.name}: ${strategy.performance.winRate.toFixed(1)}% win rate`
        );
        this.emit('performance:updated', strategy);
        this.saveStateToStorage();
    }

    /**
     * Get all strategies
     */
    public getStrategies(): Strategy[] {
        return Array.from(this.strategies.values());
    }

    /**
     * Get a specific strategy
     */
    public getStrategy(strategyId: string): Strategy | undefined {
        return this.strategies.get(strategyId);
    }

    /**
     * Get orchestrator state
     */
    public getState(): OrchestratorState {
        return { ...this.state };
    }

    /**
     * Update strategy settings
     */
    public updateStrategySettings(strategyId: string, settings: Partial<StrategySettings>): void {
        const strategy = this.strategies.get(strategyId);
        if (!strategy) return;

        strategy.settings = { ...strategy.settings, ...settings };
        console.log(`⚙️ Updated settings for ${strategy.name}`);
        this.emit('strategy:settings-updated', strategy);
        this.saveStateToStorage();
    }

    /**
     * Event listener management
     */
    public on(event: string, callback: Function): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback);
    }

    public off(event: string, callback: Function): void {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.delete(callback);
        }
    }

    private emit(event: string, data?: any): void {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Get performance summary
     */
    public getPerformanceSummary(): {
        totalProfit: number;
        totalTrades: number;
        overallWinRate: number;
        bestStrategy: Strategy | null;
        worstStrategy: Strategy | null;
    } {
        const strategies = this.getStrategies();
        const activeStrategies = strategies.filter(s => s.performance.totalTrades > 0);

        let bestStrategy: Strategy | null = null;
        let worstStrategy: Strategy | null = null;

        if (activeStrategies.length > 0) {
            bestStrategy = activeStrategies.reduce((best, current) =>
                current.performance.winRate > best.performance.winRate ? current : best
            );

            worstStrategy = activeStrategies.reduce((worst, current) =>
                current.performance.winRate < worst.performance.winRate ? current : worst
            );
        }

        const totalWins = strategies.reduce((sum, s) => sum + s.performance.wins, 0);
        const totalTrades = strategies.reduce((sum, s) => sum + s.performance.totalTrades, 0);

        return {
            totalProfit: this.state.totalProfit,
            totalTrades: this.state.totalTrades,
            overallWinRate: totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0,
            bestStrategy,
            worstStrategy,
        };
    }

    /**
     * Get market analyzer instance
     */
    public getMarketAnalyzer() {
        return marketAnalyzer;
    }

    /**
     * Fetch active symbols from Deriv API (volatility indices only)
     */
    public async fetchActiveSymbols(): Promise<ActiveSymbol[]> {
        // Return cache if fresh (< 5 min old)
        if (this.activeSymbolsCache.length > 0) {
            return this.activeSymbolsCache;
        }

        try {
            if (!api_base?.api) {
                console.warn('⚠️ api_base not ready, using fallback symbol list');
                return [];
            }

            const response = await api_base.api.send({
                active_symbols: 'brief',
                product_type: 'basic',
            });

            if (response?.error) {
                console.error('❌ active_symbols error:', response.error.message);
                return [];
            }

            const symbols: ActiveSymbol[] = (response?.active_symbols || [])
                .filter(
                    (s: any) =>
                        !s.is_trading_suspended && (s.market === 'synthetic_index' || s.submarket === 'random_index')
                )
                .map((s: any) => ({
                    symbol: s.symbol,
                    display_name: s.display_name,
                    market: s.market,
                    market_display_name: s.market_display_name,
                    submarket_display_name: s.submarket_display_name,
                    is_trading_suspended: s.is_trading_suspended,
                }));

            this.activeSymbolsCache = symbols;
            console.log(`✅ Fetched ${symbols.length} active volatility symbols`);
            this.emit('symbols:loaded', symbols);
            return symbols;
        } catch (error) {
            console.error('❌ Failed to fetch active symbols:', error);
            return [];
        }
    }

    /**
     * Get cached active symbols
     */
    public getActiveSymbols(): ActiveSymbol[] {
        return this.activeSymbolsCache;
    }

    /**
     * Wire up smart trading executor trade results to strategy performance
     */
    public connectTradeResults(strategyId: string): void {
        const handler = (trade: any) => {
            if (trade.result === 'win' || trade.result === 'loss') {
                this.updateStrategyPerformance(strategyId, {
                    won: trade.result === 'win',
                    profit: trade.profit,
                });
            }
        };
        smartTradingExecutor.on('trade-result', handler);
    }

    /**
     * Update market analyzer symbol
     */
    public updateAnalyzerSymbol(symbol: string): void {
        marketAnalyzer.updateSymbol(symbol);
    }

    /**
     * Update market analyzer tick count
     */
    public updateAnalyzerTickCount(count: number): void {
        marketAnalyzer.updateTickCount(count);
    }

    /**
     * Update market analyzer barrier
     */
    public updateAnalyzerBarrier(barrier: number): void {
        marketAnalyzer.updateBarrier(barrier);
    }

    /**
     * Get market analyzer status
     */
    public getAnalyzerStatus() {
        return marketAnalyzer.getStatus();
    }
}

// Export singleton instance
export const strategyOrchestrator = new StrategyOrchestratorService();
