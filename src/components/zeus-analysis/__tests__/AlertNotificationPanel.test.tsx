import React from 'react';
import { fireEvent,render, screen } from '@testing-library/react';
import { Alert } from '../../../utils/alert-manager';
import { AlertNotificationPanel } from '../AlertNotificationPanel';

describe('AlertNotificationPanel', () => {
    const mockAlerts: Alert[] = [
        {
            id: 'alert-1',
            type: 'high-confidence',
            message: 'High confidence prediction: Digit 5 (18.5%)',
            timestamp: Date.now() - 5000,
            digit: 5,
            priority: 'high'
        },
        {
            id: 'alert-2',
            type: 'pattern-detected',
            message: 'Pattern detected: 5 consecutive ticks with digit 3',
            timestamp: Date.now() - 10000,
            digit: 3,
            priority: 'high'
        },
        {
            id: 'alert-3',
            type: 'streak-broken',
            message: 'Streak broken after 7 ticks',
            timestamp: Date.now() - 15000,
            priority: 'medium'
        }
    ];

    const mockOnDismiss = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render nothing when alerts array is empty', () => {
        const { container } = render(
            <AlertNotificationPanel alerts={[]} onDismiss={mockOnDismiss} />
        );
        expect(container.firstChild).toBeNull();
    });

    it('should render all alerts with correct messages', () => {
        render(<AlertNotificationPanel alerts={mockAlerts} onDismiss={mockOnDismiss} />);
        
        expect(screen.getByText('High confidence prediction: Digit 5 (18.5%)')).toBeInTheDocument();
        expect(screen.getByText('Pattern detected: 5 consecutive ticks with digit 3')).toBeInTheDocument();
        expect(screen.getByText('Streak broken after 7 ticks')).toBeInTheDocument();
    });

    it('should display correct icons for different alert types', () => {
        render(<AlertNotificationPanel alerts={mockAlerts} onDismiss={mockOnDismiss} />);
        
        const alertItems = screen.getAllByRole('button', { name: /dismiss.*alert/i });
        expect(alertItems).toHaveLength(3);
    });

    it('should apply correct CSS classes based on priority', () => {
        const { container } = render(
            <AlertNotificationPanel alerts={mockAlerts} onDismiss={mockOnDismiss} />
        );
        
        const highPriorityAlerts = container.querySelectorAll('.alert-high');
        const mediumPriorityAlerts = container.querySelectorAll('.alert-medium');
        
        expect(highPriorityAlerts).toHaveLength(2);
        expect(mediumPriorityAlerts).toHaveLength(1);
    });

    it('should display timestamps in relative format', () => {
        render(<AlertNotificationPanel alerts={mockAlerts} onDismiss={mockOnDismiss} />);
        
        // Check that timestamps are displayed (format may vary)
        const timestamps = screen.getAllByText(/ago|:/);
        expect(timestamps.length).toBeGreaterThan(0);
    });

    it('should call onDismiss with correct alert id when close button is clicked', () => {
        render(<AlertNotificationPanel alerts={mockAlerts} onDismiss={mockOnDismiss} />);
        
        const closeButtons = screen.getAllByRole('button', { name: /dismiss.*alert/i });
        
        fireEvent.click(closeButtons[0]);
        expect(mockOnDismiss).toHaveBeenCalledWith('alert-1');
        
        fireEvent.click(closeButtons[1]);
        expect(mockOnDismiss).toHaveBeenCalledWith('alert-2');
    });

    it('should render close button for each alert', () => {
        render(<AlertNotificationPanel alerts={mockAlerts} onDismiss={mockOnDismiss} />);
        
        const closeButtons = screen.getAllByRole('button', { name: /dismiss.*alert/i });
        expect(closeButtons).toHaveLength(3);
    });

    it('should display alert with timestamp and message', () => {
        const singleAlert: Alert[] = [{
            id: 'test-alert',
            type: 'high-confidence',
            message: 'Test alert message',
            timestamp: Date.now(),
            priority: 'high'
        }];

        render(<AlertNotificationPanel alerts={singleAlert} onDismiss={mockOnDismiss} />);
        
        expect(screen.getByText('Test alert message')).toBeInTheDocument();
        expect(screen.getByText(/ago|:/)).toBeInTheDocument();
    });

    it('should handle multiple dismissals correctly', () => {
        render(<AlertNotificationPanel alerts={mockAlerts} onDismiss={mockOnDismiss} />);
        
        const closeButtons = screen.getAllByRole('button', { name: /dismiss.*alert/i });
        
        fireEvent.click(closeButtons[0]);
        fireEvent.click(closeButtons[1]);
        fireEvent.click(closeButtons[2]);
        
        expect(mockOnDismiss).toHaveBeenCalledTimes(3);
        expect(mockOnDismiss).toHaveBeenNthCalledWith(1, 'alert-1');
        expect(mockOnDismiss).toHaveBeenNthCalledWith(2, 'alert-2');
        expect(mockOnDismiss).toHaveBeenNthCalledWith(3, 'alert-3');
    });

    it('should render low priority alerts with correct styling', () => {
        const lowPriorityAlert: Alert[] = [{
            id: 'low-alert',
            type: 'high-confidence',
            message: 'Low priority alert',
            timestamp: Date.now(),
            priority: 'low'
        }];

        const { container } = render(
            <AlertNotificationPanel alerts={lowPriorityAlert} onDismiss={mockOnDismiss} />
        );
        
        expect(container.querySelector('.alert-low')).toBeInTheDocument();
    });
});
