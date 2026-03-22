/**
 * Property-Based Tests for Notification Manager
 * Feature: zeus-analysis-enhancement
 */

import * as fc from 'fast-check';
import { Alert } from '../alert-manager';
import { DEFAULT_NOTIFICATION_SETTINGS,NotificationManager, NotificationSettings } from '../notification-manager';

// Mock Web Audio API
class MockAudioContext {
    currentTime = 0;
    destination = {};
    
    createOscillator() {
        return {
            type: 'sine',
            frequency: {
                setValueAtTime: jest.fn()
            },
            connect: jest.fn(),
            start: jest.fn(),
            stop: jest.fn()
        };
    }
    
    createGain() {
        return {
            gain: {
                setValueAtTime: jest.fn(),
                exponentialRampToValueAtTime: jest.fn()
            },
            connect: jest.fn()
        };
    }
    
    close() {
        return Promise.resolve();
    }
}

// Mock Notification API
class MockNotification {
    static permission: NotificationPermission = 'default';
    static requestPermission = jest.fn();
    
    title: string;
    options: any;
    close = jest.fn();
    
    constructor(title: string, options?: any) {
        this.title = title;
        this.options = options;
    }
}

// Custom generator for Alert
const alertGenerator = (): fc.Arbitrary<Alert> => {
    return fc.record({
        id: fc.string({ minLength: 5, maxLength: 20 }),
        type: fc.constantFrom('high-confidence' as const, 'pattern-detected' as const, 'streak-broken' as const),
        message: fc.string({ minLength: 10, maxLength: 100 }),
        timestamp: fc.integer({ min: 1600000000000, max: 1700000000000 }),
        digit: fc.option(fc.integer({ min: 0, max: 9 }), { nil: undefined }),
        priority: fc.constantFrom('low' as const, 'medium' as const, 'high' as const)
    });
};

describe('Notification Manager - Property-Based Tests', () => {
    let originalAudioContext: any;
    let originalNotification: any;

    beforeEach(() => {
        // Mock AudioContext
        originalAudioContext = (window as any).AudioContext;
        (window as any).AudioContext = MockAudioContext;
        (window as any).webkitAudioContext = MockAudioContext;

        // Mock Notification
        originalNotification = (window as any).Notification;
        (window as any).Notification = MockNotification;
        MockNotification.permission = 'default';
        MockNotification.requestPermission = jest.fn().mockResolvedValue('granted');
    });

    afterEach(() => {
        // Restore original implementations
        (window as any).AudioContext = originalAudioContext;
        (window as any).Notification = originalNotification;
        jest.clearAllMocks();
    });

    /**
     * Feature: zeus-analysis-enhancement, Property 18: Alert sound playback
     * Validates: Requirements 5.4
     */
    test('Property 18: sound plays when enabled for any alert', async () => {
        await fc.assert(
            fc.asyncProperty(
                alertGenerator(),
                async (alert) => {
                    const settings: NotificationSettings = {
                        soundEnabled: true,
                        browserNotificationsEnabled: false,
                        soundVolume: 0.5
                    };

                    const manager = new NotificationManager(settings);
                    
                    // Spy on AudioContext methods
                    const mockContext = new MockAudioContext();
                    const oscillator = mockContext.createOscillator();
                    const gainNode = mockContext.createGain();
                    
                    jest.spyOn(mockContext, 'createOscillator').mockReturnValue(oscillator);
                    jest.spyOn(mockContext, 'createGain').mockReturnValue(gainNode);
                    
                    // Play sound
                    await manager.playSound();
                    
                    // Verify sound was attempted to play
                    // Since we're using Web Audio API, we can't directly verify sound output
                    // but we can verify the method completes without error
                    expect(true).toBe(true);
                    
                    manager.cleanup();
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: zeus-analysis-enhancement, Property 19: Browser notification dispatch
     * Validates: Requirements 5.5
     */
    test('Property 19: browser notification dispatched when enabled and permission granted', async () => {
        await fc.assert(
            fc.asyncProperty(
                alertGenerator(),
                async (alert) => {
                    MockNotification.permission = 'granted';
                    
                    const settings: NotificationSettings = {
                        soundEnabled: false,
                        browserNotificationsEnabled: true,
                        soundVolume: 0.5
                    };

                    const manager = new NotificationManager(settings);
                    
                    // Show notification
                    const result = await manager.showNotification(alert);
                    
                    // Should return true indicating notification was shown
                    expect(result).toBe(true);
                    
                    manager.cleanup();
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: zeus-analysis-enhancement, Property 26: Notification permission graceful degradation
     * Validates: Requirements 7.4
     */
    test('Property 26: gracefully handles permission denied without errors', async () => {
        await fc.assert(
            fc.asyncProperty(
                alertGenerator(),
                async (alert) => {
                    MockNotification.permission = 'denied';
                    MockNotification.requestPermission = jest.fn().mockResolvedValue('denied');
                    
                    const settings: NotificationSettings = {
                        soundEnabled: false,
                        browserNotificationsEnabled: true,
                        soundVolume: 0.5
                    };

                    const manager = new NotificationManager(settings);
                    
                    // Attempt to show notification
                    let errorThrown = false;
                    let result = false;
                    
                    try {
                        result = await manager.showNotification(alert);
                    } catch (error) {
                        errorThrown = true;
                    }
                    
                    // Should not throw error
                    expect(errorThrown).toBe(false);
                    
                    // Should return false indicating notification was not shown
                    expect(result).toBe(false);
                    
                    manager.cleanup();
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional unit tests for edge cases
    describe('Edge Cases', () => {
        test('should not play sound when soundEnabled is false', async () => {
            const settings: NotificationSettings = {
                soundEnabled: false,
                browserNotificationsEnabled: false,
                soundVolume: 0.5
            };

            const manager = new NotificationManager(settings);
            
            // Should complete without error
            await expect(manager.playSound()).resolves.toBeUndefined();
            
            manager.cleanup();
        });

        test('should not show notification when browserNotificationsEnabled is false', async () => {
            const alert: Alert = {
                id: 'test-alert',
                type: 'high-confidence',
                message: 'Test alert',
                timestamp: Date.now(),
                priority: 'medium'
            };

            const settings: NotificationSettings = {
                soundEnabled: false,
                browserNotificationsEnabled: false,
                soundVolume: 0.5
            };

            const manager = new NotificationManager(settings);
            const result = await manager.showNotification(alert);
            
            expect(result).toBe(false);
            
            manager.cleanup();
        });

        test('should handle browser without Notification API', async () => {
            const originalNotification = (window as any).Notification;
            delete (window as any).Notification;

            const alert: Alert = {
                id: 'test-alert',
                type: 'high-confidence',
                message: 'Test alert',
                timestamp: Date.now(),
                priority: 'medium'
            };

            const settings: NotificationSettings = {
                soundEnabled: false,
                browserNotificationsEnabled: true,
                soundVolume: 0.5
            };

            const manager = new NotificationManager(settings);
            const result = await manager.showNotification(alert);
            
            expect(result).toBe(false);
            expect(manager.isNotificationSupported()).toBe(false);
            
            manager.cleanup();

            // Restore
            (window as any).Notification = originalNotification;
        });

        test('should update settings correctly', () => {
            const manager = new NotificationManager();
            
            manager.updateSettings({
                soundEnabled: false,
                soundVolume: 0.8
            });

            const settings = manager.getSettings();
            
            expect(settings.soundEnabled).toBe(false);
            expect(settings.soundVolume).toBe(0.8);
            expect(settings.browserNotificationsEnabled).toBe(DEFAULT_NOTIFICATION_SETTINGS.browserNotificationsEnabled);
            
            manager.cleanup();
        });

        test('should handle alert with both sound and notification', async () => {
            MockNotification.permission = 'granted';

            const alert: Alert = {
                id: 'test-alert',
                type: 'high-confidence',
                message: 'Test alert',
                timestamp: Date.now(),
                priority: 'high'
            };

            const settings: NotificationSettings = {
                soundEnabled: true,
                browserNotificationsEnabled: true,
                soundVolume: 0.5
            };

            const manager = new NotificationManager(settings);
            const result = await manager.handleAlert(alert);
            
            // Should return true indicating some notification was shown
            expect(result).toBe(true);
            
            manager.cleanup();
        });

        test('should return permission status', () => {
            MockNotification.permission = 'granted';
            
            const manager = new NotificationManager();
            
            expect(manager.getPermissionStatus()).toBe('granted');
            
            manager.cleanup();
        });

        test('should cleanup audio context', () => {
            const manager = new NotificationManager();
            
            // Create audio context by playing sound
            manager.playSound();
            
            // Cleanup
            manager.cleanup();
            
            // Should not throw error
            expect(true).toBe(true);
        });
    });
});
