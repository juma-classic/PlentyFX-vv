/**
 * Pattern Predictor Service
 * Analyzes historical tick patterns and predicts next likely outcome
 * Uses pattern recognition and statistical analysis
 */

export type PredictionOutcome = 'RISE' | 'FALL' | 'UNCERTAIN';

export type PatternType =
    | 'STRONG_STREAK'
    | 'WEAK_STREAK'
    | 'ALTERNATING'
    | 'RANDOM'
    | 'REVERSAL_LIKELY'
    | 'CONTINUATION_LIKELY';

export interface PredictionResult {
    prediction: PredictionOutcome;
    confidence: number; // 0-100
    patternType: PatternType;
    reasoning: string;
    supportingFactors: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    recommendedAction: 'TRADE' | 'WAIT' | 'AVOID';
}

export interface TickData {
    value: number;
    timestamp: number;
    direction?: 'RISE' | 'FALL';
}

class PatternPredictorService {
    private readonly MIN_TICKS_FOR_PREDICTION = 5;
    private readonly OPTIMAL_TICKS_FOR_ANALYSIS = 15;
    private readonly STRONG_STREAK_THRESHOLD = 5;
    private readonly ALTERNATING_THRESHOLD = 0.7; // 70% alternating

    /**
     * Predict next outcome based on tick history
     */
    public predict(ticks: TickData[]): PredictionResult {
        if (ticks.length < this.MIN_TICKS_FOR_PREDICTION) {
            return this.getInsufficientDataResult();
        }

        // Analyze recent ticks (last 15 for optimal analysis)
        const recentTicks = ticks.slice(-this.OPTIMAL_TICKS_FOR_ANALYSIS);
        const directions = this.extractDirections(recentTicks);

        // Run multiple analysis methods
        const streakAnalysis = this.analyzeStreak(directions);
        const alternatingAnalysis = this.analyzeAlternating(directions);
        const momentumAnalysis = this.analyzeMomentum(recentTicks);
        const volatilityAnalysis = this.analyzeVolatility(recentTicks);

        // Combine analyses to make prediction
        return this.combinePredictions(
            directions,
            streakAnalysis,
            alternatingAnalysis,
            momentumAnalysis,
            volatilityAnalysis
        );
    }

    /**
     * Extract directions from tick data
     */
    private extractDirections(ticks: TickData[]): ('RISE' | 'FALL')[] {
        const directions: ('RISE' | 'FALL')[] = [];

        for (let i = 1; i < ticks.length; i++) {
            const direction = ticks[i].value > ticks[i - 1].value ? 'RISE' : 'FALL';
            directions.push(direction);
        }

        return directions;
    }

    /**
     * Analyze streak patterns
     */
    private analyzeStreak(directions: ('RISE' | 'FALL')[]) {
        if (directions.length === 0) {
            return { currentStreak: 0, direction: null, isStrong: false };
        }

        let currentStreak = 1;
        const lastDirection = directions[directions.length - 1];

        // Count consecutive same directions
        for (let i = directions.length - 2; i >= 0; i--) {
            if (directions[i] === lastDirection) {
                currentStreak++;
            } else {
                break;
            }
        }

        return {
            currentStreak,
            direction: lastDirection,
            isStrong: currentStreak >= this.STRONG_STREAK_THRESHOLD,
        };
    }

    /**
     * Analyze alternating patterns
     */
    private analyzeAlternating(directions: ('RISE' | 'FALL')[]) {
        if (directions.length < 3) {
            return { isAlternating: false, alternatingRatio: 0 };
        }

        let alternatingCount = 0;
        for (let i = 1; i < directions.length; i++) {
            if (directions[i] !== directions[i - 1]) {
                alternatingCount++;
            }
        }

        const alternatingRatio = alternatingCount / (directions.length - 1);
        const isAlternating = alternatingRatio >= this.ALTERNATING_THRESHOLD;

        return { isAlternating, alternatingRatio };
    }

    /**
     * Analyze momentum (rate of change)
     */
    private analyzeMomentum(ticks: TickData[]) {
        if (ticks.length < 3) {
            return { momentum: 0, trend: 'NEUTRAL' as const };
        }

        const recentChanges = [];
        for (let i = 1; i < ticks.length; i++) {
            recentChanges.push(ticks[i].value - ticks[i - 1].value);
        }

        const avgChange = recentChanges.reduce((sum, change) => sum + change, 0) / recentChanges.length;

        const momentum = Math.abs(avgChange);
        const trend = avgChange > 0.0001 ? 'BULLISH' : avgChange < -0.0001 ? 'BEARISH' : 'NEUTRAL';

        return { momentum, trend };
    }

    /**
     * Analyze volatility
     */
    private analyzeVolatility(ticks: TickData[]) {
        if (ticks.length < 2) {
            return { volatility: 0, level: 'LOW' as const };
        }

        const changes = [];
        for (let i = 1; i < ticks.length; i++) {
            changes.push(Math.abs(ticks[i].value - ticks[i - 1].value));
        }

        const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
        const variance = changes.reduce((sum, change) => sum + Math.pow(change - avgChange, 2), 0) / changes.length;
        const volatility = Math.sqrt(variance);

        const level = volatility > 0.001 ? 'HIGH' : volatility > 0.0005 ? 'MEDIUM' : 'LOW';

        return { volatility, level };
    }

    /**
     * Combine all analyses into final prediction
     */
    private combinePredictions(
        directions: ('RISE' | 'FALL')[],
        streakAnalysis: ReturnType<typeof this.analyzeStreak>,
        alternatingAnalysis: ReturnType<typeof this.analyzeAlternating>,
        momentumAnalysis: ReturnType<typeof this.analyzeMomentum>,
        volatilityAnalysis: ReturnType<typeof this.analyzeVolatility>
    ): PredictionResult {
        const supportingFactors: string[] = [];
        let confidence = 50; // Base confidence
        let prediction: PredictionOutcome = 'UNCERTAIN';
        let patternType: PatternType = 'RANDOM';

        // Strong streak detected
        if (streakAnalysis.isStrong) {
            patternType = 'STRONG_STREAK';
            // After strong streak, reversal is likely
            prediction = streakAnalysis.direction === 'RISE' ? 'FALL' : 'RISE';
            confidence = 60 + Math.min(streakAnalysis.currentStreak * 3, 25);
            supportingFactors.push(
                `Strong ${streakAnalysis.direction} streak of ${streakAnalysis.currentStreak} - reversal likely`
            );
        }
        // Weak streak
        else if (streakAnalysis.currentStreak >= 3) {
            patternType = 'WEAK_STREAK';
            // Continuation slightly more likely
            prediction = streakAnalysis.direction;
            confidence = 55 + streakAnalysis.currentStreak * 2;
            supportingFactors.push(
                `${streakAnalysis.direction} streak of ${streakAnalysis.currentStreak} - continuation possible`
            );
        }
        // Alternating pattern
        else if (alternatingAnalysis.isAlternating) {
            patternType = 'ALTERNATING';
            const lastDirection = directions[directions.length - 1];
            prediction = lastDirection === 'RISE' ? 'FALL' : 'RISE';
            confidence = 55 + Math.floor(alternatingAnalysis.alternatingRatio * 20);
            supportingFactors.push(
                `Alternating pattern detected (${Math.floor(alternatingAnalysis.alternatingRatio * 100)}%) - opposite direction likely`
            );
        }

        // Adjust based on momentum
        if (momentumAnalysis.trend !== 'NEUTRAL') {
            const momentumPrediction = momentumAnalysis.trend === 'BULLISH' ? 'RISE' : 'FALL';
            if (prediction === momentumPrediction) {
                confidence += 5;
                supportingFactors.push(`${momentumAnalysis.trend} momentum supports prediction`);
            } else if (prediction !== 'UNCERTAIN') {
                confidence -= 5;
                supportingFactors.push(`${momentumAnalysis.trend} momentum contradicts prediction`);
            } else {
                prediction = momentumPrediction;
                confidence = 52;
                supportingFactors.push(`${momentumAnalysis.trend} momentum detected`);
            }
        }

        // Adjust based on volatility
        if (volatilityAnalysis.level === 'HIGH') {
            confidence -= 10;
            supportingFactors.push('High volatility increases uncertainty');
        } else if (volatilityAnalysis.level === 'LOW') {
            confidence += 5;
            supportingFactors.push('Low volatility increases predictability');
        }

        // Clamp confidence
        confidence = Math.max(30, Math.min(95, confidence));

        // Determine risk level and recommendation
        const riskLevel = this.calculateRiskLevel(confidence, volatilityAnalysis.level);
        const recommendedAction = this.getRecommendedAction(confidence, riskLevel);

        // Generate reasoning
        const reasoning = this.generateReasoning(prediction, patternType, confidence);

        return {
            prediction,
            confidence,
            patternType,
            reasoning,
            supportingFactors,
            riskLevel,
            recommendedAction,
        };
    }

    /**
     * Calculate risk level
     */
    private calculateRiskLevel(confidence: number, volatility: 'LOW' | 'MEDIUM' | 'HIGH'): 'LOW' | 'MEDIUM' | 'HIGH' {
        if (confidence >= 70 && volatility === 'LOW') return 'LOW';
        if (confidence >= 60 && volatility !== 'HIGH') return 'MEDIUM';
        return 'HIGH';
    }

    /**
     * Get recommended action
     */
    private getRecommendedAction(confidence: number, riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'): 'TRADE' | 'WAIT' | 'AVOID' {
        if (confidence >= 65 && riskLevel !== 'HIGH') return 'TRADE';
        if (confidence >= 55 && riskLevel === 'LOW') return 'TRADE';
        if (confidence >= 50) return 'WAIT';
        return 'AVOID';
    }

    /**
     * Generate human-readable reasoning
     */
    private generateReasoning(prediction: PredictionOutcome, patternType: PatternType, confidence: number): string {
        const predictionText = prediction === 'UNCERTAIN' ? 'uncertain' : prediction.toLowerCase();
        const confidenceText = confidence >= 70 ? 'high' : confidence >= 55 ? 'moderate' : 'low';

        let reasoning = `Predicting ${predictionText} with ${confidenceText} confidence (${confidence}%). `;

        switch (patternType) {
            case 'STRONG_STREAK':
                reasoning += 'Strong streak detected - reversal expected.';
                break;
            case 'WEAK_STREAK':
                reasoning += 'Weak streak pattern - continuation likely.';
                break;
            case 'ALTERNATING':
                reasoning += 'Alternating pattern identified.';
                break;
            case 'RANDOM':
                reasoning += 'No clear pattern - random movement.';
                break;
            default:
                reasoning += 'Pattern analysis complete.';
        }

        return reasoning;
    }

    /**
     * Return result when insufficient data
     */
    private getInsufficientDataResult(): PredictionResult {
        return {
            prediction: 'UNCERTAIN',
            confidence: 0,
            patternType: 'RANDOM',
            reasoning: 'Insufficient tick data for prediction. Need at least 5 ticks.',
            supportingFactors: ['Not enough historical data'],
            riskLevel: 'HIGH',
            recommendedAction: 'WAIT',
        };
    }
}

export const patternPredictor = new PatternPredictorService();
