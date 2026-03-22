import React, { useEffect, useState } from 'react';
import { useApiBase } from '@/hooks/useApiBase';
import { CONNECTION_STATUS } from '@/external/bot-skeleton/services/api/observables/connection-status-stream';
import { derivAPIService } from '@/services/deriv-api.service';
import './DigitHackerSignals.scss';

interface DigitHackerSignal {
    id: string;
    timestamp: number;
    market: string;
    marketDisplay: string;
    type: 'EVEN' | 'ODD' | 'MATCHES' | 'OVER' | 'UNDER';
    predictionType: 'EVEN_ODD' | 'DIGIT_MATCHES' | 'OVER_UNDER';
    digit?: number; // For MATCHES, OVER, UNDER
    confidencePercentage: number; // Internal percentage
    confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'CONSERVATIVE' | 'AGGRESSIVE'; // Required by SignalsCenterSignal
    recommendedRuns: number;
    entry: number;
    duration: string; // Required by SignalsCenterSignal
    strategy: string; // Required by SignalsCenterSignal
    source: string; // Required by SignalsCenterSignal
    countdown: number; // Seconds until entry
    status: 'WAITING' | 'READY' | 'ACTIVE' | 'EXPIRED';
    analysis: {
        sampleSize: number;
        evenCount?: number;
        oddCount?: number;
        digitFrequency?: { [key: number]: number };
        overCount?: number;
        underCount?: number;
        ratio?: number;
        reason: string;
    };
    expiresAt?: number;
    remainingSeconds?: number;
}

export const DigitHackerSignals: React.FC<{
    onSignalsUpdate?: (signals: DigitHackerSignal[]) => void;
    activeFilter?: 'ALL' | 'EVEN_ODD' | 'DIGIT_MATCHES' | 'OVER_UNDER';
}> = ({ onSignalsUpdate, activeFilter = 'ALL' }) => {
    const { connectionStatus } = useApiBase(); // Use site's connection status
    const [signals, setSignals] = useState<DigitHackerSignal[]>([]);
    const [isScanning, setIsScanning] = useState(false);
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

    // Convert percentage confidence to confidence level
    const getConfidenceLevel = (percentage: number): 'HIGH' | 'MEDIUM' | 'LOW' => {
        if (percentage >= 75) return 'HIGH';
        if (percentage >= 60) return 'MEDIUM';
        return 'LOW';
    };

    // Extract last digit from price
    const getLastDigit = (price: number): number => {
        return Math.abs(Math.floor(price * 100)) % 10;
    };

    // Analyze EVEN/ODD pattern
    const analyzeEvenOdd = (ticks: number[]): DigitHackerSignal | null => {
        const digits = ticks.map(getLastDigit);
        const evenCount = digits.filter(d => d % 2 === 0).length;
        const oddCount = digits.length - evenCount;
        const evenPercentage = (evenCount / digits.length) * 100;
        const oddPercentage = (oddCount / digits.length) * 100;

        // Determine prediction
        let type: 'EVEN' | 'ODD';
        let confidence: number;
        let reason: string;

        if (evenPercentage > oddPercentage) {
            type = 'EVEN';
            confidence = evenPercentage;
            reason = `${evenCount}/${digits.length} recent digits are EVEN (${evenPercentage.toFixed(1)}%)`;
        } else {
            type = 'ODD';
            confidence = oddPercentage;
            reason = `${oddCount}/${digits.length} recent digits are ODD (${oddPercentage.toFixed(1)}%)`;
        }

        // Only generate signal if confidence > 55%
        if (confidence < 55) return null;

        return {
            type,
            predictionType: 'EVEN_ODD',
            confidencePercentage: Math.round(confidence),
            confidence: getConfidenceLevel(confidence),
            recommendedRuns: confidence > 70 ? 12 : confidence > 60 ? 10 : 8,
            analysis: {
                sampleSize: digits.length,
                evenCount,
                oddCount,
                reason,
            },
        } as Partial<DigitHackerSignal> as DigitHackerSignal;
    };

    // Analyze Digit Matches
    const analyzeDigitMatches = (ticks: number[]): DigitHackerSignal | null => {
        const digits = ticks.map(getLastDigit);
        const frequency: { [key: number]: number } = {};

        // Count frequency of each digit
        digits.forEach(d => {
            frequency[d] = (frequency[d] || 0) + 1;
        });

        // Find most frequent digit
        let maxDigit = 0;
        let maxCount = 0;
        Object.entries(frequency).forEach(([digit, count]) => {
            if (count > maxCount) {
                maxCount = count;
                maxDigit = parseInt(digit);
            }
        });

        const confidence = (maxCount / digits.length) * 100;

        // Only generate signal if confidence > 20% (above random 10%)
        if (confidence < 20) return null;

        return {
            type: 'MATCHES',
            predictionType: 'DIGIT_MATCHES',
            digit: maxDigit,
            confidencePercentage: Math.round(confidence),
            confidence: getConfidenceLevel(confidence),
            recommendedRuns: confidence > 30 ? 15 : confidence > 25 ? 12 : 10,
            analysis: {
                sampleSize: digits.length,
                digitFrequency: frequency,
                reason: `Digit ${maxDigit} appeared ${maxCount}/${digits.length} times (${confidence.toFixed(1)}%)`,
            },
        } as Partial<DigitHackerSignal> as DigitHackerSignal;
    };

    // Analyze OVER/UNDER pattern
    const analyzeOverUnder = (ticks: number[]): DigitHackerSignal | null => {
        const digits = ticks.map(getLastDigit);

        // OVER range: 4, 5, 6, 7
        // UNDER range: 2, 3, 4, 5
        const overDigits = [4, 5, 6, 7];
        const underDigits = [2, 3, 4, 5];

        const overCount = digits.filter(d => overDigits.includes(d)).length;
        const underCount = digits.filter(d => underDigits.includes(d)).length;

        const overPercentage = (overCount / digits.length) * 100;
        const underPercentage = (underCount / digits.length) * 100;

        let type: 'OVER' | 'UNDER' | null = null;
        let digit: number | undefined;
        let confidence: number;
        let reason: string;
        let recommendedRuns: number;

        // Signal OVER if ratio > 58%
        if (overPercentage > 58) {
            type = 'OVER';
            // Choose specific digit: prefer 6 or 7 for OVER
            digit = 6;
            confidence = overPercentage;
            reason = `${overCount}/${digits.length} digits in OVER range (${overPercentage.toFixed(1)}%). Trade OVER ${digit}`;
            recommendedRuns = confidence > 85 ? 15 : confidence > 70 ? 13 : 11;
        }
        // Signal UNDER if ratio < 42%
        else if (underPercentage < 42) {
            type = 'UNDER';
            // Choose specific digit: prefer 3 or 2 for UNDER
            digit = 3;
            confidence = 100 - underPercentage; // Inverse for confidence
            reason = `${underCount}/${digits.length} digits in UNDER range (${underPercentage.toFixed(1)}%). Trade UNDER ${digit}`;
            recommendedRuns = confidence > 85 ? 15 : confidence > 70 ? 13 : 11;
        } else {
            return null; // No clear signal
        }

        return {
            type,
            predictionType: 'OVER_UNDER',
            digit,
            confidencePercentage: Math.round(confidence),
            confidence: getConfidenceLevel(confidence),
            recommendedRuns,
            analysis: {
                sampleSize: digits.length,
                overCount,
                underCount,
                ratio: overPercentage,
                reason,
            },
        } as Partial<DigitHackerSignal> as DigitHackerSignal;
    };

    // Analyze market and generate all three types of signals
    const analyzeMarket = async (market: string, marketLabel: string) => {
        try {
            console.log(`🎯 DigitHacker: Analyzing ${marketLabel}...`);

            if (!derivAPIService) {
                console.error('❌ DigitHacker: derivAPIService not available');
                return;
            }

            const ticks: number[] = [];
            let tickCount = 0;
            const maxTicks = 30; // Analyze last 30 ticks
            let subscriptionId: string | undefined;

            subscriptionId = await derivAPIService.subscribeToTicks(market, tickData => {
                if (tickData?.tick?.quote) {
                    ticks.push(tickData.tick.quote);
                    tickCount++;

                    if (tickCount >= maxTicks) {
                        if (subscriptionId) {
                            derivAPIService.unsubscribe(subscriptionId);
                        }
                        generateSignals(market, marketLabel, ticks);
                    }
                }
            });

            // Timeout after 30 seconds
            setTimeout(() => {
                if (tickCount < maxTicks) {
                    if (subscriptionId) {
                        derivAPIService.unsubscribe(subscriptionId);
                    }
                    if (tickCount >= 20) {
                        console.log(`⚠️ DigitHacker: Using ${tickCount} ticks for ${marketLabel}`);
                        generateSignals(market, marketLabel, ticks);
                    }
                }
            }, 30000);
        } catch (error) {
            console.error(`❌ DigitHacker: Error analyzing ${marketLabel}:`, error);
        }
    };

    // Generate all three types of signals
    const generateSignals = (market: string, marketLabel: string, ticks: number[]) => {
        const newSignals: DigitHackerSignal[] = [];
        const currentPrice = ticks[ticks.length - 1];
        const baseTimestamp = Date.now();

        // 1. EVEN/ODD Signal
        const evenOddSignal = analyzeEvenOdd(ticks);
        if (evenOddSignal) {
            newSignals.push({
                ...evenOddSignal,
                id: `digithacker-evenodd-${market}-${baseTimestamp}`,
                timestamp: baseTimestamp,
                market,
                marketDisplay: marketLabel,
                entry: currentPrice,
                duration: '5 ticks',
                strategy: 'Digit Hacker AI - EVEN/ODD',
                source: 'digithacker',
                countdown: 10, // 10 seconds countdown
                status: 'WAITING',
                expiresAt: baseTimestamp + 60000, // 60 seconds validity
                remainingSeconds: 60,
            });
        }

        // 2. Digit Matches Signal
        const matchesSignal = analyzeDigitMatches(ticks);
        if (matchesSignal) {
            newSignals.push({
                ...matchesSignal,
                id: `digithacker-matches-${market}-${baseTimestamp}`,
                timestamp: baseTimestamp + 1,
                market,
                marketDisplay: marketLabel,
                entry: currentPrice,
                duration: '5 ticks',
                strategy: 'Digit Hacker AI - Digit Matches',
                source: 'digithacker',
                countdown: 10,
                status: 'WAITING',
                expiresAt: baseTimestamp + 60000,
                remainingSeconds: 60,
            });
        }

        // 3. OVER/UNDER Signal
        const overUnderSignal = analyzeOverUnder(ticks);
        if (overUnderSignal) {
            newSignals.push({
                ...overUnderSignal,
                id: `digithacker-overunder-${market}-${baseTimestamp}`,
                timestamp: baseTimestamp + 2,
                market,
                marketDisplay: marketLabel,
                entry: currentPrice,
                duration: '5 ticks',
                strategy: 'Digit Hacker AI - OVER/UNDER',
                source: 'digithacker',
                countdown: 10,
                status: 'WAITING',
                expiresAt: baseTimestamp + 60000,
                remainingSeconds: 60,
            });
        }

        if (newSignals.length > 0) {
            setSignals(prev => {
                const updated = [...newSignals, ...prev].slice(0, 50);
                console.log(`🎯 DigitHacker: Generated ${newSignals.length} signals for ${marketLabel}`);
                if (onSignalsUpdate) {
                    onSignalsUpdate(updated);
                }
                return updated;
            });
        }
    };

    // Scan all markets
    const scanAllMarkets = async () => {
        setIsScanning(true);
        console.log('🎯 DigitHacker: Scanning all markets...');

        const scanPromises = markets.map(market =>
            analyzeMarket(market.value, market.label).catch(error => {
                console.error(`Error analyzing ${market.label}:`, error);
            })
        );

        await Promise.all(scanPromises);

        setIsScanning(false);
        console.log('✅ DigitHacker: Scan complete');
    };

    // Auto-scan on mount when connected
    useEffect(() => {
        // CONNECTION_STATUS.OPENED means connected
        if (connectionStatus !== CONNECTION_STATUS.OPENED) {
            console.log('⏳ DigitHacker: Waiting for connection... Status:', connectionStatus);
            return;
        }

        console.log('✅ DigitHacker: Connected! Starting scans...');

        const initialScan = setTimeout(() => {
            console.log('🎯 DigitHacker: Starting initial scan...');
            scanAllMarkets();
        }, 2000);

        const interval = setInterval(() => {
            console.log('🎯 DigitHacker: Starting periodic scan...');
            scanAllMarkets();
        }, 120000); // Every 2 minutes

        return () => {
            clearTimeout(initialScan);
            clearInterval(interval);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [connectionStatus]);

    // Countdown and expiry timer
    useEffect(() => {
        const timer = setInterval(() => {
            const now = Date.now();
            setSignals(prev =>
                prev.map(signal => {
                    // Update countdown
                    if (signal.countdown > 0) {
                        const newCountdown = signal.countdown - 1;
                        return {
                            ...signal,
                            countdown: newCountdown,
                            status: newCountdown === 0 ? 'READY' : 'WAITING',
                        };
                    }

                    // Update expiry
                    if (signal.expiresAt) {
                        const remaining = Math.max(0, Math.floor((signal.expiresAt - now) / 1000));
                        if (remaining === 0 && signal.status !== 'EXPIRED') {
                            return { ...signal, status: 'EXPIRED', remainingSeconds: 0 };
                        }
                        return { ...signal, remainingSeconds: remaining };
                    }

                    return signal;
                })
            );
            forceUpdate({});
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className='digithacker-signals'>
            <div className='digithacker-signals-list'>
                {connectionStatus !== CONNECTION_STATUS.OPENED && (
                    <div className='no-signals'>
                        <span className='no-signals-icon'>🔌</span>
                        <p>Please log in to your Deriv account to start generating signals.</p>
                        <p className='hint'>Click "Log in" in the top right corner</p>
                    </div>
                )}

                {connectionStatus === CONNECTION_STATUS.OPENED && signals.length === 0 && !isScanning && (
                    <div className='no-signals'>
                        <span className='no-signals-icon'>🎯</span>
                        <p>No Digit Hacker signals yet. AI is analyzing markets...</p>
                        <button className='scan-btn-inline' onClick={scanAllMarkets}>
                            🔄 Start Scanning
                        </button>
                    </div>
                )}

                {isScanning && signals.length === 0 && (
                    <div className='scanning-message'>
                        <span className='scanning-icon'>🔍</span>
                        <p>Analyzing 30 ticks per market for AI predictions...</p>
                        <p className='scanning-progress'>This may take 30-60 seconds per market</p>
                    </div>
                )}

                {(() => {
                    // Filter signals based on activeFilter
                    const filteredSignals = signals.filter(signal => {
                        if (activeFilter === 'ALL') return true;
                        return signal.predictionType === activeFilter;
                    });

                    // Show filter message if no signals match
                    if (signals.length > 0 && filteredSignals.length === 0) {
                        return (
                            <div className='no-signals'>
                                <span className='no-signals-icon'>🔍</span>
                                <p>No {activeFilter.replace('_', ' ')} signals available.</p>
                                <p className='hint'>Try selecting a different filter or wait for new signals</p>
                            </div>
                        );
                    }

                    return (
                        <div className='signals-grid'>
                            {filteredSignals
                                .sort((a, b) => b.timestamp - a.timestamp)
                                .map(signal => (
                                    <div
                                        key={signal.id}
                                        className={`signal-card-modern ${signal.status.toLowerCase()}`}
                                    >
                                        <div className='card-header'>
                                            <div className='market-label'>{signal.marketDisplay}</div>
                                            {signal.status === 'EXPIRED' && (
                                                <div className='status-badge expired'>EXPIRED</div>
                                            )}
                                        </div>

                                        <div className='signal-circle'>
                                            <div className='circle-content'>
                                                <div className='signal-type-text'>
                                                    {signal.type}
                                                    {signal.digit !== undefined && (
                                                        <span className='digit-value'> {signal.digit}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {signal.status === 'READY' && (
                                            <div className='entry-now-badge'>
                                                <span>ENTRY NOW</span>
                                                <span className='rocket-icon'>🚀</span>
                                            </div>
                                        )}

                                        {signal.status === 'WAITING' && (
                                            <div className='countdown-badge'>
                                                <span>Entry in {signal.countdown}s</span>
                                            </div>
                                        )}

                                        <div className='confidence-display'>
                                            <span className='confidence-label'>Confidence:</span>
                                            <span className='confidence-value'>{signal.confidencePercentage}%</span>
                                        </div>

                                        {signal.remainingSeconds !== undefined && signal.status !== 'EXPIRED' && (
                                            <div className='validity-timer'>
                                                <span>⏱️ {signal.remainingSeconds}s remaining</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                        </div>
                    );
                })()}
            </div>
        </div>
    );
};
