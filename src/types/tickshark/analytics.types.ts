/**
 * TickShark Analytics Type Definitions
 * Performance metrics, historical analysis, and optimization insights
 */

export interface PerformanceMetrics {
  // Trade Statistics
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number; // Percentage (0-100)
  
  // Financial Metrics
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
  averageProfit: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  
  // Risk Metrics
  sharpeRatio: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  currentDrawdown: number;
  recoveryFactor: number;
  
  // Signal Metrics
  signalAccuracy: number; // Percentage (0-100)
  totalSignals: number;
  executedSignals: number;
  missedSignals: number;
  falseSignals: number;
  
  // Time Metrics
  averageTradeDuration: number; // milliseconds
  totalTradingTime: number; // milliseconds
  profitablePeriods: number;
  unprofitablePeriods: number;
  
  // Efficiency Metrics
  profitFactor: number; // Total profit / Total loss
  expectancy: number; // Average profit per trade
  riskRewardRatio: number;
  winLossRatio: number;
}

export interface SignalTypeMetrics {
  signalType: SignalType;
  totalSignals: number;
  executedSignals: number;
  winningSignals: number;
  losingSignals: number;
  winRate: number;
  averageProfit: number;
  totalProfit: number;
  accuracy: number;
  confidence: number;
  riskScore: number;
}

export interface TimeBasedMetrics {
  timestamp: number;
  hourOfDay: number;
  dayOfWeek: number;
  trades: number;
  profit: number;
  winRate: number;
  averageConfidence: number;
  averageRisk: number;
}

export interface StrategyPerformance {
  strategyId: string;
  strategyName: string;
  metrics: PerformanceMetrics;
  timeRange: TimeRange;
  signalBreakdown: SignalTypeMetrics[];
  riskMetrics: RiskMetrics;
  optimizationScore: number;
  recommendations: string[];
}

export interface RiskMetrics {
  currentRisk: number;
  averageRisk: number;
  maxRisk: number;
  riskAdjustedReturn: number;
  valueAtRisk: number; // VaR
  conditionalValueAtRisk: number; // CVaR
  beta: number;
  alpha: number;
  volatility: number;
}

export interface TimeRange {
  start: number;
  end: number;
  duration: number;
  label: string;
}

export interface PerformanceChart {
  type: 'LINE' | 'BAR' | 'PIE' | 'SCATTER' | 'HEATMAP';
  title: string;
  data: ChartDataPoint[];
  xAxis: ChartAxis;
  yAxis: ChartAxis;
  options: ChartOptions;
}

export interface ChartDataPoint {
  x: number | string;
  y: number;
  label?: string;
  color?: string;
  metadata?: Record<string, any>;
}

export interface ChartAxis {
  label: string;
  type: 'NUMBER' | 'TIME' | 'CATEGORY';
  min?: number;
  max?: number;
  format?: string;
}

export interface ChartOptions {
  showGrid: boolean;
  showLegend: boolean;
  showTooltip: boolean;
  colors: string[];
  height: number;
  width?: number;
  responsive: boolean;
}

export interface AnalyticsFilter {
  timeRange: TimeRange;
  signalTypes?: SignalType[];
  minConfidence?: number;
  maxRisk?: number;
  profitableOnly?: boolean;
  includeSimulation?: boolean;
}

export interface OptimizationInsight {
  category: 'PERFORMANCE' | 'RISK' | 'TIMING' | 'SIGNAL' | 'STRATEGY';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  description: string;
  recommendation: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
  data?: Record<string, any>;
}

export interface PerformanceComparison {
  baseline: PerformanceMetrics;
  current: PerformanceMetrics;
  improvement: PerformanceMetrics;
  improvementPercent: Record<keyof PerformanceMetrics, number>;
  significantChanges: string[];
}

export interface MarketConditionCorrelation {
  condition: 'TRENDING' | 'RANGING' | 'VOLATILE' | 'STABLE';
  trades: number;
  winRate: number;
  averageProfit: number;
  correlation: number; // -1 to 1
  significance: number; // 0 to 1
}

export interface LatencyImpactAnalysis {
  latencyRange: { min: number; max: number };
  trades: number;
  winRate: number;
  averageProfit: number;
  opportunityConversion: number;
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
}

export interface OpportunityConversionMetrics {
  totalOpportunities: number;
  convertedOpportunities: number;
  conversionRate: number;
  averageConversionTime: number;
  missedOpportunities: number;
  missedReasons: Record<string, number>;
}

export interface PerformanceTrend {
  metric: keyof PerformanceMetrics;
  trend: 'IMPROVING' | 'DECLINING' | 'STABLE';
  changePercent: number;
  dataPoints: { timestamp: number; value: number }[];
  forecast?: { timestamp: number; value: number }[];
}

export interface AnalyticsReport {
  id: string;
  generatedAt: number;
  timeRange: TimeRange;
  summary: PerformanceMetrics;
  signalBreakdown: SignalTypeMetrics[];
  timeAnalysis: TimeBasedMetrics[];
  riskAnalysis: RiskMetrics;
  insights: OptimizationInsight[];
  trends: PerformanceTrend[];
  charts: PerformanceChart[];
  recommendations: string[];
}

export interface AnalyticsExport {
  report: AnalyticsReport;
  metadata: {
    exportDate: number;
    version: string;
    format: 'JSON' | 'CSV' | 'PDF';
    checksum: string;
  };
}

// Signal Types (from existing types)
export type SignalType = 
  | 'RISE_FALL'
  | 'HIGHER_LOWER'
  | 'MATCHES_DIFFERS'
  | 'EVEN_ODD'
  | 'OVER_UNDER';

// Time Range Presets
export const TIME_RANGE_PRESETS: Record<string, () => TimeRange> = {
  LAST_HOUR: () => ({
    start: Date.now() - 60 * 60 * 1000,
    end: Date.now(),
    duration: 60 * 60 * 1000,
    label: 'Last Hour'
  }),
  LAST_24_HOURS: () => ({
    start: Date.now() - 24 * 60 * 60 * 1000,
    end: Date.now(),
    duration: 24 * 60 * 60 * 1000,
    label: 'Last 24 Hours'
  }),
  LAST_7_DAYS: () => ({
    start: Date.now() - 7 * 24 * 60 * 60 * 1000,
    end: Date.now(),
    duration: 7 * 24 * 60 * 60 * 1000,
    label: 'Last 7 Days'
  }),
  LAST_30_DAYS: () => ({
    start: Date.now() - 30 * 24 * 60 * 60 * 1000,
    end: Date.now(),
    duration: 30 * 24 * 60 * 60 * 1000,
    label: 'Last 30 Days'
  }),
  ALL_TIME: () => ({
    start: 0,
    end: Date.now(),
    duration: Date.now(),
    label: 'All Time'
  }),
};

// Default Chart Options
export const DEFAULT_CHART_OPTIONS: ChartOptions = {
  showGrid: true,
  showLegend: true,
  showTooltip: true,
  colors: ['#00d4ff', '#00ff88', '#ffa500', '#ff4757', '#a0a0b0'],
  height: 300,
  responsive: true,
};