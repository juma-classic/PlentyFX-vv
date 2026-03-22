import React, { useEffect, useState } from 'react';
import { derivAPIService } from '@/services/deriv-api.service';
import './DigitStatsCircles.scss';

interface DigitStat {
    digit: number;
    count: number;
    percentage: number;
}

interface DigitHistory {
    digit: number;
    timestamp: number;
}

interface StreakInfo {
    digit: number;
    count: number;
}

interface DigitStatsCirclesProps {
    market: string;
    onDigitClick?: (digit: number) => void;
    balance?: number;
    currentStake?: number;
}

export const DigitStatsCircles: React.FC<DigitStatsCirclesProps> = ({
    market,
    onDigitClick,
    balance = 0,
    currentStake = 0.35,
}) => {
    const [digitStats, setDigitStats] = useState<DigitStat[]>([]);
    const [lastDigit, setLastDigit] = useState<number | null>(null);
    const [totalTicks, setTotalTicks] = useState<number>(0);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [digitHistory, setDigitHistory] = useState<DigitHistory[]>([]);
    const [currentStreak, setCurrentStreak] = useState<StreakInfo | null>(null);
    const [selectedStrategy, setSelectedStrategy] = useState<string>('balanced');
    const [showStrategyModal, setShowStrategyModal] = useState<boolean>(false);

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        const digitCounts = new Map<number, number>();
        let tickCount = 0;

        const subscribeToTicks = async () => {
            try {
                setIsConnected(true);

                unsubscribe = await derivAPIService.subscribeToTicks(market, tickData => {
                    if (tickData?.tick?.quote) {
                        const quote = tickData.tick.quote;

                        // Extract last digit from the price (e.g., 860.44 -> 4)
                        const priceString = quote.toFixed(2);
                        const currentDigit = parseInt(priceString.charAt(priceString.length - 1));

                        setLastDigit(currentDigit);
                        tickCount++;
                        setTotalTicks(tickCount);

                        // Update digit history (keep last 100)
                        setDigitHistory(prev => {
                            const newHistory = [...prev, { digit: currentDigit, timestamp: Date.now() }];
                            return newHistory.slice(-100);
                        });

                        // Calculate streak
                        setCurrentStreak(prev => {
                            if (!prev || prev.digit !== currentDigit) {
                                return { digit: currentDigit, count: 1 };
                            }
                            return { digit: currentDigit, count: prev.count + 1 };
                        });

                        // Update digit count
                        digitCounts.set(currentDigit, (digitCounts.get(currentDigit) || 0) + 1);

                        // Calculate percentages for all digits (0-9)
                        const stats: DigitStat[] = [];
                        for (let i = 0; i <= 9; i++) {
                            const count = digitCounts.get(i) || 0;
                            const percentage = tickCount > 0 ? (count / tickCount) * 100 : 0;
                            stats.push({
                                digit: i,
                                count,
                                percentage,
                            });
                        }

                        setDigitStats(stats);
                    }
                });
            } catch (error) {
                console.error('Failed to subscribe to ticks:', error);
                setIsConnected(false);
            }
        };

        subscribeToTicks();

        return () => {
            if (unsubscribe) {
                try {
                    unsubscribe();
                } catch (error) {
                    console.error('Error unsubscribing:', error);
                }
            }
        };
    }, [market]);

    const getCircleColor = (percentage: number): string => {
        if (percentage >= 12) return '#4caf50'; // Hot (green)
        if (percentage >= 9) return '#2196f3'; // Normal (blue)
        if (percentage >= 7) return '#ff9800'; // Warm (orange)
        return '#f44336'; // Cold (red)
    };

    // Strategy functions
    const getHotDigits = (): number[] => {
        return digitStats.filter(s => s.percentage > 11).map(s => s.digit);
    };

    const getColdDigits = (): number[] => {
        return digitStats.filter(s => s.percentage < 9 && s.count > 0).map(s => s.digit);
    };

    const getBalancedDigits = (): number[] => {
        return digitStats.filter(s => s.percentage >= 9 && s.percentage <= 11).map(s => s.digit);
    };

    const getLastNDigits = (n: number): number[] => {
        return digitHistory.slice(-n).map(h => h.digit);
    };

    const getEvenDigits = (): number[] => {
        return [0, 2, 4, 6, 8];
    };

    const getOddDigits = (): number[] => {
        return [1, 3, 5, 7, 9];
    };

    const getFibonacciDigits = (): number[] => {
        return [0, 1, 1, 2, 3, 5, 8]; // Fibonacci sequence digits
    };

    const getSuggestedStake = (): number => {
        if (balance <= 0) return currentStake;

        // Suggest 1-2% of balance
        const suggested = balance * 0.015;
        return Math.max(0.35, Math.min(suggested, 10));
    };

    const getPredictionConfidence = (): string => {
        const hotDigits = getHotDigits();
        const coldDigits = getColdDigits();

        if (hotDigits.length >= 3) return 'High';
        if (coldDigits.length >= 3) return 'High';
        if (currentStreak && currentStreak.count >= 3) return 'Medium';
        return 'Low';
    };

    const getStrategyDigits = (strategy: string): number[] => {
        switch (strategy) {
            case 'hot':
                return getHotDigits();
            case 'cold':
                return getColdDigits();
            case 'balanced':
                return getBalancedDigits();
            case 'follow-last-3':
                return getLastNDigits(3);
            case 'avoid-last-3': {
                const last3 = getLastNDigits(3);
                return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(d => !last3.includes(d));
            }
            case 'fibonacci':
                return getFibonacciDigits();
            case 'even':
                return getEvenDigits();
            case 'odd':
                return getOddDigits();
            default:
                return [];
        }
    };

    const applyStrategy = (strategy: string) => {
        const digits = getStrategyDigits(strategy);
        if (digits.length > 0) {
            setSelectedStrategy(strategy);
            setShowStrategyModal(false);
            alert(`✅ Strategy "${strategy}" applied!\nSelected digits: ${digits.join(', ')}`);
        } else {
            alert(`⚠️ No digits match this strategy currently.`);
        }
    };

    const hotDigits = getHotDigits();
    const coldDigits = getColdDigits();
    const suggestedStake = getSuggestedStake();
    const confidence = getPredictionConfidence();

    return (
        <div className='digit-stats-circles-container'>
            {/* Header with Stats */}
            <div className='stats-header'>
                <h3>Digit Display</h3>
                <div className='stats-info'>
                    <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                        {isConnected ? '🟢 Live' : '🔴 Disconnected'}
                    </span>
                    <span className='total-ticks'>Ticks: {totalTicks}</span>
                    {balance > 0 && <span className='balance-info'>Balance: ${balance.toFixed(2)}</span>}
                </div>
            </div>

            {/* Strategy Selector */}
            <div className='strategy-selector'>
                <button className='strategy-btn' onClick={() => setShowStrategyModal(true)}>
                    📋 Strategy: {selectedStrategy.replace('-', ' ')}
                </button>
                <div className='quick-strategies'>
                    <button
                        className='quick-btn hot'
                        onClick={() => applyStrategy('hot')}
                        disabled={hotDigits.length === 0}
                    >
                        🔥 Hot ({hotDigits.length})
                    </button>
                    <button
                        className='quick-btn cold'
                        onClick={() => applyStrategy('cold')}
                        disabled={coldDigits.length === 0}
                    >
                        ❄️ Cold ({coldDigits.length})
                    </button>
                    <button className='quick-btn even' onClick={() => applyStrategy('even')}>
                        ⚪ Even
                    </button>
                    <button className='quick-btn odd' onClick={() => applyStrategy('odd')}>
                        ⚫ Odd
                    </button>
                </div>
            </div>

            {/* Intelligence Panel */}
            <div className='intelligence-panel'>
                {currentStreak && currentStreak.count >= 2 && (
                    <div className='streak-indicator'>
                        🔥 Streak: Digit <strong>{currentStreak.digit}</strong> × {currentStreak.count}
                    </div>
                )}
                <div className='confidence-indicator'>
                    🎯 Confidence: <span className={`confidence-${confidence.toLowerCase()}`}>{confidence}</span>
                </div>
                {balance > 0 && (
                    <div className='suggested-stake'>
                        💡 Suggested Stake: <strong>${suggestedStake.toFixed(2)}</strong>
                        <span className='stake-note'>(1.5% of balance)</span>
                    </div>
                )}
            </div>

            {/* Digit Circles with Animated Pointer */}
            <div className='circles-container'>
                {/* Animated Pointer */}
                {lastDigit !== null && (
                    <div
                        className='tick-pointer'
                        style={{
                            left: `${(lastDigit / 9) * 100}%`,
                            transform: 'translateX(-50%)',
                        }}
                    >
                        <div className='pointer-arrow'>▼</div>
                        <div className='pointer-line'></div>
                    </div>
                )}

                <div className='circles-grid'>
                    {digitStats.map(stat => {
                        const color = getCircleColor(stat.percentage);
                        const isLast = stat.digit === lastDigit;
                        const isHot = stat.percentage > 11;
                        const isCold = stat.percentage < 9 && stat.count > 0;

                        return (
                            <div
                                key={stat.digit}
                                className={`digit-circle-wrapper ${isLast ? 'last-digit-active' : ''} ${isHot ? 'hot-digit' : ''} ${isCold ? 'cold-digit' : ''}`}
                                onClick={() => onDigitClick?.(stat.digit)}
                                title={`Digit ${stat.digit}: ${stat.count} occurrences (${stat.percentage.toFixed(1)}%)`}
                            >
                                <div
                                    className='digit-circle'
                                    style={{
                                        borderColor: color,
                                        backgroundColor: isLast ? color : 'transparent',
                                        color: isLast ? '#fff' : '#333',
                                    }}
                                >
                                    <div className='digit-number'>{stat.digit}</div>
                                </div>
                                <div className='digit-percentage'>{stat.percentage.toFixed(1)}</div>
                                {isHot && <div className='hot-badge'>🔥</div>}
                                {isCold && <div className='cold-badge'>❄️</div>}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Mini Frequency Chart */}
            <div className='frequency-chart'>
                <h4>Last 10 Digits</h4>
                <div className='chart-bars'>
                    {digitHistory.slice(-10).map((h, idx) => (
                        <div key={idx} className='chart-bar' title={`Digit ${h.digit}`}>
                            <div className='bar-fill' style={{ height: `${(h.digit + 1) * 10}%` }}>
                                {h.digit}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Strategy Modal */}
            {showStrategyModal && (
                <div className='strategy-modal-overlay' onClick={() => setShowStrategyModal(false)}>
                    <div className='strategy-modal' onClick={e => e.stopPropagation()}>
                        <h3>📋 Select Strategy</h3>
                        <div className='strategy-list'>
                            <button onClick={() => applyStrategy('hot')}>🔥 Hot Digits Only (&gt;11%)</button>
                            <button onClick={() => applyStrategy('cold')}>❄️ Cold Digits Only (&lt;9%)</button>
                            <button onClick={() => applyStrategy('balanced')}>⚖️ Balanced Mix (9-11%)</button>
                            <button onClick={() => applyStrategy('follow-last-3')}>👣 Follow Last 3 Digits</button>
                            <button onClick={() => applyStrategy('avoid-last-3')}>🚫 Avoid Last 3 Digits</button>
                            <button onClick={() => applyStrategy('fibonacci')}>🔢 Fibonacci Sequence</button>
                            <button onClick={() => applyStrategy('even')}>⚪ Even Numbers Only</button>
                            <button onClick={() => applyStrategy('odd')}>⚫ Odd Numbers Only</button>
                        </div>
                        <button className='close-modal-btn' onClick={() => setShowStrategyModal(false)}>
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
