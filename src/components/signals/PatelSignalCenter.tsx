/**
 * Patel Signal Center - Advanced Statistical Trading Signal Engine
 * Powered by Digit Distribution Scanner with mathematical probability analysis
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    digitDistributionScannerService,
    DigitDistributionSignal,
} from '../../services/digit-distribution-scanner.service';
import { razielBotLoaderService, CustomBotSettings } from '../../services/raziel-bot-loader.service';
import { derivAPIService } from '../../services/deriv-api.service';
import { EnhancedCountdownTimer } from './EnhancedCountdownTimer';
import { ConnectionPoolStatus } from './ConnectionPoolStatus';
import './PatelSignalCenter.scss';

interface PatelSignalCenterProps {
    className?: string;
}

interface DigitFrequencyData {
    digit: number;
    frequency: number;
    percentage: number;
    rank: 'most' | '2nd-most' | '2nd-least' | 'least' | 'normal';
    color: string;
}

interface SignalState {
    signal: DigitDistributionSignal | null;
    isScanning: boolean;
    isLoadingBot: boolean;
    lastScanTime: number;
    scanCount: number;
    digitFrequencies: DigitFrequencyData[];
    currentMarket: string;
    scanProgress: number;
}

interface SettingsState {
    stake: number;
    martingale: number;
    autoScan: boolean;
    scanInterval: number; // minutes
}

const DEFAULT_SETTINGS: SettingsState = {
    stake: 1,
    martingale: 2.2,
    autoScan: false,
    scanInterval: 5,
};

export const PatelSignalCenter: React.FC<PatelSignalCenterProps> = ({ className = '' }) => {
    const [signalState, setSignalState] = useState<SignalState>({
        signal: null,
        isScanning: false,
        isLoadingBot: false,
        lastScanTime: 0,
        scanCount: 0,
        digitFrequencies: [],
        currentMarket: '',
        scanProgress: 0,
    });

    const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
    const [showSettings, setShowSettings] = useState(false);
    const [showSignalDetails, setShowSignalDetails] = useState(false);
    const [autoScanTimer, setAutoScanTimer] = useState<NodeJS.Timeout | null>(null);

    // Load settings from localStorage
    useEffect(() => {
        try {
            const savedSettings = localStorage.getItem('patel-signal-center-settings');
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                setSettings({ ...DEFAULT_SETTINGS, ...parsed });
            }
        } catch (error) {
            console.warn('Failed to load Patel Signal Center settings:', error);
        }
    }, []);

    // Save settings to localStorage
    useEffect(() => {
        try {
            localStorage.setItem('patel-signal-center-settings', JSON.stringify(settings));
        } catch (error) {
            console.warn('Failed to save Patel Signal Center settings:', error);
        }
    }, [settings]);

    // Auto-scan on component mount
    useEffect(() => {
        // Start auto-scan when component mounts
        const timer = setTimeout(() => {
            handleScanForSignals();
        }, 1000); // Start after 1 second

        return () => clearTimeout(timer);
    }, []);

    // Auto-scan functionality
    useEffect(() => {
        if (settings.autoScan && !signalState.isScanning) {
            const interval = setInterval(
                () => {
                    if (!signalState.isScanning && !signalState.signal) {
                        handleScanForSignals();
                    }
                },
                settings.scanInterval * 60 * 1000
            );

            setAutoScanTimer(interval);

            return () => {
                if (interval) clearInterval(interval);
            };
        } else if (autoScanTimer) {
            clearInterval(autoScanTimer);
            setAutoScanTimer(null);
        }
    }, [settings.autoScan, settings.scanInterval, signalState.isScanning, signalState.signal]);

    const analyzeDigitFrequencies = (ticks: any[]): DigitFrequencyData[] => {
        const digitCounts: Record<number, number> = {};

        // Initialize counters
        for (let i = 0; i < 10; i++) {
            digitCounts[i] = 0;
        }

        // Count digit occurrences
        ticks.forEach(tick => {
            const lastDigit = parseInt(tick.quote.toString().slice(-1));
            digitCounts[lastDigit]++;
        });

        // Calculate frequencies and percentages
        const frequencies = Object.entries(digitCounts).map(([digit, count]) => ({
            digit: parseInt(digit),
            frequency: count,
            percentage: (count / ticks.length) * 100,
            rank: 'normal' as const,
            color: '#64748b',
        }));

        // Sort by frequency to determine ranks
        const sorted = [...frequencies].sort((a, b) => b.frequency - a.frequency);

        // Assign ranks and colors
        sorted.forEach((item, index) => {
            const originalItem = frequencies.find(f => f.digit === item.digit)!;
            if (index === 0) {
                originalItem.rank = 'most';
                originalItem.color = '#ef4444'; // Red for most appearing
            } else if (index === 1) {
                originalItem.rank = '2nd-most';
                originalItem.color = '#f97316'; // Orange for 2nd most
            } else if (index === 8) {
                originalItem.rank = '2nd-least';
                originalItem.color = '#3b82f6'; // Blue for 2nd least
            } else if (index === 9) {
                originalItem.rank = 'least';
                originalItem.color = '#10b981'; // Green for least appearing
            } else {
                originalItem.color = '#64748b'; // Gray for normal
            }
        });

        return frequencies.sort((a, b) => a.digit - b.digit);
    };

    const handleScanForSignals = useCallback(async () => {
        if (signalState.isScanning) return;

        setSignalState(prev => ({
            ...prev,
            isScanning: true,
            scanCount: prev.scanCount + 1,
            scanProgress: 0,
            currentMarket: '',
        }));

        try {
            console.log('🟣 [PATEL SIGNAL CENTER] Starting enhanced distribution deviation scan...');

            // Simulate progress updates
            const progressInterval = setInterval(() => {
                setSignalState(prev => ({
                    ...prev,
                    scanProgress: Math.min(prev.scanProgress + 10, 90),
                }));
            }, 200);

            const signal = await digitDistributionScannerService.scanForDistributionDeviations();

            clearInterval(progressInterval);

            // Get digit frequencies from the best market
            let digitFrequencies: DigitFrequencyData[] = [];
            if (signal) {
                try {
                    // Get tick data from the signal's market for frequency analysis
                    const response = await derivAPIService.getTicksHistory({
                        symbol: signal.market,
                        count: 100,
                        end: 'latest',
                        style: 'ticks',
                    });

                    if (response.history && response.history.prices) {
                        const ticks = response.history.prices.map((price: number, index: number) => ({
                            quote: price,
                            epoch: response.history!.times[index],
                        }));
                        digitFrequencies = analyzeDigitFrequencies(ticks);
                    }
                } catch (error) {
                    console.warn('Failed to get digit frequencies:', error);
                }
            }

            setSignalState(prev => ({
                ...prev,
                signal,
                isScanning: false,
                lastScanTime: Date.now(),
                digitFrequencies,
                currentMarket: signal?.marketName || '',
                scanProgress: 100,
            }));

            if (signal) {
                console.log('✅ [PATEL SIGNAL CENTER] Enhanced signal found:', {
                    market: signal.marketName,
                    confidence: signal.confidence.toFixed(1) + '%',
                    action: signal.recommendation.action,
                    barrier: signal.recommendation.barrier,
                });

                // Show signal details automatically
                setShowSignalDetails(true);
            } else {
                console.log('ℹ️ [PATEL SIGNAL CENTER] No signals found in current scan');
            }
        } catch (error) {
            console.error('❌ [PATEL SIGNAL CENTER] Enhanced scan failed:', error);
            setSignalState(prev => ({
                ...prev,
                isScanning: false,
                scanProgress: 0,
            }));
        }
    }, [signalState.isScanning]);

    const handleLoadBot = useCallback(async () => {
        if (!signalState.signal || signalState.isLoadingBot) return;

        setSignalState(prev => ({ ...prev, isLoadingBot: true }));

        try {
            const customSettings: CustomBotSettings = {
                stake: settings.stake,
                martingale: settings.martingale,
            };

            await razielBotLoaderService.loadRazielBotWithDistributionSignal(signalState.signal, customSettings);

            console.log('✅ [PATEL SIGNAL CENTER] Bot loaded successfully');

            // Clear signal after successful bot load
            setSignalState(prev => ({
                ...prev,
                signal: null,
                isLoadingBot: false,
            }));

            setShowSignalDetails(false);
        } catch (error) {
            console.error('❌ [PATEL SIGNAL CENTER] Bot loading failed:', error);
            setSignalState(prev => ({ ...prev, isLoadingBot: false }));
        }
    }, [signalState.signal, signalState.isLoadingBot, settings]);

    const handleClearSignal = useCallback(() => {
        setSignalState(prev => ({ ...prev, signal: null }));
        setShowSignalDetails(false);
    }, []);

    const getQualityIndicator = (confidence: number) => {
        if (confidence >= 80) return { label: '⭐ PREMIUM', class: 'premium' };
        if (confidence >= 65) return { label: '🔥 HIGH', class: 'high' };
        if (confidence >= 55) return { label: '✅ GOOD', class: 'good' };
        return { label: '⚠️ MODERATE', class: 'moderate' };
    };

    const formatTimeAgo = (timestamp: number) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
    };

    return (
        <div className={`patel-signal-center ${className}`}>
            {/* Header */}
            <div className='patel-signal-center__header'>
                <div className='header-left'>
                    <h2 className='title'>
                        <span className='icon'>🟣</span>
                        Patel Signal Center
                    </h2>
                    <p className='subtitle'>Advanced Statistical Trading Engine</p>
                </div>

                <div className='header-right'>
                    <ConnectionPoolStatus />
                    <button className='settings-btn' onClick={() => setShowSettings(true)} title='Settings'>
                        ⚙️
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className='patel-signal-center__content'>
                {/* Enhanced Dashboard Layout */}
                <div className='dashboard-grid'>
                    {/* Scan Controls Card */}
                    <div className='dashboard-card scan-controls-card'>
                        <div className='card-header'>
                            <h3>🔍 Market Scanner</h3>
                            <div className='scan-status'>
                                {signalState.isScanning ? (
                                    <span className='status-scanning'>Scanning...</span>
                                ) : (
                                    <span className='status-ready'>Ready</span>
                                )}
                            </div>
                        </div>

                        <div className='scan-controls'>
                            <button
                                className={`scan-btn ${signalState.isScanning ? 'scanning' : ''}`}
                                onClick={handleScanForSignals}
                                disabled={signalState.isScanning}
                            >
                                {signalState.isScanning ? (
                                    <>
                                        <span className='spinner'></span>
                                        Scanning {signalState.currentMarket}...
                                    </>
                                ) : (
                                    <>
                                        <span className='icon'>🔍</span>
                                        Scan All Markets
                                    </>
                                )}
                            </button>

                            {signalState.isScanning && (
                                <div className='scan-progress'>
                                    <div className='progress-bar'>
                                        <div
                                            className='progress-fill'
                                            style={{ width: `${signalState.scanProgress}%` }}
                                        ></div>
                                    </div>
                                    <span className='progress-text'>{signalState.scanProgress}%</span>
                                </div>
                            )}

                            <div className='scan-stats'>
                                <div className='stat'>
                                    <span className='label'>Total Scans:</span>
                                    <span className='value'>{signalState.scanCount}</span>
                                </div>
                                {signalState.lastScanTime > 0 && (
                                    <div className='stat'>
                                        <span className='label'>Last Scan:</span>
                                        <span className='value'>{formatTimeAgo(signalState.lastScanTime)}</span>
                                    </div>
                                )}
                                <div className='stat'>
                                    <span className='label'>Auto-Scan:</span>
                                    <span className={`value ${settings.autoScan ? 'active' : ''}`}>
                                        {settings.autoScan ? 'ON' : 'OFF'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Digit Frequency Analysis Card */}
                    {signalState.digitFrequencies.length > 0 && (
                        <div className='dashboard-card digit-frequency-card'>
                            <div className='card-header'>
                                <h3>📊 Digit Frequency Analysis</h3>
                                <div className='market-info'>
                                    <span className='market-name'>{signalState.currentMarket}</span>
                                </div>
                            </div>

                            <div className='digit-frequency-grid'>
                                {signalState.digitFrequencies.map(digitData => (
                                    <div
                                        key={digitData.digit}
                                        className={`digit-cell ${digitData.rank}`}
                                        style={{ borderColor: digitData.color }}
                                    >
                                        <div className='digit-number'>{digitData.digit}</div>
                                        <div className='digit-percentage' style={{ color: digitData.color }}>
                                            {digitData.percentage.toFixed(1)}%
                                        </div>
                                        <div className='digit-frequency'>{digitData.frequency} times</div>
                                        <div className='digit-rank'>
                                            {digitData.rank === 'most' && '🔥 Most'}
                                            {digitData.rank === '2nd-most' && '🟠 2nd Most'}
                                            {digitData.rank === '2nd-least' && '🔵 2nd Least'}
                                            {digitData.rank === 'least' && '💎 Least'}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className='frequency-legend'>
                                <div className='legend-item'>
                                    <span className='legend-color most'></span>
                                    <span>Most Appearing</span>
                                </div>
                                <div className='legend-item'>
                                    <span className='legend-color second-most'></span>
                                    <span>2nd Most</span>
                                </div>
                                <div className='legend-item'>
                                    <span className='legend-color second-least'></span>
                                    <span>2nd Least</span>
                                </div>
                                <div className='legend-item'>
                                    <span className='legend-color least'></span>
                                    <span>Least Appearing</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Signal Display */}
                {signalState.signal ? (
                    <div className='signal-display'>
                        <div className='signal-header'>
                            <div className='signal-title'>
                                <h3>📊 Distribution Deviation Signal</h3>
                                <div className='signal-quality'>
                                    <span
                                        className={`quality-badge ${getQualityIndicator(signalState.signal.confidence).class}`}
                                    >
                                        {getQualityIndicator(signalState.signal.confidence).label}
                                    </span>
                                </div>
                            </div>
                            <button className='close-signal-btn' onClick={handleClearSignal} title='Clear Signal'>
                                ✕
                            </button>
                        </div>

                        <div className='signal-summary'>
                            <div className='signal-market'>
                                <span className='label'>Market:</span>
                                <span className='value'>{signalState.signal.marketName}</span>
                            </div>
                            <div className='signal-action'>
                                <span className='label'>Action:</span>
                                <span
                                    className={`value action-${signalState.signal.recommendation.action.toLowerCase()}`}
                                >
                                    {signalState.signal.recommendation.action}{' '}
                                    {signalState.signal.recommendation.barrier}
                                </span>
                            </div>
                            <div className='signal-confidence'>
                                <span className='label'>Confidence:</span>
                                <span className='value'>{signalState.signal.confidence.toFixed(1)}%</span>
                            </div>
                        </div>

                        <div className='signal-actions'>
                            <button className='details-btn' onClick={() => setShowSignalDetails(true)}>
                                📋 View Details
                            </button>
                            <button
                                className={`load-bot-btn ${signalState.isLoadingBot ? 'loading' : ''}`}
                                onClick={handleLoadBot}
                                disabled={signalState.isLoadingBot}
                            >
                                {signalState.isLoadingBot ? (
                                    <>
                                        <span className='spinner'></span>
                                        Loading Bot...
                                    </>
                                ) : (
                                    <>🤖 Load Bot</>
                                )}
                            </button>
                        </div>

                        {/* Countdown Timer */}
                        <div className='signal-timer'>
                            <EnhancedCountdownTimer
                                duration={180} // 3 minutes
                                onComplete={handleClearSignal}
                                label='Signal expires in:'
                            />
                        </div>
                    </div>
                ) : (
                    <div className='no-signal'>
                        <div className='no-signal-icon'>📊</div>
                        <h3>No Active Signals</h3>
                        <p>Click "Scan for Signals" to analyze markets for distribution deviation opportunities.</p>

                        <div className='scan-info'>
                            <div className='info-item'>
                                <span className='icon'>🎯</span>
                                <span>Analyzes 14+ markets simultaneously</span>
                            </div>
                            <div className='info-item'>
                                <span className='icon'>📈</span>
                                <span>Uses statistical Z-score validation</span>
                            </div>
                            <div className='info-item'>
                                <span className='icon'>🧠</span>
                                <span>Mathematical probability analysis</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <div className='modal-overlay' onClick={() => setShowSettings(false)}>
                    <div className='settings-modal' onClick={e => e.stopPropagation()}>
                        <div className='modal-header'>
                            <h3>⚙️ Patel Signal Center Settings</h3>
                            <button className='close-btn' onClick={() => setShowSettings(false)}>
                                ✕
                            </button>
                        </div>

                        <div className='modal-content'>
                            <div className='setting-group'>
                                <label htmlFor='stake'>Initial Stake</label>
                                <input
                                    id='stake'
                                    type='number'
                                    min='0.01'
                                    step='0.01'
                                    value={settings.stake}
                                    onChange={e =>
                                        setSettings(prev => ({
                                            ...prev,
                                            stake: parseFloat(e.target.value) || 0.01,
                                        }))
                                    }
                                />
                            </div>

                            <div className='setting-group'>
                                <label htmlFor='martingale'>Martingale Multiplier</label>
                                <input
                                    id='martingale'
                                    type='number'
                                    min='1'
                                    step='0.1'
                                    value={settings.martingale}
                                    onChange={e =>
                                        setSettings(prev => ({
                                            ...prev,
                                            martingale: parseFloat(e.target.value) || 1,
                                        }))
                                    }
                                />
                            </div>

                            <div className='setting-group'>
                                <label className='checkbox-label'>
                                    <input
                                        type='checkbox'
                                        checked={settings.autoScan}
                                        onChange={e =>
                                            setSettings(prev => ({
                                                ...prev,
                                                autoScan: e.target.checked,
                                            }))
                                        }
                                    />
                                    <span>Enable Auto-Scan</span>
                                </label>
                            </div>

                            {settings.autoScan && (
                                <div className='setting-group'>
                                    <label htmlFor='scanInterval'>Scan Interval (minutes)</label>
                                    <input
                                        id='scanInterval'
                                        type='number'
                                        min='1'
                                        max='60'
                                        value={settings.scanInterval}
                                        onChange={e =>
                                            setSettings(prev => ({
                                                ...prev,
                                                scanInterval: parseInt(e.target.value) || 5,
                                            }))
                                        }
                                    />
                                </div>
                            )}
                        </div>

                        <div className='modal-actions'>
                            <button className='cancel-btn' onClick={() => setShowSettings(false)}>
                                Cancel
                            </button>
                            <button className='save-btn' onClick={() => setShowSettings(false)}>
                                Save Settings
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Signal Details Modal */}
            {showSignalDetails && signalState.signal && (
                <div className='modal-overlay' onClick={() => setShowSignalDetails(false)}>
                    <div className='signal-details-modal' onClick={e => e.stopPropagation()}>
                        <div className='modal-header'>
                            <h3>📊 Signal Analysis Details</h3>
                            <button className='close-btn' onClick={() => setShowSignalDetails(false)}>
                                ✕
                            </button>
                        </div>

                        <div className='modal-content'>
                            <div className='detail-section'>
                                <h4>Signal Information</h4>
                                <div className='detail-grid'>
                                    <div className='detail-item'>
                                        <span className='label'>Market:</span>
                                        <span className='value'>{signalState.signal.marketName}</span>
                                    </div>
                                    <div className='detail-item'>
                                        <span className='label'>Signal Type:</span>
                                        <span className='value'>
                                            {signalState.signal.signalType.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                    <div className='detail-item'>
                                        <span className='label'>Target Digit:</span>
                                        <span className='value'>{signalState.signal.targetDigit}</span>
                                    </div>
                                    <div className='detail-item'>
                                        <span className='label'>Current Price:</span>
                                        <span className='value'>{signalState.signal.currentPrice.toFixed(5)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className='detail-section'>
                                <h4>Statistical Analysis</h4>
                                <div className='detail-grid'>
                                    <div className='detail-item'>
                                        <span className='label'>Total Deviation:</span>
                                        <span className='value'>
                                            {(signalState.signal.analysis.totalDeviation * 100).toFixed(2)}%
                                        </span>
                                    </div>
                                    <div className='detail-item'>
                                        <span className='label'>Max Deviation:</span>
                                        <span className='value'>
                                            {(signalState.signal.analysis.maxDeviation * 100).toFixed(2)}%
                                        </span>
                                    </div>
                                    <div className='detail-item'>
                                        <span className='label'>Correction Potential:</span>
                                        <span className='value'>
                                            {(signalState.signal.analysis.correctionPotential * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className='detail-item'>
                                        <span className='label'>Probability Edge:</span>
                                        <span className='value'>
                                            {(signalState.signal.analysis.probabilityEdge * 100).toFixed(2)}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className='detail-section'>
                                <h4>Recommendation</h4>
                                <div className='recommendation-box'>
                                    <div className='recommendation-action'>
                                        <span
                                            className={`action action-${signalState.signal.recommendation.action.toLowerCase()}`}
                                        >
                                            {signalState.signal.recommendation.action}{' '}
                                            {signalState.signal.recommendation.barrier}
                                        </span>
                                        <span className='confidence'>
                                            {signalState.signal.recommendation.confidence.toFixed(1)}% Confidence
                                        </span>
                                    </div>
                                    <p className='reasoning'>{signalState.signal.recommendation.reasoning}</p>
                                </div>
                            </div>
                        </div>

                        <div className='modal-actions'>
                            <button className='close-btn' onClick={() => setShowSignalDetails(false)}>
                                Close
                            </button>
                            <button
                                className={`load-bot-btn ${signalState.isLoadingBot ? 'loading' : ''}`}
                                onClick={handleLoadBot}
                                disabled={signalState.isLoadingBot}
                            >
                                {signalState.isLoadingBot ? (
                                    <>
                                        <span className='spinner'></span>
                                        Loading Bot...
                                    </>
                                ) : (
                                    <>🤖 Load Bot</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
