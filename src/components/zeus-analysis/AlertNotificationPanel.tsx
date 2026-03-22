import React, { useEffect, useRef } from 'react';
import { Alert } from '../../utils/alert-manager';
import './AlertNotificationPanel.scss';

interface AlertNotificationPanelProps {
    alerts: Alert[];
    onDismiss: (alertId: string) => void;
}

// Maximum number of visible notifications at once
const MAX_VISIBLE_ALERTS = 1;

// Auto-dismiss timeout in milliseconds
const AUTO_DISMISS_TIMEOUT = 8000; // 8 seconds

/**
 * AlertNotificationPanel Component
 * Displays alerts in a fixed panel at the top-right of the screen
 * with slide-in animations and dismissal functionality
 */
export const AlertNotificationPanel: React.FC<AlertNotificationPanelProps> = ({ alerts, onDismiss }) => {
    const dismissTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

    // Auto-dismiss alerts after timeout
    useEffect(() => {
        alerts.forEach(alert => {
            // Skip if timer already exists for this alert
            if (dismissTimersRef.current.has(alert.id)) {
                return;
            }

            // Don't auto-dismiss high priority alerts
            if (alert.priority === 'high') {
                return;
            }

            // Set auto-dismiss timer
            const timer = setTimeout(() => {
                onDismiss(alert.id);
                dismissTimersRef.current.delete(alert.id);
            }, AUTO_DISMISS_TIMEOUT);

            dismissTimersRef.current.set(alert.id, timer);
        });

        // Cleanup timers for dismissed alerts
        return () => {
            const currentAlertIds = new Set(alerts.map(a => a.id));
            dismissTimersRef.current.forEach((timer, alertId) => {
                if (!currentAlertIds.has(alertId)) {
                    clearTimeout(timer);
                    dismissTimersRef.current.delete(alertId);
                }
            });
        };
    }, [alerts, onDismiss]);

    // Cleanup all timers on unmount
    useEffect(() => {
        return () => {
            dismissTimersRef.current.forEach(timer => clearTimeout(timer));
            dismissTimersRef.current.clear();
        };
    }, []);

    if (alerts.length === 0) {
        return null;
    }

    // Show only the most recent alerts
    const visibleAlerts = alerts.slice(-MAX_VISIBLE_ALERTS).reverse();

    const getAlertIcon = (type: Alert['type']): string => {
        switch (type) {
            case 'high-confidence':
                return '🎯';
            case 'pattern-detected':
                return '🔍';
            case 'streak-broken':
                return '⚡';
            default:
                return '📢';
        }
    };

    const getAlertClass = (priority: Alert['priority']): string => {
        switch (priority) {
            case 'high':
                return 'alert-high';
            case 'medium':
                return 'alert-medium';
            case 'low':
                return 'alert-low';
            default:
                return 'alert-medium';
        }
    };

    const getAlertTypeLabel = (type: Alert['type']): string => {
        switch (type) {
            case 'high-confidence':
                return 'High confidence prediction';
            case 'pattern-detected':
                return 'Pattern detected';
            case 'streak-broken':
                return 'Streak broken';
            default:
                return 'Alert';
        }
    };

    const formatTimestamp = (timestamp: number): string => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);

        if (diffSecs < 60) {
            return `${diffSecs}s ago`;
        } else if (diffMins < 60) {
            return `${diffMins}m ago`;
        } else {
            return date.toLocaleTimeString();
        }
    };

    const hiddenCount = alerts.length - visibleAlerts.length;

    return (
        <div
            className='alert-notification-panel'
            role='region'
            aria-label='Alert notifications'
            aria-live='polite'
            aria-atomic='false'
        >
            {hiddenCount > 0 && (
                <div className='alert-overflow-indicator' role='status'>
                    +{hiddenCount} more alert{hiddenCount !== 1 ? 's' : ''}
                </div>
            )}
            {visibleAlerts.map(alert => (
                <div
                    key={alert.id}
                    className={`alert-item ${getAlertClass(alert.priority)}`}
                    role='alert'
                    aria-labelledby={`alert-message-${alert.id}`}
                    aria-describedby={`alert-time-${alert.id}`}
                >
                    <div className='alert-header'>
                        <span className='alert-icon' aria-label={getAlertTypeLabel(alert.type)}>
                            {getAlertIcon(alert.type)}
                        </span>
                        <span
                            className='alert-timestamp'
                            id={`alert-time-${alert.id}`}
                            aria-label={`Alert received ${formatTimestamp(alert.timestamp)}`}
                        >
                            {formatTimestamp(alert.timestamp)}
                        </span>
                        <button
                            className='alert-close'
                            onClick={() => onDismiss(alert.id)}
                            aria-label={`Dismiss ${getAlertTypeLabel(alert.type)} alert`}
                            title='Dismiss alert'
                        >
                            ×
                        </button>
                    </div>
                    <div className='alert-message' id={`alert-message-${alert.id}`}>
                        {alert.message}
                    </div>
                </div>
            ))}
        </div>
    );
};
