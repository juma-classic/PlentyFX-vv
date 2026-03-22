/**
 * Tick Pointer Service
 * Tracks last digit of ticks and provides digit statistics
 */

import { derivAPIService } from './deriv-api.service';

export interface TickData {
    quote: number;
    lastDigit: number;
    epoch: number;
    symbol: string;
    timestamp: number;
}

export interface DigitStats {
    digit: number;
    count: number;
    percentage: number;
    lastSeen: number;
}

class TickPointerService {
    private currentTick: TickData | null = null;
    private tickHistory: TickData[] = [];
    private digitCounts: Map<number, number> = new Map();
    private subscriptionId: string | null = null;
    private callbacks: Set<(tick: TickData) => void> = new Set();
    private maxHistorySize = 100;

    /**
     * Subscribe to ticks for a symbol
     */
    async subscribeTo(symbol: string, callback: (tick: TickData) => void): Promise<void> {
        // Unsubscribe from previous if exists
        if (this.subscriptionId) {
            await this.unsubscribe();
        }

        // Reset data
        this.reset();

        // Add callback
        this.callbacks.add(callback);

        try {
            // Subscribe to ticks
            const subscriptionId = await derivAPIService.subscribeToTicks(symbol, response => {
                if (response.tick) {
                    const tick = response.tick;
                    const lastDigit = this.extractLastDigit(tick.quote);

                    const tickData: TickData = {
                        quote: tick.quote,
                        lastDigit,
                        epoch: tick.epoch,
                        symbol: tick.symbol,
                        timestamp: Date.now(),
                    };

                    this.currentTick = tickData;
                    this.addToHistory(tickData);
                    this.updateDigitCount(lastDigit);

                    // Notify all callbacks
                    this.callbacks.forEach(cb => cb(tickData));
                }
            });

            this.subscriptionId = subscriptionId || null;
        } catch (error) {
            console.error('Failed to subscribe to ticks:', error);
            throw error;
        }
    }

    /**
     * Unsubscribe from current tick stream
     */
    async unsubscribe(): Promise<void> {
        if (this.subscriptionId) {
            try {
                await derivAPIService.unsubscribe(this.subscriptionId);
                this.subscriptionId = null;
            } catch (error) {
                console.error('Failed to unsubscribe:', error);
            }
        }
        this.callbacks.clear();
    }

    /**
     * Extract last digit from tick quote
     */
    private extractLastDigit(quote: number): number {
        const quoteStr = quote.toString();
        const lastChar = quoteStr.charAt(quoteStr.length - 1);
        return parseInt(lastChar, 10);
    }

    /**
     * Add tick to history
     */
    private addToHistory(tick: TickData): void {
        this.tickHistory.unshift(tick);
        if (this.tickHistory.length > this.maxHistorySize) {
            this.tickHistory.pop();
        }
    }

    /**
     * Update digit count
     */
    private updateDigitCount(digit: number): void {
        const currentCount = this.digitCounts.get(digit) || 0;
        this.digitCounts.set(digit, currentCount + 1);
    }

    /**
     * Get current tick
     */
    getCurrentTick(): TickData | null {
        return this.currentTick;
    }

    /**
     * Get tick history
     */
    getTickHistory(limit?: number): TickData[] {
        return limit ? this.tickHistory.slice(0, limit) : [...this.tickHistory];
    }

    /**
     * Get last N digits
     */
    getLastDigits(count: number): number[] {
        return this.tickHistory.slice(0, count).map(tick => tick.lastDigit);
    }

    /**
     * Get digit statistics
     */
    getDigitStats(): DigitStats[] {
        const totalTicks = this.tickHistory.length;
        const stats: DigitStats[] = [];

        for (let digit = 0; digit <= 9; digit++) {
            const count = this.digitCounts.get(digit) || 0;
            const percentage = totalTicks > 0 ? (count / totalTicks) * 100 : 0;
            const lastSeen = this.findLastSeenIndex(digit);

            stats.push({
                digit,
                count,
                percentage,
                lastSeen,
            });
        }

        return stats;
    }

    /**
     * Find how many ticks ago a digit was last seen
     */
    private findLastSeenIndex(digit: number): number {
        const index = this.tickHistory.findIndex(tick => tick.lastDigit === digit);
        return index === -1 ? -1 : index;
    }

    /**
     * Get hot digits (most frequent)
     */
    getHotDigits(topN: number = 3): number[] {
        const stats = this.getDigitStats();
        return stats
            .sort((a, b) => b.count - a.count)
            .slice(0, topN)
            .map(s => s.digit);
    }

    /**
     * Get cold digits (least frequent)
     */
    getColdDigits(topN: number = 3): number[] {
        const stats = this.getDigitStats();
        return stats
            .filter(s => s.count > 0)
            .sort((a, b) => a.count - b.count)
            .slice(0, topN)
            .map(s => s.digit);
    }

    /**
     * Get digit patterns (sequences)
     */
    getDigitPatterns(length: number = 3): string[] {
        const patterns: string[] = [];
        for (let i = 0; i < this.tickHistory.length - length + 1; i++) {
            const pattern = this.tickHistory
                .slice(i, i + length)
                .map(t => t.lastDigit)
                .join('');
            patterns.push(pattern);
        }
        return patterns;
    }

    /**
     * Check if digit is "hot" (appeared recently)
     */
    isHotDigit(digit: number, withinLast: number = 10): boolean {
        const recentDigits = this.getLastDigits(withinLast);
        const count = recentDigits.filter(d => d === digit).length;
        return count >= 2; // Appeared at least twice in recent ticks
    }

    /**
     * Check if digit is "cold" (hasn't appeared recently)
     */
    isColdDigit(digit: number, withinLast: number = 20): boolean {
        const recentDigits = this.getLastDigits(withinLast);
        return !recentDigits.includes(digit);
    }

    /**
     * Reset all data
     */
    reset(): void {
        this.currentTick = null;
        this.tickHistory = [];
        this.digitCounts.clear();
    }

    /**
     * Get total tick count
     */
    getTotalTicks(): number {
        return this.tickHistory.length;
    }
}

export const tickPointerService = new TickPointerService();
