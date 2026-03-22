/**
 * Streak Indicator Component
 * Shows current streaks for different patterns with visual indicators
 * NO DEMO FALLBACK - Only real data with robust reconnection
 */

import React, { useEffect, useState } from 'react';
import { derivConnectionPool, ConnectionType } from '@/services/deriv-connection-pool.service';
import { useStreakCounter } from '../../hooks/useStreakCounter';
import './StreakIndicator.scss';

interface StreakIndicatorProps {
    market?: string;
    showProbability?: boolean;
    maxHistory?: number;
}

export const StreakIndicator: React.FC<StreakIndicatorProps> = ({
    market = 'R_50',
    showProbability = true,
    maxHistory = 50,
}) => {
    const [tickHistory, setTickHistory] = useState<number[]>([]);
    const [risePattern, setRisePattern] = useState<string[]>([]);
    const [digitPattern, setDigitPattern] = useState<string[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionStats, setConnectionStats] = useState<{
        isConnected: boolean;
        isConnecting: boolean;
        retryCount: number;
        appId: string;
    } | null>(null);

    // Use streak counter hooks for different patterns
    const riseStreakData = useStreakCounter(risePattern);
    const digitStreakData = useStreakCounter(digitPattern);

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        const statsInterval = setInterval(() => {
            const poolStats = derivConnectionPool.getConnectionStats();
            // Use signals connection stats for display
            setConnectionStats(poolStats.signals?.connectionStats || null);
        }, 1000);

        const subscribeToTicks = async () => {
            try {
                console.log(`🔄 Subscribing to ${market} for streak analysis...`);

                const unsub = await derivConnectionPool.subscribeToTicks(market, tickData => {
                    if (tickData?.tick?.quote && tickData?.tick?.epoch) {
                        const newTick = tickData.tick.quote;

                        setTickHistory(prevTicks => {
                            const updatedTicks = [...prevTicks, newTick].slice(-maxHistory);

                            // Update rise/fall pattern
                            if (updatedTicks.length > 1) {
                                const newRisePattern: string[] = [];
                                for (let i = 1; i < updatedTicks.length; i++) {
                                    newRisePattern.push(updatedTicks[i] > updatedTicks[i - 1] ? 'RISE' : 'FALL');
                                }
                                setRisePattern(newRisePattern);
                            }

                            // Update digit pattern (even/odd)
                            const newDigitPattern = updatedTicks.map(tick => {
                                const digit = Math.floor((tick * 100) % 10);
                                return digit % 2 === 0 ? 'EVEN' : 'ODD';
                            });
                            setDigitPattern(newDigitPattern);

                            return updatedTicks;
                        });
                    }
                });

                unsubscribe = unsub;
                console.log(`✅ Successfully subscribed to ${market} for streak analysis`);
            } catch (error) {
                console.error(`❌ Failed to subscribe to ${market}:`, error);
                // No demo fallback - robust connection will keep trying
            }
        };

        // Monitor connection status - use signals connection
        const signalsConnection = derivConnectionPool.getConnection(ConnectionType.SIGNALS);
        const connectionUnsubscribe = signalsConnection.onConnectionChange(connected => {
            setIsConnected(connected);
            if (connected) {
                console.log(`🟢 Connection established, subscribing to ${market} for streaks`);
                subscribeToTicks();
            } else {
                console.log(`🔴 Connection lost for ${market} streaks`);
                // Clear data when disconnected
                setTickHistory([]);
                setRisePattern([]);
                setDigitPattern([]);
            }
        });

        // Initial subscription attempt
        if (signalsConnection.isConnectionActive()) {
            subscribeToTicks();
        }

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
            connectionUnsubscribe();
            clearInterval(statsInterval);
        };
    }, [market, maxHistory]);

    const getStreakColor = (count: number): string => {
        if (count < 3) return 'normal';
        if (count < 5) return 'warning';
        if (count < 8) return 'danger';
        return 'critical';
    };

    const getStreakIcon = (type: string): string => {
        switch (type) {
            case 'RISE':
                return '📈';
            case 'FALL':
                return '📉';
            case 'EVEN':
                return '⚪';
            case 'ODD':
                return '⚫';
            default:
                return '—';
        }
    };

    const getProbabilityColor = (probability: number): string => {
        if (probability >= 70) return 'high';
        if (probability >= 50) return 'medium';
        return 'low';
    };

    const getConnectionStatusText = () => {
        if (isConnected) {
            return 'Live';
        } else if (connectionStats?.isConnecting) {
            return `Connecting... (${connectionStats.retryCount})`;
        } else {
            return 'Reconnecting...';
        }
    };

    return (
        <div className='streak-indicator'>
            <div className='streak-header'>
                <div className='header-left'>
                    <h3>Streak Analysis</h3>
                    <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                        <span className='status-dot'></span>
                        <span className='status-text'>{getConnectionStatusText()}</span>
                    </div>
                    {connectionStats && (
                        <div className='connection-info'>
                            <span className='app-id'>App ID: {connectionStats.appId}</span>
                            {connectionStats.retryCount > 0 && (
                                <span className='retry-count'>Retries: {connectionStats.retryCount}</span>
                            )}
                        </div>
                    )}
                </div>
                <div className='market-info'>{market}</div>
            </div>

            <div className='streak-content'>
                {!isConnected ? (
                    <div className='connection-state'>
                        <div className='loading-spinner'></div>
                        <div className='connection-message'>
                            <span className='main-message'>
                                {connectionStats?.isConnecting
                                    ? 'Connecting to Deriv API...'
                                    : 'Reconnecting to Deriv API...'}
                            </span>
                            <span className='sub-message'>
                                Using App ID: {connectionStats?.appId || '110800'} • No demo fallback
                            </span>
                            {connectionStats?.retryCount > 0 && (
                                <span className='retry-message'>
                                    Attempt #{connectionStats.retryCount} • Auto-reconnecting...
                                </span>
                            )}
                        </div>
                    </div>
                ) : tickHistory.length === 0 ? (
                    <div className='waiting-state'>
                        <div className='loading-spinner'></div>
                        <span>Analyzing patterns from {market}...</span>
                    </div>
                ) : (
                    <div className='streaks-grid'>
                        {/* Rise/Fall Streak */}
                        <div className='streak-card'>
                            <div className='streak-type'>
                                <span className='type-icon'>{getStreakIcon(riseStreakData.currentStreak.type)}</span>
                                <span className='type-label'>Rise/Fall</span>
                            </div>

                            <div className='streak-info'>
                                <div className='streak-count-section'>
                                    <div
                                        className={`streak-count ${getStreakColor(riseStreakData.currentStreak.count)}`}
                                    >
                                        {riseStreakData.currentStreak.count}
                                    </div>
                                    <div className='streak-description'>{riseStreakData.getStreakDescription()}</div>
                                </div>

                                {showProbability && (
                                    <div className='probability-section'>
                                        <div
                                            className={`probability-circle ${getProbabilityColor(riseStreakData.currentStreak.probability)}`}
                                        >
                                            <span className='probability-value'>
                                                {riseStreakData.currentStreak.probability}%
                                            </span>
                                            <span className='probability-label'>CONTINUE</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {riseStreakData.currentStreak.isSignificant && (
                                <div className='streak-alert'>
                                    <span className='alert-icon'>⚠️</span>
                                    <span>Significant streak detected!</span>
                                </div>
                            )}
                        </div>

                        {/* Even/Odd Streak */}
                        <div className='streak-card'>
                            <div className='streak-type'>
                                <span className='type-icon'>{getStreakIcon(digitStreakData.currentStreak.type)}</span>
                                <span className='type-label'>Even/Odd</span>
                            </div>

                            <div className='streak-info'>
                                <div className='streak-count-section'>
                                    <div
                                        className={`streak-count ${getStreakColor(digitStreakData.currentStreak.count)}`}
                                    >
                                        {digitStreakData.currentStreak.count}
                                    </div>
                                    <div className='streak-description'>{digitStreakData.getStreakDescription()}</div>
                                </div>

                                {showProbability && (
                                    <div className='probability-section'>
                                        <div
                                            className={`probability-circle ${getProbabilityColor(digitStreakData.currentStreak.probability)}`}
                                        >
                                            <span className='probability-value'>
                                                {digitStreakData.currentStreak.probability}%
                                            </span>
                                            <span className='probability-label'>CONTINUE</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {digitStreakData.currentStreak.isSignificant && (
                                <div className='streak-alert'>
                                    <span className='alert-icon'>⚠️</span>
                                    <span>Significant streak detected!</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Streak History */}
                {(riseStreakData.streakHistory.length > 0 || digitStreakData.streakHistory.length > 0) && (
                    <div className='streak-history'>
                        <h4>Recent Milestones</h4>
                        <div className='history-list'>
                            {[...riseStreakData.streakHistory, ...digitStreakData.streakHistory]
                                .sort((a, b) => b.timestamp - a.timestamp)
                                .slice(0, 5)
                                .map((milestone, index) => (
                                    <div key={index} className='history-item'>
                                        <span className='milestone-icon'>{getStreakIcon(milestone.type)}</span>
                                        <span className='milestone-text'>
                                            {milestone.count} consecutive {milestone.type}
                                        </span>
                                        <span className='milestone-time'>
                                            {new Date(milestone.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

