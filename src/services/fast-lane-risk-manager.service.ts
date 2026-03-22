import { makeAutoObservable } from 'mobx';
import { FastLaneStore } from '@/stores/fast-lane-store';
import type { TradeDecision } from '@/types/fast-lane.types';

/**
 * Risk Manager Service
 * Gates all trade execution with safety checks
 * Enforces rate limits, balance checks, and risk controls
 */
export class FastLaneRiskManager {
    private store: FastLaneStore;
    private tradeTimestamps: number[] = [];
    private lastTradeTime: number = 0;

    constructor(store: FastLaneStore) {
        this.store = store;
        makeAutoObservable(this);
    }

    /**
     * Primary gate: Can we execute a trade right now?
     */
    canExecuteTrade(): TradeDecision {
        // Check if system is in correct state
        if (!this.isSystemReady()) {
            return {
                allowed: false,
                reason: 'System not ready - must be in IDLE state',
            };
        }

        // Check balance
        const balanceCheck = this.checkBalance();
        if (!balanceCheck.allowed) {
            return balanceCheck;
        }

        // Check rate limits
        const rateLimitCheck = this.checkRateLimits();
        if (!rateLimitCheck.allowed) {
            return rateLimitCheck;
        }

        // Check cooldown
        const cooldownCheck = this.checkCooldown();
        if (!cooldownCheck.allowed) {
            return cooldownCheck;
        }

        // Check max trades per session
        const sessionLimitCheck = this.checkSessionLimits();
        if (!sessionLimitCheck.allowed) {
            return sessionLimitCheck;
        }

        return { allowed: true };
    }

    /**
     * Check if system is in correct state for trading
     */
    private isSystemReady(): boolean {
        const state = this.store.currentState;
        return state === 'IDLE' || state === 'SUBSCRIBED';
    }

    /**
     * Check if balance is sufficient
     */
    private checkBalance(): TradeDecision {
        const { balance, config } = this.store;

        if (balance === null) {
            return {
                allowed: false,
                reason: 'Balance not available',
            };
        }

        if (balance < config.stake) {
            return {
                allowed: false,
                reason: `Insufficient balance: ${balance} < ${config.stake}`,
            };
        }

        // Safety buffer: require 2x stake minimum
        if (balance < config.stake * 2) {
            return {
                allowed: false,
                reason: `Balance too low for safe trading: ${balance} < ${config.stake * 2}`,
            };
        }

        return { allowed: true };
    }

    /**
     * Check rate limits (trades per minute)
     */
    private checkRateLimits(): TradeDecision {
        const limits = this.store.riskLimits;
        const now = Date.now();
        const oneMinuteAgo = now - 60000;

        // Clean old timestamps
        this.tradeTimestamps = this.tradeTimestamps.filter(ts => ts > oneMinuteAgo);

        if (this.tradeTimestamps.length >= limits.maxTradesPerMinute) {
            return {
                allowed: false,
                reason: `Rate limit exceeded: ${this.tradeTimestamps.length}/${limits.maxTradesPerMinute} trades per minute`,
            };
        }

        return { allowed: true };
    }

    /**
     * Check cooldown between trades
     */
    private checkCooldown(): TradeDecision {
        const limits = this.store.riskLimits;
        const now = Date.now();
        const timeSinceLastTrade = now - this.lastTradeTime;

        if (this.lastTradeTime > 0 && timeSinceLastTrade < limits.cooldownMs) {
            const remainingMs = limits.cooldownMs - timeSinceLastTrade;
            return {
                allowed: false,
                reason: `Cooldown active: ${Math.ceil(remainingMs / 1000)}s remaining`,
            };
        }

        return { allowed: true };
    }

    /**
     * Check session limits
     */
    private checkSessionLimits(): TradeDecision {
        const limits = this.store.riskLimits;
        const totalTrades = this.store.tradeHistory.length;

        if (limits.maxTradesPerSession && totalTrades >= limits.maxTradesPerSession) {
            return {
                allowed: false,
                reason: `Session limit reached: ${totalTrades}/${limits.maxTradesPerSession} trades`,
            };
        }

        return { allowed: true };
    }

    /**
     * Record a trade execution
     */
    recordTrade(): void {
        const now = Date.now();
        this.tradeTimestamps.push(now);
        this.lastTradeTime = now;
    }

    /**
     * Reset rate limiting counters
     */
    reset(): void {
        this.tradeTimestamps = [];
        this.lastTradeTime = 0;
    }

    /**
     * Get current rate limit status
     */
    getRateLimitStatus(): {
        tradesInLastMinute: number;
        maxTradesPerMinute: number;
        cooldownRemaining: number;
    } {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        const tradesInLastMinute = this.tradeTimestamps.filter(ts => ts > oneMinuteAgo).length;
        const cooldownRemaining = Math.max(0, this.store.riskLimits.cooldownMs - (now - this.lastTradeTime));

        return {
            tradesInLastMinute,
            maxTradesPerMinute: this.store.riskLimits.maxTradesPerMinute,
            cooldownRemaining,
        };
    }
}
