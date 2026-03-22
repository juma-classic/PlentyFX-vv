import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Custom React hook for High-Frequency Trading Mode
 *
 * Implements timer-based high-frequency trading:
 * - Configurable trading intervals (100ms, 400ms, 800ms, 1000ms)
 * - No price movement detection - pure timer-based execution
 */
export const useHighFrequencyTrading = ({ enabled = false, tradingInterval = 400 } = {}) => {
    // Core state management
    const [isRunning, setIsRunning] = useState(false);
    const [cycleState, setCycleState] = useState('idle'); // idle, active, cooldown
    const [contractsInCycle, setContractsInCycle] = useState(0);
    const [currentCycle, setCurrentCycle] = useState(0);

    // Timer references
    const contractTimerRef = useRef(null);
    const cycleTimerRef = useRef(null);
    const cycleStartTimeRef = useRef(null);
    const isRunningRef = useRef(false);

    // Callbacks
    const onTradeExecutedRef = useRef(null);

    // Keep ref in sync with state
    useEffect(() => {
        isRunningRef.current = isRunning;
    }, [isRunning]);

    // Statistics
    const [stats, setStats] = useState({
        totalCycles: 0,
        totalContracts: 0,
        contractsPerSecond: 0,
        avgContractsPerCycle: 0,
        uptime: 0,
    });

    // Constants - now configurable based on trading interval
    const CONTRACT_INTERVAL = tradingInterval; // Configurable interval between contracts
    const CYCLE_DURATION = tradingInterval; // Single contract per cycle for simplicity
    const MAX_CONTRACTS_PER_CYCLE = 1; // 1 contract per cycle

    /**
     * Clear all timers
     */
    const clearAllTimers = useCallback(() => {
        if (contractTimerRef.current) {
            clearInterval(contractTimerRef.current);
            contractTimerRef.current = null;
        }
        if (cycleTimerRef.current) {
            clearTimeout(cycleTimerRef.current);
            cycleTimerRef.current = null;
        }
    }, []);

    /**
     * Start continuous trading (no cycles - pure interval-based)
     */
    const startContinuousTrading = useCallback(() => {
        if (!enabled) return;

        console.log(`🚀 Starting Continuous HFT - 1 contract every ${tradingInterval}ms`);

        setCycleState('active');
        cycleStartTimeRef.current = Date.now();

        // Start continuous contract execution timer - NO CYCLE LIMITS
        contractTimerRef.current = setInterval(() => {
            if (!enabled || !isRunningRef.current) {
                return;
            }

            // Execute trade through callback
            if (onTradeExecutedRef.current) {
                const contractId = `hft_continuous_${Date.now()}`;
                console.log(`⚡ Continuous HFT Contract - ID: ${contractId} (${tradingInterval}ms interval)`);

                // Notify parent component to execute trade
                onTradeExecutedRef.current(contractId);

                setStats(prev => ({
                    ...prev,
                    totalContracts: prev.totalContracts + 1,
                }));
            }
        }, tradingInterval); // Use the exact interval - no cycle overhead

        console.log(`✅ Continuous trading started - executing every ${tradingInterval}ms`);
    }, [enabled, tradingInterval]);

    /**
     * Start high-frequency trading (continuous mode)
     */
    const start = useCallback(
        onTradeExecuted => {
            if (!enabled) {
                console.log('❌ HFT not enabled');
                return false;
            }

            if (isRunning) {
                console.log('⚠️ HFT already running');
                return false;
            }

            console.log('🚀 Starting Continuous High-Frequency Trading Mode');
            console.log(
                `⚡ Configuration: 1 contract every ${tradingInterval}ms (${Math.round((1000 / tradingInterval) * 10) / 10} contracts/sec) - CONTINUOUS`
            );

            // Store callback
            onTradeExecutedRef.current = onTradeExecuted;

            // Reset state
            setIsRunning(true);
            setCurrentCycle(0);
            setContractsInCycle(0);
            setCycleState('idle');

            // Start continuous trading immediately
            setTimeout(() => {
                startContinuousTrading();
            }, 0);

            return true;
        },
        [enabled, isRunning, startContinuousTrading, tradingInterval]
    );

    /**
     * Stop high-frequency trading
     */
    const stop = useCallback(() => {
        console.log('🛑 Stopping Continuous High-Frequency Trading Mode');

        clearAllTimers();
        setIsRunning(false);
        setCycleState('idle');
        onTradeExecutedRef.current = null;

        console.log(`📊 Continuous HFT Session Summary: ${stats.totalContracts} contracts executed`);

        return true;
    }, [clearAllTimers, stats.totalContracts]);

    /**
     * Get current status for UI feedback
     */
    const getStatus = useCallback(() => {
        if (!enabled) {
            return {
                status: 'disabled',
                message: 'High-frequency trading disabled',
                canTrade: true, // Don't block normal trading
            };
        }

        if (!isRunning) {
            return {
                status: 'ready',
                message: 'Ready for continuous high-frequency trading',
                canTrade: true,
            };
        }

        switch (cycleState) {
            case 'active':
                return {
                    status: 'active',
                    message: `Continuous trading every ${tradingInterval}ms`,
                    canTrade: true,
                };
            default:
                return {
                    status: 'active',
                    message: `Continuous trading active - ${tradingInterval}ms intervals`,
                    canTrade: true,
                };
        }
    }, [enabled, isRunning, cycleState, tradingInterval]);

    /**
     * Reset statistics
     */
    const reset = useCallback(() => {
        stop();
        setStats({
            totalCycles: 0,
            totalContracts: 0,
            contractsPerSecond: 0,
            avgContractsPerCycle: 0,
            uptime: 0,
        });
        setCurrentCycle(0);
        setContractsInCycle(0);
        console.log('🔄 HFT statistics reset');
    }, [stop]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearAllTimers();
        };
    }, [clearAllTimers]);

    // Calculate contracts per second
    useEffect(() => {
        if (isRunning) {
            const interval = setInterval(() => {
                setStats(prev => ({
                    ...prev,
                    contractsPerSecond: Math.round(
                        (prev.totalContracts / (Date.now() - cycleStartTimeRef.current)) * 1000
                    ),
                    uptime: Date.now() - cycleStartTimeRef.current,
                }));
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [isRunning]);

    return {
        // Core interface
        start,
        stop,
        reset,

        // State information
        isRunning,
        cycleState,
        currentCycle,
        contractsInCycle,
        getStatus,

        // Statistics
        stats,

        // Configuration
        enabled,
        CONTRACT_INTERVAL,
        CYCLE_DURATION,
        MAX_CONTRACTS_PER_CYCLE,

        // Status helpers
        canExecuteTrade: () => true, // HFT doesn't block normal trading
    };
};

export default useHighFrequencyTrading;
