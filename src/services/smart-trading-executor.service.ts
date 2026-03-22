/**
 * Smart Trading Executor Service
 *
 * Connects Smart Trading Cards to Deriv API for automated trade execution.
 * Uses the existing api_base connection.
 * Implements: proposal → buy → proposal_open_contract tracking.
 */

import { api_base } from '@/external/bot-skeleton/services/api/api-base';

// Map strategy types to Deriv contract_type strings
const CONTRACT_TYPE_MAP: Record<string, string> = {
    OVER: 'DIGITOVER',
    UNDER: 'DIGITUNDER',
    EVEN: 'DIGITEVEN',
    ODD: 'DIGITODD',
    RISE: 'CALL',
    FALL: 'PUT',
    MATCHES: 'DIGITMATCH',
    DIFFERS: 'DIGITDIFF',
};

export interface SmartTradeConfig {
    type: 'over-under' | 'even-odd' | 'rise-fall' | 'matches-differs';
    prediction: string;
    settings: {
        stake: number;
        ticks: number;
        martingale: number;
        barrier?: number;
    };
    symbol?: string;
}

export interface TradeHistory {
    id: string;
    timestamp: number;
    type: string;
    prediction: string;
    stake: number;
    result: 'win' | 'loss' | 'pending';
    profit: number;
    contractId?: string;
}

class SmartTradingExecutorService {
    private tradeHistory: TradeHistory[] = [];
    private currentStreak: number = 0;
    private lastResult: 'win' | 'loss' | null = null;
    private listeners: Map<string, Set<Function>> = new Map();
    private activeSubscriptions: Map<string, any> = new Map();

    constructor() {
        this.loadHistoryFromStorage();
    }

    /**
     * Check if api_base is ready and authorized
     */
    public isReady(): boolean {
        return !!(api_base?.api && api_base.is_authorized);
    }

    /**
     * Initialize — validates login state
     */
    public async initialize(): Promise<boolean> {
        try {
            if (!api_base?.api) {
                this.emit('error', { message: 'Please login to Deriv first' });
                return false;
            }
            const activeLoginId = localStorage.getItem('active_loginid');
            if (!activeLoginId) {
                this.emit('error', { message: 'Please login to Deriv first' });
                return false;
            }
            this.emit('initialized', { loginid: activeLoginId });
            return true;
        } catch (error) {
            this.emit('error', { message: error instanceof Error ? error.message : 'Initialization failed' });
            return false;
        }
    }

    /**
     * Execute a smart trade via Deriv API:
     * 1. Get price proposal
     * 2. Buy contract
     * 3. Subscribe to contract updates for win/loss tracking
     */
    public async executeTrade(
        config: SmartTradeConfig
    ): Promise<{ success: boolean; contractId?: string; error?: string }> {
        if (!this.isReady()) {
            return { success: false, error: 'Not connected to Deriv API' };
        }

        const contractType = CONTRACT_TYPE_MAP[config.prediction.toUpperCase()];
        if (!contractType) {
            return { success: false, error: `Unknown prediction type: ${config.prediction}` };
        }

        const symbol = config.symbol || 'R_10';
        const currency = localStorage.getItem('currency') || 'USD';

        // Build proposal request
        const proposalRequest: Record<string, any> = {
            proposal: 1,
            amount: config.settings.stake,
            basis: 'stake',
            contract_type: contractType,
            currency,
            duration: config.settings.ticks,
            duration_unit: 't',
            symbol,
        };

        // Add barrier for digit contracts
        if (['DIGITOVER', 'DIGITUNDER', 'DIGITMATCH', 'DIGITDIFF'].includes(contractType)) {
            proposalRequest.barrier = String(config.settings.barrier ?? 5);
        }

        try {
            console.log('[PROPOSAL] Requesting price proposal:', proposalRequest);
            const proposalResponse = await api_base.api.send(proposalRequest);

            if (proposalResponse?.error) {
                console.error('[PROPOSAL] Error:', proposalResponse.error.message);
                return { success: false, error: proposalResponse.error.message };
            }

            const proposalId = proposalResponse?.proposal?.id;
            const askPrice = proposalResponse?.proposal?.ask_price;

            if (!proposalId) {
                return { success: false, error: 'No proposal ID received' };
            }

            console.log(`[PROPOSAL] Got proposal ${proposalId} at price ${askPrice}`);

            // Buy the contract
            const buyResponse = await api_base.api.send({
                buy: proposalId,
                price: askPrice,
            });

            if (buyResponse?.error) {
                console.error('[BUY] Error:', buyResponse.error.message);
                return { success: false, error: buyResponse.error.message };
            }

            const contractId = buyResponse?.buy?.contract_id;
            const buyPrice = buyResponse?.buy?.buy_price;

            console.log(`[BUY] Contract ${contractId} purchased at ${buyPrice}`);

            // Record as pending trade
            const trade: TradeHistory = {
                id: `trade-${Date.now()}`,
                timestamp: Date.now(),
                type: config.type,
                prediction: config.prediction,
                stake: config.settings.stake,
                result: 'pending',
                profit: 0,
                contractId: String(contractId),
            };
            this.tradeHistory.unshift(trade);
            this.emit('trade-executed', trade);

            // Subscribe to contract updates
            this.subscribeToContract(String(contractId), trade);

            return { success: true, contractId: String(contractId) };
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Trade execution failed';
            console.error('[EXECUTE] Error:', msg);
            return { success: false, error: msg };
        }
    }

    /**
     * Subscribe to proposal_open_contract for win/loss tracking
     */
    private async subscribeToContract(contractId: string, trade: TradeHistory): Promise<void> {
        try {
            const response = await api_base.api.send({
                proposal_open_contract: 1,
                contract_id: contractId,
                subscribe: 1,
            });

            if (response?.error) {
                console.error('[SUBSCRIBE] Error:', response.error.message);
                return;
            }

            const subscriptionId = response?.subscription?.id;

            const subscription = api_base.api.onMessage().subscribe((message: any) => {
                const poc = message?.proposal_open_contract;
                if (!poc || String(poc.contract_id) !== contractId) return;

                if (poc.is_sold || poc.status === 'won' || poc.status === 'lost') {
                    const won = poc.status === 'won';
                    const profit = won
                        ? (poc.payout ?? 0) - (poc.buy_price ?? trade.stake)
                        : -(poc.buy_price ?? trade.stake);

                    trade.result = won ? 'win' : 'loss';
                    trade.profit = profit;

                    // Update streak
                    if (this.lastResult === trade.result) {
                        this.currentStreak++;
                    } else {
                        this.currentStreak = 1;
                        this.lastResult = trade.result;
                    }

                    console.log(`[RESULT] Contract ${contractId}: ${trade.result} | Profit: ${profit.toFixed(2)}`);

                    this.saveHistoryToStorage();
                    this.emit('trade-result', trade);
                    this.emit('trade-executed', trade);

                    // Unsubscribe
                    subscription?.unsubscribe();
                    if (subscriptionId) {
                        api_base.api.send({ forget: subscriptionId }).catch(() => {});
                    }
                    this.activeSubscriptions.delete(contractId);
                }
            });

            if (subscriptionId) {
                this.activeSubscriptions.set(contractId, { subscription, subscriptionId });
            }
        } catch (error) {
            console.error('[SUBSCRIBE] Failed to subscribe to contract:', error);
        }
    }

    /**
     * Get a price proposal without buying (for display purposes)
     */
    public async getProposal(config: SmartTradeConfig): Promise<{ price?: number; id?: string; error?: string }> {
        if (!this.isReady()) return { error: 'Not connected' };

        const contractType = CONTRACT_TYPE_MAP[config.prediction.toUpperCase()];
        if (!contractType) return { error: `Unknown prediction: ${config.prediction}` };

        const currency = localStorage.getItem('currency') || 'USD';
        const request: Record<string, any> = {
            proposal: 1,
            amount: config.settings.stake,
            basis: 'stake',
            contract_type: contractType,
            currency,
            duration: config.settings.ticks,
            duration_unit: 't',
            symbol: config.symbol || 'R_10',
        };

        if (['DIGITOVER', 'DIGITUNDER', 'DIGITMATCH', 'DIGITDIFF'].includes(contractType)) {
            request.barrier = String(config.settings.barrier ?? 5);
        }

        try {
            const response = await api_base.api.send(request);
            if (response?.error) return { error: response.error.message };
            return { price: response?.proposal?.ask_price, id: response?.proposal?.id };
        } catch (error) {
            return { error: error instanceof Error ? error.message : 'Failed to get proposal' };
        }
    }

    public getTradeHistory(limit?: number): TradeHistory[] {
        return limit ? this.tradeHistory.slice(0, limit) : [...this.tradeHistory];
    }

    public getStatistics() {
        const totalTrades = this.tradeHistory.filter(t => t.result !== 'pending').length;
        const wins = this.tradeHistory.filter(t => t.result === 'win').length;
        const losses = this.tradeHistory.filter(t => t.result === 'loss').length;
        const totalProfit = this.tradeHistory.reduce((sum, t) => sum + t.profit, 0);
        return {
            totalTrades,
            wins,
            losses,
            winRate: totalTrades > 0 ? (wins / totalTrades) * 100 : 0,
            totalProfit,
            currentStreak: this.currentStreak,
            streakType: this.lastResult,
        };
    }

    public resetStreak(): void {
        this.currentStreak = 0;
        this.lastResult = null;
    }

    public clearHistory(): void {
        this.tradeHistory = [];
        this.currentStreak = 0;
        this.lastResult = null;
        this.saveHistoryToStorage();
    }

    private loadHistoryFromStorage(): void {
        try {
            const saved = localStorage.getItem('smart_trading_history');
            if (saved) {
                const data = JSON.parse(saved);
                this.tradeHistory = data.history || [];
                this.currentStreak = data.currentStreak || 0;
                this.lastResult = data.lastResult || null;
            }
        } catch {}
    }

    private saveHistoryToStorage(): void {
        try {
            localStorage.setItem(
                'smart_trading_history',
                JSON.stringify({
                    history: this.tradeHistory.slice(0, 50),
                    currentStreak: this.currentStreak,
                    lastResult: this.lastResult,
                })
            );
        } catch {}
    }

    public on(event: string, callback: Function): void {
        if (!this.listeners.has(event)) this.listeners.set(event, new Set());
        this.listeners.get(event)!.add(callback);
    }

    public off(event: string, callback: Function): void {
        this.listeners.get(event)?.delete(callback);
    }

    private emit(event: string, data?: any): void {
        this.listeners.get(event)?.forEach(cb => {
            try {
                cb(data);
            } catch {}
        });
    }
}

export const smartTradingExecutor = new SmartTradingExecutorService();
