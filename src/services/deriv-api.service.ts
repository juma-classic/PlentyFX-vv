/**
 * Deriv API Service
 * Centralized service for all Deriv API calls
 */

import { api_base } from '@/external/bot-skeleton/services/api/api-base';
import type {
    TBuyContractRequest,
    TBuyContractResponse,
    TCandlesSubscribeRequest,
    TCandlesSubscribeResponse,
    TPayoutCurrenciesRequest,
    TPayoutCurrenciesResponse,
    TPortfolioRequest,
    TPortfolioResponse,
    TPortfolioSubscribeRequest,
    TProfitTableRequest,
    TProfitTableResponse,
    TSellContractRequest,
    TSellContractResponse,
    TStatementRequest,
    TStatementResponse,
    TTicksHistoryRequest,
    TTicksHistoryResponse,
    TTicksSubscribeRequest,
    TTicksSubscribeResponse,
    TTradingTimesRequest,
    TTradingTimesResponse,
} from '@/types/deriv-api.types';

class DerivAPIService {
    /**
     * Get all open positions in portfolio
     */
    async getPortfolio(contract_type?: string[]): Promise<TPortfolioResponse> {
        const request: TPortfolioRequest = {
            portfolio: 1,
            ...(contract_type && { contract_type }),
        };

        return api_base.api?.send(request) as Promise<TPortfolioResponse>;
    }

    /**
     * Subscribe to portfolio changes
     */
    async subscribeToPortfolio(callback: (data: TPortfolioResponse) => void) {
        const request: TPortfolioSubscribeRequest = {
            portfolio: 1,
            subscribe: 1,
        };

        const response = await api_base.api?.send(request);

        if (response?.subscription) {
            const subscription = api_base.api?.onMessage().subscribe((message: any) => {
                if (message.portfolio) {
                    callback(message as TPortfolioResponse);
                }
            });

            api_base.pushSubscription({
                id: response.subscription.id,
                unsubscribe: () => subscription?.unsubscribe(),
            });

            return response.subscription.id;
        }
    }

    /**
     * Get profit table (historical profit/loss)
     */
    async getProfitTable(options?: {
        description?: 0 | 1;
        limit?: number;
        offset?: number;
        sort?: 'ASC' | 'DESC';
        date_from?: number;
        date_to?: number;
    }): Promise<TProfitTableResponse> {
        const request: TProfitTableRequest = {
            profit_table: 1,
            ...options,
        };

        return api_base.api?.send(request) as Promise<TProfitTableResponse>;
    }

    /**
     * Get account statement
     */
    async getStatement(options?: {
        description?: 0 | 1;
        limit?: number;
        offset?: number;
        date_from?: number;
        date_to?: number;
        action_type?: 'buy' | 'sell' | 'deposit' | 'withdrawal';
    }): Promise<TStatementResponse> {
        const request: TStatementRequest = {
            statement: 1,
            ...options,
        };

        return api_base.api?.send(request) as Promise<TStatementResponse>;
    }

    /**
     * Buy a contract
     */
    async buyContract(proposal_id: string, price: number): Promise<TBuyContractResponse> {
        const request: TBuyContractRequest = {
            buy: proposal_id,
            price,
        };

        return api_base.api?.send(request) as Promise<TBuyContractResponse>;
    }

    /**
     * Sell a contract
     */
    async sellContract(contract_id: number, price: number): Promise<TSellContractResponse> {
        const request: TSellContractRequest = {
            sell: contract_id,
            price,
        };

        return api_base.api?.send(request) as Promise<TSellContractResponse>;
    }

    /**
     * Get historical tick data
     */
    async getTicksHistory(options: {
        symbol: string;
        adjust_start_time?: 0 | 1;
        count?: number;
        end?: string | number;
        start?: number;
        style?: 'candles' | 'ticks';
        granularity?: number;
    }): Promise<TTicksHistoryResponse> {
        const request: TTicksHistoryRequest = {
            ticks_history: options.symbol,
            adjust_start_time: options.adjust_start_time,
            count: options.count,
            end: options.end,
            start: options.start,
            style: options.style,
            granularity: options.granularity,
        };

        return api_base.api?.send(request) as Promise<TTicksHistoryResponse>;
    }

    /**
     * Get trading times for markets
     */
    async getTradingTimes(date?: string): Promise<TTradingTimesResponse> {
        const request: TTradingTimesRequest = {
            trading_times: date || new Date().toISOString().split('T')[0],
            ...(date && { date }),
        };

        return api_base.api?.send(request) as Promise<TTradingTimesResponse>;
    }

    /**
     * Get available payout currencies
     */
    async getPayoutCurrencies(): Promise<TPayoutCurrenciesResponse> {
        const request: TPayoutCurrenciesRequest = {
            payout_currencies: 1,
        };

        return api_base.api?.send(request) as Promise<TPayoutCurrenciesResponse>;
    }

    /**
     * Subscribe to real-time ticks
     */
    async subscribeToTicks(symbol: string, callback: (data: TTicksSubscribeResponse) => void) {
        const request: TTicksSubscribeRequest = {
            ticks: symbol,
            subscribe: 1,
        };

        const response = await api_base.api?.send(request);

        if (response?.subscription) {
            const subscription = api_base.api?.onMessage().subscribe((message: any) => {
                if (message.tick && message.tick.symbol === symbol) {
                    callback(message as TTicksSubscribeResponse);
                }
            });

            api_base.pushSubscription({
                id: response.subscription.id,
                unsubscribe: () => subscription?.unsubscribe(),
            });

            return response.subscription.id;
        }
    }

    /**
     * Subscribe to real-time candles (OHLC)
     */
    async subscribeToCandles(symbol: string, granularity: number, callback: (data: TCandlesSubscribeResponse) => void) {
        const request: TCandlesSubscribeRequest = {
            ticks_history: symbol,
            adjust_start_time: 1,
            count: 1000,
            end: 'latest',
            style: 'candles',
            granularity,
            subscribe: 1,
        };

        const response = await api_base.api?.send(request);

        if (response?.subscription) {
            const subscription = api_base.api?.onMessage().subscribe((message: any) => {
                if (message.ohlc && message.ohlc.symbol === symbol) {
                    callback(message as TCandlesSubscribeResponse);
                }
            });

            api_base.pushSubscription({
                id: response.subscription.id,
                unsubscribe: () => subscription?.unsubscribe(),
            });

            return response.subscription.id;
        }
    }

    /**
     * Subscribe to contract updates
     */
    async subscribeToContractUpdates(contract_id: string, callback: (data: any) => void) {
        const request = {
            proposal_open_contract: 1,
            contract_id: contract_id,
            subscribe: 1,
        };

        const response = await api_base.api?.send(request);

        if (response?.subscription) {
            const subscription = api_base.api?.onMessage().subscribe((message: any) => {
                if (message.proposal_open_contract) {
                    callback(message);
                }
            });

            api_base.pushSubscription({
                id: response.subscription.id,
                unsubscribe: () => subscription?.unsubscribe(),
            });

            return response.subscription.id;
        }
    }

    /**
     * Unsubscribe from a stream
     */
    async unsubscribe(subscription_id: string) {
        return api_base.api?.send({
            forget: subscription_id,
        });
    }

    /**
     * Unsubscribe from all streams
     */
    unsubscribeAll() {
        api_base.clearSubscriptions();
    }
}

export const derivAPIService = new DerivAPIService();
