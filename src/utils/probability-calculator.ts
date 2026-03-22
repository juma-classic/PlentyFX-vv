/**
 * Probability Calculator Module
 * Analyzes tick data to predict next digit probabilities using mean reversion logic
 */

export interface TickData {
    epoch: number;
    quote: number;
    lastDigit: number;
    source: 'historical' | 'live';
    localTime: string;
}

export interface ProbabilityPrediction {
    digit: number;
    probability: number;
    confidence: 'low' | 'medium' | 'high';
    reasoning: string;
}

/**
 * Calculate probability distribution for all digits (0-9) based on tick history
 * Analyzes the last 20 ticks and applies mean reversion logic
 * 
 * @param ticks - Array of tick data
 * @returns Array of probability predictions for all 10 digits
 */
export function calculateProbabilities(ticks: TickData[]): ProbabilityPrediction[] {
    // Ensure we have at least 10 ticks for meaningful analysis
    if (ticks.length < 10) {
        // Return uniform distribution with low confidence
        return Array.from({ length: 10 }, (_, digit) => ({
            digit,
            probability: 0.1,
            confidence: 'low' as const,
            reasoning: 'Insufficient data for analysis'
        }));
    }

    // Analyze last 20 ticks (or all if less than 20)
    const analysisWindow = Math.min(20, ticks.length);
    const recentTicks = ticks.slice(-analysisWindow);

    // Calculate frequency distribution for each digit
    const digitCounts: Record<number, number> = {};
    for (let i = 0; i < 10; i++) {
        digitCounts[i] = recentTicks.filter(t => t.lastDigit === i).length;
    }

    // Expected frequency (uniform distribution would be 10% each)
    const expectedFrequency = analysisWindow / 10;

    // Apply mean reversion logic:
    // - Underrepresented digits get higher probability
    // - Overrepresented digits get lower probability
    const predictions: ProbabilityPrediction[] = [];

    for (let digit = 0; digit < 10; digit++) {
        const actualCount = digitCounts[digit];
        const deviation = expectedFrequency - actualCount;

        // Base probability on deviation from expected
        // Positive deviation = underrepresented = higher probability
        // Negative deviation = overrepresented = lower probability
        let probability: number;

        if (deviation > 0) {
            // Underrepresented: boost probability
            probability = 0.1 + (deviation / analysisWindow) * 0.5;
        } else {
            // Overrepresented: reduce probability
            probability = 0.1 + (deviation / analysisWindow) * 0.3;
        }

        // Ensure probability is within valid range
        probability = Math.max(0.01, Math.min(0.99, probability));

        // Determine confidence level based on pattern strength
        const deviationPercent = Math.abs(deviation / expectedFrequency) * 100;
        let confidence: 'low' | 'medium' | 'high';

        if (deviationPercent > 50) {
            confidence = 'high';
        } else if (deviationPercent > 25) {
            confidence = 'medium';
        } else {
            confidence = 'low';
        }

        // Generate reasoning
        let reasoning: string;
        if (actualCount === 0) {
            reasoning = `Digit ${digit} has not appeared in last ${analysisWindow} ticks (mean reversion expected)`;
        } else if (deviation > 0) {
            reasoning = `Digit ${digit} is underrepresented (${actualCount}/${analysisWindow} occurrences, expected ${expectedFrequency.toFixed(1)})`;
        } else if (deviation < 0) {
            reasoning = `Digit ${digit} is overrepresented (${actualCount}/${analysisWindow} occurrences, expected ${expectedFrequency.toFixed(1)})`;
        } else {
            reasoning = `Digit ${digit} appears at expected frequency (${actualCount}/${analysisWindow} occurrences)`;
        }

        predictions.push({
            digit,
            probability,
            confidence,
            reasoning
        });
    }

    // Normalize probabilities to sum to 1.0
    const totalProbability = predictions.reduce((sum, p) => sum + p.probability, 0);
    predictions.forEach(p => {
        p.probability = p.probability / totalProbability;
    });

    return predictions;
}

/**
 * Get the most likely digit prediction
 * 
 * @param ticks - Array of tick data
 * @returns The prediction with highest probability
 */
export function getMostLikely(ticks: TickData[]): ProbabilityPrediction {
    const predictions = calculateProbabilities(ticks);
    return predictions.reduce((max, p) => p.probability > max.probability ? p : max);
}

/**
 * Get top N predictions sorted by probability (descending)
 * 
 * @param ticks - Array of tick data
 * @param n - Number of top predictions to return
 * @returns Array of top N predictions sorted by probability
 */
export function getTopN(ticks: TickData[], n: number): ProbabilityPrediction[] {
    const predictions = calculateProbabilities(ticks);
    return predictions
        .sort((a, b) => b.probability - a.probability)
        .slice(0, n);
}
