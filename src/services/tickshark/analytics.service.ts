/**
 * TickShark Analytics Service
 * Performance analysis, historical metrics, and optimization insights
 */

import {
  PerformanceMetrics,
  SignalTypeMetrics,
  TimeBasedMetrics,
  StrategyPerformance,
  RiskMetrics,
  PerformanceChart,
  AnalyticsFilter,
  OptimizationInsight,
  PerformanceComparison,
  MarketConditionCorrelation,
  LatencyImpactAnalysis,
  OpportunityConversionMetrics,
  PerformanceTrend,
  AnalyticsReport,
  TimeRange,
  TIME_RANGE_PRESETS,
  DEFAULT_CHART_OPTIONS,
  SignalType
} from '../../types/tickshark/analytics.types';

interface TradeRecord {
  id: string;
  timestamp: number;
  signalType: SignalType;
  confidence: number;
  risk: number;
  stake: number;
  profit: number;
  duration: number;
  latency: number;
  marketCondition: string;
  isWin: boolean;
  isSimulation: boolean;
}

interface SignalRecord {
  id: string;
  timestamp: number;
  signalType: SignalType;
  confidence: number;
  risk: number;
  strength: number;
  executed: boolean;
  executionLatency?: number;
  profit?: number;
}

class AnalyticsService {
  private tradeHistory: TradeRecord[] = [];
  private signalHistory: SignalRecord[] = [];
  private performanceCache: Map<string, any> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.loadHistoricalData();
  }

  /**
   * Calculate comprehensive performance metrics
   */
  calculatePerformanceMetrics(filter?: AnalyticsFilter): PerformanceMetrics {
    const cacheKey = `performance_${JSON.stringify(filter)}`;
    const cached = this.getCachedResult(cacheKey);
    if (cached) return cached;

    const trades = this.filterTrades(filter);
    const signals = this.filterSignals(filter);

    if (trades.length === 0) {
      return this.getEmptyMetrics();
    }

    const winningTrades = trades.filter(t => t.isWin);
    const losingTrades = trades.filter(t => !t.isWin);
    
    const totalProfit = trades.reduce((sum, t) => sum + Math.max(0, t.profit), 0);
    const totalLoss = Math.abs(trades.reduce((sum, t) => sum + Math.min(0, t.profit), 0));
    const netProfit = trades.reduce((sum, t) => sum + t.profit, 0);

    const executedSignals = signals.filter(s => s.executed);
    const accurateSignals = executedSignals.filter(s => s.profit && s.profit > 0);

    const metrics: PerformanceMetrics = {
      // Trade Statistics
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0,

      // Financial Metrics
      totalProfit,
      totalLoss,
      netProfit,
      averageProfit: winningTrades.length > 0 ? totalProfit / winningTrades.length : 0,
      averageLoss: losingTrades.length > 0 ? totalLoss / losingTrades.length : 0,
      largestWin: Math.max(...trades.map(t => t.profit), 0),
      largestLoss: Math.min(...trades.map(t => t.profit), 0),

      // Risk Metrics
      sharpeRatio: this.calculateSharpeRatio(trades),
      maxDrawdown: this.calculateMaxDrawdown(trades),
      maxDrawdownPercent: this.calculateMaxDrawdownPercent(trades),
      currentDrawdown: this.calculateCurrentDrawdown(trades),
      recoveryFactor: totalLoss > 0 ? netProfit / totalLoss : 0,

      // Signal Metrics
      signalAccuracy: executedSignals.length > 0 ? (accurateSignals.length / executedSignals.length) * 100 : 0,
      totalSignals: signals.length,
      executedSignals: executedSignals.length,
      missedSignals: signals.length - executedSignals.length,
      falseSignals: executedSignals.length - accurateSignals.length,

      // Time Metrics
      averageTradeDuration: trades.length > 0 ? trades.reduce((sum, t) => sum + t.duration, 0) / trades.length : 0,
      totalTradingTime: this.calculateTotalTradingTime(trades),
      profitablePeriods: this.calculateProfitablePeriods(trades),
      unprofitablePeriods: this.calculateUnprofitablePeriods(trades),

      // Efficiency Metrics
      profitFactor: totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0,
      expectancy: trades.length > 0 ? netProfit / trades.length : 0,
      riskRewardRatio: this.calculateRiskRewardRatio(trades),
      winLossRatio: losingTrades.length > 0 ? winningTrades.length / losingTrades.length : winningTrades.length > 0 ? Infinity : 0,
    };

    this.setCachedResult(cacheKey, metrics);
    return metrics;
  }

  /**
   * Get signal type breakdown metrics
   */
  getSignalTypeMetrics(filter?: AnalyticsFilter): SignalTypeMetrics[] {
    const signals = this.filterSignals(filter);
    const signalTypes: SignalType[] = ['RISE_FALL', 'HIGHER_LOWER', 'MATCHES_DIFFERS', 'EVEN_ODD', 'OVER_UNDER'];

    return signalTypes.map(signalType => {
      const typeSignals = signals.filter(s => s.signalType === signalType);
      const executedSignals = typeSignals.filter(s => s.executed);
      const winningSignals = executedSignals.filter(s => s.profit && s.profit > 0);
      const losingSignals = executedSignals.filter(s => s.profit && s.profit <= 0);

      return {
        signalType,
        totalSignals: typeSignals.length,
        executedSignals: executedSignals.length,
        winningSignals: winningSignals.length,
        losingSignals: losingSignals.length,
        winRate: executedSignals.length > 0 ? (winningSignals.length / executedSignals.length) * 100 : 0,
        averageProfit: executedSignals.length > 0 ? executedSignals.reduce((sum, s) => sum + (s.profit || 0), 0) / executedSignals.length : 0,
        totalProfit: executedSignals.reduce((sum, s) => sum + (s.profit || 0), 0),
        accuracy: executedSignals.length > 0 ? (winningSignals.length / executedSignals.length) * 100 : 0,
        confidence: typeSignals.length > 0 ? typeSignals.reduce((sum, s) => sum + s.confidence, 0) / typeSignals.length : 0,
        riskScore: typeSignals.length > 0 ? typeSignals.reduce((sum, s) => sum + s.risk, 0) / typeSignals.length : 0,
      };
    });
  }

  /**
   * Get time-based performance analysis
   */
  getTimeBasedMetrics(filter?: AnalyticsFilter): TimeBasedMetrics[] {
    const trades = this.filterTrades(filter);
    const hourlyMetrics: Map<string, TimeBasedMetrics> = new Map();

    trades.forEach(trade => {
      const date = new Date(trade.timestamp);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();
      const key = `${hour}-${dayOfWeek}`;

      if (!hourlyMetrics.has(key)) {
        hourlyMetrics.set(key, {
          timestamp: trade.timestamp,
          hourOfDay: hour,
          dayOfWeek,
          trades: 0,
          profit: 0,
          winRate: 0,
          averageConfidence: 0,
          averageRisk: 0,
        });
      }

      const metrics = hourlyMetrics.get(key)!;
      metrics.trades++;
      metrics.profit += trade.profit;
      metrics.averageConfidence += trade.confidence;
      metrics.averageRisk += trade.risk;
    });

    // Calculate averages and win rates
    return Array.from(hourlyMetrics.values()).map(metrics => {
      const hourTrades = trades.filter(t => {
        const date = new Date(t.timestamp);
        return date.getHours() === metrics.hourOfDay && date.getDay() === metrics.dayOfWeek;
      });

      const winningTrades = hourTrades.filter(t => t.isWin);

      return {
        ...metrics,
        winRate: hourTrades.length > 0 ? (winningTrades.length / hourTrades.length) * 100 : 0,
        averageConfidence: metrics.trades > 0 ? metrics.averageConfidence / metrics.trades : 0,
        averageRisk: metrics.trades > 0 ? metrics.averageRisk / metrics.trades : 0,
      };
    });
  }

  /**
   * Generate optimization insights
   */
  generateOptimizationInsights(filter?: AnalyticsFilter): OptimizationInsight[] {
    const metrics = this.calculatePerformanceMetrics(filter);
    const signalMetrics = this.getSignalTypeMetrics(filter);
    const timeMetrics = this.getTimeBasedMetrics(filter);
    const insights: OptimizationInsight[] = [];

    // Performance insights
    if (metrics.winRate < 50) {
      insights.push({
        category: 'PERFORMANCE',
        severity: 'CRITICAL',
        title: 'Low Win Rate',
        description: `Current win rate is ${metrics.winRate.toFixed(1)}%, which is below the 50% threshold.`,
        recommendation: 'Consider increasing confidence thresholds or reviewing signal generation parameters.',
        impact: 'HIGH',
        confidence: 0.9,
        data: { winRate: metrics.winRate }
      });
    }

    if (metrics.sharpeRatio < 1.0) {
      insights.push({
        category: 'RISK',
        severity: 'WARNING',
        title: 'Low Risk-Adjusted Returns',
        description: `Sharpe ratio of ${metrics.sharpeRatio.toFixed(2)} indicates suboptimal risk-adjusted performance.`,
        recommendation: 'Review risk management parameters and consider reducing position sizes.',
        impact: 'MEDIUM',
        confidence: 0.8,
        data: { sharpeRatio: metrics.sharpeRatio }
      });
    }

    // Signal type insights
    const bestSignalType = signalMetrics.reduce((best, current) => 
      current.winRate > best.winRate ? current : best
    );
    const worstSignalType = signalMetrics.reduce((worst, current) => 
      current.winRate < worst.winRate ? current : worst
    );

    if (bestSignalType.winRate - worstSignalType.winRate > 20) {
      insights.push({
        category: 'SIGNAL',
        severity: 'INFO',
        title: 'Signal Type Performance Variance',
        description: `${bestSignalType.signalType} performs significantly better (${bestSignalType.winRate.toFixed(1)}%) than ${worstSignalType.signalType} (${worstSignalType.winRate.toFixed(1)}%).`,
        recommendation: `Consider focusing on ${bestSignalType.signalType} signals or improving ${worstSignalType.signalType} parameters.`,
        impact: 'MEDIUM',
        confidence: 0.7,
        data: { bestType: bestSignalType, worstType: worstSignalType }
      });
    }

    // Time-based insights
    const bestTimeSlot = timeMetrics.reduce((best, current) => 
      current.winRate > best.winRate ? current : best
    );
    const worstTimeSlot = timeMetrics.reduce((worst, current) => 
      current.winRate < worst.winRate ? current : worst
    );

    if (bestTimeSlot.winRate - worstTimeSlot.winRate > 30) {
      insights.push({
        category: 'TIMING',
        severity: 'INFO',
        title: 'Time-Based Performance Patterns',
        description: `Performance varies significantly by time of day. Best: ${bestTimeSlot.hourOfDay}:00 (${bestTimeSlot.winRate.toFixed(1)}%), Worst: ${worstTimeSlot.hourOfDay}:00 (${worstTimeSlot.winRate.toFixed(1)}%).`,
        recommendation: 'Consider adjusting trading hours to focus on high-performance time slots.',
        impact: 'MEDIUM',
        confidence: 0.6,
        data: { bestTime: bestTimeSlot, worstTime: worstTimeSlot }
      });
    }

    return insights;
  }

  /**
   * Generate performance charts
   */
  generatePerformanceCharts(filter?: AnalyticsFilter): PerformanceChart[] {
    const charts: PerformanceChart[] = [];

    // Profit/Loss over time
    charts.push(this.createProfitLossChart(filter));

    // Signal type performance
    charts.push(this.createSignalTypeChart(filter));

    // Win rate trend
    charts.push(this.createWinRateTrendChart(filter));

    // Risk vs Reward scatter
    charts.push(this.createRiskRewardScatterChart(filter));

    // Time-based heatmap
    charts.push(this.createTimeBasedHeatmap(filter));

    return charts;
  }

  /**
   * Generate comprehensive analytics report
   */
  generateAnalyticsReport(filter?: AnalyticsFilter): AnalyticsReport {
    const timeRange = filter?.timeRange || TIME_RANGE_PRESETS.LAST_24_HOURS();
    
    return {
      id: `report_${Date.now()}`,
      generatedAt: Date.now(),
      timeRange,
      summary: this.calculatePerformanceMetrics(filter),
      signalBreakdown: this.getSignalTypeMetrics(filter),
      timeAnalysis: this.getTimeBasedMetrics(filter),
      riskAnalysis: this.calculateRiskMetrics(filter),
      insights: this.generateOptimizationInsights(filter),
      trends: this.calculatePerformanceTrends(filter),
      charts: this.generatePerformanceCharts(filter),
      recommendations: this.generateRecommendations(filter),
    };
  }

  /**
   * Add trade record for analysis
   */
  addTradeRecord(trade: Omit<TradeRecord, 'id'>): void {
    const tradeRecord: TradeRecord = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...trade
    };
    
    this.tradeHistory.push(tradeRecord);
    this.clearCache();
    this.saveHistoricalData();
  }

  /**
   * Add signal record for analysis
   */
  addSignalRecord(signal: Omit<SignalRecord, 'id'>): void {
    const signalRecord: SignalRecord = {
      id: `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...signal
    };
    
    this.signalHistory.push(signalRecord);
    this.clearCache();
    this.saveHistoricalData();
  }

  // Private helper methods

  private filterTrades(filter?: AnalyticsFilter): TradeRecord[] {
    let trades = [...this.tradeHistory];

    if (filter) {
      if (filter.timeRange) {
        trades = trades.filter(t => 
          t.timestamp >= filter.timeRange.start && 
          t.timestamp <= filter.timeRange.end
        );
      }

      if (filter.signalTypes) {
        trades = trades.filter(t => filter.signalTypes!.includes(t.signalType));
      }

      if (filter.minConfidence !== undefined) {
        trades = trades.filter(t => t.confidence >= filter.minConfidence!);
      }

      if (filter.maxRisk !== undefined) {
        trades = trades.filter(t => t.risk <= filter.maxRisk!);
      }

      if (filter.profitableOnly) {
        trades = trades.filter(t => t.profit > 0);
      }

      if (!filter.includeSimulation) {
        trades = trades.filter(t => !t.isSimulation);
      }
    }

    return trades;
  }

  private filterSignals(filter?: AnalyticsFilter): SignalRecord[] {
    let signals = [...this.signalHistory];

    if (filter) {
      if (filter.timeRange) {
        signals = signals.filter(s => 
          s.timestamp >= filter.timeRange.start && 
          s.timestamp <= filter.timeRange.end
        );
      }

      if (filter.signalTypes) {
        signals = signals.filter(s => filter.signalTypes!.includes(s.signalType));
      }

      if (filter.minConfidence !== undefined) {
        signals = signals.filter(s => s.confidence >= filter.minConfidence!);
      }

      if (filter.maxRisk !== undefined) {
        signals = signals.filter(s => s.risk <= filter.maxRisk!);
      }
    }

    return signals;
  }

  private calculateSharpeRatio(trades: TradeRecord[]): number {
    if (trades.length < 2) return 0;

    const returns = trades.map(t => t.profit / t.stake);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1);
    const stdDev = Math.sqrt(variance);

    return stdDev > 0 ? avgReturn / stdDev : 0;
  }

  private calculateMaxDrawdown(trades: TradeRecord[]): number {
    let maxDrawdown = 0;
    let peak = 0;
    let runningTotal = 0;

    trades.forEach(trade => {
      runningTotal += trade.profit;
      if (runningTotal > peak) {
        peak = runningTotal;
      }
      const drawdown = peak - runningTotal;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });

    return maxDrawdown;
  }

  private calculateMaxDrawdownPercent(trades: TradeRecord[]): number {
    const maxDrawdown = this.calculateMaxDrawdown(trades);
    const totalProfit = trades.reduce((sum, t) => sum + Math.max(0, t.profit), 0);
    return totalProfit > 0 ? (maxDrawdown / totalProfit) * 100 : 0;
  }

  private calculateCurrentDrawdown(trades: TradeRecord[]): number {
    if (trades.length === 0) return 0;

    let peak = 0;
    let runningTotal = 0;

    trades.forEach(trade => {
      runningTotal += trade.profit;
      if (runningTotal > peak) {
        peak = runningTotal;
      }
    });

    return Math.max(0, peak - runningTotal);
  }

  private calculateRiskRewardRatio(trades: TradeRecord[]): number {
    const winningTrades = trades.filter(t => t.isWin);
    const losingTrades = trades.filter(t => !t.isWin);

    if (winningTrades.length === 0 || losingTrades.length === 0) return 0;

    const avgWin = winningTrades.reduce((sum, t) => sum + t.profit, 0) / winningTrades.length;
    const avgLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.profit, 0) / losingTrades.length);

    return avgLoss > 0 ? avgWin / avgLoss : 0;
  }

  private calculateTotalTradingTime(trades: TradeRecord[]): number {
    return trades.reduce((sum, t) => sum + t.duration, 0);
  }

  private calculateProfitablePeriods(trades: TradeRecord[]): number {
    // Implementation for calculating profitable periods
    return 0; // Placeholder
  }

  private calculateUnprofitablePeriods(trades: TradeRecord[]): number {
    // Implementation for calculating unprofitable periods
    return 0; // Placeholder
  }

  private calculateRiskMetrics(filter?: AnalyticsFilter): RiskMetrics {
    const trades = this.filterTrades(filter);
    
    return {
      currentRisk: 0, // Placeholder implementations
      averageRisk: 0,
      maxRisk: 0,
      riskAdjustedReturn: 0,
      valueAtRisk: 0,
      conditionalValueAtRisk: 0,
      beta: 0,
      alpha: 0,
      volatility: 0,
    };
  }

  private calculatePerformanceTrends(filter?: AnalyticsFilter): PerformanceTrend[] {
    // Implementation for calculating performance trends
    return []; // Placeholder
  }

  private generateRecommendations(filter?: AnalyticsFilter): string[] {
    const insights = this.generateOptimizationInsights(filter);
    return insights.map(insight => insight.recommendation);
  }

  private createProfitLossChart(filter?: AnalyticsFilter): PerformanceChart {
    const trades = this.filterTrades(filter);
    let runningTotal = 0;

    const data = trades.map(trade => {
      runningTotal += trade.profit;
      return {
        x: trade.timestamp,
        y: runningTotal,
        label: `$${runningTotal.toFixed(2)}`,
      };
    });

    return {
      type: 'LINE',
      title: 'Cumulative Profit/Loss',
      data,
      xAxis: { label: 'Time', type: 'TIME' },
      yAxis: { label: 'Profit ($)', type: 'NUMBER' },
      options: { ...DEFAULT_CHART_OPTIONS, height: 300 },
    };
  }

  private createSignalTypeChart(filter?: AnalyticsFilter): PerformanceChart {
    const signalMetrics = this.getSignalTypeMetrics(filter);

    const data = signalMetrics.map(metric => ({
      x: metric.signalType,
      y: metric.winRate,
      label: `${metric.winRate.toFixed(1)}%`,
    }));

    return {
      type: 'BAR',
      title: 'Win Rate by Signal Type',
      data,
      xAxis: { label: 'Signal Type', type: 'CATEGORY' },
      yAxis: { label: 'Win Rate (%)', type: 'NUMBER' },
      options: { ...DEFAULT_CHART_OPTIONS, height: 250 },
    };
  }

  private createWinRateTrendChart(filter?: AnalyticsFilter): PerformanceChart {
    // Implementation for win rate trend chart
    return {
      type: 'LINE',
      title: 'Win Rate Trend',
      data: [],
      xAxis: { label: 'Time', type: 'TIME' },
      yAxis: { label: 'Win Rate (%)', type: 'NUMBER' },
      options: { ...DEFAULT_CHART_OPTIONS, height: 250 },
    };
  }

  private createRiskRewardScatterChart(filter?: AnalyticsFilter): PerformanceChart {
    // Implementation for risk vs reward scatter chart
    return {
      type: 'SCATTER',
      title: 'Risk vs Reward',
      data: [],
      xAxis: { label: 'Risk', type: 'NUMBER' },
      yAxis: { label: 'Reward', type: 'NUMBER' },
      options: { ...DEFAULT_CHART_OPTIONS, height: 300 },
    };
  }

  private createTimeBasedHeatmap(filter?: AnalyticsFilter): PerformanceChart {
    // Implementation for time-based performance heatmap
    return {
      type: 'HEATMAP',
      title: 'Performance by Time of Day',
      data: [],
      xAxis: { label: 'Hour of Day', type: 'NUMBER' },
      yAxis: { label: 'Day of Week', type: 'CATEGORY' },
      options: { ...DEFAULT_CHART_OPTIONS, height: 200 },
    };
  }

  private getEmptyMetrics(): PerformanceMetrics {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      totalProfit: 0,
      totalLoss: 0,
      netProfit: 0,
      averageProfit: 0,
      averageLoss: 0,
      largestWin: 0,
      largestLoss: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
      currentDrawdown: 0,
      recoveryFactor: 0,
      signalAccuracy: 0,
      totalSignals: 0,
      executedSignals: 0,
      missedSignals: 0,
      falseSignals: 0,
      averageTradeDuration: 0,
      totalTradingTime: 0,
      profitablePeriods: 0,
      unprofitablePeriods: 0,
      profitFactor: 0,
      expectancy: 0,
      riskRewardRatio: 0,
      winLossRatio: 0,
    };
  }

  private getCachedResult(key: string): any {
    const cached = this.performanceCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCachedResult(key: string, data: any): void {
    this.performanceCache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  private clearCache(): void {
    this.performanceCache.clear();
  }

  private loadHistoricalData(): void {
    try {
      const stored = localStorage.getItem('tickshark_analytics_data');
      if (stored) {
        const data = JSON.parse(stored);
        this.tradeHistory = data.trades || [];
        this.signalHistory = data.signals || [];
      }
    } catch (error) {
      console.error('Failed to load historical data:', error);
    }
  }

  private saveHistoricalData(): void {
    try {
      const data = {
        trades: this.tradeHistory,
        signals: this.signalHistory,
      };
      localStorage.setItem('tickshark_analytics_data', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save historical data:', error);
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();