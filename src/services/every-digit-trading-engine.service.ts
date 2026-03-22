import { derivApiService } from './deriv-api.service';

export interface DigitTradeConfig {
    market: string;
    stake: number;
    martingale: number;
    duration: number; // in ticks
    targetDigit?: number; // if specified, only trade when this digit appears
    tradeType: 'matches' | 'differs' | 'over' | 'under' | 'even' | 'odd';
}

export interface TradeResult {
    id: string;
    digit: number;
    prediction: number | string;
    result: 'win' | 'loss';
    stake: number;
    payout: number;
    profit: number;
    timestamp: number;
}

class EveryDigitTradingEngineService {
    private isActive = false;
    private config: DigitTradeConfig | null = null;

    public start(config: DigitTradeConfig): void {
        this.config = config;
        this.isActive = true;
        console.log('Every Digit Trading Engine started');
    }

    public stop(): void {
        this.isActive = false;
        console.log('Every Digit Trading Engine stopped');
    }

    public isRunning(): boolean {
        return this.isActive;
    }
}

export const everyDigitTradingEngine = new EveryDigitTradingEngineService();
