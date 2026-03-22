/**
 * Prediction Algorithms Module
 * Multiple strategies for predicting next digit
 */

export interface TickData {
    epoch: number;
    quote: number;
    lastDigit: number;
    source: 'historical' | 'live';
    localTime: string;
}

export interface PredictionResult {
    digit: number;
    confidence: 'LOW' | 'MEDIUM' | 'HIGH';
    reason: string;
    probability?: number;
}

export type PredictionStrategy = 'mean-reversion' | 'hot-digit' | 'markov-chain' | 'gap-analysis' | 'ensemble';

/**
 * 1. Mean Reversion Strategy
 * Predicts underrepresented digits (cold digits)
 */
export function meanReversionStrategy(ticks: TickData[]): PredictionResult {
    if (ticks.length < 20) {
        return { digit: 5, confidence: 'LOW', reason: 'Insufficient data for mean reversion' };
    }

    const last20 = ticks.slice(-20);
    const digitCounts: Record<number, number> = {};
    for (let i = 0; i < 10; i++) {
        digitCounts[i] = last20.filter(t => t.lastDigit === i).length;
    }

    const coldDigit = Object.entries(digitCounts).sort((a, b) => a[1] - b[1])[0];
    const coldCount = parseInt(coldDigit[1]);
    const expectedCount = 2; // 20 ticks / 10 digits = 2

    const confidence: 'LOW' | 'MEDIUM' | 'HIGH' = coldCount === 0 ? 'HIGH' : coldCount === 1 ? 'MEDIUM' : 'LOW';

    return {
        digit: parseInt(coldDigit[0]),
        confidence,
        reason: `Digit ${coldDigit[0]} is underrepresented (${coldCount}/20 ticks, expected ${expectedCount})`,
        probability: (expectedCount - coldCount) / expectedCount,
    };
}

/**
 * 2. Hot Digit / Momentum Strategy
 * Predicts the most frequent recent digit
 */
export function hotDigitStrategy(ticks: TickData[]): PredictionResult {
    if (ticks.length < 20) {
        return { digit: 5, confidence: 'LOW', reason: 'Insufficient data for momentum analysis' };
    }

    const last20 = ticks.slice(-20);
    const digitCounts: Record<number, number> = {};
    for (let i = 0; i < 10; i++) {
        digitCounts[i] = last20.filter(t => t.lastDigit === i).length;
    }

    const hotDigit = Object.entries(digitCounts).sort((a, b) => b[1] - a[1])[0];
    const hotCount = parseInt(hotDigit[1]);

    const confidence: 'LOW' | 'MEDIUM' | 'HIGH' = hotCount >= 5 ? 'HIGH' : hotCount >= 3 ? 'MEDIUM' : 'LOW';

    return {
        digit: parseInt(hotDigit[0]),
        confidence,
        reason: `Digit ${hotDigit[0]} is trending (${hotCount}/20 occurrences)`,
        probability: hotCount / 20,
    };
}

/**
 * 3. Markov Chain Strategy
 * Predicts based on what usually follows the current digit
 */
export function markovChainStrategy(ticks: TickData[]): PredictionResult {
    if (ticks.length < 50) {
        return { digit: 5, confidence: 'LOW', reason: 'Insufficient data for Markov chain analysis' };
    }

    const currentDigit = ticks[ticks.length - 1].lastDigit;

    // Build transition matrix
    const transitions: Record<number, Record<number, number>> = {};
    for (let i = 0; i < 10; i++) {
        transitions[i] = {};
        for (let j = 0; j < 10; j++) {
            transitions[i][j] = 0;
        }
    }

    // Count transitions
    for (let i = 0; i < ticks.length - 1; i++) {
        const from = ticks[i].lastDigit;
        const to = ticks[i + 1].lastDigit;
        transitions[from][to]++;
    }

    // Find most likely next digit after current digit
    const currentTransitions = transitions[currentDigit];
    const totalTransitions = Object.values(currentTransitions).reduce((sum, count) => sum + count, 0);

    if (totalTransitions === 0) {
        return {
            digit: currentDigit,
            confidence: 'LOW',
            reason: `No historical data for transitions from digit ${currentDigit}`,
        };
    }

    const nextDigit = Object.entries(currentTransitions).sort((a, b) => b[1] - a[1])[0];
    const nextCount = parseInt(nextDigit[1]);
    const probability = nextCount / totalTransitions;

    const confidence: 'LOW' | 'MEDIUM' | 'HIGH' = probability >= 0.3 ? 'HIGH' : probability >= 0.15 ? 'MEDIUM' : 'LOW';

    return {
        digit: parseInt(nextDigit[0]),
        confidence,
        reason: `After ${currentDigit}, digit ${nextDigit[0]} appears ${(probability * 100).toFixed(1)}% of the time`,
        probability,
    };
}

/**
 * 4. Gap Analysis Strategy
 * Predicts digits that haven't appeared in longest time
 */
export function gapAnalysisStrategy(ticks: TickData[]): PredictionResult {
    if (ticks.length < 20) {
        return { digit: 5, confidence: 'LOW', reason: 'Insufficient data for gap analysis' };
    }

    // Find last occurrence of each digit
    const lastOccurrence: Record<number, number> = {};
    for (let i = 0; i < 10; i++) {
        lastOccurrence[i] = -1;
    }

    for (let i = ticks.length - 1; i >= 0; i--) {
        const digit = ticks[i].lastDigit;
        if (lastOccurrence[digit] === -1) {
            lastOccurrence[digit] = ticks.length - 1 - i;
        }
    }

    // Find digit with longest gap
    const longestGap = Object.entries(lastOccurrence).sort((a, b) => b[1] - a[1])[0];
    const gap = parseInt(longestGap[1]);

    const confidence: 'LOW' | 'MEDIUM' | 'HIGH' = gap >= 20 ? 'HIGH' : gap >= 10 ? 'MEDIUM' : 'LOW';

    return {
        digit: parseInt(longestGap[0]),
        confidence,
        reason:
            gap === -1
                ? `Digit ${longestGap[0]} has never appeared`
                : `Digit ${longestGap[0]} hasn't appeared for ${gap} ticks`,
        probability: Math.min(gap / 30, 1),
    };
}

/**
 * 5. Ensemble Strategy
 * Combines multiple algorithms with weighted voting
 */
export function ensembleStrategy(ticks: TickData[]): PredictionResult {
    if (ticks.length < 50) {
        return { digit: 5, confidence: 'LOW', reason: 'Insufficient data for ensemble analysis' };
    }

    // Run all algorithms
    const predictions = [
        { ...meanReversionStrategy(ticks), weight: 1.0, name: 'Mean Reversion' },
        { ...hotDigitStrategy(ticks), weight: 0.8, name: 'Hot Digit' },
        { ...markovChainStrategy(ticks), weight: 1.2, name: 'Markov Chain' },
        { ...gapAnalysisStrategy(ticks), weight: 0.9, name: 'Gap Analysis' },
    ];

    // Calculate weighted votes for each digit
    const votes: Record<number, { score: number; algorithms: string[] }> = {};
    for (let i = 0; i < 10; i++) {
        votes[i] = { score: 0, algorithms: [] };
    }

    predictions.forEach(pred => {
        const confidenceWeight = pred.confidence === 'HIGH' ? 1.0 : pred.confidence === 'MEDIUM' ? 0.7 : 0.4;
        const score = pred.weight * confidenceWeight * (pred.probability || 0.5);
        votes[pred.digit].score += score;
        votes[pred.digit].algorithms.push(pred.name);
    });

    // Find winner
    const winner = Object.entries(votes).sort((a, b) => b[1].score - a[1].score)[0];
    const winnerDigit = parseInt(winner[0]);
    const winnerScore = winner[1].score;
    const totalScore = Object.values(votes).reduce((sum, v) => sum + v.score, 0);
    const winnerProbability = winnerScore / totalScore;

    const confidence: 'LOW' | 'MEDIUM' | 'HIGH' =
        winnerProbability >= 0.35 ? 'HIGH' : winnerProbability >= 0.2 ? 'MEDIUM' : 'LOW';

    const supportingAlgorithms = winner[1].algorithms.join(', ');

    return {
        digit: winnerDigit,
        confidence,
        reason: `Ensemble consensus: ${(winnerProbability * 100).toFixed(1)}% confidence (${supportingAlgorithms})`,
        probability: winnerProbability,
    };
}

/**
 * Main prediction function that routes to selected strategy
 */
export function predictNextDigit(ticks: TickData[], strategy: PredictionStrategy): PredictionResult {
    switch (strategy) {
        case 'mean-reversion':
            return meanReversionStrategy(ticks);
        case 'hot-digit':
            return hotDigitStrategy(ticks);
        case 'markov-chain':
            return markovChainStrategy(ticks);
        case 'gap-analysis':
            return gapAnalysisStrategy(ticks);
        case 'ensemble':
            return ensembleStrategy(ticks);
        default:
            return meanReversionStrategy(ticks);
    }
}

/**
 * Get strategy display information
 */
export const STRATEGY_INFO: Record<PredictionStrategy, { label: string; description: string; icon: string }> = {
    'mean-reversion': {
        label: 'Mean Reversion',
        description: 'Predicts underrepresented digits',
        icon: '⚖️',
    },
    'hot-digit': {
        label: 'Hot Digit / Momentum',
        description: 'Follows trending digits',
        icon: '🔥',
    },
    'markov-chain': {
        label: 'Markov Chain',
        description: 'Predicts based on sequential patterns',
        icon: '🔗',
    },
    'gap-analysis': {
        label: 'Gap Analysis',
        description: 'Targets overdue digits',
        icon: '⏱️',
    },
    ensemble: {
        label: 'Ensemble (Recommended)',
        description: 'Combines all strategies',
        icon: '🎯',
    },
};
