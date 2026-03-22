/**
 * Advanced Pattern Analysis Engine
 * Detects streaks, alternating patterns, and provides trading insights
 */

export interface PatternAnalysis {
    streakCount: number;
    streakType: string;
    isAlternating: boolean;
    alternatingLength: number;
    hasDoubleStreak: boolean;
    hasTripleStreak: boolean;
    winProbability: number;
    suggestedAction: 'ENTER_NOW' | 'WAIT' | 'HIGH_RISK' | 'EXTREME_CAUTION';
    actionReason: string;
    distribution: {
        primary: number;
        secondary: number;
    };
    fibonacciSignal: boolean;
    confidenceLevel: 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export class PatternAnalyzer {
    /**
     * Analyze pattern and provide comprehensive insights
     */
    static analyzePattern(
        pattern: ('EVEN' | 'ODD' | 'RISE' | 'FALL' | 'OVER' | 'UNDER')[],
        type: 'evenodd' | 'risefall' | 'overunder'
    ): PatternAnalysis {
        if (pattern.length < 3) {
            return this.getDefaultAnalysis();
        }

        // Detect current streak
        const { streakCount, streakType } = this.detectStreak(pattern);

        // Detect alternating pattern
        const { isAlternating, alternatingLength } = this.detectAlternating(pattern);

        // Detect double/triple streaks
        const hasDoubleStreak = this.hasDoubleStreak(pattern);
        const hasTripleStreak = this.hasTripleStreak(pattern);

        // Calculate distribution
        const distribution = this.calculateDistribution(pattern, type);

        // Fibonacci signal detection
        const fibonacciSignal = this.detectFibonacciPattern(streakCount);

        // Calculate win probability
        const winProbability = this.calculateWinProbability(streakCount, isAlternating, hasTripleStreak, distribution);

        // Determine suggested action
        const { suggestedAction, actionReason, confidenceLevel } = this.determineSuggestedAction(
            streakCount,
            isAlternating,
            hasTripleStreak,
            winProbability,
            fibonacciSignal
        );

        return {
            streakCount,
            streakType,
            isAlternating,
            alternatingLength,
            hasDoubleStreak,
            hasTripleStreak,
            winProbability,
            suggestedAction,
            actionReason,
            distribution,
            fibonacciSignal,
            confidenceLevel,
        };
    }

    /**
     * Detect current streak
     */
    private static detectStreak(pattern: string[]): { streakCount: number; streakType: string } {
        if (pattern.length === 0) return { streakCount: 0, streakType: '' };

        const lastValue = pattern[pattern.length - 1];
        let streakCount = 1;

        for (let i = pattern.length - 2; i >= 0; i--) {
            if (pattern[i] === lastValue) {
                streakCount++;
            } else {
                break;
            }
        }

        return { streakCount, streakType: lastValue };
    }

    /**
     * Detect alternating pattern (E-O-E-O or R-F-R-F)
     */
    private static detectAlternating(pattern: string[]): { isAlternating: boolean; alternatingLength: number } {
        if (pattern.length < 3) return { isAlternating: false, alternatingLength: 0 };

        let alternatingLength = 1;
        for (let i = pattern.length - 1; i >= 2; i--) {
            if (pattern[i] !== pattern[i - 1] && pattern[i] === pattern[i - 2]) {
                alternatingLength++;
            } else {
                break;
            }
        }

        return {
            isAlternating: alternatingLength >= 3,
            alternatingLength: alternatingLength >= 3 ? alternatingLength : 0,
        };
    }

    /**
     * Detect double streak pattern (e.g., EE-OO-EE-OO)
     */
    private static hasDoubleStreak(pattern: string[]): boolean {
        if (pattern.length < 8) return false;

        const recent = pattern.slice(-8);
        return (
            recent[0] === recent[1] &&
            recent[2] === recent[3] &&
            recent[4] === recent[5] &&
            recent[6] === recent[7] &&
            recent[0] !== recent[2] &&
            recent[2] !== recent[4] &&
            recent[4] !== recent[6]
        );
    }

    /**
     * Detect triple streak pattern (e.g., EEE-OOO-EEE)
     */
    private static hasTripleStreak(pattern: string[]): boolean {
        if (pattern.length < 9) return false;

        const recent = pattern.slice(-9);
        return (
            recent[0] === recent[1] &&
            recent[1] === recent[2] &&
            recent[3] === recent[4] &&
            recent[4] === recent[5] &&
            recent[6] === recent[7] &&
            recent[7] === recent[8] &&
            recent[0] !== recent[3] &&
            recent[3] !== recent[6]
        );
    }

    /**
     * Calculate distribution percentage
     */
    private static calculateDistribution(
        pattern: string[],
        type: 'evenodd' | 'risefall' | 'overunder'
    ): { primary: number; secondary: number } {
        const primaryValue = type === 'evenodd' ? 'EVEN' : type === 'risefall' ? 'RISE' : 'OVER';

        const primaryCount = pattern.filter(v => v === primaryValue).length;
        const total = pattern.length;

        const primaryPercent = (primaryCount / total) * 100;
        const secondaryPercent = 100 - primaryPercent;

        return {
            primary: Math.round(primaryPercent),
            secondary: Math.round(secondaryPercent),
        };
    }

    /**
     * Detect Fibonacci sequence in streak (3, 5, 8, 13)
     */
    private static detectFibonacciPattern(streakCount: number): boolean {
        const fibonacciNumbers = [3, 5, 8, 13, 21];
        return fibonacciNumbers.includes(streakCount);
    }

    /**
     * Calculate win probability based on pattern analysis
     */
    private static calculateWinProbability(
        streakCount: number,
        isAlternating: boolean,
        hasTripleStreak: boolean,
        distribution: { primary: number; secondary: number }
    ): number {
        let probability = 50; // Base probability

        // Streak-based probability
        if (streakCount >= 5) probability += 25;
        else if (streakCount >= 4) probability += 20;
        else if (streakCount >= 3) probability += 15;

        // Alternating pattern bonus
        if (isAlternating) probability += 15;

        // Triple streak bonus
        if (hasTripleStreak) probability += 10;

        // Distribution imbalance bonus
        const imbalance = Math.abs(distribution.primary - 50);
        if (imbalance >= 20) probability += 15;
        else if (imbalance >= 15) probability += 10;
        else if (imbalance >= 10) probability += 5;

        // Cap at 95%
        return Math.min(95, probability);
    }

    /**
     * Determine suggested action based on analysis
     */
    private static determineSuggestedAction(
        streakCount: number,
        isAlternating: boolean,
        hasTripleStreak: boolean,
        winProbability: number,
        fibonacciSignal: boolean
    ): {
        suggestedAction: 'ENTER_NOW' | 'WAIT' | 'HIGH_RISK' | 'EXTREME_CAUTION';
        actionReason: string;
        confidenceLevel: 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW';
    } {
        // ENTER NOW conditions
        if (winProbability >= 75) {
            let reason = '';
            if (streakCount >= 5 && fibonacciSignal) {
                reason = `Fibonacci streak of ${streakCount}! Reversal highly likely.`;
            } else if (hasTripleStreak) {
                reason = `Triple streak pattern detected. Strong reversal signal.`;
            } else if (isAlternating) {
                reason = `Alternating pattern confirmed. Next move predictable.`;
            } else {
                reason = `${streakCount} consecutive results. Reversal imminent.`;
            }
            return {
                suggestedAction: 'ENTER_NOW',
                actionReason: reason,
                confidenceLevel: 'VERY_HIGH',
            };
        }

        // HIGH RISK conditions
        if (winProbability >= 65) {
            return {
                suggestedAction: 'ENTER_NOW',
                actionReason: `Good probability (${winProbability}%). ${streakCount} streak detected.`,
                confidenceLevel: 'HIGH',
            };
        }

        // WAIT conditions
        if (winProbability >= 55) {
            return {
                suggestedAction: 'HIGH_RISK',
                actionReason: `Moderate signal. ${streakCount} streak but needs confirmation.`,
                confidenceLevel: 'MEDIUM',
            };
        }

        // EXTREME CAUTION
        if (streakCount <= 1) {
            return {
                suggestedAction: 'EXTREME_CAUTION',
                actionReason: 'No clear pattern. Market is random. Avoid trading.',
                confidenceLevel: 'LOW',
            };
        }

        return {
            suggestedAction: 'WAIT',
            actionReason: `Weak signal (${winProbability}%). Wait for stronger pattern.`,
            confidenceLevel: 'LOW',
        };
    }

    /**
     * Get default analysis for insufficient data
     */
    private static getDefaultAnalysis(): PatternAnalysis {
        return {
            streakCount: 0,
            streakType: '',
            isAlternating: false,
            alternatingLength: 0,
            hasDoubleStreak: false,
            hasTripleStreak: false,
            winProbability: 50,
            suggestedAction: 'WAIT',
            actionReason: 'Insufficient data. Collecting more ticks...',
            distribution: { primary: 50, secondary: 50 },
            fibonacciSignal: false,
            confidenceLevel: 'LOW',
        };
    }
}
