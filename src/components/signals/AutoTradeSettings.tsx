import React, { useState } from 'react';
import { AutoTradeConfig, signalTradingService } from '@/services/signal-trading.service';
import './AutoTradeSettings.scss';

export const AutoTradeSettings: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [config, setConfig] = useState<AutoTradeConfig>(signalTradingService.getAutoTradeConfig());

    const handleSave = () => {
        // Validate settings
        if (config.enabled) {
            // Validate stake
            if (!config.stake || config.stake <= 0 || isNaN(config.stake)) {
                alert('❌ Invalid stake amount! Please enter a valid stake greater than 0.');
                return;
            }
            if (config.stake < 0.35) {
                alert('❌ Stake too low! Minimum stake is $0.35.');
                return;
            }

            // Validate markets and types
            if (config.allowedMarkets.length === 0) {
                alert('❌ Please select at least one market!');
                return;
            }
            if (config.allowedTypes.length === 0) {
                alert('❌ Please select at least one signal type!');
                return;
            }

            // Validate adaptive stake settings
            if (config.adaptiveStake) {
                if (!config.minStake || config.minStake < 0.35) {
                    alert('❌ Min stake must be at least $0.35!');
                    return;
                }
                if (!config.maxStake || config.maxStake < config.minStake) {
                    alert('❌ Max stake must be greater than min stake!');
                    return;
                }
            }

            // Validate advanced options
            if (config.numberOfRuns < 1 || config.numberOfRuns > 10) {
                alert('❌ Number of runs must be between 1 and 10!');
                return;
            }
            if (config.useMartingale && (config.martingaleMultiplier < 1.1 || config.martingaleMultiplier > 5)) {
                alert('❌ Martingale multiplier must be between 1.1 and 5!');
                return;
            }
            if (config.pauseDuringLosses && (config.pauseAfterLosses < 1 || config.pauseAfterLosses > 10)) {
                alert('❌ Pause after losses must be between 1 and 10!');
                return;
            }
        }

        signalTradingService.setAutoTradeConfig(config);

        const message = config.enabled
            ? `✅ Auto-trade enabled!\n\n` +
              `Smart Mode: ${config.smartMode ? 'ON' : 'OFF'}\n` +
              `Adaptive Stake: ${config.adaptiveStake ? 'ON' : 'OFF'}\n` +
              `Base Stake: $${config.stake}\n` +
              `Markets: ${config.allowedMarkets.length}\n` +
              `Signal Types: ${config.allowedTypes.length}`
            : '⏸️ Auto-trade disabled!';

        alert(message);
        onClose();
    };

    const handleChange = (key: keyof AutoTradeConfig, value: string | number | string[] | boolean) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const toggleMarket = (market: string) => {
        const markets = config.allowedMarkets.includes(market)
            ? config.allowedMarkets.filter(m => m !== market)
            : [...config.allowedMarkets, market];
        handleChange('allowedMarkets', markets);
    };

    const toggleType = (type: string) => {
        const types = config.allowedTypes.includes(type)
            ? config.allowedTypes.filter(t => t !== type)
            : [...config.allowedTypes, type];
        handleChange('allowedTypes', types);
    };

    const allMarkets = ['R_10', 'R_25', 'R_50', 'R_75', 'R_100', '1HZ10V', '1HZ25V', '1HZ50V', '1HZ75V', '1HZ100V'];
    const allTypes = [
        'RISE',
        'FALL',
        'EVEN',
        'ODD',
        'OVER1',
        'OVER2',
        'OVER3',
        'OVER4',
        'OVER5',
        'OVER6',
        'OVER7',
        'OVER8',
        'UNDER1',
        'UNDER2',
        'UNDER3',
        'UNDER4',
        'UNDER5',
        'UNDER6',
        'UNDER7',
        'UNDER8',
    ];

    return (
        <div className='auto-trade-settings-overlay'>
            <div className='auto-trade-settings'>
                <div className='settings-header'>
                    <h2>🤖 Auto-Trade Settings</h2>
                    <button className='close-btn' onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className='settings-content'>
                    <div className='setting-item'>
                        <label className='setting-label'>Enable Auto-Trade</label>
                        <button
                            className={`toggle-button ${config.enabled ? 'active' : ''}`}
                            onClick={() => handleChange('enabled', !config.enabled)}
                        >
                            <span className='toggle-slider' />
                            <span className='toggle-text'>{config.enabled ? 'ON' : 'OFF'}</span>
                        </button>
                        <p className='setting-description'>Automatically trade signals that match your criteria</p>
                    </div>

                    <div className='setting-item'>
                        <label className='setting-label'>Minimum Confidence</label>
                        <select
                            value={config.minConfidence}
                            onChange={e => handleChange('minConfidence', e.target.value)}
                        >
                            <option value='LOW'>Low</option>
                            <option value='MEDIUM'>Medium</option>
                            <option value='HIGH'>High</option>
                        </select>
                        <p className='setting-description'>Only trade signals with this confidence or higher</p>
                    </div>

                    <div className='setting-item'>
                        <label className='setting-label'>
                            <input
                                type='checkbox'
                                checked={config.smartMode}
                                onChange={e => handleChange('smartMode', e.target.checked)}
                            />
                            <span>🧠 Smart Mode (AI-Optimized)</span>
                        </label>
                        <p className='setting-description'>
                            Learn from your trades and only trade profitable signal types/markets
                        </p>
                    </div>

                    <div className='setting-item'>
                        <label className='setting-label'>
                            <input
                                type='checkbox'
                                checked={config.adaptiveStake}
                                onChange={e => handleChange('adaptiveStake', e.target.checked)}
                            />
                            <span>📊 Adaptive Stake</span>
                        </label>
                        <p className='setting-description'>Automatically adjust stake based on win/loss streaks</p>
                    </div>

                    <div className='setting-item'>
                        <label className='setting-label'>Auto-Trade Stake (USD)</label>
                        <input
                            type='number'
                            min='0.35'
                            step='0.1'
                            value={config.stake || 1}
                            onChange={e => {
                                const value = parseFloat(e.target.value);
                                handleChange('stake', isNaN(value) || value <= 0 ? 1 : value);
                            }}
                            onBlur={e => {
                                const value = parseFloat(e.target.value);
                                if (isNaN(value) || value < 0.35) {
                                    handleChange('stake', 0.35);
                                    alert('⚠️ Minimum stake is $0.35. Value has been adjusted.');
                                }
                            }}
                        />
                        <p className='setting-description'>
                            Base stake amount {config.adaptiveStake && '(will adjust based on performance)'}
                        </p>
                    </div>

                    {config.adaptiveStake && (
                        <>
                            <div className='setting-item'>
                                <label className='setting-label'>Min Stake (USD)</label>
                                <input
                                    type='number'
                                    min='0.35'
                                    step='0.1'
                                    value={config.minStake || 0.35}
                                    onChange={e => {
                                        const value = parseFloat(e.target.value);
                                        handleChange('minStake', isNaN(value) || value < 0.35 ? 0.35 : value);
                                    }}
                                />
                            </div>

                            <div className='setting-item'>
                                <label className='setting-label'>Max Stake (USD)</label>
                                <input
                                    type='number'
                                    min='0.35'
                                    step='0.5'
                                    value={config.maxStake || 10}
                                    onChange={e => {
                                        const value = parseFloat(e.target.value);
                                        handleChange('maxStake', isNaN(value) || value < 0.35 ? 10 : value);
                                    }}
                                />
                            </div>
                        </>
                    )}

                    <div className='setting-item'>
                        <label className='setting-label'>
                            <input
                                type='checkbox'
                                checked={config.pauseDuringLosses}
                                onChange={e => handleChange('pauseDuringLosses', e.target.checked)}
                            />
                            <span>⏸️ Pause During Loss Streaks</span>
                        </label>
                        <p className='setting-description'>Automatically pause after consecutive losses</p>
                    </div>

                    {config.pauseDuringLosses && (
                        <div className='setting-item'>
                            <label className='setting-label'>Pause After (Losses)</label>
                            <input
                                type='number'
                                min='1'
                                max='10'
                                value={config.pauseAfterLosses || 3}
                                onChange={e => {
                                    const value = parseInt(e.target.value);
                                    handleChange('pauseAfterLosses', isNaN(value) || value < 1 ? 3 : value);
                                }}
                            />
                            <p className='setting-description'>Number of consecutive losses before pausing (1-10)</p>
                        </div>
                    )}

                    {/* Advanced Trading Options */}
                    <div className='section-divider'>
                        <h3>🎯 Advanced Trading Options</h3>
                    </div>

                    <div className='setting-item'>
                        <label className='setting-label'>
                            <input
                                type='checkbox'
                                checked={config.quickTradeMode}
                                onChange={e => handleChange('quickTradeMode', e.target.checked)}
                            />
                            <span>⚡ Quick Trade Mode (1-Tick)</span>
                        </label>
                        <p className='setting-description'>Execute trades with 1-tick duration for instant results</p>
                    </div>

                    {!config.quickTradeMode && (
                        <div className='setting-item'>
                            <label className='setting-label'>Trade Duration (Ticks)</label>
                            <input
                                type='number'
                                min='1'
                                max='10'
                                value={config.tradeDuration || 5}
                                onChange={e => {
                                    const value = parseInt(e.target.value);
                                    handleChange('tradeDuration', isNaN(value) || value < 1 ? 5 : value);
                                }}
                            />
                            <p className='setting-description'>How many ticks each trade lasts (1-10 ticks)</p>
                        </div>
                    )}

                    <div className='setting-item'>
                        <label className='setting-label'>Number of Runs per Signal</label>
                        <input
                            type='number'
                            min='1'
                            max='10'
                            value={config.numberOfRuns || 1}
                            onChange={e => {
                                const value = parseInt(e.target.value);
                                handleChange('numberOfRuns', isNaN(value) || value < 1 ? 1 : value);
                            }}
                        />
                        <p className='setting-description'>How many times to trade each signal (1-10)</p>
                    </div>

                    <div className='setting-item'>
                        <label className='setting-label'>
                            <input
                                type='checkbox'
                                checked={config.useMartingale}
                                onChange={e => handleChange('useMartingale', e.target.checked)}
                            />
                            <span>📈 Use Martingale</span>
                        </label>
                        <p className='setting-description'>Double stake after each loss, reset on win</p>
                    </div>

                    {config.useMartingale && (
                        <div className='setting-item'>
                            <label className='setting-label'>Martingale Multiplier</label>
                            <input
                                type='number'
                                min='1.1'
                                max='5'
                                step='0.1'
                                value={config.martingaleMultiplier || 2}
                                onChange={e => {
                                    const value = parseFloat(e.target.value);
                                    handleChange('martingaleMultiplier', isNaN(value) || value < 1.1 ? 2 : value);
                                }}
                            />
                            <p className='setting-description'>Multiply stake by this amount after loss (1.1-5x)</p>
                        </div>
                    )}

                    <div className='setting-item'>
                        <label className='setting-label'>Take Profit (USD)</label>
                        <input
                            type='number'
                            min='0'
                            step='1'
                            value={config.takeProfit || 0}
                            onChange={e => {
                                const value = parseFloat(e.target.value);
                                handleChange('takeProfit', isNaN(value) || value < 0 ? 0 : value);
                            }}
                        />
                        <p className='setting-description'>Stop runs when profit reaches this amount (0 = disabled)</p>
                    </div>

                    <div className='setting-item'>
                        <label className='setting-label'>Stop Loss (USD)</label>
                        <input
                            type='number'
                            min='0'
                            step='1'
                            value={config.stopLoss || 0}
                            onChange={e => {
                                const value = parseFloat(e.target.value);
                                handleChange('stopLoss', isNaN(value) || value < 0 ? 0 : value);
                            }}
                        />
                        <p className='setting-description'>Stop runs when loss reaches this amount (0 = disabled)</p>
                    </div>

                    <div className='setting-item'>
                        <label className='setting-label'>Allowed Markets</label>
                        <div className='button-grid'>
                            {allMarkets.map(market => (
                                <button
                                    key={market}
                                    className={`selection-button ${config.allowedMarkets.includes(market) ? 'selected' : ''}`}
                                    onClick={() => toggleMarket(market)}
                                >
                                    {config.allowedMarkets.includes(market) && '✓ '}
                                    {market}
                                </button>
                            ))}
                        </div>
                        <p className='setting-description'>Select which markets to auto-trade</p>
                    </div>

                    <div className='setting-item'>
                        <label className='setting-label'>Allowed Signal Types</label>
                        <div className='button-grid'>
                            {allTypes.map(type => (
                                <button
                                    key={type}
                                    className={`selection-button ${config.allowedTypes.includes(type) ? 'selected' : ''}`}
                                    onClick={() => toggleType(type)}
                                >
                                    {config.allowedTypes.includes(type) && '✓ '}
                                    {type}
                                </button>
                            ))}
                        </div>
                        <p className='setting-description'>Select which signal types to auto-trade</p>
                    </div>

                    <div className='settings-actions'>
                        <button className='cancel-btn' onClick={onClose}>
                            Cancel
                        </button>
                        <button className='save-btn' onClick={handleSave}>
                            Save Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
