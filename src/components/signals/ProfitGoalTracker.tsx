import React, { useEffect, useState } from 'react';
import { signalTradingService } from '@/services/signal-trading.service';
import './ProfitGoalTracker.scss';

export const ProfitGoalTracker: React.FC = () => {
    const [progress, setProgress] = useState(signalTradingService.getProfitGoalProgress());
    const [streak, setStreak] = useState(signalTradingService.getStreakInfo());
    const [showSettings, setShowSettings] = useState(false);
    const [goals, setGoals] = useState(signalTradingService.getProfitGoals());
    const [isStreakExpanded, setIsStreakExpanded] = useState(true);
    const [isGoalsExpanded, setIsGoalsExpanded] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(signalTradingService.getProfitGoalProgress());
            setStreak(signalTradingService.getStreakInfo());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const handleSaveGoals = () => {
        signalTradingService.setProfitGoals(goals);
        setShowSettings(false);
    };

    const getStreakEmoji = () => {
        if (streak.type === 'win') {
            if (streak.current >= 5) return '🔥';
            if (streak.current >= 3) return '⚡';
            return '✅';
        }
        if (streak.type === 'loss') {
            if (streak.current >= 5) return '❄️';
            if (streak.current >= 3) return '⚠️';
            return '❌';
        }
        return '➖';
    };

    const getStreakColor = () => {
        if (streak.type === 'win') return 'success';
        if (streak.type === 'loss') return 'danger';
        return 'neutral';
    };

    return (
        <div className='profit-goal-tracker'>
            {/* Streak Counter */}
            <div className='collapsible-section'>
                <div className='section-header' onClick={() => setIsStreakExpanded(!isStreakExpanded)}>
                    <h3>🔥 Current Streak</h3>
                    <button className='toggle-btn'>{isStreakExpanded ? '▼' : '▶'}</button>
                </div>
                {isStreakExpanded && (
                    <div className={`streak-counter ${getStreakColor()}`}>
                        <div className='streak-icon'>{getStreakEmoji()}</div>
                        <div className='streak-info'>
                            <div className='streak-label'>Current Streak</div>
                            <div className='streak-value'>
                                {streak.current}{' '}
                                {streak.type === 'win' ? 'Wins' : streak.type === 'loss' ? 'Losses' : '-'}
                            </div>
                            <div className='streak-records'>
                                Best: {streak.best} | Worst: {streak.worst}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Profit Goals */}
            <div className='collapsible-section'>
                <div className='section-header' onClick={() => setIsGoalsExpanded(!isGoalsExpanded)}>
                    <h3>🎯 Profit Goals</h3>
                    <div className='header-actions'>
                        {isGoalsExpanded && (
                            <button
                                className='settings-btn'
                                onClick={e => {
                                    e.stopPropagation();
                                    setShowSettings(!showSettings);
                                }}
                            >
                                ⚙️
                            </button>
                        )}
                        <button className='toggle-btn'>{isGoalsExpanded ? '▼' : '▶'}</button>
                    </div>
                </div>
                {isGoalsExpanded && (
                    <div className='profit-goals'>
                        {showSettings ? (
                            <div className='goals-settings'>
                                <div className='goal-input'>
                                    <label>Daily Goal ($)</label>
                                    <input
                                        type='number'
                                        value={goals.daily}
                                        onChange={e => setGoals({ ...goals, daily: Number(e.target.value) })}
                                        min='1'
                                        step='1'
                                    />
                                </div>
                                <div className='goal-input'>
                                    <label>Weekly Goal ($)</label>
                                    <input
                                        type='number'
                                        value={goals.weekly}
                                        onChange={e => setGoals({ ...goals, weekly: Number(e.target.value) })}
                                        min='1'
                                        step='5'
                                    />
                                </div>
                                <div className='goal-input'>
                                    <label>Monthly Goal ($)</label>
                                    <input
                                        type='number'
                                        value={goals.monthly}
                                        onChange={e => setGoals({ ...goals, monthly: Number(e.target.value) })}
                                        min='1'
                                        step='10'
                                    />
                                </div>
                                <button className='save-btn' onClick={handleSaveGoals}>
                                    Save Goals
                                </button>
                            </div>
                        ) : (
                            <div className='goals-progress'>
                                {/* Daily Goal */}
                                <div className='goal-item'>
                                    <div className='goal-header'>
                                        <span className='goal-label'>Today</span>
                                        <span className='goal-amount'>
                                            ${progress.daily.current.toFixed(2)} / ${progress.daily.goal.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className='goal-bar'>
                                        <div
                                            className={`goal-fill ${progress.daily.achieved ? 'achieved' : ''}`}
                                            style={{ width: `${Math.min(progress.daily.percentage, 100)}%` }}
                                        />
                                    </div>
                                    <div className='goal-percentage'>
                                        {progress.daily.percentage.toFixed(0)}%{progress.daily.achieved && ' 🎉'}
                                    </div>
                                </div>

                                {/* Weekly Goal */}
                                <div className='goal-item'>
                                    <div className='goal-header'>
                                        <span className='goal-label'>This Week</span>
                                        <span className='goal-amount'>
                                            ${progress.weekly.current.toFixed(2)} / ${progress.weekly.goal.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className='goal-bar'>
                                        <div
                                            className={`goal-fill ${progress.weekly.achieved ? 'achieved' : ''}`}
                                            style={{ width: `${Math.min(progress.weekly.percentage, 100)}%` }}
                                        />
                                    </div>
                                    <div className='goal-percentage'>
                                        {progress.weekly.percentage.toFixed(0)}%{progress.weekly.achieved && ' 🎉'}
                                    </div>
                                </div>

                                {/* Monthly Goal */}
                                <div className='goal-item'>
                                    <div className='goal-header'>
                                        <span className='goal-label'>This Month</span>
                                        <span className='goal-amount'>
                                            ${progress.monthly.current.toFixed(2)} / ${progress.monthly.goal.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className='goal-bar'>
                                        <div
                                            className={`goal-fill ${progress.monthly.achieved ? 'achieved' : ''}`}
                                            style={{ width: `${Math.min(progress.monthly.percentage, 100)}%` }}
                                        />
                                    </div>
                                    <div className='goal-percentage'>
                                        {progress.monthly.percentage.toFixed(0)}%{progress.monthly.achieved && ' 🎉'}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
