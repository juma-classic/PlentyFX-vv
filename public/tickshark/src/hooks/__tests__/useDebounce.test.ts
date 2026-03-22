import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 300));
    const [debouncedValue, isDebouncing] = result.current;
    
    expect(debouncedValue).toBe('initial');
    expect(isDebouncing).toBe(true);
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 300 } }
    );

    // Initial state
    expect(result.current[0]).toBe('initial');
    expect(result.current[1]).toBe(true);

    // Change value
    rerender({ value: 'changed', delay: 300 });
    expect(result.current[0]).toBe('initial'); // Still old value
    expect(result.current[1]).toBe(true); // Still debouncing

    // Fast forward time but not enough
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(result.current[0]).toBe('initial'); // Still old value
    expect(result.current[1]).toBe(true); // Still debouncing

    // Fast forward past debounce delay
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(result.current[0]).toBe('changed'); // Now updated
    expect(result.current[1]).toBe(false); // No longer debouncing
  });

  it('should reset debounce timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    );

    // Rapid changes (simulating cursor movement)
    rerender({ value: 'change1' });
    act(() => { jest.advanceTimersByTime(100); });
    
    rerender({ value: 'change2' });
    act(() => { jest.advanceTimersByTime(100); });
    
    rerender({ value: 'change3' });
    act(() => { jest.advanceTimersByTime(100); });

    // Should still be debouncing and showing initial value
    expect(result.current[0]).toBe('initial');
    expect(result.current[1]).toBe(true);

    // Only after full delay should it update to final value
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current[0]).toBe('change3');
    expect(result.current[1]).toBe(false);
  });

  it('should prevent execution during rapid cursor movement', () => {
    let executionCount = 0;
    const mockExecute = () => { executionCount++; };

    const { result, rerender } = renderHook(
      ({ digit }) => {
        const [debouncedDigit, isDebouncing] = useDebounce(digit, 300);
        
        // Simulate execution logic that should be gated by debounce
        if (!isDebouncing && debouncedDigit !== null) {
          mockExecute();
        }
        
        return { debouncedDigit, isDebouncing };
      },
      { initialProps: { digit: null as number | null } }
    );

    // Simulate rapid cursor movement over digits
    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    digits.forEach((digit, index) => {
      rerender({ digit });
      act(() => { jest.advanceTimersByTime(50); }); // Fast movement
    });

    // Should not have executed during movement
    expect(executionCount).toBe(0);

    // Only after movement stops should it execute once
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(executionCount).toBe(1);
  });
});