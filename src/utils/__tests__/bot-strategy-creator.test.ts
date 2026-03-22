/**
 * Property-Based Tests for Bot Strategy Creator
 * Feature: zeus-analysis-enhancement
 */

import * as fc from 'fast-check';
import {
    BotStrategyConfig,
    createAndDispatchBotStrategy,
    createBotStrategyConfig,
    dispatchBotStrategyEvent} from '../bot-strategy-creator';
import { ProbabilityPrediction } from '../probability-calculator';

// Custom generator for ProbabilityPrediction
const predictionGenerator = (): fc.Arbitrary<ProbabilityPrediction> => {
    return fc.record({
        digit: fc.integer({ min: 0, max: 9 }),
        probability: fc.double({ min: 0.01, max: 0.99, noNaN: true, noDefaultInfinity: true }),
        confidence: fc.constantFrom('low' as const, 'medium' as const, 'high' as const),
        reasoning: fc.string({ minLength: 1, maxLength: 100 })
    });
};

// Custom generator for market symbols
const marketGenerator = (): fc.Arbitrary<string> => {
    return fc.constantFrom('R_10', 'R_25', 'R_50', 'R_75', 'R_100', '1HZ10V', '1HZ25V', '1HZ50V');
};

// Custom generator for stake amounts
const stakeGenerator = (): fc.Arbitrary<number> => {
    return fc.double({ min: 0.35, max: 1000, noNaN: true, noDefaultInfinity: true });
};

// Custom generator for duration
const durationGenerator = (): fc.Arbitrary<number> => {
    return fc.integer({ min: 1, max: 10 });
};

describe('Bot Strategy Creator - Property-Based Tests', () => {
    /**
     * Feature: zeus-analysis-enhancement, Property 21: Bot strategy configuration completeness
     * Validates: Requirements 6.2
     */
    test('Property 21: bot strategy includes all required parameters', () => {
        fc.assert(
            fc.property(
                predictionGenerator(),
                marketGenerator(),
                stakeGenerator(),
                durationGenerator(),
                (prediction, market, stake, duration) => {
                    const config = createBotStrategyConfig(prediction, market, stake, duration);
                    
                    // Verify all required fields are present
                    expect(config).toHaveProperty('tradeType');
                    expect(config).toHaveProperty('market');
                    expect(config).toHaveProperty('prediction');
                    expect(config).toHaveProperty('stake');
                    expect(config).toHaveProperty('duration');
                    
                    // Verify field values
                    expect(['DIGITOVER', 'DIGITUNDER']).toContain(config.tradeType);
                    expect(config.market).toBe(market);
                    expect(config.prediction).toBe(prediction.digit);
                    expect(config.stake).toBe(stake);
                    expect(config.duration).toBe(duration);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: zeus-analysis-enhancement, Property 22: Bot strategy martingale settings
     * Validates: Requirements 6.3
     */
    test('Property 22: bot strategy includes martingale, stopLoss, and takeProfit', () => {
        fc.assert(
            fc.property(
                predictionGenerator(),
                marketGenerator(),
                stakeGenerator(),
                durationGenerator(),
                (prediction, market, stake, duration) => {
                    const config = createBotStrategyConfig(prediction, market, stake, duration);
                    
                    // Verify martingale settings are present
                    expect(config).toHaveProperty('martingale');
                    expect(config).toHaveProperty('stopLoss');
                    expect(config).toHaveProperty('takeProfit');
                    
                    // Verify field types
                    expect(typeof config.martingale).toBe('boolean');
                    expect(typeof config.stopLoss).toBe('number');
                    expect(typeof config.takeProfit).toBe('number');
                    
                    // Verify stopLoss and takeProfit are positive
                    expect(config.stopLoss).toBeGreaterThan(0);
                    expect(config.takeProfit).toBeGreaterThan(0);
                    
                    // Verify takeProfit is greater than stopLoss
                    expect(config.takeProfit).toBeGreaterThan(config.stopLoss);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: zeus-analysis-enhancement, Property 23: Bot strategy event dispatch
     * Validates: Requirements 6.4
     */
    test('Property 23: bot strategy dispatches custom event with name create.bot.strategy', () => {
        fc.assert(
            fc.property(
                predictionGenerator(),
                marketGenerator(),
                stakeGenerator(),
                durationGenerator(),
                (prediction, market, stake, duration) => {
                    const config = createBotStrategyConfig(prediction, market, stake, duration);
                    
                    // Set up event listener to capture the dispatched event
                    let capturedEvent: CustomEvent | null = null;
                    const eventListener = (event: Event) => {
                        capturedEvent = event as CustomEvent;
                    };
                    
                    window.addEventListener('create.bot.strategy', eventListener);
                    
                    // Dispatch the bot strategy
                    const success = dispatchBotStrategyEvent(config);
                    
                    // Clean up
                    window.removeEventListener('create.bot.strategy', eventListener);
                    
                    // Verify dispatch was successful
                    expect(success).toBe(true);
                    
                    // Verify event was dispatched
                    expect(capturedEvent).not.toBeNull();
                    expect(capturedEvent?.type).toBe('create.bot.strategy');
                    
                    // Verify event detail contains the config
                    expect(capturedEvent?.detail).toEqual(config);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional unit tests for edge cases and integration
    describe('Edge Cases and Integration', () => {
        test('should create config with DIGITUNDER for digit 0', () => {
            const prediction: ProbabilityPrediction = {
                digit: 0,
                probability: 0.15,
                confidence: 'high',
                reasoning: 'Test'
            };
            
            const config = createBotStrategyConfig(prediction, 'R_50', 1, 1);
            expect(config.tradeType).toBe('DIGITUNDER');
        });

        test('should create config with DIGITUNDER for digit 4', () => {
            const prediction: ProbabilityPrediction = {
                digit: 4,
                probability: 0.15,
                confidence: 'high',
                reasoning: 'Test'
            };
            
            const config = createBotStrategyConfig(prediction, 'R_50', 1, 1);
            expect(config.tradeType).toBe('DIGITUNDER');
        });

        test('should create config with DIGITOVER for digit 5', () => {
            const prediction: ProbabilityPrediction = {
                digit: 5,
                probability: 0.15,
                confidence: 'high',
                reasoning: 'Test'
            };
            
            const config = createBotStrategyConfig(prediction, 'R_50', 1, 1);
            expect(config.tradeType).toBe('DIGITOVER');
        });

        test('should create config with DIGITOVER for digit 9', () => {
            const prediction: ProbabilityPrediction = {
                digit: 9,
                probability: 0.15,
                confidence: 'high',
                reasoning: 'Test'
            };
            
            const config = createBotStrategyConfig(prediction, 'R_50', 1, 1);
            expect(config.tradeType).toBe('DIGITOVER');
        });

        test('should enable martingale for high confidence predictions', () => {
            const prediction: ProbabilityPrediction = {
                digit: 7,
                probability: 0.20,
                confidence: 'high',
                reasoning: 'Strong pattern'
            };
            
            const config = createBotStrategyConfig(prediction, 'R_50', 1, 1);
            expect(config.martingale).toBe(true);
        });

        test('should disable martingale for medium confidence predictions', () => {
            const prediction: ProbabilityPrediction = {
                digit: 7,
                probability: 0.15,
                confidence: 'medium',
                reasoning: 'Moderate pattern'
            };
            
            const config = createBotStrategyConfig(prediction, 'R_50', 1, 1);
            expect(config.martingale).toBe(false);
        });

        test('should disable martingale for low confidence predictions', () => {
            const prediction: ProbabilityPrediction = {
                digit: 7,
                probability: 0.12,
                confidence: 'low',
                reasoning: 'Weak pattern'
            };
            
            const config = createBotStrategyConfig(prediction, 'R_50', 1, 1);
            expect(config.martingale).toBe(false);
        });

        test('should set stopLoss to 10x stake', () => {
            const prediction: ProbabilityPrediction = {
                digit: 5,
                probability: 0.15,
                confidence: 'high',
                reasoning: 'Test'
            };
            
            const stake = 2.5;
            const config = createBotStrategyConfig(prediction, 'R_50', stake, 1);
            expect(config.stopLoss).toBe(stake * 10);
        });

        test('should set takeProfit to 20x stake', () => {
            const prediction: ProbabilityPrediction = {
                digit: 5,
                probability: 0.15,
                confidence: 'high',
                reasoning: 'Test'
            };
            
            const stake = 2.5;
            const config = createBotStrategyConfig(prediction, 'R_50', stake, 1);
            expect(config.takeProfit).toBe(stake * 20);
        });

        test('should use default stake and duration when not provided', () => {
            const prediction: ProbabilityPrediction = {
                digit: 5,
                probability: 0.15,
                confidence: 'high',
                reasoning: 'Test'
            };
            
            const config = createBotStrategyConfig(prediction, 'R_50');
            expect(config.stake).toBe(1);
            expect(config.duration).toBe(1);
        });

        test('createAndDispatchBotStrategy should create and dispatch config', () => {
            const prediction: ProbabilityPrediction = {
                digit: 7,
                probability: 0.18,
                confidence: 'medium',
                reasoning: 'Test reasoning'
            };
            
            let capturedEvent: CustomEvent | null = null;
            const eventListener = (event: Event) => {
                capturedEvent = event as CustomEvent;
            };
            
            window.addEventListener('create.bot.strategy', eventListener);
            
            const result = createAndDispatchBotStrategy(prediction, 'R_100', 2, 3);
            
            window.removeEventListener('create.bot.strategy', eventListener);
            
            expect(result).not.toBeNull();
            expect(result?.prediction).toBe(7);
            expect(result?.market).toBe('R_100');
            expect(result?.stake).toBe(2);
            expect(result?.duration).toBe(3);
            expect(capturedEvent).not.toBeNull();
            expect(capturedEvent?.detail).toEqual(result);
        });

        test('should handle multiple bot strategies dispatched in sequence', () => {
            const predictions: ProbabilityPrediction[] = [
                { digit: 0, probability: 0.15, confidence: 'high', reasoning: 'Test 1' },
                { digit: 5, probability: 0.14, confidence: 'medium', reasoning: 'Test 2' },
                { digit: 9, probability: 0.13, confidence: 'low', reasoning: 'Test 3' }
            ];
            
            const capturedEvents: CustomEvent[] = [];
            const eventListener = (event: Event) => {
                capturedEvents.push(event as CustomEvent);
            };
            
            window.addEventListener('create.bot.strategy', eventListener);
            
            predictions.forEach(pred => {
                const config = createBotStrategyConfig(pred, 'R_50', 1, 1);
                dispatchBotStrategyEvent(config);
            });
            
            window.removeEventListener('create.bot.strategy', eventListener);
            
            expect(capturedEvents).toHaveLength(3);
            expect(capturedEvents[0].detail.prediction).toBe(0);
            expect(capturedEvents[1].detail.prediction).toBe(5);
            expect(capturedEvents[2].detail.prediction).toBe(9);
        });
    });
});
