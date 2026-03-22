/**
 * Flipping Tool Trading Service
 * Implements the Flipping Tool bot strategy for automated trading
 */

import { api_base } from '@/external/bot-skeleton/services/api/api-base';
import { derivAPIService } from './deriv-api.service';
import { masterTradeIntegrationService } from './master-trade-integration.service';

export interface FlippingToolConfig {
    market: string;
    stake: number;
    overUnderDigit: number;
    tradeType: 'OVER' | 'UNDER';
    maxLoss: number;
    maxProfit: number;
}

export interface TradeResult {
    success: boolean;
    contractId?: number;
    profit?: number;
    error?: string;
}

export interface BotStats {
    totalTrades: number;
    wins: number;
    losses: number;
    totalProfit: number;
    currentStreak: number;
    isRunning: boolean;
}

class FlippingToolService {
    private isRunning = false;
    private config: FlippingToolConfig | null = null;
    private stats: BotStats = {
        totalTrades: 0,
        wins: 0,
        losses: 0,
        totalProfit: 0,
        currentStreak: 0,
        isRunning: false,
    };
    private currentStake = 0;
    private tickSubscriptionId: string | null = null;
    private onStatsUpdate: ((stats: BotStats) => void) | null = null;
    private onTradeComplete: ((result: TradeResult) => void) | null = null;

    /**
     * Start the Flipping Tool bot
     */
    async start(
        config: FlippingToolConfig,
        callbacks?: {
            onStatsUpdate?: (stats: BotStats) => void;
            onTradeComplete?: (result: TradeResult) => void;
        }
    ): Promise<void> {
        if (this.isRunning) {
            throw new Error('Bot is already running');
        }

        this.config = config;
        this.currentStake = config.stake;
        this.isRunning = true;
        this.stats.isRunning = true;
        this.onStatsUpdate = callbacks?.onStatsUpdate || null;
        this.onTradeComplete = callbacks?.onTradeComplete || null;

        console.log('🤖 Flipping Tool Bot Started', config);

        // Subscribe to ticks for the selected market
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

        console.log('🛑 Flipping Tool Bot Stopped');
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
     * Determine if we should place a trade
     */
    private shouldPlaceTrade(): boolean {
        if (!this.config) return false;

        // Simple strategy: trade on every tick (you can customize this logic)
        // For a more sophisticated strategy, you might want to:
        // - Wait for specific patterns
        // - Use technical indicators
        // - Implement timing logic

        return true; // For now, trade on every tick
    }

    /**
     * Place a trade
     */
    private async placeTrade(): Promise<void> {
        if (!this.config || !this.isRunning) return;

        try {
            // Check if we've hit max loss or max profit
            if (Math.abs(this.stats.totalProfit) >= this.config.maxLoss && this.stats.totalProfit < 0) {
                console.log('❌ Max loss reached. Stopping bot.');
                await this.stop();
                return;
            }

            if (this.stats.totalProfit >= this.config.maxProfit) {
                console.log('✅ Max profit reached. Stopping bot.');
                await this.stop();
                return;
            }

            // Get proposal for the trade
            const proposal = await this.getProposal();

            if (!proposal || !proposal.proposal) {
                console.error('Failed to get proposal');
                return;
            }

            // Buy the contract
            const buyResponse = await derivAPIService.buyContract(proposal.proposal.id, proposal.proposal.ask_price);

            if (buyResponse.error) {
                console.error('Error buying contract:', buyResponse.error);
                return;
            }

            console.log('📈 Trade placed:', buyResponse.buy);

            // 🔗 COPY TRADING INTEGRATION: Execute copy trades for clients
            try {
                console.log('🔗 Triggering copy trading for Flipping Tool trade...');
                await masterTradeIntegrationService.onFlippingToolTrade({
                    market: this.config.market,
                    contractType: contractType,
                    stake: this.currentStake,
                    duration: 1,
                    durationUnit: 't',
                    barrier: this.config.overUnderDigit.toString(),
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
        }
    }

    /**
     * Get proposal for the trade
     */
    private async getProposal(): Promise<any> {
        if (!this.config) return null;

        const contractType = this.config.tradeType === 'OVER' ? 'DIGITOVER' : 'DIGITUNDER';

        const proposal = {
            proposal: 1,
            amount: this.currentStake,
            basis: 'stake',
            contract_type: contractType,
            currency: 'USD',
            duration: 1,
            duration_unit: 't',
            symbol: this.config.market,
            barrier: this.config.overUnderDigit.toString(),
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
            // Subscribe to contract updates
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

                // Store subscription for cleanup
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
        // Check if contract is completed
        if (contract.is_sold || contract.status === 'sold') {
            const profit = contract.profit || 0;
            const isWin = profit > 0;

            // Update stats
            this.stats.totalTrades++;
            if (isWin) {
                this.stats.wins++;
                this.stats.currentStreak = this.stats.currentStreak > 0 ? this.stats.currentStreak + 1 : 1;
                this.currentStake = this.config!.stake; // Reset stake on win
            } else {
                this.stats.losses++;
                this.stats.currentStreak = this.stats.currentStreak < 0 ? this.stats.currentStreak - 1 : -1;
                // Martingale: double stake on loss (optional)
                // this.currentStake = this.currentStake * 2;
            }
            this.stats.totalProfit += profit;

            console.log(
                isWin ? '✅ Trade Won' : '❌ Trade Lost',
                `Profit: ${profit.toFixed(2)}, Total: ${this.stats.totalProfit.toFixed(2)}`
            );

            // Notify callbacks
            this.notifyStatsUpdate();
            if (this.onTradeComplete) {
                this.onTradeComplete({
                    success: isWin,
                    contractId: contract.contract_id,
                    profit,
                });
            }

            // Unsubscribe from this contract
            if (contract.subscription) {
                derivAPIService.unsubscribe(contract.subscription.id);
            }
        }
    }

    /**
     * Get last digit from price
     */
    private getLastDigit(price: number): number {
        const priceStr = price.toString();
        const lastChar = priceStr[priceStr.length - 1];
        return parseInt(lastChar, 10);
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
     * Get current stats
     */
    getStats(): BotStats {
        return { ...this.stats };
    }

    /**
     * Reset stats
     */
    resetStats(): void {
        this.stats = {
            totalTrades: 0,
            wins: 0,
            losses: 0,
            totalProfit: 0,
            currentStreak: 0,
            isRunning: this.isRunning,
        };
        this.notifyStatsUpdate();
    }

    /**
     * Check if bot is running
     */
    isActive(): boolean {
        return this.isRunning;
    }
}

export const flippingToolService = new FlippingToolService();
