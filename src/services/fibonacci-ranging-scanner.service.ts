/**
 * Fibonacci Ranging Market Scanner Service
 * Scans markets for ranging conditions and generates Fibonacci-based signals
 */

import { derivAPIService } from './deriv-api.service';

export interface FibonacciLevel {
    level: number;
    price: number;
    type: 'support' | 'resistance';
}

export interface RangingMarketSignal {
    market: string;
    marketName: string;
    isRanging: boolean;
    confidence: number;
    fibonacciLevels: FibonacciLevel[];
    currentPrice: number;
    recommendation: {
        action: 'OVER' | 'UNDER';
        barrier: number;
        confidence: number;
        reasoning: string;
    };
    timeframe: string;
    analysis: {
        volatility: number;
        trendStrength: number;
        rangingScore: number;
        fibonacciAlignment: number;
    };
}

class FibonacciRangingScannerService {
    private readonly MARKETS_TO_SCAN = [
        // Standard Volatility Indices
        { symbol: 'R_10', name: 'Volatility 10' },
        { symbol: 'R_25', name: 'Volatility 25' },
        { symbol: 'R_50', name: 'Volatility 50' },
        { symbol: 'R_75', name: 'Volatility 75' },
        { symbol: 'R_100', name: 'Volatility 100' },

        // 1-Second Volatility Indices
        { symbol: '1HZ10V', name: 'Volatility 10 (1s)' },
        { symbol: '1HZ25V', name: 'Volatility 25 (1s)' },
        { symbol: '1HZ50V', name: 'Volatility 50 (1s)' },
        { symbol: '1HZ75V', name: 'Volatility 75 (1s)' },
        { symbol: '1HZ100V', name: 'Volatility 100 (1s)' },

        // Jump Indices
        { symbol: 'JD10', name: 'Jump 10 Index' },
        { symbol: 'JD25', name: 'Jump 25 Index' },
        { symbol: 'JD50', name: 'Jump 50 Index' },
        { symbol: 'JD75', name: 'Jump 75 Index' },
        { symbol: 'JD100', name: 'Jump 100 Index' },

        // Boom and Crash Indices (if available)
        { symbol: 'BOOM1000', name: 'Boom 1000' },
        { symbol: 'CRASH1000', name: 'Crash 1000' },
        { symbol: 'BOOM500', name: 'Boom 500' },
        { symbol: 'CRASH500', name: 'Crash 500' },

        // Step Indices (if available)
        { symbol: 'STEPINDEX', name: 'Step Index' },

        // Range Break Indices (if available)
        { symbol: 'RDBEAR', name: 'Range Break Bear' },
        { symbol: 'RDBULL', name: 'Range Break Bull' },
    ];

    private readonly FIBONACCI_LEVELS = [0.236, 0.382, 0.5, 0.618, 0.786];

    /**
     * Scan all markets for ranging conditions and return the best signal
     */
    public async scanForRangingMarkets(): Promise<RangingMarketSignal | null> {
        console.log('🔍 Scanning markets for ranging conditions...');

        const signals: RangingMarketSignal[] = [];

        for (const market of this.MARKETS_TO_SCAN) {
            try {
                const signal = await this.analyzeMarket(market.symbol, market.name);
                if (signal && signal.isRanging) {
                    signals.push(signal);
                }
            } catch (error) {
                console.warn(`Failed to analyze ${market.name}:`, error);
            }
        }

        // Sort by confidence and ranging score
        signals.sort((a, b) => {
            const scoreA = a.confidence * a.analysis.rangingScore;
            const scoreB = b.confidence * b.analysis.rangingScore;
            return scoreB - scoreA;
        });

        const bestSignal = signals[0] || null;

        if (bestSignal) {
            console.log(
                `🎯 Best ranging market found: ${bestSignal.marketName} (${bestSignal.confidence.toFixed(1)}% confidence)`
            );
        } else {
            console.log('❌ No suitable ranging markets found');
        }

        return bestSignal;
    }

    /**
     * Analyze a specific market for ranging conditions
     */
    private async analyzeMarket(symbol: string, name: string): Promise<RangingMarketSignal | null> {
        try {
            // Get historical tick data (last 100 ticks)
            const tickData = await this.getTickHistory(symbol, 100);

            if (tickData.length < 50) {
                console.warn(`Insufficient data for ${name}`);
                return null;
            }

            const prices = tickData.map(tick => tick.quote);
            const currentPrice = prices[prices.length - 1];

            // Calculate price range and volatility
            const high = Math.max(...prices);
            const low = Math.min(...prices);
            const range = high - low;
            const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

            // Calculate volatility (standard deviation)
            const volatility = this.calculateVolatility(prices);

            // Calculate trend strength
            const trendStrength = this.calculateTrendStrength(prices);

            // Calculate ranging score (lower trend strength + moderate volatility = better ranging)
            const rangingScore = this.calculateRangingScore(volatility, trendStrength, range, avgPrice);

            // Generate Fibonacci levels
            const fibonacciLevels = this.calculateFibonacciLevels(high, low);

            // Check if market is ranging (low trend strength, moderate volatility)
            const isRanging = rangingScore > 0.6 && trendStrength < 0.4;

            if (!isRanging) {
                return null;
            }

            // Generate recommendation based on Fibonacci levels
            const recommendation = this.generateFibonacciRecommendation(
                currentPrice,
                fibonacciLevels,
                high,
                low,
                avgPrice
            );

            // Calculate overall confidence
            const confidence = Math.min(95, rangingScore * 100);

            return {
                market: symbol,
                marketName: name,
                isRanging,
                confidence,
                fibonacciLevels,
                currentPrice,
                recommendation,
                timeframe: '1m',
                analysis: {
                    volatility,
                    trendStrength,
                    rangingScore,
                    fibonacciAlignment: this.calculateFibonacciAlignment(currentPrice, fibonacciLevels),
                },
            };
        } catch (error) {
            console.error(`Error analyzing ${name}:`, error);
            return null;
        }
    }

    /**
     * Get tick history for a symbol
     */
    private async getTickHistory(symbol: string, count: number): Promise<any[]> {
        try {
            const response = await derivAPIService.getTicksHistory({
                symbol: symbol,
                count: count,
                end: 'latest',
                style: 'ticks',
            });

            if (response.history && response.history.prices && response.history.times) {
                const ticks = response.history.prices.map((price: number, index: number) => ({
                    quote: price,
                    epoch: response.history!.times[index],
                }));
                return ticks;
            } else {
                throw new Error('No history data received');
            }
        } catch (error) {
            console.error(`Failed to get tick history for ${symbol}:`, error);
            throw error;
        }
    }

    /**
     * Calculate volatility (standard deviation)
     */
    private calculateVolatility(prices: number[]): number {
        const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        const squaredDiffs = prices.map(price => Math.pow(price - mean, 2));
        const avgSquaredDiff = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / squaredDiffs.length;
        const standardDeviation = Math.sqrt(avgSquaredDiff);

        // Normalize volatility (0-1 scale)
        return Math.min(1, standardDeviation / mean);
    }

    /**
     * Calculate trend strength (0 = ranging, 1 = strong trend)
     */
    private calculateTrendStrength(prices: number[]): number {
        if (prices.length < 10) return 0;

        // Calculate moving averages
        const shortMA = this.calculateMovingAverage(prices.slice(-10));
        const longMA = this.calculateMovingAverage(prices.slice(-20));

        // Calculate trend direction consistency
        let upMoves = 0;
        let downMoves = 0;

        for (let i = 1; i < prices.length; i++) {
            if (prices[i] > prices[i - 1]) upMoves++;
            else if (prices[i] < prices[i - 1]) downMoves++;
        }

        const totalMoves = upMoves + downMoves;
        const directionConsistency = totalMoves > 0 ? Math.abs(upMoves - downMoves) / totalMoves : 0;

        // Calculate MA divergence
        const maDivergence = Math.abs(shortMA - longMA) / longMA;

        // Combine factors (higher = more trending)
        return Math.min(1, (directionConsistency + maDivergence) / 2);
    }

    /**
     * Calculate ranging score (higher = better for ranging)
     */
    private calculateRangingScore(volatility: number, trendStrength: number, range: number, avgPrice: number): number {
        // Ideal ranging market: moderate volatility, low trend strength
        const volatilityScore =
            volatility > 0.01 && volatility < 0.05 ? 1 : Math.max(0, 1 - Math.abs(volatility - 0.03) * 20);
        const trendScore = Math.max(0, 1 - trendStrength * 2);
        const rangeScore = range / avgPrice > 0.001 ? 1 : 0; // Ensure there's some price movement

        return volatilityScore * 0.4 + trendScore * 0.5 + rangeScore * 0.1;
    }

    /**
     * Calculate Fibonacci retracement levels
     */
    private calculateFibonacciLevels(high: number, low: number): FibonacciLevel[] {
        const range = high - low;
        const levels: FibonacciLevel[] = [];

        this.FIBONACCI_LEVELS.forEach(level => {
            const price = low + range * level;
            const type = level < 0.5 ? 'support' : 'resistance';
            levels.push({ level, price, type });
        });

        return levels;
    }

    /**
     * Generate recommendation based on Fibonacci levels
     */
    private generateFibonacciRecommendation(
        currentPrice: number,
        fibLevels: FibonacciLevel[],
        high: number,
        low: number,
        avgPrice: number
    ): RangingMarketSignal['recommendation'] {
        // Find nearest Fibonacci levels
        const sortedLevels = [...fibLevels].sort(
            (a, b) => Math.abs(a.price - currentPrice) - Math.abs(b.price - currentPrice)
        );

        const nearestLevel = sortedLevels[0];
        const distanceToLevel = Math.abs(currentPrice - nearestLevel.price);
        const priceRange = high - low;
        const relativeDistance = distanceToLevel / priceRange;

        let action: 'OVER' | 'UNDER';
        let barrier: number;
        let confidence: number;
        let reasoning: string;

        // Determine action based on position relative to Fibonacci levels
        if (currentPrice < avgPrice) {
            // Price in lower half - expect bounce up
            action = 'OVER';
            barrier = Math.floor(currentPrice * 10) / 10; // Round down for OVER
            confidence = Math.max(60, 90 - relativeDistance * 100);
            reasoning = `Price near Fibonacci support at ${nearestLevel.price.toFixed(5)}. Expecting bounce higher.`;
        } else {
            // Price in upper half - expect pullback down
            action = 'UNDER';
            barrier = Math.ceil(currentPrice * 10) / 10; // Round up for UNDER
            confidence = Math.max(60, 90 - relativeDistance * 100);
            reasoning = `Price near Fibonacci resistance at ${nearestLevel.price.toFixed(5)}. Expecting pullback lower.`;
        }

        // Adjust confidence based on Fibonacci alignment
        if (relativeDistance < 0.1) {
            // Very close to Fib level
            confidence = Math.min(95, confidence + 10);
        }

        return { action, barrier, confidence, reasoning };
    }

    /**
     * Calculate how well current price aligns with Fibonacci levels
     */
    private calculateFibonacciAlignment(currentPrice: number, fibLevels: FibonacciLevel[]): number {
        const nearestLevel = fibLevels.reduce((nearest, level) =>
            Math.abs(level.price - currentPrice) < Math.abs(nearest.price - currentPrice) ? level : nearest
        );

        const distance = Math.abs(currentPrice - nearestLevel.price);
        const priceRange = Math.max(...fibLevels.map(l => l.price)) - Math.min(...fibLevels.map(l => l.price));

        // Return alignment score (1 = perfect alignment, 0 = far from any level)
        return Math.max(0, 1 - (distance / priceRange) * 5);
    }

    /**
     * Calculate simple moving average
     */
    private calculateMovingAverage(prices: number[]): number {
        return prices.reduce((sum, price) => sum + price, 0) / prices.length;
    }
}

export const fibonacciRangingScannerService = new FibonacciRangingScannerService();
