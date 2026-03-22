/**
 * Risk Manager Service
 * Implements comprehensive risk management for real-world trading
 */

export interface RiskLimits {
    maxStakePerTrade: number;
    maxDailyLoss: number;
    maxConsecutiveLosses: number;
    maxOpenPositions: number;
    maxDailyTrades: number;
    cooldownPeriod: number; // minutes
    emergencyStopLoss: number; // percentage of balance
}

export interface TradeRisk {
    tradeId: string;
    symbol: string;
    amount: number;
    timestamp: number;
    result?: 'win' | 'loss' | 'pending';
    payout?: number;
}

export interface RiskStatus {
    canTrade: boolean;
    reason?: string;
    dailyLoss: number;
    consecutiveLosses: number;
    openPositions: number;
    dailyTrades: number;
    lastTradeTime: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface AccountRisk {
    balance: number;
    currency: string;
    totalExposure: number;
    availableBalance: number;
    riskPercentage: number;
}

export class RiskManagerService {
    private static instance: RiskManagerService;
    private riskLimits: RiskLimits;
    private tradeHistory: TradeRisk[] = [];
    private dailyStats = {
        date: new Date().toDateString(),
        totalLoss: 0,
        totalProfit: 0,
        tradeCount: 0,
        consecutiveLosses: 0,
    };
    private isEmergencyStop = false;
    private cooldownUntil = 0;

    static getInstance(): RiskManagerService {
        if (!RiskManagerService.instance) {
            RiskManagerService.instance = new RiskManagerService();
        }
        return RiskManagerService.instance;
    }

    constructor() {
        // Default conservative risk limits
        this.riskLimits = {
            maxStakePerTrade: 10, // $10 max per trade
            maxDailyLoss: 100, // $100 max daily loss
            maxConsecutiveLosses: 5, // Stop after 5 consecutive losses
            maxOpenPositions: 3, // Max 3 open positions
            maxDailyTrades: 50, // Max 50 trades per day
            cooldownPeriod: 5, // 5 minutes cooldown after consecutive losses
            emergencyStopLoss: 20, // Stop if 20% of balance lost
        };

        this.loadStoredData();
    }

    /**
     * Configure risk limits
     */
    setRiskLimits(limits: Partial<RiskLimits>): void {
        this.riskLimits = { ...this.riskLimits, ...limits };
        this.saveRiskLimits();
    }

    /**
     * Get current risk limits
     */
    getRiskLimits(): RiskLimits {
        return { ...this.riskLimits };
    }

    /**
     * Validate if a trade can be executed
     */
    validateTrade(amount: number, accountBalance: number): RiskStatus {
        this.updateDailyStats();

        const status: RiskStatus = {
            canTrade: true,
            dailyLoss: this.dailyStats.totalLoss,
            consecutiveLosses: this.dailyStats.consecutiveLosses,
            openPositions: this.getOpenPositionsCount(),
            dailyTrades: this.dailyStats.tradeCount,
            lastTradeTime: this.getLastTradeTime(),
            riskLevel: this.calculateRiskLevel(accountBalance),
        };

        // Check emergency stop
        if (this.isEmergencyStop) {
            status.canTrade = false;
            status.reason = 'Emergency stop activated - contact support';
            return status;
        }

        // Check cooldown period
        if (Date.now() < this.cooldownUntil) {
            status.canTrade = false;
            status.reason = `Cooldown period active until ${new Date(this.cooldownUntil).toLocaleTimeString()}`;
            return status;
        }

        // Check stake amount
        if (amount > this.riskLimits.maxStakePerTrade) {
            status.canTrade = false;
            status.reason = `Stake amount exceeds limit of $${this.riskLimits.maxStakePerTrade}`;
            return status;
        }

        // Check daily loss limit
        if (this.dailyStats.totalLoss >= this.riskLimits.maxDailyLoss) {
            status.canTrade = false;
            status.reason = `Daily loss limit of $${this.riskLimits.maxDailyLoss} reached`;
            return status;
        }

        // Check consecutive losses
        if (this.dailyStats.consecutiveLosses >= this.riskLimits.maxConsecutiveLosses) {
            status.canTrade = false;
            status.reason = `Maximum consecutive losses (${this.riskLimits.maxConsecutiveLosses}) reached`;
            this.activateCooldown();
            return status;
        }

        // Check open positions
        if (this.getOpenPositionsCount() >= this.riskLimits.maxOpenPositions) {
            status.canTrade = false;
            status.reason = `Maximum open positions (${this.riskLimits.maxOpenPositions}) reached`;
            return status;
        }

        // Check daily trade limit
        if (this.dailyStats.tradeCount >= this.riskLimits.maxDailyTrades) {
            status.canTrade = false;
            status.reason = `Daily trade limit of ${this.riskLimits.maxDailyTrades} reached`;
            return status;
        }

        // Check emergency stop loss
        const balanceLossPercentage = (this.dailyStats.totalLoss / accountBalance) * 100;
        if (balanceLossPercentage >= this.riskLimits.emergencyStopLoss) {
            this.activateEmergencyStop();
            status.canTrade = false;
            status.reason = `Emergency stop: ${this.riskLimits.emergencyStopLoss}% balance loss reached`;
            return status;
        }

        // Check if trade would exceed daily loss limit
        if (this.dailyStats.totalLoss + amount > this.riskLimits.maxDailyLoss) {
            status.canTrade = false;
            status.reason = 'Trade would exceed daily loss limit';
            return status;
        }

        return status;
    }

    /**
     * Record a trade execution
     */
    recordTrade(trade: TradeRisk): void {
        this.tradeHistory.push(trade);
        this.updateDailyStats();
        this.saveTradeHistory();
    }

    /**
     * Update trade result
     */
    updateTradeResult(tradeId: string, result: 'win' | 'loss', payout?: number): void {
        const trade = this.tradeHistory.find(t => t.tradeId === tradeId);
        if (trade) {
            trade.result = result;
            trade.payout = payout || 0;
            this.updateDailyStats();
            this.saveTradeHistory();
        }
    }

    /**
     * Calculate current risk level
     */
    private calculateRiskLevel(accountBalance: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
        const lossPercentage = (this.dailyStats.totalLoss / accountBalance) * 100;
        const consecutiveLossRatio = this.dailyStats.consecutiveLosses / this.riskLimits.maxConsecutiveLosses;

        if (lossPercentage >= 15 || consecutiveLossRatio >= 0.8) {
            return 'CRITICAL';
        } else if (lossPercentage >= 10 || consecutiveLossRatio >= 0.6) {
            return 'HIGH';
        } else if (lossPercentage >= 5 || consecutiveLossRatio >= 0.4) {
            return 'MEDIUM';
        }
        return 'LOW';
    }

    /**
     * Update daily statistics
     */
    private updateDailyStats(): void {
        const today = new Date().toDateString();

        // Reset stats if new day
        if (this.dailyStats.date !== today) {
            this.dailyStats = {
                date: today,
                totalLoss: 0,
                totalProfit: 0,
                tradeCount: 0,
                consecutiveLosses: 0,
            };
        }

        // Calculate stats from today's trades
        const todayTrades = this.tradeHistory.filter(trade => new Date(trade.timestamp).toDateString() === today);

        this.dailyStats.tradeCount = todayTrades.length;
        this.dailyStats.totalLoss = 0;
        this.dailyStats.totalProfit = 0;
        this.dailyStats.consecutiveLosses = 0;

        let consecutiveLosses = 0;
        for (let i = todayTrades.length - 1; i >= 0; i--) {
            const trade = todayTrades[i];
            if (trade.result === 'loss') {
                this.dailyStats.totalLoss += trade.amount;
                consecutiveLosses++;
            } else if (trade.result === 'win') {
                this.dailyStats.totalProfit += (trade.payout || 0) - trade.amount;
                break; // Stop counting consecutive losses
            }
        }
        this.dailyStats.consecutiveLosses = consecutiveLosses;
    }

    /**
     * Get open positions count
     */
    private getOpenPositionsCount(): number {
        return this.tradeHistory.filter(trade => trade.result === 'pending').length;
    }

    /**
     * Get last trade time
     */
    private getLastTradeTime(): number {
        if (this.tradeHistory.length === 0) return 0;
        return Math.max(...this.tradeHistory.map(trade => trade.timestamp));
    }

    /**
     * Activate cooldown period
     */
    private activateCooldown(): void {
        this.cooldownUntil = Date.now() + this.riskLimits.cooldownPeriod * 60 * 1000;
        console.warn(`🚨 Risk cooldown activated until ${new Date(this.cooldownUntil).toLocaleTimeString()}`);
    }

    /**
     * Activate emergency stop
     */
    private activateEmergencyStop(): void {
        this.isEmergencyStop = true;
        console.error('🚨 EMERGENCY STOP ACTIVATED - All trading suspended');
        // Could send notification to user/admin here
    }

    /**
     * Deactivate emergency stop (admin only)
     */
    deactivateEmergencyStop(adminCode: string): boolean {
        // In real implementation, verify admin credentials
        if (adminCode === 'ADMIN_OVERRIDE_2024') {
            this.isEmergencyStop = false;
            console.log('✅ Emergency stop deactivated by admin');
            return true;
        }
        return false;
    }

    /**
     * Get comprehensive risk report
     */
    getRiskReport(accountBalance: number): any {
        this.updateDailyStats();

        return {
            riskStatus: this.validateTrade(0, accountBalance),
            dailyStats: { ...this.dailyStats },
            riskLimits: { ...this.riskLimits },
            accountRisk: {
                balance: accountBalance,
                totalExposure: this.getOpenPositionsCount() * this.riskLimits.maxStakePerTrade,
                riskPercentage: (this.dailyStats.totalLoss / accountBalance) * 100,
            },
            emergencyStop: this.isEmergencyStop,
            cooldownActive: Date.now() < this.cooldownUntil,
            cooldownUntil: this.cooldownUntil,
        };
    }

    /**
     * Save risk limits to localStorage
     */
    private saveRiskLimits(): void {
        localStorage.setItem('tickSpeed_riskLimits', JSON.stringify(this.riskLimits));
    }

    /**
     * Save trade history to localStorage
     */
    private saveTradeHistory(): void {
        // Keep only last 1000 trades to prevent storage bloat
        const recentTrades = this.tradeHistory.slice(-1000);
        localStorage.setItem('tickSpeed_tradeHistory', JSON.stringify(recentTrades));
    }

    /**
     * Load stored data from localStorage
     */
    private loadStoredData(): void {
        try {
            const storedLimits = localStorage.getItem('tickSpeed_riskLimits');
            if (storedLimits) {
                this.riskLimits = { ...this.riskLimits, ...JSON.parse(storedLimits) };
            }

            const storedHistory = localStorage.getItem('tickSpeed_tradeHistory');
            if (storedHistory) {
                this.tradeHistory = JSON.parse(storedHistory);
            }
        } catch (error) {
            console.error('Error loading stored risk data:', error);
        }
    }

    /**
     * Reset all risk data (use with caution)
     */
    resetRiskData(): void {
        this.tradeHistory = [];
        this.dailyStats = {
            date: new Date().toDateString(),
            totalLoss: 0,
            totalProfit: 0,
            tradeCount: 0,
            consecutiveLosses: 0,
        };
        this.isEmergencyStop = false;
        this.cooldownUntil = 0;
        localStorage.removeItem('tickSpeed_tradeHistory');
        console.log('✅ Risk data reset');
    }
}
