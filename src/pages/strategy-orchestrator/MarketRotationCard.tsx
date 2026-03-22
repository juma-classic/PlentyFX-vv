import React, { useState, useEffect } from 'react';
import { marketAnalyzer } from '@/services/market-analyzer.service';
import { GearIcon, CheckIcon, CrossIcon, SpinnerIcon } from './MechanicalIcons';
import './MarketRotationCard.scss';

interface MarketRotationSettings {
    enabled: boolean;
    markets: string[];
    runsPerMarket: number;
    currentMarketIndex: number;
    runsCompleted: number;
}

const VOLATILITY_MARKETS = [
    'R_10', 'R_25', 'R_50', 'R_75', 'R_100',
    '1HZ10V', '1HZ25V', '1HZ50V', '1HZ75V', '1HZ100V',
    '1HZ150V', '1HZ200V', '1HZ300V'
];

const MarketRotationCard: React.FC = () => {
    const [settings, setSettings] = useState<MarketRotationSettings>({
        enabled: false,
        markets: ['R_10', 'R_25', 'R_50'],
        runsPerMarket: 5,
        currentMarketIndex: 0,
        runsCompleted: 0,
    });

    const [isRunning, setIsRunning] = useState(false);
    const [botRunCount, setBotRunCount] = useState(0);

    // Load settings from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('market_rotation_settings');
        if (saved) {
            try {
                setSettings(JSON.parse(saved));
            } catch (error) {
                console.error('Error loading market rotation settings:', error);
            }
        }
    }, []);

    // Save settings to localStorage
    useEffect(() => {
        localStorage.setItem('market_rotation_settings', JSON.stringify(settings));
    }, [settings]);

    // Monitor bot runs
    useEffect(() => {
        const checkBotRuns = () => {
            // Check if bot completed a run by monitoring trade execution
            const trades = localStorage.getItem('recent_trades_count');
            if (trades) {
                const count = parseInt(trades);
                if (count > botRunCount) {
                    setBotRunCount(count);
                    handleBotRunCompleted();
                }
            }
        };

        const interval = setInterval(checkBotRuns, 1000);
        return () => clearInterval(interval);
    }, [botRunCount, settings]);

    const handleBotRunCompleted = () => {
        if (!settings.enabled || !isRunning) return;

        const newRunsCompleted = settings.runsCompleted + 1;
        console.log(`[MARKET ROTATION] Bot run completed: ${newRunsCompleted}/${settings.runsPerMarket}`);

        if (newRunsCompleted >= settings.runsPerMarket) {
            // Time to switch market
            switchToNextMarket();
        } else {
            // Update runs completed
            setSettings(prev => ({
                ...prev,
                runsCompleted: newRunsCompleted
            }));
        }
    };

    const switchToNextMarket = () => {
        const nextIndex = (settings.currentMarketIndex + 1) % settings.markets.length;
        const nextMarket = settings.markets[nextIndex];

        console.log(`[MARKET ROTATION] Switching from ${settings.markets[settings.currentMarketIndex]} to ${nextMarket}`);

        // Stop current bot
        const stopButton = document.getElementById('db-animation__stop-button');
        if (stopButton && !stopButton.hasAttribute('disabled')) {
            stopButton.click();
            console.log('[MARKET ROTATION] Bot stopped');
        }

        // Wait for bot to stop, then switch market
        setTimeout(() => {
            // Update market in market analyzer
            marketAnalyzer.updateSymbol(nextMarket);
            console.log(`[MARKET ROTATION] Market switched to ${nextMarket}`);

            // Update settings
            setSettings(prev => ({
                ...prev,
                currentMarketIndex: nextIndex,
                runsCompleted: 0
            }));

            // Restart bot
            setTimeout(() => {
                const runButton = document.getElementById('db-animation__run-button');
                if (runButton && !runButton.hasAttribute('disabled')) {
                    runButton.click();
                    console.log('[MARKET ROTATION] Bot restarted on new market');
                }
            }, 1000);
        }, 1500);
    };

    const handleToggleRotation = () => {
        if (!settings.enabled) {
            // Starting rotation
            setIsRunning(true);
            setSettings(prev => ({
                ...prev,
                enabled: true,
                currentMarketIndex: 0,
                runsCompleted: 0
            }));
            console.log('[MARKET ROTATION] Market rotation enabled');
        } else {
            // Stopping rotation
            setIsRunning(false);
            setSettings(prev => ({
                ...prev,
                enabled: false
            }));
            console.log('[MARKET ROTATION] Market rotation disabled');
        }
    };

    const handleAddMarket = (market: string) => {
        if (!settings.markets.includes(market)) {
            setSettings(prev => ({
                ...prev,
                markets: [...prev.markets, market]
            }));
        }
    };

    const handleRemoveMarket = (index: number) => {
        setSettings(prev => ({
            ...prev,
            markets: prev.markets.filter((_, i) => i !== index)
        }));
    };

    const handleRunsPerMarketChange = (runs: number) => {
        setSettings(prev => ({
            ...prev,
            runsPerMarket: Math.max(1, runs)
        }));
    };

    const currentMarket = settings.markets[settings.currentMarketIndex];
    const progress = (settings.runsCompleted / settings.runsPerMarket) * 100;

    return (
        <div className='market-rotation-card'>
            <div className='card-header'>
                <h3 className='card-title'>
                    <SpinnerIcon size={20} />
                    Market Rotation
                </h3>
                <button
                    className={`toggle-btn ${settings.enabled ? 'active' : ''}`}
                    onClick={handleToggleRotation}
                    title={settings.enabled ? 'Disable market rotation' : 'Enable market rotation'}
                >
                    {settings.enabled ? <CheckIcon size={18} /> : <CrossIcon size={18} />}
                </button>
            </div>

            <div className='card-body'>
                {/* Current Status */}
                {settings.enabled && (
                    <div className='status-section'>
                        <div className='current-market'>
                            <span className='label'>Current Market:</span>
                            <span className='value'>{currentMarket}</span>
                        </div>
                        <div className='progress-section'>
                            <div className='progress-info'>
                                <span className='label'>Runs Completed:</span>
                                <span className='value'>{settings.runsCompleted}/{settings.runsPerMarket}</span>
                            </div>
                            <div className='progress-bar'>
                                <div className='progress-fill' style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Settings */}
                <div className='settings-section'>
                    <div className='setting-group'>
                        <label className='setting-label'>Runs Per Market</label>
                        <div className='input-group'>
                            <button
                                className='btn-minus'
                                onClick={() => handleRunsPerMarketChange(settings.runsPerMarket - 1)}
                            >
                                −
                            </button>
                            <input
                                type='number'
                                className='setting-input'
                                value={settings.runsPerMarket}
                                onChange={(e) => handleRunsPerMarketChange(parseInt(e.target.value) || 1)}
                                min='1'
                            />
                            <button
                                className='btn-plus'
                                onClick={() => handleRunsPerMarketChange(settings.runsPerMarket + 1)}
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>

                {/* Market Selection */}
                <div className='markets-section'>
                    <h4 className='section-title'>Markets to Rotate</h4>
                    <div className='selected-markets'>
                        {settings.markets.map((market, index) => (
                            <div
                                key={market}
                                className={`market-badge ${market === currentMarket ? 'active' : ''}`}
                            >
                                <span className='market-name'>{market}</span>
                                {settings.markets.length > 1 && (
                                    <button
                                        className='remove-btn'
                                        onClick={() => handleRemoveMarket(index)}
                                        title='Remove market'
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className='available-markets'>
                        <label className='label'>Add Markets:</label>
                        <div className='market-grid'>
                            {VOLATILITY_MARKETS.map(market => (
                                !settings.markets.includes(market) && (
                                    <button
                                        key={market}
                                        className='market-btn'
                                        onClick={() => handleAddMarket(market)}
                                        title={`Add ${market} to rotation`}
                                    >
                                        + {market}
                                    </button>
                                )
                            ))}
                        </div>
                    </div>
                </div>

                {/* Info */}
                <div className='info-section'>
                    <p className='info-text'>
                        🔄 The system will automatically switch markets after completing the specified number of runs on each market.
                        The bot will be stopped, the market will be changed, and the bot will be restarted.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MarketRotationCard;
