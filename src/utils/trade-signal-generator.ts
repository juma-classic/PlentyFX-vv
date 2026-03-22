/**
 * Trade Signal Generator Module
 * Creates and dispatches trade signals based on probability predictions
 */

import { ProbabilityPrediction } from './probability-calculator';

export interface TradeSignal {
    type: 'DIGITOVER' | 'DIGITUNDER' | 'DIGITMATCH' | 'DIGITDIFF';
    market: string;
    prediction: number;
    confidence: 'low' | 'medium' | 'high';
    reasoning: string;
    timestamp: number;
}

/**
 * Map digit to appropriate trade type
 * Digits 0-4 map to DIGITUNDER
 * Digits 5-9 map to DIGITOVER
 * 
 * @param digit - The predicted digit (0-9)
 * @returns Trade type for the digit
 */
export function getTradeType(digit: number): 'DIGITOVER' | 'DIGITUNDER' {
    if (digit <= 4) {
        return 'DIGITUNDER';
    } else {
        return 'DIGITOVER';
    }
}

/**
 * Create a trade signal from a probability prediction
 * 
 * @param prediction - Probability prediction for a digit
 * @param market - Market symbol (e.g., 'R_50', 'R_100')
 * @returns Complete trade signal object
 */
export function createTradeSignal(
    prediction: ProbabilityPrediction,
    market: string
): TradeSignal {
    const tradeType = getTradeType(prediction.digit);
    
    return {
        type: tradeType,
        market,
        prediction: prediction.digit,
        confidence: prediction.confidence,
        reasoning: prediction.reasoning,
        timestamp: Date.now()
    };
}

/**
 * Dispatch trade signal via custom event
 * Dispatches a 'zeus.trade.signal' event to the window object
 * 
 * @param signal - Trade signal to dispatch
 * @returns True if dispatch was successful, false otherwise
 */
export function dispatchTradeSignal(signal: TradeSignal): boolean {
    try {
        const event = new CustomEvent('zeus.trade.signal', {
            detail: signal,
            bubbles: true,
            cancelable: true
        });
        
        window.dispatchEvent(event);
        return true;
    } catch (error) {
        console.error('Failed to dispatch trade signal:', error);
        return false;
    }
}

/**
 * Create and dispatch a trade signal in one operation
 * 
 * @param prediction - Probability prediction for a digit
 * @param market - Market symbol
 * @returns The created trade signal if successful, null otherwise
 */
export function createAndDispatchTradeSignal(
    prediction: ProbabilityPrediction,
    market: string
): TradeSignal | null {
    try {
        const signal = createTradeSignal(prediction, market);
        const success = dispatchTradeSignal(signal);
        
        if (success) {
            return signal;
        }
        return null;
    } catch (error) {
        console.error('Failed to create and dispatch trade signal:', error);
        return null;
    }
}
