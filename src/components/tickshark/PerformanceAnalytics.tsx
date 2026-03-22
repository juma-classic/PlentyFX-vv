/**
 * TickShark Performance Analytics Component
 * Advanced performance analysis and optimization insights
 */

import React, { useEffect, useState, useCallback } from 'react';
import { analyticsService } from '../../services/tickshark/analytics.service';
import {
  AnalyticsFilter,
  OptimizationInsight,
  PerformanceChart,
  PerformanceMetrics,
  SignalTypeMetrics,
  TIME_RANGE_PRESETS,
  TimeBasedMetrics} from '../../types/tickshark/analytics.types';
import './PerformanceAnalytics.scss';

interface PerformanceAnalyticsProps {
  compact?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onInsightClick?: (insight: OptimizationInsight) => void;
}

export const PerformanceAnalytics: React.FC<PerformanceAnalyticsProps> = ({
  compact = false,
  autoRefresh = true,
  refreshInterval = 30000,
  onInsightClick
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'signals' | 'timing' | 'insights' | 'charts'>('overview');
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [signalMetrics, setSignalMetrics] = useState<SignalTypeMetrics[]>([]);
  const [timeMetrics, setTimeMetrics] = useState<TimeBasedMetrics[]>([]);
  const [insights, setInsights] = useState<OptimizationInsight[]>([]);
  const [charts, setCharts] = useState<PerformanceChart[]>([]);
  const [filter, setFilter] = useState<AnalyticsFilter>({
    timeRange: TIME_RANGE_PRESETS.LAST_24_HOURS(),
    includeSimulation: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊', description: 'Performance summary and key metrics' },
    { id: 'signals', label: 'Signals', icon: '🎯', description: 'Signal type performance breakdown' },
    { id: 'timing', label: 'Timing', icon: '⏰', description: 'Time-based performance analysis' },
    { id: 'insights', label: 'Insights', icon: '💡', description: 'Optimization recommendations' },
    { id: 'charts', label: 'Charts', icon: '📈', description: 'Visual performance analysis' },
  ];

  const timeRangeOptions = [
    { key: 'LAST_HOUR', label: 'Last Hour' },
    { key: 'LAST_24_HOURS', label: 'Last 24 Hours' },
    { key: 'LAST_7_DAYS', label: 'Last 7 Days' },
    { key: 'LAST_30_DAYS', label: 'Last 30 Days' },
    { key: 'ALL_TIME', label: 'All Time' },
  ];

  const loadAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);

      const [
        performanceMetrics,
        signalTypeMetrics,
        timeBasedMetrics,
        optimizationInsights,
        performanceCharts
      ] = await Promise.all([
        Promise.resolve(analyticsService.calculatePerformanceMetrics(filter)),
        Promise.resolve(analyticsService.getSignalTypeMetrics(filter)),
        Promise.resolve(analyticsService.getTimeBasedMetrics(filter)),
        Promise.resolve(analyticsService.generateOptimizationInsights(filter)),
        Promise.resolve(analyticsService.generatePerformanceCharts(filter))
      ]);

      setMetrics(performanceMetrics);
      setSignalMetrics(signalTypeMetrics);
      setTimeMetrics(timeBasedMetrics);
      setInsights(optimizationInsights);
      setCharts(performanceCharts);
      setLastUpdate(Date.now());

    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadAnalytics();

    if (autoRefresh) {
      const interval = setInterval(loadAnalytics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [loadAnalytics, autoRefresh, refreshInterval]);

  const handleTimeRangeChange = (rangeKey: string) => {
    const timeRange = TIME_RANGE_PRESETS[rangeKey]();
    setFilter(prev => ({ ...prev, timeRange }));
  };

  const handleFilterChange = (key: keyof AnalyticsFilter, value: any) => {
    setFilter(prev => ({ ...prev, [key]: value }));
  };

  const formatNumber = (value: number, decimals: number = 2): string => {
    return value.toFixed(decimals);
  };

  const formatCurrency = (value: number): string => {
    return `$${value.toFixed(2)}`;
  };

  const formatPercent = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const getMetricColor = (value: number, thresholds: { good: number; warning: number }): string => {
    if (value >= thresholds.good) return 'good';
    if (value >= thresholds.warning) return 'warning';
    return 'poor';
  };

  const renderMetricCard = (title: string, value: string, change?: string, color?: string) => (
    <div className={`metric-card ${color || ''}`}>
      <div className="metric-header">
        <h5>{title}</h5>
        {change && <span className={`metric-change ${change.startsWith('+') ? 'positive' : 'negative'}`}>{change}</span>}
      </div>
      <div className="metric-value">{value}</div>
    </div>
  );

  if (isLoading && !metrics) {
    return (
      <div className={`performance-analytics ${compact ? 'compact' : ''} loading-state`}>
        <div className="loading-display">
          <div className="loading-spinner"></div>
          <div className="loading-message">Loading performance analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`performance-analytics ${compact ? 'compact' : ''}`}>
      {/* Analytics Header */}
      <div className="analytics-header">
        <div className="header-content">
          <h3 className="section-title">
            <span className="title-icon">📈</span>
            Performance Analytics
          </h3>
          
          <div className="header-controls">
            <div className="time-range-selector">
              <select 
                value={timeRangeOptions.find(opt => opt.label === filter.timeRange.label)?.key || 'LAST_24_HOURS'}
                onChange={(e) => handleTimeRangeChange(e.target.value)}
              >
                {timeRangeOptions.map(option => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-controls">
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={filter.includeSimulation || false}
                  onChange={(e) => handleFilterChange('includeSimulation', e.target.checked)}
                />
                Include Simulation
              </label>
            </div>

            <button className="refresh-button" onClick={loadAnalytics} disabled={isLoading}>
              {isLoading ? '⏳' : '🔄'} Refresh
            </button>
          </div>
        </div>

        {lastUpdate > 0 && (
          <div className="last-update">
            Last updated: {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Analytics Navigation */}
      <div className="analytics-navigation">
        <div className="nav-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id as any)}
              title={tab.description}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Analytics Content */}
      <div className="analytics-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && metrics && (
          <div className="analytics-section">
            <div className="section-header">
              <h4>Performance Overview</h4>
              <p>Key performance metrics and financial summary</p>
            </div>

            <div className="metrics-grid">
              {/* Primary Metrics */}
              <div className="metrics-group primary">
                <h5>Trading Performance</h5>
                <div className="metrics-row">
                  {renderMetricCard(
                    'Win Rate',
                    formatPercent(metrics.winRate),
                    undefined,
                    getMetricColor(metrics.winRate, { good: 60, warning: 45 })
                  )}
                  {renderMetricCard(
                    'Total Trades',
                    metrics.totalTrades.toString(),
                    undefined,
                    'neutral'
                  )}
                  {renderMetricCard(
                    'Net Profit',
                    formatCurrency(metrics.netProfit),
                    undefined,
                    metrics.netProfit > 0 ? 'good' : 'poor'
                  )}
                  {renderMetricCard(
                    'Profit Factor',
                    formatNumber(metrics.profitFactor),
                    undefined,
                    getMetricColor(metrics.profitFactor, { good: 1.5, warning: 1.0 })
                  )}
                </div>
              </div>

              {/* Risk Metrics */}
              <div className="metrics-group risk">
                <h5>Risk Analysis</h5>
                <div className="metrics-row">
                  {renderMetricCard(
                    'Sharpe Ratio',
                    formatNumber(metrics.sharpeRatio),
                    undefined,
                    getMetricColor(metrics.sharpeRatio, { good: 1.5, warning: 1.0 })
                  )}
                  {renderMetricCard(
                    'Max Drawdown',
                    formatCurrency(metrics.maxDrawdown),
                    undefined,
                    'warning'
                  )}
                  {renderMetricCard(
                    'Recovery Factor',
                    formatNumber(metrics.recoveryFactor),
                    undefined,
                    getMetricColor(metrics.recoveryFactor, { good: 2.0, warning: 1.0 })
                  )}
                  {renderMetricCard(
                    'Risk/Reward',
                    formatNumber(metrics.riskRewardRatio),
                    undefined,
                    getMetricColor(metrics.riskRewardRatio, { good: 2.0, warning: 1.0 })
                  )}
                </div>
              </div>

              {/* Signal Metrics */}
              <div className="metrics-group signals">
                <h5>Signal Performance</h5>
                <div className="metrics-row">
                  {renderMetricCard(
                    'Signal Accuracy',
                    formatPercent(metrics.signalAccuracy),
                    undefined,
                    getMetricColor(metrics.signalAccuracy, { good: 70, warning: 50 })
                  )}
                  {renderMetricCard(
                    'Total Signals',
                    metrics.totalSignals.toString(),
                    undefined,
                    'neutral'
                  )}
                  {renderMetricCard(
                    'Executed Signals',
                    metrics.executedSignals.toString(),
                    undefined,
                    'neutral'
                  )}
                  {renderMetricCard(
                    'Execution Rate',
                    formatPercent(metrics.totalSignals > 0 ? (metrics.executedSignals / metrics.totalSignals) * 100 : 0),
                    undefined,
                    'neutral'
                  )}
                </div>
              </div>
            </div>

            {/* Performance Summary */}
            <div className="performance-summary">
              <div className="summary-card">
                <h5>📊 Trading Summary</h5>
                <div className="summary-stats">
                  <div className="stat-item">
                    <span className="stat-label">Winning Trades:</span>
                    <span className="stat-value good">{metrics.winningTrades}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Losing Trades:</span>
                    <span className="stat-value poor">{metrics.losingTrades}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Average Profit:</span>
                    <span className="stat-value good">{formatCurrency(metrics.averageProfit)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Average Loss:</span>
                    <span className="stat-value poor">{formatCurrency(metrics.averageLoss)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Largest Win:</span>
                    <span className="stat-value good">{formatCurrency(metrics.largestWin)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Largest Loss:</span>
                    <span className="stat-value poor">{formatCurrency(metrics.largestLoss)}</span>
                  </div>
                </div>
              </div>

              <div className="summary-card">
                <h5>⏱️ Time Analysis</h5>
                <div className="summary-stats">
                  <div className="stat-item">
                    <span className="stat-label">Total Trading Time:</span>
                    <span className="stat-value">{Math.round(metrics.totalTradingTime / (1000 * 60))} minutes</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Average Trade Duration:</span>
                    <span className="stat-value">{Math.round(metrics.averageTradeDuration / 1000)} seconds</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Expectancy per Trade:</span>
                    <span className={`stat-value ${metrics.expectancy > 0 ? 'good' : 'poor'}`}>
                      {formatCurrency(metrics.expectancy)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Signal Analysis Tab */}
        {activeTab === 'signals' && (
          <div className="analytics-section">
            <div className="section-header">
              <h4>Signal Type Analysis</h4>
              <p>Performance breakdown by signal type</p>
            </div>

            <div className="signal-metrics-grid">
              {signalMetrics.map(signal => (
                <div key={signal.signalType} className="signal-metric-card">
                  <div className="signal-header">
                    <h5>{signal.signalType.replace('_', ' ')}</h5>
                    <span className={`signal-status ${getMetricColor(signal.winRate, { good: 60, warning: 45 })}`}>
                      {formatPercent(signal.winRate)}
                    </span>
                  </div>

                  <div className="signal-stats">
                    <div className="stat-row">
                      <span className="stat-label">Total Signals:</span>
                      <span className="stat-value">{signal.totalSignals}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Executed:</span>
                      <span className="stat-value">{signal.executedSignals}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Winning:</span>
                      <span className="stat-value good">{signal.winningSignals}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Losing:</span>
                      <span className="stat-value poor">{signal.losingSignals}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Total Profit:</span>
                      <span className={`stat-value ${signal.totalProfit > 0 ? 'good' : 'poor'}`}>
                        {formatCurrency(signal.totalProfit)}
                      </span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Avg Confidence:</span>
                      <span className="stat-value">{formatPercent(signal.confidence)}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Avg Risk:</span>
                      <span className="stat-value">{formatPercent(signal.riskScore)}</span>
                    </div>
                  </div>

                  <div className="signal-performance-bar">
                    <div 
                      className="performance-fill"
                      style={{ width: `${signal.winRate}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timing Analysis Tab */}
        {activeTab === 'timing' && (
          <div className="analytics-section">
            <div className="section-header">
              <h4>Time-Based Performance</h4>
              <p>Performance patterns by time of day and day of week</p>
            </div>

            <div className="timing-analysis">
              <div className="time-heatmap">
                <h5>Performance Heatmap</h5>
                <div className="heatmap-grid">
                  {/* Heatmap implementation would go here */}
                  <div className="heatmap-placeholder">
                    📊 Time-based heatmap visualization
                    <br />
                    <small>Shows win rate by hour and day</small>
                  </div>
                </div>
              </div>

              <div className="time-stats">
                <h5>Best Performance Times</h5>
                <div className="time-stats-list">
                  {timeMetrics
                    .sort((a, b) => b.winRate - a.winRate)
                    .slice(0, 5)
                    .map((time) => (
                      <div key={`${time.hourOfDay}-${time.dayOfWeek}`} className="time-stat-item">
                        <div className="time-info">
                          <span className="time-label">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][time.dayOfWeek]} {time.hourOfDay}:00
                          </span>
                          <span className="time-trades">{time.trades} trades</span>
                        </div>
                        <div className="time-metrics">
                          <span className="win-rate good">{formatPercent(time.winRate)}</span>
                          <span className="profit">{formatCurrency(time.profit)}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div className="analytics-section">
            <div className="section-header">
              <h4>Optimization Insights</h4>
              <p>AI-powered recommendations for improving performance</p>
            </div>

            <div className="insights-grid">
              {insights.length === 0 ? (
                <div className="no-insights">
                  <div className="no-insights-icon">💡</div>
                  <h5>No insights available</h5>
                  <p>Continue trading to generate performance insights and recommendations.</p>
                </div>
              ) : (
                insights.map((insight) => (
                  <div 
                    key={`insight-${insight.category}-${insight.title}`} 
                    className={`insight-card ${insight.severity.toLowerCase()} ${insight.impact.toLowerCase()}-impact`}
                    onClick={() => onInsightClick?.(insight)}
                  >
                    <div className="insight-header">
                      <div className="insight-category">
                        <span className="category-icon">
                          {insight.category === 'PERFORMANCE' && '📊'}
                          {insight.category === 'RISK' && '🛡️'}
                          {insight.category === 'TIMING' && '⏰'}
                          {insight.category === 'SIGNAL' && '🎯'}
                          {insight.category === 'STRATEGY' && '🧠'}
                        </span>
                        <span className="category-label">{insight.category}</span>
                      </div>
                      <div className="insight-severity">
                        <span className={`severity-badge ${insight.severity.toLowerCase()}`}>
                          {insight.severity}
                        </span>
                      </div>
                    </div>

                    <div className="insight-content">
                      <h5 className="insight-title">{insight.title}</h5>
                      <p className="insight-description">{insight.description}</p>
                      <div className="insight-recommendation">
                        <strong>💡 Recommendation:</strong> {insight.recommendation}
                      </div>
                    </div>

                    <div className="insight-footer">
                      <div className="insight-impact">
                        <span className="impact-label">Impact:</span>
                        <span className={`impact-value ${insight.impact.toLowerCase()}`}>
                          {insight.impact}
                        </span>
                      </div>
                      <div className="insight-confidence">
                        <span className="confidence-label">Confidence:</span>
                        <span className="confidence-value">
                          {formatPercent(insight.confidence * 100)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Charts Tab */}
        {activeTab === 'charts' && (
          <div className="analytics-section">
            <div className="section-header">
              <h4>Performance Charts</h4>
              <p>Visual analysis of trading performance and trends</p>
            </div>

            <div className="charts-grid">
              {charts.map((chart) => (
                <div key={chart.title} className="chart-container">
                  <div className="chart-header">
                    <h5>{chart.title}</h5>
                  </div>
                  <div className="chart-content">
                    {/* Chart implementation would use a charting library like Chart.js or D3 */}
                    <div className="chart-placeholder">
                      <div className="chart-icon">
                        {chart.type === 'LINE' && '📈'}
                        {chart.type === 'BAR' && '📊'}
                        {chart.type === 'PIE' && '🥧'}
                        {chart.type === 'SCATTER' && '🔵'}
                        {chart.type === 'HEATMAP' && '🌡️'}
                      </div>
                      <div className="chart-info">
                        <strong>{chart.title}</strong>
                        <br />
                        <small>{chart.type} Chart - {chart.data.length} data points</small>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};