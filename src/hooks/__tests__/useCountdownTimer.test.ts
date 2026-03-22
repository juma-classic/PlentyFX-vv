import { act,renderHook } from '@testing-library/react';
import { useCountdownTimer } from '../useCountdownTimer';

jest.useFakeTimers();

describe('useCountdownTimer', () => {
    afterEach(() => {
        jest.clearAllTimers();
    });

    it('initializes with correct state', () => {
        const { result } = renderHook(() => useCountdownTimer(5));

        expect(result.current.ticksRemaining).toBe(5);
        expect(result.current.isActive).toBe(false);
        expect(result.current.isExpired).toBe(false);
        expect(result.current.progress).toBe(100);
    });

    it('starts countdown', () => {
        const { result } = renderHook(() => useCountdownTimer(5));

        act(() => {
            result.current.start();
        });

        expect(result.current.isActive).toBe(true);
        expect(result.current.ticksRemaining).toBe(5);
    });

    it('counts down correctly', () => {
        const { result } = renderHook(() => useCountdownTimer(3));

        act(() => {
            result.current.start();
        });

        act(() => {
            jest.advanceTimersByTime(1000);
        });

        expect(result.current.ticksRemaining).toBe(2);

        act(() => {
            jest.advanceTimersByTime(1000);
        });

        expect(result.current.ticksRemaining).toBe(1);
    });

    it('expires when reaching zero', () => {
        const onExpire = jest.fn();
        const { result } = renderHook(() => useCountdownTimer(2, { onExpire }));

        act(() => {
            result.current.start();
        });

        act(() => {
            jest.advanceTimersByTime(2000);
        });

        expect(result.current.ticksRemaining).toBe(0);
        expect(result.current.isExpired).toBe(true);
        expect(result.current.isActive).toBe(false);
        expect(onExpire).toHaveBeenCalled();
    });

    it('pauses countdown', () => {
        const { result } = renderHook(() => useCountdownTimer(5));

        act(() => {
            result.current.start();
        });

        act(() => {
            jest.advanceTimersByTime(1000);
        });

        expect(result.current.ticksRemaining).toBe(4);

        act(() => {
            result.current.pause();
        });

        expect(result.current.isActive).toBe(false);

        act(() => {
            jest.advanceTimersByTime(2000);
        });

        // Should still be 4 (paused)
        expect(result.current.ticksRemaining).toBe(4);
    });

    it('resumes countdown', () => {
        const { result } = renderHook(() => useCountdownTimer(5));

        act(() => {
            result.current.start();
        });

        act(() => {
            jest.advanceTimersByTime(1000);
        });

        act(() => {
            result.current.pause();
        });

        act(() => {
            result.current.resume();
        });

        expect(result.current.isActive).toBe(true);

        act(() => {
            jest.advanceTimersByTime(1000);
        });

        expect(result.current.ticksRemaining).toBe(3);
    });

    it('cancels countdown', () => {
        const { result } = renderHook(() => useCountdownTimer(5));

        act(() => {
            result.current.start();
        });

        act(() => {
            jest.advanceTimersByTime(2000);
        });

        act(() => {
            result.current.cancel();
        });

        expect(result.current.ticksRemaining).toBe(5);
        expect(result.current.isActive).toBe(false);
        expect(result.current.isExpired).toBe(false);
    });

    it('resets countdown', () => {
        const { result } = renderHook(() => useCountdownTimer(5));

        act(() => {
            result.current.start();
        });

        act(() => {
            jest.advanceTimersByTime(3000);
        });

        act(() => {
            result.current.reset();
        });

        expect(result.current.ticksRemaining).toBe(5);
        expect(result.current.isActive).toBe(false);
        expect(result.current.progress).toBe(100);
    });

    it('triggers onTick callback', () => {
        const onTick = jest.fn();
        const { result } = renderHook(() => useCountdownTimer(3, { onTick }));

        act(() => {
            result.current.start();
        });

        act(() => {
            jest.advanceTimersByTime(1000);
        });

        expect(onTick).toHaveBeenCalledWith(2);
    });

    it('triggers onWarning callback at 3, 2, 1', () => {
        const onWarning = jest.fn();
        const { result } = renderHook(() => useCountdownTimer(5, { onWarning }));

        act(() => {
            result.current.start();
        });

        act(() => {
            jest.advanceTimersByTime(2000);
        });

        expect(onWarning).not.toHaveBeenCalled();

        act(() => {
            jest.advanceTimersByTime(1000);
        });

        expect(onWarning).toHaveBeenCalledWith(2);

        act(() => {
            jest.advanceTimersByTime(1000);
        });

        expect(onWarning).toHaveBeenCalledWith(1);
    });

    it('calculates progress correctly', () => {
        const { result } = renderHook(() => useCountdownTimer(4));

        act(() => {
            result.current.start();
        });

        expect(result.current.progress).toBe(100);

        act(() => {
            jest.advanceTimersByTime(1000);
        });

        expect(result.current.progress).toBe(75);

        act(() => {
            jest.advanceTimersByTime(1000);
        });

        expect(result.current.progress).toBe(50);
    });
});
