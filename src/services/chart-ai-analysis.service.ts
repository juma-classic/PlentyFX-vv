/**
 * Chart AI Analysis Service
 * Analyzes chart data to draw trend lines and predict market direction
 */

interface Candle {
    open: number;
    high: number;
    low: number;
    close: number;
    epoch: number;
}

interface TrendLine {
    id: string;
    type: 'support' | 'resistance' | 'uptrend' | 'downtrend';
    points: { x: number; y: number }[];
    strength: number;
    color: string;
}

interface ChartPattern {
    type: 'double_top' | 'double_bottom' | 'head_shoulders' | 'triangle' | 'channel';
    confidence: number;
    prediction: 'UP' | 'DOWN';
}

interface AISignal {
    direction: 'UP' | 'DOWN';
    confidence: number;
    justification: string[];
    trendLines: TrendLine[];
    patterns: ChartPattern[];
    supportLevel: number | null;
    resistanceLevel: number | null;
    targetPrice: number | null;
    stopLoss: number | null;
}

export class ChartAIAnalysisService {
    private candles: Candle[] = [];
    private readonly MIN_CANDLES = 20;

    /**
     * Add candle data
     */
    addCandle(candle: Candle): void {
        this.candles.push(candle);
        if (this.candles.length > 200) {
            this.candles.shift();
        }
    }

    /**
     * Set candles data
     */
    setCandles(candles: Candle[]): void {
        this.candles = candles.slice(-200);
    }

    /**
     * Find swing highs (peaks)
     */
    private findSwingHighs(lookback: number = 5): { index: number; price: number }[] {
        const swingHighs: { index: number; price: number }[] = [];

        for (let i = lookback; i < this.candles.length - lookback; i++) {
            const current = this.candles[i].high;
            let isSwingHigh = true;

            // Check if current is higher than surrounding candles
            for (let j = i - lookback; j <= i + lookback; j++) {
                if (j !== i && this.candles[j].high >= current) {
                    isSwingHigh = false;
                    break;
                }
            }

            if (isSwingHigh) {
                swingHighs.push({ index: i, price: current });
            }
        }

        return swingHighs;
    }

    /**
     * Find swing lows (valleys)
     */
    private findSwingLows(lookback: number = 5): { index: number; price: number }[] {
        const swingLows: { index: number; price: number }[] = [];

        for (let i = lookback; i < this.candles.length - lookback; i++) {
            const current = this.candles[i].low;
            let isSwingLow = true;

            // Check if current is lower than surrounding candles
            for (let j = i - lookback; j <= i + lookback; j++) {
                if (j !== i && this.candles[j].low <= current) {
                    isSwingLow = false;
                    break;
                }
            }

            if (isSwingLow) {
                swingLows.push({ index: i, price: current });
            }
        }

        return swingLows;
    }

    /**
     * Calculate trend line from points
     */
    private calculateTrendLine(points: { index: number; price: number }[]): TrendLine | null {
        if (points.length < 2) return null;

        // Use first and last points for trend line
        const first = points[0];
        const last = points[points.length - 1];

        const slope = (last.price - first.price) / (last.index - first.index);
        const isUptrend = slope > 0;

        // Calculate how many points touch the line
        let touchCount = 0;
        const tolerance = (Math.max(...points.map(p => p.price)) - Math.min(...points.map(p => p.price))) * 0.02;

        points.forEach(point => {
            const expectedPrice = first.price + slope * (point.index - first.index);
            if (Math.abs(point.price - expectedPrice) < tolerance) {
                touchCount++;
            }
        });

        const strength = touchCount / points.length;

        return {
            id: `trend-${Date.now()}-${Math.random()}`,
            type: isUptrend ? 'uptrend' : 'downtrend',
            points: [
                { x: first.index, y: first.price },
                { x: last.index, y: last.price },
            ],
            strength,
            color: isUptrend ? '#4caf50' : '#f44336',
        };
    }

    /**
     * Find support and resistance levels
     */
    private findSupportResistance(): { support: number | null; resistance: number | null } {
        if (this.candles.length < this.MIN_CANDLES) {
            return { support: null, resistance: null };
        }

        const swingHighs = this.findSwingHighs();
        const swingLows = this.findSwingLows();

        // Find most recent support (lowest swing low in recent candles)
        const recentLows = swingLows.slice(-5);
        const support = recentLows.length > 0 ? Math.min(...recentLows.map(s => s.price)) : null;

        // Find most recent resistance (highest swing high in recent candles)
        const recentHighs = swingHighs.slice(-5);
        const resistance = recentHighs.length > 0 ? Math.max(...recentHighs.map(s => s.price)) : null;

        return { support, resistance };
    }

    /**
     * Detect chart patterns
     */
    private detectPatterns(): ChartPattern[] {
        const patterns: ChartPattern[] = [];

        if (this.candles.length < 30) return patterns;

        const swingHighs = this.findSwingHighs();
        const swingLows = this.findSwingLows();

        // Double Top Pattern
        if (swingHighs.length >= 2) {
            const lastTwo = swingHighs.slice(-2);
            const priceDiff = Math.abs(lastTwo[0].price - lastTwo[1].price);
            const avgPrice = (lastTwo[0].price + lastTwo[1].price) / 2;
            const tolerance = avgPrice * 0.02;

            if (priceDiff < tolerance) {
                patterns.push({
                    type: 'double_top',
                    confidence: 0.75,
                    prediction: 'DOWN',
                });
            }
        }

        // Double Bottom Pattern
        if (swingLows.length >= 2) {
            const lastTwo = swingLows.slice(-2);
            const priceDiff = Math.abs(lastTwo[0].price - lastTwo[1].price);
            const avgPrice = (lastTwo[0].price + lastTwo[1].price) / 2;
            const tolerance = avgPrice * 0.02;

            if (priceDiff < tolerance) {
                patterns.push({
                    type: 'double_bottom',
                    confidence: 0.75,
                    prediction: 'UP',
                });
            }
        }

        return patterns;
    }

    /**
     * Calculate momentum
     */
    private calculateMomentum(period: number = 14): number {
        if (this.candles.length < period + 1) return 0;

        const recent = this.candles.slice(-period);
        const current = recent[recent.length - 1].close;
        const past = recent[0].close;

        return ((current - past) / past) * 100;
    }

    /**
     * Calculate RSI (Relative Strength Index)
     */
    private calculateRSI(period: number = 14): number {
        if (this.candles.length < period + 1) return 50;

        const changes: number[] = [];
        for (let i = 1; i < this.candles.length; i++) {
            changes.push(this.candles[i].close - this.candles[i - 1].close);
        }

        const recentChanges = changes.slice(-period);
        const gains = recentChanges.filter(c => c > 0);
        const losses = recentChanges.filter(c => c < 0).map(c => Math.abs(c));

        const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0;
        const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0;

        if (avgLoss === 0) return 100;

        const rs = avgGain / avgLoss;
        const rsi = 100 - 100 / (1 + rs);

        return rsi;
    }

    /**
     * Generate AI signal with justification
     */
    generateSignal(): AISignal | null {
        if (this.candles.length < this.MIN_CANDLES) {
            return null;
        }

        const justification: string[] = [];
        let upScore = 0;
        let downScore = 0;

        // 1. Trend Analysis
        const swingHighs = this.findSwingHighs();
        const swingLows = this.findSwingLows();

        const uptrendLine = this.calculateTrendLine(swingLows);
        const downtrendLine = this.calculateTrendLine(swingHighs);

        const trendLines: TrendLine[] = [];

        if (uptrendLine && uptrendLine.strength > 0.6) {
            trendLines.push(uptrendLine);
            upScore += 2;
            justification.push(`✓ Strong uptrend detected (${(uptrendLine.strength * 100).toFixed(0)}% strength)`);
        }

        if (downtrendLine && downtrendLine.strength > 0.6) {
            trendLines.push(downtrendLine);
            downScore += 2;
            justification.push(`✓ Strong downtrend detected (${(downtrendLine.strength * 100).toFixed(0)}% strength)`);
        }

        // 2. Support/Resistance
        const { support, resistance } = this.findSupportResistance();
        const currentPrice = this.candles[this.candles.length - 1].close;

        if (support && resistance) {
            if (support) {
                trendLines.push({
                    id: `support-${Date.now()}`,
                    type: 'support',
                    points: [
                        { x: 0, y: support },
                        { x: this.candles.length - 1, y: support },
                    ],
                    strength: 0.8,
                    color: '#4caf50',
                });
            }

            if (resistance) {
                trendLines.push({
                    id: `resistance-${Date.now()}`,
                    type: 'resistance',
                    points: [
                        { x: 0, y: resistance },
                        { x: this.candles.length - 1, y: resistance },
                    ],
                    strength: 0.8,
                    color: '#f44336',
                });
            }

            const range = resistance - support;
            const position = (currentPrice - support) / range;

            if (position < 0.3) {
                upScore += 1.5;
                justification.push(`✓ Price near support level (${support.toFixed(2)})`);
            } else if (position > 0.7) {
                downScore += 1.5;
                justification.push(`✓ Price near resistance level (${resistance.toFixed(2)})`);
            }
        }

        // 3. Momentum
        const momentum = this.calculateMomentum();
        if (momentum > 2) {
            upScore += 1;
            justification.push(`✓ Positive momentum (+${momentum.toFixed(1)}%)`);
        } else if (momentum < -2) {
            downScore += 1;
            justification.push(`✓ Negative momentum (${momentum.toFixed(1)}%)`);
        }

        // 4. RSI
        const rsi = this.calculateRSI();
        if (rsi < 30) {
            upScore += 1.5;
            justification.push(`✓ RSI oversold (${rsi.toFixed(0)}) - potential reversal UP`);
        } else if (rsi > 70) {
            downScore += 1.5;
            justification.push(`✓ RSI overbought (${rsi.toFixed(0)}) - potential reversal DOWN`);
        }

        // 5. Pattern Detection
        const patterns = this.detectPatterns();
        patterns.forEach(pattern => {
            if (pattern.prediction === 'UP') {
                upScore += pattern.confidence;
                justification.push(`✓ ${pattern.type.replace('_', ' ').toUpperCase()} pattern detected (${(pattern.confidence * 100).toFixed(0)}% confidence)`);
            } else {
                downScore += pattern.confidence;
                justification.push(`✓ ${pattern.type.replace('_', ' ').toUpperCase()} pattern detected (${(pattern.confidence * 100).toFixed(0)}% confidence)`);
            }
        });

        // 6. Recent Price Action
        const recentCandles = this.candles.slice(-5);
        const bullishCandles = recentCandles.filter(c => c.close > c.open).length;
        const bearishCandles = recentCandles.filter(c => c.close < c.open).length;

        if (bullishCandles >= 4) {
            upScore += 0.5;
            justification.push(`✓ Strong bullish momentum (${bullishCandles}/5 green candles)`);
        } else if (bearishCandles >= 4) {
            downScore += 0.5;
            justification.push(`✓ Strong bearish momentum (${bearishCandles}/5 red candles)`);
        }

        // Determine direction and confidence
        const direction = upScore > downScore ? 'UP' : 'DOWN';
        const totalScore = upScore + downScore;
        const confidence = totalScore > 0 ? Math.min((Math.max(upScore, downScore) / totalScore) * 100, 95) : 50;

        // Calculate target and stop loss
        let targetPrice: number | null = null;
        let stopLoss: number | null = null;

        if (direction === 'UP' && support && resistance) {
            const range = resistance - currentPrice;
            targetPrice = currentPrice + range * 0.7;
            stopLoss = support;
        } else if (direction === 'DOWN' && support && resistance) {
            const range = currentPrice - support;
            targetPrice = currentPrice - range * 0.7;
            stopLoss = resistance;
        }

        return {
            direction,
            confidence,
            justification,
            trendLines,
            patterns,
            supportLevel: support,
            resistanceLevel: resistance,
            targetPrice,
            stopLoss,
        };
    }

    /**
     * Clear candles
     */
    clearCandles(): void {
        this.candles = [];
    }
}

export const chartAIAnalysisService = new ChartAIAnalysisService();
