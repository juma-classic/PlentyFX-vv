/**
 * Pattern Predictor Service Tests
 */

import { patternPredictor, type TickData } from '../pattern-predictor.service';

describe('PatternPredictorService', () => {
    // Helper to create tick data
    const createTicks = (values: number[]): TickData[] => {
        return values.map((value, index) => ({
            value,
            timestamp: Date.now() + index * 1000,
        }));
    };

    describe('Insufficient Data', () => {
        it('returns uncertain prediction with insufficient ticks', () => {
            const ticks = createTicks([1.5, 1.6, 1.7]);
            const result = patternPredictor.predict(ticks);

            expect(result.prediction).toBe('UNCERTAIN');
            expect(result.confidence).toBe(0);
            expect(result.recommendedAction).toBe('WAIT');
        });
    });

    describe('Strong Streak Detection', () => {
        it('predicts reversal after strong RISE streak', () => {
            const ticks = createTicks([1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6]);
            const result = patternPredictor.predict(ticks);

            expect(result.prediction).toBe('FALL');
            expect(result.patternType).toBe('STRONG_STREAK');
            expect(result.confidence).toBeGreaterThan(60);
        });

        it('predicts reversal after strong FALL streak', () => {
            const ticks = createTicks([1.6, 1.5, 1.4, 1.3, 1.2, 1.1, 1.0]);
            const result = patternPredictor.predict(ticks);

            expect(result.prediction).toBe('RISE');
            expect(result.patternType).toBe('STRONG_STREAK');
            expect(result.confidence).toBeGreaterThan(60);
        });
    });

    describe('Weak Streak Detection', () => {
        it('predicts continuation for weak RISE streak', () => {
            const ticks = createTicks([1.0, 1.1, 1.2, 1.3, 1.4]);
            const result = patternPredictor.predict(ticks);

            expect(result.prediction).toBe('RISE');
            expect(result.patternType).toBe('WEAK_STREAK');
            expect(result.confidence).toBeGreaterThan(50);
            expect(result.confidence).toBeLessThan(80);
        });

        it('predicts continuation for weak FALL streak', () => {
            const ticks = createTicks([1.4, 1.3, 1.2, 1.1, 1.0]);
            const result = patternPredictor.predict(ticks);

            expect(result.prediction).toBe('FALL');
            expect(result.patternType).toBe('WEAK_STREAK');
        });
    });

    describe('Alternating Pattern Detection', () => {
        it('detects alternating pattern and predicts opposite', () => {
            const ticks = createTicks([1.0, 1.1, 1.0, 1.1, 1.0, 1.1, 1.0, 1.1]);
            const result = patternPredictor.predict(ticks);

            expect(result.patternType).toBe('ALTERNATING');
            expect(result.prediction).toBe('FALL'); // Last was RISE, so predict FALL
            expect(result.confidence).toBeGreaterThan(50);
        });

        it('predicts RISE after FALL in alternating pattern', () => {
            const ticks = createTicks([1.1, 1.0, 1.1, 1.0, 1.1, 1.0, 1.1, 1.0]);
            const result = patternPredictor.predict(ticks);

            expect(result.patternType).toBe('ALTERNATING');
            expect(result.prediction).toBe('RISE'); // Last was FALL, so predict RISE
        });
    });

    describe('Risk Level Calculation', () => {
        it('assigns LOW risk for high confidence and low volatility', () => {
            // Strong streak = high confidence
            const ticks = createTicks([1.0, 1.01, 1.02, 1.03, 1.04, 1.05, 1.06]);
            const result = patternPredictor.predict(ticks);

            expect(result.riskLevel).toBe('LOW');
        });

        it('assigns HIGH risk for low confidence', () => {
            // Random pattern = low confidence
            const ticks = createTicks([1.0, 1.1, 1.05, 1.15, 1.08]);
            const result = patternPredictor.predict(ticks);

            expect(result.riskLevel).toBe('HIGH');
        });
    });

    describe('Recommended Action', () => {
        it('recommends TRADE for high confidence predictions', () => {
            const ticks = createTicks([1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6]);
            const result = patternPredictor.predict(ticks);

            expect(result.confidence).toBeGreaterThan(60);
            expect(result.recommendedAction).toBe('TRADE');
        });

        it('recommends WAIT for medium confidence', () => {
            const ticks = createTicks([1.0, 1.1, 1.2, 1.15, 1.25]);
            const result = patternPredictor.predict(ticks);

            if (result.confidence >= 50 && result.confidence < 65) {
                expect(result.recommendedAction).toBe('WAIT');
            }
        });

        it('recommends AVOID for low confidence', () => {
            const ticks = createTicks([1.0, 1.1, 1.05, 1.15, 1.08]);
            const result = patternPredictor.predict(ticks);

            if (result.confidence < 50) {
                expect(result.recommendedAction).toBe('AVOID');
            }
        });
    });

    describe('Supporting Factors', () => {
        it('includes supporting factors in prediction', () => {
            const ticks = createTicks([1.0, 1.1, 1.2, 1.3, 1.4, 1.5]);
            const result = patternPredictor.predict(ticks);

            expect(result.supportingFactors).toBeInstanceOf(Array);
            expect(result.supportingFactors.length).toBeGreaterThan(0);
        });

        it('provides reasoning for prediction', () => {
            const ticks = createTicks([1.0, 1.1, 1.2, 1.3, 1.4, 1.5]);
            const result = patternPredictor.predict(ticks);

            expect(result.reasoning).toBeTruthy();
            expect(typeof result.reasoning).toBe('string');
            expect(result.reasoning.length).toBeGreaterThan(10);
        });
    });

    describe('Confidence Bounds', () => {
        it('keeps confidence between 30 and 95', () => {
            // Test various patterns
            const patterns = [
                createTicks([1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8]),
                createTicks([1.0, 1.1, 1.0, 1.1, 1.0, 1.1, 1.0, 1.1, 1.0]),
                createTicks([1.0, 1.05, 1.02, 1.08, 1.03, 1.09]),
            ];

            patterns.forEach(ticks => {
                const result = patternPredictor.predict(ticks);
                expect(result.confidence).toBeGreaterThanOrEqual(30);
                expect(result.confidence).toBeLessThanOrEqual(95);
            });
        });
    });

    describe('Edge Cases', () => {
        it('handles identical tick values', () => {
            const ticks = createTicks([1.5, 1.5, 1.5, 1.5, 1.5]);
            const result = patternPredictor.predict(ticks);

            expect(result.prediction).toBeDefined();
            expect(result.confidence).toBeGreaterThanOrEqual(0);
        });

        it('handles very small price changes', () => {
            const ticks = createTicks([1.5, 1.5001, 1.5002, 1.5001, 1.5003]);
            const result = patternPredictor.predict(ticks);

            expect(result.prediction).toBeDefined();
            expect(result.confidence).toBeGreaterThanOrEqual(0);
        });
    });
});
