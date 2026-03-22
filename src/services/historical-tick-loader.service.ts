/**
 * Historical Tick Loader Service
 * Loads historical tick data from Deriv API for initial analysis
 */

import { derivConnectionPool, ConnectionType } from './deriv-connection-pool.service';

interface HistoricalTickData {
    quote: number;
    epoch: number;
    lastDigit: number;
}

interface HistoricalLoadResult {
    success: boolean;
    ticks: HistoricalTickData[];
    count: number;
    symbol: string;
    error?: string;
}

export class HistoricalTickLoaderService {
    private static instance: HistoricalTickLoaderService;

    public static getInstance(): HistoricalTickLoaderService {
        if (!HistoricalTickLoaderService.instance) {
            HistoricalTickLoaderService.instance = new HistoricalTickLoaderService();
        }
        return HistoricalTickLoaderService.instance;
    }

    /**
     * Load historical tick data for a symbol
     */
    public async loadHistoricalTicks(
        symbol: string, 
        count: number = 1000,
        connectionType: ConnectionType = ConnectionType.SIGNALS
    ): Promise<HistoricalLoadResult> {
        console.log(`📊 Loading ${count} historical ticks for ${symbol}...`);

        try {
            const connection = derivConnectionPool.getConnection(connectionType);
            
            // Wait for connection to be ready
            if (!connection.isConnectionActive()) {
                console.log('⏳ Waiting for connection to be established...');
                await this.waitForConnection(connection, 10000);
            }

            // Request historical tick data using ticks_history API
            const response = await this.requestTicksHistory(symbol, count);
            
            if (!response || !response.ticks_history) {
                throw new Error('Invalid response from ticks_history API');
            }

            // Process the historical data
            const ticks: HistoricalTickData[] = response.ticks_history.prices.map((price: number, index: number) => {
                const quote = parseFloat(price.toString());
                const epoch = response.ticks_history.times[index];
                const lastDigit = this.extractLastDigit(quote);
                
                return {
                    quote,
                    epoch,
                    lastDigit
                };
            });

            console.log(`✅ Successfully loaded ${ticks.length} historical ticks for ${symbol}`);
            
            return {
                success: true,
                ticks,
                count: ticks.length,
                symbol
            };

        } catch (error) {
            console.error(`❌ Failed to load historical ticks for ${symbol}:`, error);
            
            return {
                success: false,
                ticks: [],
                count: 0,
                symbol,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Request ticks history from Deriv API
     */
    private async requestTicksHistory(symbol: string, count: number): Promise<any> {
        return new Promise((resolve, reject) => {
            // Use the bot-skeleton API to request historical data
            const api = (window as any).api_base?.api;
            
            if (!api) {
                reject(new Error('Deriv API not available'));
                return;
            }

            const request = {
                ticks_history: symbol,
                adjust_start_time: 1,
                count: Math.min(count, 5000), // API limit is 5000
                end: 'latest',
                style: 'ticks'
            };

            console.log('📡 Requesting historical data:', request);

            const subscription = api.send(request);
            
            const timeout = setTimeout(() => {
                reject(new Error('Historical data request timeout'));
            }, 15000); // 15 second timeout

            subscription.then((response: any) => {
                clearTimeout(timeout);
                
                if (response.error) {
                    reject(new Error(response.error.message || 'API error'));
                } else {
                    resolve(response);
                }
            }).catch((error: any) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }

    /**
     * Extract last digit from quote using the same method as live data
     */
    private extractLastDigit(quote: number): number {
        const quoteStr = quote.toFixed(5);
        const digitsOnly = quoteStr.replace('.', '');
        return parseInt(digitsOnly.slice(-1));
    }

    /**
     * Wait for connection to be established
     */
    private async waitForConnection(connection: any, timeout: number = 10000): Promise<void> {
        const startTime = Date.now();
        
        while (!connection.isConnectionActive() && Date.now() - startTime < timeout) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if (!connection.isConnectionActive()) {
            throw new Error('Connection timeout');
        }
    }

    /**
     * Load historical data with retry logic
     */
    public async loadHistoricalTicksWithRetry(
        symbol: string,
        count: number = 1000,
        maxRetries: number = 3
    ): Promise<HistoricalLoadResult> {
        let lastError: string = '';
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            console.log(`🔄 Historical data loading attempt ${attempt}/${maxRetries} for ${symbol}`);
            
            try {
                const result = await this.loadHistoricalTicks(symbol, count);
                
                if (result.success && result.ticks.length > 0) {
                    return result;
                }
                
                lastError = result.error || 'No data received';
                
            } catch (error) {
                lastError = error instanceof Error ? error.message : 'Unknown error';
                console.warn(`⚠️ Attempt ${attempt} failed:`, lastError);
            }
            
            // Wait before retry (exponential backoff)
            if (attempt < maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                console.log(`⏰ Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        return {
            success: false,
            ticks: [],
            count: 0,
            symbol,
            error: `Failed after ${maxRetries} attempts. Last error: ${lastError}`
        };
    }

    /**
     * Generate sample historical data for testing (fallback)
     */
    public generateSampleHistoricalData(symbol: string, count: number = 1000): HistoricalLoadResult {
        console.log(`🎲 Generating ${count} sample historical ticks for ${symbol} (fallback mode)`);
        
        const ticks: HistoricalTickData[] = [];
        const basePrice = this.getBasePrice(symbol);
        const now = Date.now();
        
        for (let i = 0; i < count; i++) {
            // Generate realistic price movement
            const volatility = this.getVolatility(symbol);
            const randomChange = (Math.random() - 0.5) * volatility;
            const quote = basePrice + randomChange + (Math.random() * 0.1);
            const epoch = Math.floor((now - (count - i) * 1000) / 1000); // 1 second intervals
            const lastDigit = this.extractLastDigit(quote);
            
            ticks.push({
                quote: parseFloat(quote.toFixed(5)),
                epoch,
                lastDigit
            });
        }
        
        console.log(`✅ Generated ${ticks.length} sample ticks for ${symbol}`);
        
        return {
            success: true,
            ticks,
            count: ticks.length,
            symbol
        };
    }

    /**
     * Get base price for symbol
     */
    private getBasePrice(symbol: string): number {
        const basePrices: Record<string, number> = {
            'R_10': 1000,
            'R_25': 1500,
            'R_50': 2000,
            'R_75': 2500,
            'R_100': 3000,
            '1HZ10V': 1000,
            '1HZ25V': 1500,
            '1HZ50V': 2000,
            '1HZ75V': 2500,
            '1HZ100V': 3000,
            'BOOM1000': 5000,
            'BOOM500': 4000,
            'CRASH1000': 3000,
            'CRASH500': 2500
        };
        
        return basePrices[symbol] || 2000;
    }

    /**
     * Get volatility for symbol
     */
    private getVolatility(symbol: string): number {
        const volatilities: Record<string, number> = {
            'R_10': 10,
            'R_25': 25,
            'R_50': 50,
            'R_75': 75,
            'R_100': 100,
            '1HZ10V': 10,
            '1HZ25V': 25,
            '1HZ50V': 50,
            '1HZ75V': 75,
            '1HZ100V': 100,
            'BOOM1000': 200,
            'BOOM500': 150,
            'CRASH1000': 150,
            'CRASH500': 100
        };
        
        return volatilities[symbol] || 50;
    }
}

// Create singleton instance
export const historicalTickLoader = HistoricalTickLoaderService.getInstance();