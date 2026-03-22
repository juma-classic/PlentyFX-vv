/**
 * Digit Click Integration Example
 * Shows how to integrate fast PATEL bot loading with existing digit displays
 */

import React, { useState } from 'react';
import { EnhancedDigitCircle } from '../zeus-analysis/EnhancedDigitCircle';
import { FastDigitClickHandler } from './FastDigitClickHandler';
import { useFastPatelBotLoader } from '../../hooks/useFastPatelBotLoader';
import './DigitClickIntegrationExample.scss';

interface DigitStat {
    digit: number;
    count: number;
    percentage: number;
}

export const DigitClickIntegrationExample: React.FC = () => {
    const [selectedMarket, setSelectedMarket] = useState('R_50');
    const [currentDigit, setCurrentDigit] = useState<number | null>(7);
    
    // Mock digit statistics (replace with your real data)
    const digitStats: DigitStat[] = [
        { digit: 0, count: 112, percentage: 11.2 },
        { digit: 1, count: 83, percentage: 8.3 },
        { digit: 2, count: 114, percentage: 11.4 },
        { digit: 3, count: 93, percentage: 9.3 },
        { digit: 4, count: 107, percentage: 10.7 },
        { digit: 5, count: 98, percentage: 9.8 },
        { digit: 6, count: 96, percentage: 9.6 },
        { digit: 7, count: 97, percentage: 9.7 },
        { digit: 8, count: 112, percentage: 11.2 },
        { digit: 9, count: 88, percentage: 8.8 },
    ];

    const { loadPatelBot, isLoading, loadingDigit, lastLoadTime, loadCount } = useFastPatelBotLoader({
        market: selectedMarket,
        onLoadStart: (digit) => {
            console.log(`🎯 Started loading PATEL bot for digit ${digit}`);
        },
        onLoadComplete: (digit, loadTime) => {
            console.log(`✅ PATEL bot loaded for digit ${digit} in ${loadTime.toFixed(0)}ms`);
        },
        onLoadError: (digit, error) => {
            console.error(`❌ Failed to load PATEL bot for digit ${digit}:`, error);
        }
    });

    const getDigitRingClass = (digit: number, percentage: number) => {
        if (percentage >= 11) return 'ring-hot';
        if (percentage <= 9) return 'ring-cold';
        return 'ring-normal';
    };

    const getPatelConfig = (digit: number) => {
        if (digit >= 0 && digit <= 4) {
            return { beforeLoss: 8, afterLoss: 6, strategy: 'LOW_DIGITS' };
        } else {
            return { beforeLoss: 1, afterLoss: 3, strategy: 'HIGH_DIGITS' };
        }
    };

    return (
        <div className="digit-click-integration-example">
            <div className="example-header">
                <h3>🎯 Fast PATEL Bot Integration</h3>
                <div className="example-stats">
                    <span>Market: {selectedMarket}</span>
                    {isLoading && <span className="loading-indicator">Loading digit {loadingDigit}...</span>}
                    {lastLoadTime && <span>Last load: {lastLoadTime.toFixed(0)}ms</span>}
                    <span>Loads: {loadCount}</span>
                </div>
            </div>

            <div className="market-selector">
                <select 
                    value={selectedMarket} 
                    onChange={(e) => setSelectedMarket(e.target.value)}
                    disabled={isLoading}
                >
                    <option value="R_10">Volatility 10</option>
                    <option value="R_25">Volatility 25</option>
                    <option value="R_50">Volatility 50</option>
                    <option value="R_75">Volatility 75</option>
                    <option value="R_100">Volatility 100</option>
                </select>
            </div>

            {/* Method 1: Using EnhancedDigitCircle (Recommended) */}
            <div className="integration-method">
                <h4>Method 1: Enhanced Digit Circles (Recommended)</h4>
                <p>Click any digit to load PATEL bot with automatic configuration:</p>
                
                <div className="configuration-info">
                    <div className="config-group">
                        <strong>Digits 0,1,2,3,4:</strong> Before Loss: 8, After Loss: 6
                    </div>
                    <div className="config-group">
                        <strong>Digits 5,6,7,8,9:</strong> Before Loss: 1, After Loss: 3
                    </div>
                </div>

                <div className="digit-circles-grid">
                    {digitStats.map((stat) => (
                        <EnhancedDigitCircle
                            key={stat.digit}
                            digit={stat.digit}
                            count={stat.count}
                            percentage={stat.percentage}
                            ringClass={getDigitRingClass(stat.digit, stat.percentage)}
                            isCurrent={currentDigit === stat.digit}
                            market={selectedMarket}
                            enablePatelBot={true}
                            onPatelBotLoad={(digit, loadTime) => {
                                console.log(`PATEL bot loaded for digit ${digit} in ${loadTime}ms`);
                            }}
                            onPatelBotError={(digit, error) => {
                                console.error(`PATEL bot error for digit ${digit}:`, error);
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Method 2: Using FastDigitClickHandler wrapper */}
            <div className="integration-method">
                <h4>Method 2: Wrapper Component</h4>
                <p>Wrap existing digit elements with FastDigitClickHandler:</p>
                
                <div className="digit-wrapper-examples">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => {
                        const config = getPatelConfig(digit);
                        return (
                            <FastDigitClickHandler
                                key={digit}
                                digit={digit}
                                market={selectedMarket}
                                onLoadStart={(d) => console.log(`Loading ${d}...`)}
                                onLoadComplete={(d, time) => console.log(`Loaded ${d} in ${time}ms`)}
                            >
                                <div className="simple-digit-display">
                                    <div className="digit-number">{digit}</div>
                                    <div className="digit-config">
                                        {config.beforeLoss}/{config.afterLoss}
                                    </div>
                                </div>
                            </FastDigitClickHandler>
                        );
                    })}
                </div>
            </div>

            {/* Method 3: Using the hook directly */}
            <div className="integration-method">
                <h4>Method 3: Direct Hook Usage</h4>
                <p>Use the hook directly in your components:</p>
                
                <div className="hook-example">
                    <div className="hook-buttons">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => {
                            const config = getPatelConfig(digit);
                            return (
                                <button
                                    key={digit}
                                    className={`hook-digit-button ${isLoading && loadingDigit === digit ? 'loading' : ''}`}
                                    onClick={() => loadPatelBot(digit)}
                                    disabled={isLoading}
                                    title={`Load PATEL bot for digit ${digit}\nBefore Loss: ${config.beforeLoss}, After Loss: ${config.afterLoss}`}
                                >
                                    <span className="button-digit">{digit}</span>
                                    <span className="button-config">{config.beforeLoss}/{config.afterLoss}</span>
                                    {isLoading && loadingDigit === digit && (
                                        <div className="button-spinner"></div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Performance info */}
            <div className="performance-info">
                <h4>⚡ Performance Target: &lt;1 Second</h4>
                <div className="performance-details">
                    <div>✅ Optimized XML parsing</div>
                    <div>✅ Parallel operations</div>
                    <div>✅ Cached bot templates</div>
                    <div>✅ Fast string replacement</div>
                    <div>✅ Minimal DOM operations</div>
                </div>
            </div>
        </div>
    );
};

export default DigitClickIntegrationExample;