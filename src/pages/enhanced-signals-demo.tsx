/**
 * Enhanced Signals Demo Page
 * Showcases signal cards with integrated live tick movement and AI features
 */

import React, { useState } from 'react';
import { DynamicSignalCard } from '../components/signals/DynamicSignalCard';
import { EnhancedCountdownTimer } from '../components/signals/EnhancedCountdownTimer';
import { EnhancedTradeButton } from '../components/signals/EnhancedTradeButton';
import './enhanced-signals-demo.scss';

interface TradeSignal {
    market: string;
    type: string;
    confidence: number;
    stake: number;
    prediction: string;
}

export const EnhancedSignalsDemo: React.FC = () => {
    const [tradeSignals, setTradeSignals] = useState<TradeSignal[]>([]);
    const [globalLiveTicksEnabled, setGlobalLiveTicksEnabled] = useState(false);

    const handleTradeSignal = (signal: TradeSignal) => {
        console.log('🎯 Trade signal received:', signal);
        setTradeSignals(prev => [signal, ...prev].slice(0, 10));

        // Show notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Trade Signal Generated!', {
                body: `${signal.market}: ${signal.type} (${signal.confidence}% confidence)`,
                icon: '/favicon-pink.svg',
            });
        }
    };

    const markets = [
        { code: 'R_50', label: 'Volatility 50' },
        { code: 'R_75', label: 'Volatility 75' },
        { code: 'R_100', label: 'Volatility 100' },
        { code: '1HZ50V', label: 'Volatility 50 (1s)' },
        { code: '1HZ75V', label: 'Volatility 75 (1s)' },
    ];

    const signalTypes = [
        { type: 'OVER_UNDER', label: 'Over/Under' },
        { type: 'EVEN_ODD', label: 'Even/Odd' },
        { type: 'RISE_FALL', label: 'Rise/Fall' },
    ] as const;

    return (
        <div className='enhanced-signals-demo'>
            <div className='demo-header'>
                <h1>🚀 Enhanced Signal Cards Demo</h1>
                <p>Experience live tick movement and AI-powered predictions integrated directly into signal cards</p>

                <div className='demo-features'>
                    <div className='feature-item'>
                        <span className='feature-icon'>📊</span>
                        <span className='feature-text'>Live Tick Movement</span>
                    </div>
                    <div className='feature-item'>
                        <span className='feature-icon'>🤖</span>
                        <span className='feature-text'>AI Pattern Prediction</span>
                    </div>
                    <div className='feature-item'>
                        <span className='feature-icon'>⚡</span>
                        <span className='feature-text'>Real-time Analysis</span>
                    </div>
                    <div className='feature-item'>
                        <span className='feature-icon'>🎯</span>
                        <span className='feature-text'>Smart Trading Signals</span>
                    </div>
                </div>

                <div className='global-controls'>
                    <button
                        className={`global-live-ticks-btn ${globalLiveTicksEnabled ? 'enabled' : ''}`}
                        onClick={() => setGlobalLiveTicksEnabled(!globalLiveTicksEnabled)}
                    >
                        <span className='btn-icon'>📊</span>
                        <span className='btn-text'>
                            {globalLiveTicksEnabled ? 'Hide All Live Ticks' : 'Show All Live Ticks'}
                        </span>
                    </button>
                    <p className='global-controls-description'>
                        {globalLiveTicksEnabled
                            ? 'Live tick overlays are now movable! Drag them to your preferred position.'
                            : "Enable movable live tick overlays that won't block your trading interface."}
                    </p>
                </div>
            </div>

            <div className='demo-content'>
                {/* Enhanced Components Showcase */}
                <div className='enhanced-showcase'>
                    <h2>🎯 Enhanced Features Showcase</h2>
                    <div className='showcase-grid'>
                        <div className='showcase-item'>
                            <h3>⏰ Enhanced Countdown Timer</h3>
                            <p>Large display with progress ring, consecutive pattern tracking, and CONTINUE button</p>
                            <EnhancedCountdownTimer
                                duration={15}
                                showProgress={true}
                                size='large'
                                autoStart={false}
                                showContinueButton={true}
                                consecutiveCount={5}
                                patternType='OVER'
                                onComplete={() => console.log('Demo timer completed')}
                            />
                        </div>

                        <div className='showcase-item'>
                            <h3>💰 Enhanced Trade Buttons</h3>
                            <p>Confidence-based styling, stake display, and enhanced visual feedback</p>
                            <div className='trade-buttons-demo'>
                                <EnhancedTradeButton
                                    action='Trade Now'
                                    stake='$1.5'
                                    confidence={92}
                                    type='OVER'
                                    highlighted={true}
                                    onClick={() => console.log('Ultra High confidence trade')}
                                    size='large'
                                />
                                <EnhancedTradeButton
                                    action='Trade Now'
                                    stake='$1.0'
                                    confidence={75}
                                    type='UNDER'
                                    onClick={() => console.log('Good confidence trade')}
                                    size='medium'
                                />
                                <EnhancedTradeButton
                                    action='Trade Now'
                                    stake='$0.5'
                                    confidence={65}
                                    type='EVEN'
                                    onClick={() => console.log('Fair confidence trade')}
                                    size='small'
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className='signals-grid'>
                    {markets.map(market =>
                        signalTypes.map(signalType => (
                            <div key={`${market.code}-${signalType.type}`} className='signal-card-container'>
                                <div className='card-title'>
                                    <h3>{market.label}</h3>
                                    <span className='signal-type-badge'>{signalType.label}</span>
                                </div>
                                <DynamicSignalCard
                                    market={market.code}
                                    marketLabel={market.label}
                                    signalType={signalType.type}
                                    onTradeSignal={handleTradeSignal}
                                />
                            </div>
                        ))
                    )}
                </div>

                {/* Trade Signals Log */}
                {tradeSignals.length > 0 && (
                    <div className='trade-signals-log'>
                        <h2>📝 Generated Trade Signals</h2>
                        <div className='signals-list'>
                            {tradeSignals.map((signal, index) => (
                                <div key={index} className='signal-log-item'>
                                    <div className='signal-info'>
                                        <span className='signal-market'>{signal.market}</span>
                                        <span className='signal-type'>{signal.type}</span>
                                        <span className='signal-confidence'>{signal.confidence}%</span>
                                    </div>
                                    <div className='signal-details'>
                                        <span className='signal-stake'>${signal.stake}</span>
                                        <span className='signal-prediction'>{signal.prediction}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className='demo-info'>
                <div className='info-section'>
                    <h3>🔍 What You&apos;re Seeing</h3>
                    <ul>
                        <li>
                            <strong>Live Tick Movement:</strong> Real-time price movements, directions, and last digits
                        </li>
                        <li>
                            <strong>AI Predictions:</strong> Pattern-based predictions with confidence levels
                        </li>
                        <li>
                            <strong>Smart Alerts:</strong> Automated entry point detection and timing
                        </li>
                        <li>
                            <strong>Pattern Analysis:</strong> Streak detection and probability calculations
                        </li>
                        <li>
                            <strong>Auto-Trading:</strong> Intelligent stake sizing and risk management
                        </li>
                    </ul>
                </div>

                <div className='info-section'>
                    <h3>⚡ Key Features</h3>
                    <ul>
                        <li>
                            <strong>No Demo Fallback:</strong> 100% real Deriv API data
                        </li>
                        <li>
                            <strong>Multi-App ID Pool:</strong> Robust connection management
                        </li>
                        <li>
                            <strong>Real-time Updates:</strong> Live tick streaming with visual indicators
                        </li>
                        <li>
                            <strong>AI-Powered:</strong> Advanced pattern recognition and prediction
                        </li>
                        <li>
                            <strong>Mobile Responsive:</strong> Optimized for all screen sizes
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default EnhancedSignalsDemo;
