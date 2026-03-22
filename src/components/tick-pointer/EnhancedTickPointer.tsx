import React, { useEffect, useState } from 'react';
import { useTickPointer } from '@/hooks/useTickPointer';

interface EnhancedTickPointerProps {
    market: string;
    onDigitSelect?: (digit: number) => void;
    showAnalytics?: boolean;
}

interface DigitStat {
    digit: number;
    count: number;
    percentage: number;
    isHot: boolean;
    isCold: boolean;
    winProbability: number;
}

export const EnhancedTickPointer: React.FC<EnhancedTickPointerProps> = ({
    market,
    onDigitSelect,
    showAnalytics = true,
}) => {
    const {
        currentTick,
        tickHistory,
        digitStats,
        isSubscribed,
        getLastDigits,
        getHotDigits,
        getColdDigits,
        isHotDigit,
        isColdDigit,
    } = useTickPointer(market, true);

    const [selectedDigit, setSelectedDigit] = useState<number | null>(null);
    const [hoveredDigit, setHoveredDigit] = useState<number | null>(null);
    const [showStats, setShowStats] = useState(false);
    const [pulseDigit, setPulseDigit] = useState<number | null>(null);
    const [streakAlert, setStreakAlert] = useState<{ digit: number; count: number } | null>(null);

    // Detect new tick and trigger pulse animation
    useEffect(() => {
        if (currentTick?.lastDigit !== undefined) {
            setPulseDigit(currentTick.lastDigit);
            setTimeout(() => setPulseDigit(null), 500);

            // Check for streaks
            const lastDigits = getLastDigits(5);
            if (lastDigits.length >= 3) {
                const lastThree = lastDigits.slice(-3);
                if (lastThree.every(d => d === lastThree[0])) {
                    setStreakAlert({ digit: lastThree[0], count: lastThree.length });
                    setTimeout(() => setStreakAlert(null), 3000);
                }
            }
        }
    }, [currentTick?.lastDigit, getLastDigits]);

    // Calculate digit statistics
    const getDigitStatistics = (): DigitStat[] => {
        const stats: DigitStat[] = [];
        const total = tickHistory.length;
        const hotDigits = getHotDigits(3);
        const coldDigits = getColdDigits(3);

        for (let i = 0; i <= 9; i++) {
            const stat = digitStats.find(s => s.digit === i);
            const count = stat?.count || 0;
            const percentage = total > 0 ? (count / total) * 100 : 0;

            // Calculate win probability (simplified)
            const winProbability = percentage > 0 ? Math.min(percentage * 1.2, 100) : 10;

            stats.push({
                digit: i,
                count,
                percentage,
                isHot: hotDigits.includes(i),
                isCold: coldDigits.includes(i),
                winProbability,
            });
        }

        return stats;
    };

    const digitStatistics = getDigitStatistics();

    // Detect trend
    const getTrend = (): 'up' | 'down' | 'neutral' => {
        const recent = getLastDigits(10);
        if (recent.length < 5) return 'neutral';

        const avg = recent.reduce((sum, d) => sum + d, 0) / recent.length;
        if (avg > 5.5) return 'up';
        if (avg < 4.5) return 'down';
        return 'neutral';
    };

    const trend = getTrend();

    const handleDigitClick = (digit: number) => {
        setSelectedDigit(digit);
        if (onDigitSelect) {
            onDigitSelect(digit);
        }
    };

    const getDigitClass = (digit: number): string => {
        const classes = ['digit-circle'];

        if (currentTick?.lastDigit === digit) classes.push('current');
        if (selectedDigit === digit) classes.push('selected');
        if (pulseDigit === digit) classes.push('pulse');
        if (isHotDigit(digit)) classes.push('hot');
        if (isColdDigit(digit)) classes.push('cold');

        return classes.join(' ');
    };

    return (
        <div className='enhanced-tick-pointer'>
            {/* Connection Status */}
            <div className='connection-status'>
                <span className={`status-indicator ${isSubscribed ? 'connected' : 'disconnected'}`}>
                    {isSubscribed ? '🟢 Live' : '🔴 Disconnected'}
                </span>
                <span className='market-name'>{market}</span>
            </div>

            {/* Current Tick Display */}
            <div className='current-tick-display'>
                <div className='tick-label'>Current Tick</div>
                <div className='tick-value'>{currentTick?.quote.toFixed(2) || '--'}</div>
                <div className='last-digit-large'>
                    Last Digit:{' '}
                    <span className={getDigitClass(currentTick?.lastDigit || 0)}>{currentTick?.lastDigit ?? '--'}</span>
                </div>
            </div>

            {/* Digit Display - Last 10 Ticks with Values */}
            <div className='digit-display-section'>
                <div className='digit-display-header'>Digit Display</div>
                <div className='digit-display-container'>
                    {tickHistory.slice(-10).map((tick, index) => {
                        const lastDigit = Math.floor(tick.quote * 100) % 10;
                        const isCurrentTick = index === tickHistory.slice(-10).length - 1;

                        return (
                            <div key={index} className='digit-display-item'>
                                <div
                                    className={`digit-circle-display ${isCurrentTick ? 'current-tick' : ''} digit-${lastDigit}`}
                                >
                                    {lastDigit}
                                </div>
                                <div className='digit-value'>{tick.quote.toFixed(2)}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Streak Alert */}
            {streakAlert && (
                <div className='streak-alert'>
                    🔥 Streak Alert: Digit {streakAlert.digit} appeared {streakAlert.count}+ times!
                </div>
            )}

            {/* Trend Indicator */}
            <div className='trend-indicator'>
                <span className='trend-label'>Trend:</span>
                <span className={`trend-value trend-${trend}`}>
                    {trend === 'up' ? '↗️ Up' : trend === 'down' ? '↘️ Down' : '➡️ Neutral'}
                </span>
                <span className='hot-cold-summary'>
                    🔥 Hot: {getHotDigits(3).join(', ')} | ❄️ Cold: {getColdDigits(3).join(', ')}
                </span>
            </div>

            {/* Interactive Digit Selector */}
            <div className='digit-selector-enhanced'>
                <div className='digit-row'>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => {
                        const stat = digitStatistics.find(s => s.digit === digit);

                        return (
                            <div
                                key={digit}
                                className='digit-container'
                                onMouseEnter={() => setHoveredDigit(digit)}
                                onMouseLeave={() => setHoveredDigit(null)}
                                onClick={() => handleDigitClick(digit)}
                            >
                                {/* Frequency Bar */}
                                <div className='frequency-bar'>
                                    <div
                                        className='frequency-fill'
                                        style={{
                                            height: `${stat?.percentage || 0}%`,
                                            background: stat?.isHot
                                                ? 'linear-gradient(180deg, #ff6b6b 0%, #ee5a6f 100%)'
                                                : stat?.isCold
                                                  ? 'linear-gradient(180deg, #4facfe 0%, #00f2fe 100%)'
                                                  : 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
                                        }}
                                    />
                                </div>

                                {/* Digit Circle */}
                                <div className={getDigitClass(digit)}>
                                    <span className='digit-number'>{digit}</span>
                                    {stat?.isHot && <span className='digit-icon'>🔥</span>}
                                    {stat?.isCold && <span className='digit-icon'>❄️</span>}
                                </div>

                                {/* Hover Stats */}
                                {hoveredDigit === digit && stat && (
                                    <div className='digit-tooltip'>
                                        <div className='tooltip-row'>
                                            <span>Count:</span>
                                            <span>{stat.count}</span>
                                        </div>
                                        <div className='tooltip-row'>
                                            <span>Frequency:</span>
                                            <span>{stat.percentage.toFixed(1)}%</span>
                                        </div>
                                        <div className='tooltip-row'>
                                            <span>Win Prob:</span>
                                            <span>{stat.winProbability.toFixed(1)}%</span>
                                        </div>
                                        <button
                                            className='trade-btn'
                                            onClick={e => {
                                                e.stopPropagation();
                                                handleDigitClick(digit);
                                            }}
                                        >
                                            Trade This
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Last 10 Digits History */}
            <div className='digit-history'>
                <div className='history-label'>Last 10 Digits:</div>
                <div className='history-digits'>
                    {getLastDigits(10).map((digit, index) => (
                        <span
                            key={index}
                            className={`history-digit ${isHotDigit(digit) ? 'hot' : ''} ${
                                isColdDigit(digit) ? 'cold' : ''
                            }`}
                        >
                            {digit}
                        </span>
                    ))}
                </div>
            </div>

            {/* Analytics Panel */}
            {showAnalytics && (
                <div className='analytics-panel'>
                    <div className='panel-header'>
                        <span>📊 Real-Time Analytics</span>
                        <button className='toggle-stats-btn' onClick={() => setShowStats(!showStats)}>
                            {showStats ? '▼' : '▶'}
                        </button>
                    </div>

                    {showStats && (
                        <div className='stats-content'>
                            <div className='stats-grid'>
                                {digitStatistics.map(stat => (
                                    <div key={stat.digit} className='stat-card'>
                                        <div className='stat-digit'>
                                            {stat.digit}
                                            {stat.isHot && ' 🔥'}
                                            {stat.isCold && ' ❄️'}
                                        </div>
                                        <div className='stat-details'>
                                            <div className='stat-row'>
                                                <span>Count:</span>
                                                <span>{stat.count}</span>
                                            </div>
                                            <div className='stat-row'>
                                                <span>Freq:</span>
                                                <span>{stat.percentage.toFixed(1)}%</span>
                                            </div>
                                            <div className='stat-row'>
                                                <span>Win:</span>
                                                <span>{stat.winProbability.toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className='pattern-detection'>
                                <h4>🧠 Pattern Detection</h4>
                                <div className='pattern-info'>
                                    <div className='pattern-row'>
                                        <span>Total Ticks:</span>
                                        <span>{tickHistory.length}</span>
                                    </div>
                                    <div className='pattern-row'>
                                        <span>Trend:</span>
                                        <span className={`trend-${trend}`}>
                                            {trend === 'up'
                                                ? '↗️ Upward'
                                                : trend === 'down'
                                                  ? '↘️ Downward'
                                                  : '➡️ Neutral'}
                                        </span>
                                    </div>
                                    <div className='pattern-row'>
                                        <span>Hot Digits:</span>
                                        <span>{getHotDigits(3).join(', ')}</span>
                                    </div>
                                    <div className='pattern-row'>
                                        <span>Cold Digits:</span>
                                        <span>{getColdDigits(3).join(', ')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
