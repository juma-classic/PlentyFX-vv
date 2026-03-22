import { entryPointDetector } from '../entry-point-detector.service';

describe('EntryPointDetectorService', () => {
    it('detects high-score entry point with long streak', () => {
        const pattern = Array(10).fill('EVEN');
        const entry = entryPointDetector.detectEntryPoint(pattern);

        expect(entry.score).toBeGreaterThan(70);
        expect(entry.type).toBe('ENTER_NOW');
        expect(entry.conditions.streakLength).toBe(10);
    });

    it('detects entry point with distribution imbalance', () => {
        const pattern = [...Array(15).fill('EVEN'), ...Array(3).fill('ODD')];
        const entry = entryPointDetector.detectEntryPoint(pattern);

        expect(entry.conditions.distributionImbalance).toBe(12);
        expect(entry.score).toBeGreaterThan(50);
    });

    it('detects alternating pattern', () => {
        const pattern = ['EVEN', 'ODD', 'EVEN', 'ODD', 'EVEN', 'ODD'];
        const entry = entryPointDetector.detectEntryPoint(pattern);

        expect(entry.conditions.isAlternating).toBe(true);
        expect(entry.score).toBeGreaterThan(0);
    });

    it('detects Fibonacci streak', () => {
        const pattern = Array(8).fill('EVEN');
        const entry = entryPointDetector.detectEntryPoint(pattern);

        expect(entry.conditions.isFibonacci).toBe(true);
        expect(entry.conditions.streakLength).toBe(8);
    });

    it('detects multiple signals aligned', () => {
        const pattern = [...Array(12).fill('EVEN'), ...Array(2).fill('ODD')];
        const entry = entryPointDetector.detectEntryPoint(pattern);

        expect(entry.conditions.multipleSignalsAligned).toBe(true);
        expect(entry.score).toBeGreaterThan(70);
    });

    it('returns default for insufficient data', () => {
        const pattern = ['EVEN', 'ODD'];
        const entry = entryPointDetector.detectEntryPoint(pattern);

        expect(entry.score).toBe(0);
        expect(entry.type).toBe('WAIT');
        expect(entry.reason).toContain('Insufficient data');
    });

    it('calculates risk/reward ratio correctly', () => {
        const pattern = Array(10).fill('EVEN');
        const entry = entryPointDetector.detectEntryPoint(pattern);

        expect(entry.riskRewardRatio).toBeGreaterThan(1.0);
        expect(entry.riskRewardRatio).toBeLessThanOrEqual(4.0);
    });

    it('calculates expected profit', () => {
        const pattern = Array(10).fill('EVEN');
        const entry = entryPointDetector.detectEntryPoint(pattern);

        expect(entry.expectedProfit).toBeGreaterThan(50);
        expect(entry.expectedProfit).toBeLessThanOrEqual(100);
    });

    it('calculates entry window based on conditions', () => {
        const longStreak = Array(12).fill('EVEN');
        const entry1 = entryPointDetector.detectEntryPoint(longStreak);
        expect(entry1.entryWindowTicks).toBeLessThanOrEqual(3);

        const shortPattern = Array(5).fill('EVEN');
        const entry2 = entryPointDetector.detectEntryPoint(shortPattern);
        expect(entry2.entryWindowTicks).toBeGreaterThanOrEqual(3);
    });

    it('generates appropriate reason text', () => {
        const pattern = Array(10).fill('EVEN');
        const entry = entryPointDetector.detectEntryPoint(pattern);

        expect(entry.reason).toContain('consecutive streak');
        expect(entry.reason.length).toBeGreaterThan(0);
    });

    it('determines ENTER_NOW for high score and confidence', () => {
        const pattern = Array(12).fill('EVEN');
        const entry = entryPointDetector.detectEntryPoint(pattern);

        expect(entry.type).toBe('ENTER_NOW');
        expect(entry.score).toBeGreaterThan(75);
        expect(entry.confidence).toBeGreaterThan(70);
    });

    it('determines WAIT for medium score', () => {
        const pattern = Array(5).fill('EVEN');
        const entry = entryPointDetector.detectEntryPoint(pattern);

        expect(['WAIT', 'CAUTION']).toContain(entry.type);
    });

    it('penalizes high volatility', () => {
        const volatile = ['EVEN', 'ODD', 'EVEN', 'ODD', 'EVEN', 'ODD', 'EVEN', 'ODD'];
        const stable = Array(8).fill('EVEN');

        const entry1 = entryPointDetector.detectEntryPoint(volatile);
        const entry2 = entryPointDetector.detectEntryPoint(stable);

        expect(entry2.score).toBeGreaterThan(entry1.score);
    });
});
