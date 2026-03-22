/**
 * Alert Manager Service
 * Manages alert queue, priorities, and user preferences
 * Prevents duplicate alerts and handles auto-cleanup
 */

export type AlertPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

export interface Alert {
    id: string;
    type: AlertType;
    priority: AlertPriority;
    title: string;
    message: string;
    timestamp: number;
    duration?: number; // Auto-dismiss after X ms
    isDismissed: boolean;
    isRead: boolean;
}

export interface AlertPreferences {
    enableSound: boolean;
    enableVibration: boolean;
    enableFlash: boolean;
    maxAlertsDisplayed: number;
    autoCleanupAfter: number; // milliseconds
}

class AlertManagerService {
    private static instance: AlertManagerService;
    private alerts: Alert[] = [];
    private preferences: AlertPreferences = {
        enableSound: true,
        enableVibration: true,
        enableFlash: true,
        maxAlertsDisplayed: 5,
        autoCleanupAfter: 30000, // 30 seconds
    };
    private listeners: Set<(alerts: Alert[]) => void> = new Set();

    private constructor() {
        // Load preferences from localStorage
        this.loadPreferences();
        // Start cleanup interval
        this.startCleanupInterval();
    }

    public static getInstance(): AlertManagerService {
        if (!AlertManagerService.instance) {
            AlertManagerService.instance = new AlertManagerService();
        }
        return AlertManagerService.instance;
    }

    /**
     * Add new alert
     */
    public addAlert(
        type: AlertType,
        priority: AlertPriority,
        title: string,
        message: string,
        duration?: number
    ): string {
        // Check for duplicate
        const isDuplicate = this.alerts.some(
            alert =>
                !alert.isDismissed &&
                alert.title === title &&
                alert.message === message &&
                Date.now() - alert.timestamp < 5000 // Within 5 seconds
        );

        if (isDuplicate) {
            return ''; // Don't add duplicate
        }

        const alert: Alert = {
            id: `alert-${Date.now()}-${Math.random()}`,
            type,
            priority,
            title,
            message,
            timestamp: Date.now(),
            duration,
            isDismissed: false,
            isRead: false,
        };

        // Add to queue (sorted by priority)
        this.alerts.push(alert);
        this.sortAlertsByPriority();

        // Limit displayed alerts
        if (this.alerts.filter(a => !a.isDismissed).length > this.preferences.maxAlertsDisplayed) {
            this.dismissOldestAlert();
        }

        // Auto-dismiss if duration specified
        if (duration) {
            setTimeout(() => {
                this.dismissAlert(alert.id);
            }, duration);
        }

        this.notifyListeners();
        return alert.id;
    }

    /**
     * Dismiss alert
     */
    public dismissAlert(id: string): void {
        const alert = this.alerts.find(a => a.id === id);
        if (alert) {
            alert.isDismissed = true;
            this.notifyListeners();
        }
    }

    /**
     * Mark alert as read
     */
    public markAsRead(id: string): void {
        const alert = this.alerts.find(a => a.id === id);
        if (alert) {
            alert.isRead = true;
            this.notifyListeners();
        }
    }

    /**
     * Dismiss all alerts
     */
    public dismissAll(): void {
        this.alerts.forEach(alert => {
            alert.isDismissed = true;
        });
        this.notifyListeners();
    }

    /**
     * Clear all alerts (remove from memory)
     */
    public clearAll(): void {
        this.alerts = [];
        this.notifyListeners();
    }

    /**
     * Get active alerts (not dismissed)
     */
    public getActiveAlerts(): Alert[] {
        return this.alerts.filter(a => !a.isDismissed);
    }

    /**
     * Get all alerts
     */
    public getAllAlerts(): Alert[] {
        return [...this.alerts];
    }

    /**
     * Get alert by ID
     */
    public getAlert(id: string): Alert | undefined {
        return this.alerts.find(a => a.id === id);
    }

    /**
     * Get unread count
     */
    public getUnreadCount(): number {
        return this.alerts.filter(a => !a.isRead && !a.isDismissed).length;
    }

    /**
     * Subscribe to alert changes
     */
    public subscribe(listener: (alerts: Alert[]) => void): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Update preferences
     */
    public updatePreferences(preferences: Partial<AlertPreferences>): void {
        this.preferences = { ...this.preferences, ...preferences };
        this.savePreferences();
    }

    /**
     * Get preferences
     */
    public getPreferences(): AlertPreferences {
        return { ...this.preferences };
    }

    /**
     * Sort alerts by priority
     */
    private sortAlertsByPriority(): void {
        const priorityOrder: Record<AlertPriority, number> = {
            CRITICAL: 4,
            HIGH: 3,
            MEDIUM: 2,
            LOW: 1,
        };

        this.alerts.sort((a, b) => {
            if (a.isDismissed !== b.isDismissed) {
                return a.isDismissed ? 1 : -1;
            }
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    /**
     * Dismiss oldest alert
     */
    private dismissOldestAlert(): void {
        const oldestActive = this.alerts.find(a => !a.isDismissed);
        if (oldestActive) {
            oldestActive.isDismissed = true;
        }
    }

    /**
     * Notify all listeners
     */
    private notifyListeners(): void {
        const activeAlerts = this.getActiveAlerts();
        this.listeners.forEach(listener => listener(activeAlerts));
    }

    /**
     * Start cleanup interval
     */
    private startCleanupInterval(): void {
        setInterval(() => {
            const now = Date.now();
            this.alerts = this.alerts.filter(
                alert => now - alert.timestamp < this.preferences.autoCleanupAfter || !alert.isDismissed
            );
            this.notifyListeners();
        }, 10000); // Check every 10 seconds
    }

    /**
     * Load preferences from localStorage
     */
    private loadPreferences(): void {
        try {
            const stored = localStorage.getItem('alertPreferences');
            if (stored) {
                this.preferences = { ...this.preferences, ...JSON.parse(stored) };
            }
        } catch (e) {
            console.warn('Failed to load alert preferences:', e);
        }
    }

    /**
     * Save preferences to localStorage
     */
    private savePreferences(): void {
        try {
            localStorage.setItem('alertPreferences', JSON.stringify(this.preferences));
        } catch (e) {
            console.warn('Failed to save alert preferences:', e);
        }
    }
}

export const alertManager = AlertManagerService.getInstance();
