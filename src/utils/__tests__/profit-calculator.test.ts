/**
 * Tests for Manual Profit Calculator
 * Ensures accurate profit calculations without API dependency
 */

import {
    calculateDigitProfit,
    calculateProfit,
    calculateRiseFallProfit,
    calculateStraddleProfit,
} from '../profit-calculator';

describe('Profit Calculator', () => {
    describe('Digit Contracts', () => {
        test('DIGITEVEN - should win on even digit', () => {
            const result = calculateDigitProfit({
                contractType: 'DIGITEVEN',
                stake: 5,
                entrySpot: 123.456,
                exitSpot: 123.458, // Last digit is 8 (even)
                duration: 1,
            });

            expect(result.outcome).toBe('win');
            expect(result.profit).toBe(4.5); // 5 * 1.9 - 5 = 4.5
            expect(result.payout).toBe(9.5);
            expect(result.roi).toBe(90);
        });

        test('DIGITEVEN - should lose on odd digit', () => {
            const result = calculateDigitProfit({
                contractType: 'DIGITEVEN',
                stake: 5,
                entrySpot: 123.456,
                exitSpot: 123.457, // Last digit is 7 (odd)
                duration: 1,
            });

            expect(result.outcome).toBe('loss');
            expect(result.profit).toBe(-5);
            expect(result.payout).toBe(0);
            expect(result.roi).toBe(-100);
        });

        test('DIGITODD - should win on odd digit', () => {
            const result = calculateDigitProfit({
                contractType: 'DIGITODD',
                stake: 10,
                entrySpot: 123.456,
                exitSpot: 123.453, // Last digit is 3 (odd)
                duration: 1,
            });

            expect(result.outcome).toBe('win');
            expect(result.profit).toBe(9); // 10 * 1.9 - 10 = 9
            expect(result.payout).toBe(19);
        });

        test('DIGITMATCH - should win on exact match', () => {
            const result = calculateDigitProfit({
                contractType: 'DIGITMATCH',
                stake: 1,
                entrySpot: 123.456,
                exitSpot: 123.452, // Last digit is 2
                duration: 1,
                defaultDigit: 2,
            });

            expect(result.outcome).toBe('win');
            expect(result.profit).toBe(8); // 1 * 9 - 1 = 8
            expect(result.payout).toBe(9);
        });

        test('DIGITMATCH - should lose on no match', () => {
            const result = calculateDigitProfit({
                contractType: 'DIGITMATCH',
                stake: 1,
                entrySpot: 123.456,
                exitSpot: 123.457, // Last digit is 7
                duration: 1,
                defaultDigit: 2,
            });

            expect(result.outcome).toBe('loss');
            expect(result.profit).toBe(-1);
        });

        test('DIGITDIFF - should win on different digit', () => {
            const result = calculateDigitProfit({
                contractType: 'DIGITDIFF',
                stake: 5,
                entrySpot: 123.456,
                exitSpot: 123.457, // Last digit is 7
                duration: 1,
                defaultDigit: 2,
            });

            expect(result.outcome).toBe('win');
            expect(result.profit).toBe(0.55); // 5 * 1.11 - 5 = 0.55
        });

        test('DIGITOVER - should win when digit is over target', () => {
            const result = calculateDigitProfit({
                contractType: 'DIGITOVER',
                stake: 5,
                entrySpot: 123.456,
                exitSpot: 123.458, // Last digit is 8
                duration: 1,
                defaultDigit: 6,
            });

            expect(result.outcome).toBe('win');
            expect(result.profit).toBe(4.5);
        });

        test('DIGITUNDER - should win when digit is under target', () => {
            const result = calculateDigitProfit({
                contractType: 'DIGITUNDER',
                stake: 5,
                entrySpot: 123.456,
                exitSpot: 123.453, // Last digit is 3
                duration: 1,
                defaultDigit: 6,
            });

            expect(result.outcome).toBe('win');
            expect(result.profit).toBe(4.5);
        });
    });

    describe('Rise/Fall Contracts', () => {
        test('CALL (Rise) - should win when price rises', () => {
            const result = calculateRiseFallProfit({
                contractType: 'CALL',
                stake: 10,
                entrySpot: 123.456,
                exitSpot: 123.789, // Higher than entry
                duration: 5,
            });

            expect(result.outcome).toBe('win');
            expect(result.profit).toBe(8.5); // 10 * 1.85 - 10 = 8.5
            expect(result.payout).toBe(18.5);
        });

        test('CALL (Rise) - should lose when price falls', () => {
            const result = calculateRiseFallProfit({
                contractType: 'CALL',
                stake: 10,
                entrySpot: 123.456,
                exitSpot: 123.123, // Lower than entry
                duration: 5,
            });

            expect(result.outcome).toBe('loss');
            expect(result.profit).toBe(-10);
            expect(result.payout).toBe(0);
        });

        test('PUT (Fall) - should win when price falls', () => {
            const result = calculateRiseFallProfit({
                contractType: 'PUT',
                stake: 5,
                entrySpot: 123.456,
                exitSpot: 123.123, // Lower than entry
                duration: 3,
            });

            expect(result.outcome).toBe('win');
            expect(result.profit).toBe(4.25); // 5 * 1.85 - 5 = 4.25
        });

        test('PUT (Fall) - should lose when price rises', () => {
            const result = calculateRiseFallProfit({
                contractType: 'PUT',
                stake: 5,
                entrySpot: 123.456,
                exitSpot: 123.789, // Higher than entry
                duration: 3,
            });

            expect(result.outcome).toBe('loss');
            expect(result.profit).toBe(-5);
        });
    });

    describe('Straddle6 Strategy', () => {
        test('should calculate combined profit for Over 6 + Under 6', () => {
            const overDetails = {
                contractType: 'DIGITOVER',
                stake: 2.5,
                entrySpot: 123.456,
                exitSpot: 123.458, // Last digit is 8 (over 6)
                duration: 1,
                defaultDigit: 6,
            };

            const underDetails = {
                contractType: 'DIGITUNDER',
                stake: 2.5,
                entrySpot: 123.456,
                exitSpot: 123.458, // Last digit is 8 (not under 6)
                duration: 1,
                defaultDigit: 6,
            };

            const result = calculateStraddleProfit(overDetails, underDetails);

            expect(result.overResult.outcome).toBe('win');
            expect(result.underResult.outcome).toBe('loss');
            expect(result.totalProfit).toBe(-0.25); // 2.25 - 2.5 = -0.25 (over wins, under loses)
            expect(result.totalOutcome).toBe('loss');
        });

        test('should handle losing straddle (digit = 6)', () => {
            const overDetails = {
                contractType: 'DIGITOVER',
                stake: 2.5,
                entrySpot: 123.456,
                exitSpot: 123.456, // Last digit is 6 (not over 6)
                duration: 1,
                defaultDigit: 6,
            };

            const underDetails = {
                contractType: 'DIGITUNDER',
                stake: 2.5,
                entrySpot: 123.456,
                exitSpot: 123.456, // Last digit is 6 (not under 6)
                duration: 1,
                defaultDigit: 6,
            };

            const result = calculateStraddleProfit(overDetails, underDetails);

            expect(result.overResult.outcome).toBe('loss');
            expect(result.underResult.outcome).toBe('loss');
            expect(result.totalProfit).toBe(-5); // Both lose
            expect(result.totalOutcome).toBe('loss');
        });
    });

    describe('Main calculateProfit function', () => {
        test('should route digit contracts correctly', () => {
            const result = calculateProfit({
                contractType: 'DIGITEVEN',
                stake: 5,
                entrySpot: 123.456,
                exitSpot: 123.458,
                duration: 1,
            });

            expect(result.outcome).toBe('win');
            expect(result.profit).toBe(4.5);
        });

        test('should route rise/fall contracts correctly', () => {
            const result = calculateProfit({
                contractType: 'CALL',
                stake: 10,
                entrySpot: 123.456,
                exitSpot: 123.789,
                duration: 5,
            });

            expect(result.outcome).toBe('win');
            expect(result.profit).toBe(8.5);
        });

        test('should handle unknown contract types', () => {
            const result = calculateProfit({
                contractType: 'UNKNOWN',
                stake: 5,
                entrySpot: 123.456,
                exitSpot: 123.789,
                duration: 1,
            });

            expect(result.outcome).toBe('loss');
            expect(result.profit).toBe(-5);
        });
    });

    describe('Edge Cases', () => {
        test('should handle decimal precision correctly', () => {
            const result = calculateDigitProfit({
                contractType: 'DIGITEVEN',
                stake: 0.35, // Minimum stake
                entrySpot: 123.456789,
                exitSpot: 123.456782, // Last digit should be 2 (even)
                duration: 1,
            });

            expect(result.outcome).toBe('win');
            expect(result.profit).toBe(0.31); // 0.35 * 1.9 - 0.35 = 0.315, rounded to 0.31
        });

        test('should handle very small stakes', () => {
            const result = calculateDigitProfit({
                contractType: 'DIGITODD',
                stake: 0.01,
                entrySpot: 123.456,
                exitSpot: 123.457,
                duration: 1,
            });

            expect(result.outcome).toBe('win');
            expect(result.profit).toBe(0.01); // 0.01 * 1.9 - 0.01 = 0.009, rounded to 0.01
        });
    });
});
