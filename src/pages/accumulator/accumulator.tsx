/**
 * Accumulator Trading Page
 * Main page for accumulator analysis and trading
 */

import React, { useState, useEffect } from 'react';
import { AccumulatorDashboard } from '../../components/accumulator/AccumulatorDashboard';
import { accumulatorAnalysisService } from '../../services/accumulator/accumulator-analysis.service';
import { AccumulatorConfig, AccumulatorSignal } from '../../types/accumulator/accumulator.types';
import './accumulator.scss';

const AccumulatorPage: React.FC = () => {
    const [signals, setSignals] = useState<AccumulatorSignal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMarket, setSelectedMarket] = useState('1HZ10V');

    useEffect(() => {
        initializePage();
    }, []);

    const initializePage = async () => {
        try {
            setIsLoading(true);

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
                    strategy: 'TICK_BASED_EXIT',
                };

                const signal = await accumulatorAnalysisService.generateSignal(market, config);
                initialSignals.push(signal);
            }

            setSignals(initialSignals);
        } catch (error) {
            console.error('Failed to initialize accumulator page:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const refreshSignals = async () => {
        await initializePage();
    };

    return (
        <div className='accumulator-page'>
            <div className='page-header'>
                <div className='header-content'>
                    <h1>🎯 Accumulator Trading Center</h1>
                    <p>Advanced tick-based analysis and automated trading for accumulators</p>
                </div>

                <div className='header-actions'>
                    <button className='refresh-btn' onClick={refreshSignals} disabled={isLoading}>
                        {isLoading ? '🔄 Loading...' : '🔄 Refresh Signals'}
                    </button>
                </div>
            </div>

            <div className='page-content'>
                {/* Main Dashboard */}
                <div className='dashboard-section'>
                    <AccumulatorDashboard />
                </div>

                {/* Signals Panel */}
                <div className='signals-section'>
                    <div className='section-header'>
                        <h2>📡 Live Accumulator Signals</h2>
                        <div className='market-selector'>
                            <select value={selectedMarket} onChange={e => setSelectedMarket(e.target.value)}>
                                <option value='1HZ10V'>Volatility 10 (1s)</option>
                                <option value='1HZ25V'>Volatility 25 (1s)</option>
                                <option value='1HZ50V'>Volatility 50 (1s)</option>
                                <option value='1HZ100V'>Volatility 100 (1s)</option>
                                <option value='BOOM300N'>Boom 300</option>
                                <option value='CRASH300N'>Crash 300</option>
                            </select>
                        </div>
                    </div>

                    <div className='signals-grid'>
                        {signals.map(signal => (
                            <div key={signal.id} className={`signal-card ${signal.type.toLowerCase()}`}>
                                <div className='signal-header'>
                                    <div className='signal-type'>
                                        <span className={`type-badge ${signal.type.toLowerCase()}`}>{signal.type}</span>
                                        <span className='market'>{signal.market}</span>
                                    </div>
                                    <div className='signal-strength'>
                                        <div className='strength-bar'>
                                            <div
                                                className='strength-fill'
                                                style={{ width: `${signal.strength * 10}%` }}
                                            ></div>
                                        </div>
                                        <span>{signal.strength}/10</span>
                                    </div>
                                </div>

                                <div className='signal-details'>
                                    <div className='detail-row'>
                                        <span className='label'>Growth Rate:</span>
                                        <span className='value'>{signal.growthRate}%</span>
                                    </div>
                                    <div className='detail-row'>
                                        <span className='label'>Expected Profit:</span>
                                        <span
                                            className={`value ${signal.expectedProfit >= 0 ? 'positive' : 'negative'}`}
                                        >
                                            {signal.expectedProfit >= 0 ? '+' : ''}
                                            {signal.expectedProfit.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className='detail-row'>
                                        <span className='label'>Risk Level:</span>
                                        <span className={`value risk-${signal.riskLevel.toLowerCase()}`}>
                                            {signal.riskLevel}
                                        </span>
                                    </div>
                                    <div className='detail-row'>
                                        <span className='label'>Confidence:</span>
                                        <span className='value'>{signal.confidence}%</span>
                                    </div>
                                </div>

                                <div className='signal-reasoning'>
                                    <p>{signal.metadata.reasoning}</p>
                                </div>

                                <div className='signal-actions'>
                                    <button className='action-btn primary'>🚀 Start Bot</button>
                                    <button className='action-btn secondary'>📊 Analyze</button>
                                </div>

                                <div className='signal-validity'>
                                    <span>Valid until: {signal.validUntil.toLocaleTimeString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Stats */}
                <div className='stats-section'>
                    <div className='section-header'>
                        <h2>📈 Market Overview</h2>
                    </div>

                    <div className='stats-grid'>
                        <div className='stat-card'>
                            <div className='stat-icon'>🎯</div>
                            <div className='stat-content'>
                                <div className='stat-value'>{signals.filter(s => s.type === 'BUY').length}</div>
                                <div className='stat-label'>Buy Signals</div>
                            </div>
                        </div>

                        <div className='stat-card'>
                            <div className='stat-icon'>⚠️</div>
                            <div className='stat-content'>
                                <div className='stat-value'>{signals.filter(s => s.riskLevel === 'HIGH').length}</div>
                                <div className='stat-label'>High Risk</div>
                            </div>
                        </div>

                        <div className='stat-card'>
                            <div className='stat-icon'>💰</div>
                            <div className='stat-content'>
                                <div className='stat-value'>
                                    {(signals.reduce((sum, s) => sum + s.expectedProfit, 0) / signals.length).toFixed(
                                        2
                                    )}
                                </div>
                                <div className='stat-label'>Avg Expected Profit</div>
                            </div>
                        </div>

                        <div className='stat-card'>
                            <div className='stat-icon'>🔥</div>
                            <div className='stat-content'>
                                <div className='stat-value'>
                                    {Math.round(signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length)}%
                                </div>
                                <div className='stat-label'>Avg Confidence</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccumulatorPage;
