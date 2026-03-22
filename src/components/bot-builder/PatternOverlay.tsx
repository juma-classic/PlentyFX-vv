import React, { useEffect, useState } from 'react';
import { derivAPIService } from '@/services/deriv-api.service';
import { PatternAnalyzer } from '@/utils/pattern-analyzer';
import './PatternOverlay.scss';

interface PatternOverlayProps {
    market: string;
    tradeType: 'evenodd' | 'risefall' | 'overunder';
    onClose: () => void;
}

export const PatternOverlay: React.FC<PatternOverlayProps> = ({ market, tradeType, onClose }) => {
    const [pattern, setPattern] = useState<('EVEN' | 'ODD' | 'RISE' | 'FALL' | 'OVER' | 'UNDER')[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPrice, setCurrentPrice] = useState<number | null>(null);

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        const ticks: number[] = [];

        const subscribeTicks = async () => {
            try {
                unsubscribe = await derivAPIService.subscribeToTicks(market, tickData => {
                    if (tickData?.tick?.quote) {
                        const quote = tickData.tick.quote;
                        ticks.push(quote);
                        setCurrentPrice(quote);

                        // Keep last 50 ticks
                        if (ticks.length > 50) {
                            ticks.shift();
                        }

                        // Generate pattern based on trade type
                        if (ticks.length >= 2) {
                            const newPattern = generatePattern(ticks, tradeType);
                            setPattern(newPattern);
                            setIsLoading(false);
                        }
                    }
                });
            } catch (error) {
                console.error('Failed to subscribe to ticks:', error);
                setIsLoading(false);
            }
        };

        subscribeTicks();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [market, tradeType]);

    const generatePattern = (
        ticks: number[],
        type: 'evenodd' | 'risefall' | 'overunder'
    ): ('EVEN' | 'ODD' | 'RISE' | 'FALL' | 'OVER' | 'UNDER')[] => {
        if (type === 'evenodd') {
            return ticks.slice(-18).map(tick => {
                const lastDigit = Math.abs(Math.floor(tick * 100)) % 10;
                return lastDigit % 2 === 0 ? 'EVEN' : 'ODD';
            });
        } else if (type === 'risefall') {
            const result: ('RISE' | 'FALL')[] = [];
            for (let i = 1; i < Math.min(19, ticks.length); i++) {
                result.push(ticks[i] > ticks[i - 1] ? 'RISE' : 'FALL');
            }
            return result.slice(-18);
        } else {
            // overunder - default to OVER 5
            return ticks.slice(-18).map(tick => {
                const lastDigit = Math.abs(Math.floor(tick * 100)) % 10;
                return lastDigit > 5 ? 'OVER' : 'UNDER';
            });
        }
    };

    const analysis = pattern.length >= 3 ? PatternAnalyzer.analyzePattern(pattern, tradeType) : null;

    const renderBox = (value: 'EVEN' | 'ODD' | 'RISE' | 'FALL' | 'OVER' | 'UNDER', index: number) => {
        const isGreen = value === 'EVEN' || value === 'RISE' || value === 'OVER';
        const letter =
            tradeType === 'evenodd'
                ? value === 'EVEN'
                    ? 'E'
                    : 'O'
                : tradeType === 'risefall'
                  ? value === 'RISE'
                      ? 'R'
                      : 'F'
                  : value === 'OVER'
                    ? 'O'
                    : 'U';

        return (
            <div key={index} className={`pattern-box ${isGreen ? 'green' : 'red'}`} title={value}>
                {letter}
            </div>
        );
    };

    const displayPattern = pattern.slice(-18);
    const row1 = displayPattern.slice(0, 9);
    const row2 = displayPattern.slice(9, 18);

    return (
        <div className='pattern-overlay'>
            <div className='pattern-overlay-content'>
                <div className='overlay-header'>
                    <h3>📊 Live Pattern Analysis</h3>
                    <button className='close-button' onClick={onClose}>
                        ✕
                    </button>
                </div>

                {isLoading ? (
                    <div className='loading-state'>
                        <div className='spinner'></div>
                        <p>Loading live data...</p>
                    </div>
                ) : (
                    <>
                        {/* Current Price */}
                        {currentPrice && (
                            <div className='current-price'>
                                <span className='price-label'>Current Price:</span>
                                <span className='price-value'>{currentPrice.toFixed(2)}</span>
                            </div>
                        )}

                        {/* Pattern Display */}
                        <div className='pattern-display'>
                            <div className='pattern-row'>{row1.map((value, idx) => renderBox(value, idx))}</div>
                            {row2.length > 0 && (
                                <div className='pattern-row'>{row2.map((value, idx) => renderBox(value, idx + 9))}</div>
                            )}
                        </div>

                        {/* Quick Stats */}
                        {analysis && (
                            <div className='quick-stats'>
                                <div className='stat-item'>
                                    <span className='stat-icon'>🔥</span>
                                    <span className='stat-text'>
                                        Streak: {analysis.streakCount} {analysis.streakType}
                                    </span>
                                </div>
                                <div className='stat-item'>
                                    <span className='stat-icon'>💎</span>
                                    <span className='stat-text'>Win Rate: {analysis.winProbability}%</span>
                                </div>
                                <div className={`stat-item action ${analysis.suggestedAction.toLowerCase()}`}>
                                    <span className='stat-icon'>
                                        {analysis.suggestedAction === 'ENTER_NOW' && '⚡'}
                                        {analysis.suggestedAction === 'HIGH_RISK' && '⚠️'}
                                        {analysis.suggestedAction === 'WAIT' && '⏸️'}
                                        {analysis.suggestedAction === 'EXTREME_CAUTION' && '🛑'}
                                    </span>
                                    <span className='stat-text'>{analysis.suggestedAction.replace('_', ' ')}</span>
                                </div>
                            </div>
                        )}

                        {/* Action Reason */}
                        {analysis && (
                            <div className='action-reason'>
                                <p>{analysis.actionReason}</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
