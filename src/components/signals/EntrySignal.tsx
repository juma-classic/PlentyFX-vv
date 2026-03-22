import React, { useEffect, useState } from 'react';
import type { EntryPoint } from '../../services/entry-point-detector.service';
import { entryPointDetector } from '../../services/entry-point-detector.service';
import './EntrySignal.scss';

interface EntrySignalProps {
    pattern: string[];
    onEntryDetected?: (entry: EntryPoint) => void;
}

export const EntrySignal: React.FC<EntrySignalProps> = ({ pattern, onEntryDetected }) => {
    const [entryPoint, setEntryPoint] = useState<EntryPoint | null>(null);
    const [isFlashing, setIsFlashing] = useState(false);

    useEffect(() => {
        const newEntry = entryPointDetector.detectEntryPoint(pattern);
        setEntryPoint(newEntry);

        // Flash animation on ENTER_NOW
        if (newEntry.type === 'ENTER_NOW') {
            setIsFlashing(true);
            const timer = setTimeout(() => setIsFlashing(false), 1000);

            if (onEntryDetected) {
                onEntryDetected(newEntry);
            }

            return () => clearTimeout(timer);
        }
    }, [pattern, onEntryDetected]);

    if (!entryPoint || entryPoint.score === 0) return null;

    const getTypeClass = (): string => {
        switch (entryPoint.type) {
            case 'ENTER_NOW':
                return 'enter-now';
            case 'WAIT':
                return 'wait';
            case 'CAUTION':
                return 'caution';
            default:
                return '';
        }
    };

    const getTypeIcon = (): string => {
        switch (entryPoint.type) {
            case 'ENTER_NOW':
                return '🚀';
            case 'WAIT':
                return '⏳';
            case 'CAUTION':
                return '⚠️';
            default:
                return '📊';
        }
    };

    const getTypeText = (): string => {
        switch (entryPoint.type) {
            case 'ENTER_NOW':
                return 'ENTER NOW';
            case 'WAIT':
                return 'WAIT FOR BETTER SETUP';
            case 'CAUTION':
                return 'CAUTION - WEAK SIGNAL';
            default:
                return 'ANALYZING';
        }
    };

    return (
        <div className={`entry-signal ${getTypeClass()} ${isFlashing ? 'flashing' : ''}`}>
            {/* Main Banner */}
            <div className='entry-banner'>
                <span className='entry-icon'>{getTypeIcon()}</span>
                <span className='entry-text'>{getTypeText()}</span>
                <span className='entry-score'>{entryPoint.score}/100</span>
            </div>

            {/* Entry Details */}
            <div className='entry-details'>
                <div className='detail-row'>
                    <div className='detail-item'>
                        <span className='detail-label'>Confidence</span>
                        <span className='detail-value'>{entryPoint.confidence}%</span>
                    </div>
                    <div className='detail-item'>
                        <span className='detail-label'>Risk/Reward</span>
                        <span className='detail-value success'>{entryPoint.riskRewardRatio}:1</span>
                    </div>
                    <div className='detail-item'>
                        <span className='detail-label'>Expected Profit</span>
                        <span className='detail-value success'>{entryPoint.expectedProfit}%</span>
                    </div>
                </div>

                {/* Entry Window */}
                {entryPoint.type === 'ENTER_NOW' && (
                    <div className='entry-window'>
                        <span className='window-icon'>⏰</span>
                        <span className='window-text'>
                            Window closes in {entryPoint.entryWindowTicks} tick
                            {entryPoint.entryWindowTicks !== 1 ? 's' : ''}
                        </span>
                    </div>
                )}

                {/* Reason */}
                <div className='entry-reason'>
                    <span className='reason-icon'>💡</span>
                    <span className='reason-text'>{entryPoint.reason}</span>
                </div>

                {/* Conditions Indicators */}
                <div className='conditions-indicators'>
                    {entryPoint.conditions.streakLength >= 7 && (
                        <div className='indicator'>
                            <span className='indicator-icon'>🔥</span>
                            <span className='indicator-text'>{entryPoint.conditions.streakLength} Streak</span>
                        </div>
                    )}

                    {entryPoint.conditions.distributionImbalance >= 10 && (
                        <div className='indicator'>
                            <span className='indicator-icon'>⚖️</span>
                            <span className='indicator-text'>
                                {entryPoint.conditions.distributionImbalance} Imbalance
                            </span>
                        </div>
                    )}

                    {entryPoint.conditions.isAlternating && (
                        <div className='indicator'>
                            <span className='indicator-icon'>🔄</span>
                            <span className='indicator-text'>Alternating</span>
                        </div>
                    )}

                    {entryPoint.conditions.isFibonacci && (
                        <div className='indicator'>
                            <span className='indicator-icon'>φ</span>
                            <span className='indicator-text'>Fibonacci</span>
                        </div>
                    )}

                    {entryPoint.conditions.multipleSignalsAligned && (
                        <div className='indicator'>
                            <span className='indicator-icon'>✨</span>
                            <span className='indicator-text'>Multiple Signals</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
