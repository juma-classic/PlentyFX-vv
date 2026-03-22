/**
 * Notification Manager Module
 * Handles audio notifications and browser notifications for alerts
 */

import { Alert } from './alert-manager';

export interface NotificationSettings {
    soundEnabled: boolean;
    browserNotificationsEnabled: boolean;
    soundVolume: number; // 0.0 to 1.0
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
    soundEnabled: true,
    browserNotificationsEnabled: false,
    soundVolume: 0.5
};

/**
 * Notification Manager class
 * Manages audio and browser notifications for alerts
 */
export class NotificationManager {
    private settings: NotificationSettings;
    private audioContext: AudioContext | null = null;
    private notificationPermission: NotificationPermission = 'default';

    constructor(settings: NotificationSettings = DEFAULT_NOTIFICATION_SETTINGS) {
        this.settings = settings;
        
        // Check browser notification permission
        if ('Notification' in window) {
            this.notificationPermission = Notification.permission;
        }
    }

    /**
     * Play alert sound using Web Audio API
     * Creates a simple beep sound
     */
    async playSound(): Promise<void> {
        if (!this.settings.soundEnabled) {
            return;
        }

        try {
            // Create audio context if not exists
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            }

            const ctx = this.audioContext;
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            // Configure oscillator for a pleasant notification sound
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, ctx.currentTime); // 800 Hz
            
            // Configure gain (volume)
            gainNode.gain.setValueAtTime(this.settings.soundVolume, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

            // Connect nodes
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            // Play sound
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.3);

        } catch (error) {
            console.error('Failed to play alert sound:', error);
        }
    }

    /**
     * Request browser notification permission
     * Returns true if permission granted, false otherwise
     */
    async requestNotificationPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            console.warn('Browser does not support notifications');
            return false;
        }

        if (Notification.permission === 'granted') {
            this.notificationPermission = 'granted';
            return true;
        }

        if (Notification.permission !== 'denied') {
            try {
                const permission = await Notification.requestPermission();
                this.notificationPermission = permission;
                return permission === 'granted';
            } catch (error) {
                console.error('Failed to request notification permission:', error);
                return false;
            }
        }

        return false;
    }

    /**
     * Show browser notification for an alert
     * Gracefully handles permission denied by returning false
     */
    async showNotification(alert: Alert): Promise<boolean> {
        if (!this.settings.browserNotificationsEnabled) {
            return false;
        }

        if (!('Notification' in window)) {
            console.warn('Browser does not support notifications');
            return false;
        }

        // Request permission if not already granted
        if (this.notificationPermission !== 'granted') {
            const granted = await this.requestNotificationPermission();
            if (!granted) {
                // Permission denied - gracefully degrade to in-app alerts only
                return false;
            }
        }

        try {
            const notification = new Notification('Zeus Analysis Alert', {
                body: alert.message,
                icon: '/favicon-pink.svg',
                badge: '/favicon-pink.svg',
                tag: alert.id,
                requireInteraction: alert.priority === 'high',
                silent: false
            });

            // Auto-close notification after 5 seconds for non-high priority
            if (alert.priority !== 'high') {
                setTimeout(() => notification.close(), 5000);
            }

            return true;
        } catch (error) {
            console.error('Failed to show browser notification:', error);
            return false;
        }
    }

    /**
     * Handle new alert with sound and notification
     * Returns true if any notification was shown
     */
    async handleAlert(alert: Alert): Promise<boolean> {
        let notificationShown = false;

        // Play sound
        if (this.settings.soundEnabled) {
            await this.playSound();
            notificationShown = true;
        }

        // Show browser notification
        if (this.settings.browserNotificationsEnabled) {
            const shown = await this.showNotification(alert);
            notificationShown = notificationShown || shown;
        }

        return notificationShown;
    }

    /**
     * Update notification settings
     */
    updateSettings(newSettings: Partial<NotificationSettings>): void {
        this.settings = { ...this.settings, ...newSettings };
    }

    /**
     * Get current settings
     */
    getSettings(): NotificationSettings {
        return { ...this.settings };
    }

    /**
     * Get current notification permission status
     */
    getPermissionStatus(): NotificationPermission {
        return this.notificationPermission;
    }

    /**
     * Check if browser supports notifications
     */
    isNotificationSupported(): boolean {
        return 'Notification' in window;
    }

    /**
     * Cleanup audio context
     */
    cleanup(): void {
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}
