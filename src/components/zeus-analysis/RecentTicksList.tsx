/**
 * RecentTicksList Component
 * Displays the last 10 ticks with timestamp, quote, last digit, and direction indicators
 */

import React from 'react';
import './RecentTicksList.scss';

export interface TickData {
    epoch: number;
    quote: number;
    lastDigit: number;
    source: 'historical' | 'live';
    localTime: string;
}

export interface TickDisplayData extends TickData {
    direction: 'up' | 'down' | 'neutral';
    isLatest: boolean;
}

interface RecentTicksListProps {
    ticks: TickData[];
    maxDisplay?: number;
}

/**
 * Determine price direction by comparing with previous tick
 */
const getTickDirection = (currentTick: TickData, previousTick: TickData | undefined): 'up' | 'down' | 'neutral' => {
    if (!previousTick) return 'neutral';

    if (currentTick.quote > previousTick.quote) return 'up';
    if (currentTick.quote < previousTick.quote) return 'down';
    return 'neutral';
};

/**
 * Format timestamp to readable time
 */
const formatTime = (localTime: string): string => {
    try {
        const date = new Date(localTime);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
    } catch {
        return localTime;
    }
};

export const RecentTicksList: React.FC<RecentTicksListProps> = React.memo(({ ticks, maxDisplay = 10 }) => {
    // Get last N ticks and reverse to show most recent first
    const recentTicks = ticks.slice(-maxDisplay).reverse();

    // Prepare display data with direction indicators
    const displayTicks: TickDisplayData[] = recentTicks.map((tick, index) => {
        // Since we reversed, we need to look at the next item for previous tick
        const previousTick = recentTicks[index + 1];

        return {
            ...tick,
            direction: getTickDirection(tick, previousTick),
            isLatest: index === 0,
        };
    });

    if (displayTicks.length === 0) {
        return (
            <div className='recent-ticks-list'>
                <h3 className='recent-ticks-title'>📊 Recent Ticks</h3>
                <div className='no-data-message'>No tick data available yet. Waiting for market data...</div>
            </div>
        );
    }

    return (
        <div className='recent-ticks-list'>
            <h3 className='recent-ticks-title'>📊 Recent Ticks (Last {displayTicks.length})</h3>
            <div className='ticks-container'>
                <div className='ticks-header'>
                    <div className='header-time'>Time</div>
                    <div className='header-quote'>Quote</div>
                    <div className='header-digit'>Last Digit</div>
                    <div className='header-direction'>Direction</div>
                </div>
                <div className='ticks-scrollable'>
                    {displayTicks.map((tick, index) => (
                        <div
                            key={`${tick.epoch}-${index}`}
                            className={`tick-row ${tick.isLatest ? 'latest' : ''} ${index % 2 === 0 ? 'even' : 'odd'}`}
                            data-testid={`tick-row-${index}`}
                        >
                            <div className='tick-time' data-testid='tick-time'>
                                {formatTime(tick.localTime)}
                            </div>
                            <div className='tick-quote' data-testid='tick-quote'>
                                {tick.quote.toFixed(2)}
                            </div>
                            <div className='tick-digit' data-testid='tick-digit'>
                                <span className='digit-badge'>{tick.lastDigit}</span>
                            </div>
                            <div className='tick-direction' data-testid='tick-direction'>
                                {tick.direction === 'up' && (
                                    <span className='direction-arrow up' aria-label='Price increased'>
                                        ↑
                                    </span>
                                )}
                                {tick.direction === 'down' && (
                                    <span className='direction-arrow down' aria-label='Price decreased'>
                                        ↓
                                    </span>
                                )}
                                {tick.direction === 'neutral' && (
                                    <span className='direction-arrow neutral' aria-label='Price unchanged'>
                                        →
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
});

RecentTicksList.displayName = 'RecentTicksList';
