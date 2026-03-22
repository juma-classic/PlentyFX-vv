/**
 * Strategy Manager - Execute and backtest trading strategies
 */

import { TickData } from './fast-lane-api';

export type Strategy = 'momentum' | 'mean-reversion' | 'pattern' | 'random';

export interface TradingSettings {
    market: string;
    tradeType: string;
    stake: number;
    duration: number;
    durationType: 't' | 's' | 'm' | 'h' | 'd';
}

export interface TradeDecision {
    shouldTrade: boolean;
    tradeType: string;
    confidence: number;
    reason: string;
}

export interface BacktestResult {
    totalTrades: number;
    wins: number;
    losses: number;
    winRate: number;
    totalProfit: number;
    maxDrawdown: number;
    sharpeRatio: number;
}

export class StrategyManager {
    /**
     * Execute a strategy based on tick history
     */
    executeStrategy(strategy: Strategy, tickHistory: number[], settings: TradingSettings): TradeDecision {
        switch (strategy) {
            case 'momentum':
                return this.momentumStrategy(tickHistory, settings);
            case 'mean-reversion':
                return this.meanReversionStrategy(tickHistory, settings);
            case 'pattern':
                return this.patternRecognitionStrategy(tickHistory, settings);
            case 'random':
                return this.randomStrategy(settings);
            default:
                return {
                    shouldTrade: false,
                    tradeType: settings.tradeType,
                    confidence: 0,
                    reason: 'Unknown strategy',
                };
        }
    }

    /**
     * Momentum Strategy: Follow the trend
     * If last N digits show a pattern, continue it
     */
    private momentumStrategy(tickHistory: number[], settings: TradingSettings): TradeDecision {
        if (tickHistory.length < 3) {
            return {
                shouldTrade: false,
                tradeType: settings.tradeType,
                confidence: 0,
                reason: 'Insufficient data for momentum strategy',
            };
        }

        const lastDigits = tickHistory.slice(-3).map(tick => tick % 10);
        const evenCount = lastDigits.filter(d => d % 2 === 0).length;
        const oddCount = lastDigits.length - evenCount;

        // Strong momentum: all same parity
        if (evenCount === 3) {
            return {
                shouldTrade: true,
                tradeType: 'DIGITEVEN',
                confidence: 0.8,
                reason: 'Strong even momentum (3/3)',
            };
        }

        if (oddCount === 3) {
            return {
                shouldTrade: true,
                tradeType: 'DIGITODD',
                confidence: 0.8,
                reason: 'Strong odd momentum (3/3)',
            };
        }

        // Moderate momentum: 2 out of 3
        if (evenCount === 2) {
            return {
                shouldTrade: true,
                tradeType: 'DIGITEVEN',
                confidence: 0.6,
                reason: 'Moderate even momentum (2/3)',
            };
        }

        if (oddCount === 2) {
            return {
                shouldTrade: true,
                tradeType: 'DIGITODD',
                confidence: 0.6,
                reason: 'Moderate odd momentum (2/3)',
            };
        }

        return {
            shouldTrade: false,
            tradeType: settings.tradeType,
            confidence: 0,
            reason: 'No clear momentum',
        };
    }

    /**
     * Mean Reversion Strategy: Bet against streaks
     * If there's a streak, expect reversal
     */
    private meanReversionStrategy(tickHistory: number[], settings: TradingSettings): TradeDecision {
        if (tickHistory.length < 5) {
            return {
                shouldTrade: false,
                tradeType: settings.tradeType,
                confidence: 0,
                reason: 'Insufficient data for mean reversion',
            };
        }

        const lastDigits = tickHistory.slice(-5).map(tick => tick % 10);
        const evenCount = lastDigits.filter(d => d % 2 === 0).length;
        const oddCount = lastDigits.length - evenCount;

        // Strong streak: bet against it
        if (evenCount >= 4) {
            return {
                shouldTrade: true,
                tradeType: 'DIGITODD',
                confidence: 0.75,
                reason: `Even streak detected (${evenCount}/5), expecting reversion`,
            };
        }

        if (oddCount >= 4) {
            return {
                shouldTrade: true,
                tradeType: 'DIGITEVEN',
                confidence: 0.75,
                reason: `Odd streak detected (${oddCount}/5), expecting reversion`,
            };
        }

        // Moderate streak
        if (evenCount === 3) {
            return {
                shouldTrade: true,
                tradeType: 'DIGITODD',
                confidence: 0.55,
                reason: 'Moderate even streak, possible reversion',
            };
        }

        if (oddCount === 3) {
            return {
                shouldTrade: true,
                tradeType: 'DIGITEVEN',
                confidence: 0.55,
                reason: 'Moderate odd streak, possible reversion',
            };
        }

        return {
            shouldTrade: false,
            tradeType: settings.tradeType,
            confidence: 0,
            reason: 'No clear streak for reversion',
        };
    }

    /**
     * Pattern Recognition Strategy: Detect repeating patterns
     */
    private patternRecognitionStrategy(tickHistory: number[], settings: TradingSettings): TradeDecision {
        if (tickHistory.length < 6) {
            return {
                shouldTrade: false,
                tradeType: settings.tradeType,
                confidence: 0,
                reason: 'Insufficient data for pattern recognition',
            };
        }

        const lastDigits = tickHistory.slice(-6).map(tick => tick % 10);

        // Check for alternating pattern (EOEOEO or OEOEOE)
        const isAlternating = this.checkAlternatingPattern(lastDigits);
        if (isAlternating) {
            const lastDigit = lastDigits[lastDigits.length - 1];
            const nextShouldBeEven = lastDigit % 2 !== 0;

            return {
                shouldTrade: true,
                tradeType: nextShouldBeEven ? 'DIGITEVEN' : 'DIGITODD',
                confidence: 0.7,
                reason: 'Alternating pattern detected',
            };
        }

        // Check for repeating pairs (EEOOEEO)
        const hasRepeatingPairs = this.checkRepeatingPairs(lastDigits);
        if (hasRepeatingPairs) {
            const lastTwoSame = lastDigits[lastDigits.length - 1] % 2 === lastDigits[lastDigits.length - 2] % 2;
            const lastParity = lastDigits[lastDigits.length - 1] % 2;

            if (lastTwoSame) {
                return {
                    shouldTrade: true,
                    tradeType: lastParity === 0 ? 'DIGITODD' : 'DIGITEVEN',
                    confidence: 0.65,
                    reason: 'Repeating pairs pattern, expecting switch',
                };
            }
        }

        return {
            shouldTrade: false,
            tradeType: settings.tradeType,
            confidence: 0,
            reason: 'No clear pattern detected',
        };
    }

    /**
     * Random Strategy: For testing purposes
     */
    private randomStrategy(): TradeDecision {
        const shouldTrade = Math.random() > 0.3; // 70% chance to trade
        const tradeType = Math.random() > 0.5 ? 'DIGITEVEN' : 'DIGITODD';

        return {
            shouldTrade,
            tradeType,
            confidence: 0.5,
            reason: 'Random selection',
        };
    }

    /**
     * Check if digits follow an alternating pattern
     */
    private checkAlternatingPattern(digits: number[]): boolean {
        for (let i = 1; i < digits.length; i++) {
            const currentParity = digits[i] % 2;
            const previousParity = digits[i - 1] % 2;

            if (currentParity === previousParity) {
                return false;
            }
        }
        return true;
    }

    /**
     * Check if digits have repeating pairs
     */
    private checkRepeatingPairs(digits: number[]): boolean {
        let pairCount = 0;

        for (let i = 1; i < digits.length; i++) {
            const currentParity = digits[i] % 2;
            const previousParity = digits[i - 1] % 2;

            if (currentParity === previousParity) {
                pairCount++;
            }
        }

        // At least 2 pairs in the sequence
        return pairCount >= 2;
    }

    /**
     * Backtest a strategy on historical data
     */
    backtest(strategy: Strategy, historicalData: TickData[], settings: TradingSettings): BacktestResult {
        let wins = 0;
        let losses = 0;
        let totalProfit = 0;
        const profits: number[] = [];

        // Need at least 10 ticks for meaningful backtest
        if (historicalData.length < 10) {
            return {
                totalTrades: 0,
                wins: 0,
                losses: 0,
                winRate: 0,
                totalProfit: 0,
                maxDrawdown: 0,
                sharpeRatio: 0,
            };
        }

        // Simulate trades
        for (let i = 5; i < historicalData.length - 1; i++) {
            const tickHistory = historicalData.slice(0, i).map(t => t.quote);
            const decision = this.executeStrategy(strategy, tickHistory, settings);

            if (decision.shouldTrade) {
                const nextTick = historicalData[i + 1];
                const nextDigit = Math.floor(nextTick.quote) % 10;
                const isEven = nextDigit % 2 === 0;

                const predictedEven = decision.tradeType === 'DIGITEVEN';
                const isWin = predictedEven === isEven;

                if (isWin) {
                    wins++;
                    const profit = settings.stake * 0.95; // 95% payout
                    totalProfit += profit;
                    profits.push(profit);
                } else {
                    losses++;
                    totalProfit -= settings.stake;
                    profits.push(-settings.stake);
                }
            }
        }

        const totalTrades = wins + losses;
        const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
        const maxDrawdown = this.calculateMaxDrawdown(profits);
        const sharpeRatio = this.calculateSharpeRatio(profits);

        return {
            totalTrades,
            wins,
            losses,
            winRate,
            totalProfit,
            maxDrawdown,
            sharpeRatio,
        };
    }

    /**
     * Calculate maximum drawdown
     */
    private calculateMaxDrawdown(profits: number[]): number {
        if (profits.length === 0) {
            return 0;
        }

        let peak = 0;
        let maxDrawdown = 0;
        let runningTotal = 0;

        for (const profit of profits) {
            runningTotal += profit;

            if (runningTotal > peak) {
                peak = runningTotal;
            }

            const drawdown = peak - runningTotal;
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
            }
        }

        return maxDrawdown;
    }

    /**
     * Calculate Sharpe Ratio (risk-adjusted return)
     */
    private calculateSharpeRatio(profits: number[]): number {
        if (profits.length === 0) {
            return 0;
        }

        const mean = profits.reduce((sum, p) => sum + p, 0) / profits.length;
        const variance = profits.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / profits.length;
        const stdDev = Math.sqrt(variance);

        if (stdDev === 0) {
            return 0;
        }

        // Annualized Sharpe Ratio (assuming 252 trading days)
        return (mean / stdDev) * Math.sqrt(252);
    }

    /**
     * Get strategy description
     */
    getStrategyDescription(strategy: Strategy): string {
        switch (strategy) {
            case 'momentum':
                return 'Follow the trend: If last 3 digits are mostly even/odd, continue the pattern';
            case 'mean-reversion':
                return "Bet against streaks: If there's a long streak, expect reversal";
            case 'pattern':
                return 'Detect patterns: Look for alternating or repeating sequences';
            case 'random':
                return 'Random selection: For testing and baseline comparison';
            default:
                return 'Unknown strategy';
        }
    }
}
