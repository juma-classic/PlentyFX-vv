import { renderHook, act } from '@testing-library/react';
import { useOneTradePerPriceMovement } from '../useOneTradePerPriceMovement';

// Mock timers for testing
jest.useFakeTimers();

describe('useOneTradePerPriceMovement', () => {
    beforeEach(() => {
        jest.clearAllTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
        jest.useFakeTimers();
    });

    describe('Basic Functionality', () => {
        test('should initialize with idle state when enabled', () => {
            const { result } = renderHook(() => useOneTradePerPriceMovement({ enabled: true }));

            expect(result.current.movementState).toBe('idle');
            expect(result.current.canExecuteTrade()).toBe(false);
            expect(result.current.getMovementStatus().status).toBe('idle');
            expect(result.current.getMovementStatus().message).toBe('Ready - Waiting for price movement');
        });

        test('should allow all trades when disabled', () => {
            const { result } = renderHook(() => useOneTradePerPriceMovement({ enabled: false }));

            expect(result.current.canExecuteTrade()).toBe(true);
            expect(result.current.getMovementStatus().status).toBe('disabled');
        });
    });

    describe('Price Movement Detection', () => {
        test('should detect price movement and transition to detecting state', () => {
            const { result } = renderHook(() => useOneTradePerPriceMovement({ enabled: true, stabilizationMs: 1000 }));

            // First price - should not trigger movement
            act(() => {
                result.current.notifyPriceChange(100.5);
            });
            expect(result.current.movementState).toBe('idle');

            // Same price - should not trigger movement
            act(() => {
                result.current.notifyPriceChange(100.5);
            });
            expect(result.current.movementState).toBe('idle');

            // Price change - should trigger movement detection
            act(() => {
                result.current.notifyPriceChange(100.51);
            });
            expect(result.current.movementState).toBe('detecting');
            expect(result.current.canExecuteTrade()).toBe(false);
            expect(result.current.getMovementStatus().message).toBe('Price Moving - Detecting movement');
        });

        test('should stabilize after stabilization period', () => {
            const { result } = renderHook(() => useOneTradePerPriceMovement({ enabled: true, stabilizationMs: 1000 }));

            // Trigger price movement
            act(() => {
                result.current.notifyPriceChange(100.5);
                result.current.notifyPriceChange(100.51);
            });

            expect(result.current.movementState).toBe('detecting');

            // Fast-forward time to complete stabilization
            act(() => {
                jest.advanceTimersByTime(1000);
            });

            expect(result.current.movementState).toBe('stabilized');
            expect(result.current.canExecuteTrade()).toBe(true);
            expect(result.current.getMovementStatus().message).toBe('Movement Complete - Trade allowed');
        });

        test('should restart movement detection if price changes during stabilization', () => {
            const { result } = renderHook(() => useOneTradePerPriceMovement({ enabled: true, stabilizationMs: 1000 }));

            // Initial price movement
            act(() => {
                result.current.notifyPriceChange(100.5);
                result.current.notifyPriceChange(100.51);
            });

            expect(result.current.movementState).toBe('detecting');

            // Price changes again before stabilization
            act(() => {
                jest.advanceTimersByTime(500); // Half way through stabilization
                result.current.notifyPriceChange(100.52);
            });

            expect(result.current.movementState).toBe('detecting');
            expect(result.current.canExecuteTrade()).toBe(false);

            // Complete new stabilization period
            act(() => {
                jest.advanceTimersByTime(1000);
            });

            expect(result.current.movementState).toBe('stabilized');
            expect(result.current.canExecuteTrade()).toBe(true);
        });
    });

    describe('Trade Execution Safety', () => {
        test('should allow trade execution only when stabilized', () => {
            const { result } = renderHook(() => useOneTradePerPriceMovement({ enabled: true, stabilizationMs: 1000 }));

            // No trade allowed in idle state
            expect(result.current.canExecuteTrade()).toBe(false);

            // Trigger movement
            act(() => {
                result.current.notifyPriceChange(100.5);
                result.current.notifyPriceChange(100.51);
            });

            // No trade allowed during detection
            expect(result.current.canExecuteTrade()).toBe(false);

            // Allow trade after stabilization
            act(() => {
                jest.advanceTimersByTime(1000);
            });

            expect(result.current.canExecuteTrade()).toBe(true);
        });

        test('should lock after trade execution', () => {
            const { result } = renderHook(() => useOneTradePerPriceMovement({ enabled: true, stabilizationMs: 1000 }));

            // Trigger movement and stabilize
            act(() => {
                result.current.notifyPriceChange(100.5);
                result.current.notifyPriceChange(100.51);
                jest.advanceTimersByTime(1000);
            });

            expect(result.current.canExecuteTrade()).toBe(true);

            // Execute trade
            act(() => {
                result.current.notifyTradeExecuted();
            });

            expect(result.current.movementState).toBe('locked');
            expect(result.current.canExecuteTrade()).toBe(false);
            expect(result.current.getMovementStatus().message).toBe(
                'Trade Executed - Locked until next price movement'
            );
        });

        test('should prevent duplicate trade execution with intent IDs', () => {
            const { result } = renderHook(() => useOneTradePerPriceMovement({ enabled: true, stabilizationMs: 1000 }));

            // Trigger movement and stabilize
            act(() => {
                result.current.notifyPriceChange(100.5);
                result.current.notifyPriceChange(100.51);
                jest.advanceTimersByTime(1000);
            });

            const intentId = result.current.getCurrentTradeIntentId();
            expect(intentId).toBeTruthy();
            expect(result.current.canExecuteTrade()).toBe(true);

            // Execute trade
            act(() => {
                result.current.notifyTradeExecuted();
            });

            // Should be locked and not allow another trade
            expect(result.current.canExecuteTrade()).toBe(false);
            expect(result.current.stats.totalTrades).toBe(1);
        });
    });

    describe('Statistics Tracking', () => {
        test('should track movement and trade statistics', () => {
            const { result } = renderHook(() => useOneTradePerPriceMovement({ enabled: true, stabilizationMs: 100 }));

            // Initial stats
            expect(result.current.stats.totalMovements).toBe(0);
            expect(result.current.stats.totalTrades).toBe(0);

            // Trigger movement and stabilize
            act(() => {
                result.current.notifyPriceChange(100.5);
                result.current.notifyPriceChange(100.51);
                jest.advanceTimersByTime(100);
            });

            expect(result.current.stats.totalMovements).toBe(1);
            expect(result.current.stats.avgMovementDuration).toBeGreaterThan(0);

            // Execute trade
            act(() => {
                result.current.notifyTradeExecuted();
            });

            expect(result.current.stats.totalTrades).toBe(1);
        });
    });

    describe('Reset Functionality', () => {
        test('should reset all state and statistics', () => {
            const { result } = renderHook(() => useOneTradePerPriceMovement({ enabled: true, stabilizationMs: 1000 }));

            // Trigger movement and execute trade
            act(() => {
                result.current.notifyPriceChange(100.5);
                result.current.notifyPriceChange(100.51);
                jest.advanceTimersByTime(1000);
                result.current.notifyTradeExecuted();
            });

            expect(result.current.movementState).toBe('locked');
            expect(result.current.stats.totalTrades).toBe(1);

            // Reset
            act(() => {
                result.current.reset();
            });

            expect(result.current.movementState).toBe('idle');
            expect(result.current.canExecuteTrade()).toBe(false);
            expect(result.current.currentMovementId).toBe(0);
            expect(result.current.lastPrice).toBe(null);
        });
    });

    describe('Edge Cases', () => {
        test('should handle invalid price values', () => {
            const { result } = renderHook(() => useOneTradePerPriceMovement({ enabled: true }));

            // Invalid price values should be ignored
            act(() => {
                result.current.notifyPriceChange('invalid');
                result.current.notifyPriceChange(NaN);
                result.current.notifyPriceChange(null);
                result.current.notifyPriceChange(undefined);
            });

            expect(result.current.movementState).toBe('idle');
        });

        test('should handle trade execution without valid intent ID', () => {
            const { result } = renderHook(() => useOneTradePerPriceMovement({ enabled: true }));

            // Try to execute trade without movement
            act(() => {
                result.current.notifyTradeExecuted();
            });

            // Should not crash or change state inappropriately
            expect(result.current.movementState).toBe('idle');
            expect(result.current.stats.totalTrades).toBe(0);
        });
    });
});
