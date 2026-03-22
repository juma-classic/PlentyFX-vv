/**
 * Fast Lane State Machine Trading System - Type Definitions
 * Production-grade types for tick-based finite state machine trading
 */

// Trading Mode
export enum TradingMode {
    DEMO = 'demo',
    REAL = 'real',
}

// State Machine States
export enum TradingState {
    DISCONNECTED = 'DISCONNECTED',
    CONNECTED = 'CONNECTED',
    AUTHORIZED = 'AUTHORIZED',
    SUBSCRIBED = 'SUBSCRIBED',
    IDLE = 'IDLE',
    REQUESTING_PROPOSAL = 'REQUESTING_PROPOSAL',
    BUYING = 'BUYING',
    TRADE_ACTIVE = 'TRADE_ACTIVE',
    ERROR = 'ERROR',
}

// Tick Data
export interface TickData {
    epoch: number;
    quote: number;
    symbol: string;
}

// Balance Data
export interface BalanceData {
    balance: number;
    currency: string;
    loginid: string;
}

// Proposal Request
export interface ProposalRequest {
    contract_type: string;
    symbol: string;
    duration: number;
    duration_unit: string;
    basis: string;
    amount: number;
    barrier?: string;
}

// Proposal Response
export interface ProposalResponse {
    id: string;
    ask_price: number;
    payout: number;
    spot: number;
}

// Contract Data
export interface ContractData {
    contract_id: string;
    buy_price: number;
    payout: number;
    current_spot?: number;
    profit?: number;
    status?: 'open' | 'won' | 'lost';
}

// Trade Result
export interface TradeResult {
    contract_id: string;
    profit: number;
    status: 'won' | 'lost';
    entry_price: number;
    exit_price: number;
    duration: number;
}

// Execution Log
export interface ExecutionLog {
    timestamp: number;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    data?: unknown;
}

// Error Data
export interface ErrorData {
    code: string;
    message: string;
    timestamp: number;
}

// Risk Limits
export interface RiskLimits {
    maxTradesPerMinute: number;
    cooldownMs: number;
    minBalance: number;
    maxStake: number;
    maxTradesPerSession?: number;
}

// Trade Decision (from Risk Manager)
export interface TradeDecision {
    allowed: boolean;
    reason?: string;
}

// Strategy Types
export type StrategyType = 
    | 'DIGIT_OVER'
    | 'DIGIT_UNDER'
    | 'DIGIT_MATCH'
    | 'DIGIT_EVEN'
    | 'DIGIT_ODD';

// Strategy Configuration
export interface StrategyConfig {
    type: StrategyType;
    barrier?: number;
    prediction?: number;
}

// Strategy Decision
export interface StrategyDecision {
    shouldTrade: boolean;
    reason: string;
    contractType?: string;
    barrier?: number;
    prediction?: number;
}

// Buy Request
export interface BuyRequest {
    buy: string;
    price: number;
}

// Fast Lane State
export interface FastLaneState {
    // Connection
    state: TradingState;
    mode: TradingMode;
    isConnected: boolean;
    isAuthorized: boolean;

    // Data
    currentTick: TickData | null;
    tickHistory: TickData[];
    balance: BalanceData | null;

    // Trading
    activeTrade: ContractData | null;
    proposal: ProposalResponse | null;

    // History
    tradeHistory: TradeResult[];
    executionLogs: ExecutionLog[];
    errors: ErrorData[];

    // Risk
    tradesThisMinute: number;
    lastTradeTime: number;

    // Config
    apiToken: string;
    selectedSymbol: string;
    stake: number;
    riskLimits: RiskLimits;
}
