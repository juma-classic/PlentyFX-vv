import { derivAPIService } from './deriv-api.service';

export interface MultipleStakesConfig {
    market: string;
    strategy: 'Over' | 'Under';
    digit2Stake: number;
    digit4Stake: number;
    digit6Stake: number;
    takeProfit: number;
    duration: number;
}

export interface DigitStats {
    digit: number;
    count: number;
    percentage: number;
}

class MultipleStakesService {
    private isRunning = false;
    private stats = {
        totalPL: 0,
        totalRuns: 0,
        won: 0,
        lost: 0,
    };
    private digitCounts: number[] = Array(10).fill(0);
    private totalTicks = 0;

    async executeMultipleStakes(config: MultipleStakesConfig): Promise<void> {
        const stakes = [
            { digit: 2, stake: config.digit2Stake },
            { digit: 4, stake: config.digit4Stake },
            { digit: 6, stake: config.digit6Stake },
        ];

        const promises = stakes.map(({ digit, stake }) => {
            if (stake > 0) {
                return this.executeSingleTrade(config, digit, stake);
            }
            return Promise.resolve();
        });

        await Promise.all(promises);
    }

    private async executeSingleTrade(
        config: MultipleStakesConfig,
        digit: number,
        stake: number
    ): Promise<void> {
        try {
            console.log(`Executing trade for digit ${digit}:`, { config, stake });
            
            // Simulate delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Simulate random win/loss
            const won = Math.random() > 0.5;
            const profit = won ? stake * 0.95 : -stake;
            
            this.stats.totalRuns++;
            if (won) {
                this.stats.won++;
            } else {
                this.stats.lost++;
            }
            this.stats.totalPL += profit;
            
            console.log(`Trade completed for digit ${digit}:`, { won, profit });
        } catch (error) {
            console.error(`Trade execution failed for digit ${digit}:`, error);
        }
    }

    async subscribeToTicks(symbol: string, callback: (stats: DigitStats[]) => void): Promise<void> {
        try {
            await derivAPIService.subscribeToTicks(symbol, (response: any) => {
                try {
                    if (response && response.tick && response.tick.quote) {
                        const lastDigit = parseInt(response.tick.quote.toString().slice(-1));
                        this.digitCounts[lastDigit]++;
                        this.totalTicks++;
                        
                        const stats = this.getDigitStats();
                        callback(stats);
                    }
                } catch (err) {
                    console.error('Error processing tick in multiple stakes:', err);
                }
            });
        } catch (error) {
            console.error('Tick subscription error:', error);
        }
    }

    getDigitStats(): DigitStats[] {
        return this.digitCounts.map((count, digit) => ({
            digit,
            count,
            percentage: this.totalTicks > 0 ? (count / this.totalTicks) * 100 : 0,
        }));
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
    }

    stop(): void {
        this.isRunning = false;
    }
}

export const multipleStakesService = new MultipleStakesService();
