import { derivAPIService } from './deriv-api.service';

export interface InstantFillConfig {
    market: string;
    strategy: 'Even' | 'Odd';
    stake: number;
    duration: number;
    prediction: number;
    both: boolean;
}

export interface TradeStats {
    totalPL: number;
    totalRuns: number;
    won: number;
    lost: number;
}

class InstantFillService {
    private isRunning = false;
    private stats: TradeStats = {
        totalPL: 0,
        totalRuns: 0,
        won: 0,
        lost: 0,
    };
    private tickSubscription: any = null;
    private analysisData: string[] = [];

    async executeTrade(config: InstantFillConfig): Promise<void> {
        try {
            // Simulate trade execution
            console.log('Executing trade:', config);
            
            // Simulate delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Simulate random win/loss
            const won = Math.random() > 0.5;
            const profit = won ? config.stake * 0.95 : -config.stake;
            
            this.stats.totalRuns++;
            if (won) {
                this.stats.won++;
            } else {
                this.stats.lost++;
            }
            this.stats.totalPL += profit;
            
            console.log('Trade completed:', { won, profit, stats: this.stats });
        } catch (error) {
            console.error('Trade execution failed:', error);
            throw error;
        }
    }

    async executeBulkTrades(config: InstantFillConfig, count: number): Promise<void> {
        this.isRunning = true;
        
        for (let i = 0; i < count && this.isRunning; i++) {
            try {
                await this.executeTrade(config);
                // Small delay between trades
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`Bulk trade ${i + 1} failed:`, error);
            }
        }
        
        this.isRunning = false;
    }



    async subscribeToTicks(symbol: string, callback: (tick: any) => void): Promise<void> {
        try {
            await derivAPIService.subscribeToTicks(symbol, (response: any) => {
                if (response.tick) {
                    const lastDigit = response.tick.quote.toString().slice(-1);
                    const isEven = parseInt(lastDigit) % 2 === 0;
                    this.analysisData.unshift(isEven ? 'E' : 'O');
                    
                    // Keep only last 50 items
                    if (this.analysisData.length > 50) {
                        this.analysisData.pop();
                    }
                    
                    callback(response.tick);
                }
            });
        } catch (error) {
            console.error('Failed to subscribe to ticks:', error);
        }
    }

    unsubscribeFromTicks(): void {
        // Deriv API service handles unsubscription internally
        this.tickSubscription = null;
    }

    getStats(): TradeStats {
        return { ...this.stats };
    }

    getAnalysisData(): string[] {
        return [...this.analysisData];
    }

    resetStats(): void {
        this.stats = {
            totalPL: 0,
            totalRuns: 0,
            won: 0,
            lost: 0,
        };
    }

    stop(): void {
        this.isRunning = false;
        this.unsubscribeFromTicks();
    }
}

export const instantFillService = new InstantFillService();
