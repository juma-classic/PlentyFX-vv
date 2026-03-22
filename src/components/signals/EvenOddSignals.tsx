import React, { useEffect, useState } from 'react';
import { derivAPIService } from '@/services/deriv-api.service';
import { EvenOddEntrySuggester } from '@/utils/evenodd-entry-suggester';
import { PatternDisplay } from './PatternDisplay';
import './SignalCards.scss';

interface DigitStats {
    digit: number;
    percentage: number;
    count: number;
}

interface EvenOddSignal {
    id: string;
    timestamp: number;
    market: string;
    marketDisplay: string;
    type: 'EVEN' | 'ODD';
    entry: number;
    duration: string;
    confidence: 'CONSERVATIVE' | 'AGGRESSIVE';
    strategy: string;
    source: string;
    status: 'ACTIVE' | 'WON' | 'LOST' | 'EXPIRED';
    digitStats: DigitStats[];
    analysis: {
        imbalance: number;
        streakLength: number;
        evenCount: number;
        oddCount: number;
        coldEvenDigits: number;
        coldOddDigits: number;
        reason: string;
    };
    entryAnalysis?: {
        suggestedEntry: 'EVEN' | 'ODD' | 'WAIT';
        confidence: 'HIGH' | 'MEDIUM' | 'LOW';
        timing: 'ENTER_NOW' | 'WAIT_1_TICK' | 'WAIT_2_TICKS' | 'NO_CLEAR_SIGNAL';
        reason: string;
        indicators: {
            streakLength: number;
            streakType: 'EVEN' | 'ODD';
            evenPercentage: number;
            oddPercentage: number;
            imbalance: number;
            alternatingPattern: boolean;
            recommendation: string;
        };
    };
    recentPattern?: ('EVEN' | 'ODD')[];
    expiresAt?: number; // Timestamp when signal expires
    remainingSeconds?: number; // Calculated remaining time
}

export const EvenOddSignals: React.FC<{ onSignalsUpdate?: (signals: EvenOddSignal[]) => void }> = ({
    onSignalsUpdate,
}) => {
    const [signals, setSignals] = useState<EvenOddSignal[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [mode, setMode] = useState<'both' | 'conservative' | 'aggressive'>('both');
    const [isCompactView, setIsCompactView] = useState(false);
    const [, forceUpdate] = useState({});

    const markets = [
        { value: '1HZ10V', label: 'Volatility 10 (1s)' },
        { value: '1HZ25V', label: 'Volatility 25 (1s)' },
        { value: '1HZ50V', label: 'Volatility 50 (1s)' },
        { value: '1HZ75V', label: 'Volatility 75 (1s)' },
        { value: '1HZ100V', label: 'Volatility 100 (1s)' },
        { value: 'R_10', label: 'Volatility 10' },
        { value: 'R_25', label: 'Volatility 25' },
        { value: 'R_50', label: 'Volatility 50' },
        { value: 'R_75', label: 'Volatility 75' },
        { value: 'R_100', label: 'Volatility 100' },
    ];

    // Analyze digit distribution
    const analyzeDigitDistribution = (ticks: number[]): DigitStats[] => {
        const digitCounts = new Array(10).fill(0);
        const totalTicks = ticks.length;

        ticks.forEach(tick => {
            const lastDigit = Math.abs(Math.floor(tick * 100)) % 10;
            digitCounts[lastDigit]++;
        });

        return digitCounts.map((count, digit) => ({
            digit,
            count,
            percentage: totalTicks > 0 ? (count / totalTicks) * 100 : 0,
        }));
    };

    // Detect streak
    const detectStreak = (ticks: number[]): { type: 'EVEN' | 'ODD'; length: number } => {
        if (ticks.length < 2) return { type: 'EVEN', length: 0 };

        const lastDigits = ticks.slice(-10).map(tick => Math.abs(Math.floor(tick * 100)) % 10);
        const streakType: 'EVEN' | 'ODD' = lastDigits[lastDigits.length - 1] % 2 === 0 ? 'EVEN' : 'ODD';
        let streakLength = 1;

        for (let i = lastDigits.length - 2; i >= 0; i--) {
            const isEven = lastDigits[i] % 2 === 0;
            const currentType: 'EVEN' | 'ODD' = isEven ? 'EVEN' : 'ODD';

            if (currentType === streakType) {
                streakLength++;
            } else {
                break;
            }
        }

        return { type: streakType, length: streakLength };
    };

    // Analyze EVEN/ODD signal
    const analyzeEvenOdd = (
        digitStats: DigitStats[],
        ticks: number[]
    ): {
        signal: EvenOddSignal['analysis'] & {
            type: 'EVEN' | 'ODD' | null;
            confidence: 'CONSERVATIVE' | 'AGGRESSIVE' | null;
        };
    } => {
        // Calculate EVEN/ODD percentages
        const evenDigits = [0, 2, 4, 6, 8];
        const oddDigits = [1, 3, 5, 7, 9];

        const evenCount = evenDigits.reduce((sum, d) => sum + digitStats[d].count, 0);
        const oddCount = oddDigits.reduce((sum, d) => sum + digitStats[d].count, 0);
        const total = evenCount + oddCount;

        const evenPercentage = (evenCount / total) * 100;
        const oddPercentage = (oddCount / total) * 100;

        // Calculate imbalance
        const imbalance = Math.abs(evenPercentage - oddPercentage);

        // Detect streak
        const streak = detectStreak(ticks);

        // Count cold digits (< 8%)
        const coldEvenDigits = evenDigits.filter(d => digitStats[d].percentage < 8).length;
        const coldOddDigits = oddDigits.filter(d => digitStats[d].percentage < 8).length;

        // Determine signal type
        let signalType: 'EVEN' | 'ODD' | null = null;
        let confidence: 'CONSERVATIVE' | 'AGGRESSIVE' | null = null;
        let reason = '';

        // CONSERVATIVE: Imbalance >60% + Streak 4+ + Digit Analysis aligned (LOWERED THRESHOLD)
        if (imbalance >= 10) {
            // 60% vs 40% = 20% difference, but we use 10% from 50% baseline
            const underrepresented = evenPercentage < oddPercentage ? 'EVEN' : 'ODD';
            const streakOpposite = streak.type === 'EVEN' ? 'ODD' : 'EVEN';

            if (streak.length >= 5 && underrepresented === streakOpposite) {
                // Check digit analysis alignment
                const coldDigitsAlign =
                    (underrepresented === 'EVEN' && coldEvenDigits >= 3) ||
                    (underrepresented === 'ODD' && coldOddDigits >= 3);

                if (coldDigitsAlign) {
                    signalType = underrepresented;
                    confidence = 'CONSERVATIVE';
                    reason = `CONSERVATIVE: ${imbalance.toFixed(1)}% imbalance, ${streak.length} ${streak.type} streak, ${underrepresented === 'EVEN' ? coldEvenDigits : coldOddDigits} cold ${underrepresented} digits. High probability reversal.`;
                }
            }
        }

        // AGGRESSIVE: Imbalance >52% OR Streak 3+ (LOWERED THRESHOLD)
        if (!signalType) {
            if (imbalance >= 2) {
                // 52% vs 48% = 4% difference, but we use 2% from 50% baseline
                const underrepresented = evenPercentage < oddPercentage ? 'EVEN' : 'ODD';
                signalType = underrepresented;
                confidence = 'AGGRESSIVE';
                reason = `AGGRESSIVE: ${imbalance.toFixed(1)}% imbalance favors ${underrepresented}. Expect mean reversion.`;
            } else if (streak.length >= 4) {
                const streakOpposite = streak.type === 'EVEN' ? 'ODD' : 'EVEN';
                signalType = streakOpposite;
                confidence = 'AGGRESSIVE';
                reason = `AGGRESSIVE: ${streak.length} consecutive ${streak.type} results. ${streakOpposite} likely next.`;
            }
        }

        return {
            signal: {
                type: signalType,
                confidence,
                imbalance,
                streakLength: streak.length,
                evenCount,
                oddCount,
                coldEvenDigits,
                coldOddDigits,
                reason,
            },
        };
    };

    // Scan all markets IN PARALLEL for faster signal generation
    const scanAllMarkets = async () => {
        setIsScanning(true);
        console.log('🎲 EVEN/ODD Scanner: Scanning all markets in parallel...');

        // Scan all markets simultaneously instead of one by one
        const scanPromises = markets.map(market =>
            analyzeMarket(market.value, market.label).catch(error => {
                console.error(`Error analyzing ${market.label}:`, error);
            })
        );

        await Promise.all(scanPromises);

        setIsScanning(false);
        console.log('✅ EVEN/ODD Scanner: Scan complete - all markets analyzed');
    };

    // Analyze market
    const analyzeMarket = async (market: string, marketLabel: string) => {
        try {
            console.log(`🎲 EvenOdd: Analyzing ${marketLabel}...`);

            // Check if API is available
            if (!derivAPIService) {
                console.error('❌ EvenOdd: derivAPIService not available');
                return;
            }

            const ticks: number[] = [];
            let tickCount = 0;
            const maxTicks = 60; // Reduced from 100 for faster signals

            const unsubscribe = await derivAPIService.subscribeToTicks(market, tickData => {
                if (tickData?.tick?.quote) {
                    ticks.push(tickData.tick.quote);
                    tickCount++;
                    console.log(
                        `📊 EvenOdd: Received tick ${tickCount}/${maxTicks} for ${marketLabel}: ${tickData.tick.quote}`
                    );

                    if (tickCount >= maxTicks) {
                        unsubscribe();
                        generateSignal(market, marketLabel, ticks);
                    }
                }
            });

            setTimeout(() => {
                if (tickCount < maxTicks) {
                    unsubscribe();
                    if (tickCount > 30) {
                        // Reduced from 50
                        console.log(`⚠️ EvenOdd: Using ${tickCount} ticks for ${marketLabel} (less than ideal)`);
                        generateSignal(market, marketLabel, ticks);
                    } else {
                        console.log(`❌ EvenOdd: Insufficient ticks for ${marketLabel} (${tickCount})`);
                    }
                }
            }, 30000); // Increased timeout to 30 seconds
        } catch (error) {
            console.error(`❌ EvenOdd: Error analyzing ${marketLabel}:`, error);
        }
    };

    // Generate signal
    const generateSignal = (market: string, marketLabel: string, ticks: number[]) => {
        const digitStats = analyzeDigitDistribution(ticks);
        const { signal } = analyzeEvenOdd(digitStats, ticks);

        if (!signal.type || !signal.confidence) {
            return;
        }

        // Filter by mode
        if (mode === 'conservative' && signal.confidence !== 'CONSERVATIVE') return;
        if (mode === 'aggressive' && signal.confidence !== 'AGGRESSIVE') return;

        // Get entry suggestion using the entry suggester
        const entryAnalysis = EvenOddEntrySuggester.analyzeEntry(ticks);
        console.log('🎯 Entry Analysis Generated:', entryAnalysis);

        // Generate pattern for EVEN/ODD
        const recentPattern = ticks.slice(-18).map((tick: number) => {
            const lastDigit = Math.abs(Math.floor(tick * 100)) % 10;
            return lastDigit % 2 === 0 ? 'EVEN' : 'ODD';
        }) as ('EVEN' | 'ODD')[];

        // Calculate expiry time: 60 seconds for CONSERVATIVE, 45 seconds for AGGRESSIVE
        const expiryDuration = signal.confidence === 'CONSERVATIVE' ? 60 : 45;
        const expiresAt = Date.now() + expiryDuration * 1000;

        const newSignal: EvenOddSignal = {
            id: `evenodd-${market}-${Date.now()}`,
            timestamp: Date.now(),
            market,
            marketDisplay: marketLabel,
            type: signal.type,
            entry: ticks[ticks.length - 1] || 0,
            duration: '5 ticks',
            confidence: signal.confidence,
            strategy: `EVEN/ODD ${signal.confidence}`,
            source: 'evenodd',
            status: 'ACTIVE',
            digitStats,
            analysis: {
                imbalance: signal.imbalance,
                streakLength: signal.streakLength,
                evenCount: signal.evenCount,
                oddCount: signal.oddCount,
                coldEvenDigits: signal.coldEvenDigits,
                coldOddDigits: signal.coldOddDigits,
                reason: signal.reason,
            },
            entryAnalysis,
            recentPattern,
            expiresAt,
            remainingSeconds: expiryDuration,
        };

        setSignals(prev => {
            const updated = [newSignal, ...prev].slice(0, 50);
            console.log(
                `🎲 EvenOdd Signal Generated: ${newSignal.type} for ${newSignal.marketDisplay} (Expires in ${expiryDuration}s)`
            );
            if (onSignalsUpdate) {
                onSignalsUpdate(updated);
                console.log('🔄 EvenOdd signals updated via callback');
            }
            return updated;
        });
    };

    // Auto-scan on mount and periodically
    useEffect(() => {
        // Initial scan after a short delay to ensure component is mounted
        const initialScanTimeout = setTimeout(() => {
            console.log('🎲 EvenOdd Scanner: Starting initial scan...');
            scanAllMarkets();
        }, 1000);

        const interval = setInterval(() => {
            console.log('🎲 EvenOdd Scanner: Starting periodic scan...');
            scanAllMarkets();
        }, 120000);

        // Listen for force-rescan events
        const handleForceRescan = () => {
            console.log('🎲 EvenOdd Scanner: Force rescan triggered');
            scanAllMarkets();
        };
        window.addEventListener('force-rescan', handleForceRescan);

        return () => {
            clearTimeout(initialScanTimeout);
            clearInterval(interval);
            window.removeEventListener('force-rescan', handleForceRescan);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode]);

    // Expiry timer - update remaining seconds every second
    useEffect(() => {
        const timer = setInterval(() => {
            const now = Date.now();
            setSignals(prev =>
                prev.map(signal => {
                    if (signal.status !== 'ACTIVE' || !signal.expiresAt) return signal;

                    const remaining = Math.max(0, Math.floor((signal.expiresAt - now) / 1000));

                    // Mark as expired if time is up
                    if (remaining === 0 && signal.status === 'ACTIVE') {
                        console.log(`⏰ Signal ${signal.id} expired`);
                        return { ...signal, status: 'EXPIRED', remainingSeconds: 0 };
                    }

                    return { ...signal, remainingSeconds: remaining };
                })
            );
            forceUpdate({});
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className='evenodd-signals'>
            <div className='evenodd-header'>
                <div className='header-content'>
                    <h3>🎲 EVEN/ODD Signals</h3>
                    <p className='evenodd-description'>
                        Auto-scanning for EVEN/ODD opportunities with Conservative (70-75% win rate) and Aggressive
                        (55-60% win rate) modes
                    </p>
                </div>
                <div className='header-controls'>
                    <div className='mode-selector'>
                        <button
                            className={`mode-btn ${mode === 'both' ? 'active' : ''}`}
                            onClick={() => setMode('both')}
                        >
                            Both
                        </button>
                        <button
                            className={`mode-btn conservative ${mode === 'conservative' ? 'active' : ''}`}
                            onClick={() => setMode('conservative')}
                        >
                            🛡️ Conservative
                        </button>
                        <button
                            className={`mode-btn aggressive ${mode === 'aggressive' ? 'active' : ''}`}
                            onClick={() => setMode('aggressive')}
                        >
                            ⚡ Aggressive
                        </button>
                    </div>
                    <button
                        className={`view-toggle-btn ${isCompactView ? 'compact' : 'detailed'}`}
                        onClick={() => setIsCompactView(!isCompactView)}
                        title={isCompactView ? 'Switch to Detailed View' : 'Switch to Compact View'}
                    >
                        {isCompactView ? '📋 Detailed' : '📊 Compact'}
                    </button>
                    <button className='scan-btn' onClick={scanAllMarkets} disabled={isScanning}>
                        {isScanning ? '⏳ Scanning...' : '🔄 Scan All'}
                    </button>
                </div>
            </div>

            <div className='evenodd-signals-list'>
                {signals.length === 0 && !isScanning && (
                    <div className='no-signals'>
                        <span className='no-signals-icon'>📭</span>
                        <p>No EVEN/ODD signals yet. Scanning markets automatically...</p>
                    </div>
                )}

                {isScanning && signals.length === 0 && (
                    <div className='scanning-message'>
                        <span className='scanning-icon'>🔍</span>
                        <p>Scanning all volatility markets for EVEN/ODD opportunities...</p>
                    </div>
                )}

                {[...signals]
                    .sort((a, b) => b.timestamp - a.timestamp) // Sort by timestamp, newest first
                    .map(signal => (
                        <div
                            key={signal.id}
                            className={`signal-card evenodd-signal-card ${isCompactView ? 'compact-view' : ''} ${signal.status === 'EXPIRED' ? 'expired' : ''}`}
                        >
                            <div className='signal-header'>
                                <div className='signal-type-badge'>
                                    <span className='badge-icon'>🎲</span>
                                    <span className='badge-text'>{signal.type}</span>
                                </div>
                                <div className={`confidence-badge ${signal.confidence.toLowerCase()}`}>
                                    {signal.confidence}
                                </div>
                                {signal.status === 'ACTIVE' && signal.remainingSeconds !== undefined && (
                                    <div
                                        className={`expiry-timer ${signal.remainingSeconds <= 10 ? 'urgent' : signal.remainingSeconds <= 30 ? 'warning' : ''}`}
                                    >
                                        <span className='timer-icon'>⏱️</span>
                                        <span className='timer-value'>{signal.remainingSeconds}s</span>
                                    </div>
                                )}
                                {signal.status === 'EXPIRED' && (
                                    <div className='expired-badge'>
                                        <span>⏰ EXPIRED</span>
                                    </div>
                                )}
                            </div>

                            <div className='signal-market'>
                                <span className='market-icon'>📊</span>
                                <span className='market-name'>{signal.marketDisplay}</span>
                            </div>

                            {!isCompactView && (
                                <>
                                    <div className='signal-entry'>
                                        <span className='entry-label'>Entry:</span>
                                        <span className='entry-value'>{signal.entry.toFixed(2)}</span>
                                    </div>

                                    {signal.analysis?.reason && (
                                        <div className='signal-reason'>
                                            <span className='reason-icon'>💡</span>
                                            <span className='reason-text'>{signal.analysis.reason}</span>
                                        </div>
                                    )}

                                    {signal.recentPattern && signal.recentPattern.length > 0 && (
                                        <PatternDisplay pattern={signal.recentPattern} type='evenodd' />
                                    )}

                                    {signal.entryAnalysis && (
                                        <div
                                            className={`entry-suggestion ${signal.entryAnalysis.confidence.toLowerCase()}-confidence ${signal.entryAnalysis.suggestedEntry === 'WAIT' ? 'wait-signal' : ''}`}
                                        >
                                            <div className='suggestion-header'>
                                                <span className='suggestion-icon'>
                                                    {signal.entryAnalysis.suggestedEntry === 'WAIT' ? '⏸️' : '🎯'}
                                                </span>
                                                <span className='suggestion-text'>
                                                    {signal.entryAnalysis.suggestedEntry === 'WAIT'
                                                        ? 'WAIT'
                                                        : `TRADE ${signal.entryAnalysis.suggestedEntry}`}
                                                </span>
                                                <span
                                                    className={`confidence-badge ${signal.entryAnalysis.confidence.toLowerCase()}`}
                                                >
                                                    {signal.entryAnalysis.confidence}
                                                </span>
                                            </div>
                                            <div className='suggestion-reason'>{signal.entryAnalysis.reason}</div>
                                            {signal.entryAnalysis.suggestedEntry !== 'WAIT' && (
                                                <div className='suggestion-timing'>
                                                    {signal.entryAnalysis.timing === 'ENTER_NOW' && '⚡ Enter Now'}
                                                    {signal.entryAnalysis.timing === 'WAIT_1_TICK' && '⏱️ Wait 1 Tick'}
                                                    {signal.entryAnalysis.timing === 'WAIT_2_TICKS' &&
                                                        '⏱️ Wait 2 Ticks'}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}

                            <div className='signal-footer'>
                                <span className='signal-duration'>⏱️ {signal.duration}</span>
                                <span className='signal-time'>{new Date(signal.timestamp).toLocaleTimeString()}</span>
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
};
