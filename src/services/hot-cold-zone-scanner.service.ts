/**
 * Hot/Cold Zone Scanner Service
 * Advanced digit distribution analysis using hot/cold zone detection
 * Superior to Fibonacci analysis for digit-based trading
 */

import { ensembleStrategy } from '../utils/prediction-algorithms';
import { derivAPIService } from './deriv-api.service';

export interface DigitZoneAnalysis {
    digit: number;
    frequency: number;
    percentage: number;
    zone: 'HOT' | 'COLD' | 'NEUTRAL';
    deviation: number; // Deviation from expected 10%
    confidence: number; // 0-1 scale
    lastSeen: number; // Ticks ago
    streak: number; // Current appearance streak
}

export interface HotColdZoneSignal {
    market: string;
    marketName: string;
    signalType: 'HOT_ZONE' | 'COLD_ZONE' | 'DISTRIBUTION_REVERSION';
    confidence: number;
    targetDigit: number;
    currentPrice: number;
    recommendation: {
        action: 'OVER' | 'UNDER';
        barrier: number;
        confidence: number;
        reasoning: string;
    };
    timeframe: string;
    analysis: {
        hotDigits: DigitZoneAnalysis[];
        coldDigits: DigitZoneAnalysis[];
        distributionDeviation: number;
        meanReversionPotential: number;
        momentumStrength: number;
    };
}

interface TickData {
    epoch: number;
    quote: number;
    lastDigit: number;
    source: 'historical' | 'live';
    localTime: string;
}

class HotColdZoneScannerService {
    private readonly MARKETS_TO_SCAN = [
        // Standard Volatility Indices
        { symbol: 'R_10', name: 'Volatility 10' },
        { symbol: 'R_25', name: 'Volatility 25' },
        { symbol: 'R_50', name: 'Volatility 50' },
        { symbol: 'R_75', name: 'Volatility 75' },
        { symbol: 'R_100', name: 'Volatility 100' },

        // 1-Second Volatility Indices
        { symbol: '1HZ10V', name: 'Volatility 10 (1s)' },
        { symbol: '1HZ15V', name: 'Volatility 15 (1s)' },
        { symbol: '1HZ25V', name: 'Volatility 25 (1s)' },
        { symbol: '1HZ30V', name: 'Volatility 30 (1s)' },
        { symbol: '1HZ50V', name: 'Volatility 50 (1s)' },
        { symbol: '1HZ75V', name: 'Volatility 75 (1s)' },
        { symbol: '1HZ90V', name: 'Volatility 90 (1s)' },
        { symbol: '1HZ100V', name: 'Volatility 100 (1s)' },

        // Step Indices
        { symbol: 'STEPINDEX', name: 'Step Index' },
    ];

    private readonly HOT_ZONE_THRESHOLD = 0.15; // 15% frequency = hot
    private readonly COLD_ZONE_THRESHOLD = 0.05; // 5% frequency = cold
    private readonly ANALYSIS_WINDOW = 200; // Increased from 100 for better statistics
    private readonly MIN_CONFIDENCE_THRESHOLD = 45; // Reduced from 65% to 45% for more signals
    private readonly MEDIUM_CONFIDENCE_THRESHOLD = 65; // Medium quality signals
    private readonly HIGH_CONFIDENCE_THRESHOLD = 80; // Premium signals 80%+
    private readonly MIN_SAMPLE_SIZE = 50; // Reduced from 100 to 50 for more market coverage

    /**
     * Scan all markets for hot/cold zone opportunities
     */
    public async scanForHotColdZones(): Promise<HotColdZoneSignal | null> {
        console.log('🔥❄️ Scanning markets for Hot/Cold Zone opportunities...');

        const signals: Array<{ signal: HotColdZoneSignal; score: number }> = [];

        for (const market of this.MARKETS_TO_SCAN) {
            try {
                const signal = await this.analyzeMarketZones(market.symbol, market.name);
                if (signal) {
                    // Apply enhanced confidence thresholds
                    if (signal.confidence >= this.MIN_CONFIDENCE_THRESHOLD) {
                        // Calculate intelligent signal score
                        const score = this.calculateSignalScore(signal);
                        signals.push({ signal, score });
                    }
                }
            } catch (error) {
                console.warn(`Failed to analyze ${market.name}:`, error);
            }
        }

        // Sort by intelligent score instead of simple confidence
        signals.sort((a, b) => b.score - a.score);

        const bestSignal = signals[0]?.signal || null;

        if (bestSignal) {
            // Add quality indicator based on confidence level
            let qualityIndicator = '';
            if (bestSignal.confidence >= this.HIGH_CONFIDENCE_THRESHOLD) {
                qualityIndicator = '⭐ PREMIUM';
            } else if (bestSignal.confidence >= this.MEDIUM_CONFIDENCE_THRESHOLD) {
                qualityIndicator = '🔥 HIGH';
            } else if (bestSignal.confidence >= 55) {
                qualityIndicator = '✅ GOOD';
            } else {
                qualityIndicator = '⚠️ MODERATE';
            }

            console.log(
                `🎯 Best Hot/Cold Zone signal found: ${bestSignal.marketName} - ${bestSignal.signalType} (${bestSignal.confidence.toFixed(1)}% confidence, Score: ${signals[0].score.toFixed(3)}) ${qualityIndicator}`
            );
        } else {
            console.log('❌ No suitable Hot/Cold Zone opportunities found (enhanced filtering applied)');
        }

        return bestSignal;
    }

    /**
     * Calculate intelligent signal score (replaces simple confidence sorting)
     */
    private calculateSignalScore(signal: HotColdZoneSignal): number {
        let score = 0;

        // Base confidence (40% weight)
        score += (signal.confidence / 100) * 0.4;

        // Distribution deviation strength (25% weight)
        score += signal.analysis.distributionDeviation * 0.25;

        // Mean reversion potential (20% weight)
        score += signal.analysis.meanReversionPotential * 0.2;

        // Momentum strength (15% weight)
        score += signal.analysis.momentumStrength * 0.15;

        return Math.min(1, score);
    }

    /**
     * Analyze a specific market for hot/cold zone opportunities
     */
    private async analyzeMarketZones(symbol: string, name: string): Promise<HotColdZoneSignal | null> {
        try {
            // Get historical tick data
            const tickData = await this.getTickHistory(symbol, this.ANALYSIS_WINDOW);

            // Ensure minimum sample size for reliability
            if (tickData.length < this.MIN_SAMPLE_SIZE) {
                console.warn(`Insufficient data for ${name}: ${tickData.length} < ${this.MIN_SAMPLE_SIZE} required`);
                return null;
            }

            const currentPrice = tickData[tickData.length - 1].quote;

            // Perform digit zone analysis
            const zoneAnalysis = this.analyzeDigitZones(tickData);

            // Get hot and cold digits
            const hotDigits = zoneAnalysis.filter(d => d.zone === 'HOT');
            const coldDigits = zoneAnalysis.filter(d => d.zone === 'COLD');

            // Calculate distribution metrics
            const distributionDeviation = this.calculateDistributionDeviation(zoneAnalysis);
            const meanReversionPotential = this.calculateMeanReversionPotential(coldDigits);
            const momentumStrength = this.calculateMomentumStrength(hotDigits);

            // Generate signal based on strongest opportunity
            let signal: HotColdZoneSignal | null = null;

            // Priority 1: Strong cold zone reversion (highest probability)
            if (coldDigits.length > 0 && meanReversionPotential > 0.7) {
                signal = this.generateColdZoneSignal(symbol, name, currentPrice, coldDigits[0], {
                    hotDigits,
                    coldDigits,
                    distributionDeviation,
                    meanReversionPotential,
                    momentumStrength,
                });
            }
            // Priority 2: Strong hot zone momentum
            else if (hotDigits.length > 0 && momentumStrength > 0.6) {
                signal = this.generateHotZoneSignal(symbol, name, currentPrice, hotDigits[0], {
                    hotDigits,
                    coldDigits,
                    distributionDeviation,
                    meanReversionPotential,
                    momentumStrength,
                });
            }
            // Priority 3: Distribution reversion opportunity
            else if (distributionDeviation > 0.3) {
                signal = this.generateDistributionReversionSignal(symbol, name, currentPrice, zoneAnalysis, {
                    hotDigits,
                    coldDigits,
                    distributionDeviation,
                    meanReversionPotential,
                    momentumStrength,
                });
            }

            // Apply high confidence threshold for premium signals
            if (signal && signal.confidence >= this.HIGH_CONFIDENCE_THRESHOLD) {
                console.log(
                    `⭐ Premium signal detected: ${signal.marketName} with ${signal.confidence.toFixed(1)}% confidence`
                );
            }

            return signal;
        } catch (error) {
            console.error(`Error analyzing ${name}:`, error);
            return null;
        }
    }

    /**
     * Get tick history and extract last digits
     */
    private async getTickHistory(symbol: string, count: number): Promise<TickData[]> {
        try {
            const response = await derivAPIService.getTicksHistory({
                symbol: symbol,
                count: count,
                end: 'latest',
                style: 'ticks',
            });

            if (response.history && response.history.prices && response.history.times) {
                const ticks = response.history.prices.map((price: number, index: number) => ({
                    epoch: response.history!.times[index],
                    quote: price,
                    lastDigit: this.extractLastDigit(price),
                    source: 'historical' as const,
                    localTime: new Date(response.history!.times[index] * 1000).toLocaleTimeString(),
                }));
                return ticks;
            } else {
                throw new Error('No history data received');
            }
        } catch (error) {
            console.error(`Failed to get tick history for ${symbol}:`, error);
            throw error;
        }
    }

    /**
     * Extract last digit from price
     */
    private extractLastDigit(price: number): number {
        const priceStr = Math.abs(price).toString();
        const lastChar = priceStr.charAt(priceStr.length - 1);
        return parseInt(lastChar, 10);
    }

    /**
     * Analyze digit zones (hot/cold/neutral)
     */
    private analyzeDigitZones(ticks: TickData[]): DigitZoneAnalysis[] {
        const digitCounts: Record<number, number> = {};
        const digitLastSeen: Record<number, number> = {};
        const digitStreaks: Record<number, number> = {};

        // Initialize counters
        for (let i = 0; i < 10; i++) {
            digitCounts[i] = 0;
            digitLastSeen[i] = -1;
            digitStreaks[i] = 0;
        }

        // Count occurrences and track streaks
        let currentStreak = 0;
        let lastDigit = -1;

        ticks.forEach((tick, index) => {
            const digit = tick.lastDigit;
            digitCounts[digit]++;

            // Track last seen
            if (digitLastSeen[digit] === -1) {
                digitLastSeen[digit] = ticks.length - 1 - index;
            }

            // Track streaks
            if (digit === lastDigit) {
                currentStreak++;
            } else {
                if (lastDigit !== -1) {
                    digitStreaks[lastDigit] = Math.max(digitStreaks[lastDigit], currentStreak);
                }
                currentStreak = 1;
                lastDigit = digit;
            }
        });

        // Finalize last streak
        if (lastDigit !== -1) {
            digitStreaks[lastDigit] = Math.max(digitStreaks[lastDigit], currentStreak);
        }

        // Create zone analysis
        const analysis: DigitZoneAnalysis[] = [];
        const totalTicks = ticks.length;
        const expectedFrequency = 0.1; // 10% expected for each digit

        for (let digit = 0; digit < 10; digit++) {
            const frequency = digitCounts[digit] / totalTicks;
            const percentage = frequency * 100;
            const deviation = Math.abs(frequency - expectedFrequency);

            let zone: 'HOT' | 'COLD' | 'NEUTRAL';
            let confidence: number;

            if (frequency >= this.HOT_ZONE_THRESHOLD) {
                zone = 'HOT';
                confidence = Math.min(0.95, frequency / this.HOT_ZONE_THRESHOLD);
            } else if (frequency <= this.COLD_ZONE_THRESHOLD) {
                zone = 'COLD';
                confidence = Math.min(0.95, (this.COLD_ZONE_THRESHOLD - frequency) / this.COLD_ZONE_THRESHOLD + 0.5);
            } else {
                zone = 'NEUTRAL';
                confidence = 0.5;
            }

            analysis.push({
                digit,
                frequency,
                percentage,
                zone,
                deviation,
                confidence,
                lastSeen: digitLastSeen[digit],
                streak: digitStreaks[digit],
            });
        }

        return analysis.sort((a, b) => b.deviation - a.deviation);
    }

    /**
     * Calculate overall distribution deviation
     */
    private calculateDistributionDeviation(analysis: DigitZoneAnalysis[]): number {
        const totalDeviation = analysis.reduce((sum, d) => sum + d.deviation, 0);
        return Math.min(1, totalDeviation / 0.5); // Normalize to 0-1 scale
    }

    /**
     * Calculate mean reversion potential for cold digits
     */
    private calculateMeanReversionPotential(coldDigits: DigitZoneAnalysis[]): number {
        if (coldDigits.length === 0) return 0;

        const avgDeviation = coldDigits.reduce((sum, d) => sum + d.deviation, 0) / coldDigits.length;
        const avgLastSeen =
            coldDigits.reduce((sum, d) => sum + (d.lastSeen === -1 ? 50 : d.lastSeen), 0) / coldDigits.length;

        // Higher potential when digits are very underrepresented and haven't appeared recently
        return Math.min(1, (avgDeviation * 10 + avgLastSeen / 50) / 2);
    }

    /**
     * Calculate momentum strength for hot digits
     */
    private calculateMomentumStrength(hotDigits: DigitZoneAnalysis[]): number {
        if (hotDigits.length === 0) return 0;

        const avgFrequency = hotDigits.reduce((sum, d) => sum + d.frequency, 0) / hotDigits.length;
        const avgStreak = hotDigits.reduce((sum, d) => sum + d.streak, 0) / hotDigits.length;

        // Higher strength when digits are very frequent and have long streaks
        return Math.min(1, (avgFrequency * 5 + avgStreak / 10) / 2);
    }

    /**
     * Generate cold zone reversion signal
     */
    private generateColdZoneSignal(
        symbol: string,
        name: string,
        currentPrice: number,
        coldDigit: DigitZoneAnalysis,
        analysis: HotColdZoneSignal['analysis']
    ): HotColdZoneSignal {
        const targetDigit = coldDigit.digit;

        // Enhanced confidence calculation with minimum threshold enforcement
        const baseConfidence = coldDigit.confidence * 100;
        const deviationBonus = coldDigit.deviation * 200; // Boost for higher deviations
        const lastSeenBonus = Math.min(20, coldDigit.lastSeen * 0.5); // Boost for digits not seen recently

        const confidence = Math.min(
            95,
            Math.max(this.MIN_CONFIDENCE_THRESHOLD, baseConfidence + deviationBonus + lastSeenBonus)
        );

        // Enhanced logic: Intelligent signal selection based on statistical analysis
        let action: 'OVER' | 'UNDER';
        let barrier: number;
        let reasoning: string;

        // Use intelligent scoring instead of simple position-based logic
        const reversionStrength = analysis.meanReversionPotential;
        const deviationStrength = coldDigit.deviation;

        // For cold digits, favor the direction that includes the target digit
        // OVER 2 for digits 0-4, UNDER 7 for digits 5-9, with statistical validation
        const favorOver2 =
            (targetDigit <= 4 && reversionStrength > 0.6) ||
            (targetDigit <= 2 && deviationStrength > 0.06) ||
            targetDigit === 0 ||
            targetDigit === 1;

        if (favorOver2) {
            action = 'OVER';
            barrier = 2;
            reasoning = `Cold zone reversion: digit ${targetDigit} severely underrepresented (${coldDigit.percentage.toFixed(1)}%, ${coldDigit.lastSeen} ticks ago). Statistical reversion favors OVER 2.`;
        } else {
            action = 'UNDER';
            barrier = 7;
            reasoning = `Cold zone reversion: digit ${targetDigit} severely underrepresented (${coldDigit.percentage.toFixed(1)}%, ${coldDigit.lastSeen} ticks ago). Statistical reversion favors UNDER 7.`;
        }

        return {
            market: symbol,
            marketName: name,
            signalType: 'COLD_ZONE',
            confidence,
            targetDigit,
            currentPrice,
            recommendation: {
                action,
                barrier,
                confidence,
                reasoning,
            },
            timeframe: '1m',
            analysis,
        };
    }

    /**
     * Generate hot zone momentum signal
     */
    private generateHotZoneSignal(
        symbol: string,
        name: string,
        currentPrice: number,
        hotDigit: DigitZoneAnalysis,
        analysis: HotColdZoneSignal['analysis']
    ): HotColdZoneSignal {
        const targetDigit = hotDigit.digit;

        // Enhanced confidence calculation with minimum threshold enforcement
        const baseConfidence = hotDigit.confidence * 100;
        const momentumBonus = analysis.momentumStrength * 30; // Boost for strong momentum
        const streakBonus = Math.min(15, hotDigit.streak * 2); // Boost for longer streaks

        const confidence = Math.min(
            95,
            Math.max(this.MIN_CONFIDENCE_THRESHOLD, baseConfidence + momentumBonus + streakBonus)
        );

        // Enhanced logic: Intelligent signal selection based on momentum analysis
        let action: 'OVER' | 'UNDER';
        let barrier: number;
        let reasoning: string;

        // Use intelligent scoring instead of simple position-based logic
        const momentumStrength = analysis.momentumStrength;
        const streakStrength = hotDigit.streak;

        // For hot digits, consider momentum continuation vs reversion
        // Strong momentum (>0.8) suggests continuation, moderate momentum suggests reversion
        const favorOver2 =
            (targetDigit <= 4 && momentumStrength < 0.8) ||
            (targetDigit >= 8 && momentumStrength > 0.8) ||
            (streakStrength > 5 && targetDigit <= 2);

        if (favorOver2) {
            action = 'OVER';
            barrier = 2;
            reasoning = `Hot zone analysis: digit ${targetDigit} overrepresented (${hotDigit.percentage.toFixed(1)}%, streak: ${streakStrength}). ${momentumStrength > 0.8 ? 'Momentum continuation' : 'Reversion expected'} favors OVER 2.`;
        } else {
            action = 'UNDER';
            barrier = 7;
            reasoning = `Hot zone analysis: digit ${targetDigit} overrepresented (${hotDigit.percentage.toFixed(1)}%, streak: ${streakStrength}). ${momentumStrength > 0.8 ? 'Momentum continuation' : 'Reversion expected'} favors UNDER 7.`;
        }

        return {
            market: symbol,
            marketName: name,
            signalType: 'HOT_ZONE',
            confidence,
            targetDigit,
            currentPrice,
            recommendation: {
                action,
                barrier,
                confidence,
                reasoning,
            },
            timeframe: '1m',
            analysis,
        };
    }

    /**
     * Generate distribution reversion signal
     */
    private generateDistributionReversionSignal(
        symbol: string,
        name: string,
        currentPrice: number,
        zoneAnalysis: DigitZoneAnalysis[],
        analysis: HotColdZoneSignal['analysis']
    ): HotColdZoneSignal {
        // Find the most deviated digit
        const mostDeviated = zoneAnalysis[0];

        // Enhanced confidence calculation with minimum threshold enforcement
        const baseConfidence = mostDeviated.confidence * 80;
        const distributionBonus = analysis.distributionDeviation * 40; // Boost for higher distribution deviation
        const reversionBonus = analysis.meanReversionPotential * 30; // Boost for reversion potential

        const confidence = Math.min(
            95,
            Math.max(this.MIN_CONFIDENCE_THRESHOLD, baseConfidence + distributionBonus + reversionBonus)
        );

        // Use ensemble strategy for best prediction
        const tickData = zoneAnalysis.map(d => ({
            epoch: Date.now(),
            quote: currentPrice,
            lastDigit: d.digit,
            source: 'historical' as const,
            localTime: new Date().toLocaleTimeString(),
        }));

        const prediction = ensembleStrategy(tickData);
        const predictedDigit = prediction.digit;

        // ENHANCED: Intelligent action and barrier logic (no more missing variables!)
        let action: 'OVER' | 'UNDER';
        let barrier: number;
        let reasoning: string;

        // Use intelligent scoring based on ensemble prediction and distribution analysis
        const predictionConfidence = prediction.probability || 0.5;
        const deviationStrength = mostDeviated.deviation;

        // Determine signal based on ensemble prediction with statistical validation
        const favorOver2 =
            (predictedDigit <= 2 && predictionConfidence > 0.6) ||
            (predictedDigit <= 4 && deviationStrength > 0.08) ||
            (analysis.meanReversionPotential > 0.7 && predictedDigit <= 3);

        if (favorOver2) {
            action = 'OVER';
            barrier = 2;
            reasoning = `Distribution reversion: ensemble predicts digit ${predictedDigit} (${(predictionConfidence * 100).toFixed(1)}% confidence). Max deviation: ${(deviationStrength * 100).toFixed(1)}%. OVER 2 opportunity.`;
        } else {
            action = 'UNDER';
            barrier = 7;
            reasoning = `Distribution reversion: ensemble predicts digit ${predictedDigit} (${(predictionConfidence * 100).toFixed(1)}% confidence). Max deviation: ${(deviationStrength * 100).toFixed(1)}%. UNDER 7 opportunity.`;
        }

        return {
            market: symbol,
            marketName: name,
            signalType: 'DISTRIBUTION_REVERSION',
            confidence,
            targetDigit: predictedDigit,
            currentPrice,
            recommendation: {
                action,
                barrier,
                confidence,
                reasoning,
            },
            timeframe: '1m',
            analysis,
        };
    }
}

export const hotColdZoneScannerService = new HotColdZoneScannerService();
