/**
 * Tick State Manager
 * Maintains tick state and emits events only on digit changes
 * Prevents duplicate processing and ensures clean state transitions
 */

import type { TickData } from '../services/tick-driven/derivSocket';

export interface TickState {
    previousDigit: number | null;
    currentDigit: number;
    tickCount: number;
    lastPrice: number;
    lastTimestamp: number;
    digitChangeCount: number;
}

export interface DigitChangeEvent {
    previousDigit: number | null;
    currentDigit: number;
    price: number;
    timestamp: number;
    tickCount: number;
    digitChangeCount: number;
}

export class TickStateManager {
    private state: TickState = {
        previousDigit: null,
        currentDigit: 0,
        tickCount: 0,
        lastPrice: 0,
        lastTimestamp: 0,
        digitChangeCount: 0,
    };

    private listeners: ((event: DigitChangeEvent) => void)[] = [];

    /**
     * Process incoming tick data
     * Only emits events when digit actually changes
     */
    public processTick(tickData: TickData): boolean {
        const newDigit = tickData.lastDigit;
        const hasDigitChanged = this.state.currentDigit !== newDigit;

        // Update tick count regardless of digit change
        this.state.tickCount++;
        this.state.lastPrice = tickData.price;
        this.state.lastTimestamp = tickData.timestamp;

        // Only process if digit has changed
        if (hasDigitChanged) {
            console.log('🔄 Digit change detected:', {
                from: this.state.currentDigit,
                to: newDigit,
                price: tickData.price,
                tickCount: this.state.tickCount,
            });

            // Update state
            this.state.previousDigit = this.state.currentDigit;
            this.state.currentDigit = newDigit;
            this.state.digitChangeCount++;

            // Create event
            const changeEvent: DigitChangeEvent = {
                previousDigit: this.state.previousDigit,
                currentDigit: this.state.currentDigit,
                price: tickData.price,
                timestamp: tickData.timestamp,
                tickCount: this.state.tickCount,
                digitChangeCount: this.state.digitChangeCount,
            };

            // Emit to listeners
            this.emitDigitChange(changeEvent);

            return true; // Digit changed
        }

        // Log duplicate digit (for debugging)
        console.log('📊 Duplicate digit ignored:', {
            digit: newDigit,
            price: tickData.price,
            tickCount: this.state.tickCount,
        });

        return false; // No digit change
    }

    /**
     * Get current state
     */
    public getState(): Readonly<TickState> {
        return { ...this.state };
    }

    /**
     * Reset state (useful for testing or restarting)
     */
    public reset(): void {
        console.log('🔄 Resetting tick state');
        this.state = {
            previousDigit: null,
            currentDigit: 0,
            tickCount: 0,
            lastPrice: 0,
            lastTimestamp: 0,
            digitChangeCount: 0,
        };
    }

    /**
     * Add listener for digit change events
     */
    public onDigitChange(callback: (event: DigitChangeEvent) => void): void {
        this.listeners.push(callback);
    }

    /**
     * Remove listener
     */
    public removeListener(callback: (event: DigitChangeEvent) => void): void {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    /**
     * Emit digit change event to all listeners
     */
    private emitDigitChange(event: DigitChangeEvent): void {
        this.listeners.forEach(callback => {
            try {
                callback(event);
            } catch (error) {
                console.error('❌ Error in digit change listener:', error);
            }
        });
    }

    /**
     * Get statistics
     */
    public getStats(): {
        totalTicks: number;
        digitChanges: number;
        changeRate: number;
        currentDigit: number;
        previousDigit: number | null;
    } {
        return {
            totalTicks: this.state.tickCount,
            digitChanges: this.state.digitChangeCount,
            changeRate: this.state.tickCount > 0 ? (this.state.digitChangeCount / this.state.tickCount) * 100 : 0,
            currentDigit: this.state.currentDigit,
            previousDigit: this.state.previousDigit,
        };
    }
}
