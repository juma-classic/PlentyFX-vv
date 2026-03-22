/**
 * TickShark Execution Types
 * Type definitions for trading execution and intent management
 */

export type TradingMode = 'MANUAL_OBSERVATION' | 'SIMULATION' | 'SEMI_AUTOMATED' | 'FULLY_AUTOMATED';

export type IntentType = 'RISE_FALL' | 'HIGHER_LOWER' | 'MATCHES_DIFFERS' | 'EVEN_ODD' | 'OVER_UNDER';

export type IntentStatus = 'CREATED' | 'VALIDATED' | 'QUEUED' | 'EXECUTING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type ExecutionResult = 'WIN' | 'LOSS' | 'CANCELLED' | 'PENDING';

export interface TradeParameters {
    symbol: string;
    contractType: IntentType;
    stake: number;
    duration: number;
    barrier?: number;
    prediction?: number;
    entrySpot?: number;
}

export interface ExecutionMetrics {
    latency: number;
    slippage: number;
    executionTime: number;
    networkDelay: number;
    processingTime: number;
    confirmationTime: number;
}

export interface ExecutionResult {
    success: boolean;
    contractId?: string;
    entrySpot?: number;
    exitSpot?: number;
    payout?: number;
    profit?: number;
    executionMetrics: ExecutionMetrics;
    errorMessage?: string;
}

export interface TradeIntent {
    id: string;
    type: IntentType;
    status: IntentStatus;
    createdAt: number;
    updatedAt: number;
    
    // Trading Parameters
    parameters: TradeParameters;
    
    // Analysis Context
    analysisId?: string;
    signalId?: string;
    confidence: number;
    
    // Execution Details
    execution?: ExecutionResult;
    
    // Safety and Validation
    riskScore: number;
    validationChecks: ValidationCheck[];
    
    // Metadata
    metadata: {
        source: 'MANUAL' | 'SIGNAL' | 'ALGORITHM';
        priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        tags: string[];
        notes?: string;
    };
}

export interface ValidationCheck {
    type: 'RISK_LIMIT' | 'BALANCE_CHECK' | 'MARKET_HOURS' | 'SYMBOL_AVAILABLE' | 'STAKE_LIMIT' | 'COOLDOWN';
    status: 'PENDING' | 'PASSED' | 'FAILED' | 'WARNING';
    message: string;
    timestamp: number;
}

export interface ExecutionEvent {
    id: string;
    timestamp: number;
    type: 'INTENT_CREATED' | 'INTENT_VALIDATED' | 'INTENT_QUEUED' | 'INTENT_EXECUTED' | 'INTENT_COMPLETED' | 'INTENT_FAILED' | 'INTENT_CANCELLED' | 'EXECUTION_STARTED' | 'EXECUTION_COMPLETED' | 'EXECUTION_FAILED';
    intentId: string;
    data: any;
    severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
    message: string;
}

export interface ExecutionQueue {
    pending: TradeIntent[];
    executing: TradeIntent[];
    completed: TradeIntent[];
    failed: TradeIntent[];
}

export interface ExecutionConfig {
    // Execution Limits
    maxConcurrentTrades: number;
    maxTradesPerMinute: number;
    maxStakePerTrade: number;
    maxTotalStake: number;
    
    // Timing Controls
    executionDelay: number;
    confirmationTimeout: number;
    retryAttempts: number;
    retryDelay: number;
    
    // Safety Controls
    enableRiskChecks: boolean;
    enableBalanceChecks: boolean;
    enableMarketHoursCheck: boolean;
    enableCooldownEnforcement: boolean;
    
    // Performance Settings
    latencyThreshold: number;
    slippageThreshold: number;
    executionTimeoutMs: number;
}

export interface ExecutionStatistics {
    // Trade Counts
    totalTrades: number;
    successfulTrades: number;
    failedTrades: number;
    cancelledTrades: number;
    
    // Financial Metrics
    totalStake: number;
    totalPayout: number;
    netProfit: number;
    winRate: number;
    averageProfit: number;
    maxDrawdown: number;
    
    // Performance Metrics
    averageLatency: number;
    averageSlippage: number;
    averageExecutionTime: number;
    successRate: number;
    
    // Time-based Metrics
    tradesPerHour: number;
    activeTime: number;
    totalTime: number;
    
    // Risk Metrics
    maxRiskScore: number;
    averageRiskScore: number;
    riskViolations: number;
}