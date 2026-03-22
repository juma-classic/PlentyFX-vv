import React, { useEffect, useState } from 'react';
import {
    digitDistributionScannerService,
    DigitDistributionSignal,
} from '@/services/digit-distribution-scanner.service';
import { hotColdZoneScannerService, HotColdZoneSignal } from '@/services/hot-cold-zone-scanner.service';
import { razielBotLoaderService } from '@/services/raziel-bot-loader.service';
import './GlobalDigitCirclesToggle.scss';

const SETTINGS_STORAGE_KEY = 'fibonacci-bot-settings';

interface BotSettings {
    stake: number;
    martingale: number;
}

const DEFAULT_SETTINGS: BotSettings = {
    stake: 1,
    martingale: 2.2,
};

interface SettingsFormProps {
    initialSettings: BotSettings;
    onSave: (settings: BotSettings) => void;
    onCancel: () => void;
}

const SettingsForm: React.FC<SettingsFormProps> = ({ initialSettings, onSave, onCancel }) => {
    const [settings, setSettings] = useState<BotSettings>(initialSettings);

    const handleInputChange = (field: keyof BotSettings, value: string) => {
        const numValue = parseFloat(value) || 0;
        setSettings(prev => ({
            ...prev,
            [field]: numValue,
        }));
    };

    const handleSave = () => {
        onSave(settings);
    };

    return (
        <div className='settings-form'>
            <div className='settings-grid'>
                <div className='setting-item'>
                    <label htmlFor='stake'>Initial Stake</label>
                    <input
                        id='stake'
                        type='number'
                        min='0.01'
                        step='0.01'
                        value={settings.stake}
                        onChange={e => handleInputChange('stake', e.target.value)}
                    />
                </div>

                <div className='setting-item'>
                    <label htmlFor='martingale'>Martingale Multiplier</label>
                    <input
                        id='martingale'
                        type='number'
                        min='1'
                        step='0.1'
                        value={settings.martingale}
                        onChange={e => handleInputChange('martingale', e.target.value)}
                    />
                </div>
            </div>

            <div className='settings-actions'>
                <button className='cancel-button' onClick={onCancel}>
                    Cancel
                </button>
                <button className='save-button' onClick={handleSave}>
                    Save Settings
                </button>
            </div>
        </div>
    );
};

export const GlobalDigitCirclesToggle: React.FC = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [isDistributionScanning, setIsDistributionScanning] = useState(false);
    const [showSignalPopup, setShowSignalPopup] = useState(false);
    const [showDistributionPopup, setShowDistributionPopup] = useState(false);
    const [showSettingsPopup, setShowSettingsPopup] = useState(false);
    const [currentSignal, setCurrentSignal] = useState<HotColdZoneSignal | null>(null);
    const [currentDistributionSignal, setCurrentDistributionSignal] = useState<DigitDistributionSignal | null>(null);
    const [isLoadingBot, setIsLoadingBot] = useState(false);
    const [botSettings, setBotSettings] = useState<BotSettings>(DEFAULT_SETTINGS);
    const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);
    const [distributionClickTimeout, setDistributionClickTimeout] = useState<NodeJS.Timeout | null>(null);
    const [longPressTimeout, setLongPressTimeout] = useState<NodeJS.Timeout | null>(null);
    const [distributionLongPressTimeout, setDistributionLongPressTimeout] = useState<NodeJS.Timeout | null>(null);
    const [isLongPressing, setIsLongPressing] = useState(false);
    const [isDistributionLongPressing, setIsDistributionLongPressing] = useState(false);

    // Countdown timer states
    const [signalCountdown, setSignalCountdown] = useState(180); // 3 minutes in seconds
    const [distributionCountdown, setDistributionCountdown] = useState(180); // 3 minutes in seconds

    useEffect(() => {
        // Load bot settings from localStorage
        try {
            const savedBotSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
            if (savedBotSettings) {
                const parsed = JSON.parse(savedBotSettings);
                setBotSettings({
                    stake: parsed.stake || DEFAULT_SETTINGS.stake,
                    martingale: parsed.martingale || DEFAULT_SETTINGS.martingale,
                });
            }
        } catch (error) {
            console.warn('Failed to load bot settings:', error);
        }
        // Cleanup timeout on unmount
        return () => {
            if (clickTimeout) {
                clearTimeout(clickTimeout);
            }
            if (distributionClickTimeout) {
                clearTimeout(distributionClickTimeout);
            }
            if (longPressTimeout) {
                clearTimeout(longPressTimeout);
            }
            if (distributionLongPressTimeout) {
                clearTimeout(distributionLongPressTimeout);
            }
        };
    }, [clickTimeout, distributionClickTimeout, longPressTimeout, distributionLongPressTimeout]);

    // Countdown timer for Hot/Cold Zone signals
    useEffect(() => {
        if (showSignalPopup && signalCountdown > 0) {
            const timer = setInterval(() => {
                setSignalCountdown(prev => {
                    if (prev <= 1) {
                        setShowSignalPopup(false);
                        setCurrentSignal(null);
                        return 180; // Reset to 3 minutes
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [showSignalPopup, signalCountdown]);

    // Countdown timer for Distribution signals
    useEffect(() => {
        if (showDistributionPopup && distributionCountdown > 0) {
            const timer = setInterval(() => {
                setDistributionCountdown(prev => {
                    if (prev <= 1) {
                        setShowDistributionPopup(false);
                        setCurrentDistributionSignal(null);
                        return 180; // Reset to 3 minutes
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [showDistributionPopup, distributionCountdown]);

    // Format countdown timer display
    const formatCountdown = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const scanForDistributionDeviation = async () => {
        if (isDistributionScanning) return;

        setIsDistributionScanning(true);

        try {
            console.log('Starting Distribution Deviation market scan...');

            // Show scanning notification
            showDistributionScanningNotification();

            // Scan for distribution deviation opportunities
            const signal = await digitDistributionScannerService.scanForDistributionDeviations();

            if (signal) {
                console.log('Distribution Deviation signal found:', signal);

                // Store signal and show popup
                setCurrentDistributionSignal(signal);
                setDistributionCountdown(180); // Reset countdown to 3 minutes
                setShowDistributionPopup(true);

                // Show signal found notification
                showDistributionSignalFoundNotification(signal);
            } else {
                console.log('No suitable Distribution Deviation opportunities found');
                showNoDistributionSignalNotification();
            }
        } catch (error) {
            console.error('Error during distribution scan:', error);
            showErrorNotification(error as Error);
        } finally {
            setIsDistributionScanning(false);
        }
    };

    const scanForSignal = async () => {
        if (isScanning) return;

        setIsScanning(true);

        try {
            console.log('Starting Hot/Cold Zone market scan...');

            // Show scanning notification
            showScanningNotification();

            // Scan for hot/cold zone opportunities
            const signal = await hotColdZoneScannerService.scanForHotColdZones();

            if (signal) {
                console.log('Hot/Cold Zone signal found:', signal);

                // Store signal and show popup
                setCurrentSignal(signal);
                setSignalCountdown(180); // Reset countdown to 3 minutes
                setShowSignalPopup(true);

                // Show signal found notification
                showSignalFoundNotification(signal);
            } else {
                console.log('No suitable Hot/Cold Zone opportunities found');
                showNoSignalNotification();
            }
        } catch (error) {
            console.error('Error during scan:', error);
            showErrorNotification(error as Error);
        } finally {
            setIsScanning(false);
        }
    };

    const loadBotWithDistributionSignal = async () => {
        if (!currentDistributionSignal || isLoadingBot) return;

        setIsLoadingBot(true);

        try {
            console.log('Loading Raziel Over Under bot with Distribution Deviation signal...');

            // Load Raziel Over Under bot with signal parameters and custom settings
            await razielBotLoaderService.loadRazielBotWithDistributionSignal(currentDistributionSignal, botSettings);

            // Close popup
            setShowDistributionPopup(false);
            setCurrentDistributionSignal(null);
        } catch (error) {
            console.error('Error loading bot:', error);
            showErrorNotification(error as Error);
        } finally {
            setIsLoadingBot(false);
        }
    };

    const closeDistributionPopup = () => {
        setShowDistributionPopup(false);
        setCurrentDistributionSignal(null);
    };

    const handleDistributionButtonClick = () => {
        if (distributionClickTimeout) {
            // This is a double-click - open settings
            clearTimeout(distributionClickTimeout);
            setDistributionClickTimeout(null);
            setShowSettingsPopup(true);
        } else {
            // This might be a single-click, wait to see if there's another click
            const timeout = setTimeout(() => {
                setDistributionClickTimeout(null);
                scanForDistributionDeviation();
            }, 300); // 300ms delay to detect double-click
            setDistributionClickTimeout(timeout);
        }
    };

    const handleDistributionButtonMouseDown = () => {
        // Start long press detection
        const timeout = setTimeout(() => {
            setIsDistributionLongPressing(true);
            scanForDistributionDeviationWithLongPress();
        }, 800); // 800ms for long press
        setDistributionLongPressTimeout(timeout);
    };

    const handleDistributionButtonMouseUp = () => {
        // Clear long press timeout
        if (distributionLongPressTimeout) {
            clearTimeout(distributionLongPressTimeout);
            setDistributionLongPressTimeout(null);
        }
        setIsDistributionLongPressing(false);
    };

    const scanForDistributionDeviationWithLongPress = async () => {
        if (isDistributionScanning) return;

        setIsDistributionScanning(true);

        try {
            console.log('🔥 Starting Distribution Deviation scan with LONG PRESS - Enhanced predictions...');

            // Show scanning notification
            showDistributionScanningNotification();

            // Scan for distribution deviation opportunities
            const signal = await digitDistributionScannerService.scanForDistributionDeviations();

            if (signal) {
                console.log('Distribution Deviation signal found with long press enhancement:', signal);

                // Enhance signal with long press prediction values
                // Long press switches from Over 2 → Over 3, Under 7 → Under 6
                const enhancedSignal = {
                    ...signal,
                    longPressMode: true,
                    enhancedPredictions: {
                        beforeLoss: signal.recommendation.action === 'OVER' ? 2 : 7,
                        afterLoss: signal.recommendation.action === 'OVER' ? 3 : 6,
                    },
                };

                // Store enhanced signal and show popup
                setCurrentDistributionSignal(enhancedSignal);
                setDistributionCountdown(180); // Reset countdown to 3 minutes
                setShowDistributionPopup(true);

                // Show enhanced signal found notification
                showEnhancedDistributionSignalFoundNotification(enhancedSignal);
            } else {
                console.log('No suitable Distribution Deviation opportunities found');
                showNoDistributionSignalNotification();
            }
        } catch (error) {
            console.error('Error during long press distribution scan:', error);
            showErrorNotification(error as Error);
        } finally {
            setIsDistributionScanning(false);
            setIsDistributionLongPressing(false);
        }
    };

    const loadBotWithSignal = async () => {
        if (!currentSignal || isLoadingBot) return;

        setIsLoadingBot(true);

        try {
            console.log('Loading Raziel Over Under bot with Hot/Cold Zone signal...');

            // Load Raziel Over Under bot with signal parameters and custom settings
            await razielBotLoaderService.loadRazielBotWithHotColdSignal(currentSignal, botSettings);

            // Close popup
            setShowSignalPopup(false);
            setCurrentSignal(null);
        } catch (error) {
            console.error('Error loading bot:', error);
            showErrorNotification(error as Error);
        } finally {
            setIsLoadingBot(false);
        }
    };

    const closeSignalPopup = () => {
        setShowSignalPopup(false);
        setCurrentSignal(null);
    };

    const handleButtonClick = () => {
        if (clickTimeout) {
            // This is a double-click - open settings
            clearTimeout(clickTimeout);
            setClickTimeout(null);
            setShowSettingsPopup(true);
        } else {
            // This might be a single-click, wait to see if there's another click
            const timeout = setTimeout(() => {
                setClickTimeout(null);
                scanForSignal();
            }, 300); // 300ms delay to detect double-click
            setClickTimeout(timeout);
        }
    };

    const handleButtonMouseDown = () => {
        // Start long press detection
        const timeout = setTimeout(() => {
            setIsLongPressing(true);
            scanForSignalWithLongPress();
        }, 800); // 800ms for long press
        setLongPressTimeout(timeout);
    };

    const handleButtonMouseUp = () => {
        // Clear long press timeout
        if (longPressTimeout) {
            clearTimeout(longPressTimeout);
            setLongPressTimeout(null);
        }
        setIsLongPressing(false);
    };

    const scanForSignalWithLongPress = async () => {
        if (isScanning) return;

        setIsScanning(true);

        try {
            console.log('🔥 Starting Hot/Cold Zone scan with LONG PRESS - Enhanced predictions...');

            // Show scanning notification
            showScanningNotification();

            // Scan for hot/cold zone opportunities
            const signal = await hotColdZoneScannerService.scanForHotColdZones();

            if (signal) {
                console.log('Hot/Cold Zone signal found with long press enhancement:', signal);

                // Enhance signal with long press prediction values
                // Long press switches from Over 2 → Over 3, Under 7 → Under 6
                const enhancedSignal = {
                    ...signal,
                    longPressMode: true,
                    enhancedPredictions: {
                        beforeLoss: signal.recommendation.action === 'OVER' ? 2 : 7,
                        afterLoss: signal.recommendation.action === 'OVER' ? 3 : 6,
                    },
                };

                // Store enhanced signal and show popup
                setCurrentSignal(enhancedSignal);
                setSignalCountdown(180); // Reset countdown to 3 minutes
                setShowSignalPopup(true);

                // Show enhanced signal found notification
                showEnhancedSignalFoundNotification(enhancedSignal);
            } else {
                console.log('No suitable Hot/Cold Zone opportunities found');
                showNoSignalNotification();
            }
        } catch (error) {
            console.error('Error during long press scan:', error);
            showErrorNotification(error as Error);
        } finally {
            setIsScanning(false);
            setIsLongPressing(false);
        }
    };

    const closeSettingsPopup = () => {
        setShowSettingsPopup(false);
    };

    const saveSettings = (newSettings: BotSettings) => {
        try {
            setBotSettings(newSettings);
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
            setShowSettingsPopup(false);

            // Show success notification with current settings
            const notification = createNotification(
                'Settings Saved!',
                `Stake: ${newSettings.stake}, Martingale: ${newSettings.martingale}`,
                '#10b981'
            );
            setTimeout(() => notification.remove(), 3000);
        } catch (error) {
            console.error('Failed to save settings:', error);
            showErrorNotification(error as Error);
        }
    };

    const showDistributionScanningNotification = () => {
        const notification = createNotification(
            'Scanning Markets...',
            'Analyzing Distribution Deviations across all markets',
            '#8b5cf6'
        );

        // Auto-remove after 3 seconds
        setTimeout(() => notification.remove(), 3000);
    };

    const showDistributionSignalFoundNotification = (signal: DigitDistributionSignal) => {
        const notification = createNotification(
            'Distribution Deviation Found!',
            `${signal.marketName}: ${signal.recommendation.action} ${signal.recommendation.barrier} (${signal.confidence.toFixed(1)}% confidence)`,
            '#8b5cf6'
        );

        // Auto-remove after 5 seconds
        setTimeout(() => notification.remove(), 5000);
    };

    const showNoDistributionSignalNotification = () => {
        const notification = createNotification(
            'No Distribution Deviations',
            'All markets showing normal distribution patterns. Try again later.',
            '#f59e0b'
        );

        // Auto-remove after 4 seconds
        setTimeout(() => notification.remove(), 4000);
    };

    const showScanningNotification = () => {
        const notification = createNotification(
            'Scanning Markets...',
            'Analyzing Hot/Cold Zones across all markets',
            '#3b82f6'
        );

        // Auto-remove after 3 seconds
        setTimeout(() => notification.remove(), 3000);
    };

    const showSignalFoundNotification = (signal: HotColdZoneSignal) => {
        const notification = createNotification(
            'Hot/Cold Zone Found!',
            `${signal.marketName}: ${signal.recommendation.action} ${signal.recommendation.barrier} (${signal.confidence.toFixed(1)}% confidence)`,
            '#10b981'
        );

        // Auto-remove after 5 seconds
        setTimeout(() => notification.remove(), 5000);
    };

    const showEnhancedSignalFoundNotification = (
        signal: HotColdZoneSignal & {
            longPressMode: boolean;
            enhancedPredictions: { beforeLoss: number; afterLoss: number };
        }
    ) => {
        const notification = createNotification(
            '🔥 Enhanced Hot/Cold Zone Found!',
            `${signal.marketName}: ${signal.recommendation.action} ${signal.recommendation.barrier} (${signal.confidence.toFixed(1)}% confidence) - Long Press Mode: ${signal.enhancedPredictions.beforeLoss}/${signal.enhancedPredictions.afterLoss}`,
            '#10b981'
        );

        // Auto-remove after 5 seconds
        setTimeout(() => notification.remove(), 5000);
    };

    const showEnhancedDistributionSignalFoundNotification = (
        signal: DigitDistributionSignal & {
            longPressMode: boolean;
            enhancedPredictions: { beforeLoss: number; afterLoss: number };
        }
    ) => {
        const notification = createNotification(
            '🔥 Enhanced Distribution Deviation Found!',
            `${signal.marketName}: ${signal.recommendation.action} ${signal.recommendation.barrier} (${signal.confidence.toFixed(1)}% confidence) - Long Press Mode: ${signal.enhancedPredictions.beforeLoss}/${signal.enhancedPredictions.afterLoss}`,
            '#8b5cf6'
        );

        // Auto-remove after 5 seconds
        setTimeout(() => notification.remove(), 5000);
    };

    const showNoSignalNotification = () => {
        const notification = createNotification(
            'No Hot/Cold Zones',
            'All markets showing balanced distribution. Try again later.',
            '#f59e0b'
        );

        // Auto-remove after 4 seconds
        setTimeout(() => notification.remove(), 4000);
    };

    const showErrorNotification = (error: Error) => {
        const notification = createNotification(
            'Scan Failed',
            `Error: ${error.message || 'Unknown error occurred'}`,
            '#ef4444'
        );

        // Auto-remove after 6 seconds
        setTimeout(() => notification.remove(), 6000);
    };

    const createNotification = (title: string, message: string, color: string) => {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${color};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            z-index: 10001;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 13px;
            font-weight: 600;
            max-width: 300px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            animation: slideIn 0.3s ease-out;
        `;

        notification.innerHTML = `
            <div style="font-weight: 700; margin-bottom: 4px;">${title}</div>
            <div style="font-size: 11px; opacity: 0.9; line-height: 1.3;">${message}</div>
        `;

        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);
        return notification;
    };

    return (
        <div className='global-digit-circles-toggle-container'>
            {/* Distribution Deviation scanner button with integrated settings */}
            <button
                className={`distribution-scanner-toggle ${isDistributionScanning ? 'scanning' : ''} ${isDistributionLongPressing ? 'long-pressing' : ''}`}
                onClick={handleDistributionButtonClick}
                onMouseDown={handleDistributionButtonMouseDown}
                onMouseUp={handleDistributionButtonMouseUp}
                onMouseLeave={handleDistributionButtonMouseUp}
                onTouchStart={handleDistributionButtonMouseDown}
                onTouchEnd={handleDistributionButtonMouseUp}
                disabled={isDistributionScanning}
                title='Single-click to scan, Double-click for settings, Long-press for enhanced predictions'
            >
                <span className='label'>
                    {isDistributionScanning ? 'Scanning...' : isDistributionLongPressing ? 'Enhanced...' : 'Patel'}
                </span>
            </button>

            {/* Hot/Cold Zone scanner button with integrated settings */}
            <button
                className={`hot-cold-scanner-toggle ${isScanning ? 'scanning' : ''} ${isLongPressing ? 'long-pressing' : ''}`}
                onClick={handleButtonClick}
                onMouseDown={handleButtonMouseDown}
                onMouseUp={handleButtonMouseUp}
                onMouseLeave={handleButtonMouseUp}
                onTouchStart={handleButtonMouseDown}
                onTouchEnd={handleButtonMouseUp}
                disabled={isScanning}
                title='Single-click to scan, Double-click for settings, Long-press for enhanced predictions'
            >
                <span className='label'>{isScanning ? 'Scanning...' : isLongPressing ? 'Enhanced...' : 'Raziel'}</span>
            </button>

            {/* Distribution Deviation Signal Popup */}
            {showDistributionPopup && currentDistributionSignal && (
                <div className='signal-popup-overlay' onClick={closeDistributionPopup}>
                    <div className='signal-popup' onClick={e => e.stopPropagation()}>
                        <div className='signal-popup-header'>
                            <h3>Distribution Deviation Opportunity!</h3>
                            <button className='close-button' onClick={closeDistributionPopup}>
                                ×
                            </button>
                        </div>

                        <div className='signal-popup-content'>
                            <div className='signal-main-info'>
                                <div className='market-info'>
                                    <h4>{currentDistributionSignal.marketName}</h4>
                                    {(currentDistributionSignal as any).longPressMode && (
                                        <div className='long-press-badge'>🔥 Enhanced Long Press Mode</div>
                                    )}
                                    {/* Strategy details hidden for privacy */}
                                </div>

                                <div className='confidence-badge'>
                                    <span className='confidence-value'>
                                        {currentDistributionSignal.confidence.toFixed(0)}%
                                    </span>
                                    <span className='confidence-label'>Success Rate</span>
                                </div>
                            </div>

                            <div className='signal-summary'>
                                <div className='trade-recommendation'>
                                    <div className='recommendation-box'>
                                        <span className='recommendation-label'>Trade:</span>
                                        <span
                                            className={`recommendation-action action-${currentDistributionSignal.recommendation.action.toLowerCase()}`}
                                        >
                                            {currentDistributionSignal.recommendation.action}{' '}
                                            {currentDistributionSignal.recommendation.barrier}
                                        </span>
                                    </div>
                                </div>

                                <div className='signal-validity'>
                                    <div className='validity-box'>
                                        <span className='validity-label'>Valid for:</span>
                                        <span className='validity-countdown'>
                                            {formatCountdown(distributionCountdown)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className='signal-details'>
                                <div className='safety-reminder'>
                                    <p>
                                        <strong>Important:</strong> Stop the bot after any loss and recovery to secure
                                        profits.
                                    </p>
                                    {/* Strategy reasoning hidden for privacy */}
                                </div>
                            </div>
                        </div>

                        <div className='signal-popup-actions'>
                            <button className='cancel-button' onClick={closeDistributionPopup} disabled={isLoadingBot}>
                                Cancel
                            </button>
                            <button
                                className='load-bot-button'
                                onClick={loadBotWithDistributionSignal}
                                disabled={isLoadingBot}
                            >
                                {isLoadingBot ? (
                                    <>
                                        <span className='loading-spinner'>Loading...</span>
                                        Loading Bot...
                                    </>
                                ) : (
                                    <>Start Trading</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hot/Cold Zone Signal Popup */}
            {showSignalPopup && currentSignal && (
                <div className='signal-popup-overlay' onClick={closeSignalPopup}>
                    <div className='signal-popup' onClick={e => e.stopPropagation()}>
                        <div className='signal-popup-header'>
                            <h3>Hot/Cold Zone Opportunity!</h3>
                            <button className='close-button' onClick={closeSignalPopup}>
                                ×
                            </button>
                        </div>

                        <div className='signal-popup-content'>
                            <div className='signal-main-info'>
                                <div className='market-info'>
                                    <h4>{currentSignal.marketName}</h4>
                                    {(currentSignal as any).longPressMode && (
                                        <div className='long-press-badge'>🔥 Enhanced Long Press Mode</div>
                                    )}
                                    {/* Strategy details hidden for privacy */}
                                </div>

                                <div className='confidence-badge'>
                                    <span className='confidence-value'>{currentSignal.confidence.toFixed(0)}%</span>
                                    <span className='confidence-label'>Success Rate</span>
                                </div>
                            </div>

                            <div className='signal-summary'>
                                <div className='trade-recommendation'>
                                    <div className='recommendation-box'>
                                        <span className='recommendation-label'>Trade:</span>
                                        <span
                                            className={`recommendation-action action-${currentSignal.recommendation.action.toLowerCase()}`}
                                        >
                                            {currentSignal.recommendation.action} {currentSignal.recommendation.barrier}
                                        </span>
                                    </div>
                                </div>

                                <div className='signal-validity'>
                                    <div className='validity-box'>
                                        <span className='validity-label'>Valid for:</span>
                                        <span className='validity-countdown'>{formatCountdown(signalCountdown)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className='signal-details'>
                                <div className='safety-reminder'>
                                    <p>
                                        <strong>Important:</strong> Stop the bot after any loss and recovery to secure
                                        profits.
                                    </p>
                                    {/* Strategy reasoning hidden for privacy */}
                                </div>
                            </div>
                        </div>

                        <div className='signal-popup-actions'>
                            <button className='cancel-button' onClick={closeSignalPopup} disabled={isLoadingBot}>
                                Cancel
                            </button>
                            <button className='load-bot-button' onClick={loadBotWithSignal} disabled={isLoadingBot}>
                                {isLoadingBot ? (
                                    <>
                                        <span className='loading-spinner'>Loading...</span>
                                        Loading Bot...
                                    </>
                                ) : (
                                    <>Start Trading</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Settings Popup */}
            {showSettingsPopup && (
                <div className='signal-popup-overlay' onClick={closeSettingsPopup}>
                    <div className='settings-popup' onClick={e => e.stopPropagation()}>
                        <div className='settings-popup-header'>
                            <h3>Bot Settings</h3>
                            <button className='close-button' onClick={closeSettingsPopup}>
                                ×
                            </button>
                        </div>

                        <div className='settings-popup-content'>
                            <SettingsForm
                                initialSettings={botSettings}
                                onSave={saveSettings}
                                onCancel={closeSettingsPopup}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
