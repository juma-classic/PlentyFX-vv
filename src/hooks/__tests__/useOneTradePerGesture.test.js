import { renderHook, act } from '@testing-library/react';
import { useOneTradePerGesture } from '../useOneTradePerGesture';

describe('useOneTradePerGesture - Comprehensive Safety Tests', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    describe('Basic Functionality', () => {
        it('should initialize with idle state when disabled', () => {
            const { result } = renderHook(() => useOneTradePerGesture({ enabled: false }));

            expect(result.current.gestureState).toBe('idle');
            expect(result.current.canExecuteTrade()).toBe(true);
            expect(result.current.enabled).toBe(false);
        });

        it('should initialize with idle state when enabled', () => {
            const { result } = renderHook(() => useOneTradePerGesture({ enabled: true }));

            expect(result.current.gestureState).toBe('idle');
            expect(result.current.canExecuteTrade()).toBe(false);
            expect(result.current.enabled).toBe(true);
        });

        it('should transition to moving state on cursor movement', () => {
            const { result } = renderHook(() => useOneTradePerGesture({ enabled: true }));

            act(() => {
                result.current.notifyCursorMove();
            });

            expect(result.current.gestureState).toBe('moving');
            expect(result.current.canExecuteTrade()).toBe(false);
        });

        it('should stabilize gesture after debounce period', () => {
            const { result } = renderHook(() =>
                useOneTradePerGesture({
                    enabled: true,
                    debounceMs: 400,
                })
            );

            act(() => {
                result.current.notifyCursorMove();
            });

            expect(result.current.gestureState).toBe('moving');

            act(() => {
                jest.advanceTimersByTime(400);
            });

            expect(result.current.gestureState).toBe('stabilized');
            expect(result.current.canExecuteTrade()).toBe(true);
        });
    });

    describe('Critical Safety Enforcement', () => {
        it('should prevent multiple trades from rapid cursor movements', () => {
            const { result } = renderHook(() =>
                useOneTradePerGesture({
                    enabled: true,
                    debounceMs: 400,
                })
            );

            // Simulate rapid cursor movements (like Ultra-Fast Mode would generate)
            act(() => {
                result.current.notifyCursorMove();
                result.current.notifyCursorMove();
                result.current.notifyCursorMove();
                result.current.notifyCursorMove();
                result.current.notifyCursorMove();
            });

            // Should still be in moving state
            expect(result.current.gestureState).toBe('moving');
            expect(result.current.canExecuteTrade()).toBe(false);

            // Stabilize
            act(() => {
                jest.advanceTimersByTime(400);
            });

            expect(result.current.gestureState).toBe('stabilized');
            expect(result.current.canExecuteTrade()).toBe(true);

            // Execute trade
            act(() => {
                result.current.notifyTradeExecuted();
            });

            expect(result.current.gestureState).toBe('locked');
            expect(result.current.canExecuteTrade()).toBe(false);

            // Verify stats show only 1 trade despite multiple movements
            expect(result.current.stats.totalTrades).toBe(1);
        });

        it('should enforce unique trade intent IDs', () => {
            const { result } = renderHook(() =>
                useOneTradePerGesture({
                    enabled: true,
                    debounceMs: 400,
                })
            );

            // First gesture
            act(() => {
                result.current.notifyCursorMove();
            });

            act(() => {
                jest.advanceTimersByTime(400);
            });

            const firstIntentId = result.current.getCurrentTradeIntentId();
            expect(firstIntentId).toBeTruthy();
            expect(result.current.canExecuteTrade()).toBe(true);

            // Execute trade
            act(() => {
                result.current.notifyTradeExecuted();
            });

            expect(result.current.isIntentIdExecuted(firstIntentId)).toBe(true);
            expect(result.current.canExecuteTrade()).toBe(false);

            // Start new gesture
            act(() => {
                result.current.notifyCursorMove();
            });

            act(() => {
                jest.advanceTimersByTime(400);
            });

            const secondIntentId = result.current.getCurrentTradeIntentId();
            expect(secondIntentId).toBeTruthy();
            expect(secondIntentId).not.toBe(firstIntentId);
            expect(result.current.canExecuteTrade()).toBe(true);
        });

        it('should block trades without valid intent ID', () => {
            const { result } = renderHook(() =>
                useOneTradePerGesture({
                    enabled: true,
                    debounceMs: 400,
                })
            );

            // Try to execute trade without gesture
            act(() => {
                result.current.notifyTradeExecuted();
            });

            expect(console.warn).toHaveBeenCalledWith('🚫 Trade executed without valid intent ID');
            expect(result.current.stats.totalTrades).toBe(0);
        });

        it('should restart gesture on cursor movement after stabilization', () => {
            const { result } = renderHook(() =>
                useOneTradePerGesture({
                    enabled: true,
                    debounceMs: 400,
                })
            );

            // First gesture
            act(() => {
                result.current.notifyCursorMove();
            });

            act(() => {
                jest.advanceTimersByTime(400);
            });

            expect(result.current.gestureState).toBe('stabilized');
            expect(result.current.canExecuteTrade()).toBe(true);

            // Move cursor again - should restart gesture
            act(() => {
                result.current.notifyCursorMove();
            });

            expect(result.current.gestureState).toBe('moving');
            expect(result.current.canExecuteTrade()).toBe(false);
        });
    });

    describe('Ultra-Fast Mode Bypass Prevention', () => {
        it('should prevent Ultra-Fast Mode from bypassing gesture safety', () => {
            const { result } = renderHook(() =>
                useOneTradePerGesture({
                    enabled: true,
                    debounceMs: 100, // Shorter for ultra-fast simulation
                })
            );

            // Simulate Ultra-Fast Mode trying to execute multiple trades rapidly
            const tradeAttempts = [];

            for (let i = 0; i < 10; i++) {
                act(() => {
                    result.current.notifyCursorMove();
                });

                // Try to execute trade immediately (Ultra-Fast Mode behavior)
                const canTrade = result.current.canExecuteTrade();
                tradeAttempts.push(canTrade);

                if (canTrade) {
                    act(() => {
                        result.current.notifyTradeExecuted();
                    });
                }

                // Advance time slightly
                act(() => {
                    jest.advanceTimersByTime(10);
                });
            }

            // Should have blocked all immediate trade attempts
            expect(tradeAttempts.every(canTrade => !canTrade)).toBe(true);
            expect(result.current.stats.totalTrades).toBe(0);
        });

        it('should enforce gesture completion even with 50ms intervals', () => {
            const { result } = renderHook(() =>
                useOneTradePerGesture({
                    enabled: true,
                    debounceMs: 400,
                })
            );

            // Simulate Ultra-Fast Mode 50ms intervals
            for (let i = 0; i < 8; i++) {
                // 8 * 50ms = 400ms
                act(() => {
                    result.current.notifyCursorMove();
                });

                act(() => {
                    jest.advanceTimersByTime(50);
                });

                // Should not be able to trade during rapid movements
                expect(result.current.canExecuteTrade()).toBe(false);
            }

            // Only after full debounce period should trade be allowed
            act(() => {
                jest.advanceTimersByTime(400);
            });

            expect(result.current.canExecuteTrade()).toBe(true);
        });
    });

    describe('Statistics and Tracking', () => {
        it('should track gesture statistics correctly', () => {
            const { result } = renderHook(() =>
                useOneTradePerGesture({
                    enabled: true,
                    debounceMs: 400,
                })
            );

            // First gesture
            act(() => {
                result.current.notifyCursorMove();
            });

            act(() => {
                jest.advanceTimersByTime(400);
            });

            expect(result.current.stats.totalGestures).toBe(1);

            act(() => {
                result.current.notifyTradeExecuted();
            });

            expect(result.current.stats.totalTrades).toBe(1);

            // Second gesture
            act(() => {
                result.current.notifyCursorMove();
            });

            act(() => {
                jest.advanceTimersByTime(400);
            });

            expect(result.current.stats.totalGestures).toBe(2);

            // Don't execute trade this time
            expect(result.current.stats.totalTrades).toBe(1);
        });

        it('should track blocked trades', () => {
            const { result } = renderHook(() =>
                useOneTradePerGesture({
                    enabled: true,
                    debounceMs: 400,
                })
            );

            // Create gesture and execute trade
            act(() => {
                result.current.notifyCursorMove();
            });

            act(() => {
                jest.advanceTimersByTime(400);
            });

            const intentId = result.current.getCurrentTradeIntentId();

            act(() => {
                result.current.notifyTradeExecuted();
            });

            // Try to use same intent ID again (should be blocked)
            // This simulates internal safety check
            expect(result.current.isIntentIdExecuted(intentId)).toBe(true);
        });
    });

    describe('UI Status Integration', () => {
        it('should provide correct gesture status messages', () => {
            const { result } = renderHook(() => useOneTradePerGesture({ enabled: true }));

            // Idle state
            expect(result.current.getGestureStatus().status).toBe('idle');
            expect(result.current.getGestureStatus().message).toBe('Ready - Move cursor to start gesture');

            // Moving state
            act(() => {
                result.current.notifyCursorMove();
            });

            expect(result.current.getGestureStatus().status).toBe('moving');
            expect(result.current.getGestureStatus().message).toBe('Cursor Moving');

            // Stabilized state
            act(() => {
                jest.advanceTimersByTime(400);
            });

            expect(result.current.getGestureStatus().status).toBe('stabilized');
            expect(result.current.getGestureStatus().message).toBe('Gesture Stabilized - Trade allowed');

            // Locked state
            act(() => {
                result.current.notifyTradeExecuted();
            });

            expect(result.current.getGestureStatus().status).toBe('locked');
            expect(result.current.getGestureStatus().message).toBe('Trade Executed – Waiting for Next Gesture');
        });

        it('should indicate when feature is disabled', () => {
            const { result } = renderHook(() => useOneTradePerGesture({ enabled: false }));

            const status = result.current.getGestureStatus();
            expect(status.status).toBe('disabled');
            expect(status.message).toBe('Feature disabled');
        });
    });

    describe('Reset and Cleanup', () => {
        it('should reset all state when reset is called', () => {
            const { result } = renderHook(() =>
                useOneTradePerGesture({
                    enabled: true,
                    debounceMs: 400,
                })
            );

            // Set up some state
            act(() => {
                result.current.notifyCursorMove();
            });

            act(() => {
                jest.advanceTimersByTime(400);
            });

            act(() => {
                result.current.notifyTradeExecuted();
            });

            expect(result.current.gestureState).toBe('locked');
            expect(result.current.executedIntentCount).toBeGreaterThan(0);

            // Reset
            act(() => {
                result.current.reset();
            });

            expect(result.current.gestureState).toBe('idle');
            expect(result.current.canExecuteTrade()).toBe(false);
            expect(result.current.executedIntentCount).toBe(0);
        });

        it('should clear timers on unmount', () => {
            const { result, unmount } = renderHook(() =>
                useOneTradePerGesture({
                    enabled: true,
                    debounceMs: 400,
                })
            );

            act(() => {
                result.current.notifyCursorMove();
            });

            // Unmount before timer completes
            unmount();

            // Should not throw errors
            act(() => {
                jest.advanceTimersByTime(400);
            });
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle rapid enable/disable toggling', () => {
            const { result, rerender } = renderHook(({ enabled }) => useOneTradePerGesture({ enabled }), {
                initialProps: { enabled: true },
            });

            act(() => {
                result.current.notifyCursorMove();
            });

            // Disable while gesture is active
            rerender({ enabled: false });

            expect(result.current.canExecuteTrade()).toBe(true); // Should allow when disabled

            // Re-enable
            rerender({ enabled: true });

            expect(result.current.canExecuteTrade()).toBe(false); // Should enforce safety when enabled
        });

        it('should handle zero debounce time', () => {
            const { result } = renderHook(() =>
                useOneTradePerGesture({
                    enabled: true,
                    debounceMs: 0,
                })
            );

            act(() => {
                result.current.notifyCursorMove();
            });

            act(() => {
                jest.advanceTimersByTime(0);
            });

            expect(result.current.gestureState).toBe('stabilized');
            expect(result.current.canExecuteTrade()).toBe(true);
        });

        it('should handle very large debounce times', () => {
            const { result } = renderHook(() =>
                useOneTradePerGesture({
                    enabled: true,
                    debounceMs: 10000,
                })
            );

            act(() => {
                result.current.notifyCursorMove();
            });

            act(() => {
                jest.advanceTimersByTime(9999);
            });

            expect(result.current.gestureState).toBe('moving');
            expect(result.current.canExecuteTrade()).toBe(false);

            act(() => {
                jest.advanceTimersByTime(1);
            });

            expect(result.current.gestureState).toBe('stabilized');
            expect(result.current.canExecuteTrade()).toBe(true);
        });
    });
});
