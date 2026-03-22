import { renderHook, act } from '@testing-library/react';
import { useTradeLock } from '../useTradeLock';

describe('useTradeLock', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should start unlocked', () => {
    const { result } = renderHook(() => useTradeLock());
    
    expect(result.current.isLocked).toBe(false);
    expect(result.current.lockState.lockReason).toBe(null);
  });

  it('should lock and unlock correctly', () => {
    const { result } = renderHook(() => useTradeLock());

    // Lock
    act(() => {
      result.current.lock('Test execution');
    });

    expect(result.current.isLocked).toBe(true);
    expect(result.current.lockState.lockReason).toBe('Test execution');
    expect(result.current.lockState.lockedAt).toBeGreaterThan(0);

    // Unlock
    act(() => {
      result.current.unlock();
    });

    expect(result.current.isLocked).toBe(false);
    expect(result.current.lockState.lockReason).toBe(null);
    expect(result.current.lockState.lockedAt).toBe(null);
  });

  it('should auto-unlock after safety timeout', () => {
    const { result } = renderHook(() => useTradeLock(1000));

    // Lock
    act(() => {
      result.current.lock('Test execution');
    });
    expect(result.current.isLocked).toBe(true);

    // Fast forward past safety timeout
    act(() => {
      jest.advanceTimersByTime(1100);
    });

    expect(result.current.isLocked).toBe(false);
  });

  it('should prevent double execution', () => {
    let executionCount = 0;
    const mockExecute = async () => {
      executionCount++;
      await new Promise(resolve => setTimeout(resolve, 500));
    };

    const { result } = renderHook(() => useTradeLock());

    const attemptExecution = async () => {
      if (result.current.isLocked) {
        console.log('Execution blocked by lock');
        return false;
      }

      result.current.lock('Executing trade');
      try {
        await mockExecute();
        return true;
      } finally {
        result.current.unlock();
      }
    };

    // Simulate rapid execution attempts
    act(() => {
      attemptExecution();
      attemptExecution(); // Should be blocked
      attemptExecution(); // Should be blocked
    });

    // Fast forward to complete first execution
    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(executionCount).toBe(1); // Only one execution should have occurred
  });

  it('should handle multiple lock attempts', () => {
    const { result } = renderHook(() => useTradeLock());

    // First lock
    act(() => {
      result.current.lock('First execution');
    });
    expect(result.current.lockState.lockReason).toBe('First execution');

    // Second lock attempt (should override)
    act(() => {
      result.current.lock('Second execution');
    });
    expect(result.current.lockState.lockReason).toBe('Second execution');
    expect(result.current.isLocked).toBe(true);
  });

  it('should clear timeout on manual unlock', () => {
    const { result } = renderHook(() => useTradeLock(1000));

    // Lock
    act(() => {
      result.current.lock('Test execution');
    });

    // Manual unlock before timeout
    act(() => {
      result.current.unlock();
    });
    expect(result.current.isLocked).toBe(false);

    // Fast forward past what would have been timeout
    act(() => {
      jest.advanceTimersByTime(1100);
    });

    // Should still be unlocked (timeout was cleared)
    expect(result.current.isLocked).toBe(false);
  });
});