import React, { useState } from 'react';
import { RiskManagementConfig,signalTradingService } from '@/services/signal-trading.service';
import './RiskManagementSettings.scss';

export const RiskManagementSettings: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [config, setConfig] = useState<RiskManagementConfig>(signalTradingService.getRiskConfig());

    const handleSave = () => {
        signalTradingService.setRiskConfig(config);
        alert('Risk management settings saved!');
        onClose();
    };

    const handleChange = (key: keyof RiskManagementConfig, value: number | boolean) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className='risk-settings-overlay'>
            <div className='risk-settings'>
                <div className='settings-header'>
                    <h2>⚠️ Risk Management</h2>
                    <button className='close-btn' onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className='settings-content'>
                    <div className='setting-item'>
                        <label className='setting-label'>
                            <input
                                type='checkbox'
                                checked={config.enabled}
                                onChange={e => handleChange('enabled', e.target.checked)}
                            />
                            <span>Enable Risk Management</span>
                        </label>
                        <p className='setting-description'>Automatically stop trading when limits are reached</p>
                    </div>

                    <div className='setting-item'>
                        <label className='setting-label'>Max Trades Per Hour</label>
                        <input
                            type='number'
                            min='1'
                            max='100'
                            value={config.maxTradesPerHour}
                            onChange={e => handleChange('maxTradesPerHour', parseInt(e.target.value))}
                            disabled={!config.enabled}
                        />
                        <p className='setting-description'>Maximum number of trades allowed per hour</p>
                    </div>

                    <div className='setting-item'>
                        <label className='setting-label'>Max Trades Per Day</label>
                        <input
                            type='number'
                            min='1'
                            max='500'
                            value={config.maxTradesPerDay}
                            onChange={e => handleChange('maxTradesPerDay', parseInt(e.target.value))}
                            disabled={!config.enabled}
                        />
                        <p className='setting-description'>Maximum number of trades allowed per day</p>
                    </div>

                    <div className='setting-item'>
                        <label className='setting-label'>Max Daily Loss (USD)</label>
                        <input
                            type='number'
                            min='1'
                            max='10000'
                            value={config.maxDailyLoss}
                            onChange={e => handleChange('maxDailyLoss', parseInt(e.target.value))}
                            disabled={!config.enabled}
                        />
                        <p className='setting-description'>Stop trading if daily loss reaches this amount</p>
                    </div>

                    <div className='setting-item'>
                        <label className='setting-label'>Daily Profit Target (USD)</label>
                        <input
                            type='number'
                            min='1'
                            max='10000'
                            value={config.maxDailyProfit}
                            onChange={e => handleChange('maxDailyProfit', parseInt(e.target.value))}
                            disabled={!config.enabled}
                        />
                        <p className='setting-description'>Stop trading when daily profit target is reached</p>
                    </div>

                    <div className='setting-item'>
                        <label className='setting-label'>Stop on Loss Streak</label>
                        <input
                            type='number'
                            min='1'
                            max='20'
                            value={config.stopOnLossStreak}
                            onChange={e => handleChange('stopOnLossStreak', parseInt(e.target.value))}
                            disabled={!config.enabled}
                        />
                        <p className='setting-description'>Stop trading after this many consecutive losses</p>
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
