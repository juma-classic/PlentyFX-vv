/**
 * SIMULATED Execution Layer (DISABLED)
 *
 * ⚠️ IMPORTANT SAFETY NOTICE ⚠️
 * REAL TRADE EXECUTION IS DISABLED
 * This module only simulates trade execution for testing and development
 * DO NOT connect to real trading endpoints
 * DO NOT place actual trades
 */

import type { TradeIntent } from './ruleEngine';

export interface SimulatedTradeResult {
    id: string;
    intent: TradeIntent;
    status: 'success' | 'error';
    executionTime: number;
    simulatedOutcome: 'win' | 'loss';
    simulatedPayout: number;
    simulatedPnL: number;
    timestamp: number;
    error?: string;
}

export interface ExecutorConfig {
    simulationMode: boolean; // Always true for safety
    winRate: number; // Simulated win rate (0-1)
    payoutMultiplier: number; // Simulated payout multiplier
    executionDelay: { min: number; max: number }; // Simulated execution delay
    errorRate: number; // Simulated error rate (0-1)
}

export class TradeExecutor {
    private config: ExecutorConfig;
    private executedTrades: SimulatedTradeResult[] = [];
    private isEnabled = false;

    constructor(config: ExecutorConfig) {
        this.config = {
            ...config,
            simulationMode: true, // Force simulation mode for safety
        };

        console.log('🎭 SIMULATED Trade Executor initialized');
        console.log('⚠️ REAL TRADE EXECUTION IS DISABLED');
        console.log('📊 Simulation config:', this.config);
    }

    /**
     * Execute trade intent (SIMULATED ONLY)
     *
     * ⚠️ SAFETY: This function does NOT place real trades
     * It only simulates the execution for testing purposes
     */
    public async executeTradeIntent(intent: TradeIntent): Promise<SimulatedTradeResult> {
        const startTime = performance.now();

        console.log('🎭 SIMULATING trade execution (NOT REAL):', {
            id: intent.id,
            contractType: intent.contractType,
            stake: intent.stake,
            digit: intent.digit,
        });

        // Simulate execution delay
        const delay = this.getRandomDelay();
        await new Promise(resolve => setTimeout(resolve, delay));

        // Simulate potential errors
        if (Math.random() < this.config.errorRate) {
            const error = 'Simulated execution error';
            console.log('❌ SIMULATED error:', error);

            return {
                id: intent.id,
                intent,
                status: 'error',
                executionTime: performance.now() - startTime,
                simulatedOutcome: 'loss',
                simulatedPayout: 0,
                simulatedPnL: -intent.stake,
                timestamp: Date.now(),
                error,
            };
        }

        // Simulate trade outcome
        const isWin = Math.random() < this.config.winRate;
        const payout = isWin ? intent.stake * this.config.payoutMultiplier : 0;
        const pnl = payout - intent.stake;

        const result: SimulatedTradeResult = {
            id: intent.id,
            intent,
            status: 'success',
            executionTime: performance.now() - startTime,
            simulatedOutcome: isWin ? 'win' : 'loss',
            simulatedPayout: payout,
            simulatedPnL: pnl,
            timestamp: Date.now(),
        };

        // Store result
        this.executedTrades.push(result);

        // Keep history manageable
        if (this.executedTrades.length > 1000) {
            this.executedTrades.shift();
        }

        console.log('✅ SIMULATED trade completed:', {
            id: intent.id,
            outcome: result.simulatedOutcome,
            pnl: result.simulatedPnL,
            executionTime: result.executionTime.toFixed(2) + 'ms',
        });

        return result;
    }

    /**
     * Get random execution delay
     */
    private getRandomDelay(): number {
        const { min, max } = this.config.executionDelay;
        return Math.random() * (max - min) + min;
    }

    /**
     * Enable/disable executor
     */
    public setEnabled(enabled: boolean): void {
        this.isEnabled = enabled;
        console.log(`🎭 Simulated executor ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Check if executor is enabled
     */
    public isExecutorEnabled(): boolean {
        return this.isEnabled;
    }

    /**
     * Get execution statistics
     */
    public getStats(): {
        totalTrades: number;
        winRate: number;
        totalPnL: number;
        averageExecutionTime: number;
        errorRate: number;
    } {
        if (this.executedTrades.length === 0) {
            return {
                totalTrades: 0,
                winRate: 0,
                totalPnL: 0,
                averageExecutionTime: 0,
                errorRate: 0,
            };
        }

        const successfulTrades = this.executedTrades.filter(t => t.status === 'success');
        const wins = successfulTrades.filter(t => t.simulatedOutcome === 'win');
        const errors = this.executedTrades.filter(t => t.status === 'error');

        return {
            totalTrades: this.executedTrades.length,
            winRate: successfulTrades.length > 0 ? wins.length / successfulTrades.length : 0,
            totalPnL: this.executedTrades.reduce((sum, trade) => sum + trade.simulatedPnL, 0),
            averageExecutionTime:
                this.executedTrades.reduce((sum, trade) => sum + trade.executionTime, 0) / this.executedTrades.length,
            errorRate: errors.length / this.executedTrades.length,
        };
    }

    /**
     * Get recent trade results
     */
    public getRecentTrades(limit = 50): SimulatedTradeResult[] {
        return this.executedTrades.slice(-limit);
    }

    /**
     * Update simulation configuration
     */
    public updateConfig(newConfig: Partial<ExecutorConfig>): void {
        this.config = {
            ...this.config,
            ...newConfig,
            simulationMode: true, // Always force simulation mode
        };

        console.log('🎭 Simulation config updated:', this.config);
    }

    /**
     * Reset statistics
     */
    public resetStats(): void {
        console.log('🔄 Resetting executor statistics');
        this.executedTrades = [];
    }

    /**
     * Get configuration
     */
    public getConfig(): ExecutorConfig {
        return { ...this.config };
    }

    /**
     * Safety check - always returns false for real trading
     */
    public canExecuteRealTrades(): boolean {
        console.warn('⚠️ SAFETY CHECK: Real trade execution is permanently disabled');
        return false;
    }

    /**
     * Simulate market conditions for testing
     */
    public simulateMarketConditions(conditions: {
        volatility?: 'low' | 'medium' | 'high';
        trend?: 'up' | 'down' | 'sideways';
    }): void {
        console.log('🎭 Simulating market conditions:', conditions);

        // Adjust win rate based on conditions
        let adjustedWinRate = this.config.winRate;

        if (conditions.volatility === 'high') {
            adjustedWinRate *= 0.9; // Slightly lower win rate in high volatility
        } else if (conditions.volatility === 'low') {
            adjustedWinRate *= 1.1; // Slightly higher win rate in low volatility
        }

        // Ensure win rate stays within bounds
        adjustedWinRate = Math.max(0, Math.min(1, adjustedWinRate));

        this.config.winRate = adjustedWinRate;
        console.log('📊 Adjusted win rate for simulation:', adjustedWinRate);
    }
}
