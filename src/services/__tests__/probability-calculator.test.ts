import { probabilityCalculator } from '../probability-calculator.service';

describe('ProbabilityCalculatorService', () => {
    beforeEach(() => {
        probabilityCalculator.resetAccuracy();
    });

    it('calculates probability for valid pattern', () => {
        const pattern = ['EVEN', 'EVEN', 'EVEN', 'ODD', 'ODD'];
        const result = probabilityCalculator.calculateProbability(pattern);

        expect(result.probability).toBeGreaterThanOrEqual(20);
        expect(result.probability).toBeLessThanOrEqual(95);
        expect(result.confidence).toBeGreaterThanOrEqual(30);
        expect(result.confidence).toBeLessThanOrEqual(95);
    });

    it('returns default result for insufficient data', () => {
        const pattern = ['EVEN', 'ODD'];
        const result = probabilityCalculator.calculateProbability(pattern);

        expect(result.probability).toBe(50);
        expect(result.confidence).toBe(30);
        expect(result.recommendation).toBe('HOLD');
    });

    it('detects long streaks', () => {
        const pattern = Array(10).fill('EVEN');
        const result = probabilityCalculator.calculateProbability(pattern);

        expect(result.factors.streakLength).toBe(10);
        expect(result.probability).toBeGreaterThan(50);
    });

    it('calculates distribution correctly', () => {
        const pattern = ['EVEN', 'EVEN', 'EVEN', 'ODD', 'ODD', 'ODD', 'ODD', 'ODD'];
        const result = probabilityCalculator.calculateProbability(pattern);

        expect(result.factors.distribution.type1).toBe(3);
        expect(result.factors.distribution.type2).toBe(5);
    });

    it('calculates volatility', () => {
        const highVolatility = ['EVEN', 'ODD', 'EVEN', 'ODD', 'EVEN', 'ODD'];
        const lowVolatility = ['EVEN', 'EVEN', 'EVEN', 'EVEN', 'EVEN', 'EVEN'];

        const highResult = probabilityCalculator.calculateProbability(highVolatility);
        const lowResult = probabilityCalculator.calculateProbability(lowVolatility);

        expect(highResult.factors.volatility).toBeGreaterThan(lowResult.factors.volatility);
    });

    it('provides confidence intervals', () => {
        const pattern = Array(10).fill('EVEN');
        const result = probabilityCalculator.calculateProbability(pattern);

        expect(result.minProbability).toBeLessThanOrEqual(result.probability);
        expect(result.maxProbability).toBeGreaterThanOrEqual(result.probability);
        expect(result.minProbability).toBeGreaterThanOrEqual(20);
        expect(result.maxProbability).toBeLessThanOrEqual(95);
    });

    it('generates recommendations', () => {
        const strongPattern = Array(15).fill('EVEN');
        const weakPattern = ['EVEN', 'ODD', 'EVEN', 'ODD', 'EVEN'];

        const strongResult = probabilityCalculator.calculateProbability(strongPattern);
        const weakResult = probabilityCalculator.calculateProbability(weakPattern);

        expect(['STRONG_BUY', 'BUY']).toContain(strongResult.recommendation);
        expect(['HOLD', 'SELL']).toContain(weakResult.recommendation);
    });

    it('updates historical accuracy', () => {
        probabilityCalculator.updateAccuracy(true, true);
        probabilityCalculator.updateAccuracy(true, false);
        probabilityCalculator.updateAccuracy(true, true);

        const accuracy = probabilityCalculator.getHistoricalAccuracy();

        expect(accuracy.totalPredictions).toBe(3);
        expect(accuracy.correctPredictions).toBe(2);
        expect(accuracy.accuracy).toBeCloseTo(66.67, 1);
    });

    it('resets accuracy', () => {
        probabilityCalculator.updateAccuracy(true, true);
        probabilityCalculator.resetAccuracy();

        const accuracy = probabilityCalculator.getHistoricalAccuracy();

        expect(accuracy.totalPredictions).toBe(0);
        expect(accuracy.correctPredictions).toBe(0);
        expect(accuracy.accuracy).toBe(0);
    });

    it('handles empty pattern', () => {
        const result = probabilityCalculator.calculateProbability([]);

        expect(result.probability).toBe(50);
        expect(result.confidence).toBe(30);
    });

    it('calculates momentum', () => {
        const strongMomentum = ['EVEN', 'EVEN', 'EVEN', 'EVEN', 'EVEN', 'EVEN'];
        const weakMomentum = ['EVEN', 'ODD', 'EVEN', 'ODD', 'EVEN', 'ODD'];

        const strongResult = probabilityCalculator.calculateProbability(strongMomentum);
        const weakResult = probabilityCalculator.calculateProbability(weakMomentum);

        expect(strongResult.factors.momentum).toBeGreaterThan(weakResult.factors.momentum);
    });

    it('applies time of day factor', () => {
        const pattern = Array(10).fill('EVEN');
        const result = probabilityCalculator.calculateProbability(pattern);

        expect(result.factors.timeOfDay).toBeGreaterThan(0.9);
        expect(result.factors.timeOfDay).toBeLessThanOrEqual(1.1);
    });
});
