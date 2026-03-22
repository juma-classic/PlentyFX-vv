import { alertManager } from '../alert-manager.service';

describe('AlertManagerService', () => {
    beforeEach(() => {
        alertManager.clearAll();
    });

    it('adds alert to queue', () => {
        const id = alertManager.addAlert('INFO', 'MEDIUM', 'Test', 'Test message');
        expect(id).toBeDefined();
        expect(alertManager.getActiveAlerts()).toHaveLength(1);
    });

    it('prevents duplicate alerts', () => {
        alertManager.addAlert('INFO', 'MEDIUM', 'Test', 'Same message');
        alertManager.addAlert('INFO', 'MEDIUM', 'Test', 'Same message');

        expect(alertManager.getActiveAlerts()).toHaveLength(1);
    });

    it('dismisses alert', () => {
        const id = alertManager.addAlert('INFO', 'MEDIUM', 'Test', 'Message');
        alertManager.dismissAlert(id);

        expect(alertManager.getActiveAlerts()).toHaveLength(0);
    });

    it('dismisses all alerts', () => {
        alertManager.addAlert('INFO', 'MEDIUM', 'Test 1', 'Message 1');
        alertManager.addAlert('INFO', 'MEDIUM', 'Test 2', 'Message 2');

        alertManager.dismissAll();
        expect(alertManager.getActiveAlerts()).toHaveLength(0);
    });

    it('sorts by priority', () => {
        alertManager.addAlert('INFO', 'LOW', 'Low', 'Message');
        alertManager.addAlert('INFO', 'CRITICAL', 'Critical', 'Message');
        alertManager.addAlert('INFO', 'MEDIUM', 'Medium', 'Message');

        const alerts = alertManager.getActiveAlerts();
        expect(alerts[0].priority).toBe('CRITICAL');
        expect(alerts[1].priority).toBe('MEDIUM');
        expect(alerts[2].priority).toBe('LOW');
    });

    it('marks alert as read', () => {
        const id = alertManager.addAlert('INFO', 'MEDIUM', 'Test', 'Message');
        alertManager.markAsRead(id);

        const alert = alertManager.getAlert(id);
        expect(alert?.isRead).toBe(true);
    });

    it('gets unread count', () => {
        const id1 = alertManager.addAlert('INFO', 'MEDIUM', 'Test 1', 'Message 1');
        alertManager.addAlert('INFO', 'MEDIUM', 'Test 2', 'Message 2');

        expect(alertManager.getUnreadCount()).toBe(2);

        alertManager.markAsRead(id1);
        expect(alertManager.getUnreadCount()).toBe(1);
    });

    it('subscribes to changes', () => {
        const listener = jest.fn();
        const unsubscribe = alertManager.subscribe(listener);

        alertManager.addAlert('INFO', 'MEDIUM', 'Test', 'Message');
        expect(listener).toHaveBeenCalled();

        unsubscribe();
    });

    it('updates preferences', () => {
        alertManager.updatePreferences({ enableSound: false });
        const prefs = alertManager.getPreferences();
        expect(prefs.enableSound).toBe(false);
    });
});
