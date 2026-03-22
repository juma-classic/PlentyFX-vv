/**
 * Probability Prediction Card Component
 * Displays probability predictions with gradient styling and confidence indicators
 */

import React, { useState } from 'react';
import { createAndDispatchBotStrategy } from '../../utils/bot-strategy-creator';
import { ProbabilityPrediction } from '../../utils/probability-calculator';
import { createAndDispatchTradeSignal } from '../../utils/trade-signal-generator';

interface ProbabilityPredictionCardProps {
    predictions: ProbabilityPrediction[];
    market?: string;
}

export const ProbabilityPredictionCard: React.FC<ProbabilityPredictionCardProps> = React.memo(({ predictions, market = 'R_50' }) => {
    const [loadingDigit, setLoadingDigit] = useState<number | null>(null);
    const [creatingBotDigit, setCreatingBotDigit] = useState<number | null>(null);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    if (predictions.length === 0) {
        return null;
    }

    // Get most likely prediction (first in sorted list)
    const mostLikely = predictions[0];

    // Get top 5 predictions
    const top5 = predictions.slice(0, 5);

    // Get confidence color class
    const getConfidenceColorClass = (confidence: 'low' | 'medium' | 'high'): string => {
        switch (confidence) {
            case 'high':
                return 'confidence-high';
            case 'medium':
                return 'confidence-medium';
            case 'low':
                return 'confidence-low';
            default:
                return 'confidence-low';
        }
    };

    // Handle Trade Now button click
    const handleTradeNow = async (prediction: ProbabilityPrediction) => {
        try {
            setLoadingDigit(prediction.digit);
            
            // Create and dispatch trade signal
            const signal = createAndDispatchTradeSignal(prediction, market);
            
            if (signal) {
                // Show success notification
                setNotification({
                    message: `Trade signal sent for digit ${prediction.digit}!`,
                    type: 'success'
                });
                
                // Clear notification after 3 seconds
                setTimeout(() => setNotification(null), 3000);
            } else {
                throw new Error('Failed to create trade signal');
            }
        } catch (error) {
            console.error('Trade signal error:', error);
            setNotification({
                message: 'Failed to send trade signal. Please try again.',
                type: 'error'
            });
            
            // Clear notification after 3 seconds
            setTimeout(() => setNotification(null), 3000);
        } finally {
            setLoadingDigit(null);
        }
    };

    // Handle Create Bot Strategy button click
    const handleCreateBotStrategy = async (prediction: ProbabilityPrediction) => {
        try {
            setCreatingBotDigit(prediction.digit);
            
            // Create and dispatch bot strategy with default stake and duration
            const config = createAndDispatchBotStrategy(prediction, market, 1, 1);
            
            if (config) {
                // Show success notification
                setNotification({
                    message: `Bot strategy created for digit ${prediction.digit}!`,
                    type: 'success'
                });
                
                // Clear notification after 3 seconds
                setTimeout(() => setNotification(null), 3000);
            } else {
                throw new Error('Failed to create bot strategy');
            }
        } catch (error) {
            console.error('Bot strategy creation error:', error);
            setNotification({
                message: 'Failed to create bot strategy. Please try again.',
                type: 'error'
            });
            
            // Clear notification after 3 seconds
            setTimeout(() => setNotification(null), 3000);
        } finally {
            setCreatingBotDigit(null);
        }
    };

    return (
        <div className="probability-prediction-card">
            <h2 className="prediction-title">🎯 Probability Predictions</h2>

            {/* Notification */}
            {notification && (
                <div className={`trade-notification trade-notification-${notification.type}`}>
                    {notification.message}
                </div>
            )}

            {/* Most Likely Prediction */}
            <div className={`most-likely-card ${getConfidenceColorClass(mostLikely.confidence)}`}>
                <div className="most-likely-content">
                    <div className="prediction-label">Most Likely Next Digit</div>
                    <div className="prediction-digit">{mostLikely.digit}</div>
                    <div className="prediction-probability">
                        {(mostLikely.probability * 100).toFixed(1)}%
                    </div>
                    <div className={`confidence-indicator ${getConfidenceColorClass(mostLikely.confidence)}`}>
                        <span className="confidence-label">Confidence:</span>
                        <span className="confidence-value">{mostLikely.confidence.toUpperCase()}</span>
                    </div>
                </div>
            </div>

            {/* Top 5 Predictions List */}
            <div className="top-predictions-section">
                <h3 className="top-predictions-title">Top 5 Predictions</h3>
                <div className="top-predictions-list">
                    {top5.map((prediction, index) => (
                        <div key={`prediction-${index}-${prediction.digit}`} className="prediction-item">
                            <div className="prediction-rank">#{index + 1}</div>
                            <div className="prediction-digit-small">{prediction.digit}</div>
                            <div className="prediction-probability-bar">
                                <div
                                    className={`probability-fill ${getConfidenceColorClass(prediction.confidence)}`}
                                    style={{ width: `${prediction.probability * 100}%` }}
                                />
                            </div>
                            <div className="prediction-percentage">
                                {(prediction.probability * 100).toFixed(1)}%
                            </div>
                            <div className={`confidence-badge ${getConfidenceColorClass(prediction.confidence)}`}>
                                {prediction.confidence}
                            </div>
                            <button
                                className="trade-now-button"
                                onClick={() => handleTradeNow(prediction)}
                                disabled={loadingDigit === prediction.digit}
                                aria-label={`Trade now for digit ${prediction.digit}`}
                            >
                                {loadingDigit === prediction.digit ? '⏳' : '🚀'} Trade Now
                            </button>
                            {prediction.confidence === 'high' && (
                                <button
                                    className="create-bot-button"
                                    onClick={() => handleCreateBotStrategy(prediction)}
                                    disabled={creatingBotDigit === prediction.digit}
                                    aria-label={`Create bot strategy for digit ${prediction.digit}`}
                                >
                                    {creatingBotDigit === prediction.digit ? '⏳' : '🤖'} Create Bot
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
});

ProbabilityPredictionCard.displayName = 'ProbabilityPredictionCard';
