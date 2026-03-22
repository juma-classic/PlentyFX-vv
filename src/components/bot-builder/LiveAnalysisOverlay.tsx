/**
 * Live Analysis Overlay for Bot Builder
 * Floating overlay with live tick movement and AI-powered predictions
 */

import React, { useEffect, useState } from 'react';
import { derivConnectionPool, ConnectionType } from '@/services/deriv-connection-pool.service';
import { patternPredictor } from '@/services/pattern-predictor.service';
import { PredictionDisplay } from '../signals/PredictionDisplay';
import './LiveAnalysisOverlay.scss';

interface LiveAnalysisOverlayProps {
    market?: string;
    tradeType?: 'evenodd' | 'risefall' | 'overunder';
    isVisible: boolean;
    onClose: () => void;
    onMinimize: () => void;
    isMinimized: boolean;
}

interface TickData {
    quote: number;
    epoch: number;
    digit: number;
    direction?: 'RISE' | 'FALL';
}

export const LiveAnalysisOverlay: React.FC<LiveAnalysisOverlayProps> = ({
    market = 'R_50',
    tradeType = 'evenodd',
    isVisible,
    onClose,
    onMinimize,
    isMinimized,
}) => {
    const [liveTicks, setLiveTicks] = useState<TickData[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [aiPrediction, setAiPrediction] = useState<any>(null);
    const [connectionStats, setConnectionStats] = useState<any>(null);
    const [currentPattern, setCurrentPattern] = useState<('EVEN' | 'ODD' | 'RISE' | 'FALL' | 'OVER' | 'UNDER')[]>([]);

    // Live tick subscription
    useEffect(() => {
        if (!isVisible) return;

        let unsubscribe: (() => void) | undefined;
        const statsInterval = setInterval(() => {
            const poolStats = derivConnectionPool.getConnectionStats();
            setConnectionStats(poolStats.analysis?.connectionStats || null);
        }, 1000);

        const subscribeToTicks = async () => {
            try {
                console.log(`🔄 Bot Builder: Subscribing to ${market} ticks...`);

                const unsub = await derivConnectionPool.subscribeToTicks(market, (tickData: any) => {
                    if (tickData?.tick?.quote && tickData?.tick?.epoch) {
                        const newTick: TickData = {
                            quote: tickData.tick.quote,
                            epoch: tickData.tick.epoch,
                            digit: Math.floor((tickData.tick.quote * 100) % 10),
                        };

                        setLiveTicks(prevTicks => {
                            const updatedTicks = [...prevTicks, newTick];

                            // Add direction based on previous tick
                            if (updatedTicks.length > 1) {
                                const current = updatedTicks[updatedTicks.length - 1];
                                const previous = updatedTicks[updatedTicks.length - 2];
                                if (current && previous) {
                                    current.direction = current.quote > previous.quote ? 'RISE' : 'FALL';
                                }
                            }

                            // Keep only the last 30 ticks for performance
                            return updatedTicks.slice(-30);
                        });
                    }
                });

                unsubscribe = unsub;
                console.log(`✅ Bot Builder: Successfully subscribed to ${market}`);
            } catch (error) {
                console.error(`❌ Bot Builder: Failed to subscribe to ${market}:`, error);
            }
        };

        // Monitor connection status
        const analysisConnection = derivConnectionPool.getConnection(ConnectionType.ANALYSIS);
        const connectionUnsubscribe = analysisConnection.onConnectionChange(connected => {
            setIsConnected(connected);
            if (connected) {
                subscribeToTicks();
            } else {
                setLiveTicks([]);
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
    }, [market, isVisible]);

    // Generate pattern based on trade type
    useEffect(() => {
        if (liveTicks.length === 0) return;

        const pattern = liveTicks.slice(-18).map(tick => {
            switch (tradeType) {
                case 'evenodd':
                    return tick.digit % 2 === 0 ? 'EVEN' : 'ODD';
                case 'risefall':
                    return tick.direction || 'RISE';
                case 'overunder':
                    return tick.digit >= 5 ? 'OVER' : 'UNDER';
                default:
                    return tick.digit % 2 === 0 ? 'EVEN' : 'ODD';
            }
        });

        setCurrentPattern(pattern);
    }, [liveTicks, tradeType]);

    // AI Prediction based on live ticks
    useEffect(() => {
        if (liveTicks.length >= 5) {
            const tickData = liveTicks.map(tick => ({
                value: tick.quote,
                timestamp: tick.epoch * 1000,
                direction: tick.direction,
            }));

            const prediction = patternPredictor.predict(tickData);
            setAiPrediction(prediction);
        } else {
            setAiPrediction(null);
        }
    }, [liveTicks]);

    if (!isVisible) return null;

    const latestTick = liveTicks[liveTicks.length - 1];
    const getMarketDisplay = (market: string) => {
        const marketMap: Record<string, string> = {
            'R_10': 'Volatility 10',
            'R_25': 'Volatility 25',
            'R_50': 'Volatility 50',
            'R_75': 'Volatility 75',
            'R_100': 'Volatility 100',
            '1HZ10V': 'Volatility 10 (1s)',
            '1HZ25V': 'Volatility 25 (1s)',
            '1HZ50V': 'Volatility 50 (1s)',
            '1HZ75V': 'Volatility 75 (1s)',
            '1HZ100V': 'Volatility 100 (1s)',
        };
        return marketMap[market] || market;
    };

    return (
        <div className={`live-analysis-overlay ${isMinimized ? 'minimized' : ''}`}>
            <div className='overlay-header'>
                <div className='header-left'>
                    <span className='overlay-icon'>📊</span>
                    <div className='header-info'>
                        <h3>Live Analysis</h3>
                        <span className='market-name'>{getMarketDisplay(market)}</span>
                    </div>
                </div>
                <div className='header-controls'>
                    <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                        <span className='status-dot'></span>
                        <span className='status-text'>
                            {isConnected ? 'Live' : 'Reconnecting...'}
                            {connectionStats && connectionStats.retryCount > 0 && ` (${connectionStats.retryCount})`}
                        </span>
                    </div>
                    <button className='minimize-btn' onClick={onMinimize} title={isMinimized ? 'Expand' : 'Minimize'}>
                        {isMinimized ? '▲' : '▼'}
                    </button>
                    <button className='close-btn' onClick={onClose} title='Close'>
                        ✕
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <div className='overlay-content'>
                    {/* Current Price Display */}
                    {latestTick && (
                        <div className='current-price-section'>
                            <div className='price-display'>
                                <span className='price-value'>{latestTick.quote.toFixed(5)}</span>
                                <span className='digit-badge'>{latestTick.digit}</span>
                            </div>
                            <div className='price-info'>
                                <span className='price-label'>Current Price</span>
                                <span className='last-update'>
                                    {new Date(latestTick.epoch * 1000).toLocaleTimeString()}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Live Tick Movement */}
                    <div className='live-tick-section'>
                        <h4>🎯 Live Tick Movement</h4>
                        {liveTicks.length > 0 ? (
                            <div className='tick-movement-grid'>
                                {/* Direction Row */}
                                <div className='movement-row'>
                                    <span className='row-label'>Direction:</span>
                                    <div className='movement-ticks'>
                                        {liveTicks.slice(-12).map((tick, index) => (
                                            <div
                                                key={`dir-${index}`}
                                                className={`movement-tick ${tick.direction?.toLowerCase() || 'neutral'}`}
                                            >
                                                {tick.direction === 'RISE' ? '↗' : tick.direction === 'FALL' ? '↘' : '—'}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Digits Row */}
                                <div className='movement-row'>
                                    <span className='row-label'>Last Digit:</span>
                                    <div className='movement-ticks'>
                                        {liveTicks.slice(-12).map((tick, index) => (
                                            <div
                                                key={`digit-${index}`}
                                                className={`movement-tick digit ${tick.digit % 2 === 0 ? 'even' : 'odd'}`}
                                            >
                                                {tick.digit}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Pattern Row */}
                                <div className='movement-row'>
                                    <span className='row-label'>Pattern:</span>
                                    <div className='movement-ticks'>
                                        {currentPattern.slice(-12).map((pattern, index) => (
                                            <div
                                                key={`pattern-${index}`}
                                                className={`movement-tick pattern ${pattern.toLowerCase()}`}
                                            >
                                                {pattern === 'EVEN' ? 'E' : 
                                                 pattern === 'ODD' ? 'O' :
                                                 pattern === 'RISE' ? 'R' :
                                                 pattern === 'FALL' ? 'F' :
                                                 pattern === 'OVER' ? 'O' : 'U'}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className='tick-loading'>
                                <div className='loading-spinner'></div>
                                <span>Waiting for live tick data...</span>
                            </div>
                        )}
                    </div>

                    {/* AI Prediction */}
                    {aiPrediction && (
                        <div className='ai-prediction-section'>
                            <PredictionDisplay prediction={aiPrediction} compact={true} />
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className='quick-actions'>
                        <div className='action-buttons'>
                            <button className='action-btn market-btn' title='Change Market'>
                                📊 {getMarketDisplay(market)}
                            </button>
                            <button className='action-btn type-btn' title='Change Trade Type'>
                                🎯 {tradeType.toUpperCase()}
                            </button>
                            <button className='action-btn refresh-btn' title='Refresh Data'>
                                🔄 Refresh
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};