/**
 * Integrated Trading Demo Page
 * Showcases all Phase 1, 2, and 3 features working together
 */

import React, { useState, useEffect } from 'react';
import { DynamicSignalCard } from '../components/signals/DynamicSignalCard';
import { PredictionDisplay } from '../components/signals/PredictionDisplay';
import { AutoTradePanel } from '../components/signals/AutoTradePanel';
import { PositionSizeCalculator } from '../components/signals/PositionSizeCalculator';
import { FollowSignalButton } from '../components/signals/FollowSignalButton';
import { AlertNotification } from '../components/signals/AlertNotification';
import { patternPredictor } from '../services/pattern-predictor.service';
import { entryPointDetector } from '../services/entry-point-detector.service';
import { alertManager } from '../services/alert-manager.service';
import { soundManager } from '../utils/sound-manager.ts';
import type { PredictionResult } from '../services/pattern-predictor.service';
import type { EntryPointAnalysis } from '../services/entry-point-detector.service';
import './integrated-trading-demo.scss';

export const IntegratedTradingDemo: React.FC = () => {
    const [currentTick, setCurrentTick] = useState(1.2345);
    const [tickHistory, setTickHistory] = useState<number[]>([]);
    const [prediction, setPrediction] = useState<PredictionResult | null>(null);
    const [entryPoint, setEntryPoint] = useState<EntryPointAnalysis | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [alerts, setAlerts] = useState<any[]>([]);

    // Simulate live tick data
    useEffect(() => {
        if (!isRunning) return;

        const interval = setInterval(() => {
            const change = (Math.random() - 0.5) * 0.0020; // ±0.001 change
            const newTick = Math.max(0.5, currentTick + change);
            
            setCurrentTick(newTick);
            setTickHistory(prev => [...prev.slice(-19), newTick]); // Keep last 20 ticks
        }, 1000);

        return () => clearInterval(interval);
    }, [isRunning, currentTick]);

    // Update predictions when tick history changes
    useEffect(() => {
        if (tickHistory.length >= 5) {
            const tickData = tickHistory.map((value, index) => ({
                value,
                timestamp: Date.now() - (tickHistory.length - index - 1) * 1000,
            }));

            // Get prediction
            const newPrediction = patternPredictor.predict(tickData);
            setPrediction(newPrediction);

            // Get entry point analysis
            const newEntryPoint = entryPointDetector.analyzeEntryPoint(
                tickData,
                newPrediction.confidence,
                2.5 // Risk/reward ratio
            );
            setEntryPoint(newEntryPoint);

            // Trigger alerts for high-confidence predictions
            if (newPrediction.confidence >= 75 && newEntryPoint.optimalEntry) {
                alertManager.addAlert({
                    type: 'ENTRY_SIGNAL',
                    priority: 'HIGH',
                    message: `${newPrediction.prediction} signal detected! ${newPrediction.confidence}% confidence`,
                    duration: 5000,
                });

                // Play sound
                soundManager.play('entry');
            }
        }
    }, [tickHistory]);

    // Subscribe to alerts
    useEffect(() => {
        const unsubscribe = alertManager.subscribe((alert) => {
            setAlerts(prev => [...prev, alert]);
        });

        return unsubscribe;
    }, []);

    const handleStartStop = () => {
        setIsRunning(!isRunning);
        if (!isRunning) {
            // Initialize with some sample data
            const initialTicks = Array.from({ length: 10 }, (_, i) => 
                1.2345 + (Math.random() - 0.5) * 0.01
            );
            setTickHistory(initialTicks);
        }
    };

    const handleFollowSignal = (success: boolean) => {
        if (success) {
            alertManager.addAlert({
                type: 'TRADE_EXECUTED',
                priority: 'MEDIUM',
                message: 'Trade executed successfully!',
                duration: 3000,
            });
            soundManager.play('win');
        } else {
            alertManager.addAlert({
                type: 'TRADE_FAILED',
                priority: 'HIGH',
                message: 'Trade execution failed!',
                duration: 5000,
            });
            soundManager.play('loss');
        }
    };

    return (
        <div className="integrated-trading-demo">
            {/* Header */}
            <div className="demo-header">
                <h1>🚀 Integrated Trading Signal System</h1>
                <p>Complete AI-powered trading system with all Phase 1, 2, and 3 features</p>
                
                <div className="demo-controls">
                    <button 
                        className={`start-button ${isRunning ? 'stop' : 'start'}`}
                        onClick={handleStartStop}
                    >
                        {isRunning ? '⏹️ Stop Demo' : '▶️ Start Demo'}
                    </button>
                    
                    <div className="current-tick">
                        Current Tick: <strong>{currentTick.toFixed(5)}</strong>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="demo-content">
                {/* Left Column - Signal Analysis */}
                <div className="left-column">
                    {/* Dynamic Signal Card */}
                    <div className="section">
                        <h3>📊 Live Signal Analysis</h3>
                        <DynamicSignalCard
                            symbol="EUR/USD"
                            currentPrice={currentTick}
                            tickHistory={tickHistory}
                            isLive={isRunning}
                        />
                    </div>

                    {/* AI Prediction */}
                    {prediction && (
                        <div className="section">
                            <h3>🤖 AI Prediction</h3>
                            <PredictionDisplay prediction={prediction} />
                        </div>
                    )}
                </div>

                {/* Right Column - Trading Controls */}
                <div className="right-column">
                    {/* Position Size Calculator */}
                    {prediction && (
                        <div className="section">
                            <h3>📊 Position Sizing</h3>
                            <PositionSizeCalculator
                                confidence={prediction.confidence}
                                winRate={0.65} // Example win rate
                                payoutRatio={1.8} // Example payout ratio
                            />
                        </div>
                    )}

                    {/* Follow Signal Button */}
                    {prediction && prediction.recommendedAction === 'TRADE' && (
                        <div className="section">
                            <h3>⚡ Quick Trade</h3>
                            <FollowSignalButton
                                prediction={prediction}
                                signalType={prediction.prediction as any}
                                amount={2}
                                duration={5}
                                onExecute={handleFollowSignal}
                            />
                        </div>
                    )}

                    {/* Auto Trading Panel */}
                    <div className="section">
                        <h3>🤖 Auto Trading</h3>
                        <AutoTradePanel />
                    </div>
                </div>
            </div>

            {/* Bottom Section - System Status */}
            <div className="system-status">
                <div className="status-grid">
                    <div className="status-item">
                        <span className="status-label">System Status:</span>
                        <span className={`status-value ${isRunning ? 'active' : 'inactive'}`}>
                            {isRunning ? '🟢 LIVE' : '🔴 STOPPED'}
                        </span>
                    </div>
                    
                    <div className="status-item">
                        <span className="status-label">Ticks Processed:</span>
                        <span className="status-value">{tickHistory.length}</span>
                    </div>
                    
                    {prediction && (
                        <div className="status-item">
                            <span className="status-label">Last Prediction:</span>
                            <span className="status-value">
                                {prediction.prediction} ({prediction.confidence}%)
                            </span>
                        </div>
                    )}
                    
                    {entryPoint && (
                        <div className="status-item">
                            <span className="status-label">Entry Score:</span>
                            <span className="status-value">{entryPoint.score}/100</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Alert Notifications */}
            <div className="alert-container">
                {alerts.slice(-3).map((alert) => (
                    <AlertNotification
                        key={alert.id}
                        alert={alert}
                        onClose={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
                    />
                ))}
            </div>

            {/* Feature Showcase */}
            <div className="feature-showcase">
                <h3>🎯 Integrated Features</h3>
                <div className="features-grid">
                    <div className="feature-card">
                        <h4>Phase 1: Dynamic Signals</h4>
                        <ul>
                            <li>✅ Live pattern display</li>
                            <li>✅ Streak counters</li>
                            <li>✅ Probability meters</li>
                            <li>✅ Dynamic signal cards</li>
                        </ul>
                    </div>
                    
                    <div className="feature-card">
                        <h4>Phase 2: Smart Alerts</h4>
                        <ul>
                            <li>✅ Entry point detection</li>
                            <li>✅ Countdown timers</li>
                            <li>✅ Auto-trigger alerts</li>
                            <li>✅ Sound notifications</li>
                        </ul>
                    </div>
                    
                    <div className="feature-card">
                        <h4>Phase 3: AI Trading</h4>
                        <ul>
                            <li>✅ Pattern prediction engine</li>
                            <li>✅ Auto-execute trades</li>
                            <li>✅ Follow signal button</li>
                            <li>✅ Smart position sizing</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};