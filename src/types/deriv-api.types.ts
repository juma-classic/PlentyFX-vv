/**
 * Type definitions for Deriv API calls and responses
 */

// Portfolio API
export type TPortfolioRequest = {
    portfolio: 1;
    contract_type?: string[];
};

export type TPortfolioResponse = {
    portfolio: {
        contracts: Array<{
            app_id: number;
            buy_price: number;
            contract_id: number;
            contract_type: string;
            currency: string;
            date_start: number;
            expiry_time: number;
            longcode: string;
            payout: number;
            purchase_time: number;
            shortcode: string;
            symbol: string;
            transaction_id: number;
        }>;
    };
};

// Profit Table API
export type TProfitTableRequest = {
    profit_table: 1;
    description?: 0 | 1;
    limit?: number;
    offset?: number;
    sort?: 'ASC' | 'DESC';
    date_from?: number;
    date_to?: number;
};

export type TProfitTableResponse = {
    profit_table: {
        count: number;
        transactions: Array<{
            app_id: number;
            buy_price: number;
            contract_id: number;
            longcode: string;
            payout: number;
            purchase_time: number;
            sell_price: number;
            sell_time: number;
            shortcode: string;
            transaction_id: number;
        }>;
    };
};

// Statement API
export type TStatementRequest = {
    statement: 1;
    description?: 0 | 1;
    limit?: number;
    offset?: number;
    date_from?: number;
    date_to?: number;
    action_type?: 'buy' | 'sell' | 'deposit' | 'withdrawal';
};

export type TStatementResponse = {
    statement: {
        count: number;
        transactions: Array<{
            action_type: string;
            amount: number;
            app_id: number;
            balance_after: number;
            contract_id?: number;
            longcode?: string;
            payout?: number;
            purchase_time?: number;
            reference_id: number;
            shortcode?: string;
            transaction_id: number;
            transaction_time: number;
        }>;
    };
};

// Buy Contract API
export type TBuyContractRequest = {
    buy: string;
    price: number;
    parameters?: {
        amount?: number;
        basis?: string;
        contract_type?: string;
        currency?: string;
        date_start?: number;
        date_expiry?: number;
        duration?: number;
        duration_unit?: string;
        symbol?: string;
        barrier?: string;
        barrier2?: string;
    };
};

export type TBuyContractResponse = {
    buy: {
        balance_after: number;
        buy_price: number;
        contract_id: number;
        longcode: string;
        payout: number;
        purchase_time: number;
        shortcode: string;
        start_time: number;
        transaction_id: number;
    };
};

// Sell Contract API
export type TSellContractRequest = {
    sell: number;
    price: number;
};

export type TSellContractResponse = {
    sell: {
        balance_after: number;
        contract_id: number;
        reference_id: number;
        sold_for: number;
        transaction_id: number;
    };
};

// Ticks History API
export type TTicksHistoryRequest = {
    ticks_history: string;
    adjust_start_time?: 0 | 1;
    count?: number;
    end?: string | number;
    start?: number;
    style?: 'candles' | 'ticks';
    granularity?: number;
};

export type TTicksHistoryResponse = {
    candles?: Array<{
        close: number;
        epoch: number;
        high: number;
        low: number;
        open: number;
    }>;
    history?: {
        prices: number[];
        times: number[];
    };
};

// Trading Times API
export type TTradingTimesRequest = {
    trading_times: string;
    date?: string;
};

export type TTradingTimesResponse = {
    trading_times: {
        markets: Array<{
            name: string;
            submarkets: Array<{
                name: string;
                symbols: Array<{
                    name: string;
                    symbol: string;
                    events: Array<{
                        dates: string;
                        descrip: string;
                    }>;
                    times: {
                        close: string[];
                        open: string[];
                        settlement: string;
                    };
                }>;
            }>;
        }>;
    };
};

// Payout Currencies API
export type TPayoutCurrenciesRequest = {
    payout_currencies: 1;
};

export type TPayoutCurrenciesResponse = {
    payout_currencies: string[];
};

// Ticks Subscription
export type TTicksSubscribeRequest = {
    ticks: string;
    subscribe: 1;
};

export type TTicksSubscribeResponse = {
    tick: {
        ask: number;
        bid: number;
        epoch: number;
        id: string;
        pip_size: number;
        quote: number;
        symbol: string;
    };
    subscription: {
        id: string;
    };
};

// Candles Subscription
export type TCandlesSubscribeRequest = {
    ticks_history: string;
    adjust_start_time?: 1;
    count?: number;
    end?: 'latest';
    start?: number;
    style: 'candles';
    granularity?: number;
    subscribe: 1;
};

export type TCandlesSubscribeResponse = {
    candles?: Array<{
        close: number;
        epoch: number;
        high: number;
        low: number;
        open: number;
    }>;
    ohlc?: {
        close: string;
        epoch: number;
        granularity: number;
        high: string;
        id: string;
        low: string;
        open: string;
        open_time: number;
        symbol: string;
    };
    subscription?: {
        id: string;
    };
};

// Portfolio Subscription
export type TPortfolioSubscribeRequest = {
    portfolio: 1;
    subscribe: 1;
};
