import React, { useEffect, useState } from 'react';
import './LivePatternDisplay.scss';

interface LivePatternDisplayProps {
    pattern: ('EVEN' | 'ODD' | 'OVER' | 'UNDER' | 'RISE' | 'FALL')[];
    onPatternChange?: (pattern: string[]) => void;
}

export const LivePatternDisplay: React.FC<LivePatternDisplayProps> = ({ pattern, onPatternChange }) => {
    const [previousPattern, setPreviousPattern] = useState<string[]>([]);
    const [changedIndices, setChangedIndices] = useState<Set<number>>(new Set());
    const [patternAge, setPatternAge] = useState<number>(0);

    // Detect pattern changes
    useEffect(() => {
        if (pattern.length === 0) return;

        const changed = new Set<number>();
        pattern.forEach((item, index) => {
            if (previousPattern[index] !== item) {
                changed.add(index);
            }
        });

        if (changed.size > 0) {
            setChangedIndices(changed);
            setPatternAge(0);

            // Clear highlight after animation
            const timer = setTimeout(() => {
                setChangedIndices(new Set());
            }, 1000);

            return () => clearTimeout(timer);
        }

        setPreviousPattern([...pattern]);
    }, [pattern, previousPattern]);

    // Track pattern age
    useEffect(() => {
        const interval = setInterval(() => {
            setPatternAge(prev => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Notify parent of pattern changes
    useEffect(() => {
        if (onPatternChange && pattern.length > 0) {
            onPatternChange(pattern);
        }
    }, [pattern, onPatternChange]);

    const getBoxColor = (item: string): string => {
        if (item === 'EVEN' || item === 'OVER' || item === 'RISE') return 'green';
        if (item === 'ODD' || item === 'UNDER' || item === 'FALL') return 'red';
        return 'gray';
    };

    const getBoxLabel = (item: string): string => {
        if (item === 'EVEN') return 'E';
        if (item === 'ODD') return 'O';
        if (item === 'OVER') return 'O';
        if (item === 'UNDER') return 'U';
        if (item === 'RISE') return 'R';
        if (item === 'FALL') return 'F';
        return '?';
    };

    const formatPatternAge = (seconds: number): string => {
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
    };

    // Split pattern into rows of 9
    const rows: string[][] = [];
    for (let i = 0; i < pattern.length; i += 9) {
        rows.push(pattern.slice(i, i + 9));
    }

    return (
        <div className='live-pattern-display'>
            <div className='pattern-header'>
                <span className='pattern-label'>Live Pattern (Last {pattern.length} ticks)</span>
                <span className='pattern-age'>{formatPatternAge(patternAge)}</span>
            </div>

            <div className='pattern-grid'>
                {rows.map((row, rowIndex) => (
                    <div key={rowIndex} className='pattern-row'>
                        {row.map((item, colIndex) => {
                            const globalIndex = rowIndex * 9 + colIndex;
                            const isLatest = globalIndex === pattern.length - 1;
                            const isChanged = changedIndices.has(globalIndex);

                            return (
                                <div
                                    key={globalIndex}
                                    className={`pattern-box ${getBoxColor(item)} ${
                                        isLatest ? 'latest' : ''
                                    } ${isChanged ? 'changed' : ''}`}
                                    title={`${item} - Position ${globalIndex + 1}`}
                                >
                                    {getBoxLabel(item)}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {pattern.length === 0 && (
                <div className='pattern-empty'>
                    <span>Waiting for tick data...</span>
                </div>
            )}
        </div>
    );
};
