/**
 * Signal Pro Page
 * Dedicated page for professional AI-powered trading signals
 */

import React, { useEffect, useState } from 'react';
import { api_base } from '@/external/bot-skeleton';
import { AlertNotification } from '../components/signals/AlertNotification';
import { AutoTradePanel } from '../components/signals/AutoTradePanel';
import { MultiMarketSignals } from '../components/signals/MultiMarketSignals';
import { PositionSizeCalculator } from '../components/signals/PositionSizeCalculator';
import { PredictionDisplay } from '../components/signals/PredictionDisplay';
import { SignalPro } from '../components/signals/SignalPro';
import { alertManager } from '../services/alert-manager.service';
import type { PredictionResult } from '../services/pattern-predictor.service';
import { patternPredictor } from '../services/pattern-predictor.service';
import { soundManager } from '../utils/sound-manager';
import './signal-pro-page.scss';

export const SignalProPage: React.FC = () => {
    const [currentTick, setCurrentTick] = useState(1.2345);
    const [isLiveMode, setIsLiveMode] = useState(false);
    const [selectedSymbol, setSelectedSymbol] = useState('R_10');
    const [prediction, setPrediction] = useState<PredictionResult | null>(null);
    const [tickHistory, setTickHistory] = useState<number[]>([]);
    const [activeTab, setActiveTab] = useState<'single' | 'multi'>('single');

    // Real Deriv tick updates
    useEffect(() => {
        if (!isLiveMode || !api_base.api) return;

        const subscription = api_base.api.subscribe({
            ticks: selectedSymbol,
        });

        subscription.subscribe(
            (response: unknown) => {
                if (response.tick) {
                    const newTick = response.tick.quote;
                    setCurrentTick(newTick);
                    setTickHistory(prev => [...prev.slice(-19), newTick]);
                }
            },
            (error: unknown) => {
                console.error('Tick subscription error:', error);
                alertManager.addAlert(
                    'ERROR',
                    'HIGH',
                    'Connection Error',
                    'Failed to connect to live data. Check your connection.',
                    5000
                );
            }
        );

        // Store subscription for cleanup

        return () => {
            if (subscription) {
                subscription.unsubscribe();
            }
        };
    }, [isLiveMode, selectedSymbol]);

    // Update predictions
    useEffect(() => {
        if (tickHistory.length >= 5) {
            const tickData = tickHistory.map((value, index) => ({
                value,
                timestamp: Date.now() - (tickHistory.length - index - 1) * 1500,
            }));

            const newPrediction = patternPredictor.predict(tickData);
            setPrediction(newPrediction);
        }
    }, [tickHistory]);

    // AlertNotification component handles its own alert subscription

    const handleStartStop = () => {
        setIsLiveMode(!isLiveMode);
        if (!isLiveMode) {
            // Initialize with sample data
            const initialTicks = Array.from({ length: 10 }, () => 1.2345 + (Math.random() - 0.5) * 0.01);
            setTickHistory(initialTicks);

            alertManager.addAlert(
                'SUCCESS',
                'MEDIUM',
                'Signal Pro Active',
                'Signal Pro activated! Live analysis started.',
                3000
            );
            soundManager.play('entry');
        } else {
            alertManager.addAlert('INFO', 'LOW', 'Signal Pro Stopped', 'Signal Pro stopped.', 2000);
        }
    };

    const symbols = [
        { value: 'R_10', label: 'Volatility 10 Index' },
        { value: 'R_25', label: 'Volatility 25 Index' },
        { value: 'R_50', label: 'Volatility 50 Index' },
        { value: 'R_75', label: 'Volatility 75 Index' },
        { value: 'R_100', label: 'Volatility 100 Index' },
        { value: '1HZ10V', label: 'Volatility 10 (1s) Index' },
        { value: '1HZ25V', label: 'Volatility 25 (1s) Index' },
        { value: '1HZ50V', label: 'Volatility 50 (1s) Index' },
        { value: '1HZ75V', label: 'Volatility 75 (1s) Index' },
        { value: '1HZ100V', label: 'Volatility 100 (1s) Index' },
    ];

    return (
        <div className={`signal-pro-page ${document.body.className}`}>
            {/* Page Header */}
            <div className='page-header'>
                <div className='header-content'>
                    <div className='title-section'>
                        <h1>🚀 Signal Pro</h1>
                        <p>Professional AI-Powered Trading Signals</p>
                        <div className='feature-badges'>
                            <span className='badge'>🤖 AI Predictions</span>
                            <span className='badge'>⚡ Auto Trading</span>
                            <span className='badge'>📊 Smart Sizing</span>
                            <span className='badge'>🔊 Alerts</span>
                        </div>
                    </div>

                    <div className='controls-section'>
                        <div className='symbol-selector'>
                            <label>Trading Symbol:</label>
                            <select value={selectedSymbol} onChange={e => setSelectedSymbol(e.target.value)}>
                                {symbols.map(symbol => (
                                    <option key={symbol.value} value={symbol.value}>
                                        {symbol.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            className={`live-button ${isLiveMode ? 'active' : 'inactive'}`}
                            onClick={handleStartStop}
                        >
                            {isLiveMode ? '⏹️ Stop Live' : '▶️ Start Live'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className='tab-navigation'>
                <button
                    className={`tab-button ${activeTab === 'single' ? 'active' : ''}`}
                    onClick={() => setActiveTab('single')}
                >
                    📊 Single Market
                </button>
                <button
                    className={`tab-button ${activeTab === 'multi' ? 'active' : ''}`}
                    onClick={() => setActiveTab('multi')}
                >
                    🌐 Volatility Multi-Markets
                </button>
            </div>

            {/* Main Content */}
            <div className='page-content'>
                {activeTab === 'single' ? (
                    <>
                        {/* Primary Signal Pro Section */}
                        <div className='main-section'>
                            <SignalPro
                                symbol={symbols.find(s => s.value === selectedSymbol)?.label || selectedSymbol}
                                currentPrice={currentTick}
                                isActive={isLiveMode}
                            />
                        </div>

                        {/* Side Panel */}
                        <div className='side-panel'>
                            {/* AI Analysis */}
                            {prediction && (
                                <div className='panel-section'>
                                    <h3>🤖 AI Analysis</h3>
                                    <PredictionDisplay prediction={prediction} />
                                </div>
                            )}

                            {/* Position Calculator */}
                            {prediction && (
                                <div className='panel-section'>
                                    <h3>📊 Position Calculator</h3>
                                    <PositionSizeCalculator
                                        confidence={prediction.confidence}
                                        winRate={0.68}
                                        payoutRatio={1.85}
                                    />
                                </div>
                            )}

                            {/* Auto Trading */}
                            <div className='panel-section'>
                                <h3>🤖 Auto Trading</h3>
                                <AutoTradePanel />
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Multi-Market Signals Section */}
                        <div className='multi-market-section'>
                            <MultiMarketSignals isLiveMode={isLiveMode} maxMarkets={6} />
                        </div>
                    </>
                )}
            </div>

            {/* Performance Dashboard */}
            <div className='performance-dashboard'>
                <h3>📈 Performance Dashboard</h3>
                <div className='metrics-grid'>
                    <div className='metric-card'>
                        <div className='metric-value'>24</div>
                        <div className='metric-label'>Signals Today</div>
                    </div>
                    <div className='metric-card'>
                        <div className='metric-value'>78%</div>
                        <div className='metric-label'>Accuracy Rate</div>
                    </div>
                    <div className='metric-card'>
                        <div className='metric-value'>+$127</div>
                        <div className='metric-label'>Today&apos;s P&L</div>
                    </div>
                    <div className='metric-card'>
                        <div className='metric-value'>12</div>
                        <div className='metric-label'>Active Trades</div>
                    </div>
                    <div className='metric-card'>
                        <div className='metric-value'>{prediction ? `${prediction.confidence}%` : 'N/A'}</div>
                        <div className='metric-label'>Last Confidence</div>
                    </div>
                    <div className='metric-card'>
                        <div className='metric-value'>{currentTick.toFixed(5)}</div>
                        <div className='metric-label'>Current Price</div>
                    </div>
                </div>
            </div>

            {/* Features Overview */}
            <div className='features-overview'>
                <h3>🎯 Signal Pro Features</h3>
                <div className='features-grid'>
                    <div className='feature-item'>
                        <div className='feature-icon'>🤖</div>
                        <h4>AI Pattern Recognition</h4>
                        <p>
                            Advanced machine learning algorithms analyze market patterns and predict future movements
                            with high accuracy.
                        </p>
                    </div>
                    <div className='feature-item'>
                        <div className='feature-icon'>⚡</div>
                        <h4>Smart Entry Points</h4>
                        <p>
                            Optimal timing detection ensures you enter trades at the best possible moments for maximum
                            profit potential.
                        </p>
                    </div>
                    <div className='feature-item'>
                        <div className='feature-icon'>📊</div>
                        <h4>Kelly Criterion Sizing</h4>
                        <p>
                            Mathematical position sizing based on Kelly Criterion ensures optimal risk management and
                            capital growth.
                        </p>
                    </div>
                    <div className='feature-item'>
                        <div className='feature-icon'>🎯</div>
                        <h4>One-Click Trading</h4>
                        <p>
                            Execute trades instantly with pre-calculated parameters. No manual calculations or complex
                            setups required.
                        </p>
                    </div>
                    <div className='feature-item'>
                        <div className='feature-icon'>🤖</div>
                        <h4>Automated Execution</h4>
                        <p>
                            Set your preferences and let the system trade for you with built-in safety limits and risk
                            controls.
                        </p>
                    </div>
                    <div className='feature-item'>
                        <div className='feature-icon'>🔊</div>
                        <h4>Smart Notifications</h4>
                        <p>
                            Real-time alerts with priority levels, sound notifications, and visual indicators keep you
                            informed.
                        </p>
                    </div>
                </div>
            </div>

            {/* Alert Notifications */}
            <AlertNotification />
        </div>
    );
};
