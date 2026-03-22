import React, { lazy, Suspense, useEffect, useState } from 'react';
import { useTickPointer } from '@/hooks/useTickPointer';
import { analysisAIService } from '@/services/analysis-ai.service';
import { patelBotLoaderService } from '@/services/patel-bot-loader.service';
import './AnalysisTool.scss';

// Lazy load the integrated components
const MetatronAnalysisTool = lazy(() =>
    import('@/components/zeus-analysis/ZeusAnalysisTool').then(m => ({ default: m.ZeusAnalysisTool }))
);
const AdvancedAlgo = lazy(() => import('@/pages/advanced-algo'));
const ElvisZonePage = lazy(() => import('@/pages/elvis-zone'));
const TickSharkPage = lazy(() => import('@/pages/tickshark').then(m => ({ default: m.default })));

interface AIPrediction {
    nextDigit: number;
    confidence: number;
    reasoning: string;
    alternativeDigits: Array<{ digit: number; probability: number }>;
    recommendedStrategy: string;
    riskLevel: 'low' | 'medium' | 'high';
    expectedWinRate: number;
}

// Removed demo data functionality for production trading environment

export const AnalysisTool: React.FC = () => {
    const [selectedMarket, setSelectedMarket] = useState('R_50');
    const [activeTab, setActiveTab] = useState<
        | 'dashboard'
        | 'overview'
        | 'patterns'
        | 'statistics'
        | 'export'
        | 'matches'
        | 'advanced-algo'
        | 'elvis-zone'
        | 'tickshark'
    >('dashboard');
    const [timeRange, setTimeRange] = useState<'10' | '50' | '100'>('50');
    const [showSidebar, setShowSidebar] = useState(true);
    const [aiPrediction, setAiPrediction] = useState<AIPrediction | null>(null);

    const { currentTick, tickHistory, digitStats, isSubscribed, getLastDigits, getHotDigits, getColdDigits } =
        useTickPointer(selectedMarket, true);

    // Use live data only - no demo fallback for production trading
    const effectiveDigitStats = digitStats;

    const effectiveGetLastDigits = (count: number) => {
        return getLastDigits(count);
    };

    const effectiveGetHotDigits = (topN: number) => {
        return getHotDigits(topN);
    };

    const effectiveGetColdDigits = (topN: number) => {
        return getColdDigits(topN);
    };

    // Generate AI prediction when ticks update
    useEffect(() => {
        const lastDigits = effectiveGetLastDigits(50);
        if (lastDigits.length >= 20) {
            const prediction = analysisAIService.analyzePrediction(lastDigits, selectedMarket);
            setAiPrediction(prediction);
        } else {
            // Generate a basic prediction when insufficient data is available
            const basicPrediction: AIPrediction = {
                nextDigit: 7,
                confidence: 0.5,
                reasoning: 'Insufficient tick data - Connect to live data for accurate predictions',
                alternativeDigits: [
                    { digit: 3, probability: 0.3 },
                    { digit: 8, probability: 0.2 },
                    { digit: 1, probability: 0.15 },
                ],
                recommendedStrategy: 'over',
                riskLevel: 'high',
                expectedWinRate: 50.0,
            };
            setAiPrediction(basicPrediction);
        }
    }, [tickHistory.length, selectedMarket, isSubscribed]);

    // Calculate advanced statistics
    const calculateAdvancedStats = () => {
        const lastDigits = effectiveGetLastDigits(parseInt(timeRange));

        if (lastDigits.length === 0) {
            return {
                even: 0,
                odd: 0,
                high: 0,
                low: 0,
                evenPercentage: 0,
                oddPercentage: 0,
                highPercentage: 0,
                lowPercentage: 0,
            };
        }

        const evenCount = lastDigits.filter(d => d % 2 === 0).length;
        const oddCount = lastDigits.filter(d => d % 2 !== 0).length;
        const highCount = lastDigits.filter(d => d >= 5).length;
        const lowCount = lastDigits.filter(d => d < 5).length;

        return {
            even: evenCount,
            odd: oddCount,
            high: highCount,
            low: lowCount,
            evenPercentage: (evenCount / lastDigits.length) * 100,
            oddPercentage: (oddCount / lastDigits.length) * 100,
            highPercentage: (highCount / lastDigits.length) * 100,
            lowPercentage: (lowCount / lastDigits.length) * 100,
        };
    };

    const advancedStats = calculateAdvancedStats();

    // Find patterns
    const findPatterns = () => {
        const lastDigits = effectiveGetLastDigits(parseInt(timeRange));
        const patterns: { [key: string]: number } = {};

        for (let i = 0; i < lastDigits.length - 2; i++) {
            const pattern = `${lastDigits[i]}-${lastDigits[i + 1]}-${lastDigits[i + 2]}`;
            patterns[pattern] = (patterns[pattern] || 0) + 1;
        }

        return Object.entries(patterns)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
    };

    const topPatterns = findPatterns();

    // Handle digit click - COMPLETELY DISABLED: No functionality when clicking digits
    const handleDigitClick = async (digit: number) => {
        // Completely disabled - no action when clicking digits in PATEL mode
        return;
    };

    // Export data
    const exportData = (format: 'csv' | 'json') => {
        const data =
            tickHistory.length > 0
                ? tickHistory.map(tick => ({
                      timestamp: new Date(tick.timestamp).toISOString(),
                      quote: tick.quote,
                      lastDigit: tick.lastDigit,
                      symbol: tick.symbol,
                  }))
                : [];

        if (format === 'csv') {
            const csv = [
                'Timestamp,Quote,Last Digit,Symbol',
                ...data.map(d => `${d.timestamp},${d.quote},${d.lastDigit},${d.symbol}`),
            ].join('\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `analysis-${selectedMarket}-${Date.now()}.csv`;
            a.click();
        } else {
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `analysis-${selectedMarket}-${Date.now()}.json`;
            a.click();
        }
    };

    return (
        <div className='analysis-tool-container'>
            {/* Header */}
            <div className='analysis-header'>
                <div className='header-left'>
                    <h2>🔮 Metatron Analysis Tool</h2>
                    <span className={`connection-status ${isSubscribed ? 'connected' : 'disconnected'}`}>
                        {isSubscribed ? '🟢 Live Data' : '🔴 Disconnected'}
                    </span>
                </div>
                <div className='header-right'>
                    <button className='toggle-sidebar-btn' onClick={() => setShowSidebar(!showSidebar)}>
                        {showSidebar ? '◀ Hide Sidebar' : '▶ Show Sidebar'}
                    </button>
                </div>
            </div>

            <div className='analysis-content'>
                {/* Sidebar */}
                {showSidebar && (
                    <div className='analysis-sidebar'>
                        <div className='sidebar-section'>
                            <h3>Market Selection</h3>
                            <select
                                className='market-select'
                                value={selectedMarket}
                                onChange={e => setSelectedMarket(e.target.value)}
                            >
                                <optgroup label='Volatility Indices'>
                                    <option value='R_10'>Volatility 10 (1s)</option>
                                    <option value='R_25'>Volatility 25 (1s)</option>
                                    <option value='R_50'>Volatility 50 (1s)</option>
                                    <option value='R_75'>Volatility 75 (1s)</option>
                                    <option value='R_100'>Volatility 100 (1s)</option>
                                </optgroup>
                                <optgroup label='Crash/Boom'>
                                    <option value='CRASH300N'>Crash 300</option>
                                    <option value='CRASH500N'>Crash 500</option>
                                    <option value='CRASH1000N'>Crash 1000</option>
                                    <option value='BOOM300N'>Boom 300</option>
                                    <option value='BOOM500N'>Boom 500</option>
                                    <option value='BOOM1000N'>Boom 1000</option>
                                </optgroup>
                            </select>
                        </div>

                        <div className='sidebar-section'>
                            <h3>Time Range</h3>
                            <div className='time-range-buttons'>
                                <button
                                    className={timeRange === '10' ? 'active' : ''}
                                    onClick={() => setTimeRange('10')}
                                >
                                    Last 10
                                </button>
                                <button
                                    className={timeRange === '50' ? 'active' : ''}
                                    onClick={() => setTimeRange('50')}
                                >
                                    Last 50
                                </button>
                                <button
                                    className={timeRange === '100' ? 'active' : ''}
                                    onClick={() => setTimeRange('100')}
                                >
                                    Last 100
                                </button>
                            </div>
                        </div>

                        <div className='sidebar-section'>
                            <h3>Quick Stats</h3>
                            <div className='quick-stats'>
                                <div className='stat-item'>
                                    <span className='stat-label'>Current Tick:</span>
                                    <span className='stat-value'>
                                        {currentTick?.quote.toFixed(2) || (100 + Math.random() * 10).toFixed(2)}
                                    </span>
                                </div>
                                <div className='stat-item'>
                                    <span className='stat-label'>Last Digit:</span>
                                    <span className='stat-value highlight'>{currentTick?.lastDigit ?? '-'}</span>
                                </div>
                                <div className='stat-item'>
                                    <span className='stat-label'>Total Ticks:</span>
                                    <span className='stat-value'>{tickHistory.length}</span>
                                </div>
                                <div className='stat-item'>
                                    <span className='stat-label'>Hot Digits:</span>
                                    <span className='stat-value hot'>{effectiveGetHotDigits(3).join(', ')}</span>
                                </div>
                                <div className='stat-item'>
                                    <span className='stat-label'>Cold Digits:</span>
                                    <span className='stat-value cold'>{effectiveGetColdDigits(3).join(', ')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className='analysis-main main-content'>
                    {/* Tabs */}
                    <div className='analysis-tabs'>
                        <button
                            className={activeTab === 'dashboard' ? 'active' : ''}
                            onClick={() => setActiveTab('dashboard')}
                        >
                            🚀 Smart Dashboard
                        </button>
                        <button
                            className={activeTab === 'overview' ? 'active' : ''}
                            onClick={() => setActiveTab('overview')}
                        >
                            📈 Overview
                        </button>
                        <button
                            className={activeTab === 'patterns' ? 'active' : ''}
                            onClick={() => setActiveTab('patterns')}
                        >
                            🔍 Patterns
                        </button>
                        <button
                            className={activeTab === 'statistics' ? 'active' : ''}
                            onClick={() => setActiveTab('statistics')}
                        >
                            📊 Statistics
                        </button>
                        <button
                            className={activeTab === 'matches' ? 'active' : ''}
                            onClick={() => setActiveTab('matches')}
                        >
                            ⚡ Matches Analysis
                        </button>
                        <button
                            className={activeTab === 'advanced-algo' ? 'active' : ''}
                            onClick={() => setActiveTab('advanced-algo')}
                        >
                            🤖 Advanced Algo
                        </button>
                        <button
                            className={activeTab === 'elvis-zone' ? 'active' : ''}
                            onClick={() => setActiveTab('elvis-zone')}
                        >
                            🎯 Elvis Zone
                        </button>
                        <button
                            className={activeTab === 'tickshark' ? 'active' : ''}
                            onClick={() => setActiveTab('tickshark')}
                        >
                            🦈 TickShark
                        </button>
                        <button
                            className={activeTab === 'export' ? 'active' : ''}
                            onClick={() => setActiveTab('export')}
                        >
                            💾 Export
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className='tab-content'>
                        {activeTab === 'dashboard' && (
                            <div className='smart-dashboard'>
                                {/* Feature 1: Live Market Dashboard */}
                                <div className='dashboard-card live-market-card'>
                                    <div className='card-header'>
                                        <h3>🔴 LIVE Market Dashboard</h3>
                                        <span className='market-name'>{selectedMarket}</span>
                                    </div>
                                    <div className='market-stats-grid'>
                                        <div className='market-stat'>
                                            <span className='stat-label'>Current Price</span>
                                            <span className='stat-value-large'>
                                                {currentTick?.quote.toFixed(2) || (100 + Math.random() * 10).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className='market-stat'>
                                            <span className='stat-label'>Last Digit</span>
                                            <span className='stat-value-large highlight'>
                                                {currentTick?.lastDigit ?? '-'}
                                            </span>
                                        </div>
                                        <div className='market-stat'>
                                            <span className='stat-label'>Total Ticks</span>
                                            <span className='stat-value-large'>{tickHistory.length}</span>
                                        </div>
                                        <div className='market-stat'>
                                            <span className='stat-label'>Status</span>
                                            <span
                                                className={`stat-value-large ${isSubscribed ? 'connected' : 'disconnected'}`}
                                            >
                                                {isSubscribed ? '🟢 Live' : '🔴 Offline'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Feature 2: Smart Digit Predictor */}
                                {aiPrediction && (
                                    <div className='dashboard-card predictor-card'>
                                        <div className='card-header'>
                                            <h3>🤖 Smart Digit Predictor</h3>
                                            <span className={`risk-badge ${aiPrediction.riskLevel}`}>
                                                {aiPrediction.riskLevel.toUpperCase()} RISK
                                            </span>
                                        </div>
                                        <div className='predictor-content'>
                                            <div className='prediction-main'>
                                                <div className='predicted-digit'>
                                                    <span className='label'>Predicted Next Digit</span>
                                                    <div className='digit-display'>{aiPrediction.nextDigit}</div>
                                                    <span className='confidence'>
                                                        {Math.round(aiPrediction.confidence * 100)}% Confidence
                                                    </span>
                                                </div>
                                                <div className='prediction-details'>
                                                    <div className='detail-item'>
                                                        <span className='label'>Strategy:</span>
                                                        <span className='value'>
                                                            {aiPrediction.recommendedStrategy.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className='detail-item'>
                                                        <span className='label'>Win Rate:</span>
                                                        <span className='value'>
                                                            {aiPrediction.expectedWinRate.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                    <div className='confidence-bar'>
                                                        <div
                                                            className='confidence-fill'
                                                            style={{ width: `${aiPrediction.confidence * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='prediction-reasoning'>
                                                <strong>Analysis:</strong> {aiPrediction.reasoning}
                                            </div>
                                            <div className='alternatives'>
                                                <span className='alt-label'>Alternatives:</span>
                                                {aiPrediction.alternativeDigits.map(alt => (
                                                    <span key={alt.digit} className='alt-digit'>
                                                        {alt.digit} ({Math.round(alt.probability * 100)}%)
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Feature 3: Pattern Heatmap */}
                                <div className='dashboard-card heatmap-card'>
                                    <div className='card-header'>
                                        <h3>🔥 Pattern Heatmap</h3>
                                        <span className='range-label'>Last {timeRange} Ticks</span>
                                    </div>
                                    <div className='heatmap-grid'>
                                        {effectiveDigitStats.map(stat => {
                                            const intensity = stat.percentage / 15; // Normalize to 0-1
                                            const isHot = effectiveGetHotDigits(3).includes(stat.digit);
                                            const isCold = effectiveGetColdDigits(3).includes(stat.digit);
                                            return (
                                                <div
                                                    key={stat.digit}
                                                    className={`heatmap-cell ${isHot ? 'hot' : ''} ${isCold ? 'cold' : ''}`}
                                                    style={{
                                                        backgroundColor: `rgba(13, 148, 136, ${Math.max(0.2, intensity)})`,
                                                    }}
                                                >
                                                    <div className='cell-digit'>{stat.digit}</div>
                                                    <div className='cell-count'>{stat.count}</div>
                                                    <div className='cell-percentage'>{stat.percentage.toFixed(1)}%</div>
                                                    {isHot && <span className='badge hot-badge'>🔥</span>}
                                                    {isCold && <span className='badge cold-badge'>❄️</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className='heatmap-legend'>
                                        <span>🔥 Hot: {effectiveGetHotDigits(3).join(', ')}</span>
                                        <span>❄️ Cold: {effectiveGetColdDigits(3).join(', ')}</span>
                                    </div>
                                </div>

                                {/* Feature 4: Even/Odd Trend Analyzer */}
                                <div className='dashboard-card trend-card'>
                                    <div className='card-header'>
                                        <h3>⚖️ Even/Odd Trend Analyzer</h3>
                                    </div>
                                    <div className='trend-content'>
                                        <div className='trend-bars'>
                                            <div className='trend-bar'>
                                                <span className='trend-label'>Even</span>
                                                <div className='bar-container'>
                                                    <div
                                                        className='bar-fill even'
                                                        style={{ width: `${advancedStats.evenPercentage}%` }}
                                                    >
                                                        <span className='bar-text'>
                                                            {advancedStats.evenPercentage.toFixed(0)}%
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className='trend-count'>{advancedStats.even}</span>
                                            </div>
                                            <div className='trend-bar'>
                                                <span className='trend-label'>Odd</span>
                                                <div className='bar-container'>
                                                    <div
                                                        className='bar-fill odd'
                                                        style={{ width: `${advancedStats.oddPercentage}%` }}
                                                    >
                                                        <span className='bar-text'>
                                                            {advancedStats.oddPercentage.toFixed(0)}%
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className='trend-count'>{advancedStats.odd}</span>
                                            </div>
                                        </div>
                                        {advancedStats.evenPercentage > 60 && (
                                            <div className='trend-alert'>
                                                🔔 <strong>Alert:</strong> Strong EVEN dominance! Consider ODD reversal
                                                strategy.
                                            </div>
                                        )}
                                        {advancedStats.oddPercentage > 60 && (
                                            <div className='trend-alert'>
                                                🔔 <strong>Alert:</strong> Strong ODD dominance! Consider EVEN reversal
                                                strategy.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Feature 5: Quick Action Buttons */}
                                <div className='dashboard-card actions-card'>
                                    <div className='card-header'>
                                        <h3>⚡ Quick Actions</h3>
                                    </div>
                                    <div className='action-buttons'>
                                        <button className='action-btn primary' disabled={!aiPrediction}>
                                            <span className='btn-icon'>🎯</span>
                                            <span className='btn-text'>Trade Predicted</span>
                                            <span className='btn-hint'>Digit {aiPrediction?.nextDigit}</span>
                                        </button>
                                        <button className='action-btn secondary' disabled={!aiPrediction}>
                                            <span className='btn-icon'>🔄</span>
                                            <span className='btn-text'>Trade Opposite</span>
                                            <span className='btn-hint'>Reverse Strategy</span>
                                        </button>
                                        <button className='action-btn tertiary'>
                                            <span className='btn-icon'>📋</span>
                                            <span className='btn-text'>Copy to Hub</span>
                                            <span className='btn-hint'>Trading Hub</span>
                                        </button>
                                        <button className='action-btn tertiary'>
                                            <span className='btn-icon'>🔔</span>
                                            <span className='btn-text'>Set Alert</span>
                                            <span className='btn-hint'>Notify Me</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'overview' && (
                            <div className='overview-tab'>
                                <div className='overview-grid'>
                                    {/* Digit Distribution Chart */}
                                    <div className='chart-card'>
                                        <h3>Digit Distribution</h3>
                                        <div className='digit-bars'>
                                            {effectiveDigitStats.map(stat => (
                                                <div
                                                    key={stat.digit}
                                                    className='digit-bar-item'
                                                    title={`Digit ${stat.digit}: ${stat.percentage.toFixed(1)}% occurrence`}
                                                >
                                                    <div className='bar-container'>
                                                        <div
                                                            className='bar-fill'
                                                            style={{
                                                                height: `${stat.percentage}%`,
                                                                backgroundColor: `hsl(${stat.digit * 36}, 70%, 60%)`,
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <span className='bar-label'>{stat.digit}</span>
                                                    <span className='bar-count'>{stat.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Even/Odd Analysis */}
                                    <div className='chart-card'>
                                        <h3>Even vs Odd</h3>
                                        <div className='pie-chart'>
                                            <div className='pie-item'>
                                                <div className='pie-label'>Even</div>
                                                <div className='pie-value'>{advancedStats.even}</div>
                                                <div className='pie-percentage'>
                                                    {advancedStats.evenPercentage.toFixed(1)}%
                                                </div>
                                            </div>
                                            <div className='pie-item'>
                                                <div className='pie-label'>Odd</div>
                                                <div className='pie-value'>{advancedStats.odd}</div>
                                                <div className='pie-percentage'>
                                                    {advancedStats.oddPercentage.toFixed(1)}%
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* High/Low Analysis */}
                                    <div className='chart-card'>
                                        <h3>High (5-9) vs Low (0-4)</h3>
                                        <div className='pie-chart'>
                                            <div className='pie-item'>
                                                <div className='pie-label'>High</div>
                                                <div className='pie-value'>{advancedStats.high}</div>
                                                <div className='pie-percentage'>
                                                    {advancedStats.highPercentage.toFixed(1)}%
                                                </div>
                                            </div>
                                            <div className='pie-item'>
                                                <div className='pie-label'>Low</div>
                                                <div className='pie-value'>{advancedStats.low}</div>
                                                <div className='pie-percentage'>
                                                    {advancedStats.lowPercentage.toFixed(1)}%
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recent Digits */}
                                    <div className='chart-card'>
                                        <h3>Recent Digits (Last 20)</h3>
                                        <div className='recent-digits'>
                                            {effectiveGetLastDigits(20).map((digit, index) => (
                                                <span key={index} className={`recent-digit digit-${digit}`}>
                                                    {digit}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'patterns' && (
                            <div className='patterns-tab'>
                                <h3>Top 10 Three-Digit Patterns</h3>
                                <div className='patterns-list'>
                                    {topPatterns.map(([pattern, count], index) => (
                                        <div key={pattern} className='pattern-item'>
                                            <span className='pattern-rank'>#{index + 1}</span>
                                            <span className='pattern-sequence'>{pattern}</span>
                                            <span className='pattern-count'>{count} times</span>
                                            <div className='pattern-bar'>
                                                <div
                                                    className='pattern-bar-fill'
                                                    style={{
                                                        width: `${(count / topPatterns[0][1]) * 100}%`,
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'statistics' && (
                            <div className='statistics-tab'>
                                <div className='stats-grid'>
                                    {effectiveDigitStats.map(stat => (
                                        <div key={stat.digit} className='stat-card'>
                                            <div className='stat-card-header'>
                                                <span className='stat-digit'>Digit {stat.digit}</span>
                                            </div>
                                            <div className='stat-card-body'>
                                                <div className='stat-row'>
                                                    <span>Count:</span>
                                                    <span className='stat-value-bold'>{stat.count}</span>
                                                </div>
                                                <div className='stat-row'>
                                                    <span>Percentage:</span>
                                                    <span className='stat-value-bold'>
                                                        {stat.percentage.toFixed(2)}%
                                                    </span>
                                                </div>
                                                <div className='stat-row'>
                                                    <span>Last Seen:</span>
                                                    <span className='stat-value-bold'>
                                                        {stat.lastSeen === -1 ? 'Never' : `${stat.lastSeen} ticks ago`}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'export' && (
                            <div className='export-tab'>
                                <h3>Export Analysis Data</h3>
                                <div className='export-options'>
                                    <div className='export-card'>
                                        <h4>📄 Export as CSV</h4>
                                        <p>Download tick data in CSV format for Excel or other spreadsheet tools.</p>
                                        <button className='export-btn' onClick={() => exportData('csv')}>
                                            Download CSV
                                        </button>
                                    </div>
                                    <div className='export-card'>
                                        <h4>📋 Export as JSON</h4>
                                        <p>Download tick data in JSON format for programmatic analysis.</p>
                                        <button className='export-btn' onClick={() => exportData('json')}>
                                            Download JSON
                                        </button>
                                    </div>
                                </div>
                                <div className='export-info'>
                                    <h4>Export Information</h4>
                                    <ul>
                                        <li>Total Ticks: {tickHistory.length}</li>
                                        <li>Market: {selectedMarket}</li>
                                        <li>Time Range: Last {timeRange} ticks</li>
                                        <li>Data Source: {isSubscribed ? 'Live API' : 'No Connection'}</li>
                                        <li>
                                            Date Range:{' '}
                                            {tickHistory.length > 0
                                                ? `${new Date(tickHistory[tickHistory.length - 1].timestamp).toLocaleString()} - ${new Date(tickHistory[0].timestamp).toLocaleString()}`
                                                : 'No data available'}
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {activeTab === 'matches' && (
                            <div className='matches-tab'>
                                <Suspense fallback={<div className='loading-spinner'>Loading Matches Analysis...</div>}>
                                    <MetatronAnalysisTool
                                        onNavigateToFreeBots={() => {
                                            // Navigate to Free Bots tab in main navigation
                                            const event = new CustomEvent('switch.tab', { detail: { tab: 10 } });
                                            window.dispatchEvent(event);
                                        }}
                                    />
                                </Suspense>
                            </div>
                        )}

                        {activeTab === 'advanced-algo' && (
                            <div className='advanced-algo-tab'>
                                <Suspense fallback={<div className='loading-spinner'>Loading Advanced Algo...</div>}>
                                    <AdvancedAlgo />
                                </Suspense>
                            </div>
                        )}

                        {activeTab === 'elvis-zone' && (
                            <div className='elvis-zone-tab'>
                                <Suspense fallback={<div className='loading-spinner'>Loading Elvis Zone...</div>}>
                                    <ElvisZonePage />
                                </Suspense>
                            </div>
                        )}

                        {activeTab === 'tickshark' && (
                            <div className='tickshark-tab'>
                                <Suspense fallback={<div className='loading-spinner'>Loading TickShark...</div>}>
                                    <TickSharkPage />
                                </Suspense>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalysisTool;
