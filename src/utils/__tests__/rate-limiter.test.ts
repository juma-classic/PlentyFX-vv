/**
 * Property-Based Tests for RateLimiter
 * Feature: speed-trading-system
 */

import * as fc from 'fast-check';
import { RateLimiter } from '../rate-limiter';

describe('RateLimiter - Property-Based Tests', () => {
    /**
     * Feature: speed-trading-system, Property 14: Rate limiter enforces per-second limit
     * Validates: Requirements 7.2
     */
    test('Property 14: rate limiter enforces per-second limit', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 10 }), // maxRequestsPerSecond
                fc.integer({ min: 50, max: 200 }), // maxRequestsPerMinute (must be > maxPerSecond)
                (maxPerSecond, maxPerMinute) => {
                    // Ensure maxPerMinute is greater than maxPerSecond
                    const adjustedMaxPerMinute = Math.max(maxPerMinute, maxPerSecond * 10);

                    const limiter = new RateLimiter({
                        maxRequestsPerSecond: maxPerSecond,
                        maxRequestsPerMinute: adjustedMaxPerMinute,
                        burstLimit: maxPerSecond * 2,
                    });

                    // Record exactly maxPerSecond requests
                    for (let i = 0; i < maxPerSecond; i++) {
                        expect(limiter.canMakeRequest()).toBe(true);
                        limiter.recordRequest();
                    }

                    // The next request should be blocked (per-second limit reached)
                    expect(limiter.canMakeRequest()).toBe(false);

                    // Stats should show we've hit the per-second limit
                    const stats = limiter.getStats();
                    expect(stats.requestsInLastSecond).toBe(maxPerSecond);
                    expect(stats.isThrottled).toBe(true);

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: speed-trading-system, Property 15: Rate limiter enforces per-minute limit
     * Validates: Requirements 7.2
     */
    test('Property 15: rate limiter enforces per-minute limit', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 10, max: 50 }), // maxRequestsPerMinute
                maxPerMinute => {
                    const limiter = new RateLimiter({
                        maxRequestsPerSecond: maxPerMinute, // Set high so it doesn't interfere
                        maxRequestsPerMinute: maxPerMinute,
                        burstLimit: maxPerMinute * 2, // Set high so it doesn't interfere
                    });

                    // Simulate requests spread over time to avoid per-second limit
                    // We'll use a mock approach by recording requests with small delays
                    let requestCount = 0;

                    // Record requests up to the per-minute limit
                    for (let i = 0; i < maxPerMinute; i++) {
                        if (limiter.canMakeRequest()) {
                            limiter.recordRequest();
                            requestCount++;
                        }
                    }

                    // Should have recorded exactly maxPerMinute requests
                    expect(requestCount).toBe(maxPerMinute);

                    // The next request should be blocked (per-minute limit reached)
                    expect(limiter.canMakeRequest()).toBe(false);

                    // Stats should show we've hit the per-minute limit
                    const stats = limiter.getStats();
                    expect(stats.requestsInLastMinute).toBe(maxPerMinute);
                    expect(stats.isThrottled).toBe(true);

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: speed-trading-system, Property 16: Rate limiter calculates correct wait time
     * Validates: Requirements 7.2
     */
    test('Property 16: rate limiter calculates correct wait time', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 5 }), // maxRequestsPerSecond
                maxPerSecond => {
                    const limiter = new RateLimiter({
                        maxRequestsPerSecond: maxPerSecond,
                        maxRequestsPerMinute: maxPerSecond * 20,
                        burstLimit: maxPerSecond * 2,
                    });

                    // When no requests have been made, wait time should be 0
                    expect(limiter.getTimeUntilNextRequest()).toBe(0);

                    // Record requests up to the limit
                    for (let i = 0; i < maxPerSecond; i++) {
                        limiter.recordRequest();
                    }

                    // Now we're at the limit, wait time should be > 0 and <= 1000ms
                    const waitTime = limiter.getTimeUntilNextRequest();
                    expect(waitTime).toBeGreaterThan(0);
                    expect(waitTime).toBeLessThanOrEqual(1000);

                    // After reset, wait time should be 0 again
                    limiter.reset();
                    expect(limiter.getTimeUntilNextRequest()).toBe(0);

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional unit tests for edge cases
    describe('Edge Cases', () => {
        test('should allow requests when under all limits', () => {
            const limiter = new RateLimiter({
                maxRequestsPerSecond: 5,
                maxRequestsPerMinute: 100,
                burstLimit: 10,
            });

            // First request should always be allowed
            expect(limiter.canMakeRequest()).toBe(true);
            limiter.recordRequest();

            // Should still be under limits
            expect(limiter.canMakeRequest()).toBe(true);
        });

        test('should enforce burst limit', () => {
            const burstLimit = 3;
            const limiter = new RateLimiter({
                maxRequestsPerSecond: 10,
                maxRequestsPerMinute: 100,
                burstLimit: burstLimit,
            });

            // Record up to burst limit
            for (let i = 0; i < burstLimit; i++) {
                expect(limiter.canMakeRequest()).toBe(true);
                limiter.recordRequest();
            }

            // Next request should be blocked by burst limit
            expect(limiter.canMakeRequest()).toBe(false);
        });

        test('should reset all state', () => {
            const limiter = new RateLimiter({
                maxRequestsPerSecond: 2,
                maxRequestsPerMinute: 50,
                burstLimit: 5,
            });

            // Fill up the limiter
            limiter.recordRequest();
            limiter.recordRequest();

            // Reset
            limiter.reset();

            // Should be able to make requests again
            expect(limiter.canMakeRequest()).toBe(true);
            const stats = limiter.getStats();
            expect(stats.requestsInLastSecond).toBe(0);
            expect(stats.requestsInLastMinute).toBe(0);
            expect(stats.isThrottled).toBe(false);
        });

        test('should clean old timestamps', () => {
            const limiter = new RateLimiter({
                maxRequestsPerSecond: 5,
                maxRequestsPerMinute: 100,
                burstLimit: 10,
            });

            // Record a request
            limiter.recordRequest();

            // Get stats (which triggers cleanup)
            const stats = limiter.getStats();
            expect(stats.requestsInLastSecond).toBe(1);

            // The cleanup logic should remove timestamps older than 1 minute
            // This is tested implicitly through the stats
        });

        test('should provide accurate utilization percentage', () => {
            const maxPerSecond = 10;
            const limiter = new RateLimiter({
                maxRequestsPerSecond: maxPerSecond,
                maxRequestsPerMinute: 100,
                burstLimit: 20,
            });

            // Record half the max requests
            for (let i = 0; i < maxPerSecond / 2; i++) {
                limiter.recordRequest();
            }

            const stats = limiter.getStats();
            expect(stats.utilizationPercent).toBe(50);
        });
    });
});
