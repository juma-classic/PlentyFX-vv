/**
 * Copy Trading Types
 * Defines interfaces for the copy trading system
 */

export interface CopyTrader {
    id: string;
    name: string;
    email?: string;
    apiToken: string;
    appId?: string;
    isActive: boolean;
    createdAt: number;
    lastActivity?: number;

    // Risk Management
    maxStakePerTrade: number;
    maxDailyLoss: number;
    maxConcurrentTrades: number;
    allowedMarkets: string[];
    allowedContractTypes: string[];

    // Performance Tracking
    totalTrades: number;
    winningTrades: number;
    totalProfit: number;
    currentDrawdown: number;
    lastTradeTime?: number;

    // Settings
    stakeMultiplier: number; // Multiplier for stake amounts (0.1 = 10% of master stake)
    followSignals: boolean;
    followBots: boolean;
    followManualTrades: boolean;

    // Status
    connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'SUSPENDED';
    lastError?: string;
}

export interface CopyTradeExecution {
    id: string;
    masterTradeId: string;
    copyTraderId: string;

    // Trade Details
    market: string;
    contractType: string;
    stake: number;
    duration: number;
    durationUnit: 't' | 'm' | 'h' | 'd';
    barrier?: string;

    // Execution Info
    executedAt: number;
    contractId?: string;
    buyPrice?: number;

    // Results
    status: 'PENDING' | 'ACTIVE' | 'WON' | 'LOST' | 'CANCELLED' | 'ERROR';
    sellPrice?: number;
    profit?: number;

    // Error Handling
    error?: string;
    retryCount: number;
    maxRetries: number;
}

export interface MasterTrade {
    id: string;
    source: 'SIGNAL' | 'BOT' | 'MANUAL' | 'ZEN' | 'FAST_LANE';

    // Trade Details
    market: string;
    contractType: string;
    stake: number;
    duration: number;
    durationUnit: 't' | 'm' | 'h' | 'd';
    barrier?: string;

    // Execution
    executedAt: number;
    contractId?: string;

    // Copy Trading
    shouldCopy: boolean;
    copyExecutions: CopyTradeExecution[];

    // Metadata
    strategy?: string;
    confidence?: string;
    signalId?: string;
    botName?: string;
}

export interface CopyTradingStats {
    totalCopyTraders: number;
    activeCopyTraders: number;
    totalCopyTrades: number;
    successfulCopyTrades: number;
    totalCopyProfit: number;
    averageExecutionTime: number;

    // Performance by trader
    traderStats: Record<
        string,
        {
            totalTrades: number;
            winRate: number;
            totalProfit: number;
            averageStake: number;
            lastTradeTime: number;
        }
    >;
}

export interface CopyTradingSettings {
    isEnabled: boolean;
    maxCopyTraders: number;
    defaultStakeMultiplier: number;
    defaultMaxStakePerTrade: number;
    defaultMaxDailyLoss: number;
    defaultMaxConcurrentTrades: number;

    // Risk Management
    globalMaxStakePerTrade: number;
    globalMaxDailyLoss: number;
    requireConfirmationForHighRisk: boolean;

    // Execution Settings
    executionDelay: number; // Delay in ms before executing copy trades
    maxExecutionTime: number; // Max time to wait for execution
    retryAttempts: number;

    // Notifications
    notifyOnNewCopyTrader: boolean;
    notifyOnCopyTradeExecution: boolean;
    notifyOnCopyTradeResult: boolean;
    notifyOnErrors: boolean;
}

export interface CopyTradingNotification {
    id: string;
    type: 'NEW_TRADER' | 'TRADE_EXECUTED' | 'TRADE_RESULT' | 'ERROR' | 'RISK_WARNING';
    title: string;
    message: string;
    timestamp: number;
    isRead: boolean;

    // Related Data
    copyTraderId?: string;
    tradeId?: string;
    severity: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
}

export interface ApiTokenValidation {
    isValid: boolean;
    accountInfo?: {
        loginId: string;
        currency: string;
        balance: number;
        country: string;
        email: string;
    };
    permissions?: {
        read: boolean;
        trade: boolean;
        payments: boolean;
        admin: boolean;
    };
    error?: string;
}
