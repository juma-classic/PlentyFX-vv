/**
 * Alert Manager Module
 * Detects and manages alerts for high-confidence predictions and pattern detections
 */

import { ProbabilityPrediction, TickData } from './probability-calculator';

export interface Alert {
    id: string;
    type: 'high-confidence' | 'pattern-detected' | 'streak-broken';
    message: string;
    timestamp: number;
    digit?: number;
    priority: 'low' | 'medium' | 'high';
}

export interface AlertSettings {
    highConfidenceThreshold: number;
    soundEnabled: boolean;
    notificationsEnabled: boolean;
    streakAlerts: boolean;
    patternAlerts: boolean;
}

/**
 * Default alert settings
 */
export const DEFAULT_ALERT_SETTINGS: AlertSettings = {
    highConfidenceThreshold: 0.15, // 15% probability threshold
    soundEnabled: true,
    notificationsEnabled: false,
    streakAlerts: true,
    patternAlerts: true
};

/**
 * Check for alerts based on tick data and predictions
 * 
 * @param ticks - Array of tick data
 * @param predictions - Array of probability predictions
 * @param settings - Alert settings configuration
 * @returns Array of detected alerts
 */
export function checkForAlerts(
    ticks: TickData[],
    predictions: ProbabilityPrediction[],
    settings: AlertSettings = DEFAULT_ALERT_SETTINGS
): Alert[] {
    const alerts: Alert[] = [];

    // Check for high-confidence predictions
    if (predictions && predictions.length > 0) {
        predictions.forEach(prediction => {
            if (prediction.probability > settings.highConfidenceThreshold) {
                alerts.push({
                    id: `high-conf-${Date.now()}-${prediction.digit}`,
                    type: 'high-confidence',
                    message: `High confidence prediction: Digit ${prediction.digit} (${(prediction.probability * 100).toFixed(1)}%)`,
                    timestamp: Date.now(),
                    digit: prediction.digit,
                    priority: prediction.confidence === 'high' ? 'high' : 'medium'
                });
            }
        });
    }

    // Check for pattern detection (5 consecutive ticks with same digit)
    if (settings.patternAlerts && ticks.length >= 5) {
        const last5Ticks = ticks.slice(-5);
        const firstDigit = last5Ticks[0].lastDigit;
        const allSame = last5Ticks.every(tick => tick.lastDigit === firstDigit);

        if (allSame) {
            alerts.push({
                id: `pattern-${Date.now()}-${firstDigit}`,
                type: 'pattern-detected',
                message: `Pattern detected: 5 consecutive ticks with digit ${firstDigit}`,
                timestamp: Date.now(),
                digit: firstDigit,
                priority: 'high'
            });
        }
    }

    return alerts;
}

/**
 * Alert Manager class to maintain alert state
 */
export class AlertManager {
    private alerts: Alert[] = [];
    private maxAlerts: number = 10;
    private settings: AlertSettings;

    constructor(settings: AlertSettings = DEFAULT_ALERT_SETTINGS) {
        this.settings = settings;
    }

    /**
     * Add a new alert to the list
     * Maintains maximum of 10 alerts by removing oldest
     */
    addAlert(alert: Alert): void {
        this.alerts.unshift(alert); // Add to beginning
        
        // Maintain maximum of 10 alerts
        if (this.alerts.length > this.maxAlerts) {
            this.alerts = this.alerts.slice(0, this.maxAlerts);
        }
    }

    /**
     * Add multiple alerts
     */
    addAlerts(newAlerts: Alert[]): void {
        newAlerts.forEach(alert => this.addAlert(alert));
    }

    /**
     * Get all current alerts
     */
    getAlerts(): Alert[] {
        return [...this.alerts];
    }

    /**
     * Clear all alerts
     */
    clearAlerts(): void {
        this.alerts = [];
    }

    /**
     * Remove a specific alert by id
     */
    removeAlert(id: string): void {
        this.alerts = this.alerts.filter(alert => alert.id !== id);
    }

    /**
     * Update alert settings
     */
    updateSettings(newSettings: Partial<AlertSettings>): void {
        this.settings = { ...this.settings, ...newSettings };
    }

    /**
     * Get current settings
     */
    getSettings(): AlertSettings {
        return { ...this.settings };
    }

    /**
     * Play alert sound (deprecated - use NotificationManager instead)
     * @deprecated Use NotificationManager.playSound() instead
     */
    playSound(): void {
        if (this.settings.soundEnabled) {
            console.log('🔔 Alert sound played (use NotificationManager for actual sound)');
        }
    }

    /**
     * Show browser notification (deprecated - use NotificationManager instead)
     * @deprecated Use NotificationManager.showNotification() instead
     */
    showNotification(alert: Alert): void {
        if (this.settings.notificationsEnabled) {
            console.log('📢 Browser notification (use NotificationManager for actual notification):', alert.message);
        }
    }
}
