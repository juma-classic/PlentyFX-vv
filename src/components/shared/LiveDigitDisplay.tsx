/**
 * Live Digit Display Component
 * Reusable component for showing live digit analysis in any section
 */

import React from 'react';
import { useLiveDigitAnalysis } from '@/hooks/useLiveDigitAnalysis';
import { ConnectionType } from '@/services/deriv-connection-pool.service';
import './LiveDigitDisplay.scss';

interface LiveDigitDisplayProps {
    symbol?: string;
    layout?: 'grid' | 'horizontal' | 'vertical' | 'compact';
    size?: 'small' | 'medium' | 'large';
    showStats?: boolean;
    showCurrentTick?: boolean;
    showHotDigits?: boolean;
    enableDebug?: boolean;
    className?: string;
    connectionType?: ConnectionType;
}

export const LiveDigitDisplay: React.FC<LiveDigitDisplayProps> = ({
    symbol = 'R_100',
    layout = 'grid',
    size = 'medium',
    showStats = true,
    showCurrentTick = true,
    showHotDigits = true,
    enableDebug = false,
    className = '',
    connectionType = ConnectionType.SIGNALS,
}) => {
    const {
        digitData,
        currentTick,
        isConnected,
        isLoading,
        ticksPerSecond,
        totalTicks,
        hotDigitsCount,
        getDigitColor,
        isHotDigit,
        getTopDigits,
        getDigitStreak,
        resetData,
        connectionQuality,
    } = useLiveDigitAnalysis({
        symbol,
        enableDebug,
        connectionType,
    });

    const streak = getDigitStreak();
    const topDigits = getTopDigits(3);

    const renderDigitItem = (data: (typeof digitData)[0], index: number) => (
        <div
            key={index}
            className={`digit-item ${isHotDigit(index) ? 'hot' : ''} ${currentTick === index ? 'current' : ''}`}
            style={{
                borderColor: getDigitColor(index),
                backgroundColor: currentTick === index ? getDigitColor(index) + '20' : 'transparent',
            }}
        >
            <div className='digit-circle' style={{ borderColor: getDigitColor(index) }}>
                <span className='digit-number'>{index}</span>
                {currentTick === index && <div className='current-indicator'>▼</div>}
            </div>
            <div className='digit-percentage' style={{ color: getDigitColor(index) }}>
                {data.percentage.toFixed(1)}%
            </div>
        </div>
    );

    const renderGridLayout = () => (
        <div className='digit-grid'>{digitData.map((data, index) => renderDigitItem(data, index))}</div>
    );

    const renderHorizontalLayout = () => (
        <div className='digit-horizontal'>{digitData.map((data, index) => renderDigitItem(data, index))}</div>
    );

    const renderVerticalLayout = () => (
        <div className='digit-vertical'>{digitData.map((data, index) => renderDigitItem(data, index))}</div>
    );

    const renderCompactLayout = () => (
        <div className='digit-compact'>
            <div className='current-display'>
                <span
                    className='current-digit'
                    style={{ color: currentTick !== null ? getDigitColor(currentTick) : '#8b92a7' }}
                >
                    {currentTick ?? '-'}
                </span>
                <span className='current-label'>Last Digit</span>
            </div>
            <div className='top-digits'>
                {topDigits.map(data => (
                    <div key={data.digit} className='top-digit'>
                        <span className='digit' style={{ color: getDigitColor(data.digit) }}>
                            {data.digit}
                        </span>
                        <span className='percentage'>{data.percentage.toFixed(1)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderLayout = () => {
        switch (layout) {
            case 'horizontal':
                return renderHorizontalLayout();
            case 'vertical':
                return renderVerticalLayout();
            case 'compact':
                return renderCompactLayout();
            default:
                return renderGridLayout();
        }
    };

    return (
        <div className={`live-digit-display ${layout} ${size} ${className}`}>
            {/* Header */}
            <div className='display-header'>
                <div className='title'>
                    <span className='icon'>🎯</span>
                    <span className='text'>Live Digits - {symbol}</span>
                </div>
                <div className='status'>
                    <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                        <span className='dot'></span>
                        <span className='label'>{isConnected ? 'LIVE' : 'OFF'}</span>
                    </div>
                    {enableDebug && (
                        <button className='reset-btn' onClick={resetData} title='Reset data'>
                            🔄
                        </button>
                    )}
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className='loading-state'>
                    <div className='loading-spinner'></div>
                    <span>Loading historical data...</span>
                </div>
            )}

            {/* Main Display */}
            {!isLoading && (
                <>
                    {renderLayout()}

                    {/* Current Tick Display */}
                    {showCurrentTick && layout !== 'compact' && (
                        <div className='current-tick-display'>
                            <div className='current-info'>
                                <span className='label'>Last Digit:</span>
                                <span
                                    className='value'
                                    style={{ color: currentTick !== null ? getDigitColor(currentTick) : '#8b92a7' }}
                                >
                                    {currentTick ?? '-'}
                                </span>
                            </div>
                            {streak.count > 1 && (
                                <div className='streak-info'>
                                    <span className='streak-label'>Streak:</span>
                                    <span className='streak-value' style={{ color: getDigitColor(streak.digit!) }}>
                                        {streak.digit} × {streak.count}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Stats */}
                    {showStats && (
                        <div className='stats-display'>
                            <div className='stat'>
                                <span className='label'>Ticks:</span>
                                <span className='value'>{totalTicks}</span>
                            </div>
                            <div className='stat'>
                                <span className='label'>Rate:</span>
                                <span className='value'>{ticksPerSecond.toFixed(1)}/s</span>
                            </div>
                            {showHotDigits && (
                                <div className='stat'>
                                    <span className='label'>Hot:</span>
                                    <span className='value'>{hotDigitsCount}</span>
                                </div>
                            )}
                            <div className='stat'>
                                <span className='label'>Quality:</span>
                                <span
                                    className={`value ${connectionQuality === 100 ? 'perfect' : connectionQuality > 90 ? 'good' : 'poor'}`}
                                >
                                    {connectionQuality}%
                                </span>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default LiveDigitDisplay;
