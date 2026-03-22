/**
 * AI-Powered Barrier Optimizer Service
 * Analyzes digit patterns and suggests optimal barriers for maximum profitability
 */

interface OptimalBarrier {
    type: 'OVER' | 'UNDER';
    barrier: number;
    expectedWinRate: number;
    profitScore: number;
    reason: string;
    targetDigits: number[];
    hotDigits: number[];
}

export class BarrierOptimizerService {
    private static instance: BarrierOptimizerService;

    private constructor() {}

    public static getInstance(): BarrierOptimizerService {
        if (!BarrierOptimizerService.instance) {
            BarrierOptimizerService.instance = new BarrierOptimizerService();
        }
        return BarrierOptimizerService.instance;
    }

    /**
     * Analyze digit frequencies and return optimal barriers
     */
    public analyzeOptimalBarriers(digitFrequencies: number[]): OptimalBarrier[] {
        const hotDigits = this.getHotDigits(digitFrequencies);
        const coldDigits = this.getColdDigits(digitFrequencies);

        console.log('🔥 Hot digits:', hotDigits);
        console.log('❄️ Cold digits:', coldDigits);

        const barriers: OptimalBarrier[] = [];

        // Analyze OVER barriers (1-5)
        for (let barrier = 1; barrier <= 5; barrier++) {
            const overAnalysis = this.analyzeOverBarrier(barrier, digitFrequencies, hotDigits, coldDigits);
            if (overAnalysis.expectedWinRate > 55) {
                // Only suggest if >55% win rate
                barriers.push(overAnalysis);
            }
        }

        // Analyze UNDER barriers (1-5)
        for (let barrier = 1; barrier <= 5; barrier++) {
            const underAnalysis = this.analyzeUnderBarrier(barrier, digitFrequencies, hotDigits, coldDigits);
            if (underAnalysis.expectedWinRate > 55) {
                // Only suggest if >55% win rate
                barriers.push(underAnalysis);
            }
        }

        // Sort by profit score (combination of win rate and payout)
        return barriers.sort((a, b) => b.profitScore - a.profitScore).slice(0, 3);
    }

    /**
     * Analyze OVER barrier profitability
     */
    private analyzeOverBarrier(
        barrier: number,
        frequencies: number[],
        hotDigits: number[],
        coldDigits: number[]
    ): OptimalBarrier {
        const targetDigits = Array.from({ length: 9 - barrier }, (_, i) => barrier + 1 + i);
        const combinedFrequency = targetDigits.reduce((sum, digit) => sum + frequencies[digit], 0);
        const hotDigitsInRange = hotDigits.filter(d => targetDigits.includes(d)).length;
        const coldDigitsInRange = coldDigits.filter(d => targetDigits.includes(d)).length;

        // Calculate win rate based on frequency and hot/cold analysis
        const baseWinRate = combinedFrequency * 100;

        // Boost for hot digits in range
        const hotBoost = hotDigitsInRange * 8; // +8% per hot digit

        // Penalty for cold digits in range
        const coldPenalty = coldDigitsInRange * 5; // -5% per cold digit

        const expectedWinRate = Math.min(85, Math.max(15, baseWinRate + hotBoost - coldPenalty));

        // Calculate profit score (win rate * payout multiplier)
        const payout = this.getPayoutMultiplier('OVER', barrier);
        const profitScore = expectedWinRate * payout;

        const reason = this.generateOverReason(
            barrier,
            targetDigits,
            hotDigitsInRange,
            coldDigitsInRange,
            combinedFrequency
        );

        return {
            type: 'OVER',
            barrier,
            expectedWinRate: Math.round(expectedWinRate * 10) / 10,
            profitScore: Math.round(profitScore * 10) / 10,
            reason,
            targetDigits,
            hotDigits: hotDigits.filter(d => targetDigits.includes(d)),
        };
    }

    /**
     * Analyze UNDER barrier profitability
     */
    private analyzeUnderBarrier(
        barrier: number,
        frequencies: number[],
        hotDigits: number[],
        coldDigits: number[]
    ): OptimalBarrier {
        const targetDigits = Array.from({ length: barrier }, (_, i) => i);
        const combinedFrequency = targetDigits.reduce((sum, digit) => sum + frequencies[digit], 0);
        const hotDigitsInRange = hotDigits.filter(d => targetDigits.includes(d)).length;
        const coldDigitsInRange = coldDigits.filter(d => targetDigits.includes(d)).length;

        // Calculate win rate
        const baseWinRate = combinedFrequency * 100;
        const hotBoost = hotDigitsInRange * 8;
        const coldPenalty = coldDigitsInRange * 5;
        const expectedWinRate = Math.min(85, Math.max(15, baseWinRate + hotBoost - coldPenalty));

        // Calculate profit score
        const payout = this.getPayoutMultiplier('UNDER', barrier);
        const profitScore = expectedWinRate * payout;

        const reason = this.generateUnderReason(
            barrier,
            targetDigits,
            hotDigitsInRange,
            coldDigitsInRange,
            combinedFrequency
        );

        return {
            type: 'UNDER',
            barrier,
            expectedWinRate: Math.round(expectedWinRate * 10) / 10,
            profitScore: Math.round(profitScore * 10) / 10,
            reason,
            targetDigits,
            hotDigits: hotDigits.filter(d => targetDigits.includes(d)),
        };
    }

    /**
     * Get hot digits (>12% frequency)
     */
    private getHotDigits(frequencies: number[]): number[] {
        return frequencies
            .map((freq, digit) => ({ digit, freq }))
            .filter(d => d.freq > 0.12)
            .sort((a, b) => b.freq - a.freq)
            .map(d => d.digit);
    }

    /**
     * Get cold digits (<7% frequency)
     */
    private getColdDigits(frequencies: number[]): number[] {
        return frequencies
            .map((freq, digit) => ({ digit, freq }))
            .filter(d => d.freq < 0.07)
            .map(d => d.digit);
    }

    /**
     * Get payout multiplier for different barriers
     */
    private getPayoutMultiplier(type: 'OVER' | 'UNDER', barrier: number): number {
        // Deriv payout multipliers (approximate)
        const payouts = {
            OVER: {
                1: 1.11, // 9 winning digits
                2: 1.25, // 7 winning digits
                3: 1.67, // 6 winning digits
                4: 2.0, // 5 winning digits
                5: 2.5, // 4 winning digits
            },
            UNDER: {
                1: 10.0, // 1 winning digit
                2: 5.0, // 2 winning digits
                3: 3.33, // 3 winning digits
                4: 2.5, // 4 winning digits
                5: 2.0, // 5 winning digits
            },
        };

        return payouts[type][barrier as keyof typeof payouts.OVER] || 1.0;
    }

    /**
     * Generate reason for OVER barrier recommendation
     */
    private generateOverReason(
        barrier: number,
        targetDigits: number[],
        hotCount: number,
        coldCount: number,
        frequency: number
    ): string {
        const freqPercent = Math.round(frequency * 100);

        if (hotCount >= 2) {
            return `🔥 EXCELLENT: ${hotCount} hot digits in range ${targetDigits.join(',')} (${freqPercent}% combined frequency)`;
        } else if (hotCount === 1 && coldCount === 0) {
            return `🟢 GOOD: 1 hot digit in range, no cold digits (${freqPercent}% frequency)`;
        } else if (freqPercent > 60) {
            return `📈 STRONG: High combined frequency ${freqPercent}% for digits ${targetDigits.join(',')}`;
        } else {
            return `🟡 MODERATE: ${freqPercent}% frequency, ${hotCount} hot digits in range`;
        }
    }

    /**
     * Generate reason for UNDER barrier recommendation
     */
    private generateUnderReason(
        barrier: number,
        targetDigits: number[],
        hotCount: number,
        coldCount: number,
        frequency: number
    ): string {
        const freqPercent = Math.round(frequency * 100);

        if (hotCount >= 2) {
            return `🔥 EXCELLENT: ${hotCount} hot digits in range ${targetDigits.join(',')} (${freqPercent}% combined frequency)`;
        } else if (hotCount === 1 && coldCount === 0) {
            return `🟢 GOOD: 1 hot digit in range, no cold digits (${freqPercent}% frequency)`;
        } else if (freqPercent > 40) {
            return `📈 STRONG: High combined frequency ${freqPercent}% for digits ${targetDigits.join(',')}`;
        } else {
            return `🟡 MODERATE: ${freqPercent}% frequency, ${hotCount} hot digits in range`;
        }
    }

    /**
     * Get the single best barrier recommendation
     */
    public getBestBarrier(digitFrequencies: number[]): OptimalBarrier | null {
        const barriers = this.analyzeOptimalBarriers(digitFrequencies);
        return barriers.length > 0 ? barriers[0] : null;
    }

    /**
     * Validate if a barrier is profitable
     */
    public isBarrierProfitable(type: 'OVER' | 'UNDER', barrier: number, digitFrequencies: number[]): boolean {
        const analysis =
            type === 'OVER'
                ? this.analyzeOverBarrier(
                      barrier,
                      digitFrequencies,
                      this.getHotDigits(digitFrequencies),
                      this.getColdDigits(digitFrequencies)
                  )
                : this.analyzeUnderBarrier(
                      barrier,
                      digitFrequencies,
                      this.getHotDigits(digitFrequencies),
                      this.getColdDigits(digitFrequencies)
                  );

        return analysis.expectedWinRate > 55 && analysis.profitScore > 100;
    }
}

export const barrierOptimizer = BarrierOptimizerService.getInstance();
