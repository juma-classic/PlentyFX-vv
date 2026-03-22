/**
 * EVEN/ODD Auto-Entry Suggestion System
 * Analyzes tick patterns and suggests optimal entry points
 */

export interface EntryAnalysis {
    suggestedEntry: 'EVEN' | 'ODD' | 'WAIT';
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    reason: string;
    indicators: {
        streakLength: number;
        streakType: 'EVEN' | 'ODD';
        evenPercentage: number;
        oddPercentage: number;
        imbalance: number;
        alternatingPattern: boolean;
        recommendation: string;
    };
    timing: 'ENTER_NOW' | 'WAIT_1_TICK' | 'WAIT_2_TICKS' | 'NO_CLEAR_SIGNAL';
}

export class EvenOddEntrySuggester {
    /**
     * Analyze ticks and suggest entry point
     */
    static analyzeEntry(ticks: number[]): EntryAnalysis {
        if (ticks.length < 10) {
            return this.createWaitSignal('Insufficient data - need at least 10 ticks');
        }

        const lastDigits = this.extractLastDigits(ticks);
        const streak = this.detectStreak(lastDigits);
        const distribution = this.analyzeDistribution(lastDigits);
        const pattern = this.detectPattern(lastDigits);

        // Strategy 1: Streak Reversal (after 3+ consecutive)
        if (streak.length >= 3) {
            return this.streakReversalStrategy(streak, distribution);
        }

        // Strategy 2: Imbalance Correction (when one side is dominant)
        if (Math.abs(distribution.imbalance) > 30) {
            return this.imbalanceStrategy(distribution, streak);
        }

        // Strategy 3: Alternating Pattern
        if (pattern.isAlternating && pattern.confidence > 0.7) {
            return this.alternatingStrategy(pattern, lastDigits);
        }

        // Strategy 4: Statistical Mean Reversion
        return this.meanReversionStrategy(distribution, streak);
    }

    /**
     * Extract last digit from each tick
     */
    private static extractLastDigits(ticks: number[]): number[] {
        return ticks.map(tick => Math.abs(Math.floor(tick * 100)) % 10);
    }

    /**
     * Detect current streak
     */
    private static detectStreak(digits: number[]): { type: 'EVEN' | 'ODD'; length: number } {
        if (digits.length === 0) return { type: 'EVEN', length: 0 };

        const lastDigit = digits[digits.length - 1];
        const streakType: 'EVEN' | 'ODD' = lastDigit % 2 === 0 ? 'EVEN' : 'ODD';
        let length = 1;

        for (let i = digits.length - 2; i >= 0; i--) {
            const currentType: 'EVEN' | 'ODD' = digits[i] % 2 === 0 ? 'EVEN' : 'ODD';
            if (currentType === streakType) {
                length++;
            } else {
                break;
            }
        }

        return { type: streakType, length };
    }

    /**
     * Analyze EVEN/ODD distribution
     */
    private static analyzeDistribution(digits: number[]) {
        const evenCount = digits.filter(d => d % 2 === 0).length;
        const oddCount = digits.length - evenCount;
        const evenPercentage = (evenCount / digits.length) * 100;
        const oddPercentage = (oddCount / digits.length) * 100;
        const imbalance = evenPercentage - oddPercentage;

        return {
            evenCount,
            oddCount,
            evenPercentage,
            oddPercentage,
            imbalance,
        };
    }

    /**
     * Detect alternating pattern
     */
    private static detectPattern(digits: number[]) {
        if (digits.length < 5) return { isAlternating: false, confidence: 0 };

        const last10 = digits.slice(-10);
        let alternations = 0;

        for (let i = 1; i < last10.length; i++) {
            const prevType = last10[i - 1] % 2;
            const currType = last10[i] % 2;
            if (prevType !== currType) {
                alternations++;
            }
        }

        const confidence = alternations / (last10.length - 1);
        return {
            isAlternating: confidence > 0.6,
            confidence,
        };
    }

    /**
     * Strategy 1: Streak Reversal
     * After 3+ consecutive EVEN/ODD, bet on the opposite
     */
    private static streakReversalStrategy(
        streak: { type: 'EVEN' | 'ODD'; length: number },
        distribution: ReturnType<typeof EvenOddEntrySuggester.analyzeDistribution>
    ): EntryAnalysis {
        const opposite: 'EVEN' | 'ODD' = streak.type === 'EVEN' ? 'ODD' : 'EVEN';
        const confidence: 'HIGH' | 'MEDIUM' | 'LOW' =
            streak.length >= 5 ? 'HIGH' : streak.length >= 4 ? 'MEDIUM' : 'LOW';

        return {
            suggestedEntry: opposite,
            confidence,
            reason: `${streak.length} consecutive ${streak.type} detected. Reversal likely.`,
            indicators: {
                streakLength: streak.length,
                streakType: streak.type,
                evenPercentage: distribution.evenPercentage,
                oddPercentage: distribution.oddPercentage,
                imbalance: distribution.imbalance,
                alternatingPattern: false,
                recommendation: `Bet ${opposite} - Streak reversal strategy`,
            },
            timing: streak.length >= 5 ? 'ENTER_NOW' : 'WAIT_1_TICK',
        };
    }

    /**
     * Strategy 2: Imbalance Correction
     * When one side is heavily dominant, bet on the underrepresented side
     */
    private static imbalanceStrategy(
        distribution: ReturnType<typeof EvenOddEntrySuggester.analyzeDistribution>,
        streak: { type: 'EVEN' | 'ODD'; length: number }
    ): EntryAnalysis {
        const suggestedEntry: 'EVEN' | 'ODD' = distribution.imbalance > 0 ? 'ODD' : 'EVEN';
        const imbalanceMagnitude = Math.abs(distribution.imbalance);
        const confidence: 'HIGH' | 'MEDIUM' | 'LOW' =
            imbalanceMagnitude > 40 ? 'HIGH' : imbalanceMagnitude > 30 ? 'MEDIUM' : 'LOW';

        return {
            suggestedEntry,
            confidence,
            reason: `${imbalanceMagnitude.toFixed(1)}% imbalance detected. ${suggestedEntry} is underrepresented.`,
            indicators: {
                streakLength: streak.length,
                streakType: streak.type,
                evenPercentage: distribution.evenPercentage,
                oddPercentage: distribution.oddPercentage,
                imbalance: distribution.imbalance,
                alternatingPattern: false,
                recommendation: `Bet ${suggestedEntry} - Mean reversion strategy`,
            },
            timing: imbalanceMagnitude > 40 ? 'ENTER_NOW' : 'WAIT_1_TICK',
        };
    }

    /**
     * Strategy 3: Alternating Pattern
     * When pattern alternates, follow the pattern
     */
    private static alternatingStrategy(
        pattern: { isAlternating: boolean; confidence: number },
        digits: number[]
    ): EntryAnalysis {
        const lastDigit = digits[digits.length - 1];
        const lastType: 'EVEN' | 'ODD' = lastDigit % 2 === 0 ? 'EVEN' : 'ODD';
        const suggestedEntry: 'EVEN' | 'ODD' = lastType === 'EVEN' ? 'ODD' : 'EVEN';
        const confidence: 'HIGH' | 'MEDIUM' | 'LOW' =
            pattern.confidence > 0.8 ? 'HIGH' : pattern.confidence > 0.7 ? 'MEDIUM' : 'LOW';

        const distribution = this.analyzeDistribution(digits);
        const streak = this.detectStreak(digits);

        return {
            suggestedEntry,
            confidence,
            reason: `Alternating pattern detected (${(pattern.confidence * 100).toFixed(0)}% confidence). Next should be ${suggestedEntry}.`,
            indicators: {
                streakLength: streak.length,
                streakType: streak.type,
                evenPercentage: distribution.evenPercentage,
                oddPercentage: distribution.oddPercentage,
                imbalance: distribution.imbalance,
                alternatingPattern: true,
                recommendation: `Bet ${suggestedEntry} - Pattern following strategy`,
            },
            timing: 'ENTER_NOW',
        };
    }

    /**
     * Strategy 4: Mean Reversion (default)
     */
    private static meanReversionStrategy(
        distribution: ReturnType<typeof EvenOddEntrySuggester.analyzeDistribution>,
        streak: { type: 'EVEN' | 'ODD'; length: number }
    ): EntryAnalysis {
        // If slight imbalance, bet on underrepresented side
        if (Math.abs(distribution.imbalance) > 15) {
            const suggestedEntry: 'EVEN' | 'ODD' = distribution.imbalance > 0 ? 'ODD' : 'EVEN';
            return {
                suggestedEntry,
                confidence: 'LOW',
                reason: `Slight ${suggestedEntry} deficit. Betting on mean reversion.`,
                indicators: {
                    streakLength: streak.length,
                    streakType: streak.type,
                    evenPercentage: distribution.evenPercentage,
                    oddPercentage: distribution.oddPercentage,
                    imbalance: distribution.imbalance,
                    alternatingPattern: false,
                    recommendation: `Consider ${suggestedEntry} - Weak signal`,
                },
                timing: 'WAIT_1_TICK',
            };
        }

        // No clear signal
        return this.createWaitSignal('No clear pattern detected. Wait for better opportunity.');
    }

    /**
     * Create a WAIT signal
     */
    private static createWaitSignal(reason: string): EntryAnalysis {
        return {
            suggestedEntry: 'WAIT',
            confidence: 'LOW',
            reason,
            indicators: {
                streakLength: 0,
                streakType: 'EVEN',
                evenPercentage: 50,
                oddPercentage: 50,
                imbalance: 0,
                alternatingPattern: false,
                recommendation: 'Wait for clearer signal',
            },
            timing: 'NO_CLEAR_SIGNAL',
        };
    }
}
