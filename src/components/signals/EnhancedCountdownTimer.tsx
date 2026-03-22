import React, { useEffect, useState } from 'react';
import { useCountdownTimer } from '../../hooks/useCountdownTimer';
import { animationController } from '../../utils/animation-controller';
import './EnhancedCountdownTimer.scss';

interface EnhancedCountdownTimerProps {
    duration: number;
    onComplete?: () => void;
    showProgress?: boolean;
    size?: 'small' | 'medium' | 'large';
    autoStart?: boolean;
    showContinueButton?: boolean;
    consecutiveCount?: number;
    patternType?: string;
}

export const EnhancedCountdownTimer: React.FC<EnhancedCountdownTimerProps> = ({
    duration = 30,
    onComplete,
    showProgress = true,
    size = 'large',
    autoStart = true,
    showContinueButton = true,
    consecutiveCount = 0,
    patternType = 'OVER',
}) => {
    const { ticksRemaining, isActive, isExpired, progress, start, pause, resume, cancel } = useCountdownTimer(
        duration,
        {
            onExpire: () => {
                if (onComplete) onComplete();
            },
            onWarning: ticks => {
                // Enhanced flash animation with different intensities
                const color =
                    ticks === 5
                        ? 'rgba(59, 130, 246, 0.3)'
                        : ticks === 3
                          ? 'rgba(245, 158, 11, 0.4)'
                          : ticks === 2
                            ? 'rgba(239, 68, 68, 0.5)'
                            : 'rgba(220, 38, 38, 0.7)';
                animationController.flash(color, 400, 'high');
            },
        }
    );

    const [showPulse, setShowPulse] = useState(false);

    // Auto-start if enabled
    useEffect(() => {
        if (autoStart) {
            start();
        }
    }, [autoStart, start]);

    // Pulse animation for low countdown
    useEffect(() => {
        setShowPulse(ticksRemaining <= 5 && isActive);
    }, [ticksRemaining, isActive]);

    const getColorClass = (): string => {
        if (isExpired) return 'expired';
        if (ticksRemaining <= 1) return 'critical';
        if (ticksRemaining <= 3) return 'danger';
        if (ticksRemaining <= 5) return 'warning';
        return 'normal';
    };

    const getProgressColor = (): string => {
        if (ticksRemaining <= 1) return '#dc2626';
        if (ticksRemaining <= 3) return '#ef4444';
        if (ticksRemaining <= 5) return '#f59e0b';
        return '#10b981';
    };

    const circumference = 2 * Math.PI * 54;
    const strokeDasharray = `${(progress / 100) * circumference} ${circumference}`;

    return (
        <div className={`enhanced-countdown-timer ${getColorClass()} ${size} ${showPulse ? 'pulse' : ''}`}>
            {/* Consecutive Pattern Info */}
            {consecutiveCount > 0 && (
                <div className='consecutive-info'>
                    <span className='consecutive-icon'>🔥</span>
                    <span className='consecutive-text'>
                        {consecutiveCount} consecutive {patternType}
                    </span>
                </div>
            )}

            {/* Main Timer Display */}
            <div className='timer-main'>
                {showProgress && (
                    <div className='timer-ring-container'>
                        <svg className='timer-ring' viewBox='0 0 120 120'>
                            {/* Background circle */}
                            <circle
                                className='ring-background'
                                cx='60'
                                cy='60'
                                r='54'
                                fill='none'
                                stroke='rgba(100, 116, 139, 0.2)'
                                strokeWidth='6'
                            />

                            {/* Progress circle */}
                            <circle
                                className='ring-progress'
                                cx='60'
                                cy='60'
                                r='54'
                                fill='none'
                                stroke={getProgressColor()}
                                strokeWidth='6'
                                strokeLinecap='round'
                                strokeDasharray={strokeDasharray}
                                transform='rotate(-90 60 60)'
                                style={{
                                    transition: 'stroke-dasharray 0.5s ease, stroke 0.3s ease',
                                }}
                            />

                            {/* Glow effect for critical states */}
                            {ticksRemaining <= 5 && isActive && (
                                <circle
                                    className='ring-glow'
                                    cx='60'
                                    cy='60'
                                    r='54'
                                    fill='none'
                                    stroke={getProgressColor()}
                                    strokeWidth='2'
                                    strokeLinecap='round'
                                    strokeDasharray={strokeDasharray}
                                    transform='rotate(-90 60 60)'
                                    opacity='0.6'
                                />
                            )}
                        </svg>

                        {/* Center Content */}
                        <div className='timer-center'>
                            <div className='timer-number'>{ticksRemaining}</div>
                            <div className='timer-label'>
                                {isExpired ? 'EXPIRED' : ticksRemaining === 1 ? 'second' : 'seconds'}
                            </div>

                            {/* Progress percentage */}
                            <div className='timer-percentage'>{Math.round(progress)}%</div>
                        </div>
                    </div>
                )}

                {/* Status Message */}
                <div className='timer-status'>
                    {isExpired ? (
                        <span className='status-expired'>⏰ Time&apos;s up!</span>
                    ) : isActive ? (
                        <span className='status-active'>⏳ {ticksRemaining <= 5 ? 'Hurry up!' : 'Time remaining'}</span>
                    ) : (
                        <span className='status-paused'>⏸️ Paused</span>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className='timer-actions'>
                {!isActive && !isExpired && (
                    <button className='timer-btn start-btn' onClick={start}>
                        <span className='btn-icon'>▶️</span>
                        <span className='btn-text'>Start Timer</span>
                    </button>
                )}

                {isActive && (
                    <button className='timer-btn pause-btn' onClick={pause}>
                        <span className='btn-icon'>⏸️</span>
                        <span className='btn-text'>Pause</span>
                    </button>
                )}

                {!isActive && !isExpired && ticksRemaining < duration && (
                    <button className='timer-btn resume-btn' onClick={resume}>
                        <span className='btn-icon'>▶️</span>
                        <span className='btn-text'>Resume</span>
                    </button>
                )}

                {showContinueButton && (isActive || (!isActive && ticksRemaining < duration)) && (
                    <button
                        className='timer-btn continue-btn'
                        onClick={() => {
                            cancel();
                            if (onComplete) onComplete();
                        }}
                    >
                        <span className='btn-icon'>🚀</span>
                        <span className='btn-text'>CONTINUE</span>
                    </button>
                )}

                {(isActive || (!isActive && ticksRemaining < duration)) && !showContinueButton && (
                    <button className='timer-btn cancel-btn' onClick={cancel}>
                        <span className='btn-icon'>❌</span>
                        <span className='btn-text'>Cancel</span>
                    </button>
                )}
            </div>

            {/* Progress Bar Alternative */}
            {!showProgress && (
                <div className='timer-progress-bar'>
                    <div
                        className='progress-fill'
                        style={{
                            width: `${progress}%`,
                            backgroundColor: getProgressColor(),
                        }}
                    />
                </div>
            )}
        </div>
    );
};
