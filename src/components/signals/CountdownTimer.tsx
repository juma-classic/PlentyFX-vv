import React, { useEffect } from 'react';
import { useCountdownTimer } from '../../hooks/useCountdownTimer';
import { animationController } from '../../utils/animation-controller';
import './CountdownTimer.scss';

interface CountdownTimerProps {
    initialTicks: number;
    onExpire?: () => void;
    autoStart?: boolean;
    showProgress?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
    initialTicks,
    onExpire,
    autoStart = false,
    showProgress = true,
}) => {
    const { ticksRemaining, isActive, isExpired, progress, start, pause, resume, cancel } = useCountdownTimer(
        initialTicks,
        {
            onExpire: () => {
                if (onExpire) onExpire();
            },
            onWarning: ticks => {
                // Flash animation at 3, 2, 1
                const color =
                    ticks === 3
                        ? 'rgba(245, 158, 11, 0.3)'
                        : ticks === 2
                          ? 'rgba(239, 68, 68, 0.3)'
                          : 'rgba(220, 38, 38, 0.5)';
                animationController.flash(color, 300, 'high');
            },
        }
    );

    // Auto-start if enabled
    useEffect(() => {
        if (autoStart) {
            start();
        }
    }, [autoStart, start]);

    const getColorClass = (): string => {
        if (isExpired) return 'expired';
        if (ticksRemaining <= 1) return 'critical';
        if (ticksRemaining <= 2) return 'danger';
        if (ticksRemaining <= 3) return 'warning';
        return 'normal';
    };

    const getStatusText = (): string => {
        if (isExpired) return 'EXPIRED';
        if (!isActive) return 'PAUSED';
        return 'ACTIVE';
    };

    const getIcon = (): string => {
        if (isExpired) return '⏱️';
        if (ticksRemaining <= 3) return '⚠️';
        return '⏳';
    };

    return (
        <div className={`countdown-timer ${getColorClass()}`}>
            {/* Header */}
            <div className='countdown-header'>
                <span className='countdown-icon'>{getIcon()}</span>
                <span className='countdown-label'>Entry Window</span>
                <span className={`countdown-status ${getStatusText().toLowerCase()}`}>{getStatusText()}</span>
            </div>

            {/* Main Display */}
            <div className='countdown-main'>
                {/* Progress Ring */}
                {showProgress && (
                    <div className='countdown-ring'>
                        <svg viewBox='0 0 120 120' className='ring-svg'>
                            {/* Background circle */}
                            <circle
                                className='ring-bg'
                                cx='60'
                                cy='60'
                                r='54'
                                fill='none'
                                stroke='rgba(100, 116, 139, 0.2)'
                                strokeWidth='8'
                            />

                            {/* Progress circle */}
                            <circle
                                className='ring-progress'
                                cx='60'
                                cy='60'
                                r='54'
                                fill='none'
                                strokeWidth='8'
                                strokeLinecap='round'
                                strokeDasharray={`${(progress / 100) * 339} 339`}
                                transform='rotate(-90 60 60)'
                            />
                        </svg>

                        {/* Center content */}
                        <div className='ring-content'>
                            <div className='ticks-remaining'>{ticksRemaining}</div>
                            <div className='ticks-label'>{ticksRemaining === 1 ? 'tick' : 'ticks'}</div>
                        </div>
                    </div>
                )}

                {/* Message */}
                <div className='countdown-message'>
                    {isExpired ? (
                        <span className='message-expired'>Window closed</span>
                    ) : (
                        <span className='message-active'>
                            Window closes in <strong>{ticksRemaining}</strong> {ticksRemaining === 1 ? 'tick' : 'ticks'}
                        </span>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className='countdown-controls'>
                {!isActive && !isExpired && (
                    <button className='control-btn start' onClick={start}>
                        ▶️ Start
                    </button>
                )}

                {isActive && (
                    <button className='control-btn pause' onClick={pause}>
                        ⏸️ Pause
                    </button>
                )}

                {!isActive && !isExpired && ticksRemaining < initialTicks && (
                    <button className='control-btn resume' onClick={resume}>
                        ▶️ Resume
                    </button>
                )}

                {(isActive || (!isActive && ticksRemaining < initialTicks)) && (
                    <button className='control-btn cancel' onClick={cancel}>
                        ❌ Cancel
                    </button>
                )}
            </div>

            {/* Progress Bar (alternative to ring) */}
            {!showProgress && (
                <div className='countdown-progress-bar'>
                    <div className='progress-fill' style={{ width: `${progress}%` }} />
                </div>
            )}
        </div>
    );
};
