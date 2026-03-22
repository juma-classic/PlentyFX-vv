import React, { useState } from 'react';
import { SpeedBotConfig } from '@/services/speed-bot.service';
import './SpeedBotSettings.scss';

interface SpeedBotSettingsProps {
    config: SpeedBotConfig;
    onSave: (config: SpeedBotConfig) => void;
    onClose: () => void;
}

export const SpeedBotSettings: React.FC<SpeedBotSettingsProps> = ({ config: initialConfig, onSave, onClose }) => {
    const [config, setConfig] = useState<SpeedBotConfig>(initialConfig);

    const handleChange = (key: keyof SpeedBotConfig, value: string | number | boolean) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        onSave(config);
        onClose();
    };

    return (
        <div className='speed-bot-settings-overlay'>
            <div className='speed-bot-settings'>
                <div className='settings-header'>
                    <h2>⚙️ Speed Bot Settings</h2>
                    <button className='close-btn' onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className='settings-content'>
                    {/* Auto-Stop Features */}
                    <div className='section-divider'>
                        <h3>🛑 Auto-Stop Features</h3>
                    </div>

                    <div className='setting-item'>
                        <label className='setting-label'>Stop After Wins</label>
                        <input
                            type='number'
                            min='0'
                            value={config.stopAfterWins || 0}
                            onChange={e => handleChange('stopAfterWins', parseInt(e.target.value) || 0)}
                            placeholder='0 = disabled'
                        />
                        <p className='setting-description'>Stop after X consecutive wins (0 = disabled)</p>
                    </div>

                    <div className='setting-item'>
                        <label className='setting-label'>Stop After Losses</label>
                        <input
                            type='number'
                            min='0'
                            value={config.stopAfterLosses || 0}
                            onChange={e => handleChange('stopAfterLosses', parseInt(e.target.value) || 0)}
                            placeholder='0 = disabled'
                        />
                        <p className='setting-description'>Stop after X consecutive losses (0 = disabled)</p>
                    </div>

                    <div className='setting-item'>
                        <label className='setting-label'>Target Profit ($)</label>
                        <input
                            type='number'
                            min='0'
                            step='0.1'
                            value={config.targetProfit || 0}
                            onChange={e => handleChange('targetProfit', parseFloat(e.target.value) || 0)}
                            placeholder='0 = disabled'
                        />
                        <p className='setting-description'>Stop when profit reaches this amount (0 = disabled)</p>
                    </div>

                    <div className='setting-item'>
                        <label className='setting-label'>Max Loss ($)</label>
                        <input
                            type='number'
                            min='0'
                            step='0.1'
                            value={config.maxLoss || 0}
                            onChange={e => handleChange('maxLoss', parseFloat(e.target.value) || 0)}
                            placeholder='0 = disabled'
                        />
                        <p className='setting-description'>Stop when loss reaches this amount (0 = disabled)</p>
                    </div>

                    <div className='setting-item'>
                        <label className='setting-label'>Max Run Time (minutes)</label>
                        <input
                            type='number'
                            min='0'
                            value={config.maxRunTime || 0}
                            onChange={e => handleChange('maxRunTime', parseInt(e.target.value) || 0)}
                            placeholder='0 = disabled'
                        />
                        <p className='setting-description'>Stop after X minutes (0 = disabled)</p>
                    </div>

                    <div className='setting-item'>
                        <label className='setting-label'>Max Martingale Level</label>
                        <input
                            type='number'
                            min='1'
                            max='10'
                            value={config.maxMartingaleLevel || 10}
                            onChange={e => handleChange('maxMartingaleLevel', parseInt(e.target.value) || 10)}
                        />
                        <p className='setting-description'>Maximum times to multiply stake (1-10)</p>
                    </div>

                    {/* Smart Features */}
                    <div className='section-divider'>
                        <h3>🧠 Smart Features</h3>
                    </div>

                    <div className='setting-item'>
                        <label className='setting-label'>
                            <input
                                type='checkbox'
                                checked={config.autoSwitchToHot || false}
                                onChange={e => handleChange('autoSwitchToHot', e.target.checked)}
                            />
                            <span>🔥 Auto-Switch to Hot Digits</span>
                        </label>
                        <p className='setting-description'>Automatically switch prediction to most frequent digits</p>
                    </div>

                    <div className='setting-item'>
                        <label className='setting-label'>
                            <input
                                type='checkbox'
                                checked={config.followTrend || false}
                                onChange={e => handleChange('followTrend', e.target.checked)}
                            />
                            <span>📈 Follow Trend</span>
                        </label>
                        <p className='setting-description'>Adjust strategy based on digit trends</p>
                    </div>

                    {/* Alerts */}
                    <div className='section-divider'>
                        <h3>🔔 Alerts & Notifications</h3>
                    </div>

                    <div className='setting-item'>
                        <label className='setting-label'>
                            <input
                                type='checkbox'
                                checked={config.enableSoundAlerts || false}
                                onChange={e => handleChange('enableSoundAlerts', e.target.checked)}
                            />
                            <span>🔊 Sound Alerts</span>
                        </label>
                        <p className='setting-description'>Play sound on win/loss</p>
                    </div>

                    <div className='setting-item'>
                        <label className='setting-label'>
                            <input
                                type='checkbox'
                                checked={config.enableNotifications || false}
                                onChange={e => handleChange('enableNotifications', e.target.checked)}
                            />
                            <span>📬 Desktop Notifications</span>
                        </label>
                        <p className='setting-description'>Show desktop notifications for important events</p>
                    </div>

                    {/* Strategy Selection */}
                    <div className='section-divider'>
                        <h3>🎯 Trading Strategy</h3>
                    </div>

                    <div className='setting-item'>
                        <label className='setting-label'>Strategy Type</label>
                        <select value={config.strategy} onChange={e => handleChange('strategy', e.target.value)}>
                            <option value='Over'>Over - Digit above prediction</option>
                            <option value='Under'>Under - Digit below prediction</option>
                            <option value='Even'>Even - Even digits only</option>
                            <option value='Odd'>Odd - Odd digits only</option>
                            <option value='Match'>Match - Exact digit match</option>
                            <option value='Range'>Range - Digit in range</option>
                        </select>
                        <p className='setting-description'>Choose your trading strategy</p>
                    </div>
                </div>

                <div className='settings-footer'>
                    <button className='btn-secondary' onClick={onClose}>
                        Cancel
                    </button>
                    <button className='btn-primary' onClick={handleSave}>
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
};
