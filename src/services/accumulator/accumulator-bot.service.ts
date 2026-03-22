/**
 * Accumulator Bot Service
 * Automated trading bot for accumulator strategies
 */

import {
    AccumulatorConfig,
    AccumulatorBot,
    AccumulatorSession,
    BotPerformance,
} from '../../types/accumulator/accumulator.types';
import { accumulatorAnalysisService } from './accumulator-analysis.service';

class AccumulatorBotService {
    private activeBots: Map<string, AccumulatorBot> = new Map();
    private botSessions: Map<string, AccumulatorSession> = new Map();

    /**
     * Create and start a new accumulator bot
     */
    async createBot(config: AccumulatorConfig, name: string): Promise<AccumulatorBot> {
        const bot: AccumulatorBot = {
            id: this.generateBotId(),
            name,
            strategy: config.strategy,
            config,
            status: 'IDLE',
            performance: this.initializePerformance(),
            rules: this.getDefaultRules(config),
        };

        this.activeBots.set(bot.id, bot);
        console.log(`🤖 Created accumulator bot: ${name} (${bot.id})`);

        return bot;
    }

    /**
     * Start a bot
     */
    async startBot(botId: string): Promise<void> {
        const bot = this.activeBots.get(botId);
        if (!bot) {
            throw new Error(`Bot ${botId} not found`);
        }

        if (bot.status === 'RUNNING') {
            console.warn(`Bot ${botId} is already running`);
            return;
        }

        try {
            bot.status = 'RUNNING';

            // Start analysis session
            const session = await accumulatorAnalysisService.startAnalysis(bot.config);
            this.botSessions.set(botId, session);

            // Start bot monitoring
            this.startBotMonitoring(botId);

            console.log(`🚀 Started accumulator bot: ${bot.name}`);
        } catch (error) {
            bot.status = 'ERROR';
            console.error(`❌ Failed to start bot ${botId}:`, error);
            throw error;
        }
    }

    /**
     * Stop a bot
     */
    async stopBot(botId: string): Promise<void> {
        const bot = this.activeBots.get(botId);
        if (!bot) {
            throw new Error(`Bot ${botId} not found`);
        }

        bot.status = 'IDLE';

        // Stop analysis session
        const session = this.botSessions.get(botId);
        if (session) {
            accumulatorAnalysisService.stopAnalysis();
            this.botSessions.delete(botId);
        }

        console.log(`⏹️ Stopped accumulator bot: ${bot.name}`);
    }

    /**
     * Get bot performance
     */
    getBotPerformance(botId: string): BotPerformance | null {
        const bot = this.activeBots.get(botId);
        return bot ? bot.performance : null;
    }

    /**
     * Get all active bots
     */
    getActiveBots(): AccumulatorBot[] {
        return Array.from(this.activeBots.values());
    }

    /**
     * Get bot by ID
     */
    getBot(botId: string): AccumulatorBot | null {
        return this.activeBots.get(botId) || null;
    }

    /**
     * Update bot configuration
     */
    updateBotConfig(botId: string, config: Partial<AccumulatorConfig>): void {
        const bot = this.activeBots.get(botId);
        if (!bot) {
            throw new Error(`Bot ${botId} not found`);
        }

        if (bot.status === 'RUNNING') {
            throw new Error('Cannot update configuration while bot is running');
        }

        bot.config = { ...bot.config, ...config };
        console.log(`⚙️ Updated configuration for bot: ${bot.name}`);
    }

    /**
     * Delete a bot
     */
    async deleteBot(botId: string): Promise<void> {
        const bot = this.activeBots.get(botId);
        if (!bot) {
            throw new Error(`Bot ${botId} not found`);
        }

        // Stop bot if running
        if (bot.status === 'RUNNING') {
            await this.stopBot(botId);
        }

        this.activeBots.delete(botId);
        console.log(`🗑️ Deleted accumulator bot: ${bot.name}`);
    }

    /**
     * Get recommended bot configurations
     */
    getRecommendedConfigs(): { name: string; config: AccumulatorConfig; description: string }[] {
        return [
            {
                name: 'Conservative Growth',
                description: 'Low risk, steady growth strategy for beginners',
                config: {
                    growthRate: 1,
                    takeProfit: 15,
                    stopLoss: 60,
                    maxTicks: 1000,
                    minTicks: 50,
                    market: '1HZ10V',
                    initialStake: 1,
                    strategy: 'CONSERVATIVE_GROWTH',
                },
            },
            {
                name: 'Balanced Trader',
                description: 'Moderate risk with balanced profit targets',
                config: {
                    growthRate: 2,
                    takeProfit: 25,
                    stopLoss: 50,
                    maxTicks: 800,
                    minTicks: 30,
                    market: '1HZ10V',
                    initialStake: 1,
                    strategy: 'TICK_BASED_EXIT',
                },
            },
            {
                name: 'Aggressive Compound',
                description: 'High risk, high reward for experienced traders',
                config: {
                    growthRate: 4,
                    takeProfit: 50,
                    stopLoss: 30,
                    maxTicks: 500,
                    minTicks: 20,
                    market: '1HZ25V',
                    initialStake: 1,
                    strategy: 'AGGRESSIVE_COMPOUND',
                },
            },
            {
                name: 'Volatility Adaptive',
                description: 'Adapts to market volatility conditions',
                config: {
                    growthRate: 3,
                    takeProfit: 35,
                    stopLoss: 40,
                    maxTicks: 600,
                    minTicks: 25,
                    market: '1HZ25V',
                    initialStake: 1,
                    strategy: 'VOLATILITY_ADAPTIVE',
                },
            },
        ];
    }

    /**
     * Private helper methods
     */
    private startBotMonitoring(botId: string): void {
        const monitoringInterval = setInterval(async () => {
            const bot = this.activeBots.get(botId);
            const session = this.botSessions.get(botId);

            if (!bot || !session || bot.status !== 'RUNNING') {
                clearInterval(monitoringInterval);
                return;
            }

            try {
                // Update bot performance based on session
                this.updateBotPerformance(bot, session);

                // Check for exit conditions
                await this.checkBotExitConditions(bot, session);
            } catch (error) {
                console.error(`❌ Error monitoring bot ${botId}:`, error);
                bot.status = 'ERROR';
                clearInterval(monitoringInterval);
            }
        }, 1000); // Monitor every second
    }

    private updateBotPerformance(bot: AccumulatorBot, session: AccumulatorSession): void {
        const performance = bot.performance;

        // Update basic metrics
        performance.totalTrades = session.trades.length;

        if (performance.totalTrades > 0) {
            const winningTrades = session.trades.filter(t => t.profit > 0);
            performance.winRate = (winningTrades.length / performance.totalTrades) * 100;

            performance.totalProfit = session.trades.reduce((sum, t) => sum + t.profit, 0);
            performance.averageProfit = performance.totalProfit / performance.totalTrades;

            // Calculate max drawdown
            let maxDrawdown = 0;
            let peak = session.initialStake;

            session.trades.forEach(trade => {
                const currentValue = session.initialStake + trade.profit;
                if (currentValue > peak) {
                    peak = currentValue;
                }
                const drawdown = ((peak - currentValue) / peak) * 100;
                if (drawdown > maxDrawdown) {
                    maxDrawdown = drawdown;
                }
            });

            performance.maxDrawdown = maxDrawdown;

            // Calculate Sharpe ratio (simplified)
            const returns = session.trades.map(t => t.profitPercentage);
            const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
            const returnStdDev = this.calculateStandardDeviation(returns);
            performance.sharpeRatio = returnStdDev > 0 ? avgReturn / returnStdDev : 0;

            // Calculate profit factor
            const grossProfit = session.trades.filter(t => t.profit > 0).reduce((sum, t) => sum + t.profit, 0);
            const grossLoss = Math.abs(session.trades.filter(t => t.profit < 0).reduce((sum, t) => sum + t.profit, 0));
            performance.profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;
        }
    }

    private async checkBotExitConditions(bot: AccumulatorBot, session: AccumulatorSession): Promise<void> {
        // Check if session should be stopped based on bot rules
        for (const rule of bot.rules) {
            if (!rule.enabled) continue;

            if (rule.type === 'EXIT' && this.evaluateRule(rule, session)) {
                console.log(`🛑 Bot ${bot.id} triggered exit rule: ${rule.condition}`);
                await this.stopBot(bot.id);
                break;
            }
        }
    }

    private evaluateRule(rule: any, session: AccumulatorSession): boolean {
        // Simplified rule evaluation - could be more sophisticated
        switch (rule.condition) {
            case 'MAX_LOSS_REACHED':
                return session.profitPercentage <= -session.config.stopLoss;
            case 'TAKE_PROFIT_REACHED':
                return session.profitPercentage >= session.config.takeProfit;
            case 'MAX_TICKS_REACHED':
                return session.tickCount >= session.config.maxTicks;
            default:
                return false;
        }
    }

    private initializePerformance(): BotPerformance {
        return {
            totalTrades: 0,
            winRate: 0,
            totalProfit: 0,
            averageProfit: 0,
            maxDrawdown: 0,
            sharpeRatio: 0,
            profitFactor: 0,
        };
    }

    private getDefaultRules(config: AccumulatorConfig): any[] {
        return [
            {
                id: 'exit_take_profit',
                type: 'EXIT',
                condition: 'TAKE_PROFIT_REACHED',
                action: 'STOP_BOT',
                priority: 1,
                enabled: true,
            },
            {
                id: 'exit_stop_loss',
                type: 'EXIT',
                condition: 'MAX_LOSS_REACHED',
                action: 'STOP_BOT',
                priority: 1,
                enabled: true,
            },
            {
                id: 'exit_max_ticks',
                type: 'EXIT',
                condition: 'MAX_TICKS_REACHED',
                action: 'STOP_BOT',
                priority: 2,
                enabled: true,
            },
        ];
    }

    private calculateStandardDeviation(values: number[]): number {
        if (values.length === 0) return 0;

        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
        return Math.sqrt(avgSquaredDiff);
    }

    private generateBotId(): string {
        return `acc_bot_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    }
}

export const accumulatorBotService = new AccumulatorBotService();
