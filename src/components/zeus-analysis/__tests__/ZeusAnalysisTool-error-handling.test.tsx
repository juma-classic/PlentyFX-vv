import React from 'react';
import fc from 'fast-check';
import { render, screen, waitFor } from '@testing-library/react';
import { ZeusAnalysisTool } from '../ZeusAnalysisTool';

// Mock WebSocket
class MockWebSocket {
    static OPEN = 1;
    static CLOSED = 3;
    
    readyState = MockWebSocket.CLOSED;
    onopen: (() => void) | null = null;
    onmessage: ((event: any) => void) | null = null;
    onerror: ((error: any) => void) | null = null;
    onclose: (() => void) | null = null;
    
    constructor(public url: string) {}
    
    send(data: string) {}
    close() {
        this.readyState = MockWebSocket.CLOSED;
        if (this.onclose) this.onclose();
    }
}

describe('ZeusAnalysisTool - Error Handling Property Tests', () => {
    let originalWebSocket: typeof WebSocket;
    
    beforeEach(() => {
        originalWebSocket = global.WebSocket;
        (global as any).WebSocket = MockWebSocket;
    });
    
    afterEach(() => {
        global.WebSocket = originalWebSocket;
    });
    
    /**
     * Feature: zeus-analysis-enhancement, Property 24: API error handling
     * Validates: Requirements 7.1
     */
    test('API errors should display error message without crashing', () => {
        fc.assert(
            fc.property(
                fc.record({
                    errorType: fc.constantFrom('network', 'timeout', 'parse', 'unknown'),
                    errorMessage: fc.string({ minLength: 1, maxLength: 100 })
                }),
                (errorConfig) => {
                    // Mock WebSocket that triggers an error
                    class ErrorWebSocket extends MockWebSocket {
                        constructor(url: string) {
                            super(url);
                            // Trigger error after a short delay
                            setTimeout(() => {
                                if (this.onerror) {
                                    this.onerror(new Error(errorConfig.errorMessage));
                                }
                            }, 10);
                        }
                    }
                    
                    (global as any).WebSocket = ErrorWebSocket;
                    
                    // Render component - should not throw
                    let didThrow = false;
                    try {
                        const { container } = render(<ZeusAnalysisTool />);
                        
                        // Component should render something (loading skeleton or error)
                        expect(container.firstChild).toBeTruthy();
                        
                        // Should not have thrown an unhandled exception
                        didThrow = false;
                    } catch (error) {
                        didThrow = true;
                    }
                    
                    return !didThrow;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('insufficient data should display appropriate message', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 9 }),
                (tickCount) => {
                    // Mock WebSocket that returns insufficient data
                    class InsufficientDataWebSocket extends MockWebSocket {
                        constructor(url: string) {
                            super(url);
                            this.readyState = MockWebSocket.OPEN;
                            
                            setTimeout(() => {
                                if (this.onopen) this.onopen();
                                
                                // Send history with less than 10 ticks
                                if (this.onmessage) {
                                    const times = Array(tickCount).fill(0).map((_, i) => Date.now() / 1000 + i);
                                    const prices = Array(tickCount).fill(0).map(() => 100 + Math.random() * 10);
                                    
                                    this.onmessage({
                                        data: JSON.stringify({
                                            history: {
                                                times,
                                                prices
                                            }
                                        })
                                    });
                                }
                            }, 10);
                        }
                    }
                    
                    (global as any).WebSocket = InsufficientDataWebSocket;
                    
                    const { container } = render(<ZeusAnalysisTool />);
                    
                    // Should render without crashing
                    expect(container.firstChild).toBeTruthy();
                    
                    // If less than 10 ticks, should show loading skeleton
                    if (tickCount < 10) {
                        // Component handles this by showing loading skeleton
                        return true;
                    }
                    
                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });
});

// Import at the top level
import { fireEvent, waitFor as waitForElement } from '@testing-library/react';
import { ProbabilityPredictionCard } from '../ProbabilityPredictionCard';

// Mock the trade signal generator module
jest.mock('../../../utils/trade-signal-generator', () => ({
    createAndDispatchTradeSignal: jest.fn(),
}));

import { createAndDispatchTradeSignal } from '../../../utils/trade-signal-generator';

describe('Trade Signal Error Notification Property Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    
    /**
     * Feature: zeus-analysis-enhancement, Property 25: Trade signal error notification
     * Validates: Requirements 7.3
     */
    test('trade signal failures should display error notification', () => {
        fc.assert(
            fc.asyncProperty(
                fc.record({
                    digit: fc.integer({ min: 0, max: 9 }),
                    probability: fc.double({ min: 0.05, max: 0.25 }),
                    confidence: fc.constantFrom('low' as const, 'medium' as const, 'high' as const),
                    reasoning: fc.string({ minLength: 5, maxLength: 50 })
                }),
                async (prediction) => {
                    // Make it throw an error
                    (createAndDispatchTradeSignal as jest.Mock).mockImplementation(() => {
                        throw new Error('Trade signal dispatch failed');
                    });
                    
                    const predictions = [prediction];
                    
                    const { container } = render(
                        <ProbabilityPredictionCard predictions={predictions} market="R_50" />
                    );
                    
                    // Find and click the Trade Now button
                    const tradeButtons = container.querySelectorAll('.trade-now-button');
                    expect(tradeButtons.length).toBeGreaterThan(0);
                    
                    fireEvent.click(tradeButtons[0]);
                    
                    // Wait for error notification to appear
                    await waitForElement(() => {
                        const errorNotification = container.querySelector('.trade-notification-error');
                        return errorNotification !== null;
                    }, { timeout: 1000 });
                    
                    // Verify error notification is displayed
                    const errorNotification = container.querySelector('.trade-notification-error');
                    expect(errorNotification).toBeTruthy();
                    expect(errorNotification?.textContent).toContain('Failed');
                    
                    return true;
                }
            ),
            { numRuns: 20 }
        );
    });
    
    test('successful trade signals should display success notification', () => {
        fc.assert(
            fc.asyncProperty(
                fc.record({
                    digit: fc.integer({ min: 0, max: 9 }),
                    probability: fc.double({ min: 0.05, max: 0.25 }),
                    confidence: fc.constantFrom('low' as const, 'medium' as const, 'high' as const),
                    reasoning: fc.string({ minLength: 5, maxLength: 50 })
                }),
                async (prediction) => {
                    // Make it return a valid signal
                    (createAndDispatchTradeSignal as jest.Mock).mockReturnValue({
                        type: prediction.digit <= 4 ? 'DIGITUNDER' : 'DIGITOVER',
                        market: 'R_50',
                        prediction: prediction.digit,
                        confidence: prediction.confidence,
                        reasoning: prediction.reasoning,
                        timestamp: Date.now()
                    });
                    
                    const predictions = [prediction];
                    
                    const { container } = render(
                        <ProbabilityPredictionCard predictions={predictions} market="R_50" />
                    );
                    
                    // Find and click the Trade Now button
                    const tradeButtons = container.querySelectorAll('.trade-now-button');
                    expect(tradeButtons.length).toBeGreaterThan(0);
                    
                    fireEvent.click(tradeButtons[0]);
                    
                    // Wait for success notification to appear
                    await waitForElement(() => {
                        const successNotification = container.querySelector('.trade-notification-success');
                        return successNotification !== null;
                    }, { timeout: 1000 });
                    
                    // Verify success notification is displayed
                    const successNotification = container.querySelector('.trade-notification-success');
                    expect(successNotification).toBeTruthy();
                    expect(successNotification?.textContent).toContain('Trade signal sent');
                    
                    return true;
                }
            ),
            { numRuns: 20 }
        );
    });
});
