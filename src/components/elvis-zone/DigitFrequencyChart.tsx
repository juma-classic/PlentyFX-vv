import React from 'react';
import './DigitFrequencyChart.scss';

interface DigitFrequency {
    digit: number;
    count: number;
    percentage: number;
}

interface DigitFrequencyChartProps {
    frequencies: DigitFrequency[];
    currentDigit?: number;
}

export const DigitFrequencyChart: React.FC<DigitFrequencyChartProps> = ({ frequencies, currentDigit }) => {
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

    const getBarHeight = (percentage: number): number => {
        const maxPercentage = Math.max(...frequencies.map(f => f.percentage), 10);
        return Math.max((percentage / maxPercentage) * 100, 2);
    };

    const getDigitStatus = (frequency: DigitFrequency): 'hot' | 'cold' | 'normal' => {
        if (frequency.percentage > 15) return 'hot';
        if (frequency.percentage < 5 && frequencies.length > 20) return 'cold';
        return 'normal';
    };

    const averagePercentage =
        frequencies.length > 0 ? frequencies.reduce((sum, f) => sum + f.percentage, 0) / frequencies.length : 10;

    return (
        <div className='digit-frequency-chart'>
            <div className='chart-header'>
                <h3>📊 Last Digit Frequency Analysis</h3>
                <div className='chart-stats'>
                    <div className='stat'>
                        <span className='stat-label'>Avg:</span>
                        <span className='stat-value'>{averagePercentage.toFixed(1)}%</span>
                    </div>
                    <div className='stat'>
                        <span className='stat-label'>Expected:</span>
                        <span className='stat-value'>10.0%</span>
                    </div>
                </div>
            </div>

            <div className='chart-container'>
                {frequencies.length === 0 ? (
                    <div className='empty-chart'>
                        <div className='empty-icon'>📈</div>
                        <div className='empty-text'>Collecting tick data for analysis...</div>
                    </div>
                ) : (
                    <div className='chart-bars'>
                        {frequencies.map(freq => {
                            const barHeight = getBarHeight(freq.percentage);
                            const digitColor = getDigitColor(freq.digit);
                            const status = getDigitStatus(freq);
                            const isCurrent = freq.digit === currentDigit;

                            return (
                                <div
                                    key={freq.digit}
                                    className={`bar-container ${status} ${isCurrent ? 'current' : ''}`}
                                >
                                    <div className='bar-info'>
                                        <div className='percentage'>{freq.percentage.toFixed(1)}%</div>
                                        <div className='count'>({freq.count})</div>
                                    </div>

                                    <div className='bar-wrapper'>
                                        <div
                                            className='bar'
                                            style={{
                                                height: `${barHeight}%`,
                                                backgroundColor: digitColor,
                                                boxShadow: isCurrent
                                                    ? `0 0 20px ${digitColor}80`
                                                    : `0 2px 8px ${digitColor}40`,
                                            }}
                                        >
                                            {isCurrent && <div className='current-indicator'>▼</div>}
                                        </div>

                                        {/* Expected line */}
                                        <div className='expected-line' style={{ bottom: `${getBarHeight(10)}%` }} />
                                    </div>

                                    <div className='bar-label'>
                                        <span className='digit' style={{ color: digitColor }}>
                                            {freq.digit}
                                        </span>
                                        {status === 'hot' && <span className='status-badge hot'>🔥</span>}
                                        {status === 'cold' && <span className='status-badge cold'>❄️</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className='chart-legend'>
                <div className='legend-item'>
                    <div className='legend-color expected'></div>
                    <span>Expected (10%)</span>
                </div>
                <div className='legend-item'>
                    <div className='legend-color hot'></div>
                    <span>Hot (&gt;15%)</span>
                </div>
                <div className='legend-item'>
                    <div className='legend-color cold'></div>
                    <span>Cold (&lt;5%)</span>
                </div>
                <div className='legend-item'>
                    <div className='legend-color current'></div>
                    <span>Current Digit</span>
                </div>
            </div>
        </div>
    );
};
