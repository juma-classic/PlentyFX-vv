/**
 * Accumulator Trading Types
 * Comprehensive type definitions for accumulator analysis and trading
 */

export interface AccumulatorConfig {
    growthRate: number; // 1-5%
    takeProfit: number; // Percentage of initial stake
    stopLoss: number; // Percentage of initial stake
    maxTicks: number; // Maximum ticks before auto-exit
    minTicks: number; // Minimum ticks before allowing exit
    market: string; // e.g., 'R_10', 'R_25', 'R_50'
    initialStake: number;
    strategy: AccumulatorStrategy;
}

export type AccumulatorStrategy =
    | 'CONSERVATIVE_GROWTH'
    | 'AGGRESSIVE_COMPOUND'
    | 'TICK_BASED_EXIT'
    | 'VOLATILITY_ADAPTIVE'
    | 'TIME_BASED_EXIT'
    | 'PROFIT_LADDER';

export interface AccumulatorSession {
    id: string;
    startTime: Date;
    endTime?: Date;
    config: AccumulatorConfig;
    status: 'ACTIVE' | 'COMPLETED' | 'STOPPED' | 'ERROR';
    currentValue: number;
    initialStake: number;
    profit: number;
    profitPercentage: number;
    tickCount: number;
    maxValue: number;
    minValue: number;
    trades: AccumulatorTrade[];
}

export interface AccumulatorTrade {
    id: string;
    timestamp: Date;
    action: 'START' | 'TICK' | 'EXIT' | 'STOP_LOSS' | 'TAKE_PROFIT';
    value: number;
    profit: number;
    profitPercentage: number;
    tickNumber: number;
    reason?: string;
}

export interface AccumulatorAnalysis {
    tickAnalysis: TickAnalysis;
    volatilityAnalysis: VolatilityAnalysis;
    profitProbability: ProfitProbability;
    riskAssessment: RiskAssessment;
    recommendations: AccumulatorRecommendation[];
}

export interface TickAnalysis {
    averageTickValue: number;
    tickVolatility: number;
    tickTrend: 'UPWARD' | 'DOWNWARD' | 'SIDEWAYS';
    tickFrequency: number; // Ticks per second
    lastNTicks: number[]; // Last N tick values
    tickPatterns: TickPattern[];
}

export interface TickPattern {
    type: 'SPIKE' | 'DIP' | 'CONSOLIDATION' | 'BREAKOUT';
    confidence: number;
    duration: number; // In ticks
    impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
}

export interface VolatilityAnalysis {
    currentVolatility: number;
    averageVolatility: number;
    volatilityTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
    volatilityScore: number; // 1-10 scale
    marketCondition: 'CALM' | 'MODERATE' | 'VOLATILE' | 'EXTREME';
}

export interface ProfitProbability {
    takeProfitProbability: number; // 0-100%
    stopLossProbability: number; // 0-100%
    expectedValue: number;
    riskRewardRatio: number;
    optimalExitTick: number;
}

export interface RiskAssessment {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
    riskScore: number; // 1-100
    maxDrawdown: number;
    valueAtRisk: number; // VaR
    riskFactors: RiskFactor[];
}

export interface RiskFactor {
    factor: string;
    impact: 'LOW' | 'MEDIUM' | 'HIGH';
    description: string;
}

export interface AccumulatorRecommendation {
    type: 'ENTRY' | 'EXIT' | 'HOLD' | 'ADJUST';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    message: string;
    reasoning: string;
    confidence: number; // 0-100%
    action?: {
        type: 'START_TRADE' | 'EXIT_TRADE' | 'ADJUST_SETTINGS';
        parameters?: Record<string, any>;
    };
}

export interface AccumulatorBot {
    id: string;
    name: string;
    strategy: AccumulatorStrategy;
    config: AccumulatorConfig;
    status: 'IDLE' | 'RUNNING' | 'PAUSED' | 'ERROR';
    performance: BotPerformance;
    rules: BotRule[];
}

export interface BotPerformance {
    totalTrades: number;
    winRate: number;
    totalProfit: number;
    averageProfit: number;
    maxDrawdown: number;
    sharpeRatio: number;
    profitFactor: number;
}

export interface BotRule {
    id: string;
    type: 'ENTRY' | 'EXIT' | 'RISK_MANAGEMENT';
    condition: string;
    action: string;
    priority: number;
    enabled: boolean;
}

export interface AccumulatorMarketData {
    symbol: string;
    currentPrice: number;
    lastTick: number;
    tickHistory: TickData[];
    volatility: number;
    trend: 'UP' | 'DOWN' | 'SIDEWAYS';
    support: number;
    resistance: number;
}

export interface TickData {
    timestamp: Date;
    value: number;
    volume?: number;
    bid?: number;
    ask?: number;
}

export interface AccumulatorSignal {
    id: string;
    timestamp: Date;
    type: 'BUY' | 'SELL' | 'HOLD' | 'EXIT';
    strength: number; // 1-10
    confidence: number; // 0-100%
    market: string;
    growthRate: number;
    expectedProfit: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
    validUntil: Date;
    metadata: {
        tickAnalysis: TickAnalysis;
        volatilityScore: number;
        marketCondition: string;
        reasoning: string;
    };
}

export interface AccumulatorBacktest {
    id: string;
    strategy: AccumulatorStrategy;
    config: AccumulatorConfig;
    period: {
        start: Date;
        end: Date;
    };
    results: BacktestResults;
}

export interface BacktestResults {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    totalProfit: number;
    totalLoss: number;
    netProfit: number;
    profitFactor: number;
    maxDrawdown: number;
    averageTrade: number;
    sharpeRatio: number;
    trades: AccumulatorTrade[];
    equity: EquityPoint[];
}

export interface EquityPoint {
    timestamp: Date;
    value: number;
    drawdown: number;
}
