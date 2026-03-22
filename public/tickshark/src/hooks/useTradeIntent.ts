import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface TradeIntent {
  intentId: string;
  selectedDigit: number | null;
  stake: number;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'executed' | 'cancelled';
}

export interface TradeIntentControls {
  pendingIntent: TradeIntent | null;
  confirmedIntent: TradeIntent | null;
  updatePendingIntent: (digit: number | null, stake: number) => void;
  confirmIntent: () => void;
  cancelIntent: () => void;
  markExecuted: (intentId: string) => void;
  isIntentExecuted: (intentId: string) => boolean;
}

/**
 * Trade intent management hook - CORE SAFETY LAYER
 * Manages the flow: cursor movement → pending → confirmed → executed
 * Prevents duplicate executions via intentId tracking
 */
export function useTradeIntent(): TradeIntentControls {
  const [pendingIntent, setPendingIntent] = useState<TradeIntent | null>(null);
  const [confirmedIntent, setConfirmedIntent] = useState<TradeIntent | null>(null);
  const executedIntents = useRef<Set<string>>(new Set());

  // Update pending intent from cursor movement (UI only)
  const updatePendingIntent = useCallback((digit: number | null, stake: number) => {
    const newIntent: TradeIntent = {
      intentId: uuidv4(),
      selectedDigit: digit,
      stake,
      timestamp: Date.now(),
      status: 'pending',
    };
    
    setPendingIntent(newIntent);
  }, []);

  // Confirm intent for execution (manual action required)
  const confirmIntent = useCallback(() => {
    if (!pendingIntent) return;
    
    const confirmedIntentData: TradeIntent = {
      ...pendingIntent,
      status: 'confirmed',
      timestamp: Date.now(), // Update timestamp for confirmation
    };
    
    setConfirmedIntent(confirmedIntentData);
    setPendingIntent(null); // Clear pending after confirmation
  }, [pendingIntent]);

  // Cancel current intent
  const cancelIntent = useCallback(() => {
    setPendingIntent(null);
    setConfirmedIntent(null);
  }, []);

  // Mark intent as executed (prevents duplicate execution)
  const markExecuted = useCallback((intentId: string) => {
    executedIntents.current.add(intentId);
    setConfirmedIntent(null); // Clear confirmed intent after execution
  }, []);

  // Check if intent was already executed
  const isIntentExecuted = useCallback((intentId: string): boolean => {
    return executedIntents.current.has(intentId);
  }, []);

  return {
    pendingIntent,
    confirmedIntent,
    updatePendingIntent,
    confirmIntent,
    cancelIntent,
    markExecuted,
    isIntentExecuted,
  };
}