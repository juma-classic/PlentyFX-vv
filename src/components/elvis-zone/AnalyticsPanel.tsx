import React from 'react';
import './AnalyticsPanel.scss';

interface DigitFrequency {
    digit: number;
    count: number;
    percentage: number;
}

interface StreakData {
    digit: number;
    count: number;
    isActive: boolean;
}

interface TickData {
    quote: number;
    epoch: number;
    lastDigit: number;
    timestamp: string;
}

interface AnalyticsPanelProps {
    digitFrequencies: DigitFrequency[];
    matchesProbability: number;
    differsProbability: number;
    currentStreak: StreakData;
    totalTicks: number;
    lastTick?: TickData;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
    digitFrequencies,
    matchesProbability,
    differsProbability,
    currentStreak,
    totalTicks,
    lastTick,
}) => {
    const getDigitColor = (digit: number): string => {
        const colors = [
            '#ef4444',
            '#f97316',
            '#eab308',
            '#22c55e',
            '#06b6d4',
            '#3b82f6',
            '#8b5cf6',
            '#ec4899',
            '#f43f5e',
            '#10b981',
        ];
        return colors[digit];
    };

    const getProbabilityStatus = (probability: number): 'high' | 'medium' | 'low' => {
        if (probability > 15) return 'high';
        if (probability > 8) return 'medium';
        return 'low';
    };

    const getHotDigits = (): DigitFrequency[] => {
        return digitFrequencies
            .filter(f => f.percentage > 12)
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 3);
    };

    const getColdDigits = (): DigitFrequency[] => {
        return digitFrequencies
            .filter(f => f.percentage < 8 && totalTicks > 20)
            .sort((a, b) => a.percentage - b.percentage)
            .slice(0, 3);
    };

    // const getConsecutiveRepeats = (): number => {
    //     if (!digitFrequencies.length || !lastTick) return 0;
    //
    //     // This would need the actual tick history to calculate properly
    //     // For now, we'll use the current streak count
    //     return currentStreak.isActive ? currentStreak.count : 0;
    // };

    const matchesStatus = getProbabilityStatus(matchesProbability);
    const differsStatus = getProbabilityStatus(differsProbability);
    const hotDigits = getHotDigits();
    const coldDigits = getColdDigits();

    return (
        <div className='analytics-panel'>
            <div className='panel-header'>
                <h3>🧮 Analytics Dashboard</h3>
                <div className='tick-counter'>{totalTicks}/50 ticks</div>
            </div>

            {/* Probability Analysis */}
            <div className='probability-section'>
                <h4>Probability Analysis</h4>

                <div className='probability-cards'>
                    <div className={`probability-card matches ${matchesStatus}`}>
                        <div className='card-header'>
                            <span className='card-title'>MATCHES</span>
                            <span className='card-icon'>🎯</span>
                        </div>
                        <div className='probability-value'>{matchesProbability.toFixed(1)}%</div>
                        <div className='probability-description'>Next digit same as last</div>
                    </div>

                    <div className={`probability-card differs ${differsStatus}`}>
                        <div className='card-header'>
                            <span className='card-title'>DIFFERS</span>
                            <span className='card-icon'>🔄</span>
                        </div>
                        <div className='probability-value'>{differsProbability.toFixed(1)}%</div>
                        <div className='probability-description'>Next digit different from last</div>
                    </div>
                </div>
            </div>

            {/* Current Status */}
            <div className='status-section'>
                <h4>Current Status</h4>

                <div className='status-items'>
                    <div className='status-item'>
                        <span className='status-label'>Last Digit:</span>
                        <span
                            className='status-value digit'
                            style={{
                                color: lastTick ? getDigitColor(lastTick.lastDigit) : '#9ca3af',
                            }}
                        >
                            {lastTick?.lastDigit ?? '—'}
                        </span>
                    </div>

                    <div className='status-item'>
                        <span className='status-label'>Current Streak:</span>
                        <span className='status-value'>
                            {currentStreak.isActive && currentStreak.count > 1 ? (
                                <>
                                    <span style={{ color: getDigitColor(currentStreak.digit) }}>
                                        {currentStreak.digit}
                                    </span>
                                    <span className='streak-count'>×{currentStreak.count}</span>
                                </>
                            ) : (
                                'None'
                            )}
                        </span>
                    </div>

                    <div className='status-item'>
                        <span className='status-label'>Buffer Status:</span>
                        <span className='status-value'>{Math.round((totalTicks / 50) * 100)}% Full</span>
                    </div>
                </div>
            </div>

            {/* Hot & Cold Digits */}
            {(hotDigits.length > 0 || coldDigits.length > 0) && (
                <div className='digits-section'>
                    <h4>Digit Analysis</h4>

                    {hotDigits.length > 0 && (
                        <div className='digit-group hot'>
                            <div className='group-header'>
                                <span className='group-title'>🔥 Hot Digits</span>
                                <span className='group-subtitle'>&gt;12%</span>
                            </div>
                            <div className='digit-list'>
                                {hotDigits.map(digit => (
                                    <div key={digit.digit} className='digit-item'>
                                        <span className='digit-number' style={{ color: getDigitColor(digit.digit) }}>
                                            {digit.digit}
                                        </span>
                                        <span className='digit-percentage'>{digit.percentage.toFixed(1)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {coldDigits.length > 0 && (
                        <div className='digit-group cold'>
                            <div className='group-header'>
                                <span className='group-title'>❄️ Cold Digits</span>
                                <span className='group-subtitle'>&lt;8%</span>
                            </div>
                            <div className='digit-list'>
                                {coldDigits.map(digit => (
                                    <div key={digit.digit} className='digit-item'>
                                        <span className='digit-number' style={{ color: getDigitColor(digit.digit) }}>
                                            {digit.digit}
                                        </span>
                                        <span className='digit-percentage'>{digit.percentage.toFixed(1)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Quick Stats */}
            <div className='stats-section'>
                <h4>Quick Stats</h4>

                <div className='stats-grid'>
                    <div className='stat-item'>
                        <div className='stat-value'>{digitFrequencies.filter(f => f.percentage > 10).length}</div>
                        <div className='stat-label'>Above Average</div>
                    </div>

                    <div className='stat-item'>
                        <div className='stat-value'>{digitFrequencies.filter(f => f.percentage < 10).length}</div>
                        <div className='stat-label'>Below Average</div>
                    </div>

                    <div className='stat-item'>
                        <div className='stat-value'>{currentStreak.isActive ? currentStreak.count : 0}</div>
                        <div className='stat-label'>Streak Length</div>
                    </div>

                    <div className='stat-item'>
                        <div className='stat-value'>
                            {totalTicks > 0 ? Math.max(...digitFrequencies.map(f => f.percentage)).toFixed(1) : '0.0'}%
                        </div>
                        <div className='stat-label'>Highest %</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
