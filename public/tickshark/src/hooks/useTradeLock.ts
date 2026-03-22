import { useState, useCallback, useRef, useEffect } from 'react';

export interface TradeLockState {
  isLocked: boolean;
  lockReason: string | null;
  lockedAt: number | null;
}

export interface TradeLockControls {
  lock: (reason: string) => void;
  unlock: () => void;
  isLocked: boolean;
  lockState: TradeLockState;
}

/**
 * Trade lock hook - CRITICAL SAFETY MECHANISM
 * Prevents double execution and ensures only one trade at a time
 * Includes automatic timeout safety to prevent permanent locks
 */
export function useTradeLock(safetyTimeoutMs: number = 5000): TradeLockControls {
  const [lockState, setLockState] = useState<TradeLockState>({
    isLocked: false,
    lockReason: null,
    lockedAt: null,
  });
  
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Lock the trade execution
  const lock = useCallback((reason: string) => {
    setLockState({
      isLocked: true,
      lockReason: reason,
      lockedAt: Date.now(),
    });

    // Safety timeout - auto-unlock after timeout to prevent permanent locks
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      console.warn(`Trade lock auto-released after ${safetyTimeoutMs}ms timeout`);
      setLockState({
        isLocked: false,
        lockReason: null,
        lockedAt: null,
      });
    }, safetyTimeoutMs);
  }, [safetyTimeoutMs]);

  // Unlock the trade execution
  const unlock = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setLockState({
      isLocked: false,
      lockReason: null,
      lockedAt: null,
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    lock,
    unlock,
    isLocked: lockState.isLocked,
    lockState,
  };
}