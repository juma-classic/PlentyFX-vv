/**
 * Advanced Rate Limiter with Burst Protection
 * Ensures we stay within Deriv's API limits
 */

interface RateLimitConfig {
    maxRequestsPerSecond: number;
    maxRequestsPerMinute: number;
    burstLimit: number;
}

export class RateLimiter {
    private requestTimestamps: number[] = [];
    private config: RateLimitConfig;
    private isThrottled = false;

    constructor(
        config: RateLimitConfig = {
            maxRequestsPerSecond: 5,
            maxRequestsPerMinute: 100,
            burstLimit: 10,
        }
    ) {
        this.config = config;
    }

    /**
     * Check if we can make a request now
     */
    canMakeRequest(): boolean {
        this.cleanOldTimestamps();

        const now = Date.now();
        const lastSecond = now - 1000;
        const lastMinute = now - 60000;

        const requestsInLastSecond = this.requestTimestamps.filter(t => t > lastSecond).length;
        const requestsInLastMinute = this.requestTimestamps.filter(t => t > lastMinute).length;

        // Check all limits
        if (requestsInLastSecond >= this.config.maxRequestsPerSecond) {
            this.isThrottled = true;
            return false;
        }

        if (requestsInLastMinute >= this.config.maxRequestsPerMinute) {
            this.isThrottled = true;
            return false;
        }

        if (this.requestTimestamps.length >= this.config.burstLimit) {
            this.isThrottled = true;
            return false;
        }

        this.isThrottled = false;
        return true;
    }

    /**
     * Record that a request was made
     */
    recordRequest(): void {
        this.requestTimestamps.push(Date.now());
    }

    /**
     * Get time until next request is allowed (in ms)
     */
    getTimeUntilNextRequest(): number {
        if (this.canMakeRequest()) {
            return 0;
        }

        this.cleanOldTimestamps();

        if (this.requestTimestamps.length === 0) {
            return 0;
        }

        const now = Date.now();
        const oldestTimestamp = this.requestTimestamps[0];
        const timeSinceOldest = now - oldestTimestamp;

        // Wait until oldest request is > 1 second old
        return Math.max(0, 1000 - timeSinceOldest);
    }

    /**
     * Get current usage stats
     */
    getStats() {
        this.cleanOldTimestamps();

        const now = Date.now();
        const lastSecond = now - 1000;
        const lastMinute = now - 60000;

        return {
            requestsInLastSecond: this.requestTimestamps.filter(t => t > lastSecond).length,
            requestsInLastMinute: this.requestTimestamps.filter(t => t > lastMinute).length,
            maxPerSecond: this.config.maxRequestsPerSecond,
            maxPerMinute: this.config.maxRequestsPerMinute,
            isThrottled: this.isThrottled,
            utilizationPercent: Math.round(
                (this.requestTimestamps.filter(t => t > lastSecond).length / this.config.maxRequestsPerSecond) * 100
            ),
        };
    }

    /**
     * Remove timestamps older than 1 minute
     */
    private cleanOldTimestamps(): void {
        const oneMinuteAgo = Date.now() - 60000;
        this.requestTimestamps = this.requestTimestamps.filter(t => t > oneMinuteAgo);
    }

    /**
     * Reset the rate limiter
     */
    reset(): void {
        this.requestTimestamps = [];
        this.isThrottled = false;
    }
}

export const rateLimiter = new RateLimiter();
