import { renderHook } from '@testing-library/react';
import { useStreakCounter } from '../useStreakCounter';

describe('useStreakCounter', () => {
    it('correctly counts streaks', () => {
        const pattern = ['EVEN', 'EVEN', 'EVEN', 'ODD'];
        const { result } = renderHook(() => useStreakCounter(pattern));

        expect(result.current.currentStreak.count).toBe(1);
        expect(result.current.currentStreak.type).toBe('ODD');
    });

    it('resets on pattern break', () => {
        const { result, rerender } = renderHook(({ pattern }) => useStreakCounter(pattern), {
            initialProps: { pattern: ['EVEN', 'EVEN', 'EVEN'] },
        });

        expect(result.current.currentStreak.count).toBe(3);
        expect(result.current.currentStreak.type).toBe('EVEN');

        rerender({ pattern: ['EVEN', 'EVEN', 'EVEN', 'ODD'] });

        expect(result.current.currentStreak.count).toBe(1);
        expect(result.current.currentStreak.type).toBe('ODD');
    });

    it('emits milestone events at 5, 7, 10', () => {
        const onMilestone = jest.fn();

        const { rerender } = renderHook(({ pattern }) => useStreakCounter(pattern, onMilestone), {
            initialProps: { pattern: Array(4).fill('EVEN') },
        });

        // No milestone yet
        expect(onMilestone).not.toHaveBeenCalled();

        // Reach 5 - milestone!
        rerender({ pattern: Array(5).fill('EVEN') });
        expect(onMilestone).toHaveBeenCalledWith(
            expect.objectContaining({
                count: 5,
                type: 'EVEN',
            })
        );

        // Reach 7 - another milestone!
        rerender({ pattern: Array(7).fill('EVEN') });
        expect(onMilestone).toHaveBeenCalledWith(
            expect.objectContaining({
                count: 7,
                type: 'EVEN',
            })
        );
    });

    it('handles empty data gracefully', () => {
        const { result } = renderHook(() => useStreakCounter([]));

        expect(result.current.currentStreak.count).toBe(0);
        expect(result.current.currentStreak.type).toBe('');
    });

    it('detects Fibonacci numbers', () => {
        const { result, rerender } = renderHook(({ pattern }) => useStreakCounter(pattern), {
            initialProps: { pattern: Array(5).fill('EVEN') },
        });

        expect(result.current.currentStreak.isFibonacci).toBe(true);

        rerender({ pattern: Array(8).fill('EVEN') });
        expect(result.current.currentStreak.isFibonacci).toBe(true);

        rerender({ pattern: Array(6).fill('EVEN') });
        expect(result.current.currentStreak.isFibonacci).toBe(false);
    });

    it('marks significant streaks (5+)', () => {
        const { result, rerender } = renderHook(({ pattern }) => useStreakCounter(pattern), {
            initialProps: { pattern: Array(4).fill('EVEN') },
        });

        expect(result.current.currentStreak.isSignificant).toBe(false);

        rerender({ pattern: Array(5).fill('EVEN') });
        expect(result.current.currentStreak.isSignificant).toBe(true);
    });

    it('calculates probability correctly', () => {
        const { result, rerender } = renderHook(({ pattern }) => useStreakCounter(pattern), {
            initialProps: { pattern: ['EVEN'] },
        });

        const prob1 = result.current.currentStreak.probability;
        expect(prob1).toBeGreaterThan(0);
        expect(prob1).toBeLessThanOrEqual(100);

        rerender({ pattern: Array(10).fill('EVEN') });
        const prob10 = result.current.currentStreak.probability;

        // Probability should decrease with longer streaks
        expect(prob10).toBeLessThan(prob1);
    });

    it('provides streak description', () => {
        const { result, rerender } = renderHook(({ pattern }) => useStreakCounter(pattern), {
            initialProps: { pattern: [] },
        });

        expect(result.current.getStreakDescription()).toBe('No streak');

        rerender({ pattern: ['EVEN'] });
        expect(result.current.getStreakDescription()).toBe('1 EVEN');

        rerender({ pattern: ['EVEN', 'EVEN', 'EVEN'] });
        expect(result.current.getStreakDescription()).toBe('3 consecutive EVEN');
    });

    it('tracks streak history', () => {
        const { result, rerender } = renderHook(({ pattern }) => useStreakCounter(pattern), {
            initialProps: { pattern: Array(5).fill('EVEN') },
        });

        expect(result.current.streakHistory).toHaveLength(1);
        expect(result.current.streakHistory[0].count).toBe(5);

        rerender({ pattern: Array(7).fill('EVEN') });
        expect(result.current.streakHistory).toHaveLength(2);
        expect(result.current.streakHistory[1].count).toBe(7);
    });

    it('provides color based on streak length', () => {
        const { result, rerender } = renderHook(({ pattern }) => useStreakCounter(pattern), {
            initialProps: { pattern: Array(3).fill('EVEN') },
        });

        expect(result.current.getStreakColor()).toBe('normal');

        rerender({ pattern: Array(5).fill('EVEN') });
        expect(result.current.getStreakColor()).toBe('warning');

        rerender({ pattern: Array(7).fill('EVEN') });
        expect(result.current.getStreakColor()).toBe('danger');

        rerender({ pattern: Array(10).fill('EVEN') });
        expect(result.current.getStreakColor()).toBe('critical');
    });
});
