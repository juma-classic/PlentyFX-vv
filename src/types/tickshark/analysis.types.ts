/**
 * TickShark Analysis Types
 * Type definitions for market analysis and latency arbitrage detection
 */

export interface TickData {
    symbol: string;
    timestamp: number;
    bid: number;
    ask: number;
    spread: number;
    volume?: number;
    
    // Latency Metrics
    receiveTime: number;
    processTime: number;
    latency: number;
    
    // Quality Metrics
    quality: 'HIGH' | 'MEDIUM' | 'LOW';
    source: string;
    
    // Metadata
    sequenceNumber: number;
    isValid: boolean;
}

export interface LatencyMetrics {
    networkLatency: number;
    processingLatency: number;
    totalLatency: number;
    jitter: number;
    packetLoss: number;
    
    // Quality Indicators
    stability: number; // 0-1 scale
    reliability: number; // 0-1 scale
    consistency: number; // 0-1 scale
}

export interface ArbitrageOpportunity {
    id: string;
    timestamp: number;
    symbol: string;
    
    // Opportunity Details
    type: 'LATENCY_ARBITRAGE' | 'SPREAD_ARBITRAGE' | 'PRICE_DISCREPANCY';
    confidence: number; // 0-1 scale
    expectedProfit: number;
    riskScore: number; // 0-1 scale
    
    // Market Data
    currentPrice: number;
    predictedPrice: number;
    priceDeviation: number;
    
    // Timing
    windowStart: number;
    windowEnd: number;
    duration: number;
    
    // Latency Context
    latencyAdvantage: number;
    competitorLatency: number;
    ourLatency: number;
    
    // Validation
    isValid: boolean;
    validationScore: number;
    
    // Metadata
    source: 'TICK_ANALYSIS' | 'PATTERN_DETECTION' | 'ML_MODEL';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface MarketCondition {
    symbol: string;
    timestamp: number;
    
    // Market State
    volatility: number;
    liquidity: number;
    spread: number;
    volume: number;
    
    // Trend Analysis
    trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
    trendStrength: number; // 0-1 scale
    momentum: number;
    
    // Market Quality
    stability: number; // 0-1 scale
    predictability: number; // 0-1 scale
    efficiency: number; // 0-1 scale
    
    // Risk Factors
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
    riskFactors: string[];
    
    // Arbitrage Suitability
    arbitrageFriendly: boolean;
    latencyAdvantage: number;
    opportunityCount: number;
}

export interface AnalysisResult {
    id: string;
    timestamp: number;
    symbol: string;
    
    // Analysis Metadata
    analysisType: 'REAL_TIME' | 'HISTORICAL' | 'SIMULATION';
    duration: number;
    dataPoints: number;
    
    // Market Analysis
    marketCondition: MarketCondition;
    latencyMetrics: LatencyMetrics;
    
    // Opportunities
    opportunities: ArbitrageOpportunity[];
    bestOpportunity?: ArbitrageOpportunity;
    
    // Risk Assessment
    overallRisk: number; // 0-1 scale
    riskFactors: string[];
    recommendations: string[];
    
    // Performance Metrics
    analysisLatency: number;
    confidence: number; // 0-1 scale
    accuracy?: number; // Historical accuracy if available
    
    // Validation
    isValid: boolean;
    validationErrors: string[];
    
    // Metadata
    version: string;
    modelVersion?: string;
    parameters: Record<string, any>;
}

export interface AnalysisConfig {
    // Analysis Parameters
    tickBufferSize: number;
    analysisInterval: number;
    lookbackPeriod: number;
    
    // Latency Detection
    latencyThreshold: number;
    latencyWindowMs: number;
    minLatencyAdvantage: number;
    
    // Arbitrage Detection
    minProfitThreshold: number;
    maxRiskThreshold: number;
    confidenceThreshold: number;
    
    // Market Condition Analysis
    volatilityPeriod: number;
    trendAnalysisPeriod: number;
    liquidityThreshold: number;
    
    // Quality Controls
    minDataQuality: 'HIGH' | 'MEDIUM' | 'LOW';
    maxLatencyJitter: number;
    maxPacketLoss: number;
    
    // Performance Settings
    maxAnalysisTime: number;
    enableCaching: boolean;
    cacheSize: number;
    
    // Advanced Features
    enableMLModels: boolean;
    enablePatternDetection: boolean;
    enablePredictiveAnalysis: boolean;
}

export interface AnalysisStatistics {
    // Analysis Performance
    totalAnalyses: number;
    averageAnalysisTime: number;
    analysesPerSecond: number;
    
    // Opportunity Detection
    opportunitiesDetected: number;
    opportunitiesActioned: number;
    opportunitySuccessRate: number;
    
    // Accuracy Metrics
    predictionAccuracy: number;
    falsePositiveRate: number;
    falseNegativeRate: number;
    
    // Latency Performance
    averageLatency: number;
    latencyStability: number;
    latencyAdvantageTime: number;
    
    // Market Coverage
    symbolsCovered: string[];
    marketHoursCovered: number;
    dataQualityScore: number;
    
    // Risk Metrics
    averageRiskScore: number;
    riskViolations: number;
    safetyTriggered: number;
}