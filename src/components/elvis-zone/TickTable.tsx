import React from 'react';
import './TickTable.scss';

interface TickData {
    quote: number;
    epoch: number;
    lastDigit: number;
    timestamp: string;
}

interface TickTableProps {
    ticks: TickData[];
    maxRows: number;
    highlightDigit?: number;
}

export const TickTable: React.FC<TickTableProps> = ({ ticks, maxRows, highlightDigit }) => {
    const getDigitColor = (digit: number): string => {
        const colors = [
            '#ef4444',
            '#f97316',
            '#eab308',
            '#22c55e',
            '#06b6d4',
            '#3b82f6',
            '#8b5cf6',
            '#ec4899',
            '#f43f5e',
            '#10b981',
        ];
        return colors[digit];
    };

    const formatQuote = (quote: number): string => {
        return quote.toFixed(5);
    };

    const getRowClass = (tick: TickData, index: number): string => {
        let className = 'tick-row';

        if (index === 0) className += ' latest';
        if (tick.lastDigit === highlightDigit) className += ' highlighted';

        return className;
    };

    return (
        <div className='tick-table'>
            <div className='table-header'>
                <h3>📊 Live Tick Data</h3>
                <div className='tick-count'>
                    {ticks.length}/{maxRows} ticks
                </div>
            </div>

            <div className='table-container'>
                <div className='table-headers'>
                    <div className='header-cell time'>Time</div>
                    <div className='header-cell quote'>Quote</div>
                    <div className='header-cell digit'>Last Digit</div>
                </div>

                <div className='table-body'>
                    {ticks.length === 0 ? (
                        <div className='empty-state'>
                            <div className='empty-icon'>📡</div>
                            <div className='empty-text'>Waiting for tick data...</div>
                        </div>
                    ) : (
                        ticks.map((tick, index) => (
                            <div key={`${tick.epoch}-${index}`} className={getRowClass(tick, index)}>
                                <div className='cell time'>{tick.timestamp}</div>
                                <div className='cell quote'>{formatQuote(tick.quote)}</div>
                                <div
                                    className='cell digit'
                                    style={{
                                        color: getDigitColor(tick.lastDigit),
                                        fontWeight: tick.lastDigit === highlightDigit ? '700' : '600',
                                    }}
                                >
                                    {tick.lastDigit}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {ticks.length > 0 && (
                <div className='table-footer'>
                    <div className='stats'>
                        <div className='stat'>
                            <span className='stat-label'>Latest:</span>
                            <span className='stat-value' style={{ color: getDigitColor(ticks[0]?.lastDigit || 0) }}>
                                {ticks[0]?.lastDigit}
                            </span>
                        </div>
                        <div className='stat'>
                            <span className='stat-label'>Buffer:</span>
                            <span className='stat-value'>{Math.round((ticks.length / maxRows) * 100)}%</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
