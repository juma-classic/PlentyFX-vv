import { makeAutoObservable } from 'mobx';
import type { StrategyConfig, StrategyDecision, TickData } from '@/types/fast-lane.types';

/**
 * Strategy Service
 * Makes trading decisions based on tick data
 * Pure decision logic - no API calls
 */
export class FastLaneStrategy {
    private tickHistory: TickData[] = [];
    private readonly maxHistorySize = 100;

    constructor() {
        makeAutoObservable(this);
    }

    /**
     * Evaluate tick and decide if we should trade
     */
    evaluateTick(tick: TickData, config: StrategyConfig): StrategyDecision {
        // Store tick in history
        this.addTickToHistory(tick);

        // Not enough history yet
        if (this.tickHistory.length < 2) {
            return {
                shouldTrade: false,
                reason: 'Insufficient tick history',
            };
        }

        // Route to appropriate strategy
        switch (config.type) {
            case 'DIGIT_OVER':
                return this.evaluateDigitOver(tick, config);
            case 'DIGIT_UNDER':
                return this.evaluateDigitUnder(tick, config);
            case 'DIGIT_MATCH':
                return this.evaluateDigitMatch(tick, config);
            case 'DIGIT_EVEN':
                return this.evaluateDigitEven(tick, config);
            case 'DIGIT_ODD':
                return this.evaluateDigitOdd(tick, config);
            default:
                return {
                    shouldTrade: false,
                    reason: 'Unknown strategy type',
                };
        }
    }

    /**
     * DIGIT OVER Strategy
     * Trade when last digit is likely to be over barrier
     */
    private evaluateDigitOver(tick: TickData, config: StrategyConfig): StrategyDecision {
        const lastDigit = this.getLastDigit(tick.quote);
        const barrier = config.barrier || 5;

        // Simple pattern: if recent digits show upward trend
        const recentDigits = this.getRecentDigits(5);
        const avgRecent = recentDigits.reduce((a, b) => a + b, 0) / recentDigits.length;

        if (avgRecent > barrier) {
            return {
                shouldTrade: true,
                reason: `Recent average ${avgRecent.toFixed(1)} > barrier ${barrier}`,
                contractType: 'DIGITOVER',
                barrier,
                prediction: lastDigit,
            };
        }

        return {
            shouldTrade: false,
            reason: `Recent average ${avgRecent.toFixed(1)} <= barrier ${barrier}`,
        };
    }

    /**
     * DIGIT UNDER Strategy
     * Trade when last digit is likely to be under barrier
     */
    private evaluateDigitUnder(tick: TickData, config: StrategyConfig): StrategyDecision {
        const lastDigit = this.getLastDigit(tick.quote);
        const barrier = config.barrier || 5;

        const recentDigits = this.getRecentDigits(5);
        const avgRecent = recentDigits.reduce((a, b) => a + b, 0) / recentDigits.length;

        if (avgRecent < barrier) {
            return {
                shouldTrade: true,
                reason: `Recent average ${avgRecent.toFixed(1)} < barrier ${barrier}`,
                contractType: 'DIGITUNDER',
                barrier,
                prediction: lastDigit,
            };
        }

        return {
            shouldTrade: false,
            reason: `Recent average ${avgRecent.toFixed(1)} >= barrier ${barrier}`,
        };
    }

    /**
     * DIGIT MATCH Strategy
     * Trade when specific digit appears frequently
     */
    private evaluateDigitMatch(tick: TickData, config: StrategyConfig): StrategyDecision {
        const targetDigit = config.prediction || 0;
        const recentDigits = this.getRecentDigits(10);

        // Count occurrences of target digit
        const occurrences = recentDigits.filter(d => d === targetDigit).length;
        const frequency = occurrences / recentDigits.length;

        // Trade if digit appears more than 30% of the time
        if (frequency > 0.3) {
            return {
                shouldTrade: true,
                reason: `Digit ${targetDigit} appears ${(frequency * 100).toFixed(0)}% of time`,
                contractType: 'DIGITMATCH',
                prediction: targetDigit,
            };
        }

        return {
            shouldTrade: false,
            reason: `Digit ${targetDigit} frequency ${(frequency * 100).toFixed(0)}% too low`,
        };
    }

    /**
     * DIGIT EVEN Strategy
     * Trade when even digits are trending
     */
    private evaluateDigitEven(_tick: TickData, _config: StrategyConfig): StrategyDecision { // eslint-disable-line @typescript-eslint/no-unused-vars
        const recentDigits = this.getRecentDigits(10);
        const evenCount = recentDigits.filter(d => d % 2 === 0).length;
        const evenFrequency = evenCount / recentDigits.length;

        // Trade if even digits appear more than 60% of the time
        if (evenFrequency > 0.6) {
            return {
                shouldTrade: true,
                reason: `Even digits appear ${(evenFrequency * 100).toFixed(0)}% of time`,
                contractType: 'DIGITEVEN',
            };
        }

        return {
            shouldTrade: false,
            reason: `Even frequency ${(evenFrequency * 100).toFixed(0)}% too low`,
        };
    }

    /**
     * DIGIT ODD Strategy
     * Trade when odd digits are trending
     */
    private evaluateDigitOdd(_tick: TickData, _config: StrategyConfig): StrategyDecision { // eslint-disable-line @typescript-eslint/no-unused-vars
        const recentDigits = this.getRecentDigits(10);
        const oddCount = recentDigits.filter(d => d % 2 !== 0).length;
        const oddFrequency = oddCount / recentDigits.length;

        // Trade if odd digits appear more than 60% of the time
        if (oddFrequency > 0.6) {
            return {
                shouldTrade: true,
                reason: `Odd digits appear ${(oddFrequency * 100).toFixed(0)}% of time`,
                contractType: 'DIGITODD',
            };
        }

        return {
            shouldTrade: false,
            reason: `Odd frequency ${(oddFrequency * 100).toFixed(0)}% too low`,
        };
    }

    /**
     * Helper: Extract last digit from quote
     */
    private getLastDigit(quote: number): number {
        const quoteStr = quote.toFixed(5);
        return parseInt(quoteStr[quoteStr.length - 1], 10);
    }

    /**
     * Helper: Get recent digits from history
     */
    private getRecentDigits(count: number): number[] {
        return this.tickHistory
            .slice(-count)
            .map(tick => this.getLastDigit(tick.quote));
    }

    /**
     * Add tick to history
     */
    private addTickToHistory(tick: TickData): void {
        this.tickHistory.push(tick);
        if (this.tickHistory.length > this.maxHistorySize) {
            this.tickHistory.shift();
        }
    }

    /**
     * Get tick history
     */
    getTickHistory(): TickData[] {
        return [...this.tickHistory];
    }

    /**
     * Clear history
     */
    clearHistory(): void {
        this.tickHistory = [];
    }

    /**
     * Get digit frequency analysis
     */
    getDigitFrequency(): Record<number, number> {
        const frequency: Record<number, number> = {};
        for (let i = 0; i <= 9; i++) {
            frequency[i] = 0;
        }

        const recentDigits = this.getRecentDigits(50);
        recentDigits.forEach(digit => {
            frequency[digit]++;
        });

        return frequency;
    }
}
