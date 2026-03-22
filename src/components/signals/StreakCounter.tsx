import React, { useEffect, useState } from 'react';
import type { StreakMilestone } from '../../hooks/useStreakCounter';
import { useStreakCounter } from '../../hooks/useStreakCounter';
import './StreakCounter.scss';

interface StreakCounterProps {
    pattern: string[];
    onMilestone?: (milestone: StreakMilestone) => void;
}

export const StreakCounter: React.FC<StreakCounterProps> = ({ pattern, onMilestone }) => {
    const { currentStreak, previousStreak, streakHistory, getStreakDescription, getStreakTransition, getStreakColor } =
        useStreakCounter(pattern, onMilestone);

    const [isAnimating, setIsAnimating] = useState(false);
    const [showTransition, setShowTransition] = useState(false);

    // Trigger animation on streak count change
    useEffect(() => {
        if (currentStreak.count > 0) {
            setIsAnimating(true);
            const timer = setTimeout(() => setIsAnimating(false), 500);
            return () => clearTimeout(timer);
        }
    }, [currentStreak.count]);

    // Show transition briefly
    useEffect(() => {
        const transition = getStreakTransition();
        if (transition) {
            setShowTransition(true);
            const timer = setTimeout(() => setShowTransition(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [getStreakTransition]);

    const streakColor = getStreakColor();

    return (
        <div className={`streak-counter ${streakColor}`}>
            {/* Main Streak Display */}
            <div className='streak-main'>
                <div className='streak-icon'>
                    {currentStreak.isFibonacci && <span className='fibonacci-badge'>φ</span>}
                    {currentStreak.isSignificant && <span className='fire-icon'>🔥</span>}
                </div>

                <div className='streak-content'>
                    <div className={`streak-count ${isAnimating ? 'animating' : ''}`}>
                        {currentStreak.count > 0 ? currentStreak.count : '-'}
                    </div>
                    <div className='streak-label'>{getStreakDescription()}</div>

                    {showTransition && getStreakTransition() && (
                        <div className='streak-transition'>{getStreakTransition()}</div>
                    )}
                </div>

                <div className='streak-probability'>
                    <div className='probability-circle'>
                        <svg viewBox='0 0 36 36' className='circular-chart'>
                            <path
                                className='circle-bg'
                                d='M18 2.0845
                                   a 15.9155 15.9155 0 0 1 0 31.831
                                   a 15.9155 15.9155 0 0 1 0 -31.831'
                            />
                            <path
                                className='circle'
                                strokeDasharray={`${currentStreak.probability}, 100`}
                                d='M18 2.0845
                                   a 15.9155 15.9155 0 0 1 0 31.831
                                   a 15.9155 15.9155 0 0 1 0 -31.831'
                            />
                        </svg>
                        <div className='probability-text'>{currentStreak.probability}%</div>
                    </div>
                    <div className='probability-label'>Continue</div>
                </div>
            </div>

            {/* Streak Indicators */}
            {currentStreak.count > 0 && (
                <div className='streak-indicators'>
                    {currentStreak.isFibonacci && (
                        <div className='indicator fibonacci'>
                            <span className='indicator-icon'>φ</span>
                            <span className='indicator-text'>Fibonacci Sequence</span>
                        </div>
                    )}

                    {currentStreak.isSignificant && (
                        <div className='indicator significant'>
                            <span className='indicator-icon'>⚠️</span>
                            <span className='indicator-text'>Significant Streak</span>
                        </div>
                    )}

                    {currentStreak.count >= 10 && (
                        <div className='indicator extreme'>
                            <span className='indicator-icon'>🚨</span>
                            <span className='indicator-text'>Extreme Streak - Reversal Likely</span>
                        </div>
                    )}
                </div>
            )}

            {/* Streak History */}
            {streakHistory.length > 0 && (
                <div className='streak-history'>
                    <div className='history-label'>Recent Milestones</div>
                    <div className='history-list'>
                        {streakHistory
                            .slice(-5)
                            .reverse()
                            .map((milestone, index) => (
                                <div key={index} className='history-item'>
                                    <span className='history-count'>{milestone.count}</span>
                                    <span className='history-type'>{milestone.type}</span>
                                    <span className='history-time'>
                                        {new Date(milestone.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Previous Streak Info */}
            {previousStreak && previousStreak.count >= 3 && (
                <div className='previous-streak'>
                    <span className='previous-label'>Previous:</span>
                    <span className='previous-value'>
                        {previousStreak.count} {previousStreak.type}
                    </span>
                </div>
            )}
        </div>
    );
};
