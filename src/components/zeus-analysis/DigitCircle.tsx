/**
 * DigitCircle Component
 * Displays a single digit with its statistics in a circular format
 */

import React from 'react';

interface DigitCircleProps {
    digit: number;
    count: number;
    percentage: number;
    ringClass: string;
    isCurrent: boolean;
    ariaLabel?: string;
    onClick?: (digit: number) => void;
    isClickable?: boolean;
    showBullseye?: boolean;
}

export const DigitCircle: React.FC<DigitCircleProps> = React.memo(
    ({
        digit,
        count,
        percentage,
        ringClass,
        isCurrent,
        ariaLabel,
        onClick,
        isClickable = false,
        showBullseye = false,
    }) => {
        const handleClick = () => {
            if (isClickable && onClick) {
                onClick(digit);
            }
        };

        const handleKeyDown = (event: React.KeyboardEvent) => {
            if (isClickable && onClick && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                onClick(digit);
            }
        };

        return (
            <div
                className={`digit-circle ${ringClass} ${isCurrent ? 'current' : ''} ${isClickable ? 'clickable' : ''}`}
                role='listitem'
                aria-label={
                    ariaLabel ||
                    `Digit ${digit}: ${percentage.toFixed(1)}% occurrence, ${count} times${isCurrent ? '. Current digit' : ''}${isClickable ? '. Click to load Raziel bot with this entry point' : ''}`
                }
                tabIndex={isClickable ? 0 : -1}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                style={{
                    cursor: isClickable ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                }}
            >
                {isCurrent && (
                    <div className='tick-pointer' aria-hidden='true'>
                        <svg width='24' height='24' viewBox='0 0 24 24' fill='none'>
                            <path d='M12 2L15 8L12 14L9 8L12 2Z' fill='#ef4444' stroke='#dc2626' strokeWidth='1.5' />
                            <circle cx='12' cy='12' r='3' fill='#ef4444' />
                        </svg>
                    </div>
                )}

                {/* Bullseye indicator - only shown for hot digits */}
                {showBullseye && (
                    <div className='bullseye-indicator' aria-hidden='true' title='Hot Digit'>
                        <svg width='20' height='20' viewBox='0 0 24 24' fill='none'>
                            <circle cx='12' cy='12' r='10' stroke='#ef4444' strokeWidth='2' fill='none' />
                            <circle cx='12' cy='12' r='6' stroke='#ef4444' strokeWidth='2' fill='none' />
                            <circle cx='12' cy='12' r='2' fill='#ef4444' />
                        </svg>
                    </div>
                )}

                <div className='circle-content'>
                    <div className='digit-number' aria-hidden='true'>
                        {digit}
                    </div>
                    <div className='digit-percentage' aria-hidden='true'>
                        {percentage.toFixed(1)}%
                    </div>
                </div>
            </div>
        );
    }
);

DigitCircle.displayName = 'DigitCircle';
