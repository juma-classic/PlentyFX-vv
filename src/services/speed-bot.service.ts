/**
 * Speed Bot Trading Service
 * Implements automated trading for the Speed Bot with tick-by-tick execution
 */

import { api_base } from '@/external/bot-skeleton/services/api/api-base';
import { derivAPIService } from './deriv-api.service';
import { masterTradeIntegrationService } from './master-trade-integration.service';

export interface SpeedBotConfig {
    market: string;
    stake: number;
    martingale: number;
    strategy: 'Over' | 'Under' | 'Even' | 'Odd' | 'Match' | 'Range';
    prediction: string;
    ticks: string;
    // Auto-stop features
    stopAfterWins?: number;
    stopAfterLosses?: number;
    targetProfit?: number;
    maxLoss?: number;
    maxRunTime?: number; // in minutes
    maxMartingaleLevel?: number;
    // Smart features
    autoSwitchToHot?: boolean;
    followTrend?: boolean;
    enableSoundAlerts?: boolean;
    enableNotifications?: boolean;
}

export interface SpeedBotStats {
    totalPL: number;
    runs: number;
    wins: number;
    losses: number;
    currentStake: number;
    isRunning: boolean;
    consecutiveWins: number;
    consecutiveLosses: number;
    winRate: number;
    startTime?: number;
    elapsedTime?: number;
}

export interface TradeUpdate {
    type: 'trade_complete' | 'trade_started' | 'error' | 'auto_stopped';
    profit?: number;
    isWin?: boolean;
    contractId?: number;
    error?: string;
    stopReason?: string;
}

export interface DigitStats {
    digit: number;
    count: number;
    percentage: number;
    isHot: boolean;
    isCold: boolean;
}

export interface PatternDetection {
    hotDigits: number[];
    coldDigits: number[];
    currentStreak: { digit: number; count: number } | null;
    trend: 'up' | 'down' | 'neutral';
    lastDigits: number[];
}

class SpeedBotService {
    private isRunning = false;
    private config: SpeedBotConfig | null = null;
    private stats: SpeedBotStats = {
        totalPL: 0,
        runs: 0,
        wins: 0,
        losses: 0,
        currentStake: 0,
        isRunning: false,
        consecutiveWins: 0,
        consecutiveLosses: 0,
        winRate: 0,
    };
    private tickSubscriptionId: string | null = null;
    private onStatsUpdate: ((stats: SpeedBotStats) => void) | null = null;
    private onTradeUpdate: ((update: TradeUpdate) => void) | null = null;
    private onPatternUpdate: ((pattern: PatternDetection) => void) | null = null;

    // Pattern detection
    private digitHistory: number[] = [];
    private digitCounts: Map<number, number> = new Map();
    private currentStreak: { digit: number; count: number } | null = null;

    // Auto-stop tracking
    private startTime: number = 0;
    private martingaleLevel: number = 0;

    /**
     * Start the Speed Bot
     */
    async start(
        config: SpeedBotConfig,
        callbacks?: {
            onStatsUpdate?: (stats: SpeedBotStats) => void;
            onTradeUpdate?: (update: TradeUpdate) => void;
            onPatternUpdate?: (pattern: PatternDetection) => void;
        }
    ): Promise<void> {
        if (this.isRunning) {
            throw new Error('Speed Bot is already running');
        }

        this.config = config;
        this.stats.currentStake = config.stake;
        this.isRunning = true;
        this.stats.isRunning = true;
        this.stats.consecutiveLosses = 0;
        this.stats.consecutiveWins = 0;
        this.startTime = Date.now();
        this.stats.startTime = this.startTime;
        this.martingaleLevel = 0;
        this.onStatsUpdate = callbacks?.onStatsUpdate || null;
        this.onTradeUpdate = callbacks?.onTradeUpdate || null;
        this.onPatternUpdate = callbacks?.onPatternUpdate || null;

        console.log('🚀 Speed Bot Started', config);

        // Request notification permission if enabled
        if (config.enableNotifications && 'Notification' in window) {
            Notification.requestPermission();
        }

        // Subscribe to ticks and start trading
        await this.subscribeToMarket();
    }

    /**
     * Stop the bot
     */
    async stop(): Promise<void> {
        this.isRunning = false;
        this.stats.isRunning = false;

        if (this.tickSubscriptionId) {
            await derivAPIService.unsubscribe(this.tickSubscriptionId);
            this.tickSubscriptionId = null;
        }

        console.log('🛑 Speed Bot Stopped');
        this.notifyStatsUpdate();
    }

    /**
     * Subscribe to market ticks
     */
    private async subscribeToMarket(): Promise<void> {
        if (!this.config) return;

        try {
            this.tickSubscriptionId =
                (await derivAPIService.subscribeToTicks(this.config.market, tickData => {
                    if (this.isRunning) {
                        this.handleTick(tickData);
                    }
                })) || null;
        } catch (error) {
            console.error('Error subscribing to market:', error);
            this.notifyTradeUpdate({
                type: 'error',
                error: 'Failed to subscribe to market',
            });
            this.stop();
        }
    }

    /**
     * Handle incoming tick data
     */
    private async handleTick(): Promise<void> {
        if (!this.config || !this.isRunning) return;

        // Place trade on every tick
        await this.placeTrade();
    }

    /**
     * Place a trade
     */
    private async placeTrade(): Promise<void> {
        if (!this.config || !this.isRunning) return;

        try {
            // Notify trade started
            this.notifyTradeUpdate({ type: 'trade_started' });

            // Get proposal
            const proposal = await this.getProposal();

            if (!proposal || !proposal.proposal) {
                console.error('Failed to get proposal');
                return;
            }

            // Buy the contract
            const buyResponse = await derivAPIService.buyContract(proposal.proposal.id, this.stats.currentStake);

            if (!buyResponse || !buyResponse.buy) {
                console.error('Error buying contract: No response');
                this.notifyTradeUpdate({
                    type: 'error',
                    error: 'Failed to buy contract',
                });
                return;
            }

            console.log('📈 Speed Bot Trade placed:', buyResponse.buy);

            // 🔗 COPY TRADING INTEGRATION: Execute copy trades for clients
            try {
                console.log('🔗 Triggering copy trading for Speed Bot trade...');
                await masterTradeIntegrationService.onSpeedBotTrade({
                    market: this.config.market,
                    contractType: contractType,
                    stake: this.stats.currentStake,
                    duration: parseInt(this.config.ticks),
                    durationUnit: 't',
                    contractId: buyResponse.buy.contract_id,
                });
                console.log('✅ Copy trading executed successfully');
            } catch (copyError) {
                console.error('❌ Copy trading failed:', copyError);
                // Don't fail the main trade if copy trading fails
            }

            // Monitor the contract
            if (buyResponse.buy?.contract_id) {
                await this.monitorContract(buyResponse.buy.contract_id);
            }
        } catch (error) {
            console.error('Error placing trade:', error);
            this.notifyTradeUpdate({
                type: 'error',
                error: (error as Error).message,
            });
        }
    }

    /**
     * Get proposal for the trade
     */
    private async getProposal(): Promise<any> {
        if (!this.config) return null;

        const contractType = this.config.strategy === 'Over' ? 'DIGITOVER' : 'DIGITUNDER';

        const proposal = {
            proposal: 1,
            amount: this.stats.currentStake,
            basis: 'stake',
            contract_type: contractType,
            currency: 'USD',
            duration: parseInt(this.config.ticks),
            duration_unit: 't',
            symbol: this.config.market,
            barrier: this.config.prediction,
        };

        try {
            return await api_base.api?.send(proposal);
        } catch (error) {
            console.error('Error getting proposal:', error);
            return null;
        }
    }

    /**
     * Monitor contract until completion
     */
    private async monitorContract(contractId: number): Promise<void> {
        try {
            const proposalOpenContract = {
                proposal_open_contract: 1,
                contract_id: contractId,
                subscribe: 1,
            };

            const response = await api_base.api?.send(proposalOpenContract);

            if (response?.subscription) {
                const subscription = api_base.api?.onMessage().subscribe((message: any) => {
                    if (message.proposal_open_contract?.contract_id === contractId) {
                        this.handleContractUpdate(message.proposal_open_contract);
                    }
                });

                api_base.pushSubscription({
                    id: response.subscription.id,
                    unsubscribe: () => subscription?.unsubscribe(),
                });
            }
        } catch (error) {
            console.error('Error monitoring contract:', error);
        }
    }

    /**
     * Handle contract updates
     */
    private handleContractUpdate(contract: any): void {
        if (contract.is_sold || contract.status === 'sold') {
            const profit = contract.profit || 0;
            const isWin = profit > 0;

            // Update stats
            this.stats.runs++;
            this.stats.totalPL += profit;

            if (isWin) {
                this.stats.wins++;
                this.stats.consecutiveLosses = 0;
                this.stats.consecutiveWins++;
                this.martingaleLevel = 0;
                // Reset stake on win
                this.stats.currentStake = this.config!.stake;

                // Play win sound
                if (this.config!.enableSoundAlerts) {
                    this.playSound('win');
                }
            } else {
                this.stats.losses++;
                this.stats.consecutiveLosses++;
                this.stats.consecutiveWins = 0;
                this.martingaleLevel++;

                // Apply martingale on loss (with max level check)
                if (this.config!.martingale > 1) {
                    const maxLevel = this.config!.maxMartingaleLevel || 10;
                    if (this.martingaleLevel < maxLevel) {
                        this.stats.currentStake = this.stats.currentStake * this.config!.martingale;
                    } else {
                        console.log(`⚠️ Max martingale level ${maxLevel} reached, resetting stake`);
                        this.stats.currentStake = this.config!.stake;
                        this.martingaleLevel = 0;
                    }
                }

                // Play loss sound
                if (this.config!.enableSoundAlerts) {
                    this.playSound('loss');
                }
            }

            // Update win rate
            this.stats.winRate = this.stats.runs > 0 ? (this.stats.wins / this.stats.runs) * 100 : 0;

            // Update elapsed time
            this.stats.elapsedTime = Date.now() - this.startTime;

            console.log(
                isWin ? '✅ Speed Bot Won' : '❌ Speed Bot Lost',
                `Profit: ${profit.toFixed(2)}, Total: ${this.stats.totalPL.toFixed(2)}`
            );

            // Check auto-stop conditions
            const stopReason = this.checkAutoStop();
            if (stopReason) {
                console.log(`🛑 Auto-stopping: ${stopReason}`);
                this.stop();
                this.notifyTradeUpdate({
                    type: 'auto_stopped',
                    stopReason,
                });

                // Send notification
                if (this.config!.enableNotifications) {
                    this.sendNotification('Speed Bot Stopped', stopReason);
                }

                return;
            }

            // Notify callbacks
            this.notifyStatsUpdate();
            this.notifyTradeUpdate({
                type: 'trade_complete',
                profit,
                isWin,
                contractId: contract.contract_id,
            });

            // Unsubscribe from this contract
            if (contract.subscription) {
                derivAPIService.unsubscribe(contract.subscription.id);
            }
        }
    }

    /**
     * Notify stats update
     */
    private notifyStatsUpdate(): void {
        if (this.onStatsUpdate) {
            this.onStatsUpdate({ ...this.stats });
        }
    }

    /**
     * Notify trade update
     */
    private notifyTradeUpdate(update: TradeUpdate): void {
        if (this.onTradeUpdate) {
            this.onTradeUpdate(update);
        }
    }

    /**
     * Get current stats
     */
    getStats(): SpeedBotStats {
        return { ...this.stats };
    }

    /**
     * Reset stats
     */
    resetStats(): void {
        this.stats = {
            totalPL: 0,
            runs: 0,
            wins: 0,
            losses: 0,
            currentStake: this.config?.stake || 0,
            isRunning: this.isRunning,
        };
        this.consecutiveLosses = 0;
        this.notifyStatsUpdate();
    }

    /**
     * Check if bot is running
     */
    isActive(): boolean {
        return this.isRunning;
    }

    /**
     * Get balance from client
     */
    async getBalance(): Promise<number> {
        try {
            // Get balance from api_base
            const balance = api_base.api?.account?.balance;
            return balance || 0;
        } catch (error) {
            console.error('Error getting balance:', error);
            return 0;
        }
    }

    /**
     * Check auto-stop conditions
     */
    private checkAutoStop(): string | null {
        if (!this.config) return null;

        // Check wins limit
        if (this.config.stopAfterWins && this.stats.consecutiveWins >= this.config.stopAfterWins) {
            return `Reached ${this.config.stopAfterWins} consecutive wins`;
        }

        // Check losses limit
        if (this.config.stopAfterLosses && this.stats.consecutiveLosses >= this.config.stopAfterLosses) {
            return `Reached ${this.config.stopAfterLosses} consecutive losses`;
        }

        // Check target profit
        if (this.config.targetProfit && this.stats.totalPL >= this.config.targetProfit) {
            return `Target profit of $${this.config.targetProfit} reached`;
        }

        // Check max loss
        if (this.config.maxLoss && this.stats.totalPL <= -this.config.maxLoss) {
            return `Max loss of $${this.config.maxLoss} reached`;
        }

        // Check max run time
        if (this.config.maxRunTime) {
            const elapsedMinutes = (Date.now() - this.startTime) / 60000;
            if (elapsedMinutes >= this.config.maxRunTime) {
                return `Max run time of ${this.config.maxRunTime} minutes reached`;
            }
        }

        return null;
    }

    /**
     * Play sound alert
     */
    private playSound(type: 'win' | 'loss'): void {
        try {
            const audio = new Audio();
            if (type === 'win') {
                // High pitch beep for win
                audio.src =
                    'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGi77OeeSwwPUKfj8LZjHAU5kdfy0HotBSR3x/DdkEAKFF607OunVRQKRp/g8r5sIQYqgc7y2Yk2CBhpvO3nnksMD1Cn4/C2YxwFOZHX8tB6LQUkd8fw3ZBACRRN';
            } else {
                // Low pitch beep for loss
                audio.src =
                    'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGi77OeeSwwPUKfj8LZjHAU5kdfy0HotBSR3x/DdkEAKFF607OunVRQKRp/g8r5sIQYqgc7y2Yk2CBhpvO3nnksMD1Cn4/C2YxwFOZHX8tB6LQUkd8fw3ZBACRRN';
            }
            audio.volume = 0.3;
            audio.play().catch(() => {
                // Ignore errors if audio can't play
            });
        } catch (error) {
            // Ignore audio errors
        }
    }

    /**
     * Send desktop notification
     */
    private sendNotification(title: string, body: string): void {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body,
                icon: '/favicon-pink.svg',
                badge: '/favicon-pink.svg',
            });
        }
    }

    /**
     * Update digit history and detect patterns
     */
    updateDigitHistory(lastDigit: number): void {
        this.digitHistory.push(lastDigit);
        if (this.digitHistory.length > 100) {
            this.digitHistory.shift();
        }

        // Update digit counts
        const count = this.digitCounts.get(lastDigit) || 0;
        this.digitCounts.set(lastDigit, count + 1);

        // Detect streak
        if (this.currentStreak && this.currentStreak.digit === lastDigit) {
            this.currentStreak.count++;
        } else {
            this.currentStreak = { digit: lastDigit, count: 1 };
        }

        // Notify pattern update
        if (this.onPatternUpdate) {
            this.onPatternUpdate(this.getPatternDetection());
        }

        // Auto-switch to hot digit if enabled
        if (this.config?.autoSwitchToHot && this.digitHistory.length >= 20) {
            const hotDigits = this.getHotDigits();
            if (hotDigits.length > 0 && this.config.prediction !== hotDigits[0].toString()) {
                console.log(`🔥 Auto-switching to hot digit: ${hotDigits[0]}`);
                this.config.prediction = hotDigits[0].toString();
            }
        }
    }

    /**
     * Get pattern detection data
     */
    getPatternDetection(): PatternDetection {
        const hotDigits = this.getHotDigits();
        const coldDigits = this.getColdDigits();
        const trend = this.detectTrend();

        return {
            hotDigits,
            coldDigits,
            currentStreak: this.currentStreak,
            trend,
            lastDigits: this.digitHistory.slice(-10),
        };
    }

    /**
     * Get hot digits (appear most frequently)
     */
    private getHotDigits(): number[] {
        if (this.digitHistory.length < 20) return [];

        const counts = new Map<number, number>();
        this.digitHistory.forEach(digit => {
            counts.set(digit, (counts.get(digit) || 0) + 1);
        });

        return Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([digit]) => digit);
    }

    /**
     * Get cold digits (appear least frequently)
     */
    private getColdDigits(): number[] {
        if (this.digitHistory.length < 20) return [];

        const counts = new Map<number, number>();
        for (let i = 0; i <= 9; i++) {
            counts.set(i, 0);
        }
        this.digitHistory.forEach(digit => {
            counts.set(digit, (counts.get(digit) || 0) + 1);
        });

        return Array.from(counts.entries())
            .sort((a, b) => a[1] - b[1])
            .slice(0, 3)
            .map(([digit]) => digit);
    }

    /**
     * Detect trend (up/down/neutral)
     */
    private detectTrend(): 'up' | 'down' | 'neutral' {
        if (this.digitHistory.length < 10) return 'neutral';

        const recent = this.digitHistory.slice(-10);
        const avg = recent.reduce((sum, d) => sum + d, 0) / recent.length;

        if (avg > 5.5) return 'up';
        if (avg < 4.5) return 'down';
        return 'neutral';
    }

    /**
     * Get digit statistics
     */
    getDigitStats(): DigitStats[] {
        const stats: DigitStats[] = [];
        const total = this.digitHistory.length;

        if (total === 0) {
            return Array.from({ length: 10 }, (_, i) => ({
                digit: i,
                count: 0,
                percentage: 0,
                isHot: false,
                isCold: false,
            }));
        }

        const hotDigits = this.getHotDigits();
        const coldDigits = this.getColdDigits();

        for (let i = 0; i <= 9; i++) {
            const count = this.digitCounts.get(i) || 0;
            stats.push({
                digit: i,
                count,
                percentage: (count / total) * 100,
                isHot: hotDigits.includes(i),
                isCold: coldDigits.includes(i),
            });
        }

        return stats;
    }

    /**
     * Export strategy configuration
     */
    exportStrategy(): string {
        if (!this.config) return '';

        const strategy = {
            config: this.config,
            stats: this.stats,
            timestamp: Date.now(),
        };

        return JSON.stringify(strategy, null, 2);
    }

    /**
     * Import strategy configuration
     */
    importStrategy(strategyJson: string): SpeedBotConfig | null {
        try {
            const strategy = JSON.parse(strategyJson);
            return strategy.config || null;
        } catch (error) {
            console.error('Error importing strategy:', error);
            return null;
        }
    }

    /**
     * Get performance summary
     */
    getPerformanceSummary(): {
        totalTrades: number;
        winRate: number;
        avgProfit: number;
        bestTrade: number;
        worstTrade: number;
        profitFactor: number;
    } {
        const totalTrades = this.stats.runs;
        const winRate = this.stats.winRate;
        const avgProfit = totalTrades > 0 ? this.stats.totalPL / totalTrades : 0;

        // Calculate profit factor (gross profit / gross loss)
        const grossProfit = this.stats.wins * Math.abs(avgProfit);
        const grossLoss = this.stats.losses * Math.abs(avgProfit);
        const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;

        return {
            totalTrades,
            winRate,
            avgProfit,
            bestTrade: 0, // Would need to track individual trades
            worstTrade: 0,
            profitFactor,
        };
    }
}

export const speedBotService = new SpeedBotService();
