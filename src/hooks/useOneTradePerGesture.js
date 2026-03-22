import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Enhanced Custom React hook for "One Trade Per Cursor Movement" safety feature
 *
 * Implements debounce-based gesture detection with unique trade intent IDs
 * and comprehensive safety enforcement.
 */
export const useOneTradePerGesture = ({ debounceMs = 400, enabled = false } = {}) => {
    // Core state management
    const [gestureState, setGestureState] = useState('idle');
    const [canTrade, setCanTrade] = useState(false);
    const [tradeExecuted, setTradeExecuted] = useState(false);

    // Refs for timers and tracking
    const debounceTimerRef = useRef(null);
    const gestureIdRef = useRef(0);
    const tradeIntentIdRef = useRef(null);
    const executedIntentIds = useRef(new Set());
    const gestureStartTime = useRef(null);

    // Enhanced statistics
    const [stats, setStats] = useState({
        totalGestures: 0,
        totalTrades: 0,
        blockedTrades: 0,
        avgGestureDuration: 0,
        totalGestureDuration: 0,
    });

    /**
     * Generate unique trade intent ID
     */
    const generateTradeIntentId = useCallback(() => {
        return `gesture_${gestureIdRef.current}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }, []);

    /**
     * Clear debounce timer
     */
    const clearDebounceTimer = useCallback(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }
    }, []);

    /**
     * Handle cursor movement - implements gesture detection
     */
    const notifyCursorMove = useCallback(() => {
        if (!enabled) return;

        // Start new gesture or continue existing one
        if (gestureState === 'idle' || gestureState === 'locked') {
            // New gesture starting
            setGestureState('moving');
            setCanTrade(false);
            setTradeExecuted(false);
            gestureIdRef.current += 1;
            gestureStartTime.current = Date.now();
            tradeIntentIdRef.current = null; // Reset intent ID

            console.log(`🎯 New gesture started: ${gestureIdRef.current}`);
        } else if (gestureState === 'stabilized') {
            // Cursor moved again after stabilization - restart gesture
            setGestureState('moving');
            setCanTrade(false);
            gestureStartTime.current = Date.now();
            tradeIntentIdRef.current = null; // Reset intent ID

            console.log(`🎯 Gesture restarted: ${gestureIdRef.current}`);
        }

        // Clear existing timer and start new debounce
        clearDebounceTimer();

        debounceTimerRef.current = setTimeout(() => {
            // Gesture stabilized - generate trade intent ID
            const intentId = generateTradeIntentId();
            tradeIntentIdRef.current = intentId;

            setGestureState('stabilized');
            setCanTrade(true);

            const gestureDuration = Date.now() - gestureStartTime.current;

            setStats(prev => {
                const newTotalDuration = prev.totalGestureDuration + gestureDuration;
                const newTotalGestures = prev.totalGestures + 1;
                return {
                    ...prev,
                    totalGestures: newTotalGestures,
                    totalGestureDuration: newTotalDuration,
                    avgGestureDuration: Math.round(newTotalDuration / newTotalGestures),
                };
            });

            console.log(
                `🎯 Gesture stabilized: ${gestureIdRef.current}, Intent ID: ${intentId}, Duration: ${gestureDuration}ms`
            );
        }, debounceMs);
    }, [enabled, gestureState, debounceMs, clearDebounceTimer, generateTradeIntentId]);

    /**
     * Check if trade can be executed with comprehensive safety checks
     */
    const canExecuteTrade = useCallback(() => {
        if (!enabled) return true;

        // Primary safety checks
        const basicChecks = gestureState === 'stabilized' && canTrade && !tradeExecuted;
        if (!basicChecks) return false;

        // Intent ID safety check
        const currentIntentId = tradeIntentIdRef.current;
        if (!currentIntentId) return false;

        // Check if this intent ID was already used
        if (executedIntentIds.current.has(currentIntentId)) {
            console.log(`🚫 Trade blocked: Intent ID ${currentIntentId} already executed`);
            setStats(prev => ({ ...prev, blockedTrades: prev.blockedTrades + 1 }));
            return false;
        }

        return true;
    }, [enabled, gestureState, canTrade, tradeExecuted]);

    /**
     * Notify that trade was executed - implements trade lock
     */
    const notifyTradeExecuted = useCallback(() => {
        if (!enabled) return;

        const currentIntentId = tradeIntentIdRef.current;
        if (!currentIntentId) {
            console.warn('🚫 Trade executed without valid intent ID');
            return;
        }

        // Mark intent ID as executed
        executedIntentIds.current.add(currentIntentId);

        // Lock further executions
        setTradeExecuted(true);
        setCanTrade(false);
        setGestureState('locked');

        setStats(prev => ({
            ...prev,
            totalTrades: prev.totalTrades + 1,
        }));

        console.log(`✅ Trade executed for gesture ${gestureIdRef.current}, Intent ID: ${currentIntentId}`);

        clearDebounceTimer();
    }, [enabled, clearDebounceTimer]);

    /**
     * Get gesture status for UI feedback
     */
    const getGestureStatus = useCallback(() => {
        if (!enabled) return { status: 'disabled', message: 'Feature disabled' };

        switch (gestureState) {
            case 'idle':
                return {
                    status: 'idle',
                    message: 'Ready - Move cursor to start gesture',
                    canTrade: false,
                };
            case 'moving':
                return {
                    status: 'moving',
                    message: 'Cursor Moving',
                    canTrade: false,
                };
            case 'stabilized':
                return {
                    status: 'stabilized',
                    message: canTrade && !tradeExecuted ? 'Gesture Stabilized - Trade allowed' : 'Gesture Stabilized',
                    canTrade: canTrade && !tradeExecuted,
                };
            case 'locked':
                return {
                    status: 'locked',
                    message: 'Trade Executed – Waiting for Next Gesture',
                    canTrade: false,
                };
            default:
                return {
                    status: 'unknown',
                    message: 'Unknown state',
                    canTrade: false,
                };
        }
    }, [enabled, gestureState, canTrade, tradeExecuted]);

    /**
     * Reset hook state and clear executed intent IDs
     */
    const reset = useCallback(() => {
        clearDebounceTimer();
        setGestureState('idle');
        setCanTrade(false);
        setTradeExecuted(false);
        gestureIdRef.current = 0;
        tradeIntentIdRef.current = null;
        executedIntentIds.current.clear();
        gestureStartTime.current = null;

        console.log('🎯 Gesture hook reset');
    }, [clearDebounceTimer]);

    /**
     * Get current trade intent ID
     */
    const getCurrentTradeIntentId = useCallback(() => {
        return tradeIntentIdRef.current;
    }, []);

    /**
     * Check if intent ID was already executed
     */
    const isIntentIdExecuted = useCallback(intentId => {
        return executedIntentIds.current.has(intentId);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearDebounceTimer();
        };
    }, [clearDebounceTimer]);

    // Enhanced return interface
    return {
        // Core interface (required)
        canExecuteTrade,
        notifyCursorMove,
        notifyTradeExecuted,

        // State information
        gestureState,
        currentTradeIntentId: tradeIntentIdRef.current,
        getGestureStatus,

        // Enhanced features
        getCurrentTradeIntentId,
        isIntentIdExecuted,

        // Utilities
        reset,
        stats,

        // Configuration
        enabled,
        debounceMs,

        // Debug information
        currentGestureId: gestureIdRef.current,
        executedIntentCount: executedIntentIds.current.size,
    };
};

export default useOneTradePerGesture;
