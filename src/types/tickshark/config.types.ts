/**
 * TickShark Configuration Type Definitions
 * Comprehensive configuration management for TickShark platform
 */

export interface TickSharkConfig {
  analysis: AnalysisConfig;
  signals: SignalConfig;
  risk: RiskConfig;
  performance: PerformanceConfig;
  notifications: NotificationConfig;
  display: DisplayConfig;
  version: string;
  lastModified: number;
}

export interface AnalysisConfig {
  // Tick Data Configuration
  tickBufferSize: number; // Number of ticks to keep in buffer (default: 50)
  analysisInterval: number; // Analysis update interval in ms (default: 2000)
  
  // Latency Configuration
  latencyThreshold: number; // Max acceptable latency in ms (default: 100)
  networkLatencyWeight: number; // Weight for network latency (0-1, default: 0.6)
  processingLatencyWeight: number; // Weight for processing latency (0-1, default: 0.4)
  
  // Analysis Parameters
  minConfidence: number; // Minimum confidence for analysis (0-100, default: 70)
  enableAdvancedMetrics: boolean; // Enable advanced analysis metrics (default: true)
  enableLatencyArbitrage: boolean; // Enable latency arbitrage detection (default: true)
  
  // Market Condition Analysis
  volatilityWindow: number; // Window for volatility calculation (default: 20)
  trendWindow: number; // Window for trend analysis (default: 10)
  enableMarketConditionAnalysis: boolean; // Enable market condition analysis (default: true)
}

export interface SignalConfig {
  // Signal Types
  enabledTypes: SignalType[]; // Enabled signal types (default: all)
  
  // Signal Filtering
  minConfidence: number; // Minimum signal confidence (0-100, default: 75)
  maxRisk: number; // Maximum acceptable risk (0-100, default: 30)
  filterDuplicates: boolean; // Filter duplicate signals (default: true)
  duplicateTimeWindow: number; // Duplicate detection window in ms (default: 5000)
  
  // Signal Generation
  signalCooldown: number; // Cooldown between signals in ms (default: 1000)
  maxSignalsPerMinute: number; // Max signals per minute (default: 10)
  enableSignalHistory: boolean; // Keep signal history (default: true)
  
  // Signal Parameters
  defaultStake: number; // Default stake amount (default: 1)
  defaultDuration: number; // Default trade duration in ticks (default: 5)
  enableAutoParameters: boolean; // Auto-calculate parameters (default: true)
}

export interface RiskConfig {
  // Stake Management
  maxStake: number; // Maximum stake per trade (default: 10)
  minStake: number; // Minimum stake per trade (default: 0.35)
  stakeIncrement: number; // Stake increment step (default: 0.35)
  
  // Daily Limits
  maxDailyLoss: number; // Maximum daily loss (default: 100)
  maxDailyTrades: number; // Maximum trades per day (default: 100)
  maxConcurrentTrades: number; // Maximum concurrent trades (default: 3)
  
  // Stop Loss & Take Profit
  stopLossPercent: number; // Stop loss percentage (default: 20)
  takeProfitPercent: number; // Take profit percentage (default: 50)
  enableAutoStopLoss: boolean; // Enable automatic stop loss (default: true)
  enableAutoTakeProfit: boolean; // Enable automatic take profit (default: true)
  
  // Risk Assessment
  maxDrawdown: number; // Maximum acceptable drawdown (default: 25)
  riskToleranceLevel: 'LOW' | 'MEDIUM' | 'HIGH'; // Risk tolerance (default: MEDIUM)
  enableRiskWarnings: boolean; // Enable risk warnings (default: true)
}

export interface PerformanceConfig {
  // Caching Configuration
  enableCaching: boolean; // Enable result caching (default: true)
  cacheSize: number; // Cache size in MB (default: 50)
  cacheTTL: number; // Cache TTL in ms (default: 300000)
  
  // Processing Configuration
  enableWebWorkers: boolean; // Enable web workers for heavy calculations (default: true)
  maxWorkerThreads: number; // Maximum worker threads (default: 4)
  batchSize: number; // Batch size for bulk operations (default: 100)
  
  // Memory Management
  maxMemoryUsage: number; // Max memory usage in MB (default: 200)
  enableMemoryOptimization: boolean; // Enable memory optimization (default: true)
  garbageCollectionInterval: number; // GC interval in ms (default: 60000)
  
  // Update Configuration
  uiUpdateThrottle: number; // UI update throttle in ms (default: 100)
  dataUpdateDebounce: number; // Data update debounce in ms (default: 50)
  enableLazyLoading: boolean; // Enable lazy loading (default: true)
}

export interface NotificationConfig {
  // Alert Channels
  enableVisualAlerts: boolean; // Enable visual alerts (default: true)
  enableSoundAlerts: boolean; // Enable sound alerts (default: false)
  enableBrowserNotifications: boolean; // Enable browser notifications (default: false)
  
  // Alert Types
  enableOpportunityAlerts: boolean; // Arbitrage opportunity alerts (default: true)
  enableSignalAlerts: boolean; // High-confidence signal alerts (default: true)
  enableRiskAlerts: boolean; // Risk threshold alerts (default: true)
  enablePerformanceAlerts: boolean; // Performance milestone alerts (default: false)
  enableSystemAlerts: boolean; // System status alerts (default: true)
  
  // Alert Configuration
  alertVolume: number; // Alert sound volume (0-100, default: 50)
  alertDuration: number; // Alert display duration in ms (default: 5000)
  maxAlertsPerMinute: number; // Max alerts per minute (default: 5)
  
  // Notification Thresholds
  opportunityConfidenceThreshold: number; // Min confidence for opportunity alerts (default: 80)
  riskThreshold: number; // Risk level for risk alerts (default: 70)
  performanceThreshold: number; // Performance change for alerts (default: 10)
}

export interface DisplayConfig {
  // Theme Configuration
  theme: 'DARK' | 'LIGHT' | 'AUTO'; // Theme preference (default: DARK)
  accentColor: string; // Accent color (default: #00d4ff)
  
  // Layout Configuration
  compactMode: boolean; // Enable compact mode (default: false)
  showAdvancedControls: boolean; // Show advanced controls (default: true)
  panelLayout: 'TABS' | 'GRID' | 'ACCORDION'; // Panel layout (default: TABS)
  
  // Chart Configuration
  chartType: 'LINE' | 'CANDLESTICK' | 'BAR'; // Default chart type (default: LINE)
  chartTimeframe: number; // Chart timeframe in minutes (default: 5)
  showGridLines: boolean; // Show chart grid lines (default: true)
  
  // Data Display
  decimalPlaces: number; // Decimal places for numbers (default: 2)
  dateFormat: string; // Date format (default: 'YYYY-MM-DD HH:mm:ss')
  timezone: string; // Timezone (default: 'UTC')
  
  // Animation Configuration
  enableAnimations: boolean; // Enable UI animations (default: true)
  animationSpeed: 'SLOW' | 'NORMAL' | 'FAST'; // Animation speed (default: NORMAL)
  enableTransitions: boolean; // Enable transitions (default: true)
}

// Configuration Presets
export interface ConfigPreset {
  id: string;
  name: string;
  description: string;
  config: Partial<TickSharkConfig>;
  category: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE' | 'CUSTOM';
  isDefault: boolean;
}

// Configuration Validation
export interface ConfigValidationResult {
  isValid: boolean;
  errors: ConfigValidationError[];
  warnings: ConfigValidationWarning[];
}

export interface ConfigValidationError {
  field: string;
  message: string;
  severity: 'ERROR' | 'WARNING';
}

export interface ConfigValidationWarning {
  field: string;
  message: string;
  recommendation: string;
}

// Configuration Export/Import
export interface ConfigExport {
  config: TickSharkConfig;
  metadata: {
    exportDate: number;
    version: string;
    platform: string;
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

// Default Configuration
export const DEFAULT_CONFIG: TickSharkConfig = {
  analysis: {
    tickBufferSize: 50,
    analysisInterval: 2000,
    latencyThreshold: 100,
    networkLatencyWeight: 0.6,
    processingLatencyWeight: 0.4,
    minConfidence: 70,
    enableAdvancedMetrics: true,
    enableLatencyArbitrage: true,
    volatilityWindow: 20,
    trendWindow: 10,
    enableMarketConditionAnalysis: true,
  },
  signals: {
    enabledTypes: ['RISE_FALL', 'HIGHER_LOWER', 'MATCHES_DIFFERS', 'EVEN_ODD', 'OVER_UNDER'],
    minConfidence: 75,
    maxRisk: 30,
    filterDuplicates: true,
    duplicateTimeWindow: 5000,
    signalCooldown: 1000,
    maxSignalsPerMinute: 10,
    enableSignalHistory: true,
    defaultStake: 1,
    defaultDuration: 5,
    enableAutoParameters: true,
  },
  risk: {
    maxStake: 10,
    minStake: 0.35,
    stakeIncrement: 0.35,
    maxDailyLoss: 100,
    maxDailyTrades: 100,
    maxConcurrentTrades: 3,
    stopLossPercent: 20,
    takeProfitPercent: 50,
    enableAutoStopLoss: true,
    enableAutoTakeProfit: true,
    maxDrawdown: 25,
    riskToleranceLevel: 'MEDIUM',
    enableRiskWarnings: true,
  },
  performance: {
    enableCaching: true,
    cacheSize: 50,
    cacheTTL: 300000,
    enableWebWorkers: true,
    maxWorkerThreads: 4,
    batchSize: 100,
    maxMemoryUsage: 200,
    enableMemoryOptimization: true,
    garbageCollectionInterval: 60000,
    uiUpdateThrottle: 100,
    dataUpdateDebounce: 50,
    enableLazyLoading: true,
  },
  notifications: {
    enableVisualAlerts: true,
    enableSoundAlerts: false,
    enableBrowserNotifications: false,
    enableOpportunityAlerts: true,
    enableSignalAlerts: true,
    enableRiskAlerts: true,
    enablePerformanceAlerts: false,
    enableSystemAlerts: true,
    alertVolume: 50,
    alertDuration: 5000,
    maxAlertsPerMinute: 5,
    opportunityConfidenceThreshold: 80,
    riskThreshold: 70,
    performanceThreshold: 10,
  },
  display: {
    theme: 'DARK',
    accentColor: '#00d4ff',
    compactMode: false,
    showAdvancedControls: true,
    panelLayout: 'TABS',
    chartType: 'LINE',
    chartTimeframe: 5,
    showGridLines: true,
    decimalPlaces: 2,
    dateFormat: 'YYYY-MM-DD HH:mm:ss',
    timezone: 'UTC',
    enableAnimations: true,
    animationSpeed: 'NORMAL',
    enableTransitions: true,
  },
  version: '5.5.0',
  lastModified: Date.now(),
};

// Configuration Presets
export const CONFIG_PRESETS: ConfigPreset[] = [
  {
    id: 'conservative',
    name: 'Conservative',
    description: 'Low risk, high confidence settings for stable trading',
    category: 'CONSERVATIVE',
    isDefault: false,
    config: {
      signals: {
        minConfidence: 85,
        maxRisk: 20,
        maxSignalsPerMinute: 5,
      },
      risk: {
        maxStake: 5,
        maxDailyLoss: 50,
        maxConcurrentTrades: 2,
        riskToleranceLevel: 'LOW',
      },
    },
  },
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Balanced risk/reward settings for moderate trading',
    category: 'BALANCED',
    isDefault: true,
    config: DEFAULT_CONFIG,
  },
  {
    id: 'aggressive',
    name: 'Aggressive',
    description: 'Higher risk, more opportunities for active trading',
    category: 'AGGRESSIVE',
    isDefault: false,
    config: {
      signals: {
        minConfidence: 65,
        maxRisk: 40,
        maxSignalsPerMinute: 15,
      },
      risk: {
        maxStake: 20,
        maxDailyLoss: 200,
        maxConcurrentTrades: 5,
        riskToleranceLevel: 'HIGH',
      },
    },
  },
];