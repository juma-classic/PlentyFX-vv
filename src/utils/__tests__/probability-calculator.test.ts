/**
 * Property-Based Tests for Probability Calculator
 * Feature: zeus-analysis-enhancement
 */

import * as fc from 'fast-check';
import { calculateProbabilities, getMostLikely, getTopN, ProbabilityPrediction,TickData } from '../probability-calculator';

// Custom generator for TickData
const tickDataGenerator = (): fc.Arbitrary<TickData> => {
    return fc.record({
        epoch: fc.integer({ min: 1600000000, max: 1700000000 }),
        quote: fc.double({ min: 100, max: 1000, noNaN: true, noDefaultInfinity: true }),
        lastDigit: fc.integer({ min: 0, max: 9 }),
        source: fc.constantFrom('historical' as const, 'live' as const),
        localTime: fc.integer({ min: 1600000000000, max: 1700000000000 }).map(ms => new Date(ms).toISOString())
    });
};

describe('Probability Calculator - Property-Based Tests', () => {
    /**
     * Feature: zeus-analysis-enhancement, Property 1: Complete probability distribution
     * Validates: Requirements 1.1
     */
    test('Property 1: probability calculation returns all 10 digits', () => {
        fc.assert(
            fc.property(
                fc.array(tickDataGenerator(), { minLength: 10, maxLength: 100 }),
                (ticks) => {
                    const predictions = calculateProbabilities(ticks);
                    
                    // Should return exactly 10 predictions
                    expect(predictions).toHaveLength(10);
                    
                    // Should have predictions for all digits 0-9
                    const digits = predictions.map(p => p.digit).sort((a, b) => a - b);
                    expect(digits).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
                    
                    // Each prediction should have required fields
                    predictions.forEach(p => {
                        expect(p).toHaveProperty('digit');
                        expect(p).toHaveProperty('probability');
                        expect(p).toHaveProperty('confidence');
                        expect(p).toHaveProperty('reasoning');
                        expect(p.digit).toBeGreaterThanOrEqual(0);
                        expect(p.digit).toBeLessThanOrEqual(9);
                        expect(['low', 'medium', 'high']).toContain(p.confidence);
                    });
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: zeus-analysis-enhancement, Property 2: Last 20 ticks analysis window
     * Validates: Requirements 1.2
     */
    test('Property 2: probability calculator only considers last 20 ticks', () => {
        fc.assert(
            fc.property(
                fc.array(tickDataGenerator(), { minLength: 30, maxLength: 100 }),
                (allTicks) => {
                    // Calculate probabilities with all ticks
                    const predictions = calculateProbabilities(allTicks);
                    
                    // Calculate probabilities with only last 20 ticks
                    const last20Ticks = allTicks.slice(-20);
                    const predictionsLast20 = calculateProbabilities(last20Ticks);
                    
                    // Results should be identical since only last 20 are analyzed
                    expect(predictions.length).toBe(predictionsLast20.length);
                    
                    // Compare probabilities for each digit
                    for (let i = 0; i < 10; i++) {
                        const pred1 = predictions.find(p => p.digit === i);
                        const pred2 = predictionsLast20.find(p => p.digit === i);
                        
                        expect(pred1).toBeDefined();
                        expect(pred2).toBeDefined();
                        
                        // Probabilities should be very close (allowing for floating point precision)
                        expect(Math.abs(pred1!.probability - pred2!.probability)).toBeLessThan(0.0001);
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional unit tests for edge cases
    describe('Edge Cases', () => {
        test('should handle insufficient data (< 10 ticks)', () => {
            const ticks: TickData[] = Array.from({ length: 5 }, (_, i) => ({
                epoch: 1600000000 + i,
                quote: 100 + i,
                lastDigit: i % 10,
                source: 'historical' as const,
                localTime: new Date().toISOString()
            }));

            const predictions = calculateProbabilities(ticks);
            
            expect(predictions).toHaveLength(10);
            predictions.forEach(p => {
                expect(p.confidence).toBe('low');
                expect(p.reasoning).toContain('Insufficient data');
            });
        });

        test('should normalize probabilities to sum to 1.0', () => {
            const ticks: TickData[] = Array.from({ length: 20 }, (_, i) => ({
                epoch: 1600000000 + i,
                quote: 100 + i,
                lastDigit: i % 10,
                source: 'historical' as const,
                localTime: new Date().toISOString()
            }));

            const predictions = calculateProbabilities(ticks);
            const totalProbability = predictions.reduce((sum, p) => sum + p.probability, 0);
            
            // Should sum to 1.0 (allowing for floating point precision)
            expect(Math.abs(totalProbability - 1.0)).toBeLessThan(0.0001);
        });

        test('getMostLikely should return highest probability prediction', () => {
            const ticks: TickData[] = Array.from({ length: 20 }, (_, i) => ({
                epoch: 1600000000 + i,
                quote: 100 + i,
                lastDigit: 5, // All same digit
                source: 'historical' as const,
                localTime: new Date().toISOString()
            }));

            const mostLikely = getMostLikely(ticks);
            const allPredictions = calculateProbabilities(ticks);
            const maxProbability = Math.max(...allPredictions.map(p => p.probability));
            
            expect(mostLikely.probability).toBe(maxProbability);
        });

        test('getTopN should return N predictions sorted by probability', () => {
            const ticks: TickData[] = Array.from({ length: 20 }, (_, i) => ({
                epoch: 1600000000 + i,
                quote: 100 + i,
                lastDigit: i % 10,
                source: 'historical' as const,
                localTime: new Date().toISOString()
            }));

            const top5 = getTopN(ticks, 5);
            
            expect(top5).toHaveLength(5);
            
            // Should be sorted in descending order
            for (let i = 0; i < top5.length - 1; i++) {
                expect(top5[i].probability).toBeGreaterThanOrEqual(top5[i + 1].probability);
            }
        });
    });
});
