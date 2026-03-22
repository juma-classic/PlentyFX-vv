/**
 * Live Digit Analysis Hook
 * Reusable hook for getting live tick data and digit percentages
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { unifiedTickData } from '@/services/unified-tick-data.service';
import { tickDataValidator } from '@/utils/tick-data-validator';
import { ConnectionType } from '@/services/deriv-connection-pool.service';

interface DigitData {
    digit: number;
    count: number;
    percentage: number;
    lastSeen: number;
}

interface LiveDigitAnalysisState {
    digitData: DigitData[];
    currentTick: number | null;
    tickHistory: number[];
    isConnected: boolean;
    isLoading: boolean;
    ticksPerSecond: number;
    totalTicks: number;
    validationSummary: any;
}

interface LiveDigitAnalysisOptions {
    symbol?: string;
    historicalCount?: number;
    maxTicks?: number;
    connectionType?: ConnectionType;
    enableValidation?: boolean;
    enableDebug?: boolean;
}

export const useLiveDigitAnalysis = (options: LiveDigitAnalysisOptions = {}) => {
    const {
        symbol = 'R_100',
        historicalCount = 1000,
        maxTicks = 1000,
        connectionType = ConnectionType.SIGNALS,
        enableValidation = true,
        enableDebug = false
    } = options;

    // State
    const [state, setState] = useState<LiveDigitAnalysisState>({
        digitData: Array.from({ length: 10 }, (_, i) => ({
            digit: i,
            count: 0,
            percentage: 0,
            lastSeen: 0
        })),
        currentTick: null,
        tickHistory: [],
        isConnected: false,
        isLoading: false,
        ticksPerSecond: 0,
        totalTicks: 0,
        validationSummary: null
    });

    // Refs
    const unsubscribeRef = useRef<(() => void) | null>(null);
    const lastTickTimeRef = useRef<number>(0);
    const historicalLoadedRef = useRef<boolean>(false);

    // Update digit data when new tick arrives
    const updateDigitData = useCallback((digit: number) => {
        setState(prevState => {
            const newDigitData = [...prevState.digitData];
            newDigitData[digit] = {
                ...newDigitData[digit],
                count: newDigitData[digit].count + 1,
                lastSeen: Date.now()
            };
            
            // Recalculate percentages
            const totalCount = newDigitData.reduce((sum, item) => sum + item.count, 0);
            newDigitData.forEach(item => {
                item.percentage = totalCount > 0 ? (item.count / totalCount) * 100 : 0;
            });
            
            return {
                ...prevState,
                digitData: newDigitData,
                totalTicks: totalCount
            };
        });
    }, []);

    // Update tick history
    const updateTickHistory = useCallback((digit: number) => {
        setState(prevState => {
            const newHistory = [...prevState.tickHistory, digit];
            return {
                ...prevState,
                tickHistory: newHistory.slice(-maxTicks)
            };
        });
    }, [maxTicks]);

    // Initialize unified tick stream
    const initializeTickStream = useCallback(async () => {
        if (historicalLoadedRef.current) return;
        
        setState(prev => ({ ...prev, isLoading: true }));
        console.log(`🚀 [useLiveDigitAnalysis] Initializing tick stream for ${symbol}...`);
        
        try {
            // Cleanup existing subscription
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
            unifiedTickData.cleanupSubscription(symbol);
            
            const result = await unifiedTickData.initializeTickStream(
                symbol,
                historicalCount,
                (tickData) => {
                    // Handle live tick data
                    if (enableValidation) {
                        const validation = tickDataValidator.validateTick(
                            { tick: { quote: tickData.quote, epoch: tickData.epoch } }, 
                            symbol
                        );
                        
                        // Update validation summary periodically
                        if (Math.random() < 0.1) {
                            setState(prev => ({
                                ...prev,
                                validationSummary: tickDataValidator.getValidationSummary()
                            }));
                        }
                        
                        if (enableDebug && !validation.isValid) {
                            console.warn('🚨 [useLiveDigitAnalysis] Validation failed:', validation.issues);
                        }
                    }
                    
                    const currentTime = Date.now();
                    
                    // Calculate ticks per second
                    if (lastTickTimeRef.current > 0) {
                        const timeDiff = (currentTime - lastTickTimeRef.current) / 1000;
                        if (timeDiff > 0) {
                            setState(prev => {
                                const newRate = 1 / timeDiff;
                                const smoothedRate = prev.ticksPerSecond === 0 ? newRate : (prev.ticksPerSecond * 0.9 + newRate * 0.1);
                                return { ...prev, ticksPerSecond: smoothedRate };
                            });
                        }
                    }
                    lastTickTimeRef.current = currentTime;
                    
                    // Update state
                    setState(prev => ({ ...prev, currentTick: tickData.lastDigit }));
                    updateDigitData(tickData.lastDigit);
                    updateTickHistory(tickData.lastDigit);
                    
                    if (enableDebug) {
                        console.log(`✅ [useLiveDigitAnalysis] Live: ${tickData.quote} → Digit: ${tickData.lastDigit} (${symbol})`);
                    }
                },
                connectionType
            );
            
            if (result.success && result.historicalTicks.length > 0) {
                console.log(`✅ [useLiveDigitAnalysis] Loaded ${result.historicalTicks.length} historical ticks`);
                
                // Process historical ticks
                const historicalDigits = result.historicalTicks.map(tick => tick.lastDigit);
                
                // Update digit data with historical analysis
                const newDigitData = Array.from({ length: 10 }, (_, i) => ({
                    digit: i,
                    count: historicalDigits.filter(d => d === i).length,
                    percentage: 0,
                    lastSeen: Date.now()
                }));
                
                // Calculate percentages
                const totalCount = newDigitData.reduce((sum, item) => sum + item.count, 0);
                newDigitData.forEach(item => {
                    item.percentage = totalCount > 0 ? (item.count / totalCount) * 100 : 0;
                });
                
                setState(prev => ({
                    ...prev,
                    digitData: newDigitData,
                    tickHistory: historicalDigits,
                    isConnected: true,
                    totalTicks: totalCount
                }));
                
                historicalLoadedRef.current = true;
                unsubscribeRef.current = result.liveSubscription || (() => {});
                
                console.log(`📈 [useLiveDigitAnalysis] Stream complete: ${totalCount} historical + live ticks`);
                
            } else {
                console.warn(`⚠️ [useLiveDigitAnalysis] Failed to initialize: ${result.error}`);
                setState(prev => ({ ...prev, isConnected: false }));
            }
            
        } catch (error) {
            console.error('[useLiveDigitAnalysis] Error:', error);
            setState(prev => ({ ...prev, isConnected: false }));
        } finally {
            setState(prev => ({ ...prev, isLoading: false }));
        }
    }, [symbol, historicalCount, connectionType, enableValidation, enableDebug, updateDigitData, updateTickHistory]);

    // Cleanup function
    const cleanup = useCallback(() => {
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
        }
        unifiedTickData.cleanupSubscription(symbol);
        setState(prev => ({ ...prev, isConnected: false }));
    }, [symbol]);

    // Reset data
    const resetData = useCallback(() => {
        setState(prev => ({
            ...prev,
            digitData: Array.from({ length: 10 }, (_, i) => ({
                digit: i,
                count: 0,
                percentage: 0,
                lastSeen: 0
            })),
            tickHistory: [],
            currentTick: null,
            ticksPerSecond: 0,
            totalTicks: 0
        }));
        historicalLoadedRef.current = false;
        lastTickTimeRef.current = 0;
        console.log('🔄 [useLiveDigitAnalysis] Data reset');
    }, []);

    // Initialize on mount or symbol change
    useEffect(() => {
        initializeTickStream();
        return cleanup;
    }, [initializeTickStream, cleanup]);

    // Helper functions
    const getDigitColor = useCallback((digit: number): string => {
        const colors = [
            '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
            '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981'
        ];
        return colors[digit];
    }, []);

    const isHotDigit = useCallback((digit: number): boolean => {
        return state.digitData[digit]?.percentage > 15;
    }, [state.digitData]);

    const getTopDigits = useCallback((count: number = 3) => {
        return [...state.digitData]
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, count);
    }, [state.digitData]);

    const getDigitStreak = useCallback(() => {
        if (state.tickHistory.length < 2) return { digit: null, count: 0 };
        
        const lastDigit = state.tickHistory[state.tickHistory.length - 1];
        let count = 1;
        
        for (let i = state.tickHistory.length - 2; i >= 0; i--) {
            if (state.tickHistory[i] === lastDigit) {
                count++;
            } else {
                break;
            }
        }
        
        return { digit: lastDigit, count };
    }, [state.tickHistory]);

    return {
        // State
        ...state,
        
        // Actions
        resetData,
        cleanup,
        reinitialize: initializeTickStream,
        
        // Helpers
        getDigitColor,
        isHotDigit,
        getTopDigits,
        getDigitStreak,
        
        // Computed values
        hotDigitsCount: state.digitData.filter(d => d.percentage > 15).length,
        averagePercentage: state.digitData.reduce((sum, d) => sum + d.percentage, 0) / 10,
        isDataReady: state.totalTicks > 0,
        connectionQuality: state.validationSummary ? 
            Math.round((state.validationSummary.validTicks / state.validationSummary.totalTicks) * 100) : 100
    };
};

export default useLiveDigitAnalysis;