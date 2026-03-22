/**
 * Probability Calculator Service
 * Calculates win probability based on pattern analysis
 * Updates in real-time with each new tick
 */

export interface ProbabilityFactors {
    streakLength: number;
    distribution: { type1: number; type2: number };
    volatility: number;
    momentum: number;
    timeOfDay: number;
}

export interface ProbabilityResult {
    probability: number; // 0-100
    confidence: number; // 0-100
    factors: ProbabilityFactors;
    recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
    minProbability: number;
    maxProbability: number;
}

export interface HistoricalAccuracy {
    totalPredictions: number;
    correctPredictions: number;
    accuracy: number; // percentage
    lastUpdated: number;
}

class ProbabilityCalculatorService {
    private static instance: ProbabilityCalculatorService;
    private historicalAccuracy: HistoricalAccuracy = {
        totalPredictions: 0,
        correctPredictions: 0,
        accuracy: 0,
        lastUpdated: Date.now(),
    };

    private constructor() {}

    public static getInstance(): ProbabilityCalculatorService {
        if (!ProbabilityCalculatorService.instance) {
            ProbabilityCalculatorService.instance = new ProbabilityCalculatorService();
        }
        return ProbabilityCalculatorService.instance;
    }

    /**
     * Calculate win probability based on current pattern
     */
    public calculateProbability(pattern: string[]): ProbabilityResult {
        if (pattern.length < 5) {
            return this.getDefaultResult();
        }

        const factors = this.analyzeFactors(pattern);
        const baseProbability = this.calculateBaseProbability(factors);
        const confidence = this.calculateConfidence(factors);
        const { minProbability, maxProbability } = this.calculateConfidenceInterval(baseProbability, confidence);
        const recommendation = this.getRecommendation(baseProbability, confidence);

        return {
            probability: Math.round(baseProbability),
            confidence: Math.round(confidence),
            factors,
            recommendation,
            minProbability: Math.round(minProbability),
            maxProbability: Math.round(maxProbability),
        };
    }

    /**
     * Analyze pattern factors
     */
    private analyzeFactors(pattern: string[]): ProbabilityFactors {
        const streakLength = this.calculateStreakLength(pattern);
        const distribution = this.calculateDistribution(pattern);
        const volatility = this.calculateVolatility(pattern);
        const momentum = this.calculateMomentum(pattern);
        const timeOfDay = this.getTimeOfDayFactor();

        return {
            streakLength,
            distribution,
            volatility,
            momentum,
            timeOfDay,
        };
    }

    /**
     * Calculate current streak length
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
     * Calculate distribution of pattern types
     */
    private calculateDistribution(pattern: string[]): { type1: number; type2: number } {
        const counts: Record<string, number> = {};

        pattern.forEach(p => {
            counts[p] = (counts[p] || 0) + 1;
        });

        const types = Object.keys(counts);
        return {
            type1: counts[types[0]] || 0,
            type2: counts[types[1]] || 0,
        };
    }

    /**
     * Calculate pattern volatility (how often it changes)
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
     * Calculate momentum (trend strength)
     */
    private calculateMomentum(pattern: string[]): number {
        if (pattern.length < 3) return 0;

        const recent = pattern.slice(-6);
        const counts: Record<string, number> = {};

        recent.forEach(p => {
            counts[p] = (counts[p] || 0) + 1;
        });

        const values = Object.values(counts);
        const max = Math.max(...values);
        const total = recent.length;

        return (max / total) * 100;
    }

    /**
     * Get time of day factor (some patterns are stronger at certain times)
     */
    private getTimeOfDayFactor(): number {
        const hour = new Date().getHours();

        // Market activity patterns
        if (hour >= 8 && hour <= 12) return 1.1; // Morning high activity
        if (hour >= 13 && hour <= 17) return 1.05; // Afternoon moderate
        if (hour >= 18 && hour <= 22) return 1.0; // Evening normal
        return 0.95; // Night low activity
    }

    /**
     * Calculate base probability
     */
    private calculateBaseProbability(factors: ProbabilityFactors): number {
        let probability = 50; // Base 50%

        // Streak factor (longer streak = higher probability of reversal)
        if (factors.streakLength >= 5) {
            probability += Math.min(factors.streakLength * 3, 25);
        }

        // Distribution imbalance
        const total = factors.distribution.type1 + factors.distribution.type2;
        const imbalance = Math.abs(factors.distribution.type1 - factors.distribution.type2);
        const imbalancePercent = (imbalance / total) * 100;

        if (imbalancePercent >= 30) {
            probability += Math.min(imbalancePercent / 2, 20);
        }

        // Volatility adjustment (high volatility = less predictable)
        if (factors.volatility > 60) {
            probability -= 10;
        } else if (factors.volatility < 30) {
            probability += 5;
        }

        // Momentum boost
        if (factors.momentum > 70) {
            probability += 5;
        }

        // Time of day adjustment
        probability *= factors.timeOfDay;

        return Math.max(20, Math.min(95, probability));
    }

    /**
     * Calculate confidence level
     */
    private calculateConfidence(factors: ProbabilityFactors): number {
        let confidence = 50;

        // More data = higher confidence
        const dataPoints = factors.distribution.type1 + factors.distribution.type2;
        if (dataPoints >= 18) confidence += 20;
        else if (dataPoints >= 10) confidence += 10;

        // Strong patterns = higher confidence
        if (factors.streakLength >= 7) confidence += 15;
        if (factors.momentum > 70) confidence += 10;

        // Low volatility = higher confidence
        if (factors.volatility < 40) confidence += 10;

        // Historical accuracy boost
        if (this.historicalAccuracy.accuracy > 70) {
            confidence += 5;
        }

        return Math.max(30, Math.min(95, confidence));
    }

    /**
     * Calculate confidence interval
     */
    private calculateConfidenceInterval(
        probability: number,
        confidence: number
    ): { minProbability: number; maxProbability: number } {
        const margin = ((100 - confidence) / 100) * 20; // Max ±20%

        return {
            minProbability: Math.max(20, probability - margin),
            maxProbability: Math.min(95, probability + margin),
        };
    }

    /**
     * Get trading recommendation
     */
    private getRecommendation(
        probability: number,
        confidence: number
    ): 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL' {
        const score = (probability + confidence) / 2;

        if (score >= 80) return 'STRONG_BUY';
        if (score >= 65) return 'BUY';
        if (score >= 45) return 'HOLD';
        if (score >= 30) return 'SELL';
        return 'STRONG_SELL';
    }

    /**
     * Get default result for insufficient data
     */
    private getDefaultResult(): ProbabilityResult {
        return {
            probability: 50,
            confidence: 30,
            factors: {
                streakLength: 0,
                distribution: { type1: 0, type2: 0 },
                volatility: 0,
                momentum: 0,
                timeOfDay: 1.0,
            },
            recommendation: 'HOLD',
            minProbability: 40,
            maxProbability: 60,
        };
    }

    /**
     * Update historical accuracy
     */
    public updateAccuracy(predicted: boolean, actual: boolean): void {
        this.historicalAccuracy.totalPredictions++;
        if (predicted === actual) {
            this.historicalAccuracy.correctPredictions++;
        }

        this.historicalAccuracy.accuracy =
            (this.historicalAccuracy.correctPredictions / this.historicalAccuracy.totalPredictions) * 100;
        this.historicalAccuracy.lastUpdated = Date.now();
    }

    /**
     * Get historical accuracy
     */
    public getHistoricalAccuracy(): HistoricalAccuracy {
        return { ...this.historicalAccuracy };
    }

    /**
     * Reset historical accuracy
     */
    public resetAccuracy(): void {
        this.historicalAccuracy = {
            totalPredictions: 0,
            correctPredictions: 0,
            accuracy: 0,
            lastUpdated: Date.now(),
        };
    }
}

export const probabilityCalculator = ProbabilityCalculatorService.getInstance();
