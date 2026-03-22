/**
 * Risk Manager - Enforce trading risk limits and circuit breakers
 */

export interface RiskConfig {
    stopLoss: number; // Maximum loss in USD
    takeProfit: number; // Target profit in USD
    maxConsecutiveLosses: number; // Circuit breaker
    dailyLossLimit: number; // Maximum daily loss
    maxStakePercent: number; // Max stake as % of balance
}

export interface Transaction {
    id: string;
    stake: number;
    profit: number;
    outcome: 'win' | 'loss';
    timestamp: number;
}

export interface RiskMetrics {
    currentDrawdown: number;
    maxDrawdown: number;
    dailyLoss: number;
    consecutiveLosses: number;
    riskLevel: 'low' | 'medium' | 'high';
    totalProfit: number;
}

export class RiskManager {
    private config: RiskConfig;
    private transactions: Transaction[] = [];
    private consecutiveLosses: number = 0;
    private sessionStartTime: number = Date.now();

    constructor(config: RiskConfig) {
        this.config = config;
    }

    /**
     * Check if trading is allowed based on all risk limits
     */
    canTrade(stake: number, balance: number): boolean {
        // Check if stake is within limits
        if (!this.validateStake(stake, balance)) {
            return false;
        }

        // Check stop loss
        if (this.checkStopLoss(this.getTotalProfit())) {
            return false;
        }

        // Check take profit
        if (this.checkTakeProfit(this.getTotalProfit())) {
            return false;
        }

        // Check consecutive losses
        if (this.checkConsecutiveLosses(this.consecutiveLosses)) {
            return false;
        }

        // Check daily limit
        if (this.checkDailyLimit(this.getDailyLoss())) {
            return false;
        }

        return true;
    }

    /**
     * Validate stake amount
     */
    validateStake(stake: number, balance: number): boolean {
        if (stake <= 0) {
            return false;
        }

        if (stake > balance) {
            return false;
        }

        const maxStake = balance * (this.config.maxStakePercent / 100);
        if (stake > maxStake) {
            return false;
        }

        return true;
    }

    /**
     * Check if stop loss limit is hit
     */
    checkStopLoss(currentLoss: number): boolean {
        if (this.config.stopLoss <= 0) {
            return false; // Stop loss disabled
        }

        return currentLoss <= -Math.abs(this.config.stopLoss);
    }

    /**
     * Check if take profit target is reached
     */
    checkTakeProfit(currentProfit: number): boolean {
        if (this.config.takeProfit <= 0) {
            return false; // Take profit disabled
        }

        return currentProfit >= this.config.takeProfit;
    }

    /**
     * Check if consecutive losses limit is hit
     */
    checkConsecutiveLosses(losses: number): boolean {
        if (this.config.maxConsecutiveLosses <= 0) {
            return false; // Circuit breaker disabled
        }

        return losses >= this.config.maxConsecutiveLosses;
    }

    /**
     * Check if daily loss limit is hit
     */
    checkDailyLimit(dailyLoss: number): boolean {
        if (this.config.dailyLossLimit <= 0) {
            return false; // Daily limit disabled
        }

        return dailyLoss <= -Math.abs(this.config.dailyLossLimit);
    }

    /**
     * Record a trade result
     */
    recordTrade(transaction: Transaction): void {
        this.transactions.push(transaction);

        if (transaction.outcome === 'loss') {
            this.consecutiveLosses++;
        } else {
            this.consecutiveLosses = 0;
        }
    }

    /**
     * Calculate position size based on risk percentage
     */
    calculatePositionSize(balance: number, riskPercent: number): number {
        const maxStake = balance * (riskPercent / 100);
        return Math.max(0.35, Math.min(maxStake, balance)); // Min $0.35, max balance
    }

    /**
     * Calculate maximum drawdown from transaction history
     */
    calculateMaxDrawdown(trades: Transaction[]): number {
        if (trades.length === 0) {
            return 0;
        }

        let peak = 0;
        let maxDrawdown = 0;
        let runningTotal = 0;

        for (const trade of trades) {
            runningTotal += trade.profit;

            if (runningTotal > peak) {
                peak = runningTotal;
            }

            const drawdown = peak - runningTotal;
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
            }
        }

        return maxDrawdown;
    }

    /**
     * Get total profit/loss
     */
    getTotalProfit(): number {
        return this.transactions.reduce((sum, t) => sum + t.profit, 0);
    }

    /**
     * Get daily loss (negative profit for today)
     */
    getDailyLoss(): number {
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        const todayTrades = this.transactions.filter(t => t.timestamp >= oneDayAgo);
        const dailyProfit = todayTrades.reduce((sum, t) => sum + t.profit, 0);
        return dailyProfit < 0 ? dailyProfit : 0;
    }

    /**
     * Get current risk metrics
     */
    getMetrics(): RiskMetrics {
        const totalProfit = this.getTotalProfit();
        const maxDrawdown = this.calculateMaxDrawdown(this.transactions);
        const currentDrawdown = this.calculateCurrentDrawdown();
        const dailyLoss = this.getDailyLoss();

        return {
            currentDrawdown,
            maxDrawdown,
            dailyLoss,
            consecutiveLosses: this.consecutiveLosses,
            riskLevel: this.calculateRiskLevel(),
            totalProfit,
        };
    }

    /**
     * Calculate current drawdown
     */
    private calculateCurrentDrawdown(): number {
        if (this.transactions.length === 0) {
            return 0;
        }

        let peak = 0;
        let runningTotal = 0;

        for (const trade of this.transactions) {
            runningTotal += trade.profit;
            if (runningTotal > peak) {
                peak = runningTotal;
            }
        }

        return Math.max(0, peak - runningTotal);
    }

    /**
     * Calculate risk level based on current metrics
     */
    private calculateRiskLevel(): 'low' | 'medium' | 'high' {
        const metrics = {
            stopLossPercent:
                this.config.stopLoss > 0 ? Math.abs(this.getTotalProfit() / this.config.stopLoss) * 100 : 0,
            consecutiveLossPercent:
                this.config.maxConsecutiveLosses > 0
                    ? (this.consecutiveLosses / this.config.maxConsecutiveLosses) * 100
                    : 0,
            dailyLossPercent:
                this.config.dailyLossLimit > 0 ? Math.abs(this.getDailyLoss() / this.config.dailyLossLimit) * 100 : 0,
        };

        const maxPercent = Math.max(metrics.stopLossPercent, metrics.consecutiveLossPercent, metrics.dailyLossPercent);

        if (maxPercent >= 80) {
            return 'high';
        } else if (maxPercent >= 50) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    /**
     * Reset risk manager state
     */
    reset(): void {
        this.transactions = [];
        this.consecutiveLosses = 0;
        this.sessionStartTime = Date.now();
    }

    /**
     * Update risk configuration
     */
    updateConfig(config: Partial<RiskConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Get current configuration
     */
    getConfig(): RiskConfig {
        return { ...this.config };
    }

    /**
     * Get reason why trading is blocked (if any)
     */
    getBlockReason(stake: number, balance: number): string | null {
        if (!this.validateStake(stake, balance)) {
            const maxStake = balance * (this.config.maxStakePercent / 100);
            return `Stake exceeds limit. Max: $${maxStake.toFixed(2)}`;
        }

        if (this.checkStopLoss(this.getTotalProfit())) {
            return `Stop loss hit: $${this.getTotalProfit().toFixed(2)}`;
        }

        if (this.checkTakeProfit(this.getTotalProfit())) {
            return `Take profit reached: $${this.getTotalProfit().toFixed(2)}`;
        }

        if (this.checkConsecutiveLosses(this.consecutiveLosses)) {
            return `Circuit breaker: ${this.consecutiveLosses} consecutive losses`;
        }

        if (this.checkDailyLimit(this.getDailyLoss())) {
            return `Daily loss limit hit: $${this.getDailyLoss().toFixed(2)}`;
        }

        return null;
    }
}
