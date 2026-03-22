import React from 'react';
import './StreakHeatmap.scss';

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

interface StreakHeatmapProps {
    currentStreak: StreakData;
    streakHistory: StreakData[];
    digitFrequencies: DigitFrequency[];
}

export const StreakHeatmap: React.FC<StreakHeatmapProps> = ({ currentStreak, streakHistory, digitFrequencies }) => {
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

    // const getStreakIntensity = (count: number): number => {
    //     // Normalize streak count to 0-1 range for opacity
    //     return Math.min(count / 10, 1);
    // };

    const getStreakSize = (count: number): 'small' | 'medium' | 'large' => {
        if (count >= 5) return 'large';
        if (count >= 3) return 'medium';
        return 'small';
    };

    // Create a grid representation of digit frequencies
    const createDigitGrid = () => {
        const grid = [];
        for (let i = 0; i < 10; i++) {
            const frequency = digitFrequencies.find(f => f.digit === i);
            const isCurrentStreak = currentStreak.isActive && currentStreak.digit === i;
            const hasHistoricalStreak = streakHistory.some(s => s.digit === i && s.count > 2);

            grid.push({
                digit: i,
                frequency: frequency?.percentage || 0,
                count: frequency?.count || 0,
                isCurrentStreak,
                hasHistoricalStreak,
                currentStreakCount: isCurrentStreak ? currentStreak.count : 0,
            });
        }
        return grid;
    };

    const digitGrid = createDigitGrid();
    const maxFrequency = Math.max(...digitFrequencies.map(f => f.percentage), 10);

    return (
        <div className='streak-heatmap'>
            <div className='heatmap-header'>
                <h3>🔥 Streak & Pattern Heatmap</h3>
                <div className='heatmap-stats'>
                    <div className='stat'>
                        <span className='stat-label'>Active Streak:</span>
                        <span className='stat-value'>
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
                </div>
            </div>

            <div className='heatmap-container'>
                {digitGrid.length === 0 ? (
                    <div className='empty-heatmap'>
                        <div className='empty-icon'>🔥</div>
                        <div className='empty-text'>Building streak patterns...</div>
                    </div>
                ) : (
                    <div className='digit-heatmap'>
                        {digitGrid.map(item => {
                            const intensity = item.frequency / maxFrequency;
                            const digitColor = getDigitColor(item.digit);

                            return (
                                <div
                                    key={item.digit}
                                    className={`heatmap-cell ${item.isCurrentStreak ? 'current-streak' : ''} ${item.hasHistoricalStreak ? 'has-streak' : ''}`}
                                    style={{
                                        backgroundColor: `${digitColor}${Math.floor(intensity * 255)
                                            .toString(16)
                                            .padStart(2, '0')}`,
                                        borderColor: item.isCurrentStreak ? digitColor : 'rgba(255, 255, 255, 0.2)',
                                    }}
                                >
                                    <div className='cell-content'>
                                        <div
                                            className='digit-number'
                                            style={{ color: intensity > 0.5 ? '#ffffff' : digitColor }}
                                        >
                                            {item.digit}
                                        </div>

                                        <div className='cell-stats'>
                                            <div className='frequency'>{item.frequency.toFixed(1)}%</div>
                                            <div className='count'>({item.count})</div>
                                        </div>

                                        {item.isCurrentStreak && item.currentStreakCount > 1 && (
                                            <div className='streak-indicator'>
                                                <div className='streak-flame'>🔥</div>
                                                <div className='streak-count'>×{item.currentStreakCount}</div>
                                            </div>
                                        )}

                                        {item.hasHistoricalStreak && !item.isCurrentStreak && (
                                            <div className='historical-indicator'>⚡</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Streak History */}
            {streakHistory.length > 0 && (
                <div className='streak-history'>
                    <h4>Recent Streaks</h4>
                    <div className='history-list'>
                        {streakHistory.slice(0, 5).map((streak, index) => (
                            <div key={index} className='history-item'>
                                <span className='history-digit' style={{ color: getDigitColor(streak.digit) }}>
                                    {streak.digit}
                                </span>
                                <span className='history-count'>×{streak.count}</span>
                                <div className={`streak-size-indicator ${getStreakSize(streak.count)}`}>
                                    {streak.count >= 5 ? '🔥' : streak.count >= 3 ? '⚡' : '•'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className='heatmap-legend'>
                <div className='legend-title'>Legend:</div>
                <div className='legend-items'>
                    <div className='legend-item'>
                        <div className='legend-color low'></div>
                        <span>Low Frequency</span>
                    </div>
                    <div className='legend-item'>
                        <div className='legend-color medium'></div>
                        <span>Medium</span>
                    </div>
                    <div className='legend-item'>
                        <div className='legend-color high'></div>
                        <span>High Frequency</span>
                    </div>
                    <div className='legend-item'>
                        <div className='legend-color streak'></div>
                        <span>Active Streak</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
