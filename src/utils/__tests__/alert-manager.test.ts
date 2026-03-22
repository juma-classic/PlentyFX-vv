/**
 * Property-Based Tests for Alert Manager
 * Feature: zeus-analysis-enhancement
 */

import * as fc from 'fast-check';
import {
    Alert,
    AlertManager,
    AlertSettings,
    checkForAlerts,
    DEFAULT_ALERT_SETTINGS
} from '../alert-manager';
import { ProbabilityPrediction,TickData } from '../probability-calculator';

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

// Custom generator for ProbabilityPrediction
const predictionGenerator = (): fc.Arbitrary<ProbabilityPrediction> => {
    return fc.record({
        digit: fc.integer({ min: 0, max: 9 }),
        probability: fc.double({ min: 0.05, max: 0.25, noNaN: true, noDefaultInfinity: true }),
        confidence: fc.constantFrom('low' as const, 'medium' as const, 'high' as const),
        reasoning: fc.string({ minLength: 10, maxLength: 100 })
    });
};

describe('Alert Manager - Property-Based Tests', () => {
    /**
     * Feature: zeus-analysis-enhancement, Property 15: High confidence alert creation
     * Validates: Requirements 5.1
     */
    test('Property 15: high confidence predictions create alerts', () => {
        fc.assert(
            fc.property(
                fc.array(tickDataGenerator(), { minLength: 10, maxLength: 50 }),
                fc.double({ min: 0.16, max: 0.30, noNaN: true, noDefaultInfinity: true }),
                fc.double({ min: 0.05, max: 0.14, noNaN: true, noDefaultInfinity: true }),
                (ticks, highProb, lowProb) => {
                    // Create predictions with one high probability and rest low
                    const predictions: ProbabilityPrediction[] = [
                        {
                            digit: 5,
                            probability: highProb,
                            confidence: 'high',
                            reasoning: 'Test high probability'
                        },
                        {
                            digit: 3,
                            probability: lowProb,
                            confidence: 'low',
                            reasoning: 'Test low probability'
                        }
                    ];

                    const settings: AlertSettings = {
                        ...DEFAULT_ALERT_SETTINGS,
                        highConfidenceThreshold: 0.15
                    };

                    const alerts = checkForAlerts(ticks, predictions, settings);

                    // Should create alert for high probability prediction
                    const highConfAlerts = alerts.filter(a => a.type === 'high-confidence');
                    expect(highConfAlerts.length).toBeGreaterThan(0);

                    // Alert should reference the high probability digit
                    const alertForDigit5 = highConfAlerts.find(a => a.digit === 5);
                    expect(alertForDigit5).toBeDefined();
                    expect(alertForDigit5!.message).toContain('5');
                    expect(alertForDigit5!.message).toContain('High confidence');

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: zeus-analysis-enhancement, Property 16: Pattern detection alert
     * Validates: Requirements 5.2
     */
    test('Property 16: 5 consecutive same digits trigger pattern alert', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 9 }),
                fc.array(tickDataGenerator(), { minLength: 5, maxLength: 20 }),
                (digit, baseTicks) => {
                    // Create 5 consecutive ticks with same last digit
                    const patternTicks: TickData[] = Array.from({ length: 5 }, (_, i) => ({
                        epoch: Date.now() + i,
                        quote: digit + (i * 10),
                        lastDigit: digit,
                        source: 'live' as const,
                        localTime: new Date().toISOString()
                    }));

                    const allTicks = [...baseTicks, ...patternTicks];
                    const predictions: ProbabilityPrediction[] = [];

                    const settings: AlertSettings = {
                        ...DEFAULT_ALERT_SETTINGS,
                        patternAlerts: true
                    };

                    const alerts = checkForAlerts(allTicks, predictions, settings);

                    // Should create pattern-detected alert
                    const patternAlerts = alerts.filter(a => a.type === 'pattern-detected');
                    expect(patternAlerts.length).toBeGreaterThan(0);

                    // Alert should reference the pattern digit
                    const patternAlert = patternAlerts[0];
                    expect(patternAlert.digit).toBe(digit);
                    expect(patternAlert.message).toContain('5 consecutive');
                    expect(patternAlert.message).toContain(digit.toString());
                    expect(patternAlert.priority).toBe('high');

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: zeus-analysis-enhancement, Property 17: Alert display completeness
     * Validates: Requirements 5.3
     */
    test('Property 17: alerts contain timestamp and message', () => {
        fc.assert(
            fc.property(
                fc.array(tickDataGenerator(), { minLength: 10, maxLength: 50 }),
                fc.array(predictionGenerator(), { minLength: 1, maxLength: 10 }),
                (ticks, predictions) => {
                    const alerts = checkForAlerts(ticks, predictions, DEFAULT_ALERT_SETTINGS);

                    // Every alert should have timestamp and message
                    alerts.forEach(alert => {
                        expect(alert).toHaveProperty('timestamp');
                        expect(alert).toHaveProperty('message');
                        expect(typeof alert.timestamp).toBe('number');
                        expect(typeof alert.message).toBe('string');
                        expect(alert.message.length).toBeGreaterThan(0);
                        expect(alert.timestamp).toBeGreaterThan(0);
                    });

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: zeus-analysis-enhancement, Property 20: Alert list size limit
     * Validates: Requirements 5.6
     */
    test('Property 20: alert list never exceeds 10 items', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 11, max: 50 }),
                (numAlerts) => {
                    const manager = new AlertManager();

                    // Add more than 10 alerts
                    for (let i = 0; i < numAlerts; i++) {
                        const alert: Alert = {
                            id: `alert-${i}`,
                            type: 'high-confidence',
                            message: `Test alert ${i}`,
                            timestamp: Date.now() + i,
                            digit: i % 10,
                            priority: 'medium'
                        };
                        manager.addAlert(alert);
                    }

                    const alerts = manager.getAlerts();

                    // Should never exceed 10 alerts
                    expect(alerts.length).toBeLessThanOrEqual(10);
                    expect(alerts.length).toBe(10);

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional unit tests for edge cases
    describe('Edge Cases', () => {
        test('should not create alerts when predictions are empty', () => {
            const ticks: TickData[] = Array.from({ length: 10 }, (_, i) => ({
                epoch: 1600000000 + i,
                quote: 100 + i,
                lastDigit: i % 10,
                source: 'historical' as const,
                localTime: new Date().toISOString()
            }));

            const alerts = checkForAlerts(ticks, [], DEFAULT_ALERT_SETTINGS);
            const highConfAlerts = alerts.filter(a => a.type === 'high-confidence');
            
            expect(highConfAlerts).toHaveLength(0);
        });

        test('should not create pattern alert when less than 5 ticks', () => {
            const ticks: TickData[] = Array.from({ length: 3 }, () => ({
                epoch: Date.now(),
                quote: 100,
                lastDigit: 5,
                source: 'live' as const,
                localTime: new Date().toISOString()
            }));

            const alerts = checkForAlerts(ticks, [], DEFAULT_ALERT_SETTINGS);
            const patternAlerts = alerts.filter(a => a.type === 'pattern-detected');
            
            expect(patternAlerts).toHaveLength(0);
        });

        test('should not create pattern alert when digits are not all same', () => {
            const ticks: TickData[] = Array.from({ length: 5 }, (_, i) => ({
                epoch: Date.now() + i,
                quote: 100 + i,
                lastDigit: i % 10,
                source: 'live' as const,
                localTime: new Date().toISOString()
            }));

            const alerts = checkForAlerts(ticks, [], DEFAULT_ALERT_SETTINGS);
            const patternAlerts = alerts.filter(a => a.type === 'pattern-detected');
            
            expect(patternAlerts).toHaveLength(0);
        });

        test('AlertManager should maintain alerts in order (newest first)', () => {
            const manager = new AlertManager();

            const alert1: Alert = {
                id: 'alert-1',
                type: 'high-confidence',
                message: 'First alert',
                timestamp: 1000,
                priority: 'medium'
            };

            const alert2: Alert = {
                id: 'alert-2',
                type: 'pattern-detected',
                message: 'Second alert',
                timestamp: 2000,
                priority: 'high'
            };

            manager.addAlert(alert1);
            manager.addAlert(alert2);

            const alerts = manager.getAlerts();
            
            expect(alerts[0].id).toBe('alert-2'); // Newest first
            expect(alerts[1].id).toBe('alert-1');
        });

        test('AlertManager should remove specific alert by id', () => {
            const manager = new AlertManager();

            const alert1: Alert = {
                id: 'alert-1',
                type: 'high-confidence',
                message: 'First alert',
                timestamp: 1000,
                priority: 'medium'
            };

            const alert2: Alert = {
                id: 'alert-2',
                type: 'pattern-detected',
                message: 'Second alert',
                timestamp: 2000,
                priority: 'high'
            };

            manager.addAlert(alert1);
            manager.addAlert(alert2);
            manager.removeAlert('alert-1');

            const alerts = manager.getAlerts();
            
            expect(alerts).toHaveLength(1);
            expect(alerts[0].id).toBe('alert-2');
        });

        test('AlertManager should clear all alerts', () => {
            const manager = new AlertManager();

            for (let i = 0; i < 5; i++) {
                manager.addAlert({
                    id: `alert-${i}`,
                    type: 'high-confidence',
                    message: `Alert ${i}`,
                    timestamp: Date.now(),
                    priority: 'medium'
                });
            }

            manager.clearAlerts();
            
            expect(manager.getAlerts()).toHaveLength(0);
        });

        test('AlertManager should update settings', () => {
            const manager = new AlertManager();
            
            manager.updateSettings({
                highConfidenceThreshold: 0.20,
                soundEnabled: false
            });

            const settings = manager.getSettings();
            
            expect(settings.highConfidenceThreshold).toBe(0.20);
            expect(settings.soundEnabled).toBe(false);
            expect(settings.notificationsEnabled).toBe(DEFAULT_ALERT_SETTINGS.notificationsEnabled);
        });
    });
});
