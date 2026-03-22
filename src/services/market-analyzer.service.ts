/**
 * Market Analyzer Service
 * 
 * Real-time market analysis engine for Strategy Orchestrator.
 * Analyzes tick data and generates trading signals.
 * 
 * Extracted and adapted from BinaryFX volatility analyzer.
 */

export interface TickData {
    time: number;
    quote: number;
}

export interface AnalysisResult {
    strategyType: 'rise-fall' | 'even-odd' | 'over-under' | 'matches-differs';
    recommendation: string | null;
    confidence: number;
    data: Record<string, any>;
    timestamp: number;
}

export interface MarketAnalyzerConfig {
    symbol: string;
    tickCount: number;
    overUnderBarrier: number;
    appId: string;
}

class MarketAnalyzerService {
    private ws: WebSocket | null = null;
    private reconnectTimeout: number | null = null;
    private tickHistory: TickData[] = [];
    private config: MarketAnalyzerConfig = {
        symbol: 'R_10',
        tickCount: 120,
        overUnderBarrier: 5,
        appId: '110800',
    };
    private decimalPlaces: number = 2;
    private reconnectAttempts: number = 0;
    private readonly MAX_RECONNECT_ATTEMPTS = 5;
    private listeners: Map<string, Set<Function>> = new Map();
    private isConnected: boolean = false;

    constructor(config?: Partial<MarketAnalyzerConfig>) {
        if (config) {
            this.config = { ...this.config, ...config };
        }
    }

    /**
     * Start the market analyzer
     */
    public start(): void {
        console.log('🚀 Starting Market Analyzer');
        this.connectWebSocket();
    }

    /**
     * Stop the market analyzer
     */
    public stop(): void {
        console.log('🛑 Stopping Market Analyzer');
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        if (this.ws) {
            this.ws.onclose = null;
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
        this.emit('connection-status', { status: 'disconnected' });
    }

    /**
     * Update symbol
     */
    public updateSymbol(symbol: string): void {
        console.log(`🔄 Updating symbol: ${this.config.symbol} -> ${symbol}`);
        
        if (this.config.symbol === symbol && this.isConnected) {
            console.log('Symbol unchanged, skipping reconnection');
            return;
        }

        this.config.symbol = symbol;
        this.tickHistory = [];

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            try {
                this.ws.send(JSON.stringify({ forget_all: 'ticks' }));
                setTimeout(() => this.requestTickHistory(), 300);
            } catch (error) {
                console.error('Error unsubscribing:', error);
                this.connectWebSocket();
            }
        } else {
            this.connectWebSocket();
        }
    }

    /**
     * Update tick count
     */
    public updateTickCount(count: number): void {
        console.log(`🔄 Updating tick count: ${this.config.tickCount} -> ${count}`);
        
        if (isNaN(count) || count <= 0) {
            console.error('Invalid tick count:', count);
            return;
        }

        this.config.tickCount = count;
        this.tickHistory = [];

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            try {
                this.ws.send(JSON.stringify({ forget_all: 'ticks' }));
                setTimeout(() => this.requestTickHistory(), 300);
            } catch (error) {
                console.error('Error unsubscribing:', error);
                this.connectWebSocket();
            }
        } else {
            this.connectWebSocket();
        }
    }

    /**
     * Update over/under barrier
     */
    public updateBarrier(barrier: number): void {
        console.log(`🔄 Updating barrier: ${this.config.overUnderBarrier} -> ${barrier}`);
        this.config.overUnderBarrier = barrier;
        this.performAnalysis();
    }

    /**
     * Get current status
     */
    public getStatus() {
        return {
            connected: this.isConnected,
            symbol: this.config.symbol,
            tickCount: this.config.tickCount,
            dataAvailable: this.tickHistory.length > 0,
            ticksCollected: this.tickHistory.length,
            lastUpdate: Date.now(),
        };
    }

    /**
     * Get tick history
     */
    public getTickHistory(): TickData[] {
        return [...this.tickHistory];
    }

    /**
     * Event listener
     */
    public on(event: string, callback: Function): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback);
    }

    /**
     * Remove event listener
     */
    public off(event: string, callback: Function): void {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.delete(callback);
        }
    }

    /**
     * Emit event
     */
    private emit(event: string, data: any): void {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${event} callback:`, error);
                }
            });
        }
    }

    /**
     * Connect to WebSocket
     */
    private connectWebSocket(): void {
        console.log('🔌 Connecting to Deriv WebSocket API');

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.ws) {
            try {
                this.ws.onclose = null;
                this.ws.close();
            } catch (error) {
                console.error('Error closing existing connection:', error);
            }
            this.ws = null;
        }

        try {
            const wsUrl = `wss://ws.derivws.com/websockets/v3?app_id=${this.config.appId}`;
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('✅ WebSocket connection established');
                this.reconnectAttempts = 0;
                this.isConnected = true;
                this.emit('connection-status', { status: 'connected' });

                setTimeout(() => {
                    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                        this.requestTickHistory();
                    }
                }, 500);
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.error) {
                        console.error('❌ WebSocket API error:', data.error);
                        this.emit('connection-status', { 
                            status: 'error', 
                            error: data.error.message 
                        });
                        return;
                    }

                    if (data.history) {
                        console.log(`📊 Received history for ${this.config.symbol}: ${data.history.prices.length} ticks`);
                        this.tickHistory = data.history.prices.map((price: string, index: number) => ({
                            time: data.history.times[index],
                            quote: parseFloat(price),
                        }));
                        this.detectDecimalPlaces();
                        this.performAnalysis();
                    } else if (data.tick) {
                        const quote = parseFloat(data.tick.quote);
                        this.tickHistory.push({
                            time: data.tick.epoch,
                            quote,
                        });

                        if (this.tickHistory.length > this.config.tickCount) {
                            this.tickHistory.shift();
                        }

                        this.performAnalysis();
                    } else if (data.ping) {
                        this.ws?.send(JSON.stringify({ pong: 1 }));
                    }
                } catch (error) {
                    console.error('Error processing message:', error);
                }
            };

            this.ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                this.isConnected = false;
                this.emit('connection-status', { status: 'error', error: 'Connection error' });
                this.scheduleReconnect();
            };

            this.ws.onclose = (event) => {
                console.log('🔄 WebSocket connection closed', event.code, event.reason);
                this.isConnected = false;
                this.emit('connection-status', { status: 'disconnected' });
                this.scheduleReconnect();
            };
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            this.isConnected = false;
            this.emit('connection-status', { status: 'error', error: String(error) });
            this.scheduleReconnect();
        }
    }

    /**
     * Schedule reconnection
     */
    private scheduleReconnect(): void {
        this.reconnectAttempts++;

        if (this.reconnectAttempts > this.MAX_RECONNECT_ATTEMPTS) {
            console.log(`⚠️ Maximum reconnection attempts (${this.MAX_RECONNECT_ATTEMPTS}) reached`);
            this.emit('connection-status', { 
                status: 'error', 
                error: 'Maximum reconnection attempts reached' 
            });
            return;
        }

        const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts - 1), 30000);
        console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

        this.reconnectTimeout = window.setTimeout(() => {
            console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})...`);
            this.connectWebSocket();
        }, delay);
    }

    /**
     * Request tick history
     */
    private requestTickHistory(): void {
        const request = {
            ticks_history: this.config.symbol,
            count: this.config.tickCount,
            end: 'latest',
            style: 'ticks',
            subscribe: 1,
        };

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log(`📡 Requesting tick history for ${this.config.symbol} (${this.config.tickCount} ticks)`);
            try {
                this.ws.send(JSON.stringify(request));
            } catch (error) {
                console.error('Error sending tick history request:', error);
                this.scheduleReconnect();
            }
        } else {
            console.error('❌ WebSocket not ready to request history');
            this.scheduleReconnect();
        }
    }

    /**
     * Detect decimal places
     */
    private detectDecimalPlaces(): void {
        if (this.tickHistory.length === 0) return;

        this.decimalPlaces = Math.max(
            ...this.tickHistory.map(tick => {
                const decimalPart = tick.quote.toString().split('.')[1] || '';
                return decimalPart.length;
            }),
            2
        );
    }

    /**
     * Get last digit from quote
     */
    private getLastDigit(quote: number): number {
        let decimalPart = quote.toString().split('.')[1] || '';
        while (decimalPart.length < this.decimalPlaces) {
            decimalPart += '0';
        }
        return Number(decimalPart.slice(-1));
    }

    /**
     * Perform market analysis
     */
    private performAnalysis(): void {
        if (this.tickHistory.length === 0) {
            console.warn('⚠️ No tick history available for analysis');
            return;
        }

        const currentPrice = this.tickHistory[this.tickHistory.length - 1].quote.toFixed(this.decimalPlaces);
        this.emit('price-update', {
            price: currentPrice,
            symbol: this.config.symbol,
        });

        // Analyze all strategies
        this.analyzeRiseFall();
        this.analyzeEvenOdd();
        this.analyzeOverUnder();
        this.analyzeMatchesDiffers();
    }

    /**
     * Analyze Rise/Fall strategy
     */
    private analyzeRiseFall(): void {
        let rises = 0;
        let falls = 0;

        for (let i = 1; i < this.tickHistory.length; i++) {
            if (this.tickHistory[i].quote > this.tickHistory[i - 1].quote) {
                rises++;
            } else if (this.tickHistory[i].quote < this.tickHistory[i - 1].quote) {
                falls++;
            }
        }

        const total = this.tickHistory.length - 1;
        const riseRatio = ((rises / total) * 100).toFixed(2);
        const fallRatio = ((falls / total) * 100).toFixed(2);
        const risePercent = parseFloat(riseRatio);
        const fallPercent = parseFloat(fallRatio);

        const result: AnalysisResult = {
            strategyType: 'rise-fall',
            recommendation: risePercent > 55 ? 'RISE' : fallPercent > 55 ? 'FALL' : null,
            confidence: Math.max(risePercent, fallPercent),
            data: {
                riseRatio,
                fallRatio,
                rises,
                falls,
                total,
            },
            timestamp: Date.now(),
        };

        this.emit('analysis', result);
        console.log(`📊 Rise/Fall: Rise=${riseRatio}%, Fall=${fallRatio}%`);
    }

    /**
     * Analyze Even/Odd strategy
     */
    private analyzeEvenOdd(): void {
        const digitCounts = Array(10).fill(0);
        
        this.tickHistory.forEach(tick => {
            const digit = this.getLastDigit(tick.quote);
            digitCounts[digit]++;
        });

        const total = this.tickHistory.length;
        const evenCount = digitCounts.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0);
        const oddCount = digitCounts.filter((_, i) => i % 2 !== 0).reduce((a, b) => a + b, 0);
        
        const evenProbability = ((evenCount / total) * 100).toFixed(2);
        const oddProbability = ((oddCount / total) * 100).toFixed(2);
        const evenPercent = parseFloat(evenProbability);
        const oddPercent = parseFloat(oddProbability);

        // Get last 10 digits for pattern analysis
        const last10Digits = this.tickHistory.slice(-10).map(tick => this.getLastDigit(tick.quote));
        const evenOddPattern = last10Digits.map(d => d % 2 === 0 ? 'E' : 'O');

        // Calculate streak
        let streak = 1;
        const streakType = last10Digits.length > 0 && last10Digits[last10Digits.length - 1] % 2 === 0 ? 'even' : 'odd';
        for (let i = last10Digits.length - 2; i >= 0; i--) {
            const isEven = last10Digits[i] % 2 === 0;
            const prevIsEven = last10Digits[i + 1] % 2 === 0;
            if (isEven === prevIsEven) {
                streak++;
            } else {
                break;
            }
        }

        const result: AnalysisResult = {
            strategyType: 'even-odd',
            recommendation: evenPercent > 55 ? 'EVEN' : oddPercent > 55 ? 'ODD' : null,
            confidence: Math.max(evenPercent, oddPercent),
            data: {
                evenProbability,
                oddProbability,
                evenCount,
                oddCount,
                last10Digits,
                evenOddPattern,
                streak,
                streakType,
            },
            timestamp: Date.now(),
        };

        this.emit('analysis', result);
        console.log(`📊 Even/Odd: Even=${evenProbability}%, Odd=${oddProbability}%`);
    }

    /**
     * Analyze Over/Under strategy
     */
    private analyzeOverUnder(): void {
        const digitCounts = Array(10).fill(0);
        
        this.tickHistory.forEach(tick => {
            const digit = this.getLastDigit(tick.quote);
            digitCounts[digit]++;
        });

        const total = this.tickHistory.length;
        let overCount = 0;
        let underCount = 0;

        for (let i = 0; i < 10; i++) {
            if (i >= this.config.overUnderBarrier) {
                overCount += digitCounts[i];
            } else {
                underCount += digitCounts[i];
            }
        }

        const overProbability = ((overCount / total) * 100).toFixed(2);
        const underProbability = ((underCount / total) * 100).toFixed(2);
        const overPercent = parseFloat(overProbability);
        const underPercent = parseFloat(underProbability);

        // Get last 10 digits for pattern analysis
        const last10Digits = this.tickHistory.slice(-10).map(tick => this.getLastDigit(tick.quote));
        const overUnderPattern = last10Digits.map(d => d >= this.config.overUnderBarrier ? 'O' : 'U');

        const digitPercentages = digitCounts.map(count => ((count / total) * 100).toFixed(2));

        const result: AnalysisResult = {
            strategyType: 'over-under',
            recommendation: overPercent > 55 ? 'OVER' : underPercent > 55 ? 'UNDER' : null,
            confidence: Math.max(overPercent, underPercent),
            data: {
                overProbability,
                underProbability,
                overCount,
                underCount,
                barrier: this.config.overUnderBarrier,
                last10Digits,
                overUnderPattern,
                digitPercentages,
                tickHistory: this.tickHistory.map(tick => tick.quote), // Include full tick history for condition checking
            },
            timestamp: Date.now(),
        };

        this.emit('analysis', result);
        console.log(`📊 Over/Under: Over=${overProbability}%, Under=${underProbability}%, Barrier=${this.config.overUnderBarrier}`);
    }

    /**
     * Analyze Matches/Differs strategy
     */
    private analyzeMatchesDiffers(): void {
        const digitCounts = Array(10).fill(0);
        
        this.tickHistory.forEach(tick => {
            const digit = this.getLastDigit(tick.quote);
            digitCounts[digit]++;
        });

        const total = this.tickHistory.length;
        
        // Find most frequent digit
        let maxCount = 0;
        let targetDigit = 0;
        digitCounts.forEach((count, digit) => {
            if (count > maxCount) {
                maxCount = count;
                targetDigit = digit;
            }
        });

        const mostFrequentProbability = ((maxCount / total) * 100).toFixed(2);
        const mostFreqPercent = parseFloat(mostFrequentProbability);

        const digitFrequencies = digitCounts.map((count, digit) => ({
            digit,
            percentage: ((count / total) * 100).toFixed(2),
            count,
        }));

        const currentLastDigit = this.tickHistory.length > 0 
            ? this.getLastDigit(this.tickHistory[this.tickHistory.length - 1].quote)
            : undefined;

        const result: AnalysisResult = {
            strategyType: 'matches-differs',
            recommendation: mostFreqPercent > 15 ? 'MATCHES' : 'DIFFERS',
            confidence: mostFreqPercent > 15 ? mostFreqPercent : 100 - mostFreqPercent,
            data: {
                target: targetDigit,
                mostFrequentProbability,
                digitFrequencies,
                currentLastDigit,
                totalTicks: total,
            },
            timestamp: Date.now(),
        };

        this.emit('analysis', result);
        console.log(`📊 Matches/Differs: Target=${targetDigit}, Current=${currentLastDigit}, Probability=${mostFrequentProbability}%`);
    }
}

// Export singleton instance
export const marketAnalyzer = new MarketAnalyzerService();
