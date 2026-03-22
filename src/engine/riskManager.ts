/**
 * Risk & Throttling Manager
 * Enforces trading limits and safety controls
 * Prevents system overload and implements risk management
 */

export interface RiskLimits {
    maxTradesPerTick: number;
    maxTradesPerMinute: number;
    maxTradesPerHour: number;
    cooldownBetweenTrades: number; // milliseconds
    maxConcurrentTrades: number;
    maxDailyLoss: number;
    maxStakePerTrade: number;
    emergencyStopLoss: number; // Auto-disable if loss exceeds this
}

export interface RiskStats {
    tradesThisTick: number;
    tradesThisMinute: number;
    tradesThisHour: number;
    tradesThisDay: number;
    lastTradeTime: number;
    currentConcurrentTrades: number;
    dailyPnL: number;
    isEmergencyStop: boolean;
    violations: string[];
}

export class RiskManager {
    private limits: RiskLimits;
    private stats: RiskStats = {
        tradesThisTick: 0,
        tradesThisMinute: 0,
        tradesThisHour: 0,
        tradesThisDay: 0,
        lastTradeTime: 0,
        currentConcurrentTrades: 0,
        dailyPnL: 0,
        isEmergencyStop: false,
        violations: [],
    };

    private tradeHistory: Array<{
        timestamp: number;
        stake: number;
        pnl: number;
    }> = [];

    private tickTradeCount = 0;
    private lastTickTime = 0;
    private emergencyStopCallbacks: (() => void)[] = [];

    constructor(limits: RiskLimits) {
        this.limits = limits;
        console.log('🛡️ Risk Manager initialized with limits:', limits);
    }

    /**
     * Check if a trade is allowed based on risk limits
     */
    public canTrade(stake: number): { allowed: boolean; reason?: string } {
        const now = Date.now();
        this.updateTimeBasedCounters(now);

        // Check emergency stop
        if (this.stats.isEmergencyStop) {
            return { allowed: false, reason: 'Emergency stop active' };
        }

        // Check stake limit
        if (stake > this.limits.maxStakePerTrade) {
            return {
                allowed: false,
                reason: `Stake ${stake} exceeds limit ${this.limits.maxStakePerTrade}`,
            };
        }

        // Check cooldown
        const timeSinceLastTrade = now - this.stats.lastTradeTime;
        if (timeSinceLastTrade < this.limits.cooldownBetweenTrades) {
            return {
                allowed: false,
                reason: `Cooldown active: ${this.limits.cooldownBetweenTrades - timeSinceLastTrade}ms remaining`,
            };
        }

        // Check concurrent trades
        if (this.stats.currentConcurrentTrades >= this.limits.maxConcurrentTrades) {
            return {
                allowed: false,
                reason: `Max concurrent trades reached: ${this.limits.maxConcurrentTrades}`,
            };
        }

        // Check per-tick limit
        if (this.stats.tradesThisTick >= this.limits.maxTradesPerTick) {
            return {
                allowed: false,
                reason: `Max trades per tick reached: ${this.limits.maxTradesPerTick}`,
            };
        }

        // Check per-minute limit
        if (this.stats.tradesThisMinute >= this.limits.maxTradesPerMinute) {
            return {
                allowed: false,
                reason: `Max trades per minute reached: ${this.limits.maxTradesPerMinute}`,
            };
        }

        // Check per-hour limit
        if (this.stats.tradesThisHour >= this.limits.maxTradesPerHour) {
            return {
                allowed: false,
                reason: `Max trades per hour reached: ${this.limits.maxTradesPerHour}`,
            };
        }

        // Check daily loss limit
        if (this.stats.dailyPnL < -this.limits.maxDailyLoss) {
            this.triggerEmergencyStop('Daily loss limit exceeded');
            return {
                allowed: false,
                reason: `Daily loss limit exceeded: ${this.limits.maxDailyLoss}`,
            };
        }

        return { allowed: true };
    }

    /**
     * Record a trade execution
     */
    public recordTrade(stake: number): void {
        const now = Date.now();

        // Update counters
        this.stats.tradesThisTick++;
        this.stats.tradesThisMinute++;
        this.stats.tradesThisHour++;
        this.stats.tradesThisDay++;
        this.stats.lastTradeTime = now;
        this.stats.currentConcurrentTrades++;

        // Add to history
        this.tradeHistory.push({
            timestamp: now,
            stake,
            pnl: 0, // Will be updated when trade completes
        });

        // Keep history manageable
        if (this.tradeHistory.length > 10000) {
            this.tradeHistory.shift();
        }

        console.log('📊 Trade recorded:', {
            stake,
            tradesThisTick: this.stats.tradesThisTick,
            tradesThisMinute: this.stats.tradesThisMinute,
            concurrent: this.stats.currentConcurrentTrades,
        });
    }

    /**
     * Record trade completion (for P&L tracking)
     */
    public recordTradeCompletion(pnl: number): void {
        this.stats.currentConcurrentTrades = Math.max(0, this.stats.currentConcurrentTrades - 1);
        this.stats.dailyPnL += pnl;

        // Update the most recent trade in history
        if (this.tradeHistory.length > 0) {
            const lastTrade = this.tradeHistory[this.tradeHistory.length - 1];
            if (lastTrade.pnl === 0) {
                // Only update if not already set
                lastTrade.pnl = pnl;
            }
        }

        console.log('💰 Trade completed:', {
            pnl,
            dailyPnL: this.stats.dailyPnL,
            concurrent: this.stats.currentConcurrentTrades,
        });

        // Check emergency stop condition
        if (this.stats.dailyPnL < -this.limits.emergencyStopLoss) {
            this.triggerEmergencyStop('Emergency stop loss reached');
        }
    }

    /**
     * Update time-based counters
     */
    private updateTimeBasedCounters(now: number): void {
        const oneMinuteAgo = now - 60000;
        const oneHourAgo = now - 3600000;
        const oneDayAgo = now - 86400000;

        // Reset tick counter if this is a new tick
        if (now - this.lastTickTime > 1000) {
            // Assume new tick if >1 second
            this.stats.tradesThisTick = 0;
            this.lastTickTime = now;
        }

        // Count trades in the last minute
        this.stats.tradesThisMinute = this.tradeHistory.filter(trade => trade.timestamp > oneMinuteAgo).length;

        // Count trades in the last hour
        this.stats.tradesThisHour = this.tradeHistory.filter(trade => trade.timestamp > oneHourAgo).length;

        // Count trades in the last day
        this.stats.tradesThisDay = this.tradeHistory.filter(trade => trade.timestamp > oneDayAgo).length;

        // Calculate daily P&L
        this.stats.dailyPnL = this.tradeHistory
            .filter(trade => trade.timestamp > oneDayAgo)
            .reduce((sum, trade) => sum + trade.pnl, 0);
    }

    /**
     * Trigger emergency stop
     */
    private triggerEmergencyStop(reason: string): void {
        console.error('🚨 EMERGENCY STOP TRIGGERED:', reason);

        this.stats.isEmergencyStop = true;
        this.stats.violations.push(`${new Date().toISOString()}: ${reason}`);

        // Notify callbacks
        this.emergencyStopCallbacks.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error('❌ Error in emergency stop callback:', error);
            }
        });
    }

    /**
     * Reset emergency stop (manual override)
     */
    public resetEmergencyStop(): void {
        console.log('🔄 Emergency stop reset');
        this.stats.isEmergencyStop = false;
    }

    /**
     * Add emergency stop callback
     */
    public onEmergencyStop(callback: () => void): void {
        this.emergencyStopCallbacks.push(callback);
    }

    /**
     * Update risk limits
     */
    public updateLimits(newLimits: Partial<RiskLimits>): void {
        this.limits = { ...this.limits, ...newLimits };
        console.log('🛡️ Risk limits updated:', this.limits);
    }

    /**
     * Get current risk statistics
     */
    public getStats(): RiskStats {
        const now = Date.now();
        this.updateTimeBasedCounters(now);
        return { ...this.stats };
    }

    /**
     * Get risk limits
     */
    public getLimits(): RiskLimits {
        return { ...this.limits };
    }

    /**
     * Reset daily statistics
     */
    public resetDailyStats(): void {
        console.log('🔄 Resetting daily risk statistics');
        this.stats.tradesThisDay = 0;
        this.stats.dailyPnL = 0;
        this.stats.violations = [];

        // Clear old trade history
        const oneDayAgo = Date.now() - 86400000;
        this.tradeHistory = this.tradeHistory.filter(trade => trade.timestamp > oneDayAgo);
    }

    /**
     * Get violation history
     */
    public getViolations(): string[] {
        return [...this.stats.violations];
    }

    /**
     * Check system health
     */
    public getHealthStatus(): {
        status: 'healthy' | 'warning' | 'critical';
        issues: string[];
        recommendations: string[];
    } {
        const issues: string[] = [];
        const recommendations: string[] = [];
        let status: 'healthy' | 'warning' | 'critical' = 'healthy';

        // Check emergency stop
        if (this.stats.isEmergencyStop) {
            issues.push('Emergency stop is active');
            status = 'critical';
        }

        // Check daily P&L
        const lossPercentage = (Math.abs(this.stats.dailyPnL) / this.limits.maxDailyLoss) * 100;
        if (lossPercentage > 80) {
            issues.push(`Daily loss at ${lossPercentage.toFixed(1)}% of limit`);
            status = status === 'healthy' ? 'warning' : status;
            recommendations.push('Consider reducing trade frequency or stake size');
        }

        // Check trade frequency
        if (this.stats.tradesThisMinute > this.limits.maxTradesPerMinute * 0.8) {
            issues.push('High trade frequency detected');
            status = status === 'healthy' ? 'warning' : status;
            recommendations.push('Monitor for overtrading');
        }

        return { status, issues, recommendations };
    }
}
