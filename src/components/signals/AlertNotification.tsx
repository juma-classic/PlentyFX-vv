import React, { useEffect, useState } from 'react';
import type { Alert } from '../../services/alert-manager.service';
import { alertManager } from '../../services/alert-manager.service';
import { animationController } from '../../utils/animation-controller';
import './AlertNotification.scss';

export const AlertNotification: React.FC = () => {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        // Subscribe to alert changes
        const unsubscribe = alertManager.subscribe(activeAlerts => {
            setAlerts(activeAlerts);

            // Trigger effects for new alerts
            if (activeAlerts.length > 0) {
                const latest = activeAlerts[0];
                const preferences = alertManager.getPreferences();

                // Flash animation
                if (preferences.enableFlash && latest.priority === 'CRITICAL') {
                    animationController.flash('rgba(220, 38, 38, 0.3)', 500, 'critical');
                }

                // Vibration
                if (preferences.enableVibration && 'vibrate' in navigator) {
                    if (latest.priority === 'CRITICAL') {
                        navigator.vibrate([200, 100, 200]);
                    } else if (latest.priority === 'HIGH') {
                        navigator.vibrate(200);
                    }
                }
            }
        });

        return unsubscribe;
    }, []);

    const getIcon = (alert: Alert): string => {
        switch (alert.type) {
            case 'SUCCESS':
                return '✅';
            case 'WARNING':
                return '⚠️';
            case 'ERROR':
                return '❌';
            case 'INFO':
                return 'ℹ️';
            default:
                return '📢';
        }
    };

    const handleDismiss = (id: string) => {
        alertManager.dismissAlert(id);
    };

    const handleDismissAll = () => {
        alertManager.dismissAll();
    };

    return (
        <>
            {/* Toast Notifications */}
            <div className='alert-notifications'>
                {alerts.slice(0, 5).map(alert => (
                    <div
                        key={alert.id}
                        className={`alert-toast alert-${alert.type.toLowerCase()} priority-${alert.priority.toLowerCase()}`}
                    >
                        <div className='toast-icon'>{getIcon(alert)}</div>
                        <div className='toast-content'>
                            <div className='toast-title'>{alert.title}</div>
                            <div className='toast-message'>{alert.message}</div>
                        </div>
                        <button className='toast-dismiss' onClick={() => handleDismiss(alert.id)}>
                            ×
                        </button>
                    </div>
                ))}
            </div>

            {/* Alert Badge */}
            {alerts.length > 0 && (
                <button className='alert-badge' onClick={() => setShowHistory(!showHistory)}>
                    🔔 <span className='badge-count'>{alerts.length}</span>
                </button>
            )}

            {/* Alert History Panel */}
            {showHistory && (
                <div className='alert-history-panel'>
                    <div className='history-header'>
                        <h3>Alerts</h3>
                        <button onClick={handleDismissAll}>Dismiss All</button>
                        <button onClick={() => setShowHistory(false)}>×</button>
                    </div>
                    <div className='history-list'>
                        {alertManager.getAllAlerts().map(alert => (
                            <div key={alert.id} className={`history-item ${alert.isDismissed ? 'dismissed' : ''}`}>
                                <span className='history-icon'>{getIcon(alert)}</span>
                                <div className='history-content'>
                                    <div className='history-title'>{alert.title}</div>
                                    <div className='history-message'>{alert.message}</div>
                                    <div className='history-time'>{new Date(alert.timestamp).toLocaleTimeString()}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};
