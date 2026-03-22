/**
 * Property-Based Tests for Probability Prediction Card Component
 * Feature: zeus-analysis-enhancement
 */

import React from 'react';
import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import { ProbabilityPrediction } from '../../../utils/probability-calculator';
import { ProbabilityPredictionCard } from '../ProbabilityPredictionCard';
import '@testing-library/jest-dom';

// Custom generator for ProbabilityPrediction
const predictionGenerator = (): fc.Arbitrary<ProbabilityPrediction> => {
    return fc.record({
        digit: fc.integer({ min: 0, max: 9 }),
        probability: fc.double({ min: 0.01, max: 0.99, noNaN: true, noDefaultInfinity: true }),
        confidence: fc.constantFrom('low' as const, 'medium' as const, 'high' as const),
        reasoning: fc.string({ minLength: 10, maxLength: 100 })
    });
};

describe('ProbabilityPredictionCard - Property-Based Tests', () => {
    /**
     * Feature: zeus-analysis-enhancement, Property 3: Prediction display completeness
     * Validates: Requirements 1.3
     */
    test('Property 3: prediction display contains digit and probability percentage', () => {
        fc.assert(
            fc.property(
                fc.array(predictionGenerator(), { minLength: 1, maxLength: 10 }),
                (predictions) => {
                    const { container } = render(<ProbabilityPredictionCard predictions={predictions} />);
                    
                    // Get the most likely prediction (first one)
                    const mostLikely = predictions[0];
                    
                    // Check that the digit is displayed
                    const digitElements = container.querySelectorAll('.prediction-digit');
                    expect(digitElements.length).toBeGreaterThan(0);
                    
                    // Check that the most likely digit is displayed
                    const mostLikelyDigitText = mostLikely.digit.toString();
                    expect(container.textContent).toContain(mostLikelyDigitText);
                    
                    // Check that probability percentage is displayed
                    const probabilityPercentage = (mostLikely.probability * 100).toFixed(1) + '%';
                    expect(container.textContent).toContain(probabilityPercentage);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: zeus-analysis-enhancement, Property 4: Confidence level indication
     * Validates: Requirements 1.4
     */
    test('Property 4: prediction display includes exactly one confidence level', () => {
        fc.assert(
            fc.property(
                fc.array(predictionGenerator(), { minLength: 1, maxLength: 10 }),
                (predictions) => {
                    const { container } = render(<ProbabilityPredictionCard predictions={predictions} />);
                    
                    // Get the most likely prediction
                    const mostLikely = predictions[0];
                    
                    // Check that confidence level is displayed
                    const confidenceText = mostLikely.confidence.toUpperCase();
                    expect(container.textContent).toContain(confidenceText);
                    
                    // Check that the confidence indicator element exists
                    const confidenceIndicators = container.querySelectorAll('.confidence-indicator');
                    expect(confidenceIndicators.length).toBeGreaterThanOrEqual(1);
                    
                    // Verify it's one of the valid confidence levels
                    expect(['LOW', 'MEDIUM', 'HIGH']).toContain(confidenceText);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: zeus-analysis-enhancement, Property 5: Top predictions ordering
     * Validates: Requirements 1.5
     */
    test('Property 5: top 5 predictions are sorted in descending order by probability', () => {
        fc.assert(
            fc.property(
                fc.array(predictionGenerator(), { minLength: 5, maxLength: 10 }),
                (predictions) => {
                    // Sort predictions by probability descending
                    const sortedPredictions = [...predictions].sort((a, b) => b.probability - a.probability);
                    const top5 = sortedPredictions.slice(0, 5);
                    
                    const { container } = render(<ProbabilityPredictionCard predictions={top5} />);
                    
                    // Get all prediction items
                    const predictionItems = container.querySelectorAll('.prediction-item');
                    
                    // Should have exactly 5 items (or less if input was less than 5)
                    expect(predictionItems.length).toBe(Math.min(5, predictions.length));
                    
                    // Verify ordering by checking probabilities
                    const displayedProbabilities: number[] = [];
                    predictionItems.forEach(item => {
                        const percentageText = item.querySelector('.prediction-percentage')?.textContent || '';
                        const percentage = parseFloat(percentageText.replace('%', ''));
                        displayedProbabilities.push(percentage);
                    });
                    
                    // Check that probabilities are in descending order
                    for (let i = 0; i < displayedProbabilities.length - 1; i++) {
                        expect(displayedProbabilities[i]).toBeGreaterThanOrEqual(displayedProbabilities[i + 1]);
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: zeus-analysis-enhancement, Property 28: Confidence level color coding
     * Validates: Requirements 8.2
     */
    test('Property 28: confidence levels use correct color coding', () => {
        fc.assert(
            fc.property(
                fc.array(predictionGenerator(), { minLength: 1, maxLength: 10 }),
                (predictions) => {
                    const { container } = render(<ProbabilityPredictionCard predictions={predictions} />);
                    
                    // Get the most likely prediction
                    const mostLikely = predictions[0];
                    
                    // Check that the correct confidence class is applied
                    const mostLikelyCard = container.querySelector('.most-likely-card');
                    expect(mostLikelyCard).toBeTruthy();
                    
                    // Verify the confidence class matches the confidence level
                    if (mostLikely.confidence === 'high') {
                        expect(mostLikelyCard?.classList.contains('confidence-high')).toBe(true);
                    } else if (mostLikely.confidence === 'medium') {
                        expect(mostLikelyCard?.classList.contains('confidence-medium')).toBe(true);
                    } else if (mostLikely.confidence === 'low') {
                        expect(mostLikelyCard?.classList.contains('confidence-low')).toBe(true);
                    }
                    
                    // Check top 5 predictions for confidence badges
                    const top5 = predictions.slice(0, 5);
                    const confidenceBadges = container.querySelectorAll('.confidence-badge');
                    
                    confidenceBadges.forEach((badge, index) => {
                        if (index < top5.length) {
                            const prediction = top5[index];
                            const expectedClass = `confidence-${prediction.confidence}`;
                            expect(badge.classList.contains(expectedClass)).toBe(true);
                        }
                    });
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional unit tests for edge cases
    describe('Edge Cases', () => {
        test('should render nothing when predictions array is empty', () => {
            const { container } = render(<ProbabilityPredictionCard predictions={[]} />);
            expect(container.firstChild).toBeNull();
        });

        test('should display exactly 5 predictions when given more than 5', () => {
            const predictions: ProbabilityPrediction[] = Array.from({ length: 10 }, (_, i) => ({
                digit: i,
                probability: (10 - i) / 55, // Descending probabilities
                confidence: 'medium' as const,
                reasoning: `Test prediction ${i}`
            }));

            const { container } = render(<ProbabilityPredictionCard predictions={predictions} />);
            const predictionItems = container.querySelectorAll('.prediction-item');
            expect(predictionItems.length).toBe(5);
        });

        test('should display fewer than 5 predictions when given fewer than 5', () => {
            const predictions: ProbabilityPrediction[] = Array.from({ length: 3 }, (_, i) => ({
                digit: i,
                probability: (3 - i) / 6,
                confidence: 'low' as const,
                reasoning: `Test prediction ${i}`
            }));

            const { container } = render(<ProbabilityPredictionCard predictions={predictions} />);
            const predictionItems = container.querySelectorAll('.prediction-item');
            expect(predictionItems.length).toBe(3);
        });

        test('should format probability percentages to 1 decimal place', () => {
            const predictions: ProbabilityPrediction[] = [{
                digit: 5,
                probability: 0.12345,
                confidence: 'high' as const,
                reasoning: 'Test'
            }];

            const { container } = render(<ProbabilityPredictionCard predictions={predictions} />);
            expect(container.textContent).toContain('12.3%');
        });

        test('should display all confidence levels correctly', () => {
            const confidenceLevels: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
            
            confidenceLevels.forEach(confidence => {
                const predictions: ProbabilityPrediction[] = [{
                    digit: 7,
                    probability: 0.15,
                    confidence,
                    reasoning: 'Test'
                }];

                const { container } = render(<ProbabilityPredictionCard predictions={predictions} />);
                expect(container.textContent).toContain(confidence.toUpperCase());
            });
        });

        test('should display Create Bot button only for high confidence predictions', () => {
            const predictions: ProbabilityPrediction[] = [
                { digit: 5, probability: 0.20, confidence: 'high' as const, reasoning: 'High confidence' },
                { digit: 3, probability: 0.15, confidence: 'medium' as const, reasoning: 'Medium confidence' },
                { digit: 7, probability: 0.12, confidence: 'low' as const, reasoning: 'Low confidence' }
            ];

            const { container } = render(<ProbabilityPredictionCard predictions={predictions} />);
            
            // Should have exactly 1 Create Bot button (only for high confidence)
            const createBotButtons = container.querySelectorAll('.create-bot-button');
            expect(createBotButtons.length).toBe(1);
            
            // Verify the button text
            expect(createBotButtons[0].textContent).toContain('Create Bot');
        });

        test('should not display Create Bot button for non-high confidence predictions', () => {
            const predictions: ProbabilityPrediction[] = [
                { digit: 3, probability: 0.15, confidence: 'medium' as const, reasoning: 'Medium confidence' },
                { digit: 7, probability: 0.12, confidence: 'low' as const, reasoning: 'Low confidence' }
            ];

            const { container } = render(<ProbabilityPredictionCard predictions={predictions} />);
            
            // Should have no Create Bot buttons
            const createBotButtons = container.querySelectorAll('.create-bot-button');
            expect(createBotButtons.length).toBe(0);
        });

        test('should display Trade Now button for all predictions', () => {
            const predictions: ProbabilityPrediction[] = [
                { digit: 5, probability: 0.20, confidence: 'high' as const, reasoning: 'High confidence' },
                { digit: 3, probability: 0.15, confidence: 'medium' as const, reasoning: 'Medium confidence' },
                { digit: 7, probability: 0.12, confidence: 'low' as const, reasoning: 'Low confidence' }
            ];

            const { container } = render(<ProbabilityPredictionCard predictions={predictions} />);
            
            // Should have 3 Trade Now buttons (one for each prediction)
            const tradeNowButtons = container.querySelectorAll('.trade-now-button');
            expect(tradeNowButtons.length).toBe(3);
        });
    });
});
