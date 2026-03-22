/**
 * Signal Analysis Service
 * Analyzes real tick data to generate trading signals
 */

interface TickData {
    quote: number;
    epoch: number;
}

interface DigitAnalysis {
    digit: number;
    frequency: number;
    lastSeen: number;
    streak: number;
}

interface DigitPercentageAnalysis {
    digit: number;
    percentage: number;
    frequency: number;
    isHot: boolean;
    isCold: boolean;
}

interface SignalResult {
    type:
        | 'RISE'
        | 'FALL'
        | 'EVEN'
        | 'ODD'
        | 'OVER1'
        | 'OVER2'
        | 'OVER3'
        | 'OVER4'
        | 'OVER5'
        | 'UNDER1'
        | 'UNDER2'
        | 'UNDER3'
        | 'UNDER4'
        | 'UNDER5';
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    strategy: string;
    entryDigit?: number;
    digitPattern?: number[];
    reason: string;
    digitPercentages?: DigitPercentageAnalysis[];
    targetDigitsAnalysis?: {
        targetDigits: number[];
        combinedPercentage: number;
        individualPercentages: DigitPercentageAnalysis[];
        entryDigitPercentage?: number;
    };
}

export class SignalAnalysisService {
    private tickHistory: TickData[] = [];
    private readonly MAX_HISTORY = 100;

    /**
     * Add new tick to history
     */
    addTick(tick: TickData): void {
        this.tickHistory.push(tick);
        if (this.tickHistory.length > this.MAX_HISTORY) {
            this.tickHistory.shift();
        }
    }

    /**
     * Get last digit from price
     */
    private getLastDigit(price: number): number {
        return Math.floor(Math.abs(price * 100)) % 10;
    }

    /**
     * Analyze digit frequency
     */
    private analyzeDigitFrequency(count: number = 50): Map<number, DigitAnalysis> {
        const analysis = new Map<number, DigitAnalysis>();

        // Initialize
        for (let i = 0; i < 10; i++) {
            analysis.set(i, { digit: i, frequency: 0, lastSeen: -1, streak: 0 });
        }

        const recentTicks = this.tickHistory.slice(-count);
        let currentStreak = 0;
        let lastDigit = -1;

        recentTicks.forEach((tick, index) => {
            const digit = this.getLastDigit(tick.quote);
            const digitData = analysis.get(digit)!;

            digitData.frequency++;
            digitData.lastSeen = index;

            // Track streaks
            if (digit === lastDigit) {
                currentStreak++;
            } else {
                currentStreak = 1;
                lastDigit = digit;
            }
            digitData.streak = Math.max(digitData.streak, currentStreak);
        });

        // Normalize frequency
        analysis.forEach(data => {
            data.frequency = data.frequency / recentTicks.length;
        });

        return analysis;
    }

    /**
     * Get detailed digit percentage analysis
     */
    private getDigitPercentageAnalysis(count: number = 50): DigitPercentageAnalysis[] {
        const analysis = this.analyzeDigitFrequency(count);
        const hotDigits = this.getHotDigits(0.15);
        const coldDigits = this.getColdDigits(0.05);

        return Array.from(analysis.values()).map(data => ({
            digit: data.digit,
            percentage: Math.round(data.frequency * 100 * 10) / 10, // Round to 1 decimal
            frequency: Math.round(data.frequency * count),
            isHot: hotDigits.includes(data.digit),
            isCold: coldDigits.includes(data.digit),
        }));
    }

    /**
     * Analyze target digits for OVER/UNDER signals
     */
    private analyzeTargetDigits(
        signalType: string,
        entryDigit?: number
    ): {
        targetDigits: number[];
        combinedPercentage: number;
        individualPercentages: DigitPercentageAnalysis[];
        entryDigitPercentage?: number;
    } {
        const digitAnalysis = this.getDigitPercentageAnalysis();
        let targetDigits: number[] = [];

        // Determine target digits based on signal type
        if (signalType.startsWith('OVER')) {
            const threshold = parseInt(signalType.replace(/[^0-9]/g, ''));
            targetDigits = Array.from({ length: 9 - threshold }, (_, i) => threshold + 1 + i);
        } else if (signalType.startsWith('UNDER')) {
            const threshold = parseInt(signalType.replace(/[^0-9]/g, ''));
            targetDigits = Array.from({ length: threshold }, (_, i) => i);
        }

        // Get individual percentages for target digits
        const individualPercentages = digitAnalysis.filter(d => targetDigits.includes(d.digit));

        // Calculate combined percentage
        const combinedPercentage = individualPercentages.reduce((sum, d) => sum + d.percentage, 0);

        // Get entry digit percentage if available
        const entryDigitPercentage =
            entryDigit !== undefined ? digitAnalysis.find(d => d.digit === entryDigit)?.percentage : undefined;

        return {
            targetDigits,
            combinedPercentage: Math.round(combinedPercentage * 10) / 10,
            individualPercentages,
            entryDigitPercentage,
        };
    }

    /**
     * Detect hot digits (appearing frequently)
     */
    private getHotDigits(threshold: number = 0.15): number[] {
        const analysis = this.analyzeDigitFrequency();
        return Array.from(analysis.values())
            .filter(d => d.frequency > threshold)
            .sort((a, b) => b.frequency - a.frequency)
            .map(d => d.digit);
    }

    /**
     * Detect cold digits (appearing rarely)
     */
    private getColdDigits(threshold: number = 0.05): number[] {
        const analysis = this.analyzeDigitFrequency();
        return Array.from(analysis.values())
            .filter(d => d.frequency < threshold)
            .map(d => d.digit);
    }

    /**
     * Analyze price trend
     */
    private analyzeTrend(count: number = 20): 'UP' | 'DOWN' | 'SIDEWAYS' {
        if (this.tickHistory.length < count) return 'SIDEWAYS';

        const recentTicks = this.tickHistory.slice(-count);
        const prices = recentTicks.map(t => t.quote);

        let upMoves = 0;
        let downMoves = 0;

        for (let i = 1; i < prices.length; i++) {
            if (prices[i] > prices[i - 1]) upMoves++;
            else if (prices[i] < prices[i - 1]) downMoves++;
        }

        const totalMoves = upMoves + downMoves;
        const upRatio = totalMoves > 0 ? upMoves / totalMoves : 0.5;

        if (upRatio > 0.6) return 'UP';
        if (upRatio < 0.4) return 'DOWN';
        return 'SIDEWAYS';
    }

    /**
     * Detect digit patterns
     */
    private detectPattern(length: number = 5): number[] {
        if (this.tickHistory.length < length) return [];

        const recentDigits = this.tickHistory.slice(-length).map(t => this.getLastDigit(t.quote));

        return recentDigits;
    }

    /**
     * Analyze even/odd distribution
     */
    private analyzeEvenOdd(count: number = 30): { even: number; odd: number } {
        const recentTicks = this.tickHistory.slice(-count);
        let even = 0;
        let odd = 0;

        recentTicks.forEach(tick => {
            const digit = this.getLastDigit(tick.quote);
            if (digit % 2 === 0) even++;
            else odd++;
        });

        return {
            even: even / recentTicks.length,
            odd: odd / recentTicks.length,
        };
    }

    /**
     * Analyze over/under distribution
     */
    private analyzeOverUnder(threshold: number, count: number = 30): { over: number; under: number } {
        const recentTicks = this.tickHistory.slice(-count);
        let over = 0;
        let under = 0;

        recentTicks.forEach(tick => {
            const digit = this.getLastDigit(tick.quote);
            if (digit > threshold) over++;
            else if (digit < threshold) under++;
        });

        return {
            over: over / recentTicks.length,
            under: under / recentTicks.length,
        };
    }

    /**
     * Generate RISE/FALL signal
     */
    private generateTrendSignal(): SignalResult | null {
        const trend = this.analyzeTrend(20);
        const recentTrend = this.analyzeTrend(10);

        if (trend === 'UP' && recentTrend === 'UP') {
            return {
                type: 'RISE',
                confidence: 'HIGH',
                strategy: 'Trend Following',
                reason: 'Strong upward trend detected',
            };
        }

        if (trend === 'DOWN' && recentTrend === 'DOWN') {
            return {
                type: 'FALL',
                confidence: 'HIGH',
                strategy: 'Trend Following',
                reason: 'Strong downward trend detected',
            };
        }

        if (trend === 'UP' && recentTrend === 'SIDEWAYS') {
            return {
                type: 'RISE',
                confidence: 'MEDIUM',
                strategy: 'Trend Following',
                reason: 'Upward trend with consolidation',
            };
        }

        if (trend === 'DOWN' && recentTrend === 'SIDEWAYS') {
            return {
                type: 'FALL',
                confidence: 'MEDIUM',
                strategy: 'Trend Following',
                reason: 'Downward trend with consolidation',
            };
        }

        return null;
    }

    /**
     * Generate EVEN/ODD signal
     */
    private generateEvenOddSignal(): SignalResult | null {
        const distribution = this.analyzeEvenOdd(30);
        const recentDistribution = this.analyzeEvenOdd(10);
        const pattern = this.detectPattern(5);

        // Strong even bias
        if (distribution.even > 0.65 && recentDistribution.even > 0.7) {
            return {
                type: 'EVEN',
                confidence: 'HIGH',
                strategy: 'Pattern Recognition',
                digitPattern: pattern,
                reason: `Even digits appearing ${(distribution.even * 100).toFixed(0)}% of the time`,
            };
        }

        // Strong odd bias
        if (distribution.odd > 0.65 && recentDistribution.odd > 0.7) {
            return {
                type: 'ODD',
                confidence: 'HIGH',
                strategy: 'Pattern Recognition',
                digitPattern: pattern,
                reason: `Odd digits appearing ${(distribution.odd * 100).toFixed(0)}% of the time`,
            };
        }

        // Medium even bias
        if (distribution.even > 0.6) {
            return {
                type: 'EVEN',
                confidence: 'MEDIUM',
                strategy: 'Pattern Recognition',
                digitPattern: pattern,
                reason: `Even digits showing ${(distribution.even * 100).toFixed(0)}% frequency`,
            };
        }

        // Medium odd bias
        if (distribution.odd > 0.6) {
            return {
                type: 'ODD',
                confidence: 'MEDIUM',
                strategy: 'Pattern Recognition',
                digitPattern: pattern,
                reason: `Odd digits showing ${(distribution.odd * 100).toFixed(0)}% frequency`,
            };
        }

        return null;
    }

    /**
     * Generate OVER/UNDER signal with smart barrier selection
     * IMPORTANT: Entry digit (hot digit) must NEVER equal the barrier
     * - For OVER signals: entry digit must be > barrier (winning digits)
     * - For UNDER signals: entry digit must be < barrier (winning digits)
     */
    private generateOverUnderSignal(): SignalResult | null {
        const hotDigits = this.getHotDigits(0.15);
        const pattern = this.detectPattern(5);
        const digitPercentages = this.getDigitPercentageAnalysis();

        // Prioritize more balanced thresholds first (3, 4, 5), then 2, then 1
        const thresholds = [3, 4, 5, 2, 1];

        // Define minimum thresholds for each barrier to avoid too-easy signals
        const minThresholds = {
            1: { over: 0.85, under: 0.15 }, // OVER1 needs 85%+ (very rare), UNDER1 needs 15%+ (very rare)
            2: { over: 0.75, under: 0.25 }, // OVER2 needs 75%+, UNDER2 needs 25%+
            3: { over: 0.65, under: 0.35 }, // OVER3 needs 65%+, UNDER3 needs 35%+
            4: { over: 0.55, under: 0.45 }, // OVER4 needs 55%+, UNDER4 needs 45%+
            5: { over: 0.45, under: 0.55 }, // OVER5 needs 45%+, UNDER5 needs 55%+
        };

        for (const threshold of thresholds) {
            const analysis = this.analyzeOverUnder(threshold, 30);
            const minReq = minThresholds[threshold as keyof typeof minThresholds];

            // Check OVER signals (digits > threshold)
            // Entry digit MUST be strictly greater than threshold
            if (analysis.over >= minReq.over) {
                const validHotDigits = hotDigits.filter(d => d > threshold);
                if (validHotDigits.length > 0) {
                    // Use the hottest digit that is strictly greater than threshold
                    const entryDigit = validHotDigits[0];
                    const signalType = `OVER${threshold}` as SignalResult['type'];
                    const targetAnalysis = this.analyzeTargetDigits(signalType, entryDigit);

                    console.log(
                        `✅ Valid OVER${threshold} signal: Hot digit ${entryDigit} > barrier ${threshold} (${(analysis.over * 100).toFixed(1)}%)`
                    );

                    return {
                        type: signalType,
                        confidence: analysis.over > minReq.over + 0.1 ? 'HIGH' : 'MEDIUM',
                        strategy: 'Hot Digits',
                        entryDigit: entryDigit,
                        digitPattern: pattern,
                        reason: `Digits ${threshold + 1}-9 appearing ${(analysis.over * 100).toFixed(0)}% of the time, hot digit ${entryDigit} detected`,
                        digitPercentages,
                        targetDigitsAnalysis: targetAnalysis,
                    };
                } else {
                    console.log(
                        `❌ Rejected OVER${threshold}: No hot digits > ${threshold} (hot digits: ${hotDigits.join(', ')})`
                    );
                }
            }

            // Check UNDER signals (digits < threshold)
            // Entry digit MUST be strictly less than threshold
            if (analysis.under >= minReq.under) {
                const validHotDigits = hotDigits.filter(d => d < threshold);
                if (validHotDigits.length > 0) {
                    // Use the hottest digit that is strictly less than threshold
                    const entryDigit = validHotDigits[0];
                    const signalType = `UNDER${threshold}` as SignalResult['type'];
                    const targetAnalysis = this.analyzeTargetDigits(signalType, entryDigit);

                    console.log(
                        `✅ Valid UNDER${threshold} signal: Hot digit ${entryDigit} < barrier ${threshold} (${(analysis.under * 100).toFixed(1)}%)`
                    );

                    return {
                        type: signalType,
                        confidence: analysis.under > minReq.under + 0.1 ? 'HIGH' : 'MEDIUM',
                        strategy: 'Hot Digits',
                        entryDigit: entryDigit,
                        digitPattern: pattern,
                        reason: `Digits 0-${threshold - 1} appearing ${(analysis.under * 100).toFixed(0)}% of the time, hot digit ${entryDigit} detected`,
                        digitPercentages,
                        targetDigitsAnalysis: targetAnalysis,
                    };
                } else {
                    console.log(
                        `❌ Rejected UNDER${threshold}: No hot digits < ${threshold} (hot digits: ${hotDigits.join(', ')})`
                    );
                }
            }
        }

        // If no valid signals with hot digits, generate range-based signals WITHOUT entry digit
        // These are probability-based signals without a specific hot digit target
        for (const threshold of thresholds) {
            const analysis = this.analyzeOverUnder(threshold, 30);
            const minReq = minThresholds[threshold as keyof typeof minThresholds];

            // Reduce requirements by 5% for range-based signals
            const rangeOverThreshold = Math.max(0.6, minReq.over - 0.05);
            const rangeUnderThreshold = Math.max(0.4, minReq.under - 0.05);

            if (analysis.over >= rangeOverThreshold) {
                const signalType = `OVER${threshold}` as SignalResult['type'];
                const targetAnalysis = this.analyzeTargetDigits(signalType);

                console.log(
                    `📊 Range-based OVER${threshold} signal (${(analysis.over * 100).toFixed(1)}%) - NO entry digit`
                );

                return {
                    type: signalType,
                    confidence: analysis.over > rangeOverThreshold + 0.1 ? 'HIGH' : 'MEDIUM',
                    strategy: 'Range Analysis',
                    // NO entryDigit for range-based signals - this is intentional
                    digitPattern: pattern,
                    reason: `Digits ${threshold + 1}-9 appearing ${(analysis.over * 100).toFixed(0)}% of the time`,
                    digitPercentages,
                    targetDigitsAnalysis: targetAnalysis,
                };
            }

            if (analysis.under >= rangeUnderThreshold) {
                const signalType = `UNDER${threshold}` as SignalResult['type'];
                const targetAnalysis = this.analyzeTargetDigits(signalType);

                console.log(
                    `📊 Range-based UNDER${threshold} signal (${(analysis.under * 100).toFixed(1)}%) - NO entry digit`
                );

                return {
                    type: signalType,
                    confidence: analysis.under > rangeUnderThreshold + 0.1 ? 'HIGH' : 'MEDIUM',
                    strategy: 'Range Analysis',
                    // NO entryDigit for range-based signals - this is intentional
                    digitPattern: pattern,
                    reason: `Digits 0-${threshold - 1} appearing ${(analysis.under * 100).toFixed(0)}% of the time`,
                    digitPercentages,
                    targetDigitsAnalysis: targetAnalysis,
                };
            }
        }

        console.log('❌ No valid OVER/UNDER signals found with current criteria');
        return null;
    }

    /**
     * Generate signal based on analysis
     */
    generateSignal(): SignalResult | null {
        if (this.tickHistory.length < 30) {
            return null; // Not enough data
        }

        // Try different signal types
        const signals: (SignalResult | null)[] = [
            this.generateTrendSignal(),
            this.generateEvenOddSignal(),
            this.generateOverUnderSignal(),
        ];

        // Filter out null signals and prioritize HIGH confidence
        const validSignals = signals.filter(s => s !== null) as SignalResult[];

        if (validSignals.length === 0) return null;

        // Prioritize HIGH confidence signals
        const highConfidence = validSignals.filter(s => s.confidence === 'HIGH');
        if (highConfidence.length > 0) {
            return highConfidence[Math.floor(Math.random() * highConfidence.length)];
        }

        // Return any valid signal
        return validSignals[Math.floor(Math.random() * validSignals.length)];
    }

    /**
     * Get recent ticks for analysis
     */
    getRecentTicks(count: number = 100): TickData[] {
        return this.tickHistory.slice(-count);
    }

    /**
     * Get current tick statistics
     */
    getStatistics() {
        const hotDigits = this.getHotDigits();
        const coldDigits = this.getColdDigits();
        const trend = this.analyzeTrend();
        const evenOdd = this.analyzeEvenOdd();
        const pattern = this.detectPattern();

        return {
            hotDigits,
            coldDigits,
            trend,
            evenOdd,
            pattern,
            tickCount: this.tickHistory.length,
        };
    }

    /**
     * Clear history
     */
    clearHistory(): void {
        this.tickHistory = [];
    }
}

export const signalAnalysisService = new SignalAnalysisService();
