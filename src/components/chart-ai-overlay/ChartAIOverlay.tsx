import React, { useState, useEffect } from 'react';
import { chartAIAnalysisService } from '@/services/chart-ai-analysis.service';
import './ChartAIOverlay.scss';

interface ChartAIOverlayProps {
    candles?: any[];
    isVisible?: boolean;
    currentPrice?: number;
    granularity?: number; // in seconds
}

export const ChartAIOverlay: React.FC<ChartAIOverlayProps> = ({ 
    candles = [], 
    isVisible = true,
    currentPrice = 0,
    granularity = 60 // default 1 minute
}) => {
    const [signal, setSignal] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [currentCandlePrice, setCurrentCandlePrice] = useState<number>(currentPrice);

    // Update current price
    useEffect(() => {
        if (currentPrice > 0) {
            setCurrentCandlePrice(currentPrice);
        } else if (candles.length > 0) {
            // Fallback: get price from last candle
            const lastCandle = candles[candles.length - 1];
            setCurrentCandlePrice(lastCandle.close || lastCandle.quote || 0);
        }
    }, [currentPrice, candles]);

    // Calculate time left for current candle
    useEffect(() => {
        const calculateTimeLeft = () => {
            if (candles.length === 0 || !granularity) return granularity || 60;
            
            const lastCandle = candles[candles.length - 1];
            if (!lastCandle || !lastCandle.epoch) return granularity || 60;
            
            // Handle epoch in both seconds and milliseconds
            let candleStartTime = lastCandle.epoch;
            if (candleStartTime < 10000000000) {
                // Epoch is in seconds, convert to milliseconds
                candleStartTime = candleStartTime * 1000;
            }
            
            const candleEndTime = candleStartTime + (granularity * 1000);
            const now = Date.now();
            const remaining = Math.max(0, Math.floor((candleEndTime - now) / 1000));
            
            // If remaining is greater than granularity, something is wrong, reset to granularity
            if (remaining > granularity) {
                return granularity;
            }
            
            return remaining;
        };

        // Update time left every second
        const updateTimer = () => {
            const newTimeLeft = calculateTimeLeft();
            setTimeLeft(newTimeLeft);
        };

        updateTimer();
        const timerInterval = setInterval(updateTimer, 1000);

        return () => clearInterval(timerInterval);
    }, [candles, granularity]);

    useEffect(() => {
        if (!isVisible || candles.length === 0) return;

        const analyzeChart = () => {
            setIsAnalyzing(true);
            
            // Set candles data
            chartAIAnalysisService.setCandles(candles);
            
            // Generate signal
            const newSignal = chartAIAnalysisService.generateSignal();
            setSignal(newSignal);
            
            setIsAnalyzing(false);
        };

        // Initial analysis
        analyzeChart();

        // Re-analyze every 10 seconds
        const interval = setInterval(analyzeChart, 10000);

        return () => clearInterval(interval);
    }, [candles, isVisible]);

    if (!isVisible || !signal) return null;

    // Format time left
    const formatTimeLeft = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className='chart-ai-overlay'>
            {/* Current Price & Timer */}
            <div className='price-timer-card'>
                <div className='current-price-section'>
                    <span className='price-label'>Current Price:</span>
                    <span className='price-value'>
                        {currentCandlePrice > 0 ? currentCandlePrice.toFixed(2) : '--'}
                    </span>
                </div>
                <div className='timer-section'>
                    <span className='timer-label'>Candle Closes In:</span>
                    <span className={`timer-value ${timeLeft <= 10 && timeLeft > 0 ? 'urgent' : ''}`}>
                        {formatTimeLeft(timeLeft)}
                    </span>
                </div>
            </div>

            {/* AI Signal Card */}
            <div className={`ai-signal-card ${signal.direction.toLowerCase()}`}>
                <div className='signal-header'>
                    <div className='signal-direction'>
                        <span className='direction-icon'>
                            {signal.direction === 'UP' ? '📈' : '📉'}
                        </span>
                        <span className='direction-text'>{signal.direction}</span>
                    </div>
                    <div className='signal-confidence'>
                        <span className='confidence-label'>Confidence:</span>
                        <span className='confidence-value'>{signal.confidence.toFixed(0)}%</span>
                    </div>
                </div>

                <div className='signal-body'>
                    <div className='justification-section'>
                        <h4>📊 Analysis:</h4>
                        <ul className='justification-list'>
                            {signal.justification.map((reason: string, index: number) => (
                                <li key={index}>{reason}</li>
                            ))}
                        </ul>
                    </div>

                    {(signal.supportLevel || signal.resistanceLevel) && (
                        <div className='levels-section'>
                            <h4>🎯 Key Levels:</h4>
                            {signal.supportLevel && (
                                <div className='level-item support'>
                                    <span className='level-label'>Support:</span>
                                    <span className='level-value'>{signal.supportLevel.toFixed(2)}</span>
                                </div>
                            )}
                            {signal.resistanceLevel && (
                                <div className='level-item resistance'>
                                    <span className='level-label'>Resistance:</span>
                                    <span className='level-value'>{signal.resistanceLevel.toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {(signal.targetPrice || signal.stopLoss) && (
                        <div className='targets-section'>
                            <h4>🎲 Trade Setup:</h4>
                            {signal.targetPrice && (
                                <div className='target-item'>
                                    <span className='target-label'>Target:</span>
                                    <span className='target-value profit'>{signal.targetPrice.toFixed(2)}</span>
                                </div>
                            )}
                            {signal.stopLoss && (
                                <div className='target-item'>
                                    <span className='target-label'>Stop Loss:</span>
                                    <span className='target-value loss'>{signal.stopLoss.toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {signal.patterns && signal.patterns.length > 0 && (
                        <div className='patterns-section'>
                            <h4>📐 Patterns:</h4>
                            {signal.patterns.map((pattern: any, index: number) => (
                                <div key={index} className='pattern-item'>
                                    <span className='pattern-name'>
                                        {pattern.type.replace('_', ' ').toUpperCase()}
                                    </span>
                                    <span className='pattern-confidence'>
                                        {(pattern.confidence * 100).toFixed(0)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {isAnalyzing && (
                    <div className='analyzing-indicator'>
                        <span className='spinner'></span>
                        <span>Analyzing...</span>
                    </div>
                )}
            </div>

            {/* Trend Lines Indicator */}
            {signal.trendLines && signal.trendLines.length > 0 && (
                <div className='trend-lines-info'>
                    <h5>📏 Trend Lines Detected:</h5>
                    <div className='trend-lines-list'>
                        {signal.trendLines.map((line: any) => (
                            <div key={line.id} className='trend-line-item'>
                                <span 
                                    className='line-indicator' 
                                    style={{ backgroundColor: line.color }}
                                ></span>
                                <span className='line-type'>
                                    {line.type.replace('_', ' ').toUpperCase()}
                                </span>
                                <span className='line-strength'>
                                    {(line.strength * 100).toFixed(0)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChartAIOverlay;
