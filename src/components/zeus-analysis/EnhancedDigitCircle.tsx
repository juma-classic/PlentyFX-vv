/**
 * Enhanced DigitCircle Component - SIMPLIFIED VERSION
 * Displays a digit circle without any automatic bot loading functionality
 */

import React from 'react';

interface EnhancedDigitCircleProps {
    digit: number;
    count: number;
    percentage: number;
    ringClass: string;
    isCurrent: boolean;
    ariaLabel?: string;
}

export const EnhancedDigitCircle: React.FC<EnhancedDigitCircleProps> = React.memo(
    ({ digit, count, percentage, ringClass, isCurrent, ariaLabel }) => {
        return (
            <div
                className={`digit-circle ${ringClass} ${isCurrent ? 'current' : ''}`}
                role='listitem'
                aria-label={
                    ariaLabel ||
                    `Digit ${digit}: ${percentage.toFixed(1)}% occurrence, ${count} times${isCurrent ? '. Current digit' : ''}`
                }
                style={{
                    cursor: 'default',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                }}
                title={`Digit ${digit}: ${percentage.toFixed(1)}% occurrence`}
            >
                {isCurrent && (
                    <div className='tick-pointer' aria-hidden='true'>
                        <svg width='24' height='24' viewBox='0 0 24 24' fill='none'>
                            <path d='M12 2L15 8L12 14L9 8L12 2Z' fill='#ef4444' stroke='#dc2626' strokeWidth='1.5' />
                            <circle cx='12' cy='12' r='3' fill='#ef4444' />
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

EnhancedDigitCircle.displayName = 'EnhancedDigitCircle';

export default EnhancedDigitCircle;
