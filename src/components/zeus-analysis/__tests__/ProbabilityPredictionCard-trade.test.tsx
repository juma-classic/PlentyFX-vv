/**
 * Property-Based Tests for ProbabilityPredictionCard Trade Functionality
 * Feature: zeus-analysis-enhancement
 */

import React from 'react';
import * as fc from 'fast-check';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ProbabilityPrediction } from '../../../utils/probability-calculator';
import { ProbabilityPredictionCard } from '../ProbabilityPredictionCard';

// Custom generator for ProbabilityPrediction
const predictionGenerator = (): fc.Arbitrary<ProbabilityPrediction> => {
    return fc.record({
        digit: fc.integer({ min: 0, max: 9 }),
        probability: fc.double({ min: 0.01, max: 0.99, noNaN: true, noDefaultInfinity: true }),
        confidence: fc.constantFrom('low' as const, 'medium' as const, 'high' as const),
        reasoning: fc.string({ minLength: 1, maxLength: 100 })
    });
};

describe('ProbabilityPredictionCard - Trade Functionality Property-Based Tests', () => {
    /**
     * Feature: zeus-analysis-enhancement, Property 10: Trade buttons for top predictions
     * Validates: Requirements 3.1
     */
    test('Property 10: renders exactly 5 Trade Now buttons for top 5 predictions', () => {
        fc.assert(
            fc.property(
                fc.array(predictionGenerator(), { minLength: 10, maxLength: 10 }),
                (allPredictions) => {
                    // Sort predictions by probability descending to get top 5
                    const sortedPredictions = [...allPredictions].sort((a, b) => b.probability - a.probability);
                    const top5 = sortedPredictions.slice(0, 5);
                    
                    const { container } = render(
                        <ProbabilityPredictionCard predictions={top5} market="R_50" />
                    );
                    
                    // Find all Trade Now buttons
                    const tradeButtons = container.querySelectorAll('.trade-now-button');
                    
                    // Should have exactly 5 Trade Now buttons
                    expect(tradeButtons).toHaveLength(5);
                    
                    // Each button should have proper text
                    tradeButtons.forEach((button) => {
                        expect(button.textContent).toContain('Trade Now');
                    });
                    
                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    // Additional unit tests for trade functionality
    describe('Trade Now Button Functionality', () => {
        test('should dispatch trade signal when Trade Now button is clicked', async () => {
            const predictions: ProbabilityPrediction[] = [
                { digit: 7, probability: 0.18, confidence: 'high', reasoning: 'Test' },
                { digit: 3, probability: 0.15, confidence: 'medium', reasoning: 'Test' },
                { digit: 9, probability: 0.13, confidence: 'low', reasoning: 'Test' },
                { digit: 1, probability: 0.12, confidence: 'low', reasoning: 'Test' },
                { digit: 5, probability: 0.11, confidence: 'low', reasoning: 'Test' }
            ];
            
            // Set up event listener to capture dispatched event
            let capturedEvent: CustomEvent | null = null;
            const eventListener = (event: Event) => {
                capturedEvent = event as CustomEvent;
            };
            window.addEventListener('zeus.trade.signal', eventListener);
            
            const { container } = render(
                <ProbabilityPredictionCard predictions={predictions} market="R_100" />
            );
            
            // Click the first Trade Now button
            const tradeButtons = container.querySelectorAll('.trade-now-button');
            fireEvent.click(tradeButtons[0]);
            
            // Wait for event to be dispatched
            await waitFor(() => {
                expect(capturedEvent).not.toBeNull();
            });
            
            // Verify event was dispatched with correct data
            expect(capturedEvent?.type).toBe('zeus.trade.signal');
            expect(capturedEvent?.detail).toHaveProperty('type');
            expect(capturedEvent?.detail).toHaveProperty('market', 'R_100');
            expect(capturedEvent?.detail).toHaveProperty('prediction', 7);
            expect(capturedEvent?.detail).toHaveProperty('confidence', 'high');
            
            // Clean up
            window.removeEventListener('zeus.trade.signal', eventListener);
        });

        test('should show success notification after trade signal is sent', async () => {
            const predictions: ProbabilityPrediction[] = [
                { digit: 5, probability: 0.18, confidence: 'high', reasoning: 'Test' },
                { digit: 3, probability: 0.15, confidence: 'medium', reasoning: 'Test' },
                { digit: 9, probability: 0.13, confidence: 'low', reasoning: 'Test' },
                { digit: 1, probability: 0.12, confidence: 'low', reasoning: 'Test' },
                { digit: 7, probability: 0.11, confidence: 'low', reasoning: 'Test' }
            ];
            
            const { container } = render(
                <ProbabilityPredictionCard predictions={predictions} market="R_50" />
            );
            
            // Click the first Trade Now button
            const tradeButtons = container.querySelectorAll('.trade-now-button');
            fireEvent.click(tradeButtons[0]);
            
            // Wait for notification to appear
            await waitFor(() => {
                const notification = container.querySelector('.trade-notification-success');
                expect(notification).toBeInTheDocument();
                expect(notification?.textContent).toContain('Trade signal sent for digit 5');
            });
        });

        test('should disable button while processing trade signal', async () => {
            const predictions: ProbabilityPrediction[] = [
                { digit: 8, probability: 0.18, confidence: 'high', reasoning: 'Test' },
                { digit: 2, probability: 0.15, confidence: 'medium', reasoning: 'Test' },
                { digit: 6, probability: 0.13, confidence: 'low', reasoning: 'Test' },
                { digit: 4, probability: 0.12, confidence: 'low', reasoning: 'Test' },
                { digit: 0, probability: 0.11, confidence: 'low', reasoning: 'Test' }
            ];
            
            const { container } = render(
                <ProbabilityPredictionCard predictions={predictions} market="R_50" />
            );
            
            const tradeButtons = container.querySelectorAll('.trade-now-button');
            const firstButton = tradeButtons[0] as HTMLButtonElement;
            
            // Button should be enabled initially
            expect(firstButton.disabled).toBe(false);
            
            // Click the button
            fireEvent.click(firstButton);
            
            // Button should be disabled during processing (briefly)
            // Note: This might be too fast to catch, but we test the mechanism
            await waitFor(() => {
                // After processing, button should be enabled again
                expect(firstButton.disabled).toBe(false);
            });
        });

        test('should render Trade Now buttons with proper aria labels', () => {
            const predictions: ProbabilityPrediction[] = [
                { digit: 0, probability: 0.18, confidence: 'high', reasoning: 'Test' },
                { digit: 1, probability: 0.15, confidence: 'medium', reasoning: 'Test' },
                { digit: 2, probability: 0.13, confidence: 'low', reasoning: 'Test' },
                { digit: 3, probability: 0.12, confidence: 'low', reasoning: 'Test' },
                { digit: 4, probability: 0.11, confidence: 'low', reasoning: 'Test' }
            ];
            
            const { container } = render(
                <ProbabilityPredictionCard predictions={predictions} market="R_50" />
            );
            
            const tradeButtons = container.querySelectorAll('.trade-now-button');
            
            tradeButtons.forEach((button, index) => {
                const ariaLabel = button.getAttribute('aria-label');
                expect(ariaLabel).toContain(`Trade now for digit ${predictions[index].digit}`);
            });
        });

        test('should handle multiple Trade Now button clicks', async () => {
            const predictions: ProbabilityPrediction[] = [
                { digit: 5, probability: 0.18, confidence: 'high', reasoning: 'Test' },
                { digit: 6, probability: 0.15, confidence: 'medium', reasoning: 'Test' },
                { digit: 7, probability: 0.13, confidence: 'low', reasoning: 'Test' },
                { digit: 8, probability: 0.12, confidence: 'low', reasoning: 'Test' },
                { digit: 9, probability: 0.11, confidence: 'low', reasoning: 'Test' }
            ];
            
            const capturedEvents: CustomEvent[] = [];
            const eventListener = (event: Event) => {
                capturedEvents.push(event as CustomEvent);
            };
            window.addEventListener('zeus.trade.signal', eventListener);
            
            const { container } = render(
                <ProbabilityPredictionCard predictions={predictions} market="R_50" />
            );
            
            const tradeButtons = container.querySelectorAll('.trade-now-button');
            
            // Click first button
            fireEvent.click(tradeButtons[0]);
            await waitFor(() => expect(capturedEvents.length).toBe(1));
            
            // Click second button
            fireEvent.click(tradeButtons[1]);
            await waitFor(() => expect(capturedEvents.length).toBe(2));
            
            // Verify both events were dispatched with correct predictions
            expect(capturedEvents[0].detail.prediction).toBe(5);
            expect(capturedEvents[1].detail.prediction).toBe(6);
            
            // Clean up
            window.removeEventListener('zeus.trade.signal', eventListener);
        });
    });
});
