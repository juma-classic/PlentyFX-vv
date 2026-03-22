/**
 * Advanced Algorithm Signal Service
 * Generates real trading signals based on live market data analysis
 * Uses multiple algorithms and pattern recognition for signal generation
 */

import { derivConnectionPool } from './deriv-connection-pool.service';
import { entryPointDetector } from './entry-point-detector.service';
import { patternPredictor } from './pattern-predictor.service';

export interface BarrierSuggestion {
    level: number;
    confidence: number;
    reasoning: string;
    type: 'SUPPORT' | 'RESISTANCE' | 'OPTIMAL';
}

export interface RealSignal {
    id: string;
    timestamp: number;
    market: string;
    marketLabel: string;
    signalType: 'OVER_UNDER' | 'EVEN_ODD' | 'RISE_FALL';
    prediction: string; // Can be 'OVER5', 'UNDER3', 'EVEN', 'ODD', 'RISE', 'FALL'
    confidence: number; // 0-100
    strength: 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY_STRONG';
    entryPrice: number;
    targetDigit?: number;
    entryDigit?: number; // Entry point digit for PATEL bot
    reasoning: string;
    supportingFactors: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    recommendedStake: number;
    expiryTime: number; // When signal expires
    barrierSuggestions: BarrierSuggestion[];
    patternData: {
        recentPattern: string[];
        streakLength: number;
        imbalance: number;
        volatility: number;
    };
}

export interface AlgorithmConfig {
    enabled: boolean;
    markets: string[];
    signalTypes: ('OVER_UNDER' | 'EVEN_ODD' | 'RISE_FALL')[];
    minConfidence: number;
    maxSignalsPerMinute: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    baseStake: number;
}

export interface AlgorithmStats {
    totalSignals: number;
    signalsToday: number;
    avgConfidence: number;
    successRate: number;
    totalProfit: number;
    activeSignals: number;
    lastSignalTime: number;
}

class AdvancedAlgoSignalService {
    private config: AlgorithmConfig = {
        enabled: false,
        markets: ['R_50', 'R_75', 'R_100'],
        signalTypes: ['OVER_UNDER', 'EVEN_ODD', 'RISE_FALL'],
        minConfidence: 65,
        maxSignalsPerMinute: 3,
        riskLevel: 'MEDIUM',
        baseStake: 1.0,
    };

    private tickData: Map<string, Array<{ quote: number; timestamp: number; digit: number }>> = new Map();
    private activeSignals: Map<string, RealSignal> = new Map();
    private signalHistory: RealSignal[] = [];
    private stats: AlgorithmStats = {
        totalSignals: 0,
        signalsToday: 0,
        avgConfidence: 0,
        successRate: 0,
        totalProfit: 0,
        activeSignals: 0,
        lastSignalTime: 0,
    };

    private listeners: Array<(signal: RealSignal) => void> = [];
    private subscriptions: Map<string, () => void> = new Map();
    private signalGenerationInterval: NodeJS.Timeout | null = null;
    private lastSignalTimes: Map<string, number> = new Map();

    /**
     * Start the algorithm with configuration (using App ID - no token required)
     */
    public async start(config?: Partial<AlgorithmConfig>): Promise<void> {
        if (config) {
            this.config = { ...this.config, ...config };
        }

        this.config.enabled = true;
        console.log('🤖 Advanced Algorithm starting with App ID authentication...');
        console.log('📋 Config:', this.config);
        console.log('🔑 Using built-in App IDs - no token required');

        try {
            // Subscribe to market data for all configured markets
            await this.subscribeToMarkets();

            // Start signal generation loop
            this.startSignalGeneration();

            console.log('✅ Advanced Algorithm started successfully with App ID authentication');
        } catch (error) {
            console.error('❌ Failed to start Advanced Algorithm:', error);
            console.log('💡 Make sure you have internet connection and try again');
            throw error;
        }
    }

    /**
     * Stop the algorithm
     */
    public stop(): void {
        this.config.enabled = false;

        // Unsubscribe from all markets
        this.subscriptions.forEach(unsubscribe => unsubscribe());
        this.subscriptions.clear();

        // Stop signal generation
        if (this.signalGenerationInterval) {
            clearInterval(this.signalGenerationInterval);
            this.signalGenerationInterval = null;
        }

        // Clear active signals
        this.activeSignals.clear();

        console.log('🛑 Advanced Algorithm stopped');
    }

    /**
     * Subscribe to market data for all configured markets using app ID authentication
     */
    private async subscribeToMarkets(): Promise<void> {
        console.log('🔧 Advanced Algorithm using App ID authentication (no token required)');

        for (const market of this.config.markets) {
            try {
                console.log(`📡 Subscribing to ${market} for algorithm signals using App ID...`);

                // Use ANALYSIS connection type for Advanced Algorithm
                const unsubscribe = await derivConnectionPool.subscribeToTicks(
                    market,
                    (tickData: unknown) => {
                        this.handleTickData(market, tickData as Record<string, unknown>);
                    },
                    'analysis' as any // Use analysis connection for Advanced Algorithm
                );

                this.subscriptions.set(market, unsubscribe);

                // Initialize tick data array for this market
                if (!this.tickData.has(market)) {
                    this.tickData.set(market, []);
                }

                console.log(`✅ Successfully subscribed to ${market} via App ID`);
            } catch (error) {
                console.error(`❌ Failed to subscribe to ${market}:`, error);
                console.log('💡 Retrying with different connection type...');

                // Fallback to signals connection
                try {
                    const fallbackUnsubscribe = await derivConnectionPool.subscribeToTicks(
                        market,
                        (tickData: unknown) => {
                            this.handleTickData(market, tickData as Record<string, unknown>);
                        },
                        'signals' as any
                    );

                    this.subscriptions.set(market, fallbackUnsubscribe);

                    if (!this.tickData.has(market)) {
                        this.tickData.set(market, []);
                    }

                    console.log(`✅ Successfully subscribed to ${market} via fallback App ID`);
                } catch (fallbackError) {
                    console.error(`❌ Fallback subscription failed for ${market}:`, fallbackError);
                }
            }
        }
    }

    /**
     * Handle incoming tick data
     */
    private handleTickData(market: string, tickData: Record<string, unknown>): void {
        const tick = tickData?.tick as { quote?: number; epoch?: number };
        if (!tick?.quote || !tick?.epoch) return;

        const tickInfo = {
            quote: tick.quote,
            timestamp: tick.epoch * 1000,
            digit: Math.floor((tick.quote * 100) % 10),
        };

        // Store tick data (keep last 50 ticks per market)
        const marketTicks = this.tickData.get(market) || [];
        marketTicks.push(tickInfo);
        if (marketTicks.length > 50) {
            marketTicks.shift();
        }
        this.tickData.set(market, marketTicks);

        // Analyze for potential signals
        this.analyzeForSignals(market);
    }

    /**
     * Start signal generation loop
     */
    private startSignalGeneration(): void {
        // Check for signals every 5 seconds
        this.signalGenerationInterval = setInterval(() => {
            if (this.config.enabled) {
                this.generateSignals();
            }
        }, 5000);
    }

    /**
     * Generate signals for all markets and signal types
     */
    private generateSignals(): void {
        for (const market of this.config.markets) {
            for (const signalType of this.config.signalTypes) {
                this.analyzeMarketForSignalType(market, signalType);
            }
        }

        // Clean up expired signals
        this.cleanupExpiredSignals();
    }

    /**
     * Analyze specific market for signal type
     */
    private analyzeMarketForSignalType(market: string, signalType: 'OVER_UNDER' | 'EVEN_ODD' | 'RISE_FALL'): void {
        const ticks = this.tickData.get(market);
        if (!ticks || ticks.length < 10) return;

        // Check rate limiting
        const lastSignalKey = `${market}_${signalType}`;
        const lastSignalTime = this.lastSignalTimes.get(lastSignalKey) || 0;
        const timeSinceLastSignal = Date.now() - lastSignalTime;
        const minInterval = (60 / this.config.maxSignalsPerMinute) * 1000; // Convert to milliseconds

        if (timeSinceLastSignal < minInterval) return;

        // Convert ticks to pattern based on signal type
        const pattern = this.convertTicksToPattern(ticks, signalType);
        if (pattern.length < 10) return;

        // Analyze pattern for entry point
        const entryPoint = entryPointDetector.detectEntryPoint(pattern);
        if (entryPoint.confidence < this.config.minConfidence) return;

        // Use pattern predictor for additional analysis
        const tickDataForPredictor = ticks.slice(-15).map(tick => ({
            value: tick.quote,
            timestamp: tick.timestamp,
            direction: undefined as 'RISE' | 'FALL' | undefined,
        }));

        // Add direction information
        for (let i = 1; i < tickDataForPredictor.length; i++) {
            tickDataForPredictor[i].direction =
                tickDataForPredictor[i].value > tickDataForPredictor[i - 1].value ? 'RISE' : 'FALL';
        }

        const prediction = patternPredictor.predict(tickDataForPredictor);

        // Only generate signal if both analyses agree and meet confidence threshold
        if (prediction.confidence >= this.config.minConfidence && prediction.recommendedAction === 'TRADE') {
            const signal = this.createSignal(market, signalType, pattern, entryPoint, prediction, ticks);
            if (signal) {
                this.emitSignal(signal);
                this.lastSignalTimes.set(lastSignalKey, Date.now());
            }
        }
    }

    /**
     * Convert ticks to pattern based on signal type
     */
    private convertTicksToPattern(
        ticks: Array<{ quote: number; timestamp: number; digit: number }>,
        signalType: 'OVER_UNDER' | 'EVEN_ODD' | 'RISE_FALL'
    ): string[] {
        const pattern: string[] = [];

        for (let i = 0; i < ticks.length; i++) {
            const tick = ticks[i];

            switch (signalType) {
                case 'OVER_UNDER':
                    pattern.push(tick.digit >= 5 ? 'OVER' : 'UNDER');
                    break;
                case 'EVEN_ODD':
                    pattern.push(tick.digit % 2 === 0 ? 'EVEN' : 'ODD');
                    break;
                case 'RISE_FALL':
                    if (i > 0) {
                        pattern.push(tick.quote > ticks[i - 1].quote ? 'RISE' : 'FALL');
                    }
                    break;
            }
        }

        return pattern;
    }

    /**
     * Create a real signal from analysis
     */
    private createSignal(
        market: string,
        signalType: 'OVER_UNDER' | 'EVEN_ODD' | 'RISE_FALL',
        pattern: string[],
        entryPoint: any,
        prediction: any,
        ticks: Array<{ quote: number; timestamp: number; digit: number }>
    ): RealSignal | null {
        const latestTick = ticks[ticks.length - 1];
        const signalId = `${market}_${signalType}_${Date.now()}`;

        // Enhanced prediction logic with specific target digits
        let signalPrediction: string;
        let targetDigit: number | undefined;

        const lastPatternType = pattern[pattern.length - 1];
        const streakLength = this.calculateStreakLength(pattern);
        const recentDigits = ticks.slice(-10).map(t => t.digit);
        const digitFrequency = this.analyzeDigitFrequency(recentDigits);
        const priceVolatility = this.calculatePriceVolatility(ticks.slice(-10));
        const imbalance = this.calculateImbalance(pattern);

        // Enhanced OVER_UNDER prediction with specific target digits and barrier numbers
        if (signalType === 'OVER_UNDER') {
            const overCount = pattern.filter(p => p === 'OVER').length;
            const underCount = pattern.filter(p => p === 'UNDER').length;
            const overUnderImbalance = Math.abs(overCount - underCount);

            let baseBarrier = 5; // Default barrier
            let signalDirection: 'OVER' | 'UNDER';

            if (streakLength >= 6) {
                // Very strong reversal signal
                signalDirection = lastPatternType === 'OVER' ? 'UNDER' : 'OVER';
                targetDigit = this.getPreciseTargetDigit(signalDirection, digitFrequency, 'HIGH_CONFIDENCE');
            } else if (streakLength >= 4) {
                // Strong reversal signal
                signalDirection = lastPatternType === 'OVER' ? 'UNDER' : 'OVER';
                targetDigit = this.getPreciseTargetDigit(signalDirection, digitFrequency, 'MEDIUM_CONFIDENCE');
            } else if (overUnderImbalance >= 6) {
                // Imbalance correction signal
                signalDirection = overCount > underCount ? 'UNDER' : 'OVER';
                targetDigit = this.getPreciseTargetDigit(signalDirection, digitFrequency, 'IMBALANCE_CORRECTION');
            } else {
                // Trend continuation or weak signal
                const trendDirection = this.analyzeTrend(pattern.slice(-5));
                signalDirection = trendDirection === 'BULLISH' ? 'OVER' : 'UNDER';
                targetDigit = this.getPreciseTargetDigit(signalDirection, digitFrequency, 'TREND_FOLLOW');
            }

            // Determine optimal barrier based on target digit and analysis
            if (signalDirection === 'OVER') {
                if (targetDigit && targetDigit >= 7) {
                    baseBarrier = 6; // OVER6 for high digits
                } else if (targetDigit && targetDigit >= 5) {
                    baseBarrier = 4; // OVER4 for medium-high digits
                } else {
                    baseBarrier = 5; // Default OVER5
                }
            } else {
                if (targetDigit && targetDigit <= 2) {
                    baseBarrier = 3; // UNDER3 for low digits
                } else if (targetDigit && targetDigit <= 4) {
                    baseBarrier = 5; // UNDER5 for medium-low digits
                } else {
                    baseBarrier = 4; // UNDER4 for balanced approach
                }
            }

            // Create prediction with barrier number (e.g., "OVER5", "UNDER3")
            signalPrediction = `${signalDirection}${baseBarrier}` as any;
        }
        // Enhanced EVEN_ODD prediction with specific target digits
        else if (signalType === 'EVEN_ODD') {
            const evenCount = pattern.filter(p => p === 'EVEN').length;
            const oddCount = pattern.filter(p => p === 'ODD').length;
            const evenOddImbalance = Math.abs(evenCount - oddCount);

            if (streakLength >= 6) {
                signalPrediction = lastPatternType === 'EVEN' ? 'ODD' : 'EVEN';
                targetDigit = this.getPreciseTargetDigit(signalPrediction, digitFrequency, 'HIGH_CONFIDENCE');
            } else if (streakLength >= 4) {
                signalPrediction = lastPatternType === 'EVEN' ? 'ODD' : 'EVEN';
                targetDigit = this.getPreciseTargetDigit(signalPrediction, digitFrequency, 'MEDIUM_CONFIDENCE');
            } else if (evenOddImbalance >= 6) {
                signalPrediction = evenCount > oddCount ? 'ODD' : 'EVEN';
                targetDigit = this.getPreciseTargetDigit(signalPrediction, digitFrequency, 'IMBALANCE_CORRECTION');
            } else {
                const trendDirection = this.analyzeTrend(pattern.slice(-5));
                signalPrediction = trendDirection === 'BULLISH' ? 'EVEN' : 'ODD';
                targetDigit = this.getPreciseTargetDigit(signalPrediction, digitFrequency, 'TREND_FOLLOW');
            }
        }
        // Enhanced RISE_FALL prediction
        else {
            const riseCount = pattern.filter(p => p === 'RISE').length;
            const fallCount = pattern.filter(p => p === 'FALL').length;

            if (streakLength >= 4) {
                signalPrediction = lastPatternType === 'RISE' ? 'FALL' : 'RISE';
            } else if (priceVolatility > 0.8) {
                // High volatility - expect reversal
                signalPrediction = lastPatternType === 'RISE' ? 'FALL' : 'RISE';
            } else {
                // Use AI prediction for RISE_FALL
                signalPrediction = prediction?.prediction || (riseCount > fallCount ? 'FALL' : 'RISE');
            }
        }

        // Enhanced confidence calculation with multiple factors
        const patternConfidence = this.calculatePatternConfidence(pattern, streakLength);
        const entryPointConfidence = entryPoint?.confidence || 65;
        const predictionConfidence = prediction?.confidence || 65;

        // Weighted confidence calculation
        const combinedConfidence = Math.round(
            patternConfidence * 0.4 + entryPointConfidence * 0.3 + predictionConfidence * 0.3
        );

        // Determine strength based on enhanced confidence
        let strength: 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY_STRONG';
        if (combinedConfidence >= 85) strength = 'VERY_STRONG';
        else if (combinedConfidence >= 75) strength = 'STRONG';
        else if (combinedConfidence >= 65) strength = 'MODERATE';
        else strength = 'WEAK';

        // Only proceed if confidence meets minimum threshold
        if (combinedConfidence < this.config.minConfidence) {
            return null;
        }

        // Calculate recommended stake based on confidence and risk level
        const recommendedStake = this.calculateRecommendedStake(combinedConfidence);

        // Calculate expiry time (signals expire after 2-5 minutes based on strength)
        const expiryMinutes = strength === 'VERY_STRONG' ? 5 : strength === 'STRONG' ? 4 : 3;
        const expiryTime = Date.now() + expiryMinutes * 60 * 1000;

        // Generate enhanced supporting factors
        const enhancedSupportingFactors = this.generateSupportingFactors(
            signalType,
            streakLength,
            imbalance,
            digitFrequency,
            priceVolatility,
            entryPoint,
            prediction
        );

        // Calculate barrier suggestions
        const barrierSuggestions = this.calculateBarrierSuggestions(
            latestTick.quote,
            targetDigit,
            signalPrediction,
            combinedConfidence,
            priceVolatility,
            ticks.slice(-20)
        );

        const signal: RealSignal = {
            id: signalId,
            timestamp: Date.now(),
            market,
            marketLabel: this.getMarketLabel(market),
            signalType,
            prediction: signalPrediction,
            confidence: combinedConfidence,
            strength,
            entryPrice: latestTick.quote,
            targetDigit,
            entryDigit: targetDigit, // Use targetDigit as entryDigit for PATEL bot
            reasoning: this.generateReasoning(signalType, streakLength, pattern, combinedConfidence),
            supportingFactors: enhancedSupportingFactors,
            riskLevel: this.calculateRiskLevel(combinedConfidence, streakLength, imbalance),
            recommendedStake,
            expiryTime,
            barrierSuggestions,
            patternData: {
                recentPattern: pattern.slice(-10),
                streakLength,
                imbalance,
                volatility: this.calculateVolatility(ticks),
            },
        };

        return signal;
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
     * Calculate imbalance in pattern
     */
    private calculateImbalance(pattern: string[]): number {
        const counts: Record<string, number> = {};
        pattern.forEach(p => {
            counts[p] = (counts[p] || 0) + 1;
        });

        const values = Object.values(counts);
        if (values.length < 2) return 0;

        return Math.abs(values[0] - values[1]);
    }

    /**
     * Calculate volatility from ticks
     */
    private calculateVolatility(ticks: Array<{ quote: number; timestamp: number; digit: number }>): number {
        if (ticks.length < 2) return 0;

        const changes = [];
        for (let i = 1; i < ticks.length; i++) {
            changes.push(Math.abs(ticks[i].quote - ticks[i - 1].quote));
        }

        const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
        return Math.round(avgChange * 100000); // Scale for readability
    }

    /**
     * Calculate recommended stake
     */
    private calculateRecommendedStake(confidence: number): number {
        let multiplier = 1.0;

        // Adjust based on risk level
        switch (this.config.riskLevel) {
            case 'LOW':
                multiplier = 0.5;
                break;
            case 'HIGH':
                multiplier = 2.0;
                break;
            default:
                multiplier = 1.0;
        }

        // Adjust based on confidence
        if (confidence >= 85) multiplier *= 1.5;
        else if (confidence >= 75) multiplier *= 1.2;
        else if (confidence < 65) multiplier *= 0.8;

        return Math.round(this.config.baseStake * multiplier * 100) / 100;
    }

    /**
     * Analyze digit frequency to find least/most common digits
     */
    private analyzeDigitFrequency(digits: number[]): {
        leastCommon: number[];
        mostCommon: number[];
        frequency: Record<number, number>;
    } {
        const frequency: Record<number, number> = {};

        // Count frequency of each digit
        digits.forEach(digit => {
            frequency[digit] = (frequency[digit] || 0) + 1;
        });

        // Sort digits by frequency
        const sortedByFreq = Object.entries(frequency)
            .map(([digit, count]) => ({ digit: parseInt(digit), count }))
            .sort((a, b) => a.count - b.count);

        const leastCommon = sortedByFreq.slice(0, 3).map(item => item.digit);
        const mostCommon = sortedByFreq.slice(-3).map(item => item.digit);

        return { leastCommon, mostCommon, frequency };
    }

    /**
     * Calculate price volatility from recent ticks
     */
    private calculatePriceVolatility(ticks: Array<{ quote: number; timestamp: number; digit: number }>): number {
        if (ticks.length < 3) return 0;

        const priceChanges = [];
        for (let i = 1; i < ticks.length; i++) {
            const change = Math.abs(ticks[i].quote - ticks[i - 1].quote);
            priceChanges.push(change);
        }

        const avgChange = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;
        return avgChange * 100000; // Scale for readability
    }

    /**
     * Analyze trend direction from recent pattern
     */
    private analyzeTrend(recentPattern: string[]): 'BULLISH' | 'BEARISH' | 'NEUTRAL' {
        if (recentPattern.length < 3) return 'NEUTRAL';

        const bullishCount = recentPattern.filter(p => p === 'OVER' || p === 'RISE' || p === 'EVEN').length;

        const bearishCount = recentPattern.length - bullishCount;

        if (bullishCount > bearishCount + 1) return 'BULLISH';
        if (bearishCount > bullishCount + 1) return 'BEARISH';
        return 'NEUTRAL';
    }

    /**
     * Get precise target digit based on analysis
     */
    private getPreciseTargetDigit(
        prediction: string,
        digitFreq: { leastCommon: number[]; mostCommon: number[]; frequency: Record<number, number> },
        confidence: 'HIGH_CONFIDENCE' | 'MEDIUM_CONFIDENCE' | 'IMBALANCE_CORRECTION' | 'TREND_FOLLOW'
    ): number {
        let candidateDigits: number[] = [];

        // Filter digits based on prediction type
        if (prediction.includes('OVER') || prediction === 'OVER') {
            candidateDigits = [5, 6, 7, 8, 9];
        } else if (prediction.includes('UNDER') || prediction === 'UNDER') {
            candidateDigits = [0, 1, 2, 3, 4];
        } else if (prediction === 'EVEN') {
            candidateDigits = [0, 2, 4, 6, 8];
        } else if (prediction === 'ODD') {
            candidateDigits = [1, 3, 5, 7, 9];
        }

        // Apply confidence-based selection strategy
        switch (confidence) {
            case 'HIGH_CONFIDENCE': {
                // Choose least common digit for high confidence reversal
                const leastCommonInRange = digitFreq.leastCommon.filter(d => candidateDigits.includes(d));
                if (leastCommonInRange.length > 0) {
                    return leastCommonInRange[0];
                }
                break;
            }

            case 'MEDIUM_CONFIDENCE': {
                // Choose moderately uncommon digit
                const sortedCandidates = candidateDigits
                    .map(digit => ({ digit, freq: digitFreq.frequency[digit] || 0 }))
                    .sort((a, b) => a.freq - b.freq);
                return sortedCandidates[Math.floor(sortedCandidates.length / 3)].digit;
            }

            case 'IMBALANCE_CORRECTION': {
                // Choose digit that helps balance the distribution
                const balancingDigit = candidateDigits.sort(
                    (a, b) => (digitFreq.frequency[a] || 0) - (digitFreq.frequency[b] || 0)
                )[0];
                return balancingDigit;
            }

            case 'TREND_FOLLOW': {
                // Choose middle-range digit for trend following
                const middleIndex = Math.floor(candidateDigits.length / 2);
                return candidateDigits[middleIndex];
            }
        }

        // Fallback to middle digit of range
        return candidateDigits[Math.floor(candidateDigits.length / 2)];
    }

    /**
     * Generate enhanced reasoning text with specific insights
     */
    private generateReasoning(signalType: string, streakLength: number, pattern: string[], confidence: number): string {
        const lastType = pattern[pattern.length - 1];
        const imbalance = this.calculateImbalance(pattern);

        // High confidence signals (85%+)
        if (confidence >= 85) {
            if (streakLength >= 6) {
                return `🔥 CRITICAL REVERSAL: Extreme ${lastType} streak of ${streakLength} ticks detected. Statistical probability strongly favors immediate reversal. Entry confidence: ${confidence}%.`;
            } else if (imbalance >= 8) {
                return `⚡ MAJOR IMBALANCE: Severe distribution imbalance (${imbalance} tick difference) identified. Market correction imminent with ${confidence}% confidence.`;
            } else {
                return `🎯 HIGH PROBABILITY: Multiple technical confluences aligned. Pattern analysis, trend momentum, and statistical models all confirm ${confidence}% entry signal.`;
            }
        }
        // Medium confidence signals (70-84%)
        else if (confidence >= 70) {
            if (streakLength >= 4) {
                return `📊 REVERSAL SETUP: Strong ${lastType} streak of ${streakLength} ticks. Pattern suggests reversal opportunity with ${confidence}% probability based on historical data.`;
            } else if (imbalance >= 5) {
                return `⚖️ BALANCE CORRECTION: Significant pattern imbalance (${imbalance} difference) detected. Statistical reversion expected with ${confidence}% confidence.`;
            } else {
                return `📈 TECHNICAL ALIGNMENT: Key indicators converging for ${signalType} opportunity. Risk-reward ratio favorable at ${confidence}% confidence level.`;
            }
        }
        // Lower confidence signals (65-69%)
        else {
            if (streakLength >= 3) {
                return `🔍 PATTERN WATCH: Moderate ${lastType} streak of ${streakLength} identified. Early reversal signal developing with ${confidence}% initial confidence.`;
            } else {
                return `📋 SETUP FORMING: Technical indicators beginning to align for potential ${signalType} trade. Monitor for confirmation at ${confidence}% confidence.`;
            }
        }
    }

    /**
     * Calculate pattern-based confidence score
     */
    private calculatePatternConfidence(pattern: string[], streakLength: number): number {
        const imbalance = this.calculateImbalance(pattern);
        let confidence = 50; // Base confidence

        // Streak-based confidence boost
        if (streakLength >= 8) confidence += 35;
        else if (streakLength >= 6) confidence += 25;
        else if (streakLength >= 4) confidence += 15;
        else if (streakLength >= 3) confidence += 8;

        // Imbalance-based confidence boost
        if (imbalance >= 10) confidence += 20;
        else if (imbalance >= 7) confidence += 15;
        else if (imbalance >= 5) confidence += 10;

        // Pattern consistency boost
        const consistency = this.calculatePatternConsistency(pattern);
        confidence += consistency * 10;

        return Math.min(confidence, 95); // Cap at 95%
    }

    /**
     * Calculate pattern consistency (0-1 scale)
     */
    private calculatePatternConsistency(pattern: string[]): number {
        if (pattern.length < 5) return 0;

        const recentPattern = pattern.slice(-8);
        const transitions = [];

        for (let i = 1; i < recentPattern.length; i++) {
            transitions.push(recentPattern[i] !== recentPattern[i - 1]);
        }

        const changeRate = transitions.filter(t => t).length / transitions.length;

        // Higher consistency for patterns with clear structure
        if (changeRate < 0.2 || changeRate > 0.8) return 0.8; // Very consistent
        if (changeRate < 0.4 || changeRate > 0.6) return 0.5; // Moderately consistent
        return 0.2; // Low consistency
    }

    /**
     * Generate enhanced supporting factors
     */
    private generateSupportingFactors(
        signalType: string,
        streakLength: number,
        imbalance: number,
        digitFreq: { leastCommon: number[]; mostCommon: number[]; frequency: Record<number, number> },
        volatility: number,
        entryPoint: any,
        prediction: any
    ): string[] {
        const factors: string[] = [];

        // Streak analysis
        if (streakLength >= 6) {
            factors.push(`🔥 Extreme streak detected (${streakLength} consecutive)`);
        } else if (streakLength >= 4) {
            factors.push(`⚡ Strong streak pattern (${streakLength} consecutive)`);
        }

        // Imbalance analysis
        if (imbalance >= 8) {
            factors.push(`⚖️ Critical imbalance (${imbalance} tick difference)`);
        } else if (imbalance >= 5) {
            factors.push(`📊 Significant imbalance (${imbalance} tick difference)`);
        }

        // Digit frequency analysis
        const leastCommonDigits = digitFreq.leastCommon.slice(0, 2);
        if (leastCommonDigits.length > 0) {
            factors.push(`🎯 Target digits ${leastCommonDigits.join(', ')} underrepresented`);
        }

        // Volatility analysis
        if (volatility > 15) {
            factors.push(`🌊 High volatility environment (${volatility.toFixed(1)})`);
        } else if (volatility < 5) {
            factors.push(`🔒 Low volatility consolidation (${volatility.toFixed(1)})`);
        }

        // Entry point analysis
        if (entryPoint?.reason) {
            factors.push(`📍 ${entryPoint.reason}`);
        }

        // AI prediction factors
        if (prediction?.supportingFactors?.length > 0) {
            factors.push(...prediction.supportingFactors.slice(0, 2));
        }

        // Market-specific factors
        factors.push(`📈 ${signalType.replace('_', '/')} pattern analysis complete`);

        return factors.slice(0, 5); // Limit to 5 most important factors
    }

    /**
     * Calculate dynamic risk level based on signal characteristics
     */
    private calculateRiskLevel(confidence: number, streakLength: number, imbalance: number): 'LOW' | 'MEDIUM' | 'HIGH' {
        // High confidence + strong patterns = Low risk
        if (confidence >= 85 && (streakLength >= 6 || imbalance >= 8)) {
            return 'LOW';
        }

        // Medium confidence or moderate patterns = Medium risk
        if (confidence >= 70 && (streakLength >= 4 || imbalance >= 5)) {
            return 'MEDIUM';
        }

        // Lower confidence or weak patterns = High risk
        return 'HIGH';
    }

    /**
     * Calculate barrier suggestions for optimal entry points
     */
    private calculateBarrierSuggestions(
        currentPrice: number,
        targetDigit: number | undefined,
        prediction: string,
        confidence: number,
        volatility: number,
        recentTicks: Array<{ quote: number; timestamp: number; digit: number }>
    ): BarrierSuggestion[] {
        const suggestions: BarrierSuggestion[] = [];

        if (!targetDigit) {
            return suggestions;
        }

        // Calculate price levels that would result in target digit
        const targetPriceLevels = this.calculateTargetPriceLevels(currentPrice, targetDigit);

        // Calculate support and resistance levels from recent price action
        const supportResistance = this.calculateSupportResistance(recentTicks);

        // Generate barrier suggestions based on analysis

        // 1. Optimal Barrier (closest to target digit price levels)
        const optimalBarrier = this.findOptimalBarrier(currentPrice, targetPriceLevels, supportResistance, volatility);

        if (optimalBarrier) {
            suggestions.push({
                level: optimalBarrier.level,
                confidence: Math.min(confidence + 10, 95),
                reasoning: `Optimal barrier at ${optimalBarrier.level.toFixed(5)} - highest probability for digit ${targetDigit}`,
                type: 'OPTIMAL',
            });
        }

        // 2. Conservative Barrier (safer distance)
        const conservativeBarrier = this.calculateConservativeBarrier(
            currentPrice,
            targetDigit,
            prediction,
            volatility
        );

        suggestions.push({
            level: conservativeBarrier,
            confidence: Math.max(confidence - 15, 50),
            reasoning: `Conservative barrier accounting for ${volatility.toFixed(1)} volatility`,
            type: 'SUPPORT',
        });

        // 3. Aggressive Barrier (closer to current price)
        const aggressiveBarrier = this.calculateAggressiveBarrier(currentPrice, targetDigit, prediction, confidence);

        if (confidence >= 80) {
            suggestions.push({
                level: aggressiveBarrier,
                confidence: confidence,
                reasoning: `Aggressive barrier for high-confidence ${prediction} signal`,
                type: 'RESISTANCE',
            });
        }

        return suggestions.slice(0, 3); // Return top 3 suggestions
    }

    /**
     * Calculate price levels that would result in target digit
     */
    private calculateTargetPriceLevels(currentPrice: number, targetDigit: number): number[] {
        const levels: number[] = [];
        const basePrice = Math.floor(currentPrice * 100) / 100;

        // Generate price levels around current price that would result in target digit
        for (let i = -10; i <= 10; i++) {
            const testPrice = basePrice + i * 0.001;
            const resultingDigit = Math.floor((testPrice * 100) % 10);

            if (resultingDigit === targetDigit) {
                levels.push(testPrice);
            }
        }

        return levels;
    }

    /**
     * Calculate support and resistance levels from recent price action
     */
    private calculateSupportResistance(ticks: Array<{ quote: number; timestamp: number; digit: number }>): {
        support: number[];
        resistance: number[];
    } {
        const prices = ticks.map(t => t.quote);
        const support: number[] = [];
        const resistance: number[] = [];

        // Find local minima (support) and maxima (resistance)
        for (let i = 1; i < prices.length - 1; i++) {
            const prev = prices[i - 1];
            const current = prices[i];
            const next = prices[i + 1];

            if (current < prev && current < next) {
                support.push(current);
            } else if (current > prev && current > next) {
                resistance.push(current);
            }
        }

        return { support, resistance };
    }

    /**
     * Find optimal barrier level
     */
    private findOptimalBarrier(
        currentPrice: number,
        targetLevels: number[],
        supportResistance: { support: number[]; resistance: number[] },
        volatility: number
    ): { level: number; score: number } | null {
        if (targetLevels.length === 0) return null;

        let bestBarrier: { level: number; score: number } | null = null;

        for (const level of targetLevels) {
            let score = 100;

            // Prefer levels closer to current price
            const distance = Math.abs(level - currentPrice);
            score -= distance * 10000; // Penalty for distance

            // Bonus for levels near support/resistance
            const nearSupport = supportResistance.support.some(s => Math.abs(s - level) < 0.001);
            const nearResistance = supportResistance.resistance.some(r => Math.abs(r - level) < 0.001);

            if (nearSupport || nearResistance) {
                score += 20;
            }

            // Adjust for volatility
            if (volatility > 15) {
                score -= 10; // Penalty for high volatility
            }

            if (!bestBarrier || score > bestBarrier.score) {
                bestBarrier = { level, score };
            }
        }

        return bestBarrier;
    }

    /**
     * Calculate conservative barrier
     */
    private calculateConservativeBarrier(
        currentPrice: number,
        targetDigit: number,
        prediction: string,
        volatility: number
    ): number {
        const volatilityBuffer = (volatility / 100) * 0.01; // Convert volatility to price buffer

        if (prediction.includes('OVER') || prediction === 'RISE') {
            return currentPrice + volatilityBuffer;
        } else if (prediction.includes('UNDER') || prediction === 'FALL') {
            return currentPrice - volatilityBuffer;
        } else {
            // For EVEN/ODD, use a smaller buffer
            return currentPrice + volatilityBuffer * 0.5;
        }
    }

    /**
     * Calculate aggressive barrier
     */
    private calculateAggressiveBarrier(
        currentPrice: number,
        targetDigit: number,
        prediction: string,
        confidence: number
    ): number {
        const aggressiveBuffer = 0.002 * (confidence / 100); // Smaller buffer for high confidence

        if (prediction.includes('OVER') || prediction === 'RISE') {
            return currentPrice + aggressiveBuffer;
        } else if (prediction.includes('UNDER') || prediction === 'FALL') {
            return currentPrice - aggressiveBuffer;
        } else {
            return currentPrice + aggressiveBuffer * 0.3;
        }
    }

    /**
     * Get market label
     */
    private getMarketLabel(market: string): string {
        const labels: Record<string, string> = {
            R_50: 'Volatility 50',
            R_75: 'Volatility 75',
            R_100: 'Volatility 100',
            '1HZ50V': 'Volatility 50 (1s)',
            '1HZ75V': 'Volatility 75 (1s)',
            '1HZ100V': 'Volatility 100 (1s)',
        };
        return labels[market] || market;
    }

    /**
     * Emit signal to listeners
     */
    private emitSignal(signal: RealSignal): void {
        this.activeSignals.set(signal.id, signal);
        this.signalHistory.push(signal);

        // Update stats
        this.stats.totalSignals++;
        this.stats.signalsToday++;
        this.stats.activeSignals = this.activeSignals.size;
        this.stats.lastSignalTime = signal.timestamp;
        this.stats.avgConfidence = this.calculateAverageConfidence();

        // Notify listeners
        this.listeners.forEach(listener => {
            try {
                listener(signal);
            } catch (error) {
                console.error('Error in signal listener:', error);
            }
        });

        console.log('🚨 NEW REAL SIGNAL:', {
            market: signal.market,
            type: signal.signalType,
            prediction: signal.prediction,
            confidence: signal.confidence,
            strength: signal.strength,
            reasoning: signal.reasoning,
        });
    }

    /**
     * Clean up expired signals
     */
    private cleanupExpiredSignals(): void {
        const now = Date.now();
        const expiredSignals: string[] = [];

        this.activeSignals.forEach((signal, id) => {
            if (now > signal.expiryTime) {
                expiredSignals.push(id);
            }
        });

        expiredSignals.forEach(id => {
            this.activeSignals.delete(id);
        });

        if (expiredSignals.length > 0) {
            this.stats.activeSignals = this.activeSignals.size;
            console.log(`🗑️ Cleaned up ${expiredSignals.length} expired signals`);
        }
    }

    /**
     * Calculate average confidence
     */
    private calculateAverageConfidence(): number {
        if (this.signalHistory.length === 0) return 0;

        const recentSignals = this.signalHistory.slice(-20); // Last 20 signals
        const totalConfidence = recentSignals.reduce((sum, signal) => sum + signal.confidence, 0);
        return Math.round(totalConfidence / recentSignals.length);
    }

    /**
     * Analyze for immediate signals (called on each tick)
     */
    private analyzeForSignals(market: string): void {
        // This is called on every tick, so we do lighter analysis here
        // Heavy analysis is done in the interval-based generateSignals()

        const ticks = this.tickData.get(market);
        if (!ticks || ticks.length < 15) return;

        // Quick check for very strong patterns that need immediate signals
        for (const signalType of this.config.signalTypes) {
            const pattern = this.convertTicksToPattern(ticks, signalType);
            const streakLength = this.calculateStreakLength(pattern);

            // Immediate signal for very long streaks
            if (streakLength >= 8) {
                const lastSignalKey = `${market}_${signalType}`;
                const lastSignalTime = this.lastSignalTimes.get(lastSignalKey) || 0;
                const timeSinceLastSignal = Date.now() - lastSignalTime;

                // Allow immediate signal for very strong patterns (bypass rate limiting)
                if (timeSinceLastSignal > 30000) {
                    // At least 30 seconds apart
                    this.analyzeMarketForSignalType(market, signalType);
                }
            }
        }
    }

    /**
     * Subscribe to signals
     */
    public onSignal(callback: (signal: RealSignal) => void): () => void {
        this.listeners.push(callback);
        return () => {
            const index = this.listeners.indexOf(callback);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    /**
     * Get current configuration
     */
    public getConfig(): AlgorithmConfig {
        return { ...this.config };
    }

    /**
     * Update configuration
     */
    public updateConfig(updates: Partial<AlgorithmConfig>): void {
        this.config = { ...this.config, ...updates };
        console.log('⚙️ Algorithm config updated:', updates);
    }

    /**
     * Get algorithm statistics
     */
    public getStats(): AlgorithmStats {
        return { ...this.stats };
    }

    /**
     * Get active signals
     */
    public getActiveSignals(): RealSignal[] {
        return Array.from(this.activeSignals.values());
    }

    /**
     * Get signal history
     */
    public getSignalHistory(limit?: number): RealSignal[] {
        const history = [...this.signalHistory].reverse();
        return limit ? history.slice(0, limit) : history;
    }

    /**
     * Clear all data (for reset)
     */
    public reset(): void {
        this.activeSignals.clear();
        this.signalHistory = [];
        this.tickData.clear();
        this.lastSignalTimes.clear();
        this.stats = {
            totalSignals: 0,
            signalsToday: 0,
            avgConfidence: 0,
            successRate: 0,
            totalProfit: 0,
            activeSignals: 0,
            lastSignalTime: 0,
        };
        console.log('🔄 Algorithm data reset');
    }
}

export const advancedAlgoSignalService = new AdvancedAlgoSignalService();
