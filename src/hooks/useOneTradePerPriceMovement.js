import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Custom React hook for "One Trade Per Price Movement" safety feature
 *
 * Implements price-based movement detection with trade locking:
 * - price changes → detect movement
 * - price continues → ignore
 * - movement completes → ONE trade
 * - lock until next movement
 */
export const useOneTradePerPriceMovement = ({ enabled = false, stabilizationMs = 1000 } = {}) => {
    // Core state management
    const [movementState, setMovementState] = useState('idle'); // idle, detecting, stabilized, locked
    const [canTrade, setCanTrade] = useState(false);
    const [tradeExecuted, setTradeExecuted] = useState(false);

    // Price tracking
    const lastPriceRef = useRef(null);
    const movementStartTimeRef = useRef(null);
    const stabilizationTimerRef = useRef(null);
    const movementIdRef = useRef(0);
    const tradeIntentIdRef = useRef(null);
    const executedIntentIds = useRef(new Set());

    // Statistics
    const [stats, setStats] = useState({
        totalMovements: 0,
        totalTrades: 0,
        blockedTrades: 0,
        avgMovementDuration: 0,
        totalMovementDuration: 0,
    });

    /**
     * Generate unique trade intent ID for price movement
     */
    const generateTradeIntentId = useCallback(() => {
        return `price_movement_${movementIdRef.current}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }, []);

    /**
     * Clear stabilization timer
     */
    const clearStabilizationTimer = useCallback(() => {
        if (stabilizationTimerRef.current) {
            clearTimeout(stabilizationTimerRef.current);
            stabilizationTimerRef.current = null;
        }
    }, []);

    /**
     * Handle price change - implements price movement detection
     */
    const notifyPriceChange = useCallback(
        newPrice => {
            if (!enabled) return;

            const currentPrice = parseFloat(newPrice);
            if (isNaN(currentPrice)) return;

            // First price or same price - no movement
            if (lastPriceRef.current === null || lastPriceRef.current === currentPrice) {
                lastPriceRef.current = currentPrice;
                return;
            }

            // Price changed - detect movement
            if (movementState === 'idle' || movementState === 'locked') {
                // New movement starting
                setMovementState('detecting');
                setCanTrade(false);
                setTradeExecuted(false);
                movementIdRef.current += 1;
                movementStartTimeRef.current = Date.now();
                tradeIntentIdRef.current = null;

                console.log(
                    `💰 Price movement detected: ${lastPriceRef.current} → ${currentPrice} (Movement ${movementIdRef.current})`
                );
            } else if (movementState === 'stabilized') {
                // Price moved again after stabilization - restart movement detection
                setMovementState('detecting');
                setCanTrade(false);
                movementStartTimeRef.current = Date.now();
                tradeIntentIdRef.current = null;

                console.log(
                    `💰 Price movement continued: ${lastPriceRef.current} → ${currentPrice} (Movement ${movementIdRef.current})`
                );
            }

            // Update last price
            lastPriceRef.current = currentPrice;

            // Clear existing timer and start new stabilization period
            clearStabilizationTimer();

            stabilizationTimerRef.current = setTimeout(() => {
                // Movement stabilized - generate trade intent ID
                const intentId = generateTradeIntentId();
                tradeIntentIdRef.current = intentId;

                setMovementState('stabilized');
                setCanTrade(true);

                const movementDuration = Date.now() - movementStartTimeRef.current;

                setStats(prev => {
                    const newTotalDuration = prev.totalMovementDuration + movementDuration;
                    const newTotalMovements = prev.totalMovements + 1;
                    return {
                        ...prev,
                        totalMovements: newTotalMovements,
                        totalMovementDuration: newTotalDuration,
                        avgMovementDuration: Math.round(newTotalDuration / newTotalMovements),
                    };
                });

                console.log(
                    `💰 Price movement stabilized: Movement ${movementIdRef.current}, Intent ID: ${intentId}, Duration: ${movementDuration}ms`
                );
            }, stabilizationMs);
        },
        [enabled, movementState, stabilizationMs, clearStabilizationTimer, generateTradeIntentId]
    );

    /**
     * Check if trade can be executed with comprehensive safety checks
     */
    const canExecuteTrade = useCallback(() => {
        if (!enabled) return true;

        // Primary safety checks
        const basicChecks = movementState === 'stabilized' && canTrade && !tradeExecuted;
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
    }, [enabled, movementState, canTrade, tradeExecuted]);

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

        // Lock further executions until next movement
        setTradeExecuted(true);
        setCanTrade(false);
        setMovementState('locked');

        setStats(prev => ({
            ...prev,
            totalTrades: prev.totalTrades + 1,
        }));

        console.log(
            `✅ Trade executed for movement ${movementIdRef.current}, Intent ID: ${currentIntentId} - LOCKED until next price movement`
        );

        clearStabilizationTimer();
    }, [enabled, clearStabilizationTimer]);

    /**
     * Get movement status for UI feedback
     */
    const getMovementStatus = useCallback(() => {
        if (!enabled) return { status: 'disabled', message: 'Feature disabled - normal execution' };

        switch (movementState) {
            case 'idle':
                return {
                    status: 'idle',
                    message: 'Ready - Waiting for price movement',
                    canTrade: false,
                };
            case 'detecting':
                return {
                    status: 'detecting',
                    message: 'Price Moving - Detecting movement',
                    canTrade: false,
                };
            case 'stabilized':
                return {
                    status: 'stabilized',
                    message: canTrade && !tradeExecuted ? 'Movement Complete - Trade allowed' : 'Movement Stabilized',
                    canTrade: canTrade && !tradeExecuted,
                };
            case 'locked':
                return {
                    status: 'locked',
                    message: 'Trade Executed - Locked until next price movement',
                    canTrade: false,
                };
            default:
                return {
                    status: 'unknown',
                    message: 'Unknown state',
                    canTrade: false,
                };
        }
    }, [enabled, movementState, canTrade, tradeExecuted]);

    /**
     * Reset hook state
     */
    const reset = useCallback(() => {
        clearStabilizationTimer();
        setMovementState('idle');
        setCanTrade(false);
        setTradeExecuted(false);
        movementIdRef.current = 0;
        tradeIntentIdRef.current = null;
        executedIntentIds.current.clear();
        lastPriceRef.current = null;
        movementStartTimeRef.current = null;

        console.log('💰 Price movement hook reset');
    }, [clearStabilizationTimer]);

    /**
     * Get current trade intent ID
     */
    const getCurrentTradeIntentId = useCallback(() => {
        return tradeIntentIdRef.current;
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearStabilizationTimer();
        };
    }, [clearStabilizationTimer]);

    // Enhanced return interface
    return {
        // Core interface (required)
        canExecuteTrade,
        notifyPriceChange,
        notifyTradeExecuted,

        // State information
        movementState,
        currentTradeIntentId: tradeIntentIdRef.current,
        getMovementStatus,

        // Enhanced features
        getCurrentTradeIntentId,

        // Utilities
        reset,
        stats,

        // Configuration
        enabled,
        stabilizationMs,

        // Debug information
        currentMovementId: movementIdRef.current,
        executedIntentCount: executedIntentIds.current.size,
        lastPrice: lastPriceRef.current,
    };
};

export default useOneTradePerPriceMovement;
