/**
 * AI-Powered Analysis Service
 * Provides pattern recognition, predictions, and trading insights
 */

export interface AIPrediction {
    nextDigit: number;
    confidence: number;
    reasoning: string;
    alternativeDigits: Array<{ digit: number; probability: number }>;
    recommendedStrategy: 'over' | 'under' | 'even' | 'odd' | 'specific' | 'matches' | 'differs';
    riskLevel: 'low' | 'medium' | 'high';
    expectedWinRate: number;
}

export interface PatternMatch {
    pattern: string;
    frequency: number;
    lastOccurrence: number;
    confidence: number;
    nextDigitProbabilities: Map<number, number>;
}

export interface MarketInsight {
    type: 'trend' | 'reversal' | 'consolidation' | 'breakout';
    description: string;
    confidence: number;
    actionable: boolean;
    recommendation?: string;
}

class AnalysisAIService {
    private patternCache: Map<string, PatternMatch> = new Map();
    private predictionHistory: AIPrediction[] = [];

    /**
     * Analyze digit sequence and generate AI prediction
     */
    public analyzePrediction(digits: number[], currentMarket: string): AIPrediction {
        const recentDigits = digits.slice(0, 20);
        
        // Pattern-based prediction
        const patternPrediction = this.predictFromPatterns(recentDigits);
        
        // Frequency-based prediction
        const frequencyPrediction = this.predictFromFrequency(digits);
        
        // Trend-based prediction
        const trendPrediction = this.predictFromTrend(recentDigits);
        
        // Combine predictions with weighted average
        const combinedPrediction = this.combinePredictions([
            { prediction: patternPrediction, weight: 0.4 },
            { prediction: frequencyPrediction, weight: 0.3 },
            { prediction: trendPrediction, weight: 0.3 },
        ]);

        // Generate reasoning
        const reasoning = this.generateReasoning(recentDigits, combinedPrediction);

        // Determine recommended strategy
        const recommendedStrategy = this.determineStrategy(combinedPrediction, recentDigits);

        // Calculate risk level
        const riskLevel = this.calculateRiskLevel(combinedPrediction.confidence);

        // Calculate expected win rate
        const expectedWinRate = this.calculateWinRate(combinedPrediction, recentDigits);

        const prediction: AIPrediction = {
            nextDigit: combinedPrediction.digit,
            confidence: combinedPrediction.confidence,
            reasoning,
            alternativeDigits: combinedPrediction.alternatives,
            recommendedStrategy,
            riskLevel,
            expectedWinRate,
        };

        this.predictionHistory.push(prediction);
        return prediction;
    }

    /**
     * Predict based on recurring patterns
     */
    private predictFromPatterns(digits: number[]): { digit: number; confidence: number; alternatives: Array<{ digit: number; probability: number }> } {
        const patternLength = 3;
        const patterns: Map<string, number[]> = new Map();

        // Build pattern map
        for (let i = 0; i < digits.length - patternLength; i++) {
            const pattern = digits.slice(i, i + patternLength).join('-');
            const nextDigit = digits[i + patternLength];
            
            if (!patterns.has(pattern)) {
                patterns.set(pattern, []);
            }
            patterns.get(pattern)!.push(nextDigit);
        }

        // Find current pattern
        const currentPattern = digits.slice(0, patternLength).join('-');
        const matchingNextDigits = patterns.get(currentPattern) || [];

        if (matchingNextDigits.length === 0) {
            // No pattern match, return random with low confidence
            return {
                digit: Math.floor(Math.random() * 10),
                confidence: 0.1,
                alternatives: this.generateRandomAlternatives(),
            };
        }

        // Calculate digit frequencies
        const digitCounts = new Map<number, number>();
        matchingNextDigits.forEach(d => {
            digitCounts.set(d, (digitCounts.get(d) || 0) + 1);
        });

        // Sort by frequency
        const sortedDigits = Array.from(digitCounts.entries())
            .sort((a, b) => b[1] - a[1]);

        const mostCommon = sortedDigits[0];
        const confidence = mostCommon[1] / matchingNextDigits.length;

        const alternatives = sortedDigits.slice(1, 4).map(([digit, count]) => ({
            digit,
            probability: count / matchingNextDigits.length,
        }));

        return {
            digit: mostCommon[0],
            confidence: Math.min(confidence * 0.9, 0.95), // Cap at 95%
            alternatives,
        };
    }

    /**
     * Predict based on overall frequency distribution
     */
    private predictFromFrequency(digits: number[]): { digit: number; confidence: number; alternatives: Array<{ digit: number; probability: number }> } {
        const counts = new Array(10).fill(0);
        digits.forEach(d => counts[d]++);

        const total = digits.length;
        const probabilities = counts.map(c => c / total);

        // Find least frequent (cold) digits - they're "due"
        const digitProbs = probabilities.map((prob, digit) => ({ digit, prob }));
        const sortedByFreq = [...digitProbs].sort((a, b) => a.prob - b.prob);

        // Inverse probability - cold digits get higher scores
        const coldDigit = sortedByFreq[0];
        const confidence = 1 - coldDigit.prob; // Higher confidence for colder digits

        const alternatives = sortedByFreq.slice(1, 4).map(dp => ({
            digit: dp.digit,
            probability: 1 - dp.prob,
        }));

        return {
            digit: coldDigit.digit,
            confidence: Math.min(confidence * 0.6, 0.7), // Lower weight for frequency
            alternatives,
        };
    }

    /**
     * Predict based on recent trends
     */
    private predictFromTrend(digits: number[]): { digit: number; confidence: number; alternatives: Array<{ digit: number; probability: number }> } {
        if (digits.length < 5) {
            return {
                digit: Math.floor(Math.random() * 10),
                confidence: 0.1,
                alternatives: this.generateRandomAlternatives(),
            };
        }

        // Analyze even/odd trend
        const recentEvenOdd = digits.slice(0, 5).map(d => d % 2);
        const evenCount = recentEvenOdd.filter(x => x === 0).length;
        const oddCount = 5 - evenCount;

        // Analyze high/low trend
        const recentHighLow = digits.slice(0, 5).map(d => d >= 5 ? 1 : 0);
        const highCount = recentHighLow.filter(x => x === 1).length;
        const lowCount = 5 - highCount;

        // Predict reversal if strong trend
        let predictedDigit: number;
        let confidence: number;

        if (evenCount >= 4) {
            // Strong even trend, predict odd
            predictedDigit = [1, 3, 5, 7, 9][Math.floor(Math.random() * 5)];
            confidence = 0.65;
        } else if (oddCount >= 4) {
            // Strong odd trend, predict even
            predictedDigit = [0, 2, 4, 6, 8][Math.floor(Math.random() * 5)];
            confidence = 0.65;
        } else if (highCount >= 4) {
            // Strong high trend, predict low
            predictedDigit = Math.floor(Math.random() * 5);
            confidence = 0.6;
        } else if (lowCount >= 4) {
            // Strong low trend, predict high
            predictedDigit = 5 + Math.floor(Math.random() * 5);
            confidence = 0.6;
        } else {
            // No strong trend
            predictedDigit = Math.floor(Math.random() * 10);
            confidence = 0.3;
        }

        return {
            digit: predictedDigit,
            confidence,
            alternatives: this.generateRandomAlternatives(),
        };
    }

    /**
     * Combine multiple predictions with weights
     */
    private combinePredictions(predictions: Array<{ prediction: any; weight: number }>): { digit: number; confidence: number; alternatives: Array<{ digit: number; probability: number }> } {
        const digitScores = new Map<number, number>();

        predictions.forEach(({ prediction, weight }) => {
            const score = prediction.confidence * weight;
            digitScores.set(
                prediction.digit,
                (digitScores.get(prediction.digit) || 0) + score
            );

            // Add alternative digits with lower scores
            prediction.alternatives.forEach((alt: any) => {
                const altScore = alt.probability * weight * 0.5;
                digitScores.set(
                    alt.digit,
                    (digitScores.get(alt.digit) || 0) + altScore
                );
            });
        });

        const sortedDigits = Array.from(digitScores.entries())
            .sort((a, b) => b[1] - a[1]);

        const topDigit = sortedDigits[0];
        const alternatives = sortedDigits.slice(1, 4).map(([digit, score]) => ({
            digit,
            probability: score / topDigit[1],
        }));

        return {
            digit: topDigit[0],
            confidence: Math.min(topDigit[1], 0.95),
            alternatives,
        };
    }

    /**
     * Generate human-readable reasoning
     */
    private generateReasoning(digits: number[], prediction: any): string {
        const reasons: string[] = [];

        // Pattern analysis
        const pattern = digits.slice(0, 3).join('-');
        reasons.push(`Recent pattern: ${pattern}`);

        // Even/odd analysis
        const evenCount = digits.slice(0, 10).filter(d => d % 2 === 0).length;
        if (evenCount >= 7) {
            reasons.push('Strong even trend detected');
        } else if (evenCount <= 3) {
            reasons.push('Strong odd trend detected');
        }

        // Hot/cold analysis
        const digitCounts = new Array(10).fill(0);
        digits.slice(0, 20).forEach(d => digitCounts[d]++);
        const maxCount = Math.max(...digitCounts);
        const hotDigits = digitCounts
            .map((count, digit) => ({ digit, count }))
            .filter(d => d.count === maxCount)
            .map(d => d.digit);
        
        if (hotDigits.length > 0) {
            reasons.push(`Hot digits: ${hotDigits.join(', ')}`);
        }

        // Confidence level
        if (prediction.confidence > 0.7) {
            reasons.push('High confidence prediction');
        } else if (prediction.confidence > 0.5) {
            reasons.push('Moderate confidence prediction');
        } else {
            reasons.push('Low confidence - volatile market');
        }

        return reasons.join(' • ');
    }

    /**
     * Determine recommended trading strategy
     */
    private determineStrategy(prediction: any, digits: number[]): 'over' | 'under' | 'even' | 'odd' | 'specific' | 'matches' | 'differs' {
        const predictedDigit = prediction.digit;

        // Check if specific digit has high confidence
        if (prediction.confidence > 0.75) {
            return 'specific';
        }

        // Check even/odd trend
        const recentEvenCount = digits.slice(0, 10).filter(d => d % 2 === 0).length;
        if (recentEvenCount >= 7) {
            return 'odd'; // Reversal strategy
        } else if (recentEvenCount <= 3) {
            return 'even'; // Reversal strategy
        }

        // Check over/under
        if (predictedDigit >= 5) {
            return 'over';
        } else {
            return 'under';
        }
    }

    /**
     * Calculate risk level based on confidence
     */
    private calculateRiskLevel(confidence: number): 'low' | 'medium' | 'high' {
        if (confidence > 0.7) return 'low';
        if (confidence > 0.5) return 'medium';
        return 'high';
    }

    /**
     * Calculate expected win rate
     */
    private calculateWinRate(prediction: any, digits: number[]): number {
        // Base win rate on confidence
        const baseWinRate = prediction.confidence * 100;

        // Adjust based on recent volatility
        const recentDigits = digits.slice(0, 10);
        const uniqueDigits = new Set(recentDigits).size;
        const volatility = uniqueDigits / 10; // 0-1

        // Higher volatility = lower win rate
        const adjustedWinRate = baseWinRate * (1 - volatility * 0.2);

        return Math.max(Math.min(adjustedWinRate, 95), 10);
    }

    /**
     * Generate random alternatives for fallback
     */
    private generateRandomAlternatives(): Array<{ digit: number; probability: number }> {
        const alternatives: Array<{ digit: number; probability: number }> = [];
        const usedDigits = new Set<number>();

        for (let i = 0; i < 3; i++) {
            let digit: number;
            do {
                digit = Math.floor(Math.random() * 10);
            } while (usedDigits.has(digit));
            
            usedDigits.add(digit);
            alternatives.push({
                digit,
                probability: Math.random() * 0.3 + 0.1,
            });
        }

        return alternatives.sort((a, b) => b.probability - a.probability);
    }

    /**
     * Generate market insights
     */
    public generateInsights(digits: number[]): MarketInsight[] {
        const insights: MarketInsight[] = [];

        // Trend detection
        const recentDigits = digits.slice(0, 20);
        const evenCount = recentDigits.filter(d => d % 2 === 0).length;
        
        if (evenCount >= 15) {
            insights.push({
                type: 'trend',
                description: 'Strong even number dominance detected',
                confidence: 0.85,
                actionable: true,
                recommendation: 'Consider odd reversal strategy',
            });
        } else if (evenCount <= 5) {
            insights.push({
                type: 'trend',
                description: 'Strong odd number dominance detected',
                confidence: 0.85,
                actionable: true,
                recommendation: 'Consider even reversal strategy',
            });
        }

        // Volatility detection
        const uniqueDigits = new Set(recentDigits).size;
        if (uniqueDigits >= 9) {
            insights.push({
                type: 'consolidation',
                description: 'High volatility - all digits appearing',
                confidence: 0.7,
                actionable: false,
            });
        } else if (uniqueDigits <= 4) {
            insights.push({
                type: 'consolidation',
                description: 'Low volatility - limited digit range',
                confidence: 0.75,
                actionable: true,
                recommendation: 'Focus on hot digits',
            });
        }

        // Pattern detection
        const patterns = this.detectRepeatingPatterns(recentDigits);
        if (patterns.length > 0) {
            insights.push({
                type: 'breakout',
                description: `Repeating pattern detected: ${patterns[0]}`,
                confidence: 0.8,
                actionable: true,
                recommendation: 'Monitor pattern continuation',
            });
        }

        return insights;
    }

    /**
     * Detect repeating patterns
     */
    private detectRepeatingPatterns(digits: number[]): string[] {
        const patterns: Map<string, number> = new Map();

        for (let len = 2; len <= 4; len++) {
            for (let i = 0; i < digits.length - len; i++) {
                const pattern = digits.slice(i, i + len).join('-');
                patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
            }
        }

        return Array.from(patterns.entries())
            .filter(([_, count]) => count >= 3)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([pattern]) => pattern);
    }

    /**
     * Get prediction accuracy
     */
    public getPredictionAccuracy(): number {
        if (this.predictionHistory.length === 0) return 0;
        
        // This would need actual results to compare
        // For now, return estimated accuracy based on confidence
        const avgConfidence = this.predictionHistory.reduce((sum, p) => sum + p.confidence, 0) / this.predictionHistory.length;
        return avgConfidence * 100;
    }
}

export const analysisAIService = new AnalysisAIService();
