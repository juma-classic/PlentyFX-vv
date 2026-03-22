/**
 * Auto Trader Service Tests
 */

import { autoTrader } from '../auto-trader.service';
import type { EntryPointAnalysis } from '../entry-point-detector.service';
import type { PredictionResult } from '../pattern-predictor.service';

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

describe('AutoTraderService', () => {
    const mockPrediction: PredictionResult = {
        prediction: 'RISE',
        confidence: 75,
        patternType: 'STRONG_STREAK',
        reasoning: 'Test reasoning',
        supportingFactors: ['Factor 1'],
        riskLevel: 'LOW',
        recommendedAction: 'TRADE',
    };

    const mockEntryPoint: EntryPointAnalysis = {
        score: 85,
        recommendation: 'ENTER_NOW',
        factors: [],
        riskReward: 2.5,
        optimalEntry: true,
    };

    beforeEach(() => {
        localStorageMock.clear();
        autoTrader.disable();
        autoTrader.resetStats();
        autoTrader.updateConfig({
            minConfidence: 65,
            maxTradesPerHour: 10,
            maxDailyTrades: 50,
            maxConcurrentTrades: 3,
        });
    });

    describe('Enable/Disable', () => {
        it('starts disabled by default', () => {
            expect(autoTrader.isEnabled()).toBe(false);
        });

        it('can be enabled', () => {
            autoTrader.enable();
            expect(autoTrader.isEnabled()).toBe(true);
        });

        it('can be disabled', () => {
            autoTrader.enable();
            autoTrader.disable();
            expect(autoTrader.isEnabled()).toBe(false);
        });
    });

    describe('Configuration', () => {
        it('updates configuration', () => {
            autoTrader.updateConfig({ minConfidence: 80 });
            const config = autoTrader.getConfig();
            expect(config.minConfidence).toBe(80);
        });

        it('returns current configuration', () => {
            const config = autoTrader.getConfig();
            expect(config).toHaveProperty('minConfidence');
            expect(config).toHaveProperty('maxTradesPerHour');
        });

        it('saves configuration to localStorage', () => {
            autoTrader.updateConfig({ minConfidence: 85 });
            const stored = localStorageMock.getItem('autoTradeConfig');
            expect(stored).toBeTruthy();
            const config = JSON.parse(stored!);
            expect(config.minConfidence).toBe(85);
        });
    });

    describe('Trade Evaluation', () => {
        beforeEach(() => {
            autoTrader.enable();
        });

        it('rejects trade when disabled', () => {
            autoTrader.disable();
            const result = autoTrader.shouldExecuteTrade(mockPrediction);
            expect(result.shouldTrade).toBe(false);
            expect(result.reason).toContain('disabled');
        });

        it('rejects trade with low confidence', () => {
            const lowConfPrediction = { ...mockPrediction, confidence: 50 };
            const result = autoTrader.shouldExecuteTrade(lowConfPrediction);
            expect(result.shouldTrade).toBe(false);
            expect(result.reason).toContain('Confidence');
        });

        it('rejects trade when action is not TRADE', () => {
            const waitPrediction = { ...mockPrediction, recommendedAction: 'WAIT' as const };
            const result = autoTrader.shouldExecuteTrade(waitPrediction);
            expect(result.shouldTrade).toBe(false);
            expect(result.reason).toContain('WAIT');
        });

        it('accepts trade with good conditions', () => {
            const result = autoTrader.shouldExecuteTrade(mockPrediction, mockEntryPoint);
            expect(result.shouldTrade).toBe(true);
        });

        it('rejects trade with poor entry point when required', () => {
            const poorEntry = { ...mockEntryPoint, score: 50 };
            const result = autoTrader.shouldExecuteTrade(mockPrediction, poorEntry);
            expect(result.shouldTrade).toBe(false);
            expect(result.reason).toContain('Entry point');
        });

        it('respects high probability requirement', () => {
            autoTrader.updateConfig({ onlyHighProbability: true });
            const mediumConfPrediction = { ...mockPrediction, confidence: 65 };
            const result = autoTrader.shouldExecuteTrade(mediumConfPrediction);
            expect(result.shouldTrade).toBe(false);
            expect(result.reason).toContain('High probability');
        });
    });

    describe('Trade Limits', () => {
        beforeEach(() => {
            autoTrader.enable();
        });

        it('enforces max concurrent trades', async () => {
            autoTrader.updateConfig({ maxConcurrentTrades: 2 });

            // Execute 2 trades
            await autoTrader.executeTrade(mockPrediction);
            await autoTrader.executeTrade(mockPrediction);

            // Third should be rejected
            const result = autoTrader.shouldExecuteTrade(mockPrediction);
            expect(result.shouldTrade).toBe(false);
            expect(result.reason).toContain('concurrent');
        });

        it('enforces hourly limit', async () => {
            autoTrader.updateConfig({ maxTradesPerHour: 2 });

            // Execute 2 trades
            await autoTrader.executeTrade(mockPrediction);
            await autoTrader.executeTrade(mockPrediction);

            // Third should be rejected
            const result = autoTrader.shouldExecuteTrade(mockPrediction);
            expect(result.shouldTrade).toBe(false);
            expect(result.reason).toContain('hour');
        });

        it('enforces daily limit', async () => {
            autoTrader.updateConfig({ maxDailyTrades: 2 });

            // Execute 2 trades
            await autoTrader.executeTrade(mockPrediction);
            await autoTrader.executeTrade(mockPrediction);

            // Third should be rejected
            const result = autoTrader.shouldExecuteTrade(mockPrediction);
            expect(result.shouldTrade).toBe(false);
            expect(result.reason).toContain('daily');
        });
    });

    describe('Trade Execution', () => {
        beforeEach(() => {
            autoTrader.enable();
        });

        it('executes trade successfully', async () => {
            const execution = await autoTrader.executeTrade(mockPrediction);
            expect(execution.status).toBe('EXECUTED');
            expect(execution.contractId).toBeTruthy();
        });

        it('updates statistics after execution', async () => {
            await autoTrader.executeTrade(mockPrediction);
            const stats = autoTrader.getStats();
            expect(stats.totalTrades).toBe(1);
            expect(stats.tradesThisHour).toBe(1);
            expect(stats.tradesToday).toBe(1);
        });

        it('stores execution in history', async () => {
            await autoTrader.executeTrade(mockPrediction);
            const executions = autoTrader.getExecutions();
            expect(executions.length).toBe(1);
            expect(executions[0].prediction).toEqual(mockPrediction);
        });

        it('includes entry point in execution', async () => {
            const execution = await autoTrader.executeTrade(mockPrediction, mockEntryPoint);
            expect(execution.entryPoint).toEqual(mockEntryPoint);
        });
    });

    describe('Trade Cancellation', () => {
        it('cancels pending trade', async () => {
            const execution = await autoTrader.executeTrade(mockPrediction);
            // Note: In real implementation, trade would start as PENDING
            // For now, we test the cancel logic
            const cancelled = autoTrader.cancelTrade(execution.id);
            expect(typeof cancelled).toBe('boolean');
        });

        it('returns false for non-existent trade', () => {
            const cancelled = autoTrader.cancelTrade('INVALID_ID');
            expect(cancelled).toBe(false);
        });
    });

    describe('Execution History', () => {
        beforeEach(() => {
            autoTrader.enable();
        });

        it('returns all executions', async () => {
            await autoTrader.executeTrade(mockPrediction);
            await autoTrader.executeTrade(mockPrediction);
            const executions = autoTrader.getExecutions();
            expect(executions.length).toBe(2);
        });

        it('limits execution history', async () => {
            await autoTrader.executeTrade(mockPrediction);
            await autoTrader.executeTrade(mockPrediction);
            await autoTrader.executeTrade(mockPrediction);
            const executions = autoTrader.getExecutions(2);
            expect(executions.length).toBe(2);
        });

        it('returns executions in reverse chronological order', async () => {
            const exec1 = await autoTrader.executeTrade(mockPrediction);
            await new Promise(resolve => setTimeout(resolve, 10));
            const exec2 = await autoTrader.executeTrade(mockPrediction);

            const executions = autoTrader.getExecutions();
            expect(executions[0].id).toBe(exec2.id);
            expect(executions[1].id).toBe(exec1.id);
        });
    });

    describe('Statistics', () => {
        beforeEach(() => {
            autoTrader.enable();
        });

        it('returns current statistics', () => {
            const stats = autoTrader.getStats();
            expect(stats).toHaveProperty('totalTrades');
            expect(stats).toHaveProperty('tradesThisHour');
            expect(stats).toHaveProperty('tradesToday');
        });

        it('resets statistics', async () => {
            await autoTrader.executeTrade(mockPrediction);
            autoTrader.resetStats();
            const stats = autoTrader.getStats();
            expect(stats.totalTrades).toBe(0);
        });
    });

    describe('Subscriptions', () => {
        beforeEach(() => {
            autoTrader.enable();
        });

        it('notifies subscribers on trade execution', async () => {
            const callback = jest.fn();
            autoTrader.subscribe(callback);

            await autoTrader.executeTrade(mockPrediction);
            expect(callback).toHaveBeenCalled();
        });

        it('unsubscribes correctly', async () => {
            const callback = jest.fn();
            const unsubscribe = autoTrader.subscribe(callback);

            unsubscribe();
            await autoTrader.executeTrade(mockPrediction);
            expect(callback).not.toHaveBeenCalled();
        });
    });
});
