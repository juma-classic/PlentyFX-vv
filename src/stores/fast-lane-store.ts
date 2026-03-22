/**
 * Fast Lane Centralized State Store
 * Manages all state for the tick-based trading system
 */

import { makeAutoObservable } from 'mobx';
import {
    BalanceData,
    ContractData,
    ErrorData,
    ExecutionLog,
    ProposalResponse,
    RiskLimits,
    TickData,
    TradeResult,
    TradingMode,
    TradingState,
} from '@/types/fast-lane.types';

export class FastLaneStore {
    // State
    state: TradingState = TradingState.DISCONNECTED;
    mode: TradingMode = TradingMode.DEMO; // Default: DEMO
    isConnected = false;
    isAuthorized = false;

    // Data
    currentTick: TickData | null = null;
    tickHistory: TickData[] = [];
    balance: BalanceData | null = null;

    // Trading
    activeTrade: ContractData | null = null;
    proposal: ProposalResponse | null = null;

    // History
    tradeHistory: TradeResult[] = [];
    executionLogs: ExecutionLog[] = [];
    errors: ErrorData[] = [];

    // Risk
    tradesThisMinute = 0;
    lastTradeTime = 0;

    // Config
    apiToken = '';
    selectedSymbol = 'R_100';
    stake = 1;
    riskLimits: RiskLimits = {
        maxTradesPerMinute: 10,
        cooldownMs: 6000, // 6 seconds
        minBalance: 10,
        maxStake: 100,
    };

    constructor() {
        makeAutoObservable(this);
    }

    // State Management
    setState(newState: TradingState) {
        this.state = newState;
        this.addLog('info', `State changed to: ${newState}`);
    }

    setMode(mode: TradingMode) {
        this.mode = mode;
        this.addLog('warning', `Trading mode changed to: ${mode.toUpperCase()}`);
    }

    setConnected(connected: boolean) {
        this.isConnected = connected;
        if (connected) {
            this.setState(TradingState.CONNECTED);
        } else {
            this.setState(TradingState.DISCONNECTED);
        }
    }

    setAuthorized(authorized: boolean) {
        this.isAuthorized = authorized;
        if (authorized) {
            this.setState(TradingState.AUTHORIZED);
        }
    }

    // Data Management
    updateTick(tick: TickData) {
        this.currentTick = tick;
        this.tickHistory.push(tick);

        // Keep last 100 ticks
        if (this.tickHistory.length > 100) {
            this.tickHistory.shift();
        }
    }

    updateBalance(balance: BalanceData) {
        this.balance = balance;
    }

    setProposal(proposal: ProposalResponse | null) {
        this.proposal = proposal;
    }

    setActiveTrade(trade: ContractData | null) {
        this.activeTrade = trade;
    }

    // Trade Management
    addTradeResult(result: TradeResult) {
        this.tradeHistory.push(result);
        this.addLog('success', `Trade completed: ${result.status} | Profit: ${result.profit}`);
    }

    // Logging
    addLog(type: ExecutionLog['type'], message: string, data?: unknown) {
        const log: ExecutionLog = {
            timestamp: Date.now(),
            type,
            message,
            data,
        };

        this.executionLogs.push(log);

        // Keep last 100 logs
        if (this.executionLogs.length > 100) {
            this.executionLogs.shift();
        }

        console.log(`[FastLane ${type.toUpperCase()}]`, message, data || '');
    }

    addError(code: string, message: string) {
        const error: ErrorData = {
            code,
            message,
            timestamp: Date.now(),
        };

        this.errors.push(error);
        this.addLog('error', `Error ${code}: ${message}`);

        // Keep last 50 errors
        if (this.errors.length > 50) {
            this.errors.shift();
        }
    }

    // Risk Management
    incrementTradeCount() {
        this.tradesThisMinute++;
        this.lastTradeTime = Date.now();

        // Reset counter after 1 minute
        setTimeout(() => {
            if (this.tradesThisMinute > 0) {
                this.tradesThisMinute--;
            }
        }, 60000);
    }

    canTrade(): boolean {
        // Check trade limit
        if (this.tradesThisMinute >= this.riskLimits.maxTradesPerMinute) {
            this.addLog('warning', 'Trade limit reached for this minute');
            return false;
        }

        // Check cooldown
        const timeSinceLastTrade = Date.now() - this.lastTradeTime;
        if (timeSinceLastTrade < this.riskLimits.cooldownMs) {
            this.addLog(
                'warning',
                `Cooldown active: ${Math.ceil((this.riskLimits.cooldownMs - timeSinceLastTrade) / 1000)}s remaining`
            );
            return false;
        }

        // Check balance
        if (this.balance && this.balance.balance < this.riskLimits.minBalance) {
            this.addLog('error', 'Insufficient balance');
            return false;
        }

        // Check if already in trade
        if (this.activeTrade) {
            this.addLog('warning', 'Trade already active');
            return false;
        }

        return true;
    }

    // Config
    setApiToken(token: string) {
        this.apiToken = token;
    }

    setSymbol(symbol: string) {
        this.selectedSymbol = symbol;
    }

    setStake(stake: number) {
        this.stake = stake;
    }

    // Additional properties for Phase 2
    lastTick: TickData | null = null;
    currentState: TradingState = TradingState.DISCONNECTED;
    config = {
        symbol: 'R_100',
        stake: 1,
        duration: 1,
        durationUnit: 't' as const,
        autoTrade: false,
        autoBuy: true,
        strategy: {
            type: 'DIGIT_OVER' as const,
            barrier: 5,
        },
    };

    setLastTick(tick: TickData) {
        this.lastTick = tick;
        this.updateTick(tick);
    }

    setBalance(balance: number) {
        this.balance = {
            balance,
            currency: 'USD',
            loginid: '',
        };
    }

    setAutoTrade(enabled: boolean) {
        this.config.autoTrade = enabled;
    }

    addTrade(trade: any) {
        // eslint-disable-line @typescript-eslint/no-explicit-any
        const tradeResult: TradeResult = {
            contract_id: trade.id,
            profit: trade.profit || 0,
            status: trade.status === 'won' ? 'won' : 'lost',
            entry_price: trade.stake,
            exit_price: trade.payout || 0,
            duration: 0,
        };
        this.addTradeResult(tradeResult);
    }

    updateTrade(contractId: string, updates: any) {
        // eslint-disable-line @typescript-eslint/no-explicit-any
        const trade = this.tradeHistory.find(t => t.contract_id === contractId);
        if (trade) {
            Object.assign(trade, updates);
        }
    }

    updateSymbol(symbol: string) {
        this.selectedSymbol = symbol;
        this.config.symbol = symbol;
        this.addLog('info', `Symbol changed to: ${symbol}`);
    }

    updateStake(stake: number) {
        if (stake > this.riskLimits.maxStake) {
            this.addLog('warning', `Stake capped at maximum: ${this.riskLimits.maxStake}`);
            this.stake = this.riskLimits.maxStake;
            this.config.stake = this.riskLimits.maxStake;
        } else {
            this.stake = stake;
            this.config.stake = stake;
        }
    }

    // Reset
    reset() {
        this.state = TradingState.DISCONNECTED;
        this.isConnected = false;
        this.isAuthorized = false;
        this.currentTick = null;
        this.tickHistory = [];
        this.balance = null;
        this.activeTrade = null;
        this.proposal = null;
        this.tradesThisMinute = 0;
        this.lastTradeTime = 0;
        this.addLog('info', 'Store reset');
    }

    // Getters
    get statistics() {
        const wins = this.tradeHistory.filter(t => t.status === 'won').length;
        const losses = this.tradeHistory.filter(t => t.status === 'lost').length;
        const totalProfit = this.tradeHistory.reduce((sum, t) => sum + t.profit, 0);

        return {
            totalTrades: this.tradeHistory.length,
            wins,
            losses,
            winRate: this.tradeHistory.length > 0 ? (wins / this.tradeHistory.length) * 100 : 0,
            totalProfit,
        };
    }

    get recentLogs() {
        return this.executionLogs.slice(-20);
    }

    get recentErrors() {
        return this.errors.slice(-10);
    }
}

export const fastLaneStore = new FastLaneStore();
