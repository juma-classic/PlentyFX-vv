/**
 * Prediction Display Component
 * Shows AI-powered pattern predictions with confidence and reasoning
 */

import React from 'react';
import type { PredictionResult } from '../../services/pattern-predictor.service';
import './PredictionDisplay.scss';

interface PredictionDisplayProps {
    prediction: PredictionResult;
    compact?: boolean;
}

export const PredictionDisplay: React.FC<PredictionDisplayProps> = ({ prediction, compact = false }) => {
    const getOutcomeIcon = () => {
        switch (prediction.prediction) {
            case 'RISE':
                return '📈';
            case 'FALL':
                return '📉';
            default:
                return '❓';
        }
    };

    const getConfidenceColor = () => {
        if (prediction.confidence >= 70) return 'high';
        if (prediction.confidence >= 55) return 'medium';
        return 'low';
    };

    const getRiskColor = () => {
        switch (prediction.riskLevel) {
            case 'LOW':
                return 'success';
            case 'MEDIUM':
                return 'warning';
            case 'HIGH':
                return 'danger';
        }
    };

    const getActionColor = () => {
        switch (prediction.recommendedAction) {
            case 'TRADE':
                return 'success';
            case 'WAIT':
                return 'warning';
            case 'AVOID':
                return 'danger';
        }
    };

    if (compact) {
        return (
            <div className='prediction-display compact'>
                <div className='prediction-header'>
                    <span className='prediction-icon'>{getOutcomeIcon()}</span>
                    <span className='prediction-outcome'>{prediction.prediction}</span>
                    <span className={`confidence-badge ${getConfidenceColor()}`}>{prediction.confidence}%</span>
                </div>
            </div>
        );
    }

    return (
        <div className='prediction-display'>
            {/* Header */}
            <div className='prediction-header'>
                <div className='prediction-main'>
                    <span className='prediction-icon'>{getOutcomeIcon()}</span>
                    <div className='prediction-info'>
                        <h3 className='prediction-title'>AI Prediction</h3>
                        <p className='prediction-outcome'>
                            Next: <strong>{prediction.prediction}</strong>
                        </p>
                    </div>
                </div>
                <div className={`confidence-meter ${getConfidenceColor()}`}>
                    <div className='confidence-value'>{prediction.confidence}%</div>
                    <div className='confidence-label'>Confidence</div>
                </div>
            </div>

            {/* Confidence Bar */}
            <div className='confidence-bar-container'>
                <div
                    className={`confidence-bar ${getConfidenceColor()}`}
                    style={{ width: `${prediction.confidence}%` }}
                />
            </div>

            {/* Pattern Type */}
            <div className='pattern-type'>
                <span className='pattern-label'>Pattern:</span>
                <span className='pattern-value'>{prediction.patternType.replace(/_/g, ' ')}</span>
            </div>

            {/* Reasoning */}
            <div className='prediction-reasoning'>
                <p>{prediction.reasoning}</p>
            </div>

            {/* Supporting Factors */}
            {prediction.supportingFactors.length > 0 && (
                <div className='supporting-factors'>
                    <h4>Analysis:</h4>
                    <ul>
                        {prediction.supportingFactors.map((factor, index) => (
                            <li key={index}>{factor}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Risk & Action */}
            <div className='prediction-footer'>
                <div className={`risk-badge ${getRiskColor()}`}>
                    <span className='badge-label'>Risk:</span>
                    <span className='badge-value'>{prediction.riskLevel}</span>
                </div>
                <div className={`action-badge ${getActionColor()}`}>
                    <span className='badge-label'>Action:</span>
                    <span className='badge-value'>{prediction.recommendedAction}</span>
                </div>
            </div>
        </div>
    );
};
