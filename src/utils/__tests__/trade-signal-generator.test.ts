/**
 * Property-Based Tests for Trade Signal Generator
 * Feature: zeus-analysis-enhancement
 */

import * as fc from 'fast-check';
import { ProbabilityPrediction } from '../probability-calculator';
import {
    createAndDispatchTradeSignal,
    createTradeSignal,
    dispatchTradeSignal,
    getTradeType,
    TradeSignal} from '../trade-signal-generator';

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

describe('Trade Signal Generator - Property-Based Tests', () => {
    /**
     * Feature: zeus-analysis-enhancement, Property 11: Digit to trade type mapping
     * Validates: Requirements 3.2
     */
    test('Property 11: digits 0-4 map to DIGITUNDER, 5-9 map to DIGITOVER', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 9 }),
                (digit) => {
                    const tradeType = getTradeType(digit);
                    
                    if (digit <= 4) {
                        expect(tradeType).toBe('DIGITUNDER');
                    } else {
                        expect(tradeType).toBe('DIGITOVER');
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: zeus-analysis-enhancement, Property 12: Trade signal completeness
     * Validates: Requirements 3.3
     */
    test('Property 12: trade signal includes all required fields', () => {
        fc.assert(
            fc.property(
                predictionGenerator(),
                marketGenerator(),
                (prediction, market) => {
                    const signal = createTradeSignal(prediction, market);
                    
                    // Verify all required fields are present
                    expect(signal).toHaveProperty('type');
                    expect(signal).toHaveProperty('market');
                    expect(signal).toHaveProperty('prediction');
                    expect(signal).toHaveProperty('confidence');
                    expect(signal).toHaveProperty('reasoning');
                    expect(signal).toHaveProperty('timestamp');
                    
                    // Verify field values
                    expect(['DIGITOVER', 'DIGITUNDER']).toContain(signal.type);
                    expect(signal.market).toBe(market);
                    expect(signal.prediction).toBe(prediction.digit);
                    expect(signal.confidence).toBe(prediction.confidence);
                    expect(signal.reasoning).toBe(prediction.reasoning);
                    expect(typeof signal.timestamp).toBe('number');
                    expect(signal.timestamp).toBeGreaterThan(0);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: zeus-analysis-enhancement, Property 13: Trade signal event dispatch
     * Validates: Requirements 3.4
     */
    test('Property 13: trade signal dispatches custom event with name zeus.trade.signal', () => {
        fc.assert(
            fc.property(
                predictionGenerator(),
                marketGenerator(),
                (prediction, market) => {
                    const signal = createTradeSignal(prediction, market);
                    
                    // Set up event listener to capture the dispatched event
                    let capturedEvent: CustomEvent | null = null;
                    const eventListener = (event: Event) => {
                        capturedEvent = event as CustomEvent;
                    };
                    
                    window.addEventListener('zeus.trade.signal', eventListener);
                    
                    // Dispatch the signal
                    const success = dispatchTradeSignal(signal);
                    
                    // Clean up
                    window.removeEventListener('zeus.trade.signal', eventListener);
                    
                    // Verify dispatch was successful
                    expect(success).toBe(true);
                    
                    // Verify event was dispatched
                    expect(capturedEvent).not.toBeNull();
                    expect(capturedEvent?.type).toBe('zeus.trade.signal');
                    
                    // Verify event detail contains the signal
                    expect(capturedEvent?.detail).toEqual(signal);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional unit tests for edge cases and integration
    describe('Edge Cases and Integration', () => {
        test('should create signal with correct trade type for digit 0', () => {
            const prediction: ProbabilityPrediction = {
                digit: 0,
                probability: 0.15,
                confidence: 'high',
                reasoning: 'Test'
            };
            
            const signal = createTradeSignal(prediction, 'R_50');
            expect(signal.type).toBe('DIGITUNDER');
        });

        test('should create signal with correct trade type for digit 4', () => {
            const prediction: ProbabilityPrediction = {
                digit: 4,
                probability: 0.15,
                confidence: 'high',
                reasoning: 'Test'
            };
            
            const signal = createTradeSignal(prediction, 'R_50');
            expect(signal.type).toBe('DIGITUNDER');
        });

        test('should create signal with correct trade type for digit 5', () => {
            const prediction: ProbabilityPrediction = {
                digit: 5,
                probability: 0.15,
                confidence: 'high',
                reasoning: 'Test'
            };
            
            const signal = createTradeSignal(prediction, 'R_50');
            expect(signal.type).toBe('DIGITOVER');
        });

        test('should create signal with correct trade type for digit 9', () => {
            const prediction: ProbabilityPrediction = {
                digit: 9,
                probability: 0.15,
                confidence: 'high',
                reasoning: 'Test'
            };
            
            const signal = createTradeSignal(prediction, 'R_50');
            expect(signal.type).toBe('DIGITOVER');
        });

        test('should include timestamp in signal', () => {
            const prediction: ProbabilityPrediction = {
                digit: 5,
                probability: 0.15,
                confidence: 'high',
                reasoning: 'Test'
            };
            
            const beforeTimestamp = Date.now();
            const signal = createTradeSignal(prediction, 'R_50');
            const afterTimestamp = Date.now();
            
            expect(signal.timestamp).toBeGreaterThanOrEqual(beforeTimestamp);
            expect(signal.timestamp).toBeLessThanOrEqual(afterTimestamp);
        });

        test('createAndDispatchTradeSignal should create and dispatch signal', () => {
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
            
            window.addEventListener('zeus.trade.signal', eventListener);
            
            const result = createAndDispatchTradeSignal(prediction, 'R_100');
            
            window.removeEventListener('zeus.trade.signal', eventListener);
            
            expect(result).not.toBeNull();
            expect(result?.prediction).toBe(7);
            expect(result?.market).toBe('R_100');
            expect(capturedEvent).not.toBeNull();
            expect(capturedEvent?.detail).toEqual(result);
        });

        test('should handle multiple signals dispatched in sequence', () => {
            const predictions: ProbabilityPrediction[] = [
                { digit: 0, probability: 0.15, confidence: 'high', reasoning: 'Test 1' },
                { digit: 5, probability: 0.14, confidence: 'medium', reasoning: 'Test 2' },
                { digit: 9, probability: 0.13, confidence: 'low', reasoning: 'Test 3' }
            ];
            
            const capturedEvents: CustomEvent[] = [];
            const eventListener = (event: Event) => {
                capturedEvents.push(event as CustomEvent);
            };
            
            window.addEventListener('zeus.trade.signal', eventListener);
            
            predictions.forEach(pred => {
                const signal = createTradeSignal(pred, 'R_50');
                dispatchTradeSignal(signal);
            });
            
            window.removeEventListener('zeus.trade.signal', eventListener);
            
            expect(capturedEvents).toHaveLength(3);
            expect(capturedEvents[0].detail.prediction).toBe(0);
            expect(capturedEvents[1].detail.prediction).toBe(5);
            expect(capturedEvents[2].detail.prediction).toBe(9);
        });
    });
});
