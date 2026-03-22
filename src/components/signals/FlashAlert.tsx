import React, { useEffect, useState } from 'react';
import { animationController } from '../../utils/animation-controller';
import './FlashAlert.scss';

export type AlertType = 'success' | 'warning' | 'danger' | 'info' | 'critical';

interface FlashAlertProps {
    type: AlertType;
    message: string;
    duration?: number;
    showConfetti?: boolean;
    onComplete?: () => void;
}

export const FlashAlert: React.FC<FlashAlertProps> = ({
    type,
    message,
    duration = 2000,
    showConfetti = false,
    onComplete,
}) => {
    const [isVisible, setIsVisible] = useState(true);
    const [animationId, setAnimationId] = useState<string | null>(null);

    useEffect(() => {
        // Trigger flash animation
        const color = getFlashColor(type);
        const flashId = animationController.flash(color, 500, type === 'critical' ? 'critical' : 'high');
        setAnimationId(flashId);

        // Confetti disabled per user preference
        // if (showConfetti && type === 'success') {
        //     animationController.confetti(3000);
        // }

        // Hide after duration
        const timer = setTimeout(() => {
            setIsVisible(false);
            if (onComplete) onComplete();
        }, duration);

        return () => {
            clearTimeout(timer);
            if (animationId) {
                animationController.cancelAnimation(animationId);
            }
        };
    }, [type, duration, showConfetti, onComplete, animationId]);

    const getFlashColor = (alertType: AlertType): string => {
        switch (alertType) {
            case 'success':
                return 'rgba(16, 185, 129, 0.3)';
            case 'warning':
                return 'rgba(245, 158, 11, 0.3)';
            case 'danger':
                return 'rgba(239, 68, 68, 0.3)';
            case 'critical':
                return 'rgba(220, 38, 38, 0.5)';
            case 'info':
                return 'rgba(59, 130, 246, 0.3)';
            default:
                return 'rgba(100, 116, 139, 0.3)';
        }
    };

    const getIcon = (): string => {
        switch (type) {
            case 'success':
                return '✅';
            case 'warning':
                return '⚠️';
            case 'danger':
                return '❌';
            case 'critical':
                return '🚨';
            case 'info':
                return 'ℹ️';
            default:
                return '📢';
        }
    };

    if (!isVisible) return null;

    return (
        <div className={`flash-alert flash-alert-${type}`}>
            <div className='flash-alert-content'>
                <span className='flash-alert-icon'>{getIcon()}</span>
                <span className='flash-alert-message'>{message}</span>
            </div>
            <div className='flash-alert-progress' style={{ animationDuration: `${duration}ms` }} />
        </div>
    );
};
