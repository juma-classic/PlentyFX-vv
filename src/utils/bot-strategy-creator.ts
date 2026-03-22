/**
 * Bot Strategy Creator Module
 * Creates bot strategy configurations from probability predictions
 */

import { ProbabilityPrediction } from './probability-calculator';

export interface BotStrategyConfig {
    tradeType: 'DIGITOVER' | 'DIGITUNDER' | 'DIGITMATCH' | 'DIGITDIFF';
    market: string;
    prediction: number;
    stake: number;
    duration: number;
    martingale: boolean;
    stopLoss: number;
    takeProfit: number;
}

/**
 * Create bot strategy configuration from probability prediction
 * 
 * @param prediction - Probability prediction for a digit
 * @param market - Market symbol (e.g., 'R_50', 'R_100')
 * @param stake - Initial stake amount (default: 1)
 * @param duration - Trade duration in ticks (default: 1)
 * @returns Complete bot strategy configuration
 */
export function createBotStrategyConfig(
    prediction: ProbabilityPrediction,
    market: string,
    stake: number = 1,
    duration: number = 1
): BotStrategyConfig {
    // Map digit to trade type (0-4 = DIGITUNDER, 5-9 = DIGITOVER)
    const tradeType = prediction.digit <= 4 ? 'DIGITUNDER' : 'DIGITOVER';
    
    // Set martingale settings based on confidence level
    const martingale = prediction.confidence === 'high';
    const stopLoss = stake * 10; // Stop after losing 10x initial stake
    const takeProfit = stake * 20; // Take profit after winning 20x initial stake
    
    return {
        tradeType,
        market,
        prediction: prediction.digit,
        stake,
        duration,
        martingale,
        stopLoss,
        takeProfit
    };
}

/**
 * Dispatch bot strategy creation event
 * Dispatches a 'create.bot.strategy' event to the window object
 * 
 * @param config - Bot strategy configuration to dispatch
 * @returns True if dispatch was successful, false otherwise
 */
export function dispatchBotStrategyEvent(config: BotStrategyConfig): boolean {
    try {
        const event = new CustomEvent('create.bot.strategy', {
            detail: config,
            bubbles: true,
            cancelable: true
        });
        
        window.dispatchEvent(event);
        return true;
    } catch (error) {
        console.error('Failed to dispatch bot strategy event:', error);
        return false;
    }
}

/**
 * Create and dispatch a bot strategy in one operation
 * 
 * @param prediction - Probability prediction for a digit
 * @param market - Market symbol
 * @param stake - Initial stake amount (default: 1)
 * @param duration - Trade duration in ticks (default: 1)
 * @returns The created bot strategy config if successful, null otherwise
 */
export function createAndDispatchBotStrategy(
    prediction: ProbabilityPrediction,
    market: string,
    stake: number = 1,
    duration: number = 1
): BotStrategyConfig | null {
    try {
        const config = createBotStrategyConfig(prediction, market, stake, duration);
        const success = dispatchBotStrategyEvent(config);
        
        if (success) {
            return config;
        }
        return null;
    } catch (error) {
        console.error('Failed to create and dispatch bot strategy:', error);
        return null;
    }
}
