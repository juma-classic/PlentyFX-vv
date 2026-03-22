/**
 * Signal Pro Component
 * Professional AI-powered signal analysis section
 * Integrates all Phase 1, 2, and 3 features into existing trading interface
 */

import React, { useEffect,useState } from 'react';
import { alertManager } from '../../services/alert-manager.service';
import type { EntryPointAnalysis } from '../../services/entry-point-detector.service';
import { entryPointDetector } from '../../services/entry-point-detector.service';
import type { PredictionResult } from '../../services/pattern-predictor.service';
import { patternPredictor } from '../../services/pattern-predictor.service';
import { soundManager } from '../../utils/sound-manager';
import { AlertNotification } from './AlertNotification';
import { AutoTradePanel } from './AutoTradePanel';
import { DynamicSignalCard } from './DynamicSignalCard';
import { FollowSignalButton } from './FollowSignalButton';
import { PositionSizeCalculator } from './PositionSizeCalculator';
import { PredictionDisplay } from './PredictionDisplay';
import './SignalPro.scss';

interface SignalProProps {
    symbol?: string;
    currentPrice?: number;
    isActive?: boolean;
}

export const SignalPro: React.FC<SignalProProps> = ({
    symbol = 'ODD/EVEN',
    currentPrice = 1.2345,
    isActive = false,
}) => {
    const [tickHistory, setTickHistory] = useState<number[]>([]);
    const [prediction, setPrediction] = useState<PredictionResult | null>(null);
    const [, setEntryPoint] = useState<EntryPointAnalysis | null>(null);

    const [isExpanded, setIsExpanded] = useState(false);

    // Simulate tick data updates
    useEffect(() => {
        if (!isActive) return;

        const interval = setInterval(() => {
            const change = (Math.random() - 0.5) * 0.002;
            const newTick = Math.max(0.5, currentPrice + change);

            setTickHistory(prev => [...prev.slice(-19), newTick]);
        }, 2000);

        return () => clearInterval(interval);
    }, [isActive, currentPrice]);

    // Update predictions when tick history changes
    useEffect(() => {
        if (tickHistory.length >= 5) {
            const tickData = tickHistory.map((value, index) => ({
                value,
                timestamp: Date.now() - (tickHistory.length - index - 1) * 2000,
            }));

            // Get AI prediction
            const newPrediction = patternPredictor.predict(tickData);
            setPrediction(newPrediction);

            // Get entry point analysis
            const newEntryPoint = entryPointDetector.analyzeEntryPoint(tickData, newPrediction.confidence, 2.0);
            setEntryPoint(newEntryPoint);

            // Trigger alerts for high-confidence predictions
            if (newPrediction.confidence >= 75 && newEntryPoint.optimalEntry) {
                alertManager.addAlert({
                    type: 'ENTRY_SIGNAL',
                    priority: 'HIGH',
                    message: `${newPrediction.prediction} signal detected! ${newPrediction.confidence}% confidence`,
                    duration: 5000,
                });

                soundManager.play('entry');
            }
        }
    }, [tickHistory]);

    // Subscribe to alerts
    useEffect(() => {
        const unsubscribe = alertManager.subscribe(alert => {
            setAlerts(prev => [...prev.slice(-2), alert]);
        });

        return unsubscribe;
    }, []);

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
        <div className='signal-pro'>
            {/* Header */}
            <div className='signal-pro-header'>
                <div className='header-left'>
                    <h2>🚀 Signal Pro</h2>
                    <span className='pro-badge'>AI-POWERED</span>
                </div>
                <div className='header-right'>
                    <div className={`status-indicator ${isActive ? 'active' : 'inactive'}`}>
                        {isActive ? '🟢 LIVE' : '🔴 STOPPED'}
                    </div>
                    <button className='expand-button' onClick={() => setIsExpanded(!isExpanded)}>
                        {isExpanded ? '📐 Compact' : '📊 Expand'}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className={`signal-pro-content ${isExpanded ? 'expanded' : 'compact'}`}>
                {/* Enhanced Signal Card */}
                <div className='main-signal-section'>
                    <DynamicSignalCard
                        symbol={symbol}
                        currentPrice={currentPrice}
                        tickHistory={tickHistory}
                        isLive={isActive}
                    />
                </div>

                {/* AI Analysis Panel */}
                {isExpanded && (
                    <div className='ai-analysis-panel'>
                        {/* AI Prediction */}
                        {prediction && (
                            <div className='analysis-section'>
                                <h4>🤖 AI Prediction</h4>
                                <PredictionDisplay prediction={prediction} compact />
                            </div>
                        )}

                        {/* Position Sizing */}
                        {prediction && (
                            <div className='analysis-section'>
                                <h4>📊 Position Sizing</h4>
                                <PositionSizeCalculator
                                    confidence={prediction.confidence}
                                    winRate={0.65}
                                    payoutRatio={1.8}
                                />
                            </div>
                        )}

                        {/* Quick Actions */}
                        {prediction && prediction.recommendedAction === 'TRADE' && (
                            <div className='analysis-section'>
                                <h4>⚡ Quick Trade</h4>
                                <FollowSignalButton
                                    prediction={prediction}
                                    signalType={prediction.prediction as 'RISE' | 'FALL'}
                                    amount={2}
                                    duration={5}
                                    onExecute={handleFollowSignal}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Auto Trading Panel (Always Visible) */}
                <div className='auto-trade-section'>
                    <AutoTradePanel />
                </div>
            </div>

            {/* Performance Stats */}
            <div className='signal-pro-stats'>
                <div className='stat-item'>
                    <span className='stat-label'>Signals Today:</span>
                    <span className='stat-value'>12</span>
                </div>
                <div className='stat-item'>
                    <span className='stat-label'>Accuracy:</span>
                    <span className='stat-value'>78%</span>
                </div>
                <div className='stat-item'>
                    <span className='stat-label'>Last Signal:</span>
                    <span className='stat-value'>
                        {prediction ? `${prediction.prediction} (${prediction.confidence}%)` : 'None'}
                    </span>
                </div>
            </div>

            {/* Alert Notifications - Managed by AlertNotification component */}
            <AlertNotification />
        </div>
    );
};
