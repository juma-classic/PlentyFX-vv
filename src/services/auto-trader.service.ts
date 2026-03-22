/**
 * Auto Trader Service
 * Automatically executes trades based on signals and predictions
 * Includes safety checks, limits, and execution tracking
 */

import type { EntryPointAnalysis } from './entry-point-detector.service';
import type { PredictionResult } from './pattern-predictor.service';

export interface AutoTradeConfig {
    enabled: boolean;
    minConfidence: number; // Minimum prediction confidence (0-100)
    maxTradesPerHour: number;
    maxDailyTrades: number;
    maxConcurrentTrades: number;
    onlyHighProbability: boolean; // Only trade when probability > 70%
    respectEntryPoints: boolean; // Only trade at optimal entry points
    tradeAmount: number;
    contractType: 'DIGITEVEN' | 'DIGITODD' | 'DIGITOVER' | 'DIGITUNDER' | 'CALL' | 'PUT';
    duration: number;
    durationType: 't' | 's' | 'm' | 'h' | 'd';
}

export interface TradeExecution {
    id: string;
    timestamp: number;
    prediction: PredictionResult;
    entryPoint?: EntryPointAnalysis;
    contractType: string;
    amount: number;
    duration: number;
    status: 'PENDING' | 'EXECUTED' | 'FAILED' | 'CANCELLED';
    contractId?: string;
    error?: string;
}

export interface AutoTradeStats {
    totalTrades: number;
    tradesThisHour: number;
    tradesToday: number;
    activeTrades: number;
    successRate: number;
    totalProfit: number;
    lastTradeTime: number;
}

class AutoTraderService {
    private config: AutoTradeConfig = {
        enabled: false,
        minConfidence: 65,
        maxTradesPerHour: 10,
        maxDailyTrades: 50,
        maxConcurrentTrades: 3,
        onlyHighProbability: true,
        respectEntryPoints: true,
        tradeAmount: 1,
        contractType: 'CALL',
        duration: 5,
        durationType: 't',
    };

    private executions: TradeExecution[] = [];
    private stats: AutoTradeStats = {
        totalTrades: 0,
        tradesThisHour: 0,
        tradesToday: 0,
        activeTrades: 0,
        successRate: 0,
        totalProfit: 0,
        lastTradeTime: 0,
    };

    private listeners: Array<(execution: TradeExecution) => void> = [];

    /**
     * Enable auto-trading
     */
    public enable(): void {
        this.config.enabled = true;
        this.saveConfig();
    }

    /**
     * Disable auto-trading
     */
    public disable(): void {
        this.config.enabled = false;
        this.saveConfig();
    }

    /**
     * Check if auto-trading is enabled
     */
    public isEnabled(): boolean {
        return this.config.enabled;
    }

    /**
     * Update configuration
     */
    public updateConfig(updates: Partial<AutoTradeConfig>): void {
        this.config = { ...this.config, ...updates };
        this.saveConfig();
    }

    /**
     * Get current configuration
     */
    public getConfig(): AutoTradeConfig {
        return { ...this.config };
    }

    /**
     * Evaluate if trade should be executed
     */
    public shouldExecuteTrade(
        prediction: PredictionResult,
        entryPoint?: EntryPointAnalysis
    ): { shouldTrade: boolean; reason: string } {
        // Check if auto-trading is enabled
        if (!this.config.enabled) {
            return { shouldTrade: false, reason: 'Auto-trading is disabled' };
        }

        // Check confidence threshold
        if (prediction.confidence < this.config.minConfidence) {
            return {
                shouldTrade: false,
                reason: `Confidence ${prediction.confidence}% below minimum ${this.config.minConfidence}%`,
            };
        }

        // Check if prediction recommends trading
        if (prediction.recommendedAction !== 'TRADE') {
            return {
                shouldTrade: false,
                reason: `Prediction recommends: ${prediction.recommendedAction}`,
            };
        }

        // Check high probability requirement
        if (this.config.onlyHighProbability && prediction.confidence < 70) {
            return {
                shouldTrade: false,
                reason: 'High probability mode requires 70%+ confidence',
            };
        }

        // Check entry point if required
        if (this.config.respectEntryPoints && entryPoint) {
            if (entryPoint.score < 70) {
                return {
                    shouldTrade: false,
                    reason: `Entry point score ${entryPoint.score} too low`,
                };
            }
        }

        // Check trade limits
        const limitCheck = this.checkTradeLimits();
        if (!limitCheck.allowed) {
            return { shouldTrade: false, reason: limitCheck.reason };
        }

        return { shouldTrade: true, reason: 'All conditions met' };
    }

    /**
     * Check trade limits
     */
    private checkTradeLimits(): { allowed: boolean; reason: string } {
        // Check concurrent trades
        if (this.stats.activeTrades >= this.config.maxConcurrentTrades) {
            return {
                allowed: false,
                reason: `Max concurrent trades (${this.config.maxConcurrentTrades}) reached`,
            };
        }

        // Check hourly limit
        this.updateHourlyCount();
        if (this.stats.tradesThisHour >= this.config.maxTradesPerHour) {
            return {
                allowed: false,
                reason: `Max trades per hour (${this.config.maxTradesPerHour}) reached`,
            };
        }

        // Check daily limit
        this.updateDailyCount();
        if (this.stats.tradesToday >= this.config.maxDailyTrades) {
            return {
                allowed: false,
                reason: `Max daily trades (${this.config.maxDailyTrades}) reached`,
            };
        }

        return { allowed: true, reason: 'Within limits' };
    }

    /**
     * Execute trade
     */
    public async executeTrade(prediction: PredictionResult, entryPoint?: EntryPointAnalysis): Promise<TradeExecution> {
        const execution: TradeExecution = {
            id: this.generateExecutionId(),
            timestamp: Date.now(),
            prediction,
            entryPoint,
            contractType: this.config.contractType,
            amount: this.config.tradeAmount,
            duration: this.config.duration,
            status: 'PENDING',
        };

        try {
            // Add to executions
            this.executions.push(execution);

            // Update stats
            this.stats.activeTrades++;
            this.stats.tradesThisHour++;
            this.stats.tradesToday++;
            this.stats.totalTrades++;
            this.stats.lastTradeTime = Date.now();

            // Notify listeners
            this.notifyListeners(execution);

            // Here you would integrate with Deriv API
            // For now, we'll simulate the execution
            execution.status = 'EXECUTED';
            execution.contractId = `CONTRACT_${Date.now()}`;

            return execution;
        } catch (error) {
            execution.status = 'FAILED';
            execution.error = error instanceof Error ? error.message : 'Unknown error';
            return execution;
        }
    }

    /**
     * Cancel pending trade
     */
    public cancelTrade(executionId: string): boolean {
        const execution = this.executions.find(e => e.id === executionId);
        if (execution && execution.status === 'PENDING') {
            execution.status = 'CANCELLED';
            this.stats.activeTrades = Math.max(0, this.stats.activeTrades - 1);
            return true;
        }
        return false;
    }

    /**
     * Get execution history
     */
    public getExecutions(limit?: number): TradeExecution[] {
        const sorted = [...this.executions].sort((a, b) => b.timestamp - a.timestamp);
        return limit ? sorted.slice(0, limit) : sorted;
    }

    /**
     * Get statistics
     */
    public getStats(): AutoTradeStats {
        return { ...this.stats };
    }

    /**
     * Reset statistics
     */
    public resetStats(): void {
        this.stats = {
            totalTrades: 0,
            tradesThisHour: 0,
            tradesToday: 0,
            activeTrades: 0,
            successRate: 0,
            totalProfit: 0,
            lastTradeTime: 0,
        };
        this.executions = [];
    }

    /**
     * Subscribe to trade executions
     */
    public subscribe(callback: (execution: TradeExecution) => void): () => void {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    /**
     * Notify listeners
     */
    private notifyListeners(execution: TradeExecution): void {
        this.listeners.forEach(callback => callback(execution));
    }

    /**
     * Update hourly trade count
     */
    private updateHourlyCount(): void {
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        this.stats.tradesThisHour = this.executions.filter(
            e => e.timestamp > oneHourAgo && e.status === 'EXECUTED'
        ).length;
    }

    /**
     * Update daily trade count
     */
    private updateDailyCount(): void {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        this.stats.tradesToday = this.executions.filter(
            e => e.timestamp > startOfDay.getTime() && e.status === 'EXECUTED'
        ).length;
    }

    /**
     * Generate unique execution ID
     */
    private generateExecutionId(): string {
        return `EXEC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Save configuration to localStorage
     */
    private saveConfig(): void {
        try {
            localStorage.setItem('autoTradeConfig', JSON.stringify(this.config));
        } catch (e) {
            console.warn('Failed to save auto-trade config:', e);
        }
    }

    /**
     * Load configuration from localStorage
     */
    public loadConfig(): void {
        try {
            const stored = localStorage.getItem('autoTradeConfig');
            if (stored) {
                this.config = { ...this.config, ...JSON.parse(stored) };
            }
        } catch (e) {
            console.warn('Failed to load auto-trade config:', e);
        }
    }
}

export const autoTrader = new AutoTraderService();
