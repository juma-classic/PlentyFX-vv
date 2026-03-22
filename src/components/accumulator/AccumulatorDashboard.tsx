/**
 * Accumulator Dashboard Component
 * Comprehensive analysis and trading interface for accumulators
 */

import React, { useState, useEffect, useCallback } from 'react';
import { accumulatorAnalysisService } from '../../services/accumulator/accumulator-analysis.service';
import { AccumulatorSession, AccumulatorConfig, AccumulatorSignal } from '../../types/accumulator/accumulator.types';
import './AccumulatorDashboard.scss';

interface AccumulatorDashboardProps {
    className?: string;
}

export const AccumulatorDashboard: React.FC<AccumulatorDashboardProps> = ({ className = '' }) => {
    const [activeSession, setActiveSession] = useState<AccumulatorSession | null>(null);
    const [signals, setSignals] = useState<AccumulatorSignal[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [selectedMarket, setSelectedMarket] = useState('1HZ10V');
    const [growthRate, setGrowthRate] = useState(2);
    const [takeProfit, setTakeProfit] = useState(25);
    const [stopLoss, setStopLoss] = useState(50);

    useEffect(() => {
        initializeDashboard();
    }, []);

    const initializeDashboard = async () => {
        try {
            // Generate initial signals for different markets
            const markets = ['1HZ10V', '1HZ25V', '1HZ50V'];
            const initialSignals: AccumulatorSignal[] = [];
            
            for (const market of markets) {
                const config: AccumulatorConfig = {
                    growthRate: 2,
                    takeProfit: 25,
                    stopLoss: 50,
                    maxTicks: 1000,
                    minTicks: 10,
                    market,
                    initialStake: 1,
                    strategy: 'TICK_BASED_EXIT'
                };
                
                const signal = await accumulatorAnalysisService.generateSignal(market, config);
                initialSignals.push(signal);
            }
            
            setSignals(initialSignals);
        } catch (error) {
            console.error('Failed to initialize accumulator dashboard:', error);
        }
    };

    const startAnalysis = useCallback(async () => {
        if (isAnalyzing) return;
        
        setIsAnalyzing(true);
        try {
            const config: AccumulatorConfig = {
                growthRate,
                takeProfit,
                stopLoss,
                maxTicks: 1000,
                minTicks: 10,
                market: selectedMarket,
                initialStake: 1,
                strategy: 'TICK_BASED_EXIT'
            };
            
            const session = await accumulatorAnalysisService.startAnalysis(config);
            setActiveSession(session);
        } catch (error) {
            console.error('Failed to start analysis:', error);
        } finally {
            setIsAnalyzing(false);
        }
    }, [selectedMarket, growthRate, takeProfit, stopLoss, isAnalyzing]);

    const stopAnalysis = useCallback(() => {
        try {
            accumulatorAnalysisService.stopAnalysis();
            setActiveSession(null);
        } catch (error) {
            console.error('Failed to stop analysis:', error);
        }
    }, []);

    const refreshSignals = async () => {
        await initializeDashboard();
    };

    return (
        <div className={`accumulator-dashboard ${className}`}>
            <div className="dashboard-header">
                <h2>🎯 Accumulator Analysis Tool</h2>
                <div className="status-indicator">
                    <span className={`status ${activeSession ? 'active' : 'inactive'}`}>
                        {activeSession ? 'Active Session' : 'Ready'}
                    </span>
                </div>
            </div>

            <div className="dashboard-content">
                {/* Configuration Panel */}
                <div className="config-panel">
                    <h3>📊 Trading Configuration</h3>
                    
                    <div className="config-grid">
                        <div className="config-item">
                            <label>Market Symbol</label>
                            <select 
                                value={selectedMarket} 
                                onChange={(e) => setSelectedMarket(e.target.value)}
                                disabled={!!activeSession}
                            >
                                <option value="1HZ10V">Volatility 10 (1s)</option>
                                <option value="1HZ25V">Volatility 25 (1s)</option>
                                <option value="1HZ50V">Volatility 50 (1s)</option>
                                <option value="1HZ100V">Volatility 100 (1s)</option>
                                <option value="BOOM300N">Boom 300</option>
                                <option value="CRASH300N">Crash 300</option>
                            </select>
                        </div>

                        <div className="config-item">
                            <label>Growth Rate (%)</label>
                            <input
                                type="range"
                                min="1"
                                max="5"
                                step="0.5"
                                value={growthRate}
                                onChange={(e) => setGrowthRate(parseFloat(e.target.value))}
                                disabled={!!activeSession}
                            />
                            <span className="value">{growthRate}%</span>
                        </div>

                        <div className="config-item">
                            <label>Take Profit (%)</label>
                            <input
                                type="range"
                                min="10"
                                max="100"
                                step="5"
                                value={takeProfit}
                                onChange={(e) => setTakeProfit(parseInt(e.target.value))}
                                disabled={!!activeSession}
                            />
                            <span className="value">{takeProfit}%</span>
                        </div>

                        <div className="config-item">
                            <label>Stop Loss (%)</label>
                            <input
                                type="range"
                                min="20"
                                max="80"
                                step="5"
                                value={stopLoss}
                                onChange={(e) => setStopLoss(parseInt(e.target.value))}
                                disabled={!!activeSession}
                            />
                            <span className="value">{stopLoss}%</span>
                        </div>
                    </div>

                    <div className="action-buttons">
                        {!activeSession ? (
                            <button 
                                className="start-btn"
                                onClick={startAnalysis}
                                disabled={isAnalyzing}
                            >
                                {isAnalyzing ? '🔄 Starting...' : '🚀 Start Analysis'}
                            </button>
                        ) : (
                            <button 
                                className="stop-btn"
                                onClick={stopAnalysis}
                            >
                                ⏹️ Stop Analysis
                            </button>
                        )}
                        
                        <button 
                            className="refresh-btn"
                            onClick={refreshSignals}
                            disabled={isAnalyzing}
                        >
                            🔄 Refresh Signals
                        </button>
                    </div>
                </div>

                {/* Session Panel */}
                {activeSession && (
                    <div className="session-panel">
                        <h3>🎮 Active Session</h3>
                        
                        <div className="session-stats">
                            <div className="stat-item">
                                <label>Session ID</label>
                                <span>{activeSession.id}</span>
                            </div>
                            <div className="stat-item">
                                <label>Status</label>
                                <span className={`status ${activeSession.status.toLowerCase()}`}>
                                    {activeSession.status}
                                </span>
                            </div>
                            <div className="stat-item">
                                <label>Current Value</label>
                                <span>{activeSession.currentValue.toFixed(2)}</span>
                            </div>
                            <div className="stat-item">
                                <label>Profit</label>
                                <span className={activeSession.profit >= 0 ? 'positive' : 'negative'}>
                                    {activeSession.profit >= 0 ? '+' : ''}{activeSession.profit.toFixed(2)}
                                </span>
                            </div>
                            <div className="stat-item">
                                <label>Profit %</label>
                                <span className={activeSession.profitPercentage >= 0 ? 'positive' : 'negative'}>
                                    {activeSession.profitPercentage >= 0 ? '+' : ''}{activeSession.profitPercentage.toFixed(2)}%
                                </span>
                            </div>
                            <div className="stat-item">
                                <label>Tick Count</label>
                                <span>{activeSession.tickCount}</span>
                            </div>
                        </div>

                        <div className="progress-bars">
                            <div className="progress-item">
                                <label>Take Profit Progress</label>
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill positive"
                                        style={{ width: `${Math.min((activeSession.profitPercentage / takeProfit) * 100, 100)}%` }}
                                    ></div>
                                </div>
                                <span>{Math.min((activeSession.profitPercentage / takeProfit) * 100, 100).toFixed(1)}%</span>
                            </div>
                            
                            <div className="progress-item">
                                <label>Stop Loss Risk</label>
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill negative"
                                        style={{ width: `${Math.min((Math.abs(activeSession.profitPercentage) / stopLoss) * 100, 100)}%` }}
                                    ></div>
                                </div>
                                <span>{Math.min((Math.abs(activeSession.profitPercentage) / stopLoss) * 100, 100).toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Signals Panel */}
                <div className="signals-panel">
                    <h3>📡 Live Accumulator Signals</h3>
                    
                    <div className="signals-grid">
                        {signals.map((signal) => (
                            <div key={signal.id} className={`signal-card ${signal.type.toLowerCase()}`}>
                                <div className="signal-header">
                                    <div className="signal-type">
                                        <span className={`type-badge ${signal.type.toLowerCase()}`}>
                                            {signal.type}
                                        </span>
                                        <span className="market">{signal.market}</span>
                                    </div>
                                    <div className="signal-strength">
                                        <div className="strength-bar">
                                            <div 
                                                className="strength-fill"
                                                style={{ width: `${signal.strength * 10}%` }}
                                            ></div>
                                        </div>
                                        <span>{signal.strength}/10</span>
                                    </div>
                                </div>

                                <div className="signal-details">
                                    <div className="detail-row">
                                        <span className="label">Growth Rate:</span>
                                        <span className="value">{signal.growthRate}%</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">Expected Profit:</span>
                                        <span className={`value ${signal.expectedProfit >= 0 ? 'positive' : 'negative'}`}>
                                            {signal.expectedProfit >= 0 ? '+' : ''}{signal.expectedProfit.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">Risk Level:</span>
                                        <span className={`value risk-${signal.riskLevel.toLowerCase()}`}>
                                            {signal.riskLevel}
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">Confidence:</span>
                                        <span className="value">{signal.confidence}%</span>
                                    </div>
                                </div>

                                <div className="signal-reasoning">
                                    <p>{signal.metadata.reasoning}</p>
                                </div>

                                <div className="signal-actions">
                                    <button className="action-btn primary">
                                        🚀 Start Bot
                                    </button>
                                    <button className="action-btn secondary">
                                        📊 Analyze
                                    </button>
                                </div>

                                <div className="signal-validity">
                                    <span>Valid until: {signal.validUntil.toLocaleTimeString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="stats-section">
                    <div className="section-header">
                        <h3>📈 Market Overview</h3>
                    </div>
                    
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon">🎯</div>
                            <div className="stat-content">
                                <div className="stat-value">
                                    {signals.filter(s => s.type === 'BUY').length}
                                </div>
                                <div className="stat-label">Buy Signals</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon">⚠️</div>
                            <div className="stat-content">
                                <div className="stat-value">
                                    {signals.filter(s => s.riskLevel === 'HIGH').length}
                                </div>
                                <div className="stat-label">High Risk</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon">💰</div>
                            <div className="stat-content">
                                <div className="stat-value">
                                    {signals.length > 0 ? (signals.reduce((sum, s) => sum + s.expectedProfit, 0) / signals.length).toFixed(2) : '0.00'}
                                </div>
                                <div className="stat-label">Avg Expected Profit</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon">🔥</div>
                            <div className="stat-content">
                                <div className="stat-value">
                                    {signals.length > 0 ? Math.round(signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length) : 0}%
                                </div>
                                <div className="stat-label">Avg Confidence</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccumulatorDashboard;