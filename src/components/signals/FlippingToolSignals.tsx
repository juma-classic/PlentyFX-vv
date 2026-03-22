import React, { useEffect, useState } from 'react';
import { derivAPIService } from '@/services/deriv-api.service';
import { PatternDisplay } from './PatternDisplay';
import './SignalCards.scss';

interface DigitStats {
    digit: number;
    percentage: number;
    count: number;
}

interface FlippingSignal {
    id: string;
    timestamp: number;
    market: string;
    marketDisplay: string;
    type: 'OVER3' | 'UNDER6';
    entry: number;
    duration: string;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    strategy: string;
    source: string;
    status: 'ACTIVE' | 'WON' | 'LOST' | 'EXPIRED';
    digitStats: DigitStats[];
    recommendedEntry: {
        digit: number;
        reason: string;
        confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    };
    lowDigits: number[];
    entryDigit?: number;
    recentPattern?: ('OVER' | 'UNDER')[];
}

export const FlippingToolSignals: React.FC<{ onSignalsUpdate?: (signals: FlippingSignal[]) => void }> = ({
    onSignalsUpdate,
}) => {
    const [signals, setSignals] = useState<FlippingSignal[]>([]);
    const [isScanning, setIsScanning] = useState(false);

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

    // Analyze digit distribution from tick data
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

    // Determine best entry based on flipping strategy
    const getBestEntry = (
        digitStats: DigitStats[]
    ): { entry: FlippingSignal['recommendedEntry']; type: 'OVER3' | 'UNDER6' } => {
        // Get digit percentages
        const digit3 = digitStats[3];
        const digit6 = digitStats[6];

        // For OVER 3: Check if digits 0,1,2,3 are underrepresented (cold)
        const over3ColdDigits = [0, 1, 2, 3];
        const over3HotDigits = [4, 5, 6, 7, 8, 9];

        // For UNDER 6: Check if digits 6,7,8,9 are underrepresented (cold)
        const under6ColdDigits = [6, 7, 8, 9];
        const under6HotDigits = [0, 1, 2, 3, 4, 5];

        // Calculate average percentages
        const over3ColdAvg =
            over3ColdDigits.reduce((sum, d) => sum + digitStats[d].percentage, 0) / over3ColdDigits.length;
        const over3HotAvg =
            over3HotDigits.reduce((sum, d) => sum + digitStats[d].percentage, 0) / over3HotDigits.length;

        const under6ColdAvg =
            under6ColdDigits.reduce((sum, d) => sum + digitStats[d].percentage, 0) / under6ColdDigits.length;
        const under6HotAvg =
            under6HotDigits.reduce((sum, d) => sum + digitStats[d].percentage, 0) / under6HotDigits.length;

        // Calculate imbalance (how much hot digits are overrepresented)
        const over3Imbalance = over3HotAvg - over3ColdAvg;
        const under6Imbalance = under6HotAvg - under6ColdAvg;

        let recommendedDigit: number;
        let reason: string;
        let confidence: 'HIGH' | 'MEDIUM' | 'LOW';
        let type: 'OVER3' | 'UNDER6';

        // HIGH CONFIDENCE OVER 3: Strong imbalance + digit 3 is very cold
        if (over3Imbalance >= 2.5 && digit3.percentage < 8.5 && over3ColdAvg < 9.0) {
            recommendedDigit = 3;
            reason = `HIGH: OVER 3 signal. Digit 3: ${digit3.percentage.toFixed(1)}%, Cold avg: ${over3ColdAvg.toFixed(1)}%, Hot avg: ${over3HotAvg.toFixed(1)}%. Strong imbalance ${over3Imbalance.toFixed(1)}%. Recovery: UNDER 6.`;
            confidence = 'HIGH';
            type = 'OVER3';
        }
        // HIGH CONFIDENCE UNDER 6: Strong imbalance + digit 6 is very cold
        else if (under6Imbalance >= 2.5 && digit6.percentage < 8.5 && under6ColdAvg < 9.0) {
            recommendedDigit = 6;
            reason = `HIGH: UNDER 6 signal. Digit 6: ${digit6.percentage.toFixed(1)}%, Cold avg: ${under6ColdAvg.toFixed(1)}%, Hot avg: ${under6HotAvg.toFixed(1)}%. Strong imbalance ${under6Imbalance.toFixed(1)}%. Recovery: OVER 3.`;
            confidence = 'HIGH';
            type = 'UNDER6';
        }
        // MEDIUM CONFIDENCE OVER 3: Moderate imbalance + digit 3 is cold
        else if (over3Imbalance >= 1.5 && digit3.percentage < 9.0 && over3ColdAvg < 9.5) {
            recommendedDigit = 3;
            reason = `MEDIUM: OVER 3 signal. Digit 3: ${digit3.percentage.toFixed(1)}%, Cold avg: ${over3ColdAvg.toFixed(1)}%, Hot avg: ${over3HotAvg.toFixed(1)}%. Imbalance ${over3Imbalance.toFixed(1)}%. Recovery: UNDER 6.`;
            confidence = 'MEDIUM';
            type = 'OVER3';
        }
        // MEDIUM CONFIDENCE UNDER 6: Moderate imbalance + digit 6 is cold
        else if (under6Imbalance >= 1.5 && digit6.percentage < 9.0 && under6ColdAvg < 9.5) {
            recommendedDigit = 6;
            reason = `MEDIUM: UNDER 6 signal. Digit 6: ${digit6.percentage.toFixed(1)}%, Cold avg: ${under6ColdAvg.toFixed(1)}%, Hot avg: ${under6HotAvg.toFixed(1)}%. Imbalance ${under6Imbalance.toFixed(1)}%. Recovery: OVER 3.`;
            confidence = 'MEDIUM';
            type = 'UNDER6';
        }
        // NO SIGNAL - Conditions not met
        else {
            return {
                entry: {
                    digit: -1,
                    reason: `Waiting for optimal conditions. OVER 3 imbalance: ${over3Imbalance.toFixed(1)}% (need ≥1.5%), Digit 3: ${digit3.percentage.toFixed(1)}% (need <9.0%). UNDER 6 imbalance: ${under6Imbalance.toFixed(1)}% (need ≥1.5%), Digit 6: ${digit6.percentage.toFixed(1)}% (need <9.0%).`,
                    confidence: 'LOW',
                },
                type: 'OVER3',
            };
        }

        return {
            entry: {
                digit: recommendedDigit,
                reason,
                confidence,
            },
            type,
        };
    };

    // Scan all markets automatically
    const scanAllMarkets = async () => {
        setIsScanning(true);
        console.log('🔄 Flipping Tool: Scanning all markets...');

        for (const market of markets) {
            try {
                await analyzeMarket(market.value, market.label);
                // Small delay between markets
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                console.error(`Error analyzing ${market.label}:`, error);
            }
        }

        setIsScanning(false);
        console.log('✅ Flipping Tool: Scan complete');
    };

    // Fetch and analyze market data
    const analyzeMarket = async (market: string, marketLabel: string) => {
        try {
            const ticks: number[] = [];
            let tickCount = 0;
            const maxTicks = 100;

            // Subscribe to ticks and collect data
            const unsubscribe = await derivAPIService.subscribeToTicks(market, tickData => {
                if (tickData?.tick?.quote) {
                    ticks.push(tickData.tick.quote);
                    tickCount++;

                    if (tickCount >= maxTicks) {
                        unsubscribe();
                        generateSignal(market, marketLabel, ticks);
                    }
                }
            });

            // Timeout after 20 seconds
            setTimeout(() => {
                if (tickCount < maxTicks) {
                    unsubscribe();
                    if (tickCount > 30) {
                        generateSignal(market, marketLabel, ticks);
                    }
                }
            }, 20000);
        } catch (error) {
            console.error('Error analyzing market:', error);
        }
    };

    // Generate signal from collected ticks
    const generateSignal = (market: string, marketLabel: string, ticks: number[]) => {
        const digitStats = analyzeDigitDistribution(ticks);
        const { entry: recommendedEntry, type } = getBestEntry(digitStats);
        const lowDigits = [0, 1, 2, 7, 8, 9].filter(d => digitStats[d].percentage < 10.2);

        // Only generate signal if conditions are met
        if (recommendedEntry.digit < 0) {
            return;
        }

        // Generate pattern for OVER 3 / UNDER 6
        const predictionDigit = recommendedEntry.digit;
        const recentPattern = ticks.slice(-18).map((tick: number) => {
            const lastDigit = Math.abs(Math.floor(tick * 100)) % 10;
            return lastDigit > predictionDigit ? 'OVER' : 'UNDER';
        }) as ('OVER' | 'UNDER')[];

        const newSignal: FlippingSignal = {
            id: `flip-${market}-${Date.now()}`,
            timestamp: Date.now(),
            market,
            marketDisplay: marketLabel,
            type,
            entry: ticks[ticks.length - 1] || 0,
            duration: '5 ticks',
            confidence: recommendedEntry.confidence,
            strategy: 'Flipping Tool: OVER 3 → UNDER 6',
            source: 'flipping',
            status: 'ACTIVE',
            digitStats,
            recommendedEntry,
            lowDigits,
            entryDigit: recommendedEntry.digit,
            recentPattern,
        };

        setSignals(prev => {
            const updated = [newSignal, ...prev].slice(0, 50);
            if (onSignalsUpdate) {
                onSignalsUpdate(updated);
            }
            return updated;
        });
    };

    // Auto-scan on mount and periodically
    useEffect(() => {
        // Initial scan
        scanAllMarkets();

        // Periodic scan every 2 minutes
        const interval = setInterval(() => {
            scanAllMarkets();
        }, 120000);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className='flipping-tool-signals'>
            <div className='flipping-header'>
                <div className='header-content'>
                    <h3>🔄 Flipping Tool Signals</h3>
                    <p className='flipping-description'>
                        Auto-scanning for OVER 3 → UNDER 6 opportunities. HIGH: all 0,1,2,7,8,9 &lt; 10.2% | MEDIUM: 2+
                        of 0,1,2 and 2+ of 7,8,9 &lt; 10.5%
                    </p>
                </div>
                <button className='scan-btn' onClick={scanAllMarkets} disabled={isScanning}>
                    {isScanning ? '⏳ Scanning...' : '🔄 Scan All Markets'}
                </button>
            </div>

            <div className='flipping-signals-list'>
                {signals.length === 0 && !isScanning && (
                    <div className='no-signals'>
                        <span className='no-signals-icon'>📭</span>
                        <p>No flipping signals yet. Scanning markets automatically...</p>
                    </div>
                )}

                {isScanning && signals.length === 0 && (
                    <div className='scanning-message'>
                        <span className='scanning-icon'>🔍</span>
                        <p>Scanning all volatility markets for optimal entry conditions...</p>
                    </div>
                )}

                {signals.map(signal => (
                    <div key={signal.id} className='signal-card flipping-signal-card'>
                        <div className='signal-header'>
                            <div className='signal-type-badge'>
                                <span className='badge-icon'>🔄</span>
                                <span className='badge-text'>{signal.type}</span>
                            </div>
                            <div className={`confidence-badge ${signal.confidence.toLowerCase()}`}>
                                {signal.confidence}
                            </div>
                        </div>

                        <div className='signal-market'>
                            <span className='market-icon'>📊</span>
                            <span className='market-name'>{signal.marketDisplay}</span>
                        </div>

                        <div className='signal-entry'>
                            <span className='entry-label'>Entry:</span>
                            <span className='entry-value'>{signal.entry.toFixed(2)}</span>
                        </div>

                        <div className='flipping-strategy'>
                            <div className='strategy-title'>🎯 Flipping Strategy</div>
                            <div className='strategy-flow'>
                                <span className='strategy-step'>OVER 3</span>
                                <span className='strategy-arrow'>→</span>
                                <span className='strategy-step'>UNDER 6</span>
                            </div>
                            <div className='strategy-reason'>{signal.recommendedEntry.reason}</div>
                        </div>

                        {signal.recentPattern && signal.recentPattern.length > 0 && (
                            <PatternDisplay pattern={signal.recentPattern} type='overunder' />
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
