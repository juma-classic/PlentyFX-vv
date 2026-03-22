/**
 * Smart Run Manager
 * Manages bot trading runs with intelligent stop conditions:
 * - Stop after X runs if in profit
 * - Continue until recovery or stop loss if in loss
 */

export interface SmartRunConfig {
    targetRuns: number; // Number of runs to complete
    stopOnWin: boolean; // Stop if in profit after target runs
    continueOnLoss: boolean; // Continue until recovery if in loss
    maxRecoveryRuns: number; // Max additional runs for recovery
    stopLossAmount: number; // Stop loss threshold
    initialBalance: number; // Starting balance
}

export interface RunStats {
    totalRuns: number;
    completedRuns: number;
    wins: number;
    losses: number;
    currentProfit: number;
    currentBalance: number;
    isRecoveryMode: boolean;
    recoveryRunsUsed: number;
    shouldStop: boolean;
    stopReason?: 'target_reached_profit' | 'recovery_complete' | 'stop_loss_hit' | 'max_recovery_reached';
}

export class SmartRunManager {
    private config: SmartRunConfig;
    private stats: RunStats;

    constructor(config: SmartRunConfig) {
        this.config = config;
        this.stats = {
            totalRuns: 0,
            completedRuns: 0,
            wins: 0,
            losses: 0,
            currentProfit: 0,
            currentBalance: config.initialBalance,
            isRecoveryMode: false,
            recoveryRunsUsed: 0,
            shouldStop: false,
        };
    }

    /**
     * Record a trade result
     */
    recordTrade(result: 'win' | 'loss', amount: number): void {
        this.stats.totalRuns++;
        this.stats.completedRuns++;

        if (result === 'win') {
            this.stats.wins++;
            this.stats.currentProfit += amount;
            this.stats.currentBalance += amount;
        } else {
            this.stats.losses++;
            this.stats.currentProfit -= amount;
            this.stats.currentBalance -= amount;
        }

        // Check if we should stop
        this.evaluateStopCondition();
    }

    /**
     * Evaluate whether bot should stop
     */
    private evaluateStopCondition(): void {
        // Check if target runs reached
        if (this.stats.completedRuns >= this.config.targetRuns && !this.stats.isRecoveryMode) {
            // If in profit and stopOnWin is enabled
            if (this.config.stopOnWin && this.stats.currentProfit > 0) {
                this.stats.shouldStop = true;
                this.stats.stopReason = 'target_reached_profit';
                return;
            }

            // If in loss and continueOnLoss is enabled, enter recovery mode
            if (this.config.continueOnLoss && this.stats.currentProfit < 0) {
                this.stats.isRecoveryMode = true;
                console.log('🔄 Entering recovery mode - attempting to recover losses');
                return;
            }

            // If neither condition met, stop anyway
            if (!this.config.continueOnLoss) {
                this.stats.shouldStop = true;
                this.stats.stopReason = 'target_reached_profit';
                return;
            }
        }

        // Check recovery mode conditions
        if (this.stats.isRecoveryMode) {
            this.stats.recoveryRunsUsed = this.stats.completedRuns - this.config.targetRuns;

            // Check if recovered (back to profit)
            if (this.stats.currentProfit >= 0) {
                this.stats.shouldStop = true;
                this.stats.stopReason = 'recovery_complete';
                console.log('✅ Recovery successful! Stopping bot.');
                return;
            }

            // Check if max recovery runs reached
            if (this.stats.recoveryRunsUsed >= this.config.maxRecoveryRuns) {
                this.stats.shouldStop = true;
                this.stats.stopReason = 'max_recovery_reached';
                console.log('⚠️ Max recovery runs reached. Stopping bot.');
                return;
            }
        }

        // Check stop loss
        const totalLoss = this.config.initialBalance - this.stats.currentBalance;
        if (totalLoss >= this.config.stopLossAmount) {
            this.stats.shouldStop = true;
            this.stats.stopReason = 'stop_loss_hit';
            console.log('🛑 Stop loss hit. Stopping bot.');
            return;
        }
    }

    /**
     * Check if bot should continue trading
     */
    shouldContinue(): boolean {
        return !this.stats.shouldStop;
    }

    /**
     * Get current statistics
     */
    getStats(): RunStats {
        return { ...this.stats };
    }

    /**
     * Get progress percentage
     */
    getProgress(): number {
        if (this.stats.isRecoveryMode) {
            return 100; // Show as complete, in recovery
        }
        return Math.min((this.stats.completedRuns / this.config.targetRuns) * 100, 100);
    }

    /**
     * Get status message
     */
    getStatusMessage(): string {
        if (this.stats.shouldStop) {
            switch (this.stats.stopReason) {
                case 'target_reached_profit':
                    return `✅ Target reached with profit! Stopped after ${this.stats.completedRuns} runs.`;
                case 'recovery_complete':
                    return `✅ Recovery successful! Stopped after ${this.stats.completedRuns} runs.`;
                case 'stop_loss_hit':
                    return `🛑 Stop loss hit. Stopped after ${this.stats.completedRuns} runs.`;
                case 'max_recovery_reached':
                    return `⚠️ Max recovery runs reached. Stopped after ${this.stats.completedRuns} runs.`;
                default:
                    return `Stopped after ${this.stats.completedRuns} runs.`;
            }
        }

        if (this.stats.isRecoveryMode) {
            return `🔄 Recovery Mode: ${this.stats.recoveryRunsUsed}/${this.config.maxRecoveryRuns} runs used`;
        }

        return `Running: ${this.stats.completedRuns}/${this.config.targetRuns} runs completed`;
    }

    /**
     * Reset the manager
     */
    reset(): void {
        this.stats = {
            totalRuns: 0,
            completedRuns: 0,
            wins: 0,
            losses: 0,
            currentProfit: 0,
            currentBalance: this.config.initialBalance,
            isRecoveryMode: false,
            recoveryRunsUsed: 0,
            shouldStop: false,
        };
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<SmartRunConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }
}

/**
 * Create a smart run manager with default settings
 */
export function createSmartRunManager(
    targetRuns: number = 10,
    initialBalance: number = 100,
    stopLossAmount: number = 50
): SmartRunManager {
    return new SmartRunManager({
        targetRuns,
        stopOnWin: true,
        continueOnLoss: true,
        maxRecoveryRuns: 20,
        stopLossAmount,
        initialBalance,
    });
}
