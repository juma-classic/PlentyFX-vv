/**
 * Property-Based Tests for RecentTicksList Component
 * Feature: zeus-analysis-enhancement
 */

import React from 'react';
import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import { RecentTicksList, TickData } from '../RecentTicksList';

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

describe('RecentTicksList - Property-Based Tests', () => {
    /**
     * Feature: zeus-analysis-enhancement, Property 6: Recent tick ordering
     * Validates: Requirements 2.1
     */
    test('Property 6: new tick appears at index 0 (top) of recent ticks list', () => {
        fc.assert(
            fc.property(
                fc.array(tickDataGenerator(), { minLength: 2, maxLength: 50 }),
                (ticks) => {
                    const { container } = render(<RecentTicksList ticks={ticks} maxDisplay={10} />);
                    
                    // Get all tick rows
                    const tickRows = container.querySelectorAll('[data-testid^="tick-row-"]');
                    
                    if (tickRows.length === 0) return true;
                    
                    // The first row (index 0) should be the most recent tick
                    const firstRow = tickRows[0];
                    
                    // Get the last tick from the input (most recent)
                    const mostRecentTick = ticks[ticks.length - 1];
                    
                    // Check if the first row contains the most recent tick's data
                    const quoteElements = firstRow.querySelectorAll('[data-testid="tick-quote"]');
                    if (quoteElements.length > 0) {
                        const displayedQuote = quoteElements[0].textContent;
                        const expectedQuote = mostRecentTick.quote.toFixed(5);
                        expect(displayedQuote).toBe(expectedQuote);
                    }
                    
                    // Check if the first row has the 'latest' class
                    expect(firstRow.classList.contains('latest')).toBe(true);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: zeus-analysis-enhancement, Property 7: Tick display completeness
     * Validates: Requirements 2.2
     */
    test('Property 7: each tick displays timestamp, quote, last digit, and direction', () => {
        fc.assert(
            fc.property(
                fc.array(tickDataGenerator(), { minLength: 1, maxLength: 20 }),
                (ticks) => {
                    const { container } = render(<RecentTicksList ticks={ticks} maxDisplay={10} />);
                    
                    // Get all tick rows
                    const tickRows = container.querySelectorAll('[data-testid^="tick-row-"]');
                    
                    if (tickRows.length === 0) return true;
                    
                    // Check each row has all required fields
                    tickRows.forEach((row) => {
                        // Check for timestamp
                        const timeElements = row.querySelectorAll('[data-testid="tick-time"]');
                        expect(timeElements.length).toBeGreaterThan(0);
                        expect(timeElements[0].textContent).toBeTruthy();
                        
                        // Check for quote
                        const quoteElements = row.querySelectorAll('[data-testid="tick-quote"]');
                        expect(quoteElements.length).toBeGreaterThan(0);
                        expect(quoteElements[0].textContent).toBeTruthy();
                        
                        // Check for last digit
                        const digitElements = row.querySelectorAll('[data-testid="tick-digit"]');
                        expect(digitElements.length).toBeGreaterThan(0);
                        expect(digitElements[0].textContent).toBeTruthy();
                        
                        // Check for direction indicator
                        const directionElements = row.querySelectorAll('[data-testid="tick-direction"]');
                        expect(directionElements.length).toBeGreaterThan(0);
                        expect(directionElements[0].textContent).toBeTruthy();
                    });
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: zeus-analysis-enhancement, Property 8: Price increase direction indicator
     * Feature: zeus-analysis-enhancement, Property 9: Price decrease direction indicator
     * Validates: Requirements 2.5, 2.6
     */
    test('Property 8 & 9: direction indicators show up/down arrows correctly', () => {
        fc.assert(
            fc.property(
                fc.double({ min: 100, max: 1000, noNaN: true, noDefaultInfinity: true }),
                fc.double({ min: 100, max: 1000, noNaN: true, noDefaultInfinity: true }),
                fc.integer({ min: 1600000000, max: 1700000000 }),
                (quote1, quote2, baseEpoch) => {
                    // Create two ticks with known price relationship
                    const ticks: TickData[] = [
                        {
                            epoch: baseEpoch,
                            quote: quote1,
                            lastDigit: Math.floor(quote1) % 10,
                            source: 'historical' as const,
                            localTime: new Date(baseEpoch * 1000).toISOString()
                        },
                        {
                            epoch: baseEpoch + 1,
                            quote: quote2,
                            lastDigit: Math.floor(quote2) % 10,
                            source: 'live' as const,
                            localTime: new Date((baseEpoch + 1) * 1000).toISOString()
                        }
                    ];
                    
                    const { container } = render(<RecentTicksList ticks={ticks} maxDisplay={10} />);
                    
                    // Get the first tick row (most recent = second tick)
                    const firstRow = container.querySelector('[data-testid="tick-row-0"]');
                    if (!firstRow) return true;
                    
                    const directionElement = firstRow.querySelector('[data-testid="tick-direction"]');
                    if (!directionElement) return true;
                    
                    const directionText = directionElement.textContent || '';
                    
                    // Check direction based on price comparison
                    if (quote2 > quote1) {
                        // Price increased - should show up arrow
                        expect(directionText).toContain('↑');
                        const arrowElement = directionElement.querySelector('.up');
                        expect(arrowElement).toBeTruthy();
                    } else if (quote2 < quote1) {
                        // Price decreased - should show down arrow
                        expect(directionText).toContain('↓');
                        const arrowElement = directionElement.querySelector('.down');
                        expect(arrowElement).toBeTruthy();
                    } else {
                        // Price unchanged - should show neutral arrow
                        expect(directionText).toContain('→');
                        const arrowElement = directionElement.querySelector('.neutral');
                        expect(arrowElement).toBeTruthy();
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: zeus-analysis-enhancement, Property 29: Alternating row styling
     * Validates: Requirements 8.4
     */
    test('Property 29: odd and even rows have different CSS classes', () => {
        fc.assert(
            fc.property(
                fc.array(tickDataGenerator(), { minLength: 3, maxLength: 20 }),
                (ticks) => {
                    const { container } = render(<RecentTicksList ticks={ticks} maxDisplay={10} />);
                    
                    // Get all tick rows
                    const tickRows = container.querySelectorAll('[data-testid^="tick-row-"]');
                    
                    if (tickRows.length < 2) return true;
                    
                    // Check alternating pattern
                    tickRows.forEach((row, index) => {
                        if (index % 2 === 0) {
                            // Even index should have 'even' class
                            expect(row.classList.contains('even')).toBe(true);
                            expect(row.classList.contains('odd')).toBe(false);
                        } else {
                            // Odd index should have 'odd' class
                            expect(row.classList.contains('odd')).toBe(true);
                            expect(row.classList.contains('even')).toBe(false);
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
        test('should display message when no ticks available', () => {
            render(<RecentTicksList ticks={[]} />);
            
            expect(screen.getByText(/No tick data available yet/i)).toBeInTheDocument();
        });

        test('should limit display to maxDisplay parameter', () => {
            const ticks: TickData[] = Array.from({ length: 20 }, (_, i) => ({
                epoch: 1600000000 + i,
                quote: 100 + i,
                lastDigit: i % 10,
                source: 'historical' as const,
                localTime: new Date((1600000000 + i) * 1000).toISOString()
            }));

            const { container } = render(<RecentTicksList ticks={ticks} maxDisplay={5} />);
            
            const tickRows = container.querySelectorAll('[data-testid^="tick-row-"]');
            expect(tickRows.length).toBe(5);
        });

        test('should highlight the most recent tick', () => {
            const ticks: TickData[] = Array.from({ length: 5 }, (_, i) => ({
                epoch: 1600000000 + i,
                quote: 100 + i,
                lastDigit: i % 10,
                source: 'historical' as const,
                localTime: new Date((1600000000 + i) * 1000).toISOString()
            }));

            const { container } = render(<RecentTicksList ticks={ticks} />);
            
            const firstRow = container.querySelector('[data-testid="tick-row-0"]');
            expect(firstRow?.classList.contains('latest')).toBe(true);
        });

        test('should format time correctly', () => {
            const ticks: TickData[] = [{
                epoch: 1600000000,
                quote: 123.45678,
                lastDigit: 8,
                source: 'live' as const,
                localTime: new Date(1600000000 * 1000).toISOString()
            }];

            const { container } = render(<RecentTicksList ticks={ticks} />);
            
            const timeElement = container.querySelector('[data-testid="tick-time"]');
            expect(timeElement?.textContent).toMatch(/\d{2}:\d{2}:\d{2}/);
        });

        test('should display quote with 5 decimal places', () => {
            const ticks: TickData[] = [{
                epoch: 1600000000,
                quote: 123.456789,
                lastDigit: 9,
                source: 'live' as const,
                localTime: new Date(1600000000 * 1000).toISOString()
            }];

            const { container } = render(<RecentTicksList ticks={ticks} />);
            
            const quoteElement = container.querySelector('[data-testid="tick-quote"]');
            expect(quoteElement?.textContent).toBe('123.45679');
        });
    });
});
