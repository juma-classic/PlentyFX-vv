/**
 * TickShark Advanced Analytics Component
 * Historical performance analysis and strategy optimization
 * 
 * CRITICAL: Advanced analytics with performance insights
 * - Historical session analysis
 * - Performance trend visualization
 * - Strategy comparison tools
 * - Optimization recommendations
 */

import React, { useState, useEffect } from 'react';
import { sessionManagerService } from '../../services/tickshark/session-manager.service';
import { analysisEngineService } from '../../services/tickshark/analysis-engine.service';
import { signalGeneratorService } from '../../services/tickshark/signal-generator.service';
import './AdvancedAnalytics.scss';

export interface AdvancedAnalyticsProps {
    onExport?: (data: any) => void;
    onError?: (error: string) => void;
    compact?: boolean;
}

interface PerformanceMetrics {
    totalSessions: number;
    totalTrades: number;
    totalProfit: number;
    winRate: number;
    averageProfit: number;
    maxDrawdown: number;
    sharpeRatio: number;
    profitFactor: number;
    averageSessionDuration: number;
    bestSession: any;
    worstSession: any;
}

interface TrendData {
    date: string;
    profit: number;
    trades: number;
    winRate: number;
    signals: number;
}

export const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({
    onExport,
    onError,
    compact = false,
}) => {
    const [activeView, setActiveView] = useState<'overview' | 'performance' | 'signals' | 'optimization'>('overview');
    const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
    const [trendData, setTrendData] = useState<TrendData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'1d' | '7d' | '30d' | 'all'>('7d');

    useEffect(() => {
        loadAnalyticsData();
    }, [timeRange]);

    const loadAnalyticsData = async () => {
        try {
            setIsLoading(true);
            
            // Get session statistics
            const sessionStats = sessionManagerService.getSessionStats();
            const analysisStats = analysisEngineService.getStatistics();
            const signalStats = signalGeneratorService.getStatistics();
            
            // Calculate performance metrics
            const metrics = calculatePerformanceMetrics(sessionStats, analysisStats, signalStats);
            setPerformanceMetrics(metrics);
            
            // Generate trend data
            const trends = generateTrendData(sessionStats.history, timeRange);
            setTrendData(trends);
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load analytics data';
            onError?.(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const calculatePerformanceMetrics = (sessionStats: any, analysisStats: any, signalStats: any): PerformanceMetrics => {
        const allSessions = [sessionStats.current, ...sessionStats.history];
        
        const totalTrades = allSessions.reduce((sum, session) => sum + session.trades.total, 0);
        const totalProfit = allSessions.reduce((sum, session) => sum + session.financial.netProfit, 0);
        const totalStake = allSessions.reduce((sum, session) => sum + session.financial.totalStake, 0);
        
        const winningTrades = allSessions.reduce((sum, session) => sum + session.trades.successful, 0);
        const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
        
        const averageProfit = totalTrades > 0 ? totalProfit / totalTrades : 0;
        const maxDrawdown = Math.max(...allSessions.map(s => s.financial.maxDrawdown));
        
        // Calculate Sharpe ratio (simplified)
        const returns = allSessions.map(s => s.financial.netProfit / Math.max(s.financial.totalStake, 1));
        const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const returnStdDev = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
        const sharpeRatio = returnStdDev > 0 ? avgReturn / returnStdDev : 0;
        
        // Calculate profit factor
        const grossProfit = allSessions.reduce((sum, session) => {
            return sum + Math.max(0, session.financial.netProfit);
        }, 0);
        const grossLoss = Math.abs(allSessions.reduce((sum, session) => {
            return sum + Math.min(0, session.financial.netProfit);
        }, 0));
        const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;
        
        const averageSessionDuration = allSessions.reduce((sum, s) => sum + s.duration, 0) / allSessions.length;
        
        const bestSession = allSessions.reduce((best, current) => 
            !best || current.financial.netProfit > best.financial.netProfit ? current : best, null);
        
        const worstSession = allSessions.reduce((worst, current) => 
            !worst || current.financial.netProfit < worst.financial.netProfit ? current : worst, null);

        return {
            totalSessions: allSessions.length,
            totalTrades,
            totalProfit,
            winRate,
            averageProfit,
            maxDrawdown,
            sharpeRatio,
            profitFactor,
            averageSessionDuration,
            bestSession,
            worstSession,
        };
    };

    const generateTrendData = (sessions: any[], range: string): TrendData[] => {
        const now = Date.now();
        const ranges = {
            '1d': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000,
            'all': Infinity
        };
        
        const cutoff = range === 'all' ? 0 : now - ranges[range as keyof typeof ranges];
        const filteredSessions = sessions.filter(s => s.startTime > cutoff);
        
        // Group sessions by day
        const dailyData = new Map<string, any>();
        
        filteredSessions.forEach(session => {
            const date = new Date(session.startTime).toISOString().split('T')[0];
            
            if (!dailyData.has(date)) {
                dailyData.set(date, {
                    date,
                    profit: 0,
                    trades: 0,
                    winningTrades: 0,
                    signals: 0
                });
            }
            
            const dayData = dailyData.get(date)!;
            dayData.profit += session.financial.netProfit;
            dayData.trades += session.trades.total;
            dayData.winningTrades += session.trades.successful;
            dayData.signals += session.performance.signalsGenerated;
        });
        
        return Array.from(dailyData.values()).map(day => ({
            ...day,
            winRate: day.trades > 0 ? (day.winningTrades / day.trades) * 100 : 0
        })).sort((a, b) => a.date.localeCompare(b.date));
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const formatPercentage = (value: number) => {
        return `${value.toFixed(2)}%`;
    };

    const formatDuration = (ms: number) => {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    const exportData = () => {
        const exportData = {
            performanceMetrics,
            trendData,
            exportDate: new Date().toISOString(),
            timeRange
        };
        
        onExport?.(exportData);
        
        // Also download as JSON
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tickshark-analytics-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (isLoading) {
        return (
            <div className={`advanced-analytics ${compact ? 'compact' : ''} loading-state`}>
                <div className="loading-display">
                    <div className="loading-spinner"></div>
                    <div className="loading-message">Loading analytics data...</div>
                </div>
            </div>
        );
    }

    return (
        <div className={`advanced-analytics ${compact ? 'compact' : ''}`}>
            {/* Analytics Header */}
            <div className="analytics-header">
                <h3 className="section-title">
                    <span className="title-icon">📊</span>
                    Advanced Analytics
                </h3>
                
                <div className="header-controls">
                    <div className="time-range-selector">
                        {(['1d', '7d', '30d', 'all'] as const).map((range) => (
                            <button
                                key={range}
                                className={`range-btn ${timeRange === range ? 'active' : ''}`}
                                onClick={() => setTimeRange(range)}
                            >
                                {range === 'all' ? 'All Time' : range.toUpperCase()}
                            </button>
                        ))}
                    </div>
                    
                    <button className="export-btn" onClick={exportData}>
                        <span className="btn-icon">💾</span>
                        Export Data
                    </button>
                </div>
            </div>

            {/* Analytics Navigation */}
            <div className="analytics-navigation">
                <div className="nav-tabs">
                    {[
                        { id: 'overview', label: 'Overview', icon: '📈' },
                        { id: 'performance', label: 'Performance', icon: '🎯' },
                        { id: 'signals', label: 'Signals', icon: '📡' },
                        { id: 'optimization', label: 'Optimization', icon: '⚡' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            className={`nav-tab ${activeView === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveView(tab.id as any)}
                        >
                            <span className="tab-icon">{tab.icon}</span>
                            <span className="tab-label">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Analytics Content */}
            <div className="analytics-content">
                {/* Overview */}
                {activeView === 'overview' && performanceMetrics && (
                    <div className="analytics-section">
                        <div className="metrics-overview">
                            <div className="metrics-grid">
                                <div className="metric-card primary">
                                    <div className="metric-header">
                                        <span className="metric-icon">💰</span>
                                        <h4>Total Profit</h4>
                                    </div>
                                    <div className="metric-value">
                                        <span className={`value ${performanceMetrics.totalProfit >= 0 ? 'positive' : 'negative'}`}>
                                            {formatCurrency(performanceMetrics.totalProfit)}
                                        </span>
                                        <span className="label">Across {performanceMetrics.totalSessions} sessions</span>
                                    </div>
                                </div>

                                <div className="metric-card">
                                    <div className="metric-header">
                                        <span className="metric-icon">🎯</span>
                                        <h4>Win Rate</h4>
                                    </div>
                                    <div className="metric-value">
                                        <span className="value">{formatPercentage(performanceMetrics.winRate)}</span>
                                        <span className="label">{performanceMetrics.totalTrades} total trades</span>
                                    </div>
                                </div>

                                <div className="metric-card">
                                    <div className="metric-header">
                                        <span className="metric-icon">📊</span>
                                        <h4>Profit Factor</h4>
                                    </div>
                                    <div className="metric-value">
                                        <span className="value">{performanceMetrics.profitFactor.toFixed(2)}</span>
                                        <span className="label">Gross profit / Gross loss</span>
                                    </div>
                                </div>

                                <div className="metric-card">
                                    <div className="metric-header">
                                        <span className="metric-icon">📉</span>
                                        <h4>Max Drawdown</h4>
                                    </div>
                                    <div className="metric-value">
                                        <span className="value negative">{formatCurrency(performanceMetrics.maxDrawdown)}</span>
                                        <span className="label">Maximum loss period</span>
                                    </div>
                                </div>

                                <div className="metric-card">
                                    <div className="metric-header">
                                        <span className="metric-icon">⚡</span>
                                        <h4>Sharpe Ratio</h4>
                                    </div>
                                    <div className="metric-value">
                                        <span className="value">{performanceMetrics.sharpeRatio.toFixed(3)}</span>
                                        <span className="label">Risk-adjusted return</span>
                                    </div>
                                </div>

                                <div className="metric-card">
                                    <div className="metric-header">
                                        <span className="metric-icon">⏱️</span>
                                        <h4>Avg Session</h4>
                                    </div>
                                    <div className="metric-value">
                                        <span className="value">{formatDuration(performanceMetrics.averageSessionDuration)}</span>
                                        <span className="label">Average duration</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Performance Trend Chart Placeholder */}
                        <div className="trend-chart">
                            <div className="chart-header">
                                <h4>Performance Trend</h4>
                                <p>Daily profit and trade volume over time</p>
                            </div>
                            <div className="chart-placeholder">
                                <div className="chart-content">
                                    <div className="chart-icon">📈</div>
                                    <h5>Chart Visualization</h5>
                                    <p>Interactive charts will be integrated here</p>
                                    <div className="chart-data-preview">
                                        {trendData.slice(-7).map((day, index) => (
                                            <div key={day.date} className="data-point">
                                                <span className="date">{new Date(day.date).toLocaleDateString()}</span>
                                                <span className={`profit ${day.profit >= 0 ? 'positive' : 'negative'}`}>
                                                    {formatCurrency(day.profit)}
                                                </span>
                                                <span className="trades">{day.trades} trades</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Performance Analysis */}
                {activeView === 'performance' && performanceMetrics && (
                    <div className="analytics-section">
                        <div className="performance-analysis">
                            <div className="analysis-grid">
                                <div className="analysis-card">
                                    <div className="card-header">
                                        <span className="card-icon">🏆</span>
                                        <h4>Best Session</h4>
                                    </div>
                                    {performanceMetrics.bestSession && (
                                        <div className="session-details">
                                            <div className="session-metric">
                                                <span className="metric-label">Profit:</span>
                                                <span className="metric-value positive">
                                                    {formatCurrency(performanceMetrics.bestSession.financial.netProfit)}
                                                </span>
                                            </div>
                                            <div className="session-metric">
                                                <span className="metric-label">Trades:</span>
                                                <span className="metric-value">
                                                    {performanceMetrics.bestSession.trades.total}
                                                </span>
                                            </div>
                                            <div className="session-metric">
                                                <span className="metric-label">Win Rate:</span>
                                                <span className="metric-value">
                                                    {formatPercentage(performanceMetrics.bestSession.financial.winRate)}
                                                </span>
                                            </div>
                                            <div className="session-metric">
                                                <span className="metric-label">Duration:</span>
                                                <span className="metric-value">
                                                    {formatDuration(performanceMetrics.bestSession.duration)}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="analysis-card">
                                    <div className="card-header">
                                        <span className="card-icon">📉</span>
                                        <h4>Worst Session</h4>
                                    </div>
                                    {performanceMetrics.worstSession && (
                                        <div className="session-details">
                                            <div className="session-metric">
                                                <span className="metric-label">Loss:</span>
                                                <span className="metric-value negative">
                                                    {formatCurrency(performanceMetrics.worstSession.financial.netProfit)}
                                                </span>
                                            </div>
                                            <div className="session-metric">
                                                <span className="metric-label">Trades:</span>
                                                <span className="metric-value">
                                                    {performanceMetrics.worstSession.trades.total}
                                                </span>
                                            </div>
                                            <div className="session-metric">
                                                <span className="metric-label">Win Rate:</span>
                                                <span className="metric-value">
                                                    {formatPercentage(performanceMetrics.worstSession.financial.winRate)}
                                                </span>
                                            </div>
                                            <div className="session-metric">
                                                <span className="metric-label">Duration:</span>
                                                <span className="metric-value">
                                                    {formatDuration(performanceMetrics.worstSession.duration)}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="analysis-card">
                                    <div className="card-header">
                                        <span className="card-icon">📊</span>
                                        <h4>Performance Distribution</h4>
                                    </div>
                                    <div className="distribution-chart">
                                        <div className="chart-placeholder">
                                            <div className="placeholder-content">
                                                <div className="placeholder-icon">📊</div>
                                                <h5>Distribution Chart</h5>
                                                <p>Profit/loss distribution visualization</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="analysis-card">
                                    <div className="card-header">
                                        <span className="card-icon">🎯</span>
                                        <h4>Key Insights</h4>
                                    </div>
                                    <div className="insights-list">
                                        <div className="insight-item">
                                            <span className="insight-icon">💡</span>
                                            <span className="insight-text">
                                                {performanceMetrics.winRate > 60 
                                                    ? 'Strong win rate indicates good strategy performance'
                                                    : 'Win rate could be improved with better signal filtering'
                                                }
                                            </span>
                                        </div>
                                        <div className="insight-item">
                                            <span className="insight-icon">📈</span>
                                            <span className="insight-text">
                                                {performanceMetrics.profitFactor > 1.5
                                                    ? 'Excellent profit factor shows profitable strategy'
                                                    : 'Consider optimizing risk management parameters'
                                                }
                                            </span>
                                        </div>
                                        <div className="insight-item">
                                            <span className="insight-icon">⚡</span>
                                            <span className="insight-text">
                                                {performanceMetrics.sharpeRatio > 1
                                                    ? 'Good risk-adjusted returns'
                                                    : 'Focus on reducing volatility while maintaining returns'
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Signal Analysis */}
                {activeView === 'signals' && (
                    <div className="analytics-section">
                        <div className="signal-analysis">
                            <div className="signal-metrics">
                                <h4>Signal Performance Analysis</h4>
                                <p>Detailed analysis of signal generation and success rates</p>
                                
                                <div className="signal-placeholder">
                                    <div className="placeholder-content">
                                        <div className="placeholder-icon">📡</div>
                                        <h5>Signal Analytics Dashboard</h5>
                                        <p>Comprehensive signal performance metrics and analysis</p>
                                        <div className="placeholder-features">
                                            <div className="feature-item">✓ Signal Success Rates</div>
                                            <div className="feature-item">✓ Confidence vs Performance</div>
                                            <div className="feature-item">✓ Signal Type Analysis</div>
                                            <div className="feature-item">✓ Timing Analysis</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Optimization */}
                {activeView === 'optimization' && (
                    <div className="analytics-section">
                        <div className="optimization-analysis">
                            <div className="optimization-recommendations">
                                <h4>Optimization Recommendations</h4>
                                <p>AI-powered suggestions to improve trading performance</p>
                                
                                <div className="recommendations-list">
                                    <div className="recommendation-card">
                                        <div className="recommendation-header">
                                            <span className="rec-icon">🎯</span>
                                            <h5>Signal Filtering</h5>
                                            <span className="rec-impact high">High Impact</span>
                                        </div>
                                        <div className="recommendation-content">
                                            <p>Increase minimum confidence threshold to 75% to improve signal quality</p>
                                            <div className="rec-metrics">
                                                <span className="metric">Expected Win Rate: +8%</span>
                                                <span className="metric">Trade Volume: -15%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="recommendation-card">
                                        <div className="recommendation-header">
                                            <span className="rec-icon">💰</span>
                                            <h5>Risk Management</h5>
                                            <span className="rec-impact medium">Medium Impact</span>
                                        </div>
                                        <div className="recommendation-content">
                                            <p>Reduce maximum stake per trade to $35 to minimize drawdown risk</p>
                                            <div className="rec-metrics">
                                                <span className="metric">Expected Drawdown: -25%</span>
                                                <span className="metric">Profit Impact: -5%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="recommendation-card">
                                        <div className="recommendation-header">
                                            <span className="rec-icon">⏱️</span>
                                            <h5>Timing Optimization</h5>
                                            <span className="rec-impact low">Low Impact</span>
                                        </div>
                                        <div className="recommendation-content">
                                            <p>Increase trade cooldown to 8 seconds to avoid overtrading</p>
                                            <div className="rec-metrics">
                                                <span className="metric">Expected Stability: +12%</span>
                                                <span className="metric">Trade Frequency: -10%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdvancedAnalytics;