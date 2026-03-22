import React, { useState, useEffect } from 'react';
import type { PatelSignal } from '../../../types/patel-signals';
import ConfidenceMeter from './ConfidenceMeter';
import { ZapIcon, ArrowRightIcon } from './icons';

interface SignalCardProps {
    signal: PatelSignal;
    onTrade?: (signal: PatelSignal) => void;
}

const SignalCard: React.FC<SignalCardProps> = ({ signal, onTrade }) => {
    const [timeRemaining, setTimeRemaining] = useState(0);

    useEffect(() => {
        const updateTimer = () => {
            const remaining = Math.max(0, Math.floor((signal.expiresAt - Date.now()) / 1000));
            setTimeRemaining(remaining);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [signal.expiresAt]);

    const isExpired = timeRemaining === 0;
    const isLowTime = timeRemaining < 30;

    const getContractIcon = () => {
        switch (signal.type) {
            case 'MATCHES':
                return '=';
            case 'DIFFERS':
                return '≠';
            case 'OVER':
                return '>';
            case 'UNDER':
                return '<';
            case 'EVEN':
                return 'E';
            case 'ODD':
                return 'O';
        }
    };

    return (
        <div className={`signal-card glass-card ${isExpired ? 'signal-card--expired' : ''}`}>
            {/* Header */}
            <div className='signal-card__header'>
                <span className='signal-card__market-badge'>{signal.market}</span>
                <span className={`signal-card__type-badge signal-card__type-badge--${signal.type.toLowerCase()}`}>
                    <span className='signal-card__type-icon'>{getContractIcon()}</span>
                    {signal.type}
                </span>
                <div className='signal-card__confidence-meter'>
                    <ConfidenceMeter
                        percentage={signal.confidencePercentage}
                        level={signal.confidence}
                        variant='circular'
                        size={50}
                    />
                </div>
            </div>

            {/* Main Digit Display */}
            <div className='signal-card__main'>
                <div className='signal-card__digit-display'>
                    <span className='signal-card__digit-label'>Target Digit</span>
                    <span className='signal-card__digit'>{signal.digit}</span>
                    {signal.barrier !== undefined && (
                        <span className='signal-card__barrier'>Barrier: {signal.barrier}</span>
                    )}
                </div>
            </div>

            {/* Entry Proposal */}
            <div className='signal-card__entry-proposal'>
                <div className='signal-card__entry-header'>
                    <ZapIcon size={16} />
                    <span>Entry Proposal</span>
                </div>
                <div className='signal-card__entry-content'>
                    <div className='signal-card__suggested-digit'>
                        <span className='signal-card__suggested-label'>Suggested:</span>
                        <span className='signal-card__suggested-value'>{signal.suggestedEntryDigit}</span>
                    </div>
                    {signal.alternativeDigits.length > 0 && (
                        <div className='signal-card__alternatives'>
                            <span className='signal-card__alternatives-label'>Alternatives:</span>
                            <div className='signal-card__alternatives-list'>
                                {signal.alternativeDigits.map(digit => (
                                    <span key={digit} className='signal-card__alternative-digit'>
                                        {digit}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className='signal-card__entry-patterns'>
                    {signal.entryPatterns.map((pattern, index) => (
                        <div key={index} className='signal-card__pattern'>
                            <span className='signal-card__pattern-desc'>{pattern.description}</span>
                            <span className='signal-card__pattern-prob'>{Math.round(pattern.probability)}%</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Strategy */}
            <div className='signal-card__strategy'>
                <ZapIcon size={16} />
                <span>{signal.strategy}</span>
            </div>

            {/* Reasoning */}
            <div className='signal-card__reasoning'>{signal.reasoning}</div>

            {/* Patel Metrics */}
            <div className='signal-card__metrics'>
                <div className='signal-card__metric'>
                    <span className='signal-card__metric-label'>Frequency</span>
                    <span className='signal-card__metric-value'>{signal.patelMetrics.digitFrequency}%</span>
                </div>
                <div className='signal-card__metric'>
                    <span className='signal-card__metric-label'>Last Seen</span>
                    <span className='signal-card__metric-value'>{signal.patelMetrics.lastSeenTicks} ticks</span>
                </div>
                <div className='signal-card__metric'>
                    <span className='signal-card__metric-label'>Hot/Cold</span>
                    <span
                        className={`signal-card__metric-value ${signal.patelMetrics.hotColdScore > 0 ? 'signal-card__metric-value--hot' : 'signal-card__metric-value--cold'}`}
                    >
                        {signal.patelMetrics.hotColdScore > 0 ? '+' : ''}
                        {signal.patelMetrics.hotColdScore}
                    </span>
                </div>
            </div>

            {/* Trade Info */}
            <div className='signal-card__trade-info'>
                <div className='signal-card__trade-item'>
                    <span className='signal-card__trade-label'>Stake:</span>
                    <span className='signal-card__trade-value'>${signal.recommendedStake}</span>
                </div>
                <div className='signal-card__trade-item'>
                    <span className='signal-card__trade-label'>Runs:</span>
                    <span className='signal-card__trade-value'>{signal.recommendedRuns}</span>
                </div>
                <div className='signal-card__trade-item'>
                    <span className='signal-card__trade-label'>Duration:</span>
                    <span className='signal-card__trade-value'>{signal.duration}</span>
                </div>
            </div>

            {/* Footer */}
            <div className='signal-card__footer'>
                <div className={`signal-card__timer ${isLowTime ? 'signal-card__timer--warning pulsing' : ''}`}>
                    {isExpired ? 'EXPIRED' : `${timeRemaining}s remaining`}
                </div>
                <button className='signal-card__trade-btn' disabled={isExpired} onClick={() => onTrade?.(signal)}>
                    Trade Now
                    <ArrowRightIcon size={16} />
                </button>
            </div>
        </div>
    );
};

export default SignalCard;
