import { renderHook, act } from '@testing-library/react';
import { useTradeIntent } from '../useTradeIntent';

describe('useTradeIntent', () => {
  it('should start with no intents', () => {
    const { result } = renderHook(() => useTradeIntent());
    
    expect(result.current.pendingIntent).toBe(null);
    expect(result.current.confirmedIntent).toBe(null);
  });

  it('should create pending intent from cursor movement', () => {
    const { result } = renderHook(() => useTradeIntent());

    act(() => {
      result.current.updatePendingIntent(5, 10);
    });

    expect(result.current.pendingIntent).not.toBe(null);
    expect(result.current.pendingIntent?.selectedDigit).toBe(5);
    expect(result.current.pendingIntent?.stake).toBe(10);
    expect(result.current.pendingIntent?.status).toBe('pending');
    expect(result.current.pendingIntent?.intentId).toBeDefined();
  });

  it('should confirm pending intent', () => {
    const { result } = renderHook(() => useTradeIntent());

    // Create pending intent
    act(() => {
      result.current.updatePendingIntent(7, 25);
    });

    const pendingId = result.current.pendingIntent?.intentId;

    // Confirm intent
    act(() => {
      result.current.confirmIntent();
    });

    expect(result.current.pendingIntent).toBe(null); // Cleared after confirmation
    expect(result.current.confirmedIntent).not.toBe(null);
    expect(result.current.confirmedIntent?.selectedDigit).toBe(7);
    expect(result.current.confirmedIntent?.stake).toBe(25);
    expect(result.current.confirmedIntent?.status).toBe('confirmed');
    expect(result.current.confirmedIntent?.intentId).toBe(pendingId);
  });

  it('should prevent duplicate execution of same intent', () => {
    const { result } = renderHook(() => useTradeIntent());

    // Create and confirm intent
    act(() => {
      result.current.updatePendingIntent(3, 15);
    });
    act(() => {
      result.current.confirmIntent();
    });

    const intentId = result.current.confirmedIntent?.intentId!;

    // Mark as executed
    act(() => {
      result.current.markExecuted(intentId);
    });

    expect(result.current.isIntentExecuted(intentId)).toBe(true);
    expect(result.current.confirmedIntent).toBe(null); // Cleared after execution
  });

  it('should handle rapid cursor movement with unique intents', () => {
    const { result } = renderHook(() => useTradeIntent());

    const intentIds: string[] = [];

    // Simulate rapid cursor movement
    for (let i = 0; i < 10; i++) {
      act(() => {
        result.current.updatePendingIntent(i % 10, 5);
      });
      
      if (result.current.pendingIntent) {
        intentIds.push(result.current.pendingIntent.intentId);
      }
    }

    // All intent IDs should be unique
    const uniqueIds = new Set(intentIds);
    expect(uniqueIds.size).toBe(intentIds.length);
  });

  it('should cancel intents', () => {
    const { result } = renderHook(() => useTradeIntent());

    // Create pending intent
    act(() => {
      result.current.updatePendingIntent(8, 30);
    });

    // Confirm intent
    act(() => {
      result.current.confirmIntent();
    });

    expect(result.current.confirmedIntent).not.toBe(null);

    // Cancel
    act(() => {
      result.current.cancelIntent();
    });

    expect(result.current.pendingIntent).toBe(null);
    expect(result.current.confirmedIntent).toBe(null);
  });

  it('should not confirm if no pending intent', () => {
    const { result } = renderHook(() => useTradeIntent());

    // Try to confirm without pending intent
    act(() => {
      result.current.confirmIntent();
    });

    expect(result.current.confirmedIntent).toBe(null);
  });

  it('should track multiple executed intents', () => {
    const { result } = renderHook(() => useTradeIntent());

    const executedIds: string[] = [];

    // Execute multiple intents
    for (let i = 0; i < 5; i++) {
      act(() => {
        result.current.updatePendingIntent(i, 10);
      });
      act(() => {
        result.current.confirmIntent();
      });

      const intentId = result.current.confirmedIntent?.intentId!;
      executedIds.push(intentId);

      act(() => {
        result.current.markExecuted(intentId);
      });
    }

    // All should be marked as executed
    executedIds.forEach(id => {
      expect(result.current.isIntentExecuted(id)).toBe(true);
    });
  });

  it('should prevent execution of already executed intent', () => {
    const { result } = renderHook(() => useTradeIntent());
    let executionAttempts = 0;

    const mockExecute = (intentId: string) => {
      if (result.current.isIntentExecuted(intentId)) {
        console.log('Execution blocked: intent already executed');
        return false;
      }
      executionAttempts++;
      result.current.markExecuted(intentId);
      return true;
    };

    // Create and confirm intent
    act(() => {
      result.current.updatePendingIntent(4, 20);
    });
    act(() => {
      result.current.confirmIntent();
    });

    const intentId = result.current.confirmedIntent?.intentId!;

    // First execution should succeed
    act(() => {
      mockExecute(intentId);
    });
    expect(executionAttempts).toBe(1);

    // Second execution attempt should be blocked
    act(() => {
      mockExecute(intentId);
    });
    expect(executionAttempts).toBe(1); // Still 1, second attempt blocked
  });
});