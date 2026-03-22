import React from 'react';
import { PatternAnalyzer } from '@/utils/pattern-analyzer';
import { PatternStats } from './PatternStats';
import './PatternDisplay.scss';

interface PatternDisplayProps {
    pattern: ('EVEN' | 'ODD' | 'RISE' | 'FALL' | 'OVER' | 'UNDER')[];
    type: 'evenodd' | 'risefall' | 'overunder';
}

export const PatternDisplay: React.FC<PatternDisplayProps> = ({ pattern, type }) => {
    // Analyze pattern for advanced insights
    const analysis = PatternAnalyzer.analyzePattern(pattern, type);
    // Show last 18 results (2 rows of 9)
    const displayPattern = pattern.slice(-18);

    // Split into 2 rows
    const row1 = displayPattern.slice(0, 9);
    const row2 = displayPattern.slice(9, 18);

    const renderBox = (value: 'EVEN' | 'ODD' | 'RISE' | 'FALL' | 'OVER' | 'UNDER', index: number) => {
        const isGreen = value === 'EVEN' || value === 'RISE' || value === 'OVER';
        const letter =
            type === 'evenodd'
                ? value === 'EVEN'
                    ? 'E'
                    : 'O'
                : type === 'risefall'
                  ? value === 'RISE'
                      ? 'R'
                      : 'F'
                  : value === 'OVER'
                    ? 'O'
                    : 'U';

        return (
            <div key={index} className={`pattern-box ${isGreen ? 'green' : 'red'}`} title={value}>
                {letter}
            </div>
        );
    };

    const [isExpanded, setIsExpanded] = React.useState(true);

    return (
        <div className='pattern-display-container'>
            <div className='pattern-header'>
                <button className='pattern-toggle' onClick={() => setIsExpanded(!isExpanded)} type='button'>
                    <span className='toggle-icon'>{isExpanded ? '▼' : '▶'}</span>
                    <span className='toggle-text'>
                        {isExpanded ? 'Hide Pattern Analysis' : 'Show Pattern Analysis'}
                    </span>
                </button>
            </div>

            {isExpanded && (
                <>
                    <div className='pattern-display'>
                        <div className='pattern-row'>{row1.map((value, idx) => renderBox(value, idx))}</div>
                        {row2.length > 0 && (
                            <div className='pattern-row'>{row2.map((value, idx) => renderBox(value, idx + 9))}</div>
                        )}
                    </div>
                    <PatternStats analysis={analysis} type={type} />
                </>
            )}
        </div>
    );
};
