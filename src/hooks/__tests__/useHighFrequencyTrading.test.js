import { renderHook, act } from '@testing-library/react';
import { useHighFrequencyTrading } from '../useHighFrequencyTrading';

// Mock timers
jest.useFakeTimers();

describe('useHighFrequencyTrading', () => {
    beforeEach(() => {
        jest.clearAllTimers();
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    test('should initialize with correct default state', () => {
        const { result } = renderHook(() => useHighFrequencyTrading({ enabled: true }));

        expect(result.current.isRunning).toBe(false);
        expect(result.current.cycleState).toBe('idle');
        expect(result.current.currentCycle).toBe(0);
        expect(result.current.contractsInCycle).toBe(0);
        expect(result.current.enabled).toBe(true);
        expect(result.current.CONTRACT_INTERVAL).toBe(100);
        expect(result.current.CYCLE_DURATION).toBe(400);
        expect(result.current.MAX_CONTRACTS_PER_CYCLE).toBe(4);
    });

    test('should return disabled status when not enabled', () => {
        const { result } = renderHook(() => useHighFrequencyTrading({ enabled: false }));

        const status = result.current.getStatus();
        expect(status.status).toBe('disabled');
        expect(status.message).toBe('High-frequency trading disabled');
        expect(status.canTrade).toBe(true);
    });

    test('should return ready status when enabled but not running', () => {
        const { result } = renderHook(() => useHighFrequencyTrading({ enabled: true }));

        const status = result.current.getStatus();
        expect(status.status).toBe('ready');
        expect(status.message).toBe('Ready for high-frequency trading');
        expect(status.canTrade).toBe(true);
    });

    test('should start HFT mode correctly', () => {
        const { result } = renderHook(() => useHighFrequencyTrading({ enabled: true }));
        const mockCallback = jest.fn();

        act(() => {
            const started = result.current.start(mockCallback);
            expect(started).toBe(true);
        });

        expect(result.current.isRunning).toBe(true);
        expect(result.current.currentCycle).toBe(0);
        expect(result.current.contractsInCycle).toBe(0);
    });

    test('should not start when disabled', () => {
        const { result } = renderHook(() => useHighFrequencyTrading({ enabled: false }));
        const mockCallback = jest.fn();

        act(() => {
            const started = result.current.start(mockCallback);
            expect(started).toBe(false);
        });

        expect(result.current.isRunning).toBe(false);
    });

    test('should not start when already running', () => {
        const { result } = renderHook(() => useHighFrequencyTrading({ enabled: true }));
        const mockCallback = jest.fn();

        act(() => {
            result.current.start(mockCallback);
        });

        act(() => {
            const startedAgain = result.current.start(mockCallback);
            expect(startedAgain).toBe(false);
        });
    });

    test('should execute contracts at correct intervals', () => {
        const { result } = renderHook(() => useHighFrequencyTrading({ enabled: true }));
        const mockCallback = jest.fn();

        act(() => {
            result.current.start(mockCallback);
        });

        // Should start first cycle immediately
        expect(result.current.currentCycle).toBe(1);
        expect(result.current.cycleState).toBe('active');

        // Fast forward through contract intervals
        act(() => {
            jest.advanceTimersByTime(100); // First contract
        });
        expect(mockCallback).toHaveBeenCalledTimes(1);
        expect(result.current.contractsInCycle).toBe(1);

        act(() => {
            jest.advanceTimersByTime(100); // Second contract
        });
        expect(mockCallback).toHaveBeenCalledTimes(2);
        expect(result.current.contractsInCycle).toBe(2);

        act(() => {
            jest.advanceTimersByTime(100); // Third contract
        });
        expect(mockCallback).toHaveBeenCalledTimes(3);
        expect(result.current.contractsInCycle).toBe(3);

        act(() => {
            jest.advanceTimersByTime(100); // Fourth contract
        });
        expect(mockCallback).toHaveBeenCalledTimes(4);
        expect(result.current.contractsInCycle).toBe(4);
    });

    test('should complete cycle after 400ms and start next cycle', () => {
        const { result } = renderHook(() => useHighFrequencyTrading({ enabled: true }));
        const mockCallback = jest.fn();

        act(() => {
            result.current.start(mockCallback);
        });

        // Fast forward through entire first cycle (400ms cycle + next cycle start)
        act(() => {
            jest.advanceTimersByTime(450);
        });

        expect(result.current.currentCycle).toBe(2); // Should be on second cycle
        expect(result.current.contractsInCycle).toBe(0); // Reset for new cycle
        expect(result.current.stats.totalCycles).toBe(1); // First cycle completed
    });

    test('should stop HFT mode correctly', () => {
        const { result } = renderHook(() => useHighFrequencyTrading({ enabled: true }));
        const mockCallback = jest.fn();

        act(() => {
            result.current.start(mockCallback);
        });

        expect(result.current.isRunning).toBe(true);

        act(() => {
            const stopped = result.current.stop();
            expect(stopped).toBe(true);
        });

        expect(result.current.isRunning).toBe(false);
        expect(result.current.cycleState).toBe('idle');
    });

    test('should reset statistics correctly', () => {
        const { result } = renderHook(() => useHighFrequencyTrading({ enabled: true }));
        const mockCallback = jest.fn();

        act(() => {
            result.current.start(mockCallback);
        });

        // Run for a bit to generate stats (complete at least one cycle)
        act(() => {
            jest.advanceTimersByTime(450); // 400ms cycle + next cycle start
        });

        expect(result.current.stats.totalCycles).toBeGreaterThan(0);

        act(() => {
            result.current.reset();
        });

        expect(result.current.isRunning).toBe(false);
        expect(result.current.stats.totalCycles).toBe(0);
        expect(result.current.stats.totalContracts).toBe(0);
        expect(result.current.currentCycle).toBe(0);
    });

    test('should generate unique contract IDs', () => {
        const { result } = renderHook(() => useHighFrequencyTrading({ enabled: true }));
        const mockCallback = jest.fn();

        act(() => {
            result.current.start(mockCallback);
        });

        // Execute a few contracts (2 contract intervals)
        act(() => {
            jest.advanceTimersByTime(200); // 100ms + 100ms for 2 contracts
        });

        // Check that callback was called with unique IDs
        expect(mockCallback).toHaveBeenCalledTimes(2);

        const firstCallId = mockCallback.mock.calls[0][0];
        const secondCallId = mockCallback.mock.calls[1][0];

        expect(firstCallId).toMatch(/^hft_\d+_\d+_\d+$/);
        expect(secondCallId).toMatch(/^hft_\d+_\d+_\d+$/);
        expect(firstCallId).not.toBe(secondCallId);
    });

    test('should not execute more than 4 contracts per cycle', () => {
        const { result } = renderHook(() => useHighFrequencyTrading({ enabled: true }));
        const mockCallback = jest.fn();

        act(() => {
            result.current.start(mockCallback);
        });

        // Fast forward through entire cycle (full cycle)
        act(() => {
            jest.advanceTimersByTime(450); // 400ms cycle + buffer
        });

        // Should have executed exactly 4 contracts in first cycle
        expect(mockCallback).toHaveBeenCalledTimes(4);
    });

    test('should always allow normal trading (canExecuteTrade returns true)', () => {
        const { result } = renderHook(() => useHighFrequencyTrading({ enabled: true }));

        expect(result.current.canExecuteTrade()).toBe(true);

        act(() => {
            result.current.start(jest.fn());
        });

        expect(result.current.canExecuteTrade()).toBe(true);
    });
});
