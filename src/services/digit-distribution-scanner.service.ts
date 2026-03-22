/**
 * Digit Distribution Deviation Scanner Service
 * Advanced statistical analysis using digit distribution deviation patterns
 * Focuses on mathematical probability corrections and statistical arbitrage
 */

import { ensembleStrategy } from '../utils/prediction-algorithms';
import { derivAPIService } from './deriv-api.service';
import { api_base } from '@/external/bot-skeleton/services/api/api-base';

export interface DigitDistributionAnalysis {
    digit: number;
    frequency: number;
    percentage: number;
    expectedPercentage: number; // Always 10% for uniform distribution
    deviation: number; // Absolute deviation from expected
    deviationScore: number; // Normalized deviation score (0-1)
    probabilityCorrection: number; // Expected correction probability
    lastSeen: number; // Ticks ago since last appearance
    streak: number; // Current appearance streak
    zScore: number; // Statistical z-score for deviation
}

export interface MarketState {
    volatility: 'LOW' | 'MEDIUM' | 'HIGH';
    trend: 'RANGING' | 'TRENDING_UP' | 'TRENDING_DOWN';
    momentum: 'WEAK' | 'MODERATE' | 'STRONG';
    digitDistribution: 'BALANCED' | 'SKEWED' | 'EXTREME';
    reliability: number; // 0-1 scale for market condition reliability
}

export interface MultiTimeframeAnalysis {
    short: DigitDistributionAnalysis[]; // 50 ticks
    medium: DigitDistributionAnalysis[]; // 100 ticks
    long: DigitDistributionAnalysis[]; // 200 ticks
    consensus: number; // Agreement score across timeframes (0-1)
}

export interface DigitDistributionSignal {
    market: string;
    marketName: string;
    signalType: 'DEVIATION_CORRECTION' | 'STATISTICAL_REVERSION' | 'PROBABILITY_ARBITRAGE';
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
        totalDeviation: number;
        maxDeviation: number;
        distributionBalance: number; // How balanced the distribution is (0-1)
        correctionPotential: number; // Potential for statistical correction
        probabilityEdge: number; // Mathematical edge percentage
        deviatedDigits: DigitDistributionAnalysis[];
        underrepresentedDigits: DigitDistributionAnalysis[];
        overrepresentedDigits: DigitDistributionAnalysis[];
    };
}

interface TickData {
    epoch: number;
    quote: number;
    lastDigit: number;
    source: 'historical' | 'live';
    localTime: string;
}

class DigitDistributionScannerService {
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

    private readonly ANALYSIS_WINDOW = 200; // Increased from 100 for better statistics
    private readonly EXPECTED_FREQUENCY = 0.1; // 10% expected for each digit
    private readonly MIN_DEVIATION_THRESHOLD = 0.04; // Increased from 3% to 4%
    private readonly HIGH_DEVIATION_THRESHOLD = 0.08; // Increased from 6% to 8%
    private readonly MIN_CONFIDENCE_THRESHOLD = 45; // Reduced from 65% to 45% for more signals
    private readonly MEDIUM_CONFIDENCE_THRESHOLD = 65; // Medium quality signals
    private readonly HIGH_CONFIDENCE_THRESHOLD = 80; // Premium signals 80%+
    private readonly MIN_Z_SCORE = 1.5; // Reduced from 1.96 to 1.5 for more flexibility
    private readonly MIN_SAMPLE_SIZE = 50; // Reduced from 100 to 50 for more market coverage

    /**
     * Analyze market state for filtering signals
     */
    private analyzeMarketState(ticks: TickData[]): MarketState {
        const prices = ticks.map(t => t.quote);
        const returns = prices.slice(1).map((price, i) => (price - prices[i]) / prices[i]);

        // Calculate volatility (standard deviation of returns)
        const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
        const volatility = Math.sqrt(variance);

        // Determine volatility level
        let volatilityLevel: 'LOW' | 'MEDIUM' | 'HIGH';
        if (volatility < 0.001) volatilityLevel = 'LOW';
        else if (volatility < 0.003) volatilityLevel = 'MEDIUM';
        else volatilityLevel = 'HIGH';

        // Calculate trend (linear regression slope)
        const n = prices.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = prices.reduce((sum, p) => sum + p, 0);
        const sumXY = prices.reduce((sum, p, i) => sum + i * p, 0);
        const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const trendStrength = Math.abs(slope) / (prices[0] || 1);

        // Determine trend
        let trend: 'RANGING' | 'TRENDING_UP' | 'TRENDING_DOWN';
        if (trendStrength < 0.0001) trend = 'RANGING';
        else if (slope > 0) trend = 'TRENDING_UP';
        else trend = 'TRENDING_DOWN';

        // Calculate momentum (recent vs older price changes)
        const recentReturns = returns.slice(-20);
        const olderReturns = returns.slice(0, 20);
        const recentMomentum = recentReturns.reduce((sum, r) => sum + Math.abs(r), 0) / recentReturns.length;
        const olderMomentum = olderReturns.reduce((sum, r) => sum + Math.abs(r), 0) / olderReturns.length;
        const momentumRatio = recentMomentum / (olderMomentum || 0.001);

        let momentum: 'WEAK' | 'MODERATE' | 'STRONG';
        if (momentumRatio < 0.8) momentum = 'WEAK';
        else if (momentumRatio < 1.5) momentum = 'MODERATE';
        else momentum = 'STRONG';

        // Analyze digit distribution balance
        const digitCounts: Record<number, number> = {};
        for (let i = 0; i < 10; i++) digitCounts[i] = 0;
        ticks.forEach(tick => digitCounts[tick.lastDigit]++);

        const frequencies = Object.values(digitCounts).map(count => count / ticks.length);
        const deviations = frequencies.map(freq => Math.abs(freq - 0.1));
        const avgDeviation = deviations.reduce((sum, dev) => sum + dev, 0) / deviations.length;

        let digitDistribution: 'BALANCED' | 'SKEWED' | 'EXTREME';
        if (avgDeviation < 0.02) digitDistribution = 'BALANCED';
        else if (avgDeviation < 0.05) digitDistribution = 'SKEWED';
        else digitDistribution = 'EXTREME';

        // Calculate overall reliability (prefer stable, ranging markets with balanced distributions)
        let reliability = 1.0;
        if (volatilityLevel === 'HIGH') reliability -= 0.3;
        if (trend !== 'RANGING') reliability -= 0.2;
        if (momentum === 'STRONG') reliability -= 0.2;
        if (digitDistribution === 'EXTREME') reliability -= 0.3;

        reliability = Math.max(0, reliability);

        return {
            volatility: volatilityLevel,
            trend,
            momentum,
            digitDistribution,
            reliability,
        };
    }

    /**
     * Perform multi-timeframe analysis
     */
    private async performMultiTimeframeAnalysis(symbol: string): Promise<MultiTimeframeAnalysis> {
        // Get data for different timeframes
        const shortTicks = await this.getTickHistory(symbol, 50);
        const mediumTicks = await this.getTickHistory(symbol, 100);
        const longTicks = await this.getTickHistory(symbol, 200);

        // Analyze each timeframe
        const shortAnalysis = this.analyzeDigitDistribution(shortTicks);
        const mediumAnalysis = this.analyzeDigitDistribution(mediumTicks);
        const longAnalysis = this.analyzeDigitDistribution(longTicks);

        // Calculate consensus (how much timeframes agree)
        let consensus = 0;
        let agreements = 0;
        let totalComparisons = 0;

        for (let digit = 0; digit < 10; digit++) {
            const shortDev = shortAnalysis[digit]?.deviation || 0;
            const mediumDev = mediumAnalysis[digit]?.deviation || 0;
            const longDev = longAnalysis[digit]?.deviation || 0;

            // Check if all timeframes agree on deviation direction
            const shortHigh = shortDev > this.MIN_DEVIATION_THRESHOLD;
            const mediumHigh = mediumDev > this.MIN_DEVIATION_THRESHOLD;
            const longHigh = longDev > this.MIN_DEVIATION_THRESHOLD;

            if (shortHigh === mediumHigh && mediumHigh === longHigh) {
                agreements++;
            }
            totalComparisons++;
        }

        consensus = totalComparisons > 0 ? agreements / totalComparisons : 0;

        return {
            short: shortAnalysis,
            medium: mediumAnalysis,
            long: longAnalysis,
            consensus,
        };
    }

    /**
     * Calculate intelligent signal score (replaces random selection)
     */
    private calculateSignalScore(
        signal: DigitDistributionSignal,
        marketState: MarketState,
        multiTimeframe: MultiTimeframeAnalysis
    ): number {
        let score = 0;

        // Base confidence (30% weight)
        score += (signal.confidence / 100) * 0.3;

        // Statistical significance (25% weight)
        const targetAnalysis = signal.analysis.deviatedDigits.find(d => d.digit === signal.targetDigit);
        if (targetAnalysis) {
            const zScoreNormalized = Math.min(1, Math.abs(targetAnalysis.zScore) / 3);
            score += zScoreNormalized * 0.25;
        }

        // Market condition match (20% weight)
        score += marketState.reliability * 0.2;

        // Cross-timeframe agreement (15% weight)
        score += multiTimeframe.consensus * 0.15;

        // Probability edge (10% weight)
        score += Math.min(1, signal.analysis.probabilityEdge / 0.1) * 0.1;

        return Math.min(1, score);
    }
    /**
     * Scan all markets for digit distribution deviation opportunities
     */
    public async scanForDistributionDeviations(): Promise<DigitDistributionSignal | null> {
        console.log('📊 [PATEL DISTRIBUTION] Scanning markets for Digit Distribution Deviation opportunities...');

        // Check if API is available
        if (!api_base.api || !api_base.api.connection || api_base.api.connection.readyState !== 1) {
            console.warn('⚠️ [PATEL DISTRIBUTION] Deriv API not connected - skipping scan');
            return null;
        }

        console.log('📊 [PATEL DISTRIBUTION] Markets to scan:', this.MARKETS_TO_SCAN.length);

        const signals: Array<{ signal: DigitDistributionSignal; score: number }> = [];

        for (const market of this.MARKETS_TO_SCAN) {
            try {
                console.log(`📊 [PATEL DISTRIBUTION] Analyzing ${market.name} (${market.symbol})...`);
                const signal = await this.analyzeMarketDistribution(market.symbol, market.name);
                if (signal) {
                    console.log(`✅ [PATEL DISTRIBUTION] Signal found for ${market.name}:`, {
                        type: signal.signalType,
                        confidence: signal.confidence.toFixed(1) + '%',
                        action: signal.recommendation.action,
                        barrier: signal.recommendation.barrier,
                    });
                    // Get additional data for enhanced analysis
                    const tickData = await this.getTickHistory(market.symbol, this.ANALYSIS_WINDOW);
                    const marketState = this.analyzeMarketState(tickData);
                    const multiTimeframe = await this.performMultiTimeframeAnalysis(market.symbol);

                    console.log(`📊 [PATEL DISTRIBUTION] Market state for ${market.name}:`, {
                        reliability: marketState.reliability.toFixed(2),
                        consensus: multiTimeframe.consensus.toFixed(2),
                        volatility: marketState.volatility,
                        trend: marketState.trend,
                    });

                    // Only proceed if market conditions are reasonable (relaxed from 0.4 to 0.2)
                    if (marketState.reliability >= 0.2 && multiTimeframe.consensus >= 0.4) {
                        const score = this.calculateSignalScore(signal, marketState, multiTimeframe);

                        // Apply enhanced confidence thresholds
                        if (signal.confidence >= this.MIN_CONFIDENCE_THRESHOLD) {
                            signals.push({ signal, score });
                            console.log(`✅ [PATEL DISTRIBUTION] Signal passed filters - Score: ${score.toFixed(3)}`);
                        } else {
                            console.log(
                                `⚠️ [PATEL DISTRIBUTION] Signal rejected - Confidence too low: ${signal.confidence.toFixed(1)}% < ${this.MIN_CONFIDENCE_THRESHOLD}%`
                            );
                        }
                    } else {
                        console.log(
                            `⚠️ [PATEL DISTRIBUTION] Signal rejected - Market conditions not suitable (reliability: ${marketState.reliability.toFixed(2)}, consensus: ${multiTimeframe.consensus.toFixed(2)})`
                        );
                    }
                } else {
                    console.log(`ℹ️ [PATEL DISTRIBUTION] No signal found for ${market.name}`);
                }
            } catch (error) {
                console.warn(`❌ [PATEL DISTRIBUTION] Failed to analyze ${market.name}:`, error);
            }
        }

        // Sort by intelligent score instead of simple confidence
        signals.sort((a, b) => b.score - a.score);

        console.log(`📊 [PATEL DISTRIBUTION] Scan complete - Found ${signals.length} valid signals`);

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
                `🎯 [PATEL DISTRIBUTION] Best signal selected: ${bestSignal.marketName} - ${bestSignal.signalType} (${bestSignal.confidence.toFixed(1)}% confidence, Score: ${signals[0].score.toFixed(3)}) ${qualityIndicator}`
            );
            console.log(
                `🎯 [PATEL DISTRIBUTION] Recommendation: ${bestSignal.recommendation.action} ${bestSignal.recommendation.barrier}`
            );
            console.log(`🎯 [PATEL DISTRIBUTION] Reasoning: ${bestSignal.recommendation.reasoning}`);
        } else {
            console.log(
                '❌ [PATEL DISTRIBUTION] No suitable Distribution Deviation opportunities found (enhanced filtering applied)'
            );
            console.log('ℹ️ [PATEL DISTRIBUTION] This is normal - the scanner has strict quality requirements');
        }

        return bestSignal;
    }

    /**
     * Analyze a specific market for distribution deviation opportunities
     */
    private async analyzeMarketDistribution(symbol: string, name: string): Promise<DigitDistributionSignal | null> {
        try {
            // Get historical tick data
            const tickData = await this.getTickHistory(symbol, this.ANALYSIS_WINDOW);

            console.log(`  📊 [${name}] Retrieved ${tickData.length} ticks (required: ${this.MIN_SAMPLE_SIZE})`);

            // Ensure minimum sample size for reliability
            if (tickData.length < this.MIN_SAMPLE_SIZE) {
                console.warn(`  ⚠️ [${name}] Insufficient data: ${tickData.length} < ${this.MIN_SAMPLE_SIZE} required`);
                return null;
            }

            const currentPrice = tickData[tickData.length - 1].quote;

            // Perform digit distribution analysis
            const distributionAnalysis = this.analyzeDigitDistribution(tickData);

            // Calculate distribution metrics
            const totalDeviation = this.calculateTotalDeviation(distributionAnalysis);
            const maxDeviation = Math.max(...distributionAnalysis.map(d => d.deviation));
            const distributionBalance = this.calculateDistributionBalance(distributionAnalysis);
            const correctionPotential = this.calculateCorrectionPotential(distributionAnalysis);
            const probabilityEdge = this.calculateProbabilityEdge(distributionAnalysis);

            console.log(`  📊 [${name}] Metrics:`, {
                totalDeviation: (totalDeviation * 100).toFixed(2) + '%',
                maxDeviation: (maxDeviation * 100).toFixed(2) + '%',
                correctionPotential: (correctionPotential * 100).toFixed(1) + '%',
                probabilityEdge: (probabilityEdge * 100).toFixed(2) + '%',
            });

            // Filter significant deviations
            const deviatedDigits = distributionAnalysis.filter(d => d.deviation >= this.MIN_DEVIATION_THRESHOLD);
            const underrepresentedDigits = distributionAnalysis.filter(
                d => d.frequency < this.EXPECTED_FREQUENCY - this.MIN_DEVIATION_THRESHOLD
            );
            const overrepresentedDigits = distributionAnalysis.filter(
                d => d.frequency > this.EXPECTED_FREQUENCY + this.MIN_DEVIATION_THRESHOLD
            );

            console.log(`  📊 [${name}] Deviations:`, {
                deviatedDigits: deviatedDigits.length,
                underrepresented: underrepresentedDigits.length,
                overrepresented: overrepresentedDigits.length,
            });

            // Check if there are significant deviations worth trading (enhanced with z-score validation)
            if (deviatedDigits.length === 0 || probabilityEdge < 0.02) {
                console.log(
                    `  ℹ️ [${name}] No significant deviations (deviatedDigits: ${deviatedDigits.length}, edge: ${(probabilityEdge * 100).toFixed(2)}%)`
                );
                return null;
            }

            // Additional validation: ensure statistical significance
            const hasSignificantDeviation = deviatedDigits.some(d => Math.abs(d.zScore) >= this.MIN_Z_SCORE);
            if (!hasSignificantDeviation) {
                console.log(`  ℹ️ [${name}] No statistically significant deviations (z-score < ${this.MIN_Z_SCORE})`);
                return null;
            }

            console.log(`  ✅ [${name}] Significant deviations found - generating signal...`);

            // Generate signal based on strongest deviation pattern
            let signal: DigitDistributionSignal | null = null;

            // Priority 1: Statistical Reversion (underrepresented digits)
            if (underrepresentedDigits.length > 0 && correctionPotential > 0.7) {
                console.log(`  🎯 [${name}] Using STATISTICAL_REVERSION strategy`);
                signal = this.generateStatisticalReversionSignal(
                    symbol,
                    name,
                    currentPrice,
                    underrepresentedDigits[0],
                    {
                        totalDeviation,
                        maxDeviation,
                        distributionBalance,
                        correctionPotential,
                        probabilityEdge,
                        deviatedDigits,
                        underrepresentedDigits,
                        overrepresentedDigits,
                    }
                );
            }
            // Priority 2: Deviation Correction (most deviated digit)
            else if (maxDeviation >= this.HIGH_DEVIATION_THRESHOLD) {
                console.log(`  🎯 [${name}] Using DEVIATION_CORRECTION strategy`);
                const mostDeviatedDigit = distributionAnalysis.reduce((max, current) =>
                    current.deviation > max.deviation ? current : max
                );
                signal = this.generateDeviationCorrectionSignal(symbol, name, currentPrice, mostDeviatedDigit, {
                    totalDeviation,
                    maxDeviation,
                    distributionBalance,
                    correctionPotential,
                    probabilityEdge,
                    deviatedDigits,
                    underrepresentedDigits,
                    overrepresentedDigits,
                });
            }
            // Priority 3: Probability Arbitrage (ensemble approach)
            else if (probabilityEdge > 0.03) {
                console.log(`  🎯 [${name}] Using PROBABILITY_ARBITRAGE strategy`);
                signal = this.generateProbabilityArbitrageSignal(symbol, name, currentPrice, distributionAnalysis, {
                    totalDeviation,
                    maxDeviation,
                    distributionBalance,
                    correctionPotential,
                    probabilityEdge,
                    deviatedDigits,
                    underrepresentedDigits,
                    overrepresentedDigits,
                });
            } else {
                console.log(`  ℹ️ [${name}] No strategy matched criteria`);
            }

            return signal;
        } catch (error) {
            console.error(`  ❌ [${name}] Error analyzing:`, error);
            return null;
        }
    }

    /**
     * Get tick history and extract last digits
     */
    private async getTickHistory(symbol: string, count: number): Promise<TickData[]> {
        try {
            console.log(`  📡 [${symbol}] Requesting ${count} ticks from Deriv API...`);

            // Add delay between requests to avoid overwhelming the API
            await new Promise(resolve => setTimeout(resolve, 500));

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
                console.log(`  ✅ [${symbol}] Received ${ticks.length} ticks from Deriv API`);
                return ticks;
            } else if (response.error) {
                throw new Error(`API Error: ${response.error.message || 'Unknown error'}`);
            } else {
                throw new Error('No history data received');
            }
        } catch (error: any) {
            const errorMsg = error?.error?.message || error?.message || 'Unknown error';
            console.error(`  ❌ [${symbol}] Failed to get tick history: ${errorMsg}`);
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
     * Analyze digit distribution with statistical metrics
     */
    private analyzeDigitDistribution(ticks: TickData[]): DigitDistributionAnalysis[] {
        const digitCounts: Record<number, number> = {};
        const digitLastSeen: Record<number, number> = {};
        const digitStreaks: Record<number, number> = {};

        // Initialize counters
        for (let i = 0; i < 10; i++) {
            digitCounts[i] = 0;
            digitLastSeen[i] = -1;
            digitStreaks[i] = 0;
        }

        // Count occurrences and track patterns
        let currentStreak = 0;
        let lastDigit = -1;

        ticks.forEach((tick, index) => {
            const digit = tick.lastDigit;
            digitCounts[digit]++;

            // Track last seen (from end of array)
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

        // Create distribution analysis with statistical metrics
        const analysis: DigitDistributionAnalysis[] = [];
        const totalTicks = ticks.length;

        for (let digit = 0; digit < 10; digit++) {
            const frequency = digitCounts[digit] / totalTicks;
            const percentage = frequency * 100;
            const expectedPercentage = this.EXPECTED_FREQUENCY * 100;
            const deviation = Math.abs(frequency - this.EXPECTED_FREQUENCY);
            const deviationScore = Math.min(1, deviation / 0.1); // Normalize to 0-1

            // Calculate probability correction (how likely this digit is to appear next)
            const probabilityCorrection =
                frequency < this.EXPECTED_FREQUENCY
                    ? (this.EXPECTED_FREQUENCY - frequency) / this.EXPECTED_FREQUENCY
                    : Math.max(0, 1 - (frequency - this.EXPECTED_FREQUENCY) / this.EXPECTED_FREQUENCY);

            // Calculate z-score for statistical significance
            const expectedCount = totalTicks * this.EXPECTED_FREQUENCY;
            const actualCount = digitCounts[digit];
            const variance = totalTicks * this.EXPECTED_FREQUENCY * (1 - this.EXPECTED_FREQUENCY);
            const standardDeviation = Math.sqrt(variance);
            const zScore = standardDeviation > 0 ? (actualCount - expectedCount) / standardDeviation : 0;

            analysis.push({
                digit,
                frequency,
                percentage,
                expectedPercentage,
                deviation,
                deviationScore,
                probabilityCorrection,
                lastSeen: digitLastSeen[digit],
                streak: digitStreaks[digit],
                zScore,
            });
        }

        return analysis.sort((a, b) => b.deviation - a.deviation);
    }

    /**
     * Calculate total distribution deviation
     */
    private calculateTotalDeviation(analysis: DigitDistributionAnalysis[]): number {
        return analysis.reduce((sum, d) => sum + d.deviation, 0);
    }

    /**
     * Calculate distribution balance (0 = perfectly balanced, 1 = highly imbalanced)
     */
    private calculateDistributionBalance(analysis: DigitDistributionAnalysis[]): number {
        const totalDeviation = this.calculateTotalDeviation(analysis);
        return Math.min(1, totalDeviation / 0.5); // Normalize to 0-1 scale
    }

    /**
     * Calculate correction potential based on statistical principles
     */
    private calculateCorrectionPotential(analysis: DigitDistributionAnalysis[]): number {
        const underrepresented = analysis.filter(d => d.frequency < this.EXPECTED_FREQUENCY);
        if (underrepresented.length === 0) return 0;

        const avgProbabilityCorrection =
            underrepresented.reduce((sum, d) => sum + d.probabilityCorrection, 0) / underrepresented.length;
        const avgZScore = Math.abs(underrepresented.reduce((sum, d) => sum + d.zScore, 0) / underrepresented.length);

        return Math.min(1, (avgProbabilityCorrection + avgZScore / 3) / 2);
    }

    /**
     * Calculate mathematical probability edge
     */
    private calculateProbabilityEdge(analysis: DigitDistributionAnalysis[]): number {
        const maxCorrection = Math.max(...analysis.map(d => d.probabilityCorrection));
        const avgDeviation = analysis.reduce((sum, d) => sum + d.deviation, 0) / analysis.length;

        return Math.min(0.15, maxCorrection * avgDeviation * 10); // Cap at 15% edge
    }

    /**
     * Generate statistical reversion signal
     */
    private generateStatisticalReversionSignal(
        symbol: string,
        name: string,
        currentPrice: number,
        underrepresentedDigit: DigitDistributionAnalysis,
        analysis: DigitDistributionSignal['analysis']
    ): DigitDistributionSignal {
        const targetDigit = underrepresentedDigit.digit;
        const confidence = Math.min(95, underrepresentedDigit.probabilityCorrection * 100 + 20);

        // ENHANCED LOGIC: Intelligent signal selection (no more Math.random())
        let action: 'OVER' | 'UNDER';
        let barrier: number;
        let reasoning: string;

        // Use intelligent scoring instead of random selection
        const zScoreStrength = Math.abs(underrepresentedDigit.zScore);
        const deviationStrength = underrepresentedDigit.deviation;

        // Determine signal based on statistical analysis with intelligent weighting
        // Favor OVER 2 for digits 0-4, UNDER 7 for digits 5-9, with statistical validation
        const favorOver2 =
            (targetDigit <= 4 && zScoreStrength > 1.5) ||
            (targetDigit === 2 && deviationStrength > 0.06) ||
            (targetDigit <= 1 && deviationStrength > 0.04);

        if (favorOver2) {
            action = 'OVER';
            barrier = 2;
            reasoning = `Statistical reversion: digit ${targetDigit} underrepresented (${underrepresentedDigit.percentage.toFixed(1)}%, z-score: ${zScoreStrength.toFixed(2)}). OVER 2 opportunity.`;
        } else {
            action = 'UNDER';
            barrier = 7;
            reasoning = `Statistical reversion: digit ${targetDigit} underrepresented (${underrepresentedDigit.percentage.toFixed(1)}%, z-score: ${zScoreStrength.toFixed(2)}). UNDER 7 opportunity.`;
        }

        return {
            market: symbol,
            marketName: name,
            signalType: 'STATISTICAL_REVERSION',
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
     * Generate deviation correction signal
     */
    private generateDeviationCorrectionSignal(
        symbol: string,
        name: string,
        currentPrice: number,
        deviatedDigit: DigitDistributionAnalysis,
        analysis: DigitDistributionSignal['analysis']
    ): DigitDistributionSignal {
        const targetDigit = deviatedDigit.digit;
        const confidence = Math.min(95, deviatedDigit.deviationScore * 80 + 15);

        // ENHANCED LOGIC: Intelligent signal selection (no more Math.random())
        let action: 'OVER' | 'UNDER';
        let barrier: number;
        let reasoning: string;

        // Use intelligent scoring instead of random selection
        const zScoreStrength = Math.abs(deviatedDigit.zScore);
        const isOverrepresented = deviatedDigit.frequency > this.EXPECTED_FREQUENCY;

        // Determine signal based on deviation analysis with intelligent weighting
        // For overrepresented digits, expect reversion (opposite direction)
        // For underrepresented digits, expect continuation (same direction)
        const favorOver2 =
            (isOverrepresented && targetDigit >= 5) ||
            (!isOverrepresented && targetDigit <= 4) ||
            (zScoreStrength > 2.0 && targetDigit <= 2);

        if (favorOver2) {
            action = 'OVER';
            barrier = 2;
            reasoning = `Deviation correction: digit ${targetDigit} ${isOverrepresented ? 'overrepresented' : 'underrepresented'} (${deviatedDigit.percentage.toFixed(1)}%, z-score: ${zScoreStrength.toFixed(2)}). OVER 2 opportunity.`;
        } else {
            action = 'UNDER';
            barrier = 7;
            reasoning = `Deviation correction: digit ${targetDigit} ${isOverrepresented ? 'overrepresented' : 'underrepresented'} (${deviatedDigit.percentage.toFixed(1)}%, z-score: ${zScoreStrength.toFixed(2)}). UNDER 7 opportunity.`;
        }

        return {
            market: symbol,
            marketName: name,
            signalType: 'DEVIATION_CORRECTION',
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
     * Generate probability arbitrage signal using ensemble methods
     */
    private generateProbabilityArbitrageSignal(
        symbol: string,
        name: string,
        currentPrice: number,
        distributionAnalysis: DigitDistributionAnalysis[],
        analysis: DigitDistributionSignal['analysis']
    ): DigitDistributionSignal {
        // Use ensemble strategy for best prediction
        const tickData = distributionAnalysis.map(d => ({
            epoch: Date.now(),
            quote: currentPrice,
            lastDigit: d.digit,
            source: 'historical' as const,
            localTime: new Date().toLocaleTimeString(),
        }));

        const prediction = ensembleStrategy(tickData);
        const predictedDigit = prediction.digit;
        const confidence = Math.min(95, (prediction.probability || 0.5) * 100 + analysis.probabilityEdge * 100);

        // ENHANCED LOGIC: Intelligent ensemble-based signal selection (no more Math.random())
        let action: 'OVER' | 'UNDER';
        let barrier: number;
        let reasoning: string;

        // Use intelligent scoring based on ensemble prediction and mathematical edge
        const predictionConfidence = prediction.probability || 0.5;
        const edgeStrength = analysis.probabilityEdge;

        // Determine signal based on ensemble prediction with intelligent weighting
        // Higher confidence predictions get priority, mathematical edge provides validation
        const favorOver2 =
            (predictedDigit <= 2 && predictionConfidence > 0.6) ||
            (predictedDigit >= 8 && edgeStrength > 0.05) ||
            (predictedDigit <= 4 && predictionConfidence > 0.7);

        if (favorOver2) {
            action = 'OVER';
            barrier = 2;
            reasoning = `Ensemble prediction: digit ${predictedDigit} (${(predictionConfidence * 100).toFixed(1)}% confidence, ${(edgeStrength * 100).toFixed(2)}% edge). OVER 2 opportunity.`;
        } else {
            action = 'UNDER';
            barrier = 7;
            reasoning = `Ensemble prediction: digit ${predictedDigit} (${(predictionConfidence * 100).toFixed(1)}% confidence, ${(edgeStrength * 100).toFixed(2)}% edge). UNDER 7 opportunity.`;
        }

        return {
            market: symbol,
            marketName: name,
            signalType: 'PROBABILITY_ARBITRAGE',
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

export const digitDistributionScannerService = new DigitDistributionScannerService();
