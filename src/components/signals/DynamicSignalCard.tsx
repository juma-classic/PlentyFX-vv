import React, { useEffect, useMemo, useState } from 'react';
import type { PatternAlert } from '../../hooks/useLiveTickData';
import { useLiveTickData } from '../../hooks/useLiveTickData';
import type { StreakMilestone } from '../../hooks/useStreakCounter';
import { ConnectionType, derivConnectionPool } from '../../services/deriv-connection-pool.service';
import { patternPredictor } from '../../services/pattern-predictor.service';
import { EnhancedCountdownTimer } from './EnhancedCountdownTimer';
import { EnhancedTradeButton } from './EnhancedTradeButton';
import { LivePatternDisplay } from './LivePatternDisplay';
import { MovableLiveTickOverlay } from './MovableLiveTickOverlay';
import { PredictionDisplay } from './PredictionDisplay';
import { StreakCounter } from './StreakCounter';
import './DynamicSignalCard.scss';

interface TradeSignal {
    market: string;
    type: string;
    confidence: number;
    stake: number;
    prediction: string;
}

interface DynamicSignalCardProps {
    market: string;
    marketLabel: string;
    signalType?: 'EVEN_ODD' | 'OVER_UNDER' | 'RISE_FALL';
    onTradeSignal?: (signal: TradeSignal) => void;
}

export const DynamicSignalCard: React.FC<DynamicSignalCardProps> = ({
    market,
    marketLabel,
    signalType = 'OVER_UNDER',
    onTradeSignal,
}) => {
    const { ticks, alerts, isConnected, latestTick } = useLiveTickData(market, true);
    const [flashAlert, setFlashAlert] = useState(false);
    const [prediction, setPrediction] = useState<{ digit: number; confidence: number } | null>(null);
    const [patternStrength, setPatternStrength] = useState<number>(0);
    const [aiPrediction, setAiPrediction] = useState<Record<string, unknown> | null>(null);
    const [liveTicks, setLiveTicks] = useState<
        Array<{ quote: number; epoch: number; digit: number; direction?: 'RISE' | 'FALL' }>
    >([]);
    const [showLiveTickOverlay, setShowLiveTickOverlay] = useState(false);
    const [tradeButtonLoading, setTradeButtonLoading] = useState(false);
    const [consecutiveCount, setConsecutiveCount] = useState(0);

    // Convert pattern based on signal type
    const convertedPattern = useMemo(() => {
        if (ticks.length === 0) return [];

        return ticks.slice(-18).map(tick => {
            const digit = tick.digit;

            switch (signalType) {
                case 'EVEN_ODD':
                    return digit % 2 === 0 ? 'EVEN' : 'ODD';
                case 'OVER_UNDER':
                    return digit >= 5 ? 'OVER' : 'UNDER';
                case 'RISE_FALL': {
                    // For RISE/FALL, compare with previous tick
                    const prevTick = ticks[ticks.indexOf(tick) - 1];
                    if (!prevTick) return 'RISE';
                    return tick.quote > prevTick.quote ? 'RISE' : 'FALL';
                }
                default:
                    return 'EVEN';
            }
        });
    }, [ticks, signalType]);

    // Calculate pattern strength (0-100)
    useEffect(() => {
        if (convertedPattern.length < 10) {
            setPatternStrength(0);
            return;
        }

        // Calculate based on consistency, streaks, and distribution
        const lastType = convertedPattern[convertedPattern.length - 1];
        let streakCount = 1;

        for (let i = convertedPattern.length - 2; i >= 0; i--) {
            if (convertedPattern[i] === lastType) streakCount++;
            else break;
        }

        // Count distribution
        const counts: Record<string, number> = {};
        convertedPattern.forEach(p => {
            counts[p] = (counts[p] || 0) + 1;
        });

        const imbalance = Math.abs(Object.values(counts)[0] - Object.values(counts)[1] || 0);

        // Calculate strength (higher streak + higher imbalance = higher strength)
        const streakScore = Math.min(streakCount * 10, 50);
        const imbalanceScore = Math.min(imbalance * 5, 50);
        const strength = Math.min(streakScore + imbalanceScore, 100);

        setPatternStrength(strength);

        // Update consecutive count for enhanced timer
        setConsecutiveCount(streakCount);
    }, [convertedPattern]);

    // Predictive next digit highlight
    useEffect(() => {
        if (convertedPattern.length < 5) {
            setPrediction(null);
            return;
        }

        const lastType = convertedPattern[convertedPattern.length - 1];
        let streakCount = 1;

        for (let i = convertedPattern.length - 2; i >= 0; i--) {
            if (convertedPattern[i] === lastType) streakCount++;
            else break;
        }

        // Predict opposite after long streak
        if (streakCount >= 5) {
            const confidence = Math.min(50 + streakCount * 5, 95);

            // Predict specific digits
            let predictedDigit = 0;
            if (signalType === 'OVER_UNDER') {
                predictedDigit = lastType === 'OVER' ? 2 : 7; // Predict UNDER (2) or OVER (7)
            } else if (signalType === 'EVEN_ODD') {
                predictedDigit = lastType === 'EVEN' ? 3 : 4; // Predict ODD (3) or EVEN (4)
            }

            setPrediction({ digit: predictedDigit, confidence });
        } else {
            setPrediction(null);
        }
    }, [convertedPattern, signalType]);

    // Live tick subscription for real-time data
    useEffect(() => {
        let unsubscribe: (() => void) | undefined;

        const subscribeToTicks = async () => {
            try {
                console.log(`🔄 Subscribing to ${market} ticks for signal card...`);

                const unsub = await derivConnectionPool.subscribeToTicks(
                    market,
                    (tickData: Record<string, unknown>) => {
                        const tick = tickData?.tick as { quote?: number; epoch?: number };
                        if (tick?.quote && tick?.epoch) {
                            const newTick: {
                                quote: number;
                                epoch: number;
                                digit: number;
                                direction?: 'RISE' | 'FALL';
                            } = {
                                quote: tick.quote,
                                epoch: tick.epoch,
                                digit: Math.floor((tick.quote * 100) % 10),
                            };

                            setLiveTicks(prevTicks => {
                                const updatedTicks = [...prevTicks, newTick];

                                // Add direction based on previous tick
                                if (updatedTicks.length > 1) {
                                    const current = updatedTicks[updatedTicks.length - 1];
                                    const previous = updatedTicks[updatedTicks.length - 2];
                                    if (current && previous) {
                                        current.direction = current.quote > previous.quote ? 'RISE' : 'FALL';
                                    }
                                }

                                // Keep only the last 20 ticks for performance
                                return updatedTicks.slice(-20);
                            });
                        }
                    }
                );

                unsubscribe = unsub;
                console.log(`✅ Successfully subscribed to ${market} for signal card`);
            } catch (error) {
                console.error(`❌ Failed to subscribe to ${market} for signal card:`, error);
            }
        };

        // Monitor connection status
        const analysisConnection = derivConnectionPool.getConnection(ConnectionType.ANALYSIS);
        const connectionUnsubscribe = analysisConnection.onConnectionChange(connected => {
            if (connected) {
                subscribeToTicks();
            } else {
                setLiveTicks([]);
            }
        });

        // Initial subscription attempt
        if (analysisConnection.isConnectionActive()) {
            subscribeToTicks();
        }

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
            connectionUnsubscribe();
        };
    }, [market]);

    // AI Prediction based on live ticks
    useEffect(() => {
        if (liveTicks.length >= 5) {
            const tickData = liveTicks.map(tick => ({
                value: tick.quote,
                timestamp: tick.epoch * 1000,
                direction: tick.direction,
            }));

            const prediction = patternPredictor.predict(tickData);
            setAiPrediction(prediction);
        } else {
            setAiPrediction(null);
        }
    }, [liveTicks]);

    // Flash animation on alerts
    useEffect(() => {
        if (alerts.length > 0 && alerts[0].action === 'ENTER_NOW') {
            setFlashAlert(true);
            const timer = setTimeout(() => setFlashAlert(false), 1000);
            return () => clearTimeout(timer);
        }
    }, [alerts]);

    // Handle milestone events
    const handleMilestone = (milestone: StreakMilestone) => {
        console.log('Milestone reached:', milestone);
        // Could trigger sound/notification here
    };

    // Auto-suggest trades - Opens Free Bots section
    const handleAutoTrade = (alert: PatternAlert) => {
        console.log('🤖 Opening Free Bots section from Trade Now button');

        // Dispatch event to switch to Free Bots tab
        const switchTabEvent = new CustomEvent('switch.tab', {
            detail: { tab: 9 }, // FREE BOTS is at position 9 in the tab order
            bubbles: true,
            cancelable: true,
        });
        window.dispatchEvent(switchTabEvent);

        // Also call the original trade signal for logging purposes
        if (onTradeSignal && alert.confidence >= 85) {
            const tradeType = alert.message.includes('EVEN')
                ? 'EVEN'
                : alert.message.includes('ODD')
                  ? 'ODD'
                  : alert.message.includes('OVER')
                    ? 'OVER'
                    : 'UNDER';

            onTradeSignal({
                market,
                type: tradeType,
                confidence: alert.confidence,
                stake: calculateStake(alert.confidence),
                prediction: prediction ? `Digit ${prediction.digit}` : 'N/A',
            });
        }
    };

    const calculateStake = (confidence: number): number => {
        if (confidence >= 90) return 2.0;
        if (confidence >= 80) return 1.5;
        if (confidence >= 70) return 1.0;
        return 0.5;
    };

    // Calculate OVER/UNDER or EVEN/ODD counts
    const getCounts = () => {
        if (signalType === 'OVER_UNDER') {
            const overCount = ticks.filter(t => t.digit >= 5).length;
            const underCount = ticks.filter(t => t.digit < 5).length;
            return { type1: 'OVER', count1: overCount, type2: 'UNDER', count2: underCount };
        } else if (signalType === 'EVEN_ODD') {
            const evenCount = ticks.filter(t => t.digit % 2 === 0).length;
            const oddCount = ticks.filter(t => t.digit % 2 !== 0).length;
            return { type1: 'EVEN', count1: evenCount, type2: 'ODD', count2: oddCount };
        } else {
            const riseCount = convertedPattern.filter(p => p === 'RISE').length;
            const fallCount = convertedPattern.filter(p => p === 'FALL').length;
            return { type1: 'RISE', count1: riseCount, type2: 'FALL', count2: fallCount };
        }
    };

    const counts = getCounts();

    return (
        <div className={`dynamic-signal-card ${flashAlert ? 'flash-alert' : ''}`}>
            {/* Header */}
            <div className='card-header'>
                <div className='market-info'>
                    <h3>{marketLabel}</h3>
                    <span className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
                        {isConnected ? '🟢 LIVE' : '🔴 Disconnected'}
                    </span>
                </div>
                {latestTick && (
                    <div className='current-price'>
                        <span className='price-value'>{latestTick.quote.toFixed(5)}</span>
                        <span className='digit-badge'>{latestTick.digit}</span>
                    </div>
                )}
            </div>

            {/* Live Tick Movement Button */}
            <div className='live-tick-button-section'>
                <button
                    className='show-live-ticks-btn'
                    onClick={() => setShowLiveTickOverlay(true)}
                    title='Show movable live tick overlay'
                >
                    <span className='btn-icon'>📊</span>
                    <span className='btn-text'>Show Live Tick Movement</span>
                    <span className={`connection-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
                        {isConnected ? '🟢' : '🔴'}
                    </span>
                </button>
                <p className='live-tick-description'>
                    Click to open a movable overlay showing real-time tick patterns that won&apos;t block your trading
                    interface.
                </p>
            </div>

            {/* AI Prediction Display */}
            {aiPrediction && (
                <div className='ai-prediction-section'>
                    <PredictionDisplay prediction={aiPrediction} compact={false} />
                </div>
            )}

            {/* Live Pattern Display with pulse animation */}
            <LivePatternDisplay pattern={convertedPattern} />

            {/* Streak Counter */}
            <StreakCounter pattern={convertedPattern} onMilestone={handleMilestone} />

            {/* Pattern Strength Meter */}
            <div className='pattern-strength-meter'>
                <div className='strength-header'>
                    <span className='strength-label'>Pattern Strength</span>
                    <span className='strength-value'>{patternStrength}%</span>
                </div>
                <div className='strength-bar'>
                    <div
                        className={`strength-fill ${
                            patternStrength >= 75 ? 'strong' : patternStrength >= 50 ? 'moderate' : 'weak'
                        }`}
                        style={{ width: `${patternStrength}%` }}
                    />
                </div>
                <div className='strength-description'>
                    {patternStrength >= 75
                        ? '🔥 Very Strong - High confidence trades'
                        : patternStrength >= 50
                          ? '⚡ Moderate - Good trading opportunity'
                          : '⏳ Weak - Wait for better pattern'}
                </div>
            </div>

            {/* Predictive Next Digit Highlight */}
            {prediction && (
                <div className='prediction-panel'>
                    <div className='prediction-header'>
                        <span className='prediction-icon'>🔮</span>
                        <span className='prediction-title'>Next Digit Prediction</span>
                    </div>
                    <div className='prediction-content'>
                        <div className='predicted-digit'>{prediction.digit}</div>
                        <div className='prediction-details'>
                            <span className='prediction-confidence'>{prediction.confidence}% Confidence</span>
                            <span className='prediction-type'>
                                {signalType === 'OVER_UNDER'
                                    ? prediction.digit >= 5
                                        ? 'OVER'
                                        : 'UNDER'
                                    : prediction.digit % 2 === 0
                                      ? 'EVEN'
                                      : 'ODD'}
                            </span>
                        </div>

                        {/* Enhanced Trade Button for Prediction */}
                        {prediction.confidence >= 70 && (
                            <div className='prediction-trade-section'>
                                <EnhancedTradeButton
                                    action='Trade Prediction'
                                    stake={`$${calculateStake(prediction.confidence)}`}
                                    confidence={prediction.confidence}
                                    type={
                                        signalType === 'OVER_UNDER'
                                            ? prediction.digit >= 5
                                                ? 'OVER'
                                                : 'UNDER'
                                            : prediction.digit % 2 === 0
                                              ? 'EVEN'
                                              : 'ODD'
                                    }
                                    highlighted={prediction.confidence >= 85}
                                    loading={tradeButtonLoading}
                                    onClick={() => {
                                        setTradeButtonLoading(true);
                                        setTimeout(() => {
                                            if (onTradeSignal) {
                                                onTradeSignal({
                                                    market,
                                                    type:
                                                        signalType === 'OVER_UNDER'
                                                            ? prediction.digit >= 5
                                                                ? 'OVER'
                                                                : 'UNDER'
                                                            : prediction.digit % 2 === 0
                                                              ? 'EVEN'
                                                              : 'ODD',
                                                    confidence: prediction.confidence,
                                                    stake: calculateStake(prediction.confidence),
                                                    prediction: `Digit ${prediction.digit}`,
                                                });
                                            }
                                            setTradeButtonLoading(false);
                                        }, 1000);
                                    }}
                                    size='medium'
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Enhanced Countdown Timer */}
            {consecutiveCount >= 3 && (
                <div className='enhanced-timer-section'>
                    <EnhancedCountdownTimer
                        duration={30}
                        onComplete={() => {
                            console.log('Trading window closed');
                        }}
                        showProgress={true}
                        size='large'
                        autoStart={true}
                        showContinueButton={true}
                        consecutiveCount={consecutiveCount}
                        patternType={convertedPattern[convertedPattern.length - 1] || 'OVER'}
                    />
                </div>
            )}

            {/* Auto-Suggest Trades with Enhanced Buttons */}
            {alerts.length > 0 && (
                <div className='alerts-section'>
                    {alerts.map((alert, alertIndex) => (
                        <div key={alertIndex} className={`alert alert-${alert.action.toLowerCase()}`}>
                            <div className='alert-header'>
                                <span className='alert-icon'>
                                    {alert.action === 'ENTER_NOW' ? '🚀' : alert.action === 'WAIT' ? '⏳' : '⚠️'}
                                </span>
                                <span className='alert-type'>{alert.type}</span>
                                <span className='confidence'>{alert.confidence}%</span>
                            </div>
                            <p className='alert-message'>{alert.message}</p>
                            {alert.action === 'ENTER_NOW' && (
                                <div className='enhanced-trade-section'>
                                    <EnhancedTradeButton
                                        action='Trade Now'
                                        stake={`$${calculateStake(alert.confidence)}`}
                                        confidence={alert.confidence}
                                        type={
                                            alert.message.includes('EVEN')
                                                ? 'EVEN'
                                                : alert.message.includes('ODD')
                                                  ? 'ODD'
                                                  : alert.message.includes('OVER')
                                                    ? 'OVER'
                                                    : 'UNDER'
                                        }
                                        highlighted={alert.confidence >= 85}
                                        loading={tradeButtonLoading}
                                        onClick={() => {
                                            setTradeButtonLoading(true);
                                            setTimeout(() => {
                                                handleAutoTrade(alert);
                                                setTradeButtonLoading(false);
                                            }, 1000);
                                        }}
                                        size='large'
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Live Statistics with Dynamic Updates */}
            <div className='live-stats'>
                <div className='stat-item'>
                    <span className='stat-label'>Total Ticks</span>
                    <span className='stat-value'>{ticks.length}</span>
                </div>
                <div className='stat-item'>
                    <span className='stat-label'>{counts.type1} Count</span>
                    <span className='stat-value green'>{counts.count1}</span>
                </div>
                <div className='stat-item'>
                    <span className='stat-label'>{counts.type2} Count</span>
                    <span className='stat-value red'>{counts.count2}</span>
                </div>
            </div>

            {/* Historical Comparison Overlay */}
            <div className='historical-comparison'>
                <div className='comparison-header'>
                    <span className='comparison-label'>Distribution Analysis</span>
                </div>
                <div className='comparison-bars'>
                    <div className='comparison-bar'>
                        <span className='bar-label'>{counts.type1}</span>
                        <div className='bar-container'>
                            <div
                                className='bar-fill green'
                                style={{
                                    width: `${(counts.count1 / (counts.count1 + counts.count2)) * 100}%`,
                                }}
                            />
                        </div>
                        <span className='bar-percentage'>
                            {((counts.count1 / (counts.count1 + counts.count2)) * 100).toFixed(0)}%
                        </span>
                    </div>
                    <div className='comparison-bar'>
                        <span className='bar-label'>{counts.type2}</span>
                        <div className='bar-container'>
                            <div
                                className='bar-fill red'
                                style={{
                                    width: `${(counts.count2 / (counts.count1 + counts.count2)) * 100}%`,
                                }}
                            />
                        </div>
                        <span className='bar-percentage'>
                            {((counts.count2 / (counts.count1 + counts.count2)) * 100).toFixed(0)}%
                        </span>
                    </div>
                </div>
                <div className='comparison-insight'>
                    {Math.abs(counts.count1 - counts.count2) >= 8 ? (
                        <span className='insight-warning'>
                            ⚠️ High imbalance detected - {counts.count1 > counts.count2 ? counts.type2 : counts.type1}{' '}
                            likely next
                        </span>
                    ) : (
                        <span className='insight-normal'>✓ Balanced distribution</span>
                    )}
                </div>
            </div>

            {/* Tick History */}
            <div className='tick-history'>
                <div className='history-label'>Recent Ticks</div>
                <div className='history-list'>
                    {ticks
                        .slice(-10)
                        .reverse()
                        .map(tick => (
                            <div key={tick.tick} className='history-item'>
                                <span className='tick-time'>{new Date(tick.timestamp).toLocaleTimeString()}</span>
                                <span
                                    className={`tick-digit ${
                                        signalType === 'OVER_UNDER'
                                            ? tick.digit >= 5
                                                ? 'over'
                                                : 'under'
                                            : tick.digit % 2 === 0
                                              ? 'even'
                                              : 'odd'
                                    }`}
                                >
                                    {tick.digit}
                                </span>
                                <span className='tick-quote'>{tick.quote.toFixed(5)}</span>
                            </div>
                        ))}
                </div>
            </div>

            {/* Movable Live Tick Overlay */}
            <MovableLiveTickOverlay
                market={market}
                marketLabel={marketLabel}
                isVisible={showLiveTickOverlay}
                onClose={() => setShowLiveTickOverlay(false)}
            />
        </div>
    );
};
