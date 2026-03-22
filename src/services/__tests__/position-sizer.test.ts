/**
 * Position Sizer Service Tests
 */

import { positionSizer } from '../position-sizer.service';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value;
        },
        clear: () => {
            store = {};
        },
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

describe('PositionSizerService', () => {
    beforeEach(() => {
        localStorageMock.clear();
        positionSizer.updateConfig({
            accountBalance: 100,
            maxRiskPerTrade: 2,
            minStake: 0.35,
            maxStake: 100,
            useKellyCriterion: false,
            kellyFraction: 0.5,
        });
    });

    describe('Configuration', () => {
        it('updates configuration', () => {
            positionSizer.updateConfig({ accountBalance: 200 });
            const config = positionSizer.getConfig();
            expect(config.accountBalance).toBe(200);
        });

        it('saves configuration to localStorage', () => {
            positionSizer.updateConfig({ maxRiskPerTrade: 3 });
            const stored = localStorageMock.getItem('positionSizeConfig');
            expect(stored).toBeTruthy();
            const config = JSON.parse(stored!);
            expect(config.maxRiskPerTrade).toBe(3);
        });
    });

    describe('Confidence-Based Sizing', () => {
        it('calculates position size based on confidence', () => {
            const result = positionSizer.calculatePositionSize(75);
            expect(result.recommendedStake).toBeGreaterThan(0);
            expect(result.riskPercentage).toBeLessThanOrEqual(2);
        });

        it('increases stake with higher confidence', () => {
            const lowConfResult = positionSizer.calculatePositionSize(55);
            const highConfResult = positionSizer.calculatePositionSize(85);
            expect(highConfResult.recommendedStake).toBeGreaterThan(lowConfResult.recommendedStake);
        });

        it('respects minimum stake', () => {
            const result = positionSizer.calculatePositionSize(30);
            expect(result.recommendedStake).toBeGreaterThanOrEqual(0.35);
        });

        it('respects maximum risk per trade', () => {
            const result = positionSizer.calculatePositionSize(95);
            expect(result.riskPercentage).toBeLessThanOrEqual(2);
        });
    });

    describe('Kelly Criterion', () => {
        beforeEach(() => {
            positionSizer.updateConfig({ useKellyCriterion: true });
        });

        it('calculates Kelly percentage correctly', () => {
            // Win rate 60%, payout ratio 1:1 (even money)
            // Kelly = 0.6 - (0.4 / 1) = 0.2 = 20%
            const result = positionSizer.calculatePositionSize(75, 0.6, 1);
            expect(result.kellyPercentage).toBeCloseTo(20, 1);
        });

        it('applies Kelly fraction for safety', () => {
            positionSizer.updateConfig({ kellyFraction: 0.5, maxRiskPerTrade: 20 }); // Increase max risk
            const result = positionSizer.calculatePositionSize(75, 0.6, 1);
            // Should use half Kelly
            const expectedStake = 100 * 0.2 * 0.5; // 20% Kelly * 50% fraction
            expect(result.recommendedStake).toBeCloseTo(expectedStake, 1);
        });

        it('handles negative Kelly (no edge)', () => {
            // Win rate 40%, payout ratio 1:1
            // Kelly = 0.4 - (0.6 / 1) = -0.2 = -20%
            const result = positionSizer.calculatePositionSize(75, 0.4, 1);
            expect(result.kellyPercentage).toBeLessThan(0);
            expect(result.warnings).toContain('Kelly Criterion suggests no trade (negative edge)');
        });

        it('falls back to confidence-based when Kelly data missing', () => {
            const result = positionSizer.calculatePositionSize(75);
            expect(result.kellyPercentage).toBeUndefined();
            expect(result.recommendedStake).toBeGreaterThan(0);
        });
    });

    describe('Risk Limits', () => {
        it('enforces minimum stake', () => {
            positionSizer.updateConfig({ minStake: 1 });
            const result = positionSizer.calculatePositionSize(50);
            expect(result.recommendedStake).toBeGreaterThanOrEqual(1);
        });

        it('enforces maximum stake', () => {
            positionSizer.updateConfig({ maxStake: 5 });
            const result = positionSizer.calculatePositionSize(95);
            expect(result.recommendedStake).toBeLessThanOrEqual(5);
        });

        it('enforces maximum risk percentage', () => {
            positionSizer.updateConfig({ maxRiskPerTrade: 1 });
            const result = positionSizer.calculatePositionSize(95);
            expect(result.riskPercentage).toBeLessThanOrEqual(1);
        });

        it('adds warnings when limits are applied', () => {
            positionSizer.updateConfig({ maxStake: 0.5 });
            const result = positionSizer.calculatePositionSize(95);
            expect(result.warnings.length).toBeGreaterThan(0);
        });
    });

    describe('Batch Calculations', () => {
        it('calculates multiple position sizes', () => {
            const trades = [
                { confidence: 60 },
                { confidence: 80 },
                { confidence: 70, winRate: 0.6, payoutRatio: 1 },
            ];
            const results = positionSizer.calculateBatchPositionSizes(trades);
            expect(results).toHaveLength(3);
            expect(results[0].recommendedStake).toBeGreaterThan(0);
        });
    });

    describe('Risk Summary', () => {
        it('calculates risk summary correctly', () => {
            const summary = positionSizer.getRiskSummary(10);
            expect(summary.accountBalance).toBe(100);
            expect(summary.currentExposure).toBe(10);
            expect(summary.exposurePercentage).toBe(10);
            expect(summary.remainingCapacity).toBe(90);
        });

        it('assigns correct risk status', () => {
            const safeSummary = positionSizer.getRiskSummary(2);
            expect(safeSummary.status).toBe('SAFE');

            const moderateSummary = positionSizer.getRiskSummary(8);
            expect(moderateSummary.status).toBe('MODERATE');

            const highSummary = positionSizer.getRiskSummary(15);
            expect(highSummary.status).toBe('HIGH');

            const criticalSummary = positionSizer.getRiskSummary(25);
            expect(criticalSummary.status).toBe('CRITICAL');
        });
    });

    describe('Reasoning Generation', () => {
        it('generates appropriate reasoning text', () => {
            const result = positionSizer.calculatePositionSize(75);
            expect(result.reasoning).toContain('Recommended stake');
            expect(result.reasoning).toContain('75% confidence');
        });

        it('includes Kelly information in reasoning when available', () => {
            positionSizer.updateConfig({ useKellyCriterion: true });
            const result = positionSizer.calculatePositionSize(75, 0.6, 1);
            expect(result.reasoning).toContain('Kelly Criterion');
        });

        it('describes risk level appropriately', () => {
            positionSizer.updateConfig({ maxRiskPerTrade: 0.5 });
            const result = positionSizer.calculatePositionSize(75);
            expect(result.reasoning).toContain('Conservative');
        });
    });

    describe('Edge Cases', () => {
        it('handles zero confidence', () => {
            const result = positionSizer.calculatePositionSize(0);
            expect(result.recommendedStake).toBeGreaterThanOrEqual(0.35);
        });

        it('handles very high confidence', () => {
            const result = positionSizer.calculatePositionSize(100);
            expect(result.recommendedStake).toBeLessThanOrEqual(100);
        });

        it('handles very small account balance', () => {
            positionSizer.updateConfig({ accountBalance: 1 });
            const result = positionSizer.calculatePositionSize(75);
            expect(result.recommendedStake).toBeGreaterThan(0);
        });

        it('rounds stake to 2 decimal places', () => {
            const result = positionSizer.calculatePositionSize(75);
            const decimalPlaces = (result.recommendedStake.toString().split('.')[1] || '').length;
            expect(decimalPlaces).toBeLessThanOrEqual(2);
        });
    });
});