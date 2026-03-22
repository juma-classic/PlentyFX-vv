import React, { useState } from 'react';
import './EnhancedTradeButton.scss';

interface EnhancedTradeButtonProps {
    action: string;
    stake: string;
    confidence: number;
    type: 'OVER' | 'UNDER' | 'EVEN' | 'ODD' | 'RISE' | 'FALL';
    highlighted?: boolean;
    disabled?: boolean;
    loading?: boolean;
    onClick?: () => void;
    size?: 'small' | 'medium' | 'large';
}

export const EnhancedTradeButton: React.FC<EnhancedTradeButtonProps> = ({
    action = 'Trade Now',
    stake,
    confidence,
    type,
    highlighted = false,
    disabled = false,
    loading = false,
    onClick,
    size = 'large',
}) => {
    const [isPressed, setIsPressed] = useState(false);

    const getVariantClass = (): string => {
        if (confidence >= 90) return 'ultra-high';
        if (confidence >= 80) return 'high';
        if (confidence >= 70) return 'medium-confidence';
        if (confidence >= 60) return 'low';
        return 'very-low';
    };

    const getTypeColor = (): string => {
        switch (type) {
            case 'OVER':
            case 'RISE':
                return '#10b981'; // Green
            case 'UNDER':
            case 'FALL':
                return '#ef4444'; // Red
            case 'EVEN':
                return '#3b82f6'; // Blue
            case 'ODD':
                return '#f59e0b'; // Orange
            default:
                return '#6366f1'; // Purple
        }
    };

    const getTypeIcon = (): string => {
        switch (type) {
            case 'OVER':
                return '📈';
            case 'UNDER':
                return '📉';
            case 'RISE':
                return '🚀';
            case 'FALL':
                return '📉';
            case 'EVEN':
                return '⚖️';
            case 'ODD':
                return '🎯';
            default:
                return '💰';
        }
    };

    const getConfidenceText = (): string => {
        if (confidence >= 90) return 'ULTRA HIGH';
        if (confidence >= 80) return 'HIGH';
        if (confidence >= 70) return 'GOOD';
        if (confidence >= 60) return 'FAIR';
        return 'LOW';
    };

    const handleClick = () => {
        if (disabled || loading) return;

        setIsPressed(true);
        setTimeout(() => setIsPressed(false), 200);

        if (onClick) {
            onClick();
        }
    };

    return (
        <button
            className={`
                enhanced-trade-button 
                ${size} 
                ${getVariantClass()} 
                ${highlighted ? 'highlighted' : ''} 
                ${disabled ? 'disabled' : ''} 
                ${loading ? 'loading' : ''}
                ${isPressed ? 'pressed' : ''}
            `}
            onClick={handleClick}
            disabled={disabled || loading}
            style={
                {
                    '--type-color': getTypeColor(),
                } as React.CSSProperties
            }
        >
            {/* Background glow effect */}
            <div className='button-glow' />

            {/* Loading spinner */}
            {loading && (
                <div className='loading-spinner'>
                    <div className='spinner' />
                </div>
            )}

            {/* Main content */}
            <div className='button-content'>
                {/* Header with confidence */}
                <div className='button-header'>
                    <span className='confidence-badge'>
                        <span className='confidence-icon'>⚡</span>
                        <span className='confidence-text'>{getConfidenceText()}</span>
                        <span className='confidence-percent'>{confidence}%</span>
                    </span>
                </div>

                {/* Main action area */}
                <div className='button-main'>
                    <div className='action-info'>
                        <span className='type-icon'>{getTypeIcon()}</span>
                        <div className='action-details'>
                            <span className='action-text'>{action}</span>
                            <span className='type-text'>{type}</span>
                        </div>
                    </div>

                    <div className='stake-info'>
                        <span className='stake-label'>Stake</span>
                        <span className='stake-amount'>{stake}</span>
                    </div>
                </div>

                {/* Footer with additional info */}
                <div className='button-footer'>
                    <span className='trade-type'>Binary Options</span>
                    <span className='expected-return'>
                        Expected: {stake.replace('$', '$')} → ${(parseFloat(stake.replace('$', '')) * 1.85).toFixed(2)}
                    </span>
                </div>
            </div>

            {/* Ripple effect */}
            <div className='ripple-effect' />

            {/* Pulse animation for highlighted buttons */}
            {highlighted && !disabled && !loading && <div className='pulse-ring' />}
        </button>
    );
};
