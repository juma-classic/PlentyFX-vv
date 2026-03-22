// Advanced AI Signal Intelligence Service
// Implements neural network-like pattern recognition and adaptive learning

interface NeuralSignalPattern {
    id: string;
    pattern: number[];
    outcome: 'WIN' | 'LOSS';
    confidence: number;
    timestamp: number;
    market: string;
    signalType: string;
    accuracy: number;
}

interface MarketSentiment {
    market: string;
    sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    strength: number; // 0-100
    volatility: number;
    trend: 'UP' | 'DOWN' | 'SIDEWAYS';
    momentum: number;
    timestamp: number;
}

interface AISignalPrediction {
    signalType:
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
    confidence: number;
    reasoning: string[];
    supportingPatterns: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    expectedAccuracy: number;
    marketSentiment: MarketSentiment;
    neuralScore: number;
    adaptiveWeight: number;
}

interface MultiTimeframeAnalysis {
    shortTerm: { trend: string; strength: number }; // 1-5 ticks
    mediumTerm: { trend: string; strength: number }; // 10-20 ticks
    longTerm: { trend: string; strength: number }; // 50-100 ticks
    consensus: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
    conflictLevel: number; // 0-100, higher = more conflicting signals
}

class AISignalIntelligenceService {
    private static instance: AISignalIntelligenceService;
    private neuralPatterns: Map<string, NeuralSignalPattern[]> = new Map();
    private marketSentiments: Map<string, MarketSentiment> = new Map();
    private adaptiveLearningData: Map<string, { accuracy: number; weight: number }> = new Map();

    // Neural network weights (simplified implementation)
    private neuralWeights = {
        patternRecognition: 0.35,
        sentimentAnalysis: 0.25,
        volatilityAnalysis: 0.2,
        momentumAnalysis: 0.2,
    };

    private constructor() {
        this.initializeAI();
    }

    public static getInstance(): AISignalIntelligenceService {
        if (!AISignalIntelligenceService.instance) {
            AISignalIntelligenceService.instance = new AISignalIntelligenceService();
        }
        return AISignalIntelligenceService.instance;
    }

    private initializeAI(): void {
        console.log('🧠 Initializing AI Signal Intelligence...');

        // Load historical patterns from localStorage
        this.loadHistoricalPatterns();

        // Initialize adaptive learning weights
        this.initializeAdaptiveLearning();

        console.log('✅ AI Signal Intelligence initialized');
    }

    private loadHistoricalPatterns(): void {
        try {
            const saved = localStorage.getItem('aiSignalPatterns');
            if (saved) {
                const patterns = JSON.parse(saved);
                Object.entries(patterns).forEach(([market, marketPatterns]) => {
                    this.neuralPatterns.set(market, marketPatterns as NeuralSignalPattern[]);
                });
                console.log('📚 Loaded historical patterns for', this.neuralPatterns.size, 'markets');
            }
        } catch (error) {
            console.warn('Failed to load historical patterns:', error);
        }
    }

    private initializeAdaptiveLearning(): void {
        const signalTypes = ['RISE', 'FALL', 'EVEN', 'ODD', 'OVER', 'UNDER'];
        signalTypes.forEach(type => {
            this.adaptiveLearningData.set(type, { accuracy: 0.5, weight: 1.0 });
        });
    }

    // Advanced Pattern Recognition using Neural Network-like approach
    public analyzeTickPattern(ticks: number[]): number {
        if (ticks.length < 10) return 0.5; // Not enough data

        // Extract features from tick pattern
        const features = this.extractPatternFeatures(ticks);

        // Apply neural network-like scoring
        let neuralScore = 0;

        // Use extracted features in scoring
        neuralScore += features[0] * 0.1; // MA5 contribution
        neuralScore += features[1] * 0.1; // MA10 contribution
        neuralScore += features[2] * 0.05; // StdDev contribution
        neuralScore += features[3] * 0.15; // Trend strength contribution
        neuralScore += features[4] * 0.1; // Entropy contribution

        // Pattern complexity analysis
        const complexity = this.calculatePatternComplexity(ticks);
        neuralScore += complexity * this.neuralWeights.patternRecognition;

        // Volatility analysis
        const volatility = this.calculateVolatility(ticks);
        neuralScore += volatility * this.neuralWeights.volatilityAnalysis;

        // Momentum analysis
        const momentum = this.calculateMomentum(ticks);
        neuralScore += momentum * this.neuralWeights.momentumAnalysis;

        // Normalize to 0-1 range
        return Math.max(0, Math.min(1, neuralScore));
    }

    private extractPatternFeatures(ticks: number[]): number[] {
        // Moving averages
        const ma5 = this.calculateMovingAverage(ticks, 5);
        const ma10 = this.calculateMovingAverage(ticks, 10);

        // Standard deviation
        const stdDev = this.calculateStandardDeviation(ticks);

        // Trend strength
        const trendStrength = this.calculateTrendStrength(ticks);

        // Digit distribution entropy
        const entropy = this.calculateDigitEntropy(ticks);

        return [ma5, ma10, stdDev, trendStrength, entropy];
    }

    private calculatePatternComplexity(ticks: number[]): number {
        // Measure how complex/unpredictable the pattern is
        let complexity = 0;

        for (let i = 1; i < ticks.length; i++) {
            const change = Math.abs(ticks[i] - ticks[i - 1]);
            complexity += change;
        }

        return complexity / ticks.length / 1000; // Normalize
    }

    private calculateVolatility(ticks: number[]): number {
        const mean = ticks.reduce((sum, tick) => sum + tick, 0) / ticks.length;
        const variance = ticks.reduce((sum, tick) => sum + Math.pow(tick - mean, 2), 0) / ticks.length;
        return Math.sqrt(variance) / mean; // Coefficient of variation
    }

    private calculateMomentum(ticks: number[]): number {
        if (ticks.length < 3) return 0;

        let momentum = 0;
        for (let i = 2; i < ticks.length; i++) {
            const acceleration = ticks[i] - ticks[i - 1] - (ticks[i - 1] - ticks[i - 2]);
            momentum += acceleration;
        }

        return momentum / (ticks.length - 2) / 1000; // Normalize
    }

    private calculateMovingAverage(ticks: number[], period: number): number {
        if (ticks.length < period) return ticks[ticks.length - 1] || 0;

        const slice = ticks.slice(-period);
        return slice.reduce((sum, tick) => sum + tick, 0) / period;
    }

    private calculateStandardDeviation(ticks: number[]): number {
        const mean = ticks.reduce((sum, tick) => sum + tick, 0) / ticks.length;
        const variance = ticks.reduce((sum, tick) => sum + Math.pow(tick - mean, 2), 0) / ticks.length;
        return Math.sqrt(variance);
    }

    private calculateTrendStrength(ticks: number[]): number {
        if (ticks.length < 2) return 0;

        let upMoves = 0;
        let downMoves = 0;

        for (let i = 1; i < ticks.length; i++) {
            if (ticks[i] > ticks[i - 1]) upMoves++;
            else if (ticks[i] < ticks[i - 1]) downMoves++;
        }

        const totalMoves = upMoves + downMoves;
        if (totalMoves === 0) return 0;

        return Math.abs(upMoves - downMoves) / totalMoves;
    }

    private calculateDigitEntropy(ticks: number[]): number {
        const digitCounts = new Array(10).fill(0);

        ticks.forEach(tick => {
            const lastDigit = Math.abs(Math.floor(tick * 100)) % 10;
            digitCounts[lastDigit]++;
        });

        // Calculate Shannon entropy
        let entropy = 0;
        const total = ticks.length;

        digitCounts.forEach(count => {
            if (count > 0) {
                const probability = count / total;
                entropy -= probability * Math.log2(probability);
            }
        });

        return entropy / Math.log2(10); // Normalize to 0-1
    }

    // Market Sentiment Analysis
    public analyzeMarketSentiment(marketSymbol: string, recentTicks: number[]): MarketSentiment {
        const sentiment = this.calculateSentiment(recentTicks);
        const volatility = this.calculateVolatility(recentTicks);
        const trend = this.determineTrend(recentTicks);
        const momentum = this.calculateMomentum(recentTicks);

        const marketSentiment: MarketSentiment = {
            market: marketSymbol,
            sentiment: sentiment.direction,
            strength: sentiment.strength,
            volatility: volatility * 100,
            trend: trend.direction,
            momentum: momentum * 100,
            timestamp: Date.now(),
        };

        this.marketSentiments.set(marketSymbol, marketSentiment);
        return marketSentiment;
    }

    private calculateSentiment(ticks: number[]): { direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; strength: number } {
        if (ticks.length < 5) return { direction: 'NEUTRAL', strength: 50 };

        const shortMA = this.calculateMovingAverage(ticks, 5);
        const longMA = this.calculateMovingAverage(ticks, Math.min(10, ticks.length));

        const difference = shortMA - longMA;
        const strength = Math.min(100, Math.abs(difference) * 1000);

        if (difference > 0.001) return { direction: 'BULLISH', strength };
        if (difference < -0.001) return { direction: 'BEARISH', strength };
        return { direction: 'NEUTRAL', strength: 50 };
    }

    private determineTrend(ticks: number[]): { direction: 'UP' | 'DOWN' | 'SIDEWAYS'; strength: number } {
        if (ticks.length < 3) return { direction: 'SIDEWAYS', strength: 0 };

        const first = ticks[0];
        const last = ticks[ticks.length - 1];
        const change = (last - first) / first;

        const strength = Math.abs(change) * 100;

        if (change > 0.002) return { direction: 'UP', strength };
        if (change < -0.002) return { direction: 'DOWN', strength };
        return { direction: 'SIDEWAYS', strength };
    }

    // Multi-timeframe Analysis
    public performMultiTimeframeAnalysis(allTicks: number[]): MultiTimeframeAnalysis {
        const shortTerm = this.analyzeTimeframe(allTicks.slice(-5)); // Last 5 ticks
        const mediumTerm = this.analyzeTimeframe(allTicks.slice(-15)); // Last 15 ticks
        const longTerm = this.analyzeTimeframe(allTicks.slice(-50)); // Last 50 ticks

        const consensus = this.determineConsensus(shortTerm, mediumTerm, longTerm);
        const conflictLevel = this.calculateConflictLevel(shortTerm, mediumTerm, longTerm);

        return {
            shortTerm,
            mediumTerm,
            longTerm,
            consensus,
            conflictLevel,
        };
    }

    private analyzeTimeframe(ticks: number[]): { trend: string; strength: number } {
        if (ticks.length < 2) return { trend: 'NEUTRAL', strength: 0 };

        const trendAnalysis = this.determineTrend(ticks);
        return {
            trend: trendAnalysis.direction,
            strength: trendAnalysis.strength,
        };
    }

    private determineConsensus(
        short: any,
        medium: any,
        long: any
    ): 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL' {
        const trends = [short.trend, medium.trend, long.trend];
        const upCount = trends.filter(t => t === 'UP').length;
        const downCount = trends.filter(t => t === 'DOWN').length;

        if (upCount === 3) return 'STRONG_BUY';
        if (upCount === 2) return 'BUY';
        if (downCount === 3) return 'STRONG_SELL';
        if (downCount === 2) return 'SELL';
        return 'NEUTRAL';
    }

    private calculateConflictLevel(short: any, medium: any, long: any): number {
        const trends = [short.trend, medium.trend, long.trend];
        const uniqueTrends = new Set(trends).size;

        // More unique trends = more conflict
        return ((uniqueTrends - 1) / 2) * 100; // 0-100 scale
    }

    // Advanced AI Signal Generation
    public generateAISignal(market: string, recentTicks: number[]): AISignalPrediction | null {
        if (recentTicks.length < 20) return null;

        console.log('🧠 Generating AI signal for', market, 'with', recentTicks.length, 'ticks');

        // Perform comprehensive analysis
        const neuralScore = this.analyzeTickPattern(recentTicks);
        const sentiment = this.analyzeMarketSentiment(market, recentTicks);
        const multiTimeframe = this.performMultiTimeframeAnalysis(recentTicks);

        // Determine signal type based on AI analysis
        const signalType = this.determineOptimalSignalType(recentTicks, sentiment, multiTimeframe);

        // Calculate confidence using multiple factors
        const confidence = this.calculateAIConfidence(neuralScore, sentiment, multiTimeframe);

        // Generate reasoning
        const reasoning = this.generateReasoning(sentiment, multiTimeframe, neuralScore);

        // Determine risk level
        const riskLevel = this.assessRiskLevel(sentiment.volatility, multiTimeframe.conflictLevel);

        // Calculate expected accuracy based on historical performance
        const expectedAccuracy = this.calculateExpectedAccuracy(signalType, market);

        // Get adaptive weight for this signal type
        const adaptiveWeight = this.adaptiveLearningData.get(signalType)?.weight || 1.0;

        const prediction: AISignalPrediction = {
            signalType,
            confidence,
            reasoning,
            supportingPatterns: this.identifySupportingPatterns(recentTicks),
            riskLevel,
            expectedAccuracy,
            marketSentiment: sentiment,
            neuralScore,
            adaptiveWeight,
        };

        console.log('🎯 AI Signal Generated:', {
            type: signalType,
            confidence: confidence.toFixed(1) + '%',
            neuralScore: neuralScore.toFixed(3),
            sentiment: sentiment.sentiment,
            riskLevel,
        });

        return prediction;
    }

    private determineOptimalSignalType(
        ticks: number[],
        sentiment: MarketSentiment,
        multiTimeframe: MultiTimeframeAnalysis
    ):
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
        | 'UNDER5' {
        // Analyze last digit patterns for EVEN/ODD
        const lastDigits = ticks.slice(-10).map(tick => Math.abs(Math.floor(tick * 100)) % 10);
        const evenCount = lastDigits.filter(d => d % 2 === 0).length;
        const oddCount = lastDigits.length - evenCount;

        // Analyze price movement for RISE/FALL
        const priceChange = ticks[ticks.length - 1] - ticks[ticks.length - 5];

        // Use sentiment and timeframe analysis to determine best signal type
        if (multiTimeframe.consensus === 'STRONG_BUY' || multiTimeframe.consensus === 'BUY') {
            return 'RISE';
        } else if (multiTimeframe.consensus === 'STRONG_SELL' || multiTimeframe.consensus === 'SELL') {
            return 'FALL';
        } else if (sentiment.sentiment === 'BULLISH' && sentiment.strength > 70) {
            return 'RISE'; // Strong bullish sentiment
        } else if (sentiment.sentiment === 'BEARISH' && sentiment.strength > 70) {
            return 'FALL'; // Strong bearish sentiment
        } else if (evenCount > oddCount + 2) {
            return 'ODD'; // Contrarian approach
        } else if (oddCount > evenCount + 2) {
            return 'EVEN'; // Contrarian approach
        } else {
            // Analyze digit distribution for OVER/UNDER signals
            const digitCounts = new Array(10).fill(0);
            lastDigits.forEach(digit => digitCounts[digit]++);

            // Find the most frequent digit range
            const lowCount = digitCounts.slice(0, 5).reduce((sum, count) => sum + count, 0);
            const highCount = digitCounts.slice(5).reduce((sum, count) => sum + count, 0);

            if (lowCount > highCount + 2) {
                // More low digits, predict UNDER with appropriate threshold
                if (lowCount > 7) return 'UNDER1';
                if (lowCount > 6) return 'UNDER2';
                if (lowCount > 5) return 'UNDER3';
                return 'UNDER4';
            } else if (highCount > lowCount + 2) {
                // More high digits, predict OVER with appropriate threshold
                if (highCount > 7) return 'OVER5';
                if (highCount > 6) return 'OVER4';
                if (highCount > 5) return 'OVER3';
                return 'OVER2';
            } else {
                // Default to trend-following
                return priceChange > 0 ? 'RISE' : 'FALL';
            }
        }
    }

    private calculateAIConfidence(
        neuralScore: number,
        sentiment: MarketSentiment,
        multiTimeframe: MultiTimeframeAnalysis
    ): number {
        let confidence = 50; // Base confidence

        // Neural score contribution (0-30 points)
        confidence += neuralScore * 30;

        // Sentiment strength contribution (0-20 points)
        confidence += (sentiment.strength / 100) * 20;

        // Timeframe consensus contribution (0-25 points)
        if (multiTimeframe.consensus === 'STRONG_BUY' || multiTimeframe.consensus === 'STRONG_SELL') {
            confidence += 25;
        } else if (multiTimeframe.consensus === 'BUY' || multiTimeframe.consensus === 'SELL') {
            confidence += 15;
        }

        // Reduce confidence based on conflict level (0-15 points reduction)
        confidence -= (multiTimeframe.conflictLevel / 100) * 15;

        // Ensure confidence is within valid range
        return Math.max(30, Math.min(95, confidence));
    }

    private generateReasoning(
        sentiment: MarketSentiment,
        multiTimeframe: MultiTimeframeAnalysis,
        neuralScore: number
    ): string[] {
        const reasoning: string[] = [];

        reasoning.push(`Market sentiment: ${sentiment.sentiment} (${sentiment.strength.toFixed(1)}% strength)`);
        reasoning.push(`Neural pattern score: ${(neuralScore * 100).toFixed(1)}%`);
        reasoning.push(`Multi-timeframe consensus: ${multiTimeframe.consensus}`);
        reasoning.push(`Volatility level: ${sentiment.volatility.toFixed(1)}%`);

        if (multiTimeframe.conflictLevel > 50) {
            reasoning.push(`⚠️ High timeframe conflict detected (${multiTimeframe.conflictLevel.toFixed(1)}%)`);
        }

        return reasoning;
    }

    private identifySupportingPatterns(ticks: number[]): string[] {
        const patterns: string[] = [];

        // Check for common patterns
        if (this.detectDoubleTop(ticks)) patterns.push('Double Top Pattern');
        if (this.detectDoubleBottom(ticks)) patterns.push('Double Bottom Pattern');
        if (this.detectTrendReversal(ticks)) patterns.push('Trend Reversal Signal');
        if (this.detectBreakout(ticks)) patterns.push('Breakout Pattern');

        return patterns;
    }

    private detectDoubleTop(ticks: number[]): boolean {
        if (ticks.length < 10) return false;

        const recent = ticks.slice(-10);
        const max1 = Math.max(...recent.slice(0, 5));
        const max2 = Math.max(...recent.slice(5));

        return Math.abs(max1 - max2) / max1 < 0.001; // Within 0.1%
    }

    private detectDoubleBottom(ticks: number[]): boolean {
        if (ticks.length < 10) return false;

        const recent = ticks.slice(-10);
        const min1 = Math.min(...recent.slice(0, 5));
        const min2 = Math.min(...recent.slice(5));

        return Math.abs(min1 - min2) / min1 < 0.001; // Within 0.1%
    }

    private detectTrendReversal(ticks: number[]): boolean {
        if (ticks.length < 15) return false;

        const early = ticks.slice(-15, -10);
        const recent = ticks.slice(-5);

        const earlyTrend = this.determineTrend(early);
        const recentTrend = this.determineTrend(recent);

        return earlyTrend.direction !== recentTrend.direction && earlyTrend.strength > 30 && recentTrend.strength > 30;
    }

    private detectBreakout(ticks: number[]): boolean {
        if (ticks.length < 20) return false;

        const baseline = ticks.slice(-20, -5);
        const recent = ticks.slice(-5);

        const baselineRange = Math.max(...baseline) - Math.min(...baseline);
        const recentMove = Math.abs(recent[recent.length - 1] - baseline[baseline.length - 1]);

        return recentMove > baselineRange * 0.5; // Move > 50% of recent range
    }

    private assessRiskLevel(volatility: number, conflictLevel: number): 'LOW' | 'MEDIUM' | 'HIGH' {
        const riskScore = volatility + conflictLevel;

        if (riskScore > 150) return 'HIGH';
        if (riskScore > 100) return 'MEDIUM';
        return 'LOW';
    }

    private calculateExpectedAccuracy(signalType: string, market: string): number {
        const patterns = this.neuralPatterns.get(market) || [];
        const relevantPatterns = patterns.filter(p => p.signalType === signalType);

        if (relevantPatterns.length === 0) return 65; // Default expectation

        const winRate = relevantPatterns.filter(p => p.outcome === 'WIN').length / relevantPatterns.length;
        return winRate * 100;
    }

    // Adaptive Learning System
    public updateLearningData(signalType: string, outcome: 'WIN' | 'LOSS', marketSymbol: string): void {
        const current = this.adaptiveLearningData.get(signalType) || { accuracy: 0.5, weight: 1.0 };

        // Update accuracy with exponential moving average
        const newAccuracy = outcome === 'WIN' ? 1 : 0;
        current.accuracy = current.accuracy * 0.9 + newAccuracy * 0.1;

        // Adjust weight based on performance
        if (current.accuracy > 0.7) {
            current.weight = Math.min(2.0, current.weight * 1.05); // Increase weight for good performers
        } else if (current.accuracy < 0.4) {
            current.weight = Math.max(0.5, current.weight * 0.95); // Decrease weight for poor performers
        }

        this.adaptiveLearningData.set(signalType, current);

        console.log(
            `📚 Learning Update [${marketSymbol}]: ${signalType} - Accuracy: ${(current.accuracy * 100).toFixed(1)}%, Weight: ${current.weight.toFixed(2)}`
        );
    }

    // Save patterns for future learning
    public savePattern(pattern: Omit<NeuralSignalPattern, 'id' | 'timestamp'>): void {
        const id = `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const fullPattern: NeuralSignalPattern = {
            ...pattern,
            id,
            timestamp: Date.now(),
        };

        const marketPatterns = this.neuralPatterns.get(pattern.market) || [];
        marketPatterns.push(fullPattern);

        // Keep only last 500 patterns per market
        if (marketPatterns.length > 500) {
            marketPatterns.splice(0, marketPatterns.length - 500);
        }

        this.neuralPatterns.set(pattern.market, marketPatterns);

        // Save to localStorage
        this.savePatterns();
    }

    private savePatterns(): void {
        try {
            const patternsObj: Record<string, NeuralSignalPattern[]> = {};
            this.neuralPatterns.forEach((patterns, market) => {
                patternsObj[market] = patterns;
            });
            localStorage.setItem('aiSignalPatterns', JSON.stringify(patternsObj));
        } catch (error) {
            console.warn('Failed to save patterns:', error);
        }
    }

    // Get AI performance metrics
    public getAIMetrics(): {
        totalPatterns: number;
        averageAccuracy: number;
        bestPerformingSignal: string;
        worstPerformingSignal: string;
        adaptiveWeights: Record<string, number>;
    } {
        let totalPatterns = 0;
        this.neuralPatterns.forEach(patterns => {
            totalPatterns += patterns.length;
        });

        const accuracies = Array.from(this.adaptiveLearningData.values()).map(d => d.accuracy);
        const averageAccuracy =
            accuracies.length > 0 ? accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length : 0;

        let bestSignal = 'NONE';
        let worstSignal = 'NONE';
        let bestAccuracy = 0;
        let worstAccuracy = 1;

        const weights: Record<string, number> = {};

        this.adaptiveLearningData.forEach((data, signalType) => {
            if (data.accuracy > bestAccuracy) {
                bestAccuracy = data.accuracy;
                bestSignal = signalType;
            }
            if (data.accuracy < worstAccuracy) {
                worstAccuracy = data.accuracy;
                worstSignal = signalType;
            }
            weights[signalType] = data.weight;
        });

        return {
            totalPatterns,
            averageAccuracy: averageAccuracy * 100,
            bestPerformingSignal: bestSignal,
            worstPerformingSignal: worstSignal,
            adaptiveWeights: weights,
        };
    }
}

export const aiSignalIntelligence = AISignalIntelligenceService.getInstance();
