/**
 * TickShark Market Analysis Component
 * Real-time market analysis display for the dashboard
 * 
 * CRITICAL: Live analysis visualization with latency arbitrage insights
 * - Real-time analysis results display
 * - Arbitrage opportunity visualization
 * - Market condition indicators
 * - Signal strength meters
 */

import React, { useState, useEffect } from 'react';
import { analysisEngineService } from '../../services/tickshark/analysis-engine.service';
import { signalGeneratorService, AnalysisSignal } from '../../services/tickshark/signal-generator.service';
import { tickListenerService } from '../../services/tickshark/tick-listener.service';
import { AnalysisResult, ArbitrageOpportunity } from '../../types/tickshark/analysis.types';
import './MarketAnalysis.scss';

export interface MarketAnalysisProps {
    symbol?: string;
    autoRefresh?: boolean;
    refreshInterval?: number;
    compact?: boolean;
}

export const MarketAnalysis: React.FC<MarketAnalysisProps> = ({
    symbol = 'R_100',
    autoRefresh = true,
    refreshInterval = 2000,
    compact = false,
}) => {
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [recentSignals, setRecentSignals] = useState<AnalysisSignal[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);

    // Auto-refresh analysis
    useEffect(() => {
        if (!autoRefresh) return;

        const performAnalysis = async () => {
            try {
                setIsAnalyzing(true);
                setError(null);

                // Get recent ticks
                const recentTicks = tickListenerService.getRecentTicks(symbol, 50);
                
                if (recentTicks.length < 10) {
                    setError('Insufficient tick data for analysis');
                    return;
                }

                // Perform analysis
                const result = await analysisEngineService.analyzeTickData(recentTicks);
                setAnalysisResult(result);

                // Generate signals if opportunities exist
                if (result.opportunities.length > 0) {
                    const signals = signalGeneratorService.generateSignals(result);
                    setRecentSignals(signals);
                }

                setLastUpdateTime(Date.now());

            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
                setError(errorMessage);
                console.error('🦈 Market analysis failed:', err);
            } finally {
                setIsAnalyzing(false);
            }
        };

        // Initial analysis
        performAnalysis();

        // Set up interval
        const interval = setInterval(performAnalysis, refreshInterval);

        return () => clearInterval(interval);
    }, [symbol, autoRefresh, refreshInterval]);

    // Manual refresh
    const handleManualRefresh = async () => {
        if (isAnalyzing) return;

        try {
            setIsAnalyzing(true);
            setError(null);

            const recentTicks = tickListenerService.getRecentTicks(symbol, 50);
            const result = await analysisEngineService.analyzeTickData(recentTicks);
            setAnalysisResult(result);

            if (result.opportunities.length > 0) {
                const signals = signalGeneratorService.generateSignals(result);
                setRecentSignals(signals);
            }

            setLastUpdateTime(Date.now());

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
            setError(errorMessage);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Format time ago
    const formatTimeAgo = (timestamp: number) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
    };

    // Format percentage
    const formatPercentage = (value: number) => {
        return `${(value * 100).toFixed(2)}%`;
    };

    // Format currency
    const formatCurrency = (value: number) => {
        return `$${value.toFixed(4)}`;
    };

    // Get risk level color
    const getRiskColor = (riskLevel: string) => {
        switch (riskLevel) {
            case 'LOW': return 'success';
            case 'MEDIUM': return 'warning';
            case 'HIGH': return 'danger';
            case 'EXTREME': return 'critical';
            default: return 'neutral';
        }
    };

    // Get confidence color
    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.8) return 'success';
        if (confidence >= 0.6) return 'warning';
        if (confidence >= 0.4) return 'caution';
        return 'danger';
    };

    // Render opportunity card
    const renderOpportunity = (opportunity: ArbitrageOpportunity) => (
        <div key={opportunity.id} className={`opportunity-card ${opportunity.priority.toLowerCase()}`}>
            <div className="opportunity-header">
                <div className="opportunity-type">
                    <span className="type-icon">⚡</span>
                    <span className="type-name">{opportunity.type.replace('_', ' ')}</span>
                </div>
                <div className={`opportunity-priority priority-${opportunity.priority.toLowerCase()}`}>
                    {opportunity.priority}
                </div>
            </div>

            <div className="opportunity-metrics">
                <div className="metric">
                    <span className="metric-label">Expected Profit</span>
                    <span className="metric-value profit">
                        {formatPercentage(opportunity.expectedProfit)}
                    </span>
                </div>
                <div className="metric">
                    <span className="metric-label">Confidence</span>
                    <span className={`metric-value confidence-${getConfidenceColor(opportunity.confidence)}`}>
                        {formatPercentage(opportunity.confidence)}
                    </span>
                </div>
                <div className="metric">
                    <span className="metric-label">Risk Score</span>
                    <span className={`metric-value risk-${getRiskColor(opportunity.riskScore > 0.7 ? 'HIGH' : opportunity.riskScore > 0.4 ? 'MEDIUM' : 'LOW')}`}>
                        {formatPercentage(opportunity.riskScore)}
                    </span>
                </div>
            </div>

            <div className="opportunity-details">
                <div className="detail-row">
                    <span className="detail-label">Current Price:</span>
                    <span className="detail-value">{formatCurrency(opportunity.currentPrice)}</span>
                </div>
                <div className="detail-row">
                    <span className="detail-label">Predicted Price:</span>
                    <span className="detail-value">{formatCurrency(opportunity.predictedPrice)}</span>
                </div>
                <div className="detail-row">
                    <span className="detail-label">Window:</span>
                    <span className="detail-value">{Math.floor(opportunity.duration / 1000)}s</span>
                </div>
                {opportunity.latencyAdvantage > 0 && (
                    <div className="detail-row">
                        <span className="detail-label">Latency Advantage:</span>
                        <span className="detail-value advantage">{opportunity.latencyAdvantage.toFixed(1)}ms</span>
                    </div>
                )}
            </div>
        </div>
    );

    // Render signal card
    const renderSignal = (signal: AnalysisSignal) => (
        <div key={signal.id} className={`signal-card ${signal.urgency.toLowerCase()}`}>
            <div className="signal-header">
                <div className="signal-type">
                    <span className="type-icon">📊</span>
                    <span className="type-name">{signal.type.replace('_', ' ')}</span>
                </div>
                <div className={`signal-urgency urgency-${signal.urgency.toLowerCase()}`}>
                    {signal.urgency}
                </div>
            </div>

            <div className="signal-metrics">
                <div className="metric">
                    <span className="metric-label">Strength</span>
                    <span className={`metric-value strength-${getConfidenceColor(signal.strength)}`}>
                        {formatPercentage(signal.strength)}
                    </span>
                </div>
                <div className="metric">
                    <span className="metric-label">Confidence</span>
                    <span className={`metric-value confidence-${getConfidenceColor(signal.confidence)}`}>
                        {formatPercentage(signal.confidence)}
                    </span>
                </div>
            </div>

            <div className="signal-recommendation">
                <div className="recommendation-row">
                    <span className="rec-label">Stake:</span>
                    <span className="rec-value">${signal.recommendedStake}</span>
                </div>
                <div className="recommendation-row">
                    <span className="rec-label">Duration:</span>
                    <span className="rec-value">{signal.recommendedDuration}s</span>
                </div>
                {signal.barrier && (
                    <div className="recommendation-row">
                        <span className="rec-label">Barrier:</span>
                        <span className="rec-value">{formatCurrency(signal.barrier)}</span>
                    </div>
                )}
            </div>
        </div>
    );

    if (error) {
        return (
            <div className={`market-analysis ${compact ? 'compact' : ''} error-state`}>
                <div className="analysis-header">
                    <h3 className="section-title">
                        <span className="title-icon">📈</span>
                        Market Analysis - {symbol}
                    </h3>
                    <button className="refresh-btn" onClick={handleManualRefresh} disabled={isAnalyzing}>
                        <span className="btn-icon">🔄</span>
                        Retry
                    </button>
                </div>
                
                <div className="error-display">
                    <div className="error-icon">⚠️</div>
                    <div className="error-message">{error}</div>
                    <div className="error-help">
                        Ensure tick data is available and try refreshing the analysis.
                    </div>
                </div>
            </div>
        );
    }

    if (!analysisResult) {
        return (
            <div className={`market-analysis ${compact ? 'compact' : ''} loading-state`}>
                <div className="analysis-header">
                    <h3 className="section-title">
                        <span className="title-icon">📈</span>
                        Market Analysis - {symbol}
                    </h3>
                </div>
                
                <div className="loading-display">
                    <div className="loading-spinner"></div>
                    <div className="loading-message">Initializing market analysis...</div>
                </div>
            </div>
        );
    }

    return (
        <div className={`market-analysis ${compact ? 'compact' : ''}`}>
            {/* Analysis Header */}
            <div className="analysis-header">
                <h3 className="section-title">
                    <span className="title-icon">📈</span>
                    Market Analysis - {symbol}
                </h3>
                
                <div className="header-controls">
                    <div className="last-update">
                        Last updated: {formatTimeAgo(lastUpdateTime)}
                    </div>
                    <button 
                        className="refresh-btn" 
                        onClick={handleManualRefresh} 
                        disabled={isAnalyzing}
                    >
                        <span className={`btn-icon ${isAnalyzing ? 'spinning' : ''}`}>🔄</span>
                        {isAnalyzing ? 'Analyzing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {/* Market Condition Overview */}
            <div className="market-overview">
                <div className="overview-card">
                    <div className="card-header">
                        <span className="card-icon">🎯</span>
                        <h4>Market Condition</h4>
                    </div>
                    <div className="card-content">
                        <div className="condition-grid">
                            <div className="condition-item">
                                <span className="condition-label">Trend</span>
                                <span className={`condition-value trend-${analysisResult.marketCondition.trend.toLowerCase()}`}>
                                    {analysisResult.marketCondition.trend}
                                </span>
                            </div>
                            <div className="condition-item">
                                <span className="condition-label">Volatility</span>
                                <span className="condition-value">
                                    {formatPercentage(analysisResult.marketCondition.volatility)}
                                </span>
                            </div>
                            <div className="condition-item">
                                <span className="condition-label">Risk Level</span>
                                <span className={`condition-value risk-${getRiskColor(analysisResult.marketCondition.riskLevel)}`}>
                                    {analysisResult.marketCondition.riskLevel}
                                </span>
                            </div>
                            <div className="condition-item">
                                <span className="condition-label">Arbitrage Friendly</span>
                                <span className={`condition-value ${analysisResult.marketCondition.arbitrageFriendly ? 'positive' : 'negative'}`}>
                                    {analysisResult.marketCondition.arbitrageFriendly ? 'Yes' : 'No'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="overview-card">
                    <div className="card-header">
                        <span className="card-icon">⚡</span>
                        <h4>Latency Metrics</h4>
                    </div>
                    <div className="card-content">
                        <div className="latency-grid">
                            <div className="latency-item">
                                <span className="latency-label">Network</span>
                                <span className="latency-value">
                                    {analysisResult.latencyMetrics.networkLatency.toFixed(1)}ms
                                </span>
                            </div>
                            <div className="latency-item">
                                <span className="latency-label">Processing</span>
                                <span className="latency-value">
                                    {analysisResult.latencyMetrics.processingLatency.toFixed(1)}ms
                                </span>
                            </div>
                            <div className="latency-item">
                                <span className="latency-label">Stability</span>
                                <span className={`latency-value stability-${getConfidenceColor(analysisResult.latencyMetrics.stability)}`}>
                                    {formatPercentage(analysisResult.latencyMetrics.stability)}
                                </span>
                            </div>
                            <div className="latency-item">
                                <span className="latency-label">Reliability</span>
                                <span className={`latency-value reliability-${getConfidenceColor(analysisResult.latencyMetrics.reliability)}`}>
                                    {formatPercentage(analysisResult.latencyMetrics.reliability)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Arbitrage Opportunities */}
            <div className="opportunities-section">
                <div className="section-header">
                    <h4 className="section-title">
                        <span className="title-icon">💎</span>
                        Arbitrage Opportunities ({analysisResult.opportunities.length})
                    </h4>
                    {analysisResult.bestOpportunity && (
                        <div className="best-opportunity-indicator">
                            <span className="indicator-icon">⭐</span>
                            Best: {formatPercentage(analysisResult.bestOpportunity.expectedProfit)} profit
                        </div>
                    )}
                </div>

                {analysisResult.opportunities.length > 0 ? (
                    <div className="opportunities-grid">
                        {analysisResult.opportunities.map(renderOpportunity)}
                    </div>
                ) : (
                    <div className="no-opportunities">
                        <div className="no-opportunities-icon">🔍</div>
                        <div className="no-opportunities-message">
                            No arbitrage opportunities detected at this time
                        </div>
                        <div className="no-opportunities-help">
                            Continue monitoring for market conditions to improve
                        </div>
                    </div>
                )}
            </div>

            {/* Generated Signals */}
            {recentSignals.length > 0 && (
                <div className="signals-section">
                    <div className="section-header">
                        <h4 className="section-title">
                            <span className="title-icon">📊</span>
                            Generated Signals ({recentSignals.length})
                        </h4>
                    </div>

                    <div className="signals-grid">
                        {recentSignals.map(renderSignal)}
                    </div>
                </div>
            )}

            {/* Analysis Summary */}
            <div className="analysis-summary">
                <div className="summary-card">
                    <div className="card-header">
                        <span className="card-icon">📋</span>
                        <h4>Analysis Summary</h4>
                    </div>
                    <div className="card-content">
                        <div className="summary-metrics">
                            <div className="summary-metric">
                                <span className="metric-label">Overall Confidence</span>
                                <span className={`metric-value confidence-${getConfidenceColor(analysisResult.confidence)}`}>
                                    {formatPercentage(analysisResult.confidence)}
                                </span>
                            </div>
                            <div className="summary-metric">
                                <span className="metric-label">Overall Risk</span>
                                <span className={`metric-value risk-${getRiskColor(analysisResult.overallRisk > 0.7 ? 'HIGH' : analysisResult.overallRisk > 0.4 ? 'MEDIUM' : 'LOW')}`}>
                                    {formatPercentage(analysisResult.overallRisk)}
                                </span>
                            </div>
                            <div className="summary-metric">
                                <span className="metric-label">Analysis Time</span>
                                <span className="metric-value">
                                    {analysisResult.analysisLatency}ms
                                </span>
                            </div>
                            <div className="summary-metric">
                                <span className="metric-label">Data Points</span>
                                <span className="metric-value">
                                    {analysisResult.dataPoints}
                                </span>
                            </div>
                        </div>

                        {analysisResult.recommendations.length > 0 && (
                            <div className="recommendations">
                                <h5>Recommendations:</h5>
                                <ul className="recommendation-list">
                                    {analysisResult.recommendations.map((rec, index) => (
                                        <li key={index} className="recommendation-item">
                                            {rec}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketAnalysis;