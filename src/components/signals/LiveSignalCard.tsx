import React, { useEffect, useState } from 'react';
import type { PatternAlert } from '../../hooks/useLiveTickData';
import { useLiveTickData } from '../../hooks/useLiveTickData';
import './LiveSignalCard.scss';

interface TradeSignal {
    market: string;
    type: string;
    confidence: number;
    stake: number;
}

interface LiveSignalCardProps {
    market: string;
    marketLabel: string;
    onTradeSignal?: (signal: TradeSignal) => void;
}

export const LiveSignalCard: React.FC<LiveSignalCardProps> = ({ market, marketLabel, onTradeSignal }) => {
    const { ticks, currentPattern, alerts, isConnected, latestTick } = useLiveTickData(market, true);
    const [flashAlert, setFlashAlert] = useState(false);

    // Flash animation when new alert arrives
    useEffect(() => {
        if (alerts.length > 0 && alerts[0].action === 'ENTER_NOW') {
            setFlashAlert(true);
            const timer = setTimeout(() => setFlashAlert(false), 1000);
            return () => clearTimeout(timer);
        }
    }, [alerts]);

    // Auto-execute trade on high-confidence signals
    const handleAutoTrade = (alert: PatternAlert) => {
        if (onTradeSignal && alert.confidence >= 85) {
            onTradeSignal({
                market,
                type: alert.message.includes('EVEN') ? 'EVEN' : 'ODD',
                confidence: alert.confidence,
                stake: calculateStake(alert.confidence),
            });
        }
    };

    const calculateStake = (confidence: number): number => {
        // Dynamic stake based on confidence
        if (confidence >= 90) return 2.0;
        if (confidence >= 80) return 1.5;
        if (confidence >= 70) return 1.0;
        return 0.5;
    };

    return (
        <div className={`live-signal-card ${flashAlert ? 'flash-alert' : ''}`}>
            {/* Header */}
            <div className='card-header'>
                <div className='market-info'>
                    <h3>{marketLabel}</h3>
                    <span className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
                        {isConnected ? '🟢 LIVE' : '🔴 Disconnected'}
                    </span>
                </div>
                {latestTick && (
                    <div className='current-price'>
                        <span className='price-value'>{latestTick.quote.toFixed(5)}</span>
                        <span className='digit-badge'>{latestTick.digit}</span>
                    </div>
                )}
            </div>

            {/* Live Pattern Display */}
            <div className='live-pattern'>
                <div className='pattern-label'>Live Pattern (Last 18 ticks)</div>
                <div className='pattern-boxes'>
                    {currentPattern.map((p, index) => (
                        <div
                            key={index}
                            className={`pattern-box ${p === 'E' ? 'even' : 'odd'} ${
                                index === currentPattern.length - 1 ? 'latest' : ''
                            }`}
                        >
                            {p}
                        </div>
                    ))}
                </div>
            </div>

            {/* Real-Time Alerts */}
            {alerts.length > 0 && (
                <div className='alerts-section'>
                    {alerts.map((alert, alertIndex) => (
                        <div key={alertIndex} className={`alert alert-${alert.action.toLowerCase()}`}>
                            <div className='alert-header'>
                                <span className='alert-icon'>
                                    {alert.action === 'ENTER_NOW' ? '🚀' : alert.action === 'WAIT' ? '⏳' : '⚠️'}
                                </span>
                                <span className='alert-type'>{alert.type}</span>
                                <span className='confidence'>{alert.confidence}%</span>
                            </div>
                            <p className='alert-message'>{alert.message}</p>
                            {alert.action === 'ENTER_NOW' && (
                                <button className='trade-now-btn' onClick={() => handleAutoTrade(alert)}>
                                    Trade Now (${calculateStake(alert.confidence)})
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Live Statistics */}
            <div className='live-stats'>
                <div className='stat-item'>
                    <span className='stat-label'>Total Ticks</span>
                    <span className='stat-value'>{ticks.length}</span>
                </div>
                <div className='stat-item'>
                    <span className='stat-label'>EVEN Count</span>
                    <span className='stat-value'>{ticks.filter(t => t.digit % 2 === 0).length}</span>
                </div>
                <div className='stat-item'>
                    <span className='stat-label'>ODD Count</span>
                    <span className='stat-value'>{ticks.filter(t => t.digit % 2 !== 0).length}</span>
                </div>
            </div>

            {/* Tick History */}
            <div className='tick-history'>
                <div className='history-label'>Recent Ticks</div>
                <div className='history-list'>
                    {ticks
                        .slice(-10)
                        .reverse()
                        .map(tick => (
                            <div key={tick.tick} className='history-item'>
                                <span className='tick-time'>{new Date(tick.timestamp).toLocaleTimeString()}</span>
                                <span className={`tick-digit ${tick.digit % 2 === 0 ? 'even' : 'odd'}`}>
                                    {tick.digit}
                                </span>
                                <span className='tick-quote'>{tick.quote.toFixed(5)}</span>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
};
