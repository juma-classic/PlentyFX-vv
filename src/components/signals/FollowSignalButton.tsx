/**
 * Follow Signal Button Component
 * One-click button to execute trades based on signal recommendations
 */

import React, { useState } from 'react';
import type { PredictionResult } from '../../services/pattern-predictor.service';
import './FollowSignalButton.scss';

interface FollowSignalButtonProps {
    prediction: PredictionResult;
    signalType: 'RISE' | 'FALL' | 'EVEN' | 'ODD' | 'OVER' | 'UNDER';
    amount?: number;
    duration?: number;
    onExecute?: (success: boolean) => void;
    disabled?: boolean;
}

export const FollowSignalButton: React.FC<FollowSignalButtonProps> = ({
    prediction,
    signalType,
    amount = 1,
    duration = 5,
    onExecute,
    disabled = false,
}) => {
    const [isExecuting, setIsExecuting] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [executionResult, setExecutionResult] = useState<'success' | 'error' | null>(null);

    const handleClick = () => {
        if (disabled || isExecuting) return;
        setShowConfirmation(true);
    };

    const handleConfirm = async () => {
        setShowConfirmation(false);
        setIsExecuting(true);
        setExecutionResult(null);

        try {
            // Simulate trade execution
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Here you would integrate with Deriv API
            // const result = await derivAPI.buy({ ... });

            setExecutionResult('success');
            onExecute?.(true);

            // Reset after 3 seconds
            setTimeout(() => {
                setExecutionResult(null);
                setIsExecuting(false);
            }, 3000);
        } catch (error) {
            setExecutionResult('error');
            onExecute?.(false);

            setTimeout(() => {
                setExecutionResult(null);
                setIsExecuting(false);
            }, 3000);
        }
    };

    const handleCancel = () => {
        setShowConfirmation(false);
    };

    const getButtonText = () => {
        if (executionResult === 'success') return '✓ Trade Executed';
        if (executionResult === 'error') return '✗ Trade Failed';
        if (isExecuting) return 'Executing...';
        return `Follow Signal: ${signalType}`;
    };

    const getButtonClass = () => {
        let className = 'follow-signal-button';
        if (disabled) className += ' disabled';
        if (isExecuting) className += ' executing';
        if (executionResult === 'success') className += ' success';
        if (executionResult === 'error') className += ' error';
        if (prediction.confidence >= 70) className += ' high-confidence';
        return className;
    };

    return (
        <>
            <button className={getButtonClass()} onClick={handleClick} disabled={disabled || isExecuting}>
                <span className="button-icon">🎯</span>
                <span className="button-text">{getButtonText()}</span>
                {!executionResult && (
                    <span className="confidence-badge">{prediction.confidence}%</span>
                )}
            </button>

            {showConfirmation && (
                <div className="confirmation-modal">
                    <div className="modal-overlay" onClick={handleCancel} />
                    <div className="modal-content">
                        <h3>Confirm Trade</h3>

                        <div className="trade-details">
                            <div className="detail-row">
                                <span className="label">Signal:</span>
                                <span className="value">{signalType}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Amount:</span>
                                <span className="value">${amount}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Duration:</span>
                                <span className="value">{duration} ticks</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Confidence:</span>
                                <span className="value confidence">{prediction.confidence}%</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Risk:</span>
                                <span className={`value risk-${prediction.riskLevel.toLowerCase()}`}>
                                    {prediction.riskLevel}
                                </span>
                            </div>
                        </div>

                        <div className="prediction-info">
                            <p className="reasoning">{prediction.reasoning}</p>
                        </div>

                        <div className="modal-actions">
                            <button className="cancel-button" onClick={handleCancel}>
                                Cancel
                            </button>
                            <button className="confirm-button" onClick={handleConfirm}>
                                Execute Trade
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
