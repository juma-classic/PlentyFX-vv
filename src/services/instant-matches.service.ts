import { derivAPIService } from './deriv-api.service';

export interface InstantMatchesConfig {
    market: string;
    strategy: 'Matches' | 'Differs' | 'Over' | 'Under';
    stake: number;
    takeProfit: number;
    duration: number;
    selectedDigits: number[];
}

class InstantMatchesService {
    private isRunning = false;
    private stats = {
        totalPL: 0,
        totalRuns: 0,
        won: 0,
        lost: 0,
    };
    private digitCounts: number[] = Array(10).fill(0);
    private totalTicks = 0;
    private analysisData: number[] = [];

    async executeTrade(config: InstantMatchesConfig, prediction?: number): Promise<void> {
        try {
            console.log('Executing trade:', { config, prediction });
            
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

    async executeBulkTrades(
        config: InstantMatchesConfig,
        count: number,
        prediction?: number
    ): Promise<void> {
        this.isRunning = true;
        
        for (let i = 0; i < count && this.isRunning; i++) {
            try {
                await this.executeTrade(config, prediction);
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`Bulk trade ${i + 1} failed:`, error);
            }
        }
        
        this.isRunning = false;
    }

    async subscribeToTicks(symbol: string, callback: (data: any) => void): Promise<void> {
        try {
            await derivAPIService.subscribeToTicks(symbol, (response: any) => {
                try {
                    if (response && response.tick && response.tick.quote) {
                        const lastDigit = parseInt(response.tick.quote.toString().slice(-1));
                        this.digitCounts[lastDigit]++;
                        this.totalTicks++;
                        this.analysisData.unshift(lastDigit);
                        
                        // Keep only last 60 items
                        if (this.analysisData.length > 60) {
                            this.analysisData.pop();
                        }
                        
                        const stats = this.getDigitStats();
                        callback({
                            stats,
                            analysisData: this.analysisData,
                        });
                    }
                } catch (err) {
                    console.error('Error processing tick in instant matches:', err);
                }
            });
        } catch (error) {
            console.error('Tick subscription error:', error);
        }
    }

    getDigitStats() {
        return this.digitCounts.map((count, digit) => ({
            digit,
            count,
            percentage: this.totalTicks > 0 ? (count / this.totalTicks) * 100 : 0,
        }));
    }

    getAnalysisData(): number[] {
        return [...this.analysisData];
    }

    getStats() {
        return { ...this.stats };
    }

    resetStats(): void {
        this.stats = {
            totalPL: 0,
            totalRuns: 0,
            won: 0,
            lost: 0,
        };
        this.digitCounts = Array(10).fill(0);
        this.totalTicks = 0;
        this.analysisData = [];
    }

    stop(): void {
        this.isRunning = false;
    }
}

export const instantMatchesService = new InstantMatchesService();
