/**
 * Entry Point Detector Service
 * Detects optimal entry points for trading based on pattern analysis
 * Scores opportunities from 0-100 and provides risk/reward calculations
 */

export interface EntryConditions {
    streakLength: number;
    distributionImbalance: number;
    isAlternating: boolean;
    isFibonacci: boolean;
    multipleSignalsAligned: boolean;
    volatility: number;
}

export interface EntryPoint {
    score: number; // 0-100
    confidence: number; // 0-100
    type: 'ENTER_NOW' | 'WAIT' | 'CAUTION';
    reason: string;
    riskRewardRatio: number;
    expectedProfit: number;
    entryWindowTicks: number; // How many ticks until opportunity expires
    conditions: EntryConditions;
}

class EntryPointDetectorService {
    private static instance: EntryPointDetectorService;
    private readonly STREAK_THRESHOLD = 7;
    private readonly IMBALANCE_THRESHOLD = 10;
    private readonly HIGH_SCORE_THRESHOLD = 75;
    private readonly MEDIUM_SCORE_THRESHOLD = 60;

    private constructor() {}

    public static getInstance(): EntryPointDetectorService {
        if (!EntryPointDetectorService.instance) {
            EntryPointDetectorService.instance = new EntryPointDetectorService();
        }
        return EntryPointDetectorService.instance;
    }

    /**
     * Detect entry point from pattern
     */
    public detectEntryPoint(pattern: string[]): EntryPoint {
        if (pattern.length < 5) {
            return this.getDefaultEntryPoint();
        }

        const conditions = this.analyzeConditions(pattern);
        const score = this.calculateScore(conditions);
        const confidence = this.calculateConfidence(conditions, score);
        const type = this.determineEntryType(score, confidence);
        const reason = this.generateReason(conditions, score);
        const riskRewardRatio = this.calculateRiskReward(score, confidence);
        const expectedProfit = this.calculateExpectedProfit(score, confidence);
        const entryWindowTicks = this.calculateEntryWindow(conditions);

        return {
            score,
            confidence,
            type,
            reason,
            riskRewardRatio,
            expectedProfit,
            entryWindowTicks,
            conditions,
        };
    }

    /**
     * Analyze pattern conditions
     */
    private analyzeConditions(pattern: string[]): EntryConditions {
        const streakLength = this.calculateStreakLength(pattern);
        const distributionImbalance = this.calculateDistributionImbalance(pattern);
        const isAlternating = this.checkAlternatingPattern(pattern);
        const isFibonacci = this.isFibonacciNumber(streakLength);
        const multipleSignalsAligned = this.checkMultipleSignals(streakLength, distributionImbalance, isAlternating);
        const volatility = this.calculateVolatility(pattern);

        return {
            streakLength,
            distributionImbalance,
            isAlternating,
            isFibonacci,
            multipleSignalsAligned,
            volatility,
        };
    }

    /**
     * Calculate streak length
     */
    private calculateStreakLength(pattern: string[]): number {
        if (pattern.length === 0) return 0;

        const lastType = pattern[pattern.length - 1];
        let streak = 1;

        for (let i = pattern.length - 2; i >= 0; i--) {
            if (pattern[i] === lastType) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    }

    /**
     * Calculate distribution imbalance
     */
    private calculateDistributionImbalance(pattern: string[]): number {
        const counts: Record<string, number> = {};

        pattern.forEach(p => {
            counts[p] = (counts[p] || 0) + 1;
        });

        const values = Object.values(counts);
        if (values.length < 2) return 0;

        return Math.abs(values[0] - values[1]);
    }

    /**
     * Check for alternating pattern
     */
    private checkAlternatingPattern(pattern: string[]): boolean {
        if (pattern.length < 6) return false;

        const recent = pattern.slice(-6);
        return recent.every((item, i) => {
            if (i === 0) return true;
            return item !== recent[i - 1];
        });
    }

    /**
     * Check if number is Fibonacci
     */
    private isFibonacciNumber(num: number): boolean {
        const fibonacci = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
        return fibonacci.includes(num);
    }

    /**
     * Check if multiple signals are aligned
     */
    private checkMultipleSignals(streakLength: number, imbalance: number, isAlternating: boolean): boolean {
        let signalCount = 0;

        if (streakLength >= this.STREAK_THRESHOLD) signalCount++;
        if (imbalance >= this.IMBALANCE_THRESHOLD) signalCount++;
        if (isAlternating) signalCount++;

        return signalCount >= 2;
    }

    /**
     * Calculate volatility
     */
    private calculateVolatility(pattern: string[]): number {
        if (pattern.length < 2) return 0;

        let changes = 0;
        for (let i = 1; i < pattern.length; i++) {
            if (pattern[i] !== pattern[i - 1]) {
                changes++;
            }
        }

        return (changes / (pattern.length - 1)) * 100;
    }

    /**
     * Calculate entry score (0-100)
     */
    private calculateScore(conditions: EntryConditions): number {
        let score = 0;

        // Streak contribution (max 40 points)
        if (conditions.streakLength >= this.STREAK_THRESHOLD) {
            score += Math.min(conditions.streakLength * 4, 40);
        }

        // Imbalance contribution (max 30 points)
        if (conditions.distributionImbalance >= this.IMBALANCE_THRESHOLD) {
            score += Math.min(conditions.distributionImbalance * 2, 30);
        }

        // Alternating pattern (15 points)
        if (conditions.isAlternating) {
            score += 15;
        }

        // Fibonacci bonus (10 points)
        if (conditions.isFibonacci) {
            score += 10;
        }

        // Multiple signals aligned (15 points)
        if (conditions.multipleSignalsAligned) {
            score += 15;
        }

        // Volatility penalty (reduce score if too volatile)
        if (conditions.volatility > 70) {
            score -= 10;
        }

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Calculate confidence level
     */
    private calculateConfidence(conditions: EntryConditions, score: number): number {
        let confidence = 50;

        // High score = high confidence
        if (score >= 80) confidence += 30;
        else if (score >= 60) confidence += 20;
        else if (score >= 40) confidence += 10;

        // Multiple signals = higher confidence
        if (conditions.multipleSignalsAligned) confidence += 15;

        // Low volatility = higher confidence
        if (conditions.volatility < 40) confidence += 10;

        // Fibonacci = higher confidence
        if (conditions.isFibonacci) confidence += 5;

        return Math.max(30, Math.min(95, confidence));
    }

    /**
     * Determine entry type
     */
    private determineEntryType(score: number, confidence: number): 'ENTER_NOW' | 'WAIT' | 'CAUTION' {
        const combinedScore = (score + confidence) / 2;

        if (combinedScore >= this.HIGH_SCORE_THRESHOLD && confidence >= 70) {
            return 'ENTER_NOW';
        } else if (combinedScore >= this.MEDIUM_SCORE_THRESHOLD) {
            return 'WAIT';
        } else {
            return 'CAUTION';
        }
    }

    /**
     * Generate reason for entry recommendation
     */
    private generateReason(conditions: EntryConditions, score: number): string {
        const reasons: string[] = [];

        if (conditions.streakLength >= this.STREAK_THRESHOLD) {
            reasons.push(`${conditions.streakLength} consecutive streak detected`);
        }

        if (conditions.distributionImbalance >= this.IMBALANCE_THRESHOLD) {
            reasons.push(`High imbalance (${conditions.distributionImbalance} difference)`);
        }

        if (conditions.isAlternating) {
            reasons.push('Perfect alternating pattern');
        }

        if (conditions.isFibonacci) {
            reasons.push('Fibonacci sequence detected');
        }

        if (conditions.multipleSignalsAligned) {
            reasons.push('Multiple signals aligned');
        }

        if (reasons.length === 0) {
            return score >= 50 ? 'Moderate opportunity detected' : 'Weak signal - wait for better setup';
        }

        return reasons.join(' • ');
    }

    /**
     * Calculate risk/reward ratio
     */
    private calculateRiskReward(score: number, confidence: number): number {
        // Higher score and confidence = better risk/reward
        const baseRatio = 1.0;
        const scoreBonus = (score / 100) * 2; // Max +2.0
        const confidenceBonus = (confidence / 100) * 1; // Max +1.0

        return Number((baseRatio + scoreBonus + confidenceBonus).toFixed(2));
    }

    /**
     * Calculate expected profit percentage
     */
    private calculateExpectedProfit(score: number, confidence: number): number {
        // Expected profit based on score and confidence
        const baseProfitPercent = 50;
        const scoreBonus = (score / 100) * 30;
        const confidenceBonus = (confidence / 100) * 20;

        return Math.round(baseProfitPercent + scoreBonus + confidenceBonus);
    }

    /**
     * Calculate entry window (how many ticks until opportunity expires)
     */
    private calculateEntryWindow(conditions: EntryConditions): number {
        // Longer streaks = shorter window (reversal imminent)
        if (conditions.streakLength >= 10) return 2;
        if (conditions.streakLength >= 7) return 3;
        if (conditions.isAlternating) return 2;
        if (conditions.multipleSignalsAligned) return 3;

        return 5; // Default window
    }

    /**
     * Get default entry point for insufficient data
     */
    private getDefaultEntryPoint(): EntryPoint {
        return {
            score: 0,
            confidence: 30,
            type: 'WAIT',
            reason: 'Insufficient data - need at least 5 ticks',
            riskRewardRatio: 1.0,
            expectedProfit: 50,
            entryWindowTicks: 5,
            conditions: {
                streakLength: 0,
                distributionImbalance: 0,
                isAlternating: false,
                isFibonacci: false,
                multipleSignalsAligned: false,
                volatility: 0,
            },
        };
    }
}

export const entryPointDetector = EntryPointDetectorService.getInstance();
