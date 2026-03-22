/**
 * Live Tick Pattern Component
 * Shows real-time tick patterns with visual indicators
 * NO DEMO FALLBACK - Only real data with robust reconnection
 */

import React, { useEffect, useState } from 'react';
import { derivConnectionPool, ConnectionType } from '@/services/deriv-connection-pool.service';
import './LiveTickPattern.scss';

interface TickData {
    quote: number;
    epoch: number;
    direction?: 'RISE' | 'FALL';
    digit?: number;
}

interface LiveTickPatternProps {
    market?: string;
    maxTicks?: number;
    showDigits?: boolean;
    showDirection?: boolean;
}

export const LiveTickPattern: React.FC<LiveTickPatternProps> = ({
    market = 'R_50',
    maxTicks = 20,
    showDigits = true,
    showDirection = true,
}) => {
    const [ticks, setTicks] = useState<TickData[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
    const [connectionStats, setConnectionStats] = useState<{
        isConnected: boolean;
        isConnecting: boolean;
        retryCount: number;
        appId: string;
    } | null>(null);

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        const statsInterval = setInterval(() => {
            const poolStats = derivConnectionPool.getConnectionStats();
            // Use analysis connection stats for display
            setConnectionStats(poolStats.analysis?.connectionStats || null);
        }, 1000);

        const subscribeToTicks = async () => {
            try {
                console.log(`🔄 Subscribing to ${market} ticks...`);

                const unsub = await derivConnectionPool.subscribeToTicks(market, tickData => {
                    if (tickData?.tick?.quote && tickData?.tick?.epoch) {
                        const newTick: TickData = {
                            quote: tickData.tick.quote,
                            epoch: tickData.tick.epoch,
                            digit: Math.floor((tickData.tick.quote * 100) % 10),
                        };

                        setTicks(prevTicks => {
                            const updatedTicks = [...prevTicks, newTick];

                            // Add direction based on previous tick
                            if (updatedTicks.length > 1) {
                                const current = updatedTicks[updatedTicks.length - 1];
                                const previous = updatedTicks[updatedTicks.length - 2];
                                current.direction = current.quote > previous.quote ? 'RISE' : 'FALL';
                            }

                            // Keep only the last maxTicks
                            return updatedTicks.slice(-maxTicks);
                        });

                        setLastUpdate(Date.now());
                    }
                });

                unsubscribe = unsub;
                console.log(`✅ Successfully subscribed to ${market}`);
            } catch (error) {
                console.error(`❌ Failed to subscribe to ${market}:`, error);
                // No demo fallback - robust connection will keep trying
            }
        };

        // Monitor connection status - use analysis connection
        const analysisConnection = derivConnectionPool.getConnection(ConnectionType.ANALYSIS);
        const connectionUnsubscribe = analysisConnection.onConnectionChange(connected => {
            setIsConnected(connected);
            if (connected) {
                console.log(`🟢 Connection established, subscribing to ${market}`);
                subscribeToTicks();
            } else {
                console.log(`🔴 Connection lost for ${market}`);
                // Clear ticks when disconnected to show we're not getting data
                setTicks([]);
            }
        });

        // Initial subscription attempt
        if (analysisConnection.isConnectionActive()) {
            subscribeToTicks();
        }

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
            connectionUnsubscribe();
            clearInterval(statsInterval);
        };
    }, [market, maxTicks]);

    const getTimeAgo = () => {
        const seconds = Math.floor((Date.now() - lastUpdate) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        return `${minutes}m ago`;
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
        <div className='live-tick-pattern'>
            <div className='pattern-header'>
                <div className='header-left'>
                    <h3>Live Pattern (Last {ticks.length} ticks)</h3>
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
                <div className='last-update'>{ticks.length > 0 ? getTimeAgo() : 'No data'}</div>
            </div>

            <div className='pattern-content'>
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
                ) : ticks.length === 0 ? (
                    <div className='waiting-state'>
                        <div className='loading-spinner'></div>
                        <span>Waiting for tick data from {market}...</span>
                    </div>
                ) : (
                    <div className='ticks-container'>
                        {showDirection && (
                            <div className='direction-row'>
                                <span className='row-label'>Direction:</span>
                                <div className='direction-ticks'>
                                    {ticks.map((tick, index) => (
                                        <div
                                            key={`dir-${index}`}
                                            className={`direction-tick ${tick.direction?.toLowerCase() || 'neutral'}`}
                                        >
                                            {tick.direction === 'RISE' ? '↗' : tick.direction === 'FALL' ? '↘' : '—'}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {showDigits && (
                            <div className='digits-row'>
                                <span className='row-label'>Last Digit:</span>
                                <div className='digit-ticks'>
                                    {ticks.map((tick, index) => (
                                        <div
                                            key={`digit-${index}`}
                                            className={`digit-tick ${tick.digit !== undefined && tick.digit % 2 === 0 ? 'even' : 'odd'}`}
                                        >
                                            {tick.digit}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className='price-row'>
                            <span className='row-label'>Price:</span>
                            <div className='price-ticks'>
                                {ticks.map((tick, index) => (
                                    <div
                                        key={`price-${index}`}
                                        className={`price-tick ${index === ticks.length - 1 ? 'latest' : ''}`}
                                        title={`${tick.quote.toFixed(5)} at ${new Date(tick.epoch * 1000).toLocaleTimeString()}`}
                                    >
                                        {tick.quote.toFixed(2)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

