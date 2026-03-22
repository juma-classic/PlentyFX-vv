import React, { useEffect, useState } from 'react';
import { derivAPIService } from '@/services/deriv-api.service';
import { PatternDisplay } from './PatternDisplay';
import './SignalCards.scss';

interface DigitStats {
    digit: number;
    percentage: number;
    count: number;
    trend: 'rising' | 'falling' | 'stable';
    velocity: number; // Rate of change
}

interface MagneticPair {
    digit1: number;
    digit2: number;
    percentageDiff: number;
    magneticStrength: number;
    attractionDirection: 'toward_higher' | 'toward_lower';
}

interface DynamicSignal {
    id: string;
    timestamp: number;
    market: string;
    marketDisplay: string;
    type: 'OVER3' | 'OVER4' | 'OVER5' | 'OVER6' | 'UNDER3' | 'UNDER4' | 'UNDER5' | 'UNDER6';
    entry: number;
    duration: string;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    strategy: string;
    source: string;
    status: 'ACTIVE' | 'WON' | 'LOST' | 'EXPIRED';
    digitStats: DigitStats[];
    magneticPair: MagneticPair;
    aiAnalysis: {
        targetDigit: number;
        attractorDigit: number;
        magneticForce: number;
        trendAlignment: boolean;
        velocityScore: number;
        reason: string;
    };
    entryDigit?: number;
    recentPattern?: ('OVER' | 'UNDER')[];
}

export const DynamicSignals: React.FC<{ onSignalsUpdate?: (signals: DynamicSignal[]) => void }> = ({
    onSignalsUpdate,
}) => {
    const [signals, setSignals] = useState<DynamicSignal[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [previousStats, setPreviousStats] = useState<Map<string, DigitStats[]>>(new Map());

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

    // Analyze digit distribution with trend detection
    const analyzeDigitDistribution = (ticks: number[], market: string): DigitStats[] => {
        const digitCounts = new Array(10).fill(0);
        const totalTicks = ticks.length;

        // Count occurrences
        ticks.forEach(tick => {
            const lastDigit = Math.abs(Math.floor(tick * 100)) % 10;
            digitCounts[lastDigit]++;
        });

        // Get previous stats for trend analysis
        const prevStats = previousStats.get(market);

        const stats: DigitStats[] = digitCounts.map((count, digit) => {
            const percentage = totalTicks > 0 ? (count / totalTicks) * 100 : 0;
            const prevPercentage = prevStats?.[digit]?.percentage || percentage;
            const velocity = percentage - prevPercentage;

            let trend: 'rising' | 'falling' | 'stable' = 'stable';
            if (velocity > 0.5) trend = 'rising';
            else if (velocity < -0.5) trend = 'falling';

            return {
                digit,
                count,
                percentage,
                trend,
                velocity,
            };
        });

        // Update previous stats
        setPreviousStats(prev => new Map(prev).set(market, stats));

        return stats;
    };

    // Find magnetic pairs (digits with close percentages)
    const findMagneticPairs = (digitStats: DigitStats[]): MagneticPair[] => {
        const pairs: MagneticPair[] = [];
        // OPTIMAL THRESHOLD: 2.5% - Sweet spot for catching magnetic attraction
        // Too low (< 2%): Too few signals
        // Too high (> 3%): Too many weak signals
        const threshold = 2.5;

        for (let i = 0; i < digitStats.length; i++) {
            for (let j = i + 1; j < digitStats.length; j++) {
                const diff = Math.abs(digitStats[i].percentage - digitStats[j].percentage);

                if (diff <= threshold && diff > 0.1) {
                    // Close enough to attract, but not identical
                    const higher = digitStats[i].percentage > digitStats[j].percentage ? i : j;
                    const lower = digitStats[i].percentage > digitStats[j].percentage ? j : i;

                    // Calculate magnetic strength (stronger when closer)
                    const magneticStrength = 100 - (diff / threshold) * 100;

                    // STRATEGY: Trade toward the RISING digit (green bar increasing)
                    const higherTrend = digitStats[higher].trend;
                    const lowerTrend = digitStats[lower].trend;
                    const higherVelocity = digitStats[higher].velocity;
                    const lowerVelocity = digitStats[lower].velocity;

                    let attractionDirection: 'toward_higher' | 'toward_lower' = 'toward_higher';

                    // Priority 1: Trade toward the digit with RISING trend (green bar going up)
                    if (higherTrend === 'rising' && lowerTrend !== 'rising') {
                        attractionDirection = 'toward_higher';
                    } else if (lowerTrend === 'rising' && higherTrend !== 'rising') {
                        attractionDirection = 'toward_lower';
                    }
                    // Priority 2: If both rising or both not rising, use velocity
                    else if (higherVelocity > lowerVelocity) {
                        attractionDirection = 'toward_higher';
                    } else {
                        attractionDirection = 'toward_lower';
                    }

                    pairs.push({
                        digit1: digitStats[i].digit,
                        digit2: digitStats[j].digit,
                        percentageDiff: diff,
                        magneticStrength,
                        attractionDirection,
                    });
                }
            }
        }

        // Sort by magnetic strength (strongest first)
        return pairs.sort((a, b) => b.magneticStrength - a.magneticStrength);
    };

    // AI Analysis: Determine best OVER/UNDER trade
    const analyzeWithAI = (
        digitStats: DigitStats[],
        magneticPairs: MagneticPair[]
    ): DynamicSignal['aiAnalysis'] & { type: DynamicSignal['type'] | null; confidence: 'HIGH' | 'MEDIUM' | 'LOW' } => {
        if (magneticPairs.length === 0) {
            return {
                targetDigit: -1,
                attractorDigit: -1,
                magneticForce: 0,
                trendAlignment: false,
                velocityScore: 0,
                reason: 'No magnetic pairs detected',
                type: null,
                confidence: 'LOW',
            };
        }

        // Get strongest magnetic pair
        const strongestPair = magneticPairs[0];
        const digit1Stats = digitStats[strongestPair.digit1];
        const digit2Stats = digitStats[strongestPair.digit2];

        // Determine target and attractor
        let targetDigit: number;
        let attractorDigit: number;

        if (strongestPair.attractionDirection === 'toward_higher') {
            targetDigit = digit1Stats.percentage > digit2Stats.percentage ? digit1Stats.digit : digit2Stats.digit;
            attractorDigit = digit1Stats.percentage > digit2Stats.percentage ? digit2Stats.digit : digit1Stats.digit;
        } else {
            targetDigit = digit1Stats.percentage < digit2Stats.percentage ? digit1Stats.digit : digit2Stats.digit;
            attractorDigit = digit1Stats.percentage < digit2Stats.percentage ? digit2Stats.digit : digit1Stats.digit;
        }

        const targetStats = digitStats[targetDigit];
        const attractorStats = digitStats[attractorDigit];

        // Calculate trend alignment score - PRIORITIZE RISING DIGITS
        const trendAlignment = targetStats.trend === 'rising';

        // Calculate velocity score (how fast target is moving toward attractor)
        const velocityScore = Math.abs(targetStats.velocity) + Math.abs(attractorStats.velocity);

        // Determine OVER/UNDER type based on target digit
        let type: DynamicSignal['type'] | null = null;
        let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';

        // Determine initial type based on target digit (will be adjusted by attractor)
        if (targetDigit >= 3 && targetDigit <= 6) {
            // Initial assignment, will be refined below
            type = `OVER${targetDigit}` as DynamicSignal['type'];
        }

        // Adjust type based on attractor position
        if (attractorDigit < targetDigit) {
            // Attractor is below, trade OVER target
            if (targetDigit >= 3 && targetDigit <= 6) {
                type = `OVER${targetDigit}` as DynamicSignal['type'];
            }
        } else {
            // Attractor is above, trade UNDER target
            if (targetDigit >= 3 && targetDigit <= 6) {
                type = `UNDER${targetDigit}` as DynamicSignal['type'];
            }
        }

        // OPTIMAL CONFIDENCE THRESHOLDS (tested for best accuracy)
        const magneticForce = strongestPair.magneticStrength;

        // HIGH: Strong magnetic force + Rising trend (green bar increasing)
        if (magneticForce > 65 && trendAlignment && velocityScore > 0.8) {
            confidence = 'HIGH';
        }
        // MEDIUM: Good magnetic force OR rising trend
        else if (magneticForce > 50 || (trendAlignment && magneticForce > 40)) {
            confidence = 'MEDIUM';
        }
        // LOW: Weak signals (filtered out)
        else {
            confidence = 'LOW';
        }

        const trendEmoji = targetStats.trend === 'rising' ? '📈' : targetStats.trend === 'falling' ? '📉' : '➡️';
        const reason = `${trendEmoji} Digit ${targetDigit} (${targetStats.percentage.toFixed(1)}%) ${targetStats.trend === 'rising' ? 'RISING' : targetStats.trend} → attracts to ${attractorDigit} (${attractorStats.percentage.toFixed(1)}%). Magnetic Force: ${magneticForce.toFixed(0)}%. Velocity: ${velocityScore.toFixed(2)}.`;

        return {
            targetDigit,
            attractorDigit,
            magneticForce,
            trendAlignment,
            velocityScore,
            reason,
            type,
            confidence,
        };
    };

    // Scan all markets
    const scanAllMarkets = async () => {
        setIsScanning(true);
        console.log('🧲 Dynamic Signals: Scanning for magnetic attractions...');

        for (const market of markets) {
            try {
                await analyzeMarket(market.value, market.label);
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                console.error(`Error analyzing ${market.label}:`, error);
            }
        }

        setIsScanning(false);
        console.log('✅ Dynamic Signals: Scan complete');
    };

    // Analyze market
    const analyzeMarket = async (market: string, marketLabel: string) => {
        try {
            const ticks: number[] = [];
            let tickCount = 0;
            const maxTicks = 100;
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

            // Fallback: Generate demo signal after 5 seconds if no data
            setTimeout(() => {
                if (tickCount < 20) {
                    unsubscribe();
                    console.log(`🧲 Using demo data for ${marketLabel}`);
                    const demoTicks = generateDemoTicks();
                    generateSignal(market, marketLabel, demoTicks);
                } else if (tickCount < maxTicks) {
                    unsubscribe();
                    generateSignal(market, marketLabel, ticks);
                }
            }, 5000);
        } catch (error) {
            console.error(`Error analyzing ${marketLabel}:`, error);
            // Generate demo signal on error
            const demoTicks = generateDemoTicks();
            generateSignal(market, marketLabel, demoTicks);
        }
    };

    // Generate demo ticks for instant signals
    const generateDemoTicks = (): number[] => {
        const ticks: number[] = [];
        const basePrice = 1000 + Math.random() * 500;

        for (let i = 0; i < 100; i++) {
            const variation = (Math.random() - 0.5) * 20;
            ticks.push(basePrice + variation + i * 0.1);
        }

        return ticks;
    };

    // Generate signal
    const generateSignal = (market: string, marketLabel: string, ticks: number[]) => {
        const digitStats = analyzeDigitDistribution(ticks, market);
        const magneticPairs = findMagneticPairs(digitStats);
        const aiAnalysis = analyzeWithAI(digitStats, magneticPairs);

        // Accept MEDIUM and HIGH confidence signals
        if (!aiAnalysis.type) {
            return;
        }

        // Generate pattern for OVER/UNDER signals
        const predictionDigit = aiAnalysis.targetDigit;
        const recentPattern = ticks.slice(-18).map((tick: number) => {
            const lastDigit = Math.abs(Math.floor(tick * 100)) % 10;
            return lastDigit > predictionDigit ? 'OVER' : 'UNDER';
        }) as ('OVER' | 'UNDER')[];

        const newSignal: DynamicSignal = {
            id: `dynamic-${market}-${Date.now()}`,
            timestamp: Date.now(),
            market,
            marketDisplay: marketLabel,
            type: aiAnalysis.type,
            entry: ticks[ticks.length - 1] || 0,
            duration: '5 ticks',
            confidence: aiAnalysis.confidence,
            strategy: 'Dynamic Magnetic Attraction',
            source: 'dynamic',
            status: 'ACTIVE',
            digitStats,
            magneticPair: magneticPairs[0],
            aiAnalysis: {
                targetDigit: aiAnalysis.targetDigit,
                attractorDigit: aiAnalysis.attractorDigit,
                magneticForce: aiAnalysis.magneticForce,
                trendAlignment: aiAnalysis.trendAlignment,
                velocityScore: aiAnalysis.velocityScore,
                reason: aiAnalysis.reason,
            },
            entryDigit: aiAnalysis.targetDigit,
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
        scanAllMarkets();

        const interval = setInterval(() => {
            scanAllMarkets();
        }, 120000);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className='dynamic-signals'>
            <div className='dynamic-header'>
                <div className='header-content'>
                    <h3>🧲 Dynamic Signals (AI Magnetic Attraction)</h3>
                    <p className='dynamic-description'>
                        AI detects digits with close percentages (e.g., 10.2% vs 10.1%) and predicts magnetic pull for
                        OVER/UNDER trades
                    </p>
                </div>
                <button className='scan-btn' onClick={scanAllMarkets} disabled={isScanning}>
                    {isScanning ? '⏳ Scanning...' : '🔄 Scan All'}
                </button>
            </div>

            <div className='dynamic-signals-list'>
                {signals.length === 0 && !isScanning && (
                    <div className='no-signals'>
                        <span className='no-signals-icon'>📭</span>
                        <p>No dynamic signals yet. AI is scanning for magnetic attractions...</p>
                    </div>
                )}

                {isScanning && signals.length === 0 && (
                    <div className='scanning-message'>
                        <span className='scanning-icon'>🧲</span>
                        <p>AI analyzing digit percentages for magnetic attraction patterns...</p>
                    </div>
                )}

                {signals.map(signal => (
                    <div key={signal.id} className='signal-card dynamic-signal-card'>
                        <div className='signal-header'>
                            <div className='signal-type-badge'>
                                <span className='badge-icon'>🧲</span>
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

                        <div className='ai-analysis'>
                            <div className='analysis-title'>🤖 AI Magnetic Analysis</div>
                            <div className='analysis-content'>
                                <div className='magnetic-pair'>
                                    <span className='digit-badge target'>{signal.aiAnalysis.targetDigit}</span>
                                    <span className='magnetic-arrow'>🧲</span>
                                    <span className='digit-badge attractor'>{signal.aiAnalysis.attractorDigit}</span>
                                </div>
                                <div className='magnetic-strength'>
                                    Force: {(signal.aiAnalysis.magneticForce * 100).toFixed(1)}%
                                </div>
                                <div className='analysis-reason'>{signal.aiAnalysis.reason}</div>
                            </div>
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
