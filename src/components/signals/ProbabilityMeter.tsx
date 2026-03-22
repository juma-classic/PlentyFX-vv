import React, { useEffect, useState } from 'react';
import type { ProbabilityResult } from '../../services/probability-calculator.service';
import { probabilityCalculator } from '../../services/probability-calculator.service';
import './ProbabilityMeter.scss';

interface ProbabilityMeterProps {
    pattern: string[];
    onProbabilityChange?: (result: ProbabilityResult) => void;
}

export const ProbabilityMeter: React.FC<ProbabilityMeterProps> = ({ pattern, onProbabilityChange }) => {
    const [result, setResult] = useState<ProbabilityResult | null>(null);
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // Calculate probability on pattern change
    useEffect(() => {
        const newResult = probabilityCalculator.calculateProbability(pattern);
        setResult(newResult);

        // Trigger animation
        setIsAnimating(true);
        const timer = setTimeout(() => setIsAnimating(false), 500);

        // Notify parent
        if (onProbabilityChange) {
            onProbabilityChange(newResult);
        }

        return () => clearTimeout(timer);
    }, [pattern, onProbabilityChange]);

    if (!result) return null;

    const getColorClass = (): string => {
        if (result.probability >= 75) return 'high';
        if (result.probability >= 60) return 'medium-high';
        if (result.probability >= 40) return 'medium';
        return 'low';
    };

    const getRecommendationIcon = (): string => {
        switch (result.recommendation) {
            case 'STRONG_BUY':
                return '🚀';
            case 'BUY':
                return '✅';
            case 'HOLD':
                return '⏸️';
            case 'SELL':
                return '⚠️';
            case 'STRONG_SELL':
                return '🛑';
            default:
                return '❓';
        }
    };

    const getRecommendationText = (): string => {
        return result.recommendation.replace('_', ' ');
    };

    const accuracy = probabilityCalculator.getHistoricalAccuracy();

    return (
        <div className='probability-meter'>
            {/* Main Meter */}
            <div className='meter-container'>
                <div className='meter-header'>
                    <span className='meter-label'>Win Probability</span>
                    <button className='breakdown-toggle' onClick={() => setShowBreakdown(!showBreakdown)}>
                        {showBreakdown ? '▼' : '▶'} Details
                    </button>
                </div>

                {/* Circular Progress */}
                <div className={`circular-meter ${getColorClass()} ${isAnimating ? 'animating' : ''}`}>
                    <svg viewBox='0 0 200 200' className='meter-svg'>
                        {/* Background circle */}
                        <circle
                            className='meter-bg'
                            cx='100'
                            cy='100'
                            r='85'
                            fill='none'
                            stroke='rgba(100, 116, 139, 0.2)'
                            strokeWidth='12'
                        />

                        {/* Progress circle */}
                        <circle
                            className='meter-progress'
                            cx='100'
                            cy='100'
                            r='85'
                            fill='none'
                            strokeWidth='12'
                            strokeLinecap='round'
                            strokeDasharray={`${(result.probability / 100) * 534} 534`}
                            transform='rotate(-90 100 100)'
                        />

                        {/* Confidence interval arc */}
                        <circle
                            className='meter-confidence'
                            cx='100'
                            cy='100'
                            r='70'
                            fill='none'
                            stroke='rgba(59, 130, 246, 0.3)'
                            strokeWidth='4'
                            strokeDasharray={`${((result.maxProbability - result.minProbability) / 100) * 440} 440`}
                            transform={`rotate(${-90 + (result.minProbability / 100) * 360} 100 100)`}
                        />
                    </svg>

                    {/* Center content */}
                    <div className='meter-content'>
                        <div className='probability-value'>{result.probability}%</div>
                        <div className='probability-range'>
                            {result.minProbability}% - {result.maxProbability}%
                        </div>
                        <div className='confidence-badge'>
                            <span className='confidence-label'>Confidence</span>
                            <span className='confidence-value'>{result.confidence}%</span>
                        </div>
                    </div>
                </div>

                {/* Recommendation */}
                <div className={`recommendation recommendation-${result.recommendation.toLowerCase()}`}>
                    <span className='recommendation-icon'>{getRecommendationIcon()}</span>
                    <span className='recommendation-text'>{getRecommendationText()}</span>
                </div>
            </div>

            {/* Breakdown */}
            {showBreakdown && (
                <div className='probability-breakdown'>
                    <h4>Calculation Breakdown</h4>

                    <div className='factor-list'>
                        <div className='factor-item'>
                            <span className='factor-label'>Streak Length</span>
                            <div className='factor-bar'>
                                <div
                                    className='factor-fill'
                                    style={{ width: `${Math.min(result.factors.streakLength * 10, 100)}%` }}
                                />
                            </div>
                            <span className='factor-value'>{result.factors.streakLength}</span>
                        </div>

                        <div className='factor-item'>
                            <span className='factor-label'>Distribution Balance</span>
                            <div className='factor-bar'>
                                <div
                                    className='factor-fill'
                                    style={{
                                        width: `${
                                            (Math.abs(
                                                result.factors.distribution.type1 - result.factors.distribution.type2
                                            ) /
                                                (result.factors.distribution.type1 +
                                                    result.factors.distribution.type2)) *
                                            100
                                        }%`,
                                    }}
                                />
                            </div>
                            <span className='factor-value'>
                                {result.factors.distribution.type1} vs {result.factors.distribution.type2}
                            </span>
                        </div>

                        <div className='factor-item'>
                            <span className='factor-label'>Volatility</span>
                            <div className='factor-bar'>
                                <div className='factor-fill' style={{ width: `${result.factors.volatility}%` }} />
                            </div>
                            <span className='factor-value'>{result.factors.volatility.toFixed(0)}%</span>
                        </div>

                        <div className='factor-item'>
                            <span className='factor-label'>Momentum</span>
                            <div className='factor-bar'>
                                <div className='factor-fill' style={{ width: `${result.factors.momentum}%` }} />
                            </div>
                            <span className='factor-value'>{result.factors.momentum.toFixed(0)}%</span>
                        </div>

                        <div className='factor-item'>
                            <span className='factor-label'>Time Factor</span>
                            <div className='factor-bar'>
                                <div
                                    className='factor-fill'
                                    style={{ width: `${(result.factors.timeOfDay - 0.9) * 500}%` }}
                                />
                            </div>
                            <span className='factor-value'>{result.factors.timeOfDay.toFixed(2)}x</span>
                        </div>
                    </div>

                    {/* Historical Accuracy */}
                    {accuracy.totalPredictions > 0 && (
                        <div className='historical-accuracy'>
                            <h5>Historical Accuracy</h5>
                            <div className='accuracy-stats'>
                                <div className='accuracy-item'>
                                    <span className='accuracy-label'>Total Predictions</span>
                                    <span className='accuracy-value'>{accuracy.totalPredictions}</span>
                                </div>
                                <div className='accuracy-item'>
                                    <span className='accuracy-label'>Correct</span>
                                    <span className='accuracy-value'>{accuracy.correctPredictions}</span>
                                </div>
                                <div className='accuracy-item'>
                                    <span className='accuracy-label'>Accuracy</span>
                                    <span className='accuracy-value success'>{accuracy.accuracy.toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
